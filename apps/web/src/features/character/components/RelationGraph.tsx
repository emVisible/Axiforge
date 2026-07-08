import { useEffect, useRef, useState, useCallback } from "react";
import { Download } from "lucide-react";
import * as d3 from "d3";
import { useRelationGraph } from "@/shared/hooks/useRelations";
import { routes } from "@/shared/lib/routes";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  essence?: string;
  is_center: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  relation_name: string;
  is_mutual: boolean;
}

interface RelationGraphProps {
  characterId: string;
}

const Palette = {
  parchment: "#f3ecd8",
  parchmentDark: "#e8dfc8",
  ink: "#3b3325",
  inkLight: "#5c5240",
  inkMuted: "#8a7e6b",
  sepia: "#6b5b3e",
  rust: "#8b4a3a",
  ochre: "#c4944a",
  ochreLight: "#dab866",
  olive: "#6b7a4e",
  slate: "#5a6570",
  cream: "#faf6ed",
  shadow: "rgba(59,51,37,0.12)",
  goldLeaf: "rgba(196,148,74,0.3)",
  goldLeafStrong: "rgba(196,148,74,0.55)",
  threadRed: "#8b3a3a",
};

function diamondPath(r: number): string {
  return `M0,${-r} L${r},0 L0,${r} L${-r},0 Z`;
}
function hexagonPath(r: number): string {
  const pts = d3.range(6).map((i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
  return `M${pts.map((p) => p.join(",")).join("L")}Z`;
}
function shieldPath(r: number): string {
  const top = -r;
  const bottom = r * 1.1;
  const mid = r * 0.7;
  return `M${-r},${top} L${r},${top} L${r},${mid * 0.5} C${r},${mid} ${r * 0.6},${bottom} 0,${bottom} C${-r * 0.6},${bottom} ${-r},${mid} ${-r},${mid * 0.5} Z`;
}

function getNodeShape(
  node: GraphNode,
  linkCount: number,
): { path: string; r: number } {
  if (node.is_center) return { path: diamondPath(26), r: 26 };
  if (linkCount >= 6) return { path: shieldPath(18), r: 20 };
  return { path: hexagonPath(18), r: 18 };
}

export default function RelationGraph({ characterId }: RelationGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { data, isLoading } = useRelationGraph(characterId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const renderGraph = useCallback(() => {
    if (!data || !containerRef.current) return;

    const container = containerRef.current;
    const width = isFullscreen ? window.innerWidth : container.clientWidth;
    const height = isFullscreen ? window.innerHeight : 440;

    d3.select(container).selectAll("svg").remove();

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    svgRef.current = svg.node();

    // 羊皮纸背景
    const defs = svg.append("defs");
    defs
      .append("radialGradient")
      .attr("id", "parchGrad")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .selectAll("stop")
      .data([
        { o: "0%", c: Palette.parchment },
        { o: "70%", c: Palette.parchmentDark },
        { o: "100%", c: "#e0d8bf" },
      ])
      .join("stop")
      .attr("offset", (d) => d.o)
      .attr("stop-color", (d) => d.c);

    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#parchGrad)")
      .attr("rx", isFullscreen ? 0 : 16);

    if (!isFullscreen) {
      svg
        .append("rect")
        .attr("x", 10)
        .attr("y", 10)
        .attr("width", width - 20)
        .attr("height", height - 20)
        .attr("fill", "none")
        .attr("stroke", Palette.inkMuted)
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.25)
        .attr("rx", 12);
    }

    // 数据
    const nodes: GraphNode[] = data.nodes.map((n) => ({ ...n }));
    const links: GraphLink[] = data.links.map((l) => ({ ...l }));

    const linkCountMap = new Map<string, number>();
    links.forEach((l) => {
      const s =
        typeof l.source === "string" ? l.source : (l.source as GraphNode).id;
      const t =
        typeof l.target === "string" ? l.target : (l.target as GraphNode).id;
      linkCountMap.set(s, (linkCountMap.get(s) || 0) + 1);
      linkCountMap.set(t, (linkCountMap.get(t) || 0) + 1);
    });

    // 力导向
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(isFullscreen ? 200 : 150),
      )
      .force("charge", d3.forceManyBody().strength(isFullscreen ? -700 : -450))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(isFullscreen ? 65 : 50));

    // 箭头
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", Palette.threadRed)
      .attr("d", "M0,-4L8,0L0,4")
      .attr("opacity", 0.7);

    // 连线
    const linkGroup = svg.append("g");
    const line = linkGroup
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", Palette.threadRed)
      .attr("stroke-width", (d) => (d.is_mutual ? 1.6 : 1.1))
      .attr("stroke-dasharray", (d) => (d.is_mutual ? "none" : "5,5"))
      .attr("opacity", 0.45)
      .attr("marker-end", (d) => (d.is_mutual ? null : "url(#arrow)"));

    const linkLabelBg = linkGroup
      .selectAll<SVGTextElement, GraphLink>("text.lb")
      .data(links)
      .join("text")
      .attr("class", "lb")
      .text((d) => d.relation_name)
      .attr("font-size", "10px")
      .attr("fill", Palette.cream)
      .attr("text-anchor", "middle")
      .attr("dy", -12)
      .attr("stroke", Palette.cream)
      .attr("stroke-width", 3)
      .attr("paint-order", "stroke")
      .style("font-family", "'Crimson Text', 'Georgia', serif")
      .style("font-style", "italic");

    const linkLabel = linkGroup
      .selectAll<SVGTextElement, GraphLink>("text.ll")
      .data(links)
      .join("text")
      .attr("class", "ll")
      .text((d) => d.relation_name)
      .attr("font-size", "10px")
      .attr("fill", Palette.sepia)
      .attr("text-anchor", "middle")
      .attr("dy", -12)
      .style("font-family", "'Crimson Text', 'Georgia', serif")
      .style("font-style", "italic");

    // 节点
    const nodeGroup = svg.append("g");

    const glow = nodeGroup
      .selectAll<SVGCircleElement, GraphNode>("circle.glow")
      .data(nodes.filter((n) => n.is_center))
      .join("circle")
      .attr("r", 40)
      .attr("fill", "none")
      .attr("stroke", Palette.goldLeaf)
      .attr("stroke-width", 10)
      .attr("opacity", 0.35);

    const nodeShapes = nodeGroup
      .selectAll<SVGPathElement, GraphNode>("path.node")
      .data(nodes)
      .join("path")
      .attr("class", "node")
      .attr("d", (d) => getNodeShape(d, linkCountMap.get(d.id) || 0).path)
      .attr("fill", (d) => (d.is_center ? Palette.ink : Palette.cream))
      .attr("stroke", (d) => (d.is_center ? Palette.ochre : Palette.inkMuted))
      .attr("stroke-width", (d) => (d.is_center ? 2.2 : 1.3))
      .attr("cursor", "pointer")
      .style("filter", (d) =>
        d.is_center
          ? `drop-shadow(0 2px 10px ${Palette.goldLeafStrong})`
          : `drop-shadow(0 1px 3px ${Palette.shadow})`,
      );

    const labels = nodeGroup
      .selectAll<SVGTextElement, GraphNode>("text.nl")
      .data(nodes)
      .join("text")
      .attr("class", "nl")
      .text((d) => (d.name.length > 4 ? d.name.slice(0, 4) + ".." : d.name))
      .attr("font-size", (d) => (d.is_center ? "10.5px" : "9px"))
      .attr("fill", (d) => (d.is_center ? Palette.cream : Palette.ink))
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-weight", (d) => (d.is_center ? "600" : "500"))
      .style("pointer-events", "none")
      .style(
        "font-family",
        "'Crimson Text', 'Georgia', 'Noto Serif SC', serif",
      );

    const subLabels = nodeGroup
      .selectAll<SVGTextElement, GraphNode>("text.sl")
      .data(nodes.filter((n) => n.name.length > 4))
      .join("text")
      .attr("class", "sl")
      .text((d) => (d.name.length > 10 ? d.name.slice(0, 9) + ".." : d.name))
      .attr("font-size", "8.5px")
      .attr("fill", (d) => (d.is_center ? Palette.ochre : Palette.inkMuted))
      .attr("text-anchor", "middle")
      .attr("dy", 18)
      .style("pointer-events", "none")
      .style("font-family", "'Crimson Text', 'Georgia', serif")
      .attr("opacity", 0.6);

    // 交互
    nodeShapes.call(
      d3
        .drag<SVGPathElement, GraphNode>()
        .on("start", (e, d) => {
          if (!e.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (e, d) => {
          d.fx = e.x;
          d.fy = e.y;
        })
        .on("end", (e, d) => {
          if (!e.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );

    nodeShapes.on("click", (_, d) => {
      if (!d.is_center) window.location.href = routes.characters.detail(d.id);
    });
    nodeShapes.on("mouseenter", function (_, d) {
      if (d.is_center) {
        d3.select(this)
          .transition()
          .duration(250)
          .attr("stroke-width", 3)
          .style("filter", `drop-shadow(0 3px 16px ${Palette.goldLeafStrong})`);
        glow.transition().duration(250).attr("r", 50).attr("opacity", 0.55);
      } else {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("stroke-width", 1.8)
          .style("filter", `drop-shadow(0 2px 8px rgba(59,51,37,0.25))`);
      }
    });

    nodeShapes.on("mouseleave", function (_, d) {
      if (d.is_center) {
        d3.select(this)
          .transition()
          .duration(350)
          .attr("stroke-width", 2.2)
          .style("filter", `drop-shadow(0 2px 10px ${Palette.goldLeafStrong})`);
        glow.transition().duration(350).attr("r", 40).attr("opacity", 0.35);
      } else {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("stroke-width", 1.3)
          .style("filter", `drop-shadow(0 1px 3px ${Palette.shadow})`);
      }
    });

    // 缩放
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 4])
      .on("zoom", (e) => {
        svg.selectAll("g").attr("transform", e.transform);
      });
    svg.call(zoom);
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(-width * 0.12, -height * 0.1).scale(1.3),
    );

    // tick
    simulation.on("tick", () => {
      line
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => {
          const tx = (d.target as GraphNode).x!,
            sx = (d.source as GraphNode).x!;
          const ty = (d.target as GraphNode).y!,
            sy = (d.source as GraphNode).y!;
          const dist = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
          if (d.is_mutual || dist === 0) return tx;
          const r = getNodeShape(
            d.target as GraphNode,
            linkCountMap.get((d.target as GraphNode).id) || 0,
          ).r;
          return tx - (r / dist) * (tx - sx);
        })
        .attr("y2", (d) => {
          const tx = (d.target as GraphNode).x!,
            sx = (d.source as GraphNode).x!;
          const ty = (d.target as GraphNode).y!,
            sy = (d.source as GraphNode).y!;
          const dist = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
          if (d.is_mutual || dist === 0) return ty;
          const r = getNodeShape(
            d.target as GraphNode,
            linkCountMap.get((d.target as GraphNode).id) || 0,
          ).r;
          return ty - (r / dist) * (ty - sy);
        });

      linkLabelBg
        .attr(
          "x",
          (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2,
        )
        .attr(
          "y",
          (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2,
        );
      linkLabel
        .attr(
          "x",
          (d) => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2,
        )
        .attr(
          "y",
          (d) => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2,
        );

      glow.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      nodeShapes.attr("transform", (d) => `translate(${d.x},${d.y})`);
      labels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
      subLabels.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [data, isFullscreen]);

  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  const handleExportPNG = async () => {
    if (!svgRef.current) return;
    setExporting(true);
    try {
      const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
      const b = svgRef.current.getBBox();
      clone.setAttribute(
        "viewBox",
        `${b.x - 40} ${b.y - 40} ${b.width + 80} ${b.height + 80}`,
      );
      clone.setAttribute("width", String(b.width + 80));
      clone.setAttribute("height", String(b.height + 80));
      const str = new XMLSerializer().serializeToString(clone);
      const canvas = document.createElement("canvas");
      canvas.width = (b.width + 80) * 2;
      canvas.height = (b.height + 80) * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.fillStyle = Palette.parchment;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const img = new Image();
      const url = URL.createObjectURL(
        new Blob([str], { type: "image/svg+xml;charset=utf-8" }),
      );
      await new Promise<void>((r) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          r();
        };
        img.src = url;
      });
      const a = document.createElement("a");
      a.download = `relation-graph-${characterId.slice(0, 8)}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading)
    return (
      <p className="text-sm text-ink-muted py-8 text-center italic">绘制中...</p>
    );
  if (!data || data.nodes.length === 0)
    return (
      <p className="text-sm text-ink-muted py-8 text-center italic">
        暂无关系数据
      </p>
    );

  return (
    <>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-canvas transition-colors"
        >
          {isFullscreen ? "退出全屏" : "全屏"}
        </button>
        {!isFullscreen && (
          <>
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-canvas transition-colors disabled:opacity-50"
            >
              {exporting ? "导出中..." : (
                <>
                  <Download className="inline h-3 w-3 mr-1" strokeWidth={1.75} />
                  导出 PNG
                </>
              )}
            </button>
            <span className="text-xs text-ink-muted">
              {data.nodes.length} 节点 · {data.links.length} 连线
            </span>
          </>
        )}
      </div>
      <div
        ref={containerRef}
        className={`w-full ${isFullscreen ? "fixed inset-0 z-50" : ""}`}
        style={{
          minHeight: isFullscreen ? "100vh" : 440,
          background: isFullscreen ? Palette.parchment : "transparent",
        }}
      >
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="px-4 py-2 text-sm bg-surface border border-border rounded-xl shadow-sm hover:bg-canvas transition-colors disabled:opacity-50"
            >
              {exporting ? "导出中..." : (
                <>
                  <Download className="inline h-3 w-3 mr-1" strokeWidth={1.75} />
                  导出 PNG
                </>
              )}
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="rounded-xl bg-panel px-4 py-2 text-sm text-ink shadow-sm transition-colors hover:bg-panel-raised"
            >
              ✕ 退出全屏
            </button>
          </div>
        )}
      </div>
    </>
  );
}
