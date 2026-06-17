/**
 * _guide-sim — 알고리즘 해설서(MDX)에 들어가는 공용 시뮬레이션 모듈.
 *
 * 각 해설서(`*-guide.mdx`)는 이 모듈을 `import { AlgorithmSimulation } from "#guide-sim"`
 * 로 가져와, **선언형 `steps` 데이터**와 **프리셋 `view`** 만 정의한다.
 * 문제별로 JSX/Hook을 직접 작성하지 않는다 — 시각화 로직은 전부 여기에 모여 있다.
 *
 * 정적 폴백: 시뮬레이션은 해설서의 부가 요소다. JS가 동작하지 않는 환경에서는
 * 렌더되지 않을 뿐, 산문 본문만으로도 해설서는 완결적으로 읽힌다.
 *
 * 테마: 색상은 하드코딩하지 않고 `var(--guide-sim-*, 폴백)` CSS 변수로 작성해
 * 호스트의 다크/라이트 테마를 상속한다.
 */
import React, { useEffect, useRef, useState } from "react";

/* ────────────────────────── 프레임 스키마 ────────────────────────── */

/** 모든 프레임이 공유하는 메타데이터. */
export interface BaseFrame {
  /** 이 단계의 제목 (스텝 패널 상단). */
  title?: string;
  /** 이 단계에서 무슨 일이 일어나는지에 대한 설명. */
  detail?: string;
}

/** `view="array"` — 배열/정렬/투포인터 시각화. */
export interface ArrayFrame extends BaseFrame {
  array: (number | string)[];
  /** 비교/주목 중인 인덱스. */
  highlight?: number[];
  /** 확정(정렬 완료 등)된 인덱스. */
  marked?: number[];
  /** 이름 붙은 포인터: { i: 0, j: 3 } → 해당 인덱스 위에 라벨 표시. */
  pointers?: Record<string, number>;
}

export interface GraphNode {
  id: number | string;
  label?: string;
  /** 0~100 정규화 좌표 (레이아웃은 선언적으로 제공). */
  x: number;
  y: number;
}
export interface GraphEdge {
  from: number | string;
  to: number | string;
  weight?: number;
  directed?: boolean;
}
export type GraphNodeStatus = "default" | "frontier" | "active" | "visited";

/** `view="graph"` — 그래프 탐색/최단경로 시각화. */
export interface GraphFrame extends BaseFrame {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** 노드 상태(색상). */
  nodeStatus?: Record<string, GraphNodeStatus>;
  /** 노드에 표시할 값(예: 거리 라벨). */
  nodeValue?: Record<string, string | number>;
  /** 현재 완화/검사 중인 간선. */
  activeEdge?: { from: number | string; to: number | string };
}

/** `view="priorityQueue"` — 힙/큐 내부 상태. */
export interface PriorityQueueFrame extends BaseFrame {
  /** 배열 순서대로의 힙 원소. key 기준 정렬은 시각화하지 않고 그대로 그린다. */
  heap: { label: string; key: number | string }[];
  highlight?: number[];
}

export interface TreeNodeData {
  id: string | number;
  label?: string;
  status?: GraphNodeStatus;
  children?: TreeNodeData[];
}
/** `view="tree"` — 트리/재귀 구조. */
export interface TreeFrame extends BaseFrame {
  root: TreeNodeData | null;
}

/** `view="matrix"` — DP 표/2차원 배열. */
export interface MatrixFrame extends BaseFrame {
  matrix: (number | string | null)[][];
  rowLabels?: (string | number)[];
  colLabels?: (string | number)[];
  /** 강조할 [행, 열] 셀들. */
  cells?: [number, number][];
}

/** `view="keyValue"` — 범용 상태 패널(변수 스냅샷). */
export interface KeyValueFrame extends BaseFrame {
  entries: { label: string; value: string | number }[];
}

/** 한 프레임은 여러 view 필드를 동시에 가질 수 있다(예: graph + priorityQueue). */
export type Frame = BaseFrame &
  Partial<ArrayFrame> &
  Partial<GraphFrame> &
  Partial<PriorityQueueFrame> &
  Partial<TreeFrame> &
  Partial<MatrixFrame> &
  Partial<KeyValueFrame>;

export type ViewName =
  | "array"
  | "graph"
  | "priorityQueue"
  | "tree"
  | "matrix"
  | "keyValue";

