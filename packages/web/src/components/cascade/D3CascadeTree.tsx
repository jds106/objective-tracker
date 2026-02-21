import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import 'd3-transition'; // Extends d3-selection with .transition()
import { AnimatePresence } from 'framer-motion';
import type { CascadeNode } from '../../services/cascade.api.js';
import { TreeNodeCard } from './TreeNodeCard.js';
import { TreeLink } from './TreeLink.js';
import { ZoomControls } from './ZoomControls.js';

interface D3CascadeTreeProps {
  nodes: CascadeNode[];
}

const NODE_WIDTH = 280;
const NODE_HEIGHT = 100;
const H_GAP = 48;
const V_GAP = 72;

interface FlatNode {
  id: string;
  cascadeNode: CascadeNode;
  x: number;
  y: number;
  depth: number;
  parentId: string | null;
}

interface FlatLink {
  sourceId: string;
  targetId: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

/** Collect IDs at the first two levels (depth 0 and 1) of the cascade tree */
function collectDefaultExpandedIds(roots: CascadeNode[]): Set<string> {
  const set = new Set<string>();
  for (const node of roots) {
    set.add(node.objective.id);
    for (const child of node.children) {
      set.add(child.objective.id);
    }
  }
  return set;
}

export function D3CascadeTree({ nodes }: D3CascadeTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() =>
    collectDefaultExpandedIds(nodes),
  );

  // Track nodes the user has manually collapsed so we don't re-expand them
  const manuallyCollapsedRef = useRef<Set<string>>(new Set());

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomInitialisedRef = useRef(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // BUG-021: When nodes prop changes, add new node IDs to expanded set
  // (for the first two levels) while preserving manually collapsed state.
  useEffect(() => {
    const defaultIds = collectDefaultExpandedIds(nodes);
    setExpandedNodes(prev => {
      const next = new Set(prev);
      for (const id of defaultIds) {
        // Only auto-expand if the user hasn't manually collapsed this node
        if (!prev.has(id) && !manuallyCollapsedRef.current.has(id)) {
          next.add(id);
        }
      }
      return next;
    });
  }, [nodes]);

  const toggleNode = useCallback((id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        manuallyCollapsedRef.current.add(id);
      } else {
        next.add(id);
        manuallyCollapsedRef.current.delete(id);
      }
      return next;
    });
  }, []);

  // Build hierarchy respecting expanded state
  const { flatNodes, flatLinks } = useMemo(() => {
    if (nodes.length === 0) return { flatNodes: [] as FlatNode[], flatLinks: [] as FlatLink[] };

    // Create virtual root
    interface HierarchyData {
      id: string;
      cascadeNode: CascadeNode | null;
      children: HierarchyData[];
    }

    function buildHierarchyData(node: CascadeNode): HierarchyData {
      const isExpanded = expandedNodes.has(node.objective.id);
      return {
        id: node.objective.id,
        cascadeNode: node,
        children: isExpanded
          ? node.children.map(buildHierarchyData)
          : [],
      };
    }

    const virtualRoot: HierarchyData = {
      id: '__root__',
      cascadeNode: null,
      children: nodes.map(buildHierarchyData),
    };

    const root = hierarchy(virtualRoot);
    const treeLayout = tree<HierarchyData>().nodeSize([NODE_WIDTH + H_GAP, NODE_HEIGHT + V_GAP]);
    treeLayout(root);

    const flatNodesResult: FlatNode[] = [];
    const flatLinksResult: FlatLink[] = [];

    root.descendants().forEach(d => {
      if (d.data.id === '__root__' || !d.data.cascadeNode) return;
      flatNodesResult.push({
        id: d.data.id,
        cascadeNode: d.data.cascadeNode,
        x: d.x!,
        y: d.y! - (NODE_HEIGHT + V_GAP), // Offset to remove virtual root gap
        depth: d.depth - 1, // Subtract 1 because virtual root is depth 0
        parentId: d.parent?.data.id === '__root__' ? null : (d.parent?.data.id ?? null),
      });
    });

    // Build links
    root.links().forEach(link => {
      if (link.source.data.id === '__root__') return;
      flatLinksResult.push({
        sourceId: link.source.data.id,
        targetId: link.target.data.id,
        sourceX: link.source.x!,
        sourceY: link.source.y! - (NODE_HEIGHT + V_GAP),
        targetX: link.target.x!,
        targetY: link.target.y! - (NODE_HEIGHT + V_GAP),
      });
    });

    return { flatNodes: flatNodesResult, flatLinks: flatLinksResult };
  }, [nodes, expandedNodes]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // BUG-022: Set up zoom behaviour once on mount — not on every resize.
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 2])
      .on('zoom', (event) => {
        g.setAttribute('transform', event.transform.toString());
      });

    zoomRef.current = zoomBehavior;
    select(svg).call(zoomBehavior);

    return () => {
      select(svg).on('.zoom', null);
    };
  }, []);

  // Set initial transform once when container size is first known
  useEffect(() => {
    if (zoomInitialisedRef.current) return;
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    if (!svg || !zoomBehavior || containerSize.width <= 0) return;

    const initialTransform = zoomIdentity.translate(containerSize.width / 2, 50);
    select(svg).call(zoomBehavior.transform, initialTransform);
    zoomInitialisedRef.current = true;
  }, [containerSize.width]);

  const handleZoomIn = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    if (!svg || !zoomBehavior) return;
    select(svg).transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    if (!svg || !zoomBehavior) return;
    select(svg).transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
  }, []);

  const handleReset = useCallback(() => {
    const svg = svgRef.current;
    const zoomBehavior = zoomRef.current;
    if (!svg || !zoomBehavior) return;
    const resetTransform = zoomIdentity.translate(containerSize.width / 2, 50);
    select(svg).transition().duration(500).call(zoomBehavior.transform, resetTransform);
  }, [containerSize.width]);

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        No objectives found in your cascade view.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px] rounded-xl bg-surface border border-slate-700/60 overflow-hidden">
      <svg
        ref={svgRef}
        width={containerSize.width}
        height={containerSize.height}
        className="w-full h-full"
      >
        {/* Dot-grid canvas background for spatial orientation */}
        <defs>
          <pattern id="cascade-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.75" fill="#334155" fillOpacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cascade-grid)" />

        <g ref={gRef}>
          <AnimatePresence>
            {flatLinks.map(link => (
              <TreeLink
                key={`${link.sourceId}-${link.targetId}`}
                sourceX={link.sourceX}
                sourceY={link.sourceY}
                targetX={link.targetX}
                targetY={link.targetY}
                nodeHeight={NODE_HEIGHT}
              />
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {flatNodes.map(fn => (
              <TreeNodeCard
                key={fn.id}
                node={fn.cascadeNode}
                x={fn.x}
                y={fn.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                depth={fn.depth}
                childCount={fn.cascadeNode.children.length}
                isExpanded={expandedNodes.has(fn.id)}
                onToggle={() => toggleNode(fn.id)}
              />
            ))}
          </AnimatePresence>
        </g>
      </svg>
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} />
    </div>
  );
}
