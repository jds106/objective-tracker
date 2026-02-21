import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { calculateObjectiveProgress, calculateHealthStatus } from '@objective-tracker/shared';
import type { Cycle } from '@objective-tracker/shared';
import type { CascadeNode } from '../../services/cascade.api.js';
import { ZoomControls } from './ZoomControls.js';

interface D3NetworkGraphProps {
  nodes: CascadeNode[];
  activeCycle?: Cycle | null;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  ownerName: string;
  ownerLevel: number;
  progress: number;
  health: string;
  status: string;
  depth: number;
  isCompany: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  sourceId: string;
  targetId: string;
}

/** Flatten a cascade tree into nodes + links for D3 force simulation */
function flattenTree(
  tree: CascadeNode[],
  activeCycle: Cycle | null | undefined,
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const seen = new Set<string>();

  function walk(node: CascadeNode, depth: number) {
    if (seen.has(node.objective.id)) return;
    seen.add(node.objective.id);

    const krs = node.objective.keyResults;
    const progress = calculateObjectiveProgress(krs.map(kr => kr.progress));
    const allCheckIns = krs.flatMap(kr => kr.checkIns);
    const health = calculateHealthStatus(progress, activeCycle ?? null, allCheckIns);

    nodes.push({
      id: node.objective.id,
      title: node.objective.title,
      ownerName: node.owner.displayName,
      ownerLevel: node.owner.level,
      progress,
      health,
      status: node.objective.status,
      depth,
      isCompany: node.objective.ownerId === 'company',
    });

    for (const child of node.children) {
      links.push({
        sourceId: node.objective.id,
        targetId: child.objective.id,
        source: node.objective.id,
        target: child.objective.id,
      });
      walk(child, depth + 1);
    }
  }

  for (const root of tree) {
    walk(root, 0);
  }

  return { nodes, links };
}

const HEALTH_COLOURS: Record<string, string> = {
  on_track: '#10b981',
  at_risk: '#f59e0b',
  behind: '#ef4444',
  not_started: '#64748b',
};

const DEPTH_RADIUS: Record<number, number> = {
  0: 32,
  1: 26,
  2: 22,
  3: 18,
};

export function D3NetworkGraph({ nodes: tree, activeCycle }: D3NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const { nodes: graphNodes, links: graphLinks } = useMemo(
    () => flattenTree(tree, activeCycle),
    [tree, activeCycle],
  );

  // Track container size
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const parent = svg.parentElement;
    if (!parent) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    observer.observe(parent);
    // Set initial size
    const rect = parent.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }

    return () => observer.disconnect();
  }, []);

  // Initialize zoom
  useEffect(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        d3.select(g).attr('transform', event.transform.toString());
      });

    d3.select(svg).call(zoom);
    zoomRef.current = zoom;

    return () => {
      d3.select(svg).on('.zoom', null);
    };
  }, []);

  // Run force simulation
  useEffect(() => {
    if (graphNodes.length === 0) return;

    // Deep copy nodes to avoid mutation issues
    const nodesCopy = graphNodes.map(n => ({ ...n }));
    const linksCopy = graphLinks.map(l => ({ ...l }));

    const simulation = d3.forceSimulation<GraphNode>(nodesCopy)
      .force('link', d3.forceLink<GraphNode, GraphLink>(linksCopy)
        .id(d => d.id)
        .distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => (DEPTH_RADIUS[d.depth] ?? 16) + 20))
      .force('y', d3.forceY<GraphNode>().y(d => d.depth * 140 + 80).strength(0.3));

    simulationRef.current = simulation;

    const g = d3.select(gRef.current);

    // Clear existing elements
    g.selectAll('.link').remove();
    g.selectAll('.node').remove();

    // Render links
    const link = g.selectAll('.link')
      .data(linksCopy)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', '#6366f1')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 1.5);

    // Render nodes
    const node = g.selectAll<SVGGElement, GraphNode>('.node')
      .data(nodesCopy, d => d.id)
      .join('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on('drag', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on('end', (event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }));

    // Node circle
    node.append('circle')
      .attr('r', d => DEPTH_RADIUS[d.depth] ?? 16)
      .attr('fill', '#1e293b')
      .attr('stroke', d => HEALTH_COLOURS[d.health] ?? '#64748b')
      .attr('stroke-width', 2.5);

    // Progress arc
    node.append('path')
      .attr('fill', 'none')
      .attr('stroke', d => HEALTH_COLOURS[d.health] ?? '#64748b')
      .attr('stroke-width', 3)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0.6)
      .attr('d', d => {
        const r = (DEPTH_RADIUS[d.depth] ?? 16) + 4;
        const angle = (d.progress / 100) * Math.PI * 2 - Math.PI / 2;
        const startAngle = -Math.PI / 2;
        if (d.progress === 0) return '';
        if (d.progress >= 100) {
          // Full circle
          return `M ${r * Math.cos(startAngle)} ${r * Math.sin(startAngle)} A ${r} ${r} 0 1 1 ${r * Math.cos(startAngle) - 0.01} ${r * Math.sin(startAngle)}`;
        }
        const largeArc = d.progress > 50 ? 1 : 0;
        return `M ${r * Math.cos(startAngle)} ${r * Math.sin(startAngle)} A ${r} ${r} 0 ${largeArc} 1 ${r * Math.cos(angle)} ${r * Math.sin(angle)}`;
      });

    // Node initial letter
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', d => HEALTH_COLOURS[d.health] ?? '#94a3b8')
      .attr('font-size', d => d.isCompany ? 14 : 11)
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text(d => d.isCompany ? '★' : d.ownerName.charAt(0).toUpperCase());

    // Label below node
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => (DEPTH_RADIUS[d.depth] ?? 16) + 14)
      .attr('fill', '#94a3b8')
      .attr('font-size', 9)
      .attr('pointer-events', 'none')
      .text(d => d.title.length > 25 ? d.title.slice(0, 22) + '…' : d.title);

    // Owner label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => (DEPTH_RADIUS[d.depth] ?? 16) + 24)
      .attr('fill', '#64748b')
      .attr('font-size', 8)
      .attr('pointer-events', 'none')
      .text(d => d.isCompany ? '' : d.ownerName);

    // Click to navigate
    node.on('click', (_event, d) => {
      navigate(`/objectives/${d.id}`);
    });

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as GraphNode).y ?? 0);

      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphNodes, graphLinks, dimensions, navigate]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    d3.select(svg).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    d3.select(svg).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
  }, []);

  const handleResetView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    d3.select(svg).transition().duration(500).call(
      zoomRef.current.transform,
      d3.zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2).scale(0.8).translate(-dimensions.width / 2, -dimensions.height / 2),
    );
  }, [dimensions]);

  if (graphNodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">No objectives to display. Create objectives to see the network graph.</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-xl bg-surface-raised border border-slate-700 overflow-hidden">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      >
        <g ref={gRef} />
      </svg>

      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
      />

      {/* Legend */}
      <div className="absolute top-3 left-3 rounded-lg bg-surface-raised/80 backdrop-blur-sm border border-slate-700 px-3 py-2">
        <p className="text-[10px] font-medium text-slate-400 mb-1">Health</p>
        <div className="flex items-center gap-3">
          {Object.entries(HEALTH_COLOURS).map(([key, colour]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colour }} />
              <span className="text-[10px] text-slate-500">{key.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