export interface AlgorithmSimulationProps {
  steps: Frame[];
  /** 프리셋 뷰. 배열로 주면 위에서 아래로 여러 패널을 함께 렌더. */
  view: ViewName | ViewName[];
  title?: string;
  /** 자동재생 간격(ms). 기본 800. */
  intervalMs?: number;
}

/* ────────────────────────── 프리셋 뷰 ────────────────────────── */

function statusColor(status: GraphNodeStatus | undefined): string {
  switch (status) {
    case "visited":
      return "var(--guide-sim-visited, #9aa0a6)";
    case "active":
      return "var(--guide-sim-active, #ea4335)";
    case "frontier":
      return "var(--guide-sim-frontier, #fbbc04)";
    default:
      return "var(--guide-sim-node, #4285f4)";
  }
}

function ArrayView({ frame }: { frame: Frame }) {
  const array = frame.array ?? [];
  const highlight = new Set(frame.highlight ?? []);
  const marked = new Set(frame.marked ?? []);
  const pointers = frame.pointers ?? {};
  const pointerAt: Record<number, string[]> = {};
  for (const [name, idx] of Object.entries(pointers)) {
    (pointerAt[idx] ??= []).push(name);
  }
  return (
    <div className="gs-array">
      {array.map((v, i) => {
        const bg = highlight.has(i)
          ? "var(--guide-sim-active, #ea4335)"
          : marked.has(i)
            ? "var(--guide-sim-visited, #9aa0a6)"
            : "var(--guide-sim-node, #4285f4)";
        return (
          <div key={i} className="gs-array-cell">
            <div className="gs-array-ptr">{(pointerAt[i] ?? []).join(",")}</div>
            <div className="gs-array-box" style={{ background: bg }}>
              {v}
            </div>
            <div className="gs-array-idx">{i}</div>
          </div>
        );
      })}
    </div>
  );
}

