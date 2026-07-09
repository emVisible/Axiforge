import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { NexusNote } from "@/services/api";
import { tagLastUpdated, tagRecencyOpacity } from "@/lib/orbitThemeSummary";

interface OrbitViewProps {
  notes: NexusNote[];
  activeTag?: string | null;
  onTagSelect?: (tag: string | null) => void;
}

interface OrbitNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  count: number;
  recencyOpacity: number;
}

export default function OrbitView({ notes, activeTag, onTagSelect }: OrbitViewProps) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const width = el.clientWidth || 640;
    const height = 420;

    const tagCounts = new Map<string, number>();
    for (const n of notes) {
      for (const t of n.tags ?? []) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
    }

    const nodes: OrbitNode[] = [...tagCounts.entries()].map(([tag, count]) => ({
      id: tag,
      label: tag,
      count,
      recencyOpacity: tagRecencyOpacity(tagLastUpdated(notes, tag)),
    }));

    const svg = d3.select(el);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    if (!nodes.length) return;

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#0b1020");

    const simulation = d3
      .forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-120))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => 12 + (d as OrbitNode).count * 6));

    const g = svg.append("g");

    const drag = d3
      .drag<SVGCircleElement, OrbitNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    const circles = g
      .selectAll<SVGCircleElement, OrbitNode>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => 10 + d.count * 5)
      .attr("fill", (d) => (d.id === activeTag ? "#f5d78e" : "#c4944a"))
      .attr("fill-opacity", (d) => {
        const base = d.id === activeTag ? 0.95 : d.recencyOpacity * 0.85;
        return Math.min(1, Math.max(0.25, base));
      })
      .attr("stroke", "#f5d78e")
      .attr("stroke-width", (d) => (d.id === activeTag ? 2 : 1))
      .attr("stroke-opacity", (d) => d.recencyOpacity)
      .style("cursor", onTagSelect ? "grab" : "default")
      .call(drag)
      .on("click", (_event, d) => {
        if (!onTagSelect) return;
        onTagSelect(activeTag === d.id ? null : d.id);
      });

    const labels = g
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.label)
      .attr("font-size", 10)
      .attr("fill", (d) => (d.id === activeTag ? "#fff8e7" : "#e8dfc8"))
      .attr("fill-opacity", (d) => d.recencyOpacity)
      .attr("text-anchor", "middle")
      .attr("dy", 4)
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      circles.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      labels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [notes, activeTag, onTagSelect]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1020] p-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-white/50">
          Orbit · 拖拽调整布局 · 点击筛选 · 亮度反映近期活跃度
        </p>
        {activeTag && onTagSelect && (
          <button
            type="button"
            onClick={() => onTagSelect(null)}
            className="text-[10px] text-[#f5d78e] hover:underline"
          >
            清除筛选 · #{activeTag}
          </button>
        )}
      </div>
      <svg ref={ref} className="h-[420px] w-full" />
      {!notes.some((n) => n.tags?.length) && (
        <p className="py-8 text-center text-sm text-white/40">为笔记添加标签后显示主题星云</p>
      )}
    </div>
  );
}
