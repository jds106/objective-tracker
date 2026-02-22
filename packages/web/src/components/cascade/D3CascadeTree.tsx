import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
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
  targetDepth: number;
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

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomTargetRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

  // Build hierarchy respecting expanded state, then pre-centre coordinates
  // in the container so foreignObject content is at positive screen positions.
  // This avoids relying on SVG <g> transforms or viewBox, which Safari doesn't
  // reliably apply to foreignObject children.
  const { flatNodes, flatLinks, svgWidth, svgHeight } = useMemo(() => {
    if (nodes.length === 0 || containerSize.width <= 0 || containerSize.height <= 0) {
      return { flatNodes: [] as FlatNode[], flatLinks: [] as FlatLink[], svgWidth: 0, svgHeight: 0 };
    }

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
        targetDepth: link.target.depth - 1, // Subtract 1 for virtual root
      });
    });

    // Pre-centre: shift all coordinates so the tree's bounding box is centred
    // in the container. This means foreignObject elements render at positive
    // screen coordinates — no SVG transform or viewBox needed.
    if (flatNodesResult.length > 0) {
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const n of flatNodesResult) {
        const left = n.x - NODE_WIDTH / 2;
        const right = n.x + NODE_WIDTH / 2;
        const top = n.y;
        const bottom = n.y + NODE_HEIGHT;
        if (left < minX) minX = left;
        if (right > maxX) maxX = right;
        if (top < minY) minY = top;
        if (bottom > maxY) maxY = bottom;
      }

      const treeWidth = maxX - minX;
      const treeHeight = maxY - minY;

      // Centre the tree in the container (never scale above 1:1 here)
      const offsetX = containerSize.width / 2 - (minX + maxX) / 2;
      const offsetY = containerSize.height / 2 - (minY + maxY) / 2;

      for (const n of flatNodesResult) {
        n.x += offsetX;
        n.y += offsetY;
      }
      for (const l of flatLinksResult) {
        l.sourceX += offsetX;
        l.sourceY += offsetY;
        l.targetX += offsetX;
        l.targetY += offsetY;
      }

      // SVG canvas size — at least as large as the container, but also
      // large enough to hold the entire tree with padding
      const padding = 200;
      const w = Math.max(containerSize.width, treeWidth + padding * 2);
      const h = Math.max(containerSize.height, treeHeight + padding * 2);
      return { flatNodes: flatNodesResult, flatLinks: flatLinksResult, svgWidth: w, svgHeight: h };
    }

    return { flatNodes: flatNodesResult, flatLinks: flatLinksResult, svgWidth: containerSize.width, svgHeight: containerSize.height };
  }, [nodes, expandedNodes, containerSize]);

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

  // Set up d3-zoom on the container div. The zoom handler applies a CSS
  // transform to an inner wrapper div — CSS transforms on HTML elements work
  // reliably across all browsers including Safari with foreignObject.
  useLayoutEffect(() => {
    const container = containerRef.current;
    const target = zoomTargetRef.current;
    if (!container || !target) return;

    const zoomBehavior = zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.15, 2])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform;
        target.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
        target.style.transformOrigin = '0 0';
      });

    zoomRef.current = zoomBehavior;
    select(container).call(zoomBehavior);

    return () => {
      select(container).on('.zoom', null);
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    const container = containerRef.current;
    const zoomBehavior = zoomRef.current;
    if (!container || !zoomBehavior) return;
    select(container).transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    const container = containerRef.current;
    const zoomBehavior = zoomRef.current;
    if (!container || !zoomBehavior) return;
    select(container).transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
  }, []);

  const handleReset = useCallback(() => {
    const container = containerRef.current;
    const zoomBehavior = zoomRef.current;
    if (!container || !zoomBehavior) return;
    select(container).transition().duration(500).call(zoomBehavior.transform, zoomIdentity);
  }, []);

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-8 text-center">
        No objectives found in your cascade view.
      </p>
    );
  }

  const hasContent = flatNodes.length > 0 && containerSize.width > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] rounded-xl border border-slate-700/60 overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(51,65,85,0.5) 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px',
        backgroundColor: 'var(--color-surface, #0f172a)',
      }}
    >
      {/* Inner wrapper — d3-zoom applies CSS transform to this div */}
      <div ref={zoomTargetRef} style={{ width: svgWidth, height: svgHeight }}>
        <svg
          width={svgWidth || '100%'}
          height={svgHeight || '100%'}
          className="absolute top-0 left-0"
        >
          {hasContent && (
            <>
              <AnimatePresence>
                {flatLinks.map(link => (
                  <TreeLink
                    key={`${link.sourceId}-${link.targetId}`}
                    sourceX={link.sourceX}
                    sourceY={link.sourceY}
                    targetX={link.targetX}
                    targetY={link.targetY}
                    nodeHeight={NODE_HEIGHT}
                    depth={link.targetDepth}
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
            </>
          )}
        </svg>
      </div>
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleReset} />
    </div>
  );
}