function GraphView({ frame }: { frame: Frame }) {
  const nodes = frame.nodes ?? [];
  const edges = frame.edges ?? [];
  const status = frame.nodeStatus ?? {};
  const value = frame.nodeValue ?? {};
  const active = frame.activeEdge;
  const pos = new Map(nodes.map((n) => [String(n.id), n]));
  const isActive = (e: GraphEdge) =>
    active &&
    ((String(e.from) === String(active.from) &&
      String(e.to) === String(active.to)) ||
      (String(e.from) === String(active.to) &&
        String(e.to) === String(active.from)));
  return (
    <svg className="gs-graph" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      {edges.map((e, i) => {
        const a = pos.get(String(e.from));
        const b = pos.get(String(e.to));
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={i}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={
                isActive(e)
                  ? "var(--guide-sim-active, #ea4335)"
                  : "var(--guide-sim-edge, #bdc1c6)"
              }
              strokeWidth={isActive(e) ? 1.4 : 0.6}
            />
            {e.weight !== undefined && (
              <text
                x={mx}
                y={my}
                className="gs-graph-weight"
                fill="var(--guide-sim-text, #202124)"
              >
                {e.weight}
              </text>
            )}
          </g>
        );
      })}
      {nodes.map((n) => (
        <g key={String(n.id)}>
          <circle
            cx={n.x}
            cy={n.y}
            r={5.5}
            fill={statusColor(status[String(n.id)])}
            stroke="var(--guide-sim-edge, #5f6368)"
            strokeWidth={0.4}
          />
          <text x={n.x} y={n.y} className="gs-graph-node-label" fill="#fff">
            {n.label ?? n.id}
          </text>
          {value[String(n.id)] !== undefined && (
            <text
              x={n.x}
              y={n.y - 8}
              className="gs-graph-node-value"
              fill="var(--guide-sim-text, #202124)"
            >
              {value[String(n.id)]}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function PriorityQueueView({ frame }: { frame: Frame }) {
  const heap = frame.heap ?? [];
  const highlight = new Set(frame.highlight ?? []);
  return (
    <div className="gs-pq">
      <span className="gs-pq-label">PQ</span>
      {heap.length === 0 && <span className="gs-pq-empty">(비어 있음)</span>}
      {heap.map((item, i) => (
        <div
          key={i}
          className="gs-pq-item"
          style={{
            background: highlight.has(i)
              ? "var(--guide-sim-active, #ea4335)"
              : "var(--guide-sim-frontier, #fbbc04)",
          }}
        >
          {item.label}
          <span className="gs-pq-key">{item.key}</span>
        </div>
      ))}
    </div>
  );
}

function TreeView({ frame }: { frame: Frame }) {
  const renderNode = (node: TreeNodeData) => (
    <li key={String(node.id)}>
      <span className="gs-tree-node" style={{ background: statusColor(node.status) }}>
        {node.label ?? node.id}
      </span>
      {node.children && node.children.length > 0 && (
        <ul>{node.children.map(renderNode)}</ul>
      )}
    </li>
  );
  if (!frame.root) return <div className="gs-tree gs-empty">(빈 트리)</div>;
  return (
    <div className="gs-tree">
      <ul>{renderNode(frame.root)}</ul>
    </div>
  );
}

function MatrixView({ frame }: { frame: Frame }) {
  const matrix = frame.matrix ?? [];
  const rowLabels = frame.rowLabels;
  const colLabels = frame.colLabels;
  const hi = new Set((frame.cells ?? []).map(([r, c]) => `${r},${c}`));
  return (
    <table className="gs-matrix">
      {colLabels && (
        <thead>
          <tr>
            {rowLabels && <th />}
            {colLabels.map((c, i) => (
              <th key={i}>{c}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {matrix.map((row, r) => (
          <tr key={r}>
            {rowLabels && <th>{rowLabels[r]}</th>}
            {row.map((cell, c) => (
              <td
                key={c}
                style={{
                  background: hi.has(`${r},${c}`)
                    ? "var(--guide-sim-active, #ea4335)"
                    : "transparent",
                  color: hi.has(`${r},${c}`) ? "#fff" : "inherit",
                }}
              >
                {cell === null ? "" : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function KeyValueView({ frame }: { frame: Frame }) {
  const entries = frame.entries ?? [];
  return (
    <div className="gs-kv">
      {entries.map((e, i) => (
        <div key={i} className="gs-kv-item">
          <span className="gs-kv-key">{e.label}</span>
          <span className="gs-kv-val">{e.value}</span>
        </div>
      ))}
    </div>
  );
}

const VIEW_REGISTRY: Record<ViewName, (props: { frame: Frame }) => React.JSX.Element> = {
  array: ArrayView,
  graph: GraphView,
  priorityQueue: PriorityQueueView,
  tree: TreeView,
  matrix: MatrixView,
  keyValue: KeyValueView,
};

/* ────────────────────────── 스텝퍼 셸 ────────────────────────── */

export function AlgorithmSimulation({
  steps,
  view,
  title,
  intervalMs = 800,
}: AlgorithmSimulationProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = steps.length;
  const clamp = (i: number) => Math.max(0, Math.min(total - 1, i));
  const frame: Frame = steps[clamp(index)] ?? {};
  const views = Array.isArray(view) ? view : [view];

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= total - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, total, intervalMs]);

  if (total === 0) return null;

  return (
    <div className="guide-sim" data-testid="guide-sim">
      <SimStyle />
      {title && <div className="gs-title">{title}</div>}

      <div className="gs-stage">
        {views.map((v) => {
          const View = VIEW_REGISTRY[v];
          return <View key={v} frame={frame} />;
        })}
      </div>

      <div className="gs-panel">
        <div className="gs-step-title">
          {frame.title ?? `Step ${index + 1}`}
        </div>
        {frame.detail && <div className="gs-step-detail">{frame.detail}</div>}
      </div>

      <div className="gs-controls">
        <button
          type="button"
          aria-label="reset"
          onClick={() => {
            setPlaying(false);
            setIndex(0);
          }}
        >
          ⟳
        </button>
        <button
          type="button"
          aria-label="prev"
          disabled={index === 0}
          onClick={() => setIndex((i) => clamp(i - 1))}
        >
          ◀
        </button>
        <button
          type="button"
          aria-label="play"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          type="button"
          aria-label="next"
          disabled={index === total - 1}
          onClick={() => setIndex((i) => clamp(i + 1))}
        >
          ▶▶
        </button>
        <input
          className="gs-slider"
          type="range"
          min={0}
          max={total - 1}
          value={index}
          aria-label="step"
          onChange={(e) => {
            setPlaying(false);
            setIndex(clamp(Number(e.target.value)));
          }}
        />
        <span className="gs-counter" data-testid="gs-counter">
          {index + 1} / {total}
        </span>
      </div>
    </div>
  );
}

export default AlgorithmSimulation;

/* ────────────────────────── 스타일 (CSS 변수 테마) ────────────────────────── */

function SimStyle() {
  return (
    <style>{`
.guide-sim {
  --gs-fg: var(--guide-sim-text, #202124);
  border: 1px solid var(--guide-sim-border, #dadce0);
  border-radius: 10px;
  padding: 16px;
  margin: 20px 0;
  background: var(--guide-sim-bg, #ffffff);
  color: var(--gs-fg);
  font-family: var(--guide-sim-font, system-ui, sans-serif);
}
.guide-sim .gs-title { font-weight: 600; margin-bottom: 12px; }
.guide-sim .gs-stage {
  display: flex; flex-direction: column; gap: 14px;
  align-items: center; min-height: 80px;
  padding: 12px; border-radius: 8px;
  background: var(--guide-sim-stage, rgba(127,127,127,0.06));
}
.guide-sim .gs-panel { margin: 12px 0; min-height: 40px; }
.guide-sim .gs-step-title { font-weight: 600; font-size: 14px; }
.guide-sim .gs-step-detail { font-size: 13px; opacity: 0.85; margin-top: 4px; white-space: pre-wrap; }
.guide-sim .gs-controls { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.guide-sim .gs-controls button {
  cursor: pointer; border: 1px solid var(--guide-sim-border, #dadce0);
  background: var(--guide-sim-bg, #fff); color: var(--gs-fg);
  border-radius: 6px; padding: 4px 10px; font-size: 13px; line-height: 1;
}
.guide-sim .gs-controls button:disabled { opacity: 0.4; cursor: default; }
.guide-sim .gs-slider { flex: 1; min-width: 120px; }
.guide-sim .gs-counter { font-variant-numeric: tabular-nums; font-size: 13px; opacity: 0.8; }

.guide-sim .gs-array { display: flex; gap: 6px; flex-wrap: wrap; }
.guide-sim .gs-array-cell { display: flex; flex-direction: column; align-items: center; }
.guide-sim .gs-array-ptr { font-size: 11px; height: 14px; color: var(--guide-sim-active, #ea4335); }
.guide-sim .gs-array-box {
  min-width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  color: #fff; border-radius: 6px; font-size: 13px; font-weight: 600;
}
.guide-sim .gs-array-idx { font-size: 11px; opacity: 0.6; }

.guide-sim .gs-graph { width: 100%; max-width: 420px; aspect-ratio: 1; }
.guide-sim .gs-graph-weight { font-size: 3px; text-anchor: middle; }
.guide-sim .gs-graph-node-label { font-size: 4px; text-anchor: middle; dominant-baseline: central; font-weight: 700; }
.guide-sim .gs-graph-node-value { font-size: 3.5px; text-anchor: middle; font-weight: 700; }

.guide-sim .gs-pq { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.guide-sim .gs-pq-label { font-weight: 700; font-size: 12px; opacity: 0.7; }
.guide-sim .gs-pq-empty { font-size: 12px; opacity: 0.6; }
.guide-sim .gs-pq-item {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;
}
.guide-sim .gs-pq-key { font-weight: 400; opacity: 0.8; font-size: 11px; }

.guide-sim .gs-tree ul { display: flex; gap: 12px; list-style: none; padding-left: 0; margin: 0; justify-content: center; }
.guide-sim .gs-tree li { text-align: center; }
.guide-sim .gs-tree-node {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 28px; padding: 0 6px; border-radius: 50%;
  color: #fff; font-size: 12px; font-weight: 600;
}

.guide-sim .gs-matrix { border-collapse: collapse; font-size: 13px; }
.guide-sim .gs-matrix th, .guide-sim .gs-matrix td {
  border: 1px solid var(--guide-sim-border, #dadce0);
  padding: 4px 8px; text-align: center; min-width: 28px;
}
.guide-sim .gs-matrix th { background: var(--guide-sim-stage, rgba(127,127,127,0.1)); }

.guide-sim .gs-kv { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.guide-sim .gs-kv-item { display: flex; justify-content: space-between; gap: 16px; font-size: 13px; }
.guide-sim .gs-kv-key { opacity: 0.7; }
.guide-sim .gs-kv-val { font-weight: 600; font-variant-numeric: tabular-nums; }
`}</style>
  );
}
