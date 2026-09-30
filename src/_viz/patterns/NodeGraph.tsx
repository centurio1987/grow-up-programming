/**
 * P8 노드 그래프(NodeGraph) — 정점과 간선, 정점 묶음, 무대 아래 배열 띠(KAN-058).
 *
 * 배열 계열 패턴(P1~P7)은 칸이 한 줄로 놓이는 구조만 그린다. 그래프 편(깊이 우선 탐색 · 너비 우선
 * 탐색 · 최단 경로 · 강한 연결 요소 · 위상 정렬)은 **정점이 어디와 이어져 있는가**가 요점이라, 칸
 * 줄로 누르면 간선이 사라진다. 이 패턴은 그 자리를 맡는다.
 *
 * - **정점** — 둥근 네모 안에 이름(굵게)과 값 한 줄(등폭). 상태는 칸과 같은 다섯(`CellState`)이고
 *   모양도 칸과 같다 — 새로 씀은 2.5px 강조 테, 읽음은 1.5px 잉크 테와 옅은 채움, 아직은 점선 테,
 *   이번 걸음 밖은 대시 테와 흐린 글자. 흑백에서도 테 모양으로 갈린다.
 * - **간선** — 종류(`kind`)가 선 모양을 정한다. 나무 간선은 굵은 실선, 되돌아가는 간선은 대시,
 *   가로지르는 간선은 짧은 점선, 앞으로 가는 간선은 긴 대시와 점, 종류를 아직 모르면 가는 실선이다.
 *   상태(`state`)는 색과 굵기를 덧입힌다 — 새로 씀은 강조색, 읽음은 굵은 잉크, 이번 걸음 밖은 흐린 선.
 *   서로 반대 방향인 두 간선은 저절로 양쪽으로 휘어 겹치지 않고, 자기 자신으로 가는 간선은 정점 위
 *   고리로 그린다.
 * - **묶음** — 정점 여럿을 둘러싼 둥근 테와 머리말. 강한 연결 요소 · 연결 요소 · 한 단계의 정점들처럼
 *   정점 집합에 이름을 붙일 때 쓴다.
 * - **띠** — 무대 아래 배열 칸 줄(`ArrayStrip` 의 칸). 스택 · 대기열 · 답 목록처럼 그래프 밖에서
 *   알고리즘이 들고 있는 목록을 그린다. `slots` 를 주면 칸 수를 고정해 걸음 사이에 폭이 안 바뀐다.
 *
 * 좌표(`x`·`y`)는 격자 단위다. 정점 사이를 한 단위로 두고 `unit` 이 픽셀로 바꾼다. 음수도 되고,
 * 그림은 가장 작은 좌표를 여백 안쪽으로 옮겨 그린다. 값은 계산하지 않는다 — 부르는 쪽(`.fig.tsx`)이
 * 정본 실행에서 받아 넘긴다. 나무 모양 배치는 `treeLayout` 이 부모 관계에서 낸다.
 *
 * - **기준선 · 세로 띠** — 평면 위의 점을 그릴 때(점의 좌표를 정점 자리로 준다) `x` 가 일정한 세로선
 *   (`rules`, 분할선)과 `x` 가 두 값 사이인 세로 영역(`bands`, 분할선 양옆의 띠)을 정점 뒤에 깐다. 띠는
 *   옅게 칠하고 양쪽 끝을 대시로 그어 흑백에서도 갈린다. 둘 다 없으면 그림이 그대로다(KAN-058 첫 편
 *   `closestPairOfPoints`).
 *
 * `NodeGraphFilm` 은 걸음 재생 패널의 정적 그림이다. 같은 무대를 걸음마다 한 장씩 위에서 아래로
 * 늘어놓고 장마다 걸음 배지와 한 줄을 붙인다(`CellStageFilm` 과 같은 규칙 · 같은 칸 경계).
 */

import { Canvas, vvar } from "@centurio1987/bbangto-ui-visualization";
import type { ReactElement } from "react";
import { FORM } from "../../../design/viz/tokens";
import {
  CELL_H,
  CellRow,
  type CellState,
  cellStyle,
  cellX,
  gutterFor,
  text,
} from "./ArrayStrip";
import { filmCells } from "./CellStage";

export type NodeId = number | string;

export interface GraphNode {
  readonly id: NodeId;
  /** 격자 단위 좌표. */
  readonly x: number;
  readonly y: number;
  /** 정점 이름. 없으면 `id`. */
  readonly label?: string;
  /** 이름 아래 값 한 줄(예: 「disc 2 · low 0」). */
  readonly value?: string;
  readonly state?: CellState;
}

/**
 * 간선 종류 — 깊이 우선 탐색이 간선을 가르는 넷과 「아직 모름」. 선 모양만 정하고 뜻은 부르는 쪽이
 * 본문에서 정한다(무향 그래프라면 `plain` 과 `tree` · `back` 둘만 쓴다).
 */
export type EdgeKind = "plain" | "tree" | "back" | "cross" | "forward";

/** 간선 상태 — 새로 씀 · 읽음 · 이번 걸음 밖. 적지 않으면 끝남(기본). */
export type EdgeState = "focus" | "read" | "out";

export interface GraphEdge {
  readonly from: NodeId;
  readonly to: NodeId;
  readonly kind?: EdgeKind;
  readonly state?: EdgeState;
  /** 간선 가운데에 붙는 짧은 말. */
  readonly label?: string;
  /**
   * 휘는 정도 — 두 끝 사이 거리에 곱해 가운데를 옆으로 옮긴다. 양수면 진행 방향의 왼쪽이다.
   * 적지 않으면 반대 방향 간선이 있을 때만 0.2 로 휜다.
   */
  readonly bend?: number;
}

export interface GraphGroup {
  readonly members: readonly NodeId[];
  readonly label?: string;
  /** `focus` 면 이번 걸음에 새로 생긴 묶음이다. */
  readonly state?: "focus";
}

export interface GraphStrip {
  readonly label: string;
  readonly values: readonly (number | string)[];
  readonly states?: Readonly<Partial<Record<number, CellState>>>;
  /** 칸 수를 고정한다. 값보다 많으면 남는 칸을 빈 칸으로 그린다. */
  readonly slots?: number;
}

/** 세로 기준선 — `x` 가 일정한 선. 격자 단위다. */
export interface GraphRule {
  readonly x: number;
  /** 선 윗머리에 붙는 짧은 말(예: 「x = 5」). */
  readonly label?: string;
}

/**
 * 세로 띠 — `x` 가 `from` 과 `to` 사이인 영역. 정점 자리의 위아래 끝까지 옅게 칠하고, 그림 안에
 * 들어오는 끝을 대시로 긋는다. 그림 밖으로 나가는 끝은 그림 가장자리에서 자르고 대시를 긋지 않는다 —
 * 띠가 그 너머로 이어진다는 뜻이다.
 */
export interface GraphBand {
  readonly from: number;
  readonly to: number;
  /** 띠 왼쪽 윗머리에 붙는 짧은 말. */
  readonly label?: string;
}

export interface NodeGraphScene {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  /** 정점 묶음. 빈 목록을 주면 묶음이 없어도 머리말 자리를 잡는다(걸음 사이에 자리가 안 바뀐다). */
  readonly groups?: readonly GraphGroup[];
  readonly strips?: readonly GraphStrip[];
  /** 방향 그래프인가. 기본 true — 간선 끝에 화살촉을 단다. */
  readonly directed?: boolean;
  /** 격자 한 단위의 픽셀. 기본 가로 104 · 세로 84. */
  readonly unit?: { readonly x: number; readonly y: number };
  /** 세로 기준선. 목록을 주면(비어 있어도) 머리말 자리를 잡고, 안 주면 자리도 안 잡는다. */
  readonly rules?: readonly GraphRule[];
  /** 세로 띠. 자리 규칙은 `rules` 와 같다. */
  readonly bands?: readonly GraphBand[];
}

export interface NodeGraphProps extends NodeGraphScene {
  readonly title: string;
}

const NODE_W = 66;
const NODE_H = 44;
/** 넓힌 정점 네모에서 이름 양옆에 두는 여백. */
const NODE_PAD = 10;
const ARROW = 9;
const GROUP_PAD = 12;
const GROUP_HEAD = 18;
const EDGE_LABEL = 11;
/** 기준선 · 띠의 머리말 자리. 기준선이나 띠 목록을 줬을 때만 잡는다. */
const GUIDE_HEAD = 18;
/** 기준선 · 띠가 정점 자리 위아래로 더 나가는 길이. */
const GUIDE_OVER = 8;
const DEFAULT_UNIT = { x: 104, y: 84 } as const;

const EDGE_SHAPE: Record<EdgeKind, { width: number; dash?: string }> = {
  plain: { width: FORM.borderWidth },
  tree: { width: FORM.queryWidth },
  back: { width: FORM.pieceWidth, dash: FORM.dashRight },
  cross: { width: FORM.pieceWidth, dash: "2 3" },
  forward: { width: FORM.pieceWidth, dash: "8 3 2 3" },
};

/** 한글은 글자 크기만큼, 나머지는 0.58 배로 센다(`CellStage` 와 같은 추정). */
const widthOf = (s: string, size: number): number =>
  [...s].reduce(
    (w, c) => w + (/[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/.test(c) ? size : size * 0.58),
    0,
  );

/**
 * 나무 모양 배치 — 부모 관계에서 좌표를 낸다. 잎이 왼쪽부터 한 단위씩 자리를 받고, 부모는 자식들
 * 가운데에 선다. 뿌리가 여럿이면(깊이 우선 탐색 숲) 왼쪽부터 차례로 놓는다. `y` 는 깊이다.
 *
 * `children` 은 자식을 **방문한 차례대로** 담아야 한다 — 그 차례가 곧 왼쪽에서 오른쪽이다.
 */
export function treeLayout(
  roots: readonly NodeId[],
  children: ReadonlyMap<NodeId, readonly NodeId[]>,
): Map<NodeId, { x: number; y: number }> {
  const out = new Map<NodeId, { x: number; y: number }>();
  let next = 0;
  const place = (v: NodeId, depth: number): number => {
    const kids = children.get(v) ?? [];
    if (kids.length === 0) {
      const x = next;
      next += 1;
      out.set(v, { x, y: depth });
      return x;
    }
    const xs = kids.map((c) => place(c, depth + 1));
    const x = ((xs[0] as number) + (xs.at(-1) as number)) / 2;
    out.set(v, { x, y: depth });
    return x;
  };
  for (const r of roots) place(r, 0);
  return out;
}

interface Placed {
  readonly node: GraphNode;
  readonly cx: number;
  readonly cy: number;
  /** 정점 네모의 폭. 이름이 기본 폭에 안 들어가면 그만큼 넓힌다(`nodeWidth`). */
  readonly w: number;
}

/**
 * 정점 네모의 폭 — 기본은 `NODE_W` 이고, 이름이 그 안에 안 들어가면 이름 폭에 여백을 더한 만큼
 * 넓힌다. 라딕스 트리처럼 정점 이름이 경로 문자열이라 길어지는 그림이 있어서다(KAN-058). 기본 폭에
 * 들어가는 이름은 폭이 그대로라, 그런 그림의 모양은 바뀌지 않는다.
 */
const nodeWidth = (node: GraphNode): number =>
  Math.max(
    NODE_W,
    Math.ceil(widthOf(node.label ?? String(node.id), 15) + NODE_PAD * 2),
  );

/** 격자 좌표를 픽셀로 — 가장 작은 좌표가 여백(묶음 머리말 자리 포함) 안쪽에 오게 옮긴다. */
function place(scene: NodeGraphScene): {
  placed: Map<NodeId, Placed>;
  width: number;
  height: number;
  /** 격자 `x` 를 픽셀로. 기준선 · 띠를 그릴 때 정점과 같은 자리로 옮긴다. */
  toX: (x: number) => number;
  /** 정점 자리의 위 끝 · 아래 끝(픽셀). */
  area: { top: number; bottom: number };
} {
  const unit = scene.unit ?? DEFAULT_UNIT;
  // 묶음 목록을 주면(비어 있어도) 머리말 자리를 잡는다 — 걸음 사이에 묶음이 생겨도 정점 자리가 안 바뀐다.
  const hasGroups = scene.groups !== undefined;
  const margin = hasGroups ? GROUP_PAD + GROUP_HEAD : 0;
  // 기준선 · 띠 목록을 주면(비어 있어도) 머리말 자리를 잡는다 — 묶음과 같은 규칙이라 걸음 사이에
  // 분할선이 생기거나 없어져도 정점 자리가 안 바뀐다. 둘 다 안 주면 옛 그림과 바이트가 같다.
  const guideHead =
    scene.rules !== undefined || scene.bands !== undefined ? GUIDE_HEAD : 0;
  const xs = [
    ...scene.nodes.map((n) => n.x),
    ...(scene.rules ?? []).map((r) => r.x),
  ];
  const ys = scene.nodes.map((n) => n.y);
  const minX = Math.min(0, ...xs);
  const minY = Math.min(0, ...ys);
  const left = FORM.pad + margin + NODE_W / 2;
  const top = FORM.pad + margin + guideHead + NODE_H / 2 + loopRoom(scene);
  const placed = new Map<NodeId, Placed>();
  let right = 0;
  let bottom = 0;
  for (const node of scene.nodes) {
    const cx = left + (node.x - minX) * unit.x;
    const cy = top + (node.y - minY) * unit.y;
    const w = nodeWidth(node);
    placed.set(node.id, { node, cx, cy, w });
    right = Math.max(right, cx + w / 2);
    bottom = Math.max(bottom, cy + NODE_H / 2);
  }
  // 간선 머리말이 정점 밖으로 나가는 폭도 잡는다. 왼쪽 여백을 넘으면 그림 전체를 오른쪽으로 옮긴다.
  let shift = 0;
  for (const e of scene.edges) {
    if (!e.label || e.from === e.to) continue;
    const a = placed.get(e.from);
    const b = placed.get(e.to);
    if (!a || !b) continue;
    const p = labelPos(e, scene.edges, a, b);
    shift = Math.max(shift, FORM.pad - (p.x - p.half));
    right = Math.max(right, p.x + p.half);
  }
  if (shift > 0) {
    for (const [id, p] of placed) placed.set(id, { ...p, cx: p.cx + shift });
    right += shift;
  }
  const toX = (x: number): number => left + (x - minX) * unit.x + shift;
  // 기준선은 그림 안에 들어오게 폭을 잡는다. 띠는 그림 가장자리에서 자른다(`GuideView`).
  for (const r of scene.rules ?? []) {
    right = Math.max(
      right,
      toX(r.x) + (r.label ? widthOf(r.label, 12) + 6 : FORM.borderWidth),
    );
  }
  const cys = [...placed.values()].map((p) => p.cy);
  const area = {
    top: (cys.length > 0 ? Math.min(...cys) : top) - NODE_H / 2,
    bottom: (cys.length > 0 ? Math.max(...cys) : top) + NODE_H / 2,
  };
  // 묶음 머리말이 테보다 넓으면 그 폭까지.
  for (const g of scene.groups ?? []) {
    const box = groupBox(g, placed);
    if (!box) continue;
    const head = g.label ? widthOf(g.label, 12) + 8 : 0;
    right = Math.max(right, box.x + Math.max(box.w, head));
    bottom = Math.max(bottom, box.y + box.h);
  }
  if (scene.rules !== undefined || scene.bands !== undefined) {
    bottom = Math.max(bottom, area.bottom + GUIDE_OVER);
  }
  return {
    placed,
    width: Math.ceil(right + FORM.pad),
    height: Math.ceil(bottom + FORM.pad),
    toX,
    area,
  };
}

/** 자기 자신으로 가는 간선이 있으면 고리 자리를 위에 잡는다. */
const loopRoom = (scene: NodeGraphScene): number =>
  scene.edges.some((e) => e.from === e.to) ? 22 : 0;

function bendOf(e: GraphEdge, all: readonly GraphEdge[]): number {
  if (e.bend !== undefined) return e.bend;
  const twin = all.some(
    (o) => o !== e && o.from === e.to && o.to === e.from && o.from !== o.to,
  );
  return twin ? 0.2 : 0;
}

/** 휜 간선의 조절점 — 두 끝의 가운데에서 진행 방향 왼쪽으로 `bend × 거리` 만큼. */
function control(a: Placed, b: Placed, bend: number): { x: number; y: number } {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  return { x: (a.cx + b.cx) / 2 + dy * bend, y: (a.cy + b.cy) / 2 - dx * bend };
}

/** 곡선의 가운데(t = 1/2) — 머리말을 거기 붙인다. */
function edgeMid(a: Placed, b: Placed, bend: number): { x: number; y: number } {
  const c = control(a, b, bend);
  return {
    x: 0.25 * a.cx + 0.5 * c.x + 0.25 * b.cx,
    y: 0.25 * a.cy + 0.5 * c.y + 0.25 * b.cy,
  };
}

/** 점이 정점 네모(여백 `gap` 포함) 안에 있는가. */
const inside = (p: { x: number; y: number }, n: Placed, gap: number) =>
  Math.abs(p.x - n.cx) <= n.w / 2 + gap &&
  Math.abs(p.y - n.cy) <= NODE_H / 2 + gap;

const at = (
  a: { x: number; y: number },
  c: { x: number; y: number },
  b: { x: number; y: number },
  t: number,
) => ({
  x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x,
  y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y,
});

/**
 * 두 정점 사이 곡선에서 정점 네모 밖으로 나오는 구간 `[t0, t1]` 을 찾는다. 이분 탐색이라 값이
 * 결정론적이고, 곧은 간선도 같은 식(조절점이 가운데)으로 다룬다.
 */
function clip(a: Placed, b: Placed, bend: number): [number, number] {
  const p0 = { x: a.cx, y: a.cy };
  const p1 = { x: b.cx, y: b.cy };
  const c = control(a, b, bend);
  const find = (from: Placed, forward: boolean): number => {
    let lo = forward ? 0 : 0.5;
    let hi = forward ? 0.5 : 1;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      const inNode = inside(at(p0, c, p1, mid), from, 3);
      if (forward === inNode) lo = mid;
      else hi = mid;
    }
    return forward ? hi : lo;
  };
  return [find(a, true), find(b, false)];
}

const round = (v: number): number => Math.round(v * 10) / 10;

function edgeStroke(kind: EdgeKind, state: EdgeState | undefined) {
  const shape = EDGE_SHAPE[kind];
  const color =
    state === "focus"
      ? "var(--bbangto-viz-ext-bracket-make)"
      : state === "out"
        ? "var(--bbangto-viz-ext-cover)"
        : "var(--bbangto-viz-ext-bracket)";
  const width =
    state === "focus"
      ? shape.width + 1
      : state === "read"
        ? shape.width + 0.5
        : shape.width;
  return {
    color,
    width,
    dash: shape.dash,
    opacity: state === "out" ? 0.55 : 1,
  };
}

function EdgeView(props: {
  edge: GraphEdge;
  all: readonly GraphEdge[];
  placed: ReadonlyMap<NodeId, Placed>;
  directed: boolean;
}) {
  const { edge, all, placed, directed } = props;
  const a = placed.get(edge.from);
  const b = placed.get(edge.to);
  if (!a || !b) return null;
  const kind = edge.kind ?? "plain";
  const s = edgeStroke(kind, edge.state);
  const lineStyle = {
    fill: "none",
    stroke: s.color,
    strokeWidth: s.width,
    opacity: s.opacity,
    ...(s.dash ? { strokeDasharray: s.dash } : {}),
  };
  const attrs = {
    "data-viz-edge": `${edge.from}->${edge.to}`,
    "data-viz-kind": kind,
    "data-viz-state": edge.state ?? "base",
  };

  if (edge.from === edge.to) {
    // 자기 자신으로 가는 간선 — 정점 윗변에서 나가 윗변으로 돌아오는 고리.
    const y0 = a.cy - NODE_H / 2;
    const x0 = a.cx - 10;
    const x1 = a.cx + 10;
    const tipY = y0 - 1;
    return (
      <g {...attrs}>
        <path
          d={`M ${round(x0)} ${round(y0 - 1)} C ${round(x0 - 8)} ${round(y0 - 26)} ${round(x1 + 8)} ${round(y0 - 26)} ${round(x1)} ${round(tipY - ARROW + 2)}`}
          style={lineStyle}
        />
        {directed ? (
          <path
            d={`M ${round(x1 - 4)} ${round(tipY - ARROW)} L ${round(x1 + 4)} ${round(tipY - ARROW)} L ${round(x1)} ${round(tipY)} Z`}
            style={{ fill: s.color, stroke: "none", opacity: s.opacity }}
          />
        ) : null}
      </g>
    );
  }

  const bend = bendOf(edge, all);
  const p0 = { x: a.cx, y: a.cy };
  const p1 = { x: b.cx, y: b.cy };
  const c = control(a, b, bend);
  const [t0, t1] = clip(a, b, bend);
  const start = at(p0, c, p1, t0);
  const end = at(p0, c, p1, t1);
  // 화살촉 방향 — 끝에서 조금 앞 점을 향한 방향의 반대.
  const before = at(p0, c, p1, Math.max(t0, t1 - 0.04));
  const len = Math.hypot(end.x - before.x, end.y - before.y) || 1;
  const ux = (end.x - before.x) / len;
  const uy = (end.y - before.y) / len;
  const base = directed
    ? { x: end.x - ux * ARROW, y: end.y - uy * ARROW }
    : end;
  // 선은 화살촉 밑까지만 그어 끝이 뭉개지지 않게 한다. 조절점은 같은 곡선의 부분 구간으로 다시 낸다.
  const sub = (u0: number, u1: number) => {
    const q0 = at(p0, c, p1, u0);
    const q1 = at(p0, c, p1, u1);
    const qc = {
      x:
        (1 - u0) * ((1 - u1) * p0.x + u1 * c.x) +
        u0 * ((1 - u1) * c.x + u1 * p1.x),
      y:
        (1 - u0) * ((1 - u1) * p0.y + u1 * c.y) +
        u0 * ((1 - u1) * c.y + u1 * p1.y),
    };
    return { q0, qc, q1 };
  };
  const seg = sub(t0, t1);
  const d =
    bend === 0
      ? `M ${round(start.x)} ${round(start.y)} L ${round(base.x)} ${round(base.y)}`
      : `M ${round(seg.q0.x)} ${round(seg.q0.y)} Q ${round(seg.qc.x)} ${round(seg.qc.y)} ${round(base.x)} ${round(base.y)}`;
  return (
    <g {...attrs}>
      <path d={d} style={lineStyle} />
      {directed ? (
        <path
          d={`M ${round(end.x)} ${round(end.y)} L ${round(base.x - uy * 4.5)} ${round(base.y + ux * 4.5)} L ${round(base.x + uy * 4.5)} ${round(base.y - ux * 4.5)} Z`}
          style={{ fill: s.color, stroke: "none", opacity: s.opacity }}
        />
      ) : null}
    </g>
  );
}

/** 간선 머리말의 가운데와 반폭. 곧은 간선은 진행 방향 오른쪽, 휜 간선은 휜 쪽으로 비켜 놓는다. */
function labelPos(
  edge: GraphEdge,
  all: readonly GraphEdge[],
  a: Placed,
  b: Placed,
): { x: number; y: number; half: number } {
  const bend = bendOf(edge, all);
  const mid = edgeMid(a, b, bend);
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const len = Math.hypot(dx, dy) || 1;
  const side = bend < 0 ? -1 : 1;
  const nx = (side * dy) / len;
  const ny = (side * -dx) / len;
  const half = widthOf(edge.label ?? "", EDGE_LABEL) / 2;
  const away = Math.abs(nx) * (half + 6) + Math.abs(ny) * 10;
  return { x: mid.x + nx * away, y: mid.y + ny * away, half };
}

/**
 * 간선 머리말 — 정점을 다 그린 뒤 맨 위에 그린다. 곧은 간선은 진행 방향 오른쪽, 휜 간선은 휜 쪽으로
 * 글자 폭의 절반만큼 비켜 놓아 선과 정점을 가리지 않는다.
 */
function EdgeLabel(props: {
  edge: GraphEdge;
  all: readonly GraphEdge[];
  placed: ReadonlyMap<NodeId, Placed>;
}) {
  const { edge, all, placed } = props;
  if (!edge.label || edge.from === edge.to) return null;
  const a = placed.get(edge.from);
  const b = placed.get(edge.to);
  if (!a || !b) return null;
  const pos = labelPos(edge, all, a, b);
  return (
    <text
      data-viz-edge-label={`${edge.from}->${edge.to}`}
      x={round(pos.x)}
      y={round(pos.y)}
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        ...text("note-color", EDGE_LABEL),
        paintOrder: "stroke",
        stroke: vvar("canvas", "bg"),
        strokeWidth: 4,
      }}
    >
      {edge.label}
    </text>
  );
}

function NodeView({ p }: { p: Placed }) {
  const { node, cx, cy, w } = p;
  const state = node.state;
  const dim = state === "out" || state === "empty";
  const name = node.label ?? String(node.id);
  const hasValue = node.value !== undefined && node.value !== "";
  return (
    <g data-viz-node={String(node.id)} data-viz-state={state ?? "base"}>
      <rect
        x={cx - w / 2}
        y={cy - NODE_H / 2}
        width={w}
        height={NODE_H}
        rx={NODE_H / 2}
        style={cellStyle(state)}
      />
      <text
        x={cx}
        y={hasValue ? cy - 8 : cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          ...text(dim ? "cell-muted-text" : "cell-text", 15, true),
          fontWeight: state === "focus" ? 700 : 600,
        }}
      >
        {name}
      </text>
      {hasValue ? (
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="central"
          style={text(dim ? "cell-muted-text" : "cell-text", 11, true)}
        >
          {node.value}
        </text>
      ) : null}
    </g>
  );
}

function groupBox(
  g: GraphGroup,
  placed: ReadonlyMap<NodeId, Placed>,
): { x: number; y: number; w: number; h: number } | null {
  const ps = g.members
    .map((m) => placed.get(m))
    .filter((p): p is Placed => p !== undefined);
  if (ps.length === 0) return null;
  const x0 = Math.min(...ps.map((p) => p.cx - p.w / 2)) - GROUP_PAD;
  const x1 = Math.max(...ps.map((p) => p.cx + p.w / 2)) + GROUP_PAD;
  const y0 = Math.min(...ps.map((p) => p.cy)) - NODE_H / 2 - GROUP_PAD;
  const y1 = Math.max(...ps.map((p) => p.cy)) + NODE_H / 2 + GROUP_PAD;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function GroupView(props: {
  group: GraphGroup;
  placed: ReadonlyMap<NodeId, Placed>;
}) {
  const box = groupBox(props.group, props.placed);
  if (!box) return null;
  const focus = props.group.state === "focus";
  return (
    <g
      data-viz-group={props.group.members.join(",")}
      data-viz-state={focus ? "focus" : "base"}
    >
      <rect
        x={round(box.x)}
        y={round(box.y)}
        width={round(box.w)}
        height={round(box.h)}
        rx={14}
        style={{
          fill: "none",
          stroke: focus
            ? "var(--bbangto-viz-ext-bracket-make)"
            : "var(--bbangto-viz-ext-cover)",
          strokeWidth: focus ? FORM.focusWidth : FORM.overlapWidth,
          strokeDasharray: FORM.dashOut,
        }}
      />
      {props.group.label ? (
        <text
          x={round(box.x + 4)}
          y={round(box.y - 8)}
          dominantBaseline="central"
          style={{ ...text("note-color", 12), fontWeight: focus ? 700 : 500 }}
        >
          {props.group.label}
        </text>
      ) : null}
    </g>
  );
}

/** 세로 띠와 기준선 — 정점 · 간선 · 묶음보다 먼저 그려 맨 뒤에 깐다. */
function GuideView(props: {
  scene: NodeGraphScene;
  g: ReturnType<typeof place>;
}) {
  const { scene, g } = props;
  const y0 = g.area.top - GUIDE_OVER;
  const y1 = g.area.bottom + GUIDE_OVER;
  const lo = FORM.pad;
  const hi = g.width - FORM.pad;
  const clamp = (x: number) => Math.min(hi, Math.max(lo, x));
  const edgeStyle = {
    stroke: "var(--bbangto-viz-ext-cover)",
    strokeWidth: FORM.overlapWidth,
    strokeDasharray: FORM.dashOut,
  };
  return (
    <g data-viz-guides="">
      {(scene.bands ?? []).map((b) => {
        const a = g.toX(Math.min(b.from, b.to));
        const z = g.toX(Math.max(b.from, b.to));
        const x0 = clamp(a);
        const x1 = clamp(z);
        return (
          <g key={`b-${b.from}-${b.to}`} data-viz-band={`${b.from}~${b.to}`}>
            <rect
              x={round(x0)}
              y={round(y0)}
              width={round(Math.max(0, x1 - x0))}
              height={round(y1 - y0)}
              style={{
                fill: "var(--bbangto-viz-ext-cover)",
                fillOpacity: 0.16,
                stroke: "none",
              }}
            />
            {a >= lo ? (
              <path
                d={`M ${round(x0)} ${round(y0)} V ${round(y1)}`}
                style={edgeStyle}
              />
            ) : null}
            {z <= hi ? (
              <path
                d={`M ${round(x1)} ${round(y0)} V ${round(y1)}`}
                style={edgeStyle}
              />
            ) : null}
            {b.label ? (
              <text
                x={round(x0 + 4)}
                y={round(y0 - 9)}
                dominantBaseline="central"
                style={{ ...text("note-color", 12), fontWeight: 500 }}
              >
                {b.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {(scene.rules ?? []).map((r) => {
        const x = g.toX(r.x);
        return (
          <g key={`r-${r.x}`} data-viz-rule={String(r.x)}>
            <path
              d={`M ${round(x)} ${round(y0)} V ${round(y1)}`}
              style={{
                stroke: "var(--bbangto-viz-ext-bracket)",
                strokeWidth: FORM.pieceWidth,
              }}
            />
            {r.label ? (
              <text
                x={round(x + 4)}
                y={round(y0 - 9)}
                dominantBaseline="central"
                style={{ ...text("note-color", 12), fontWeight: 700 }}
              >
                {r.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

const STRIP_GAP = 8;

function stripHeight(scene: NodeGraphScene): number {
  const n = (scene.strips ?? []).length;
  return n === 0 ? 0 : FORM.laneGap + n * (CELL_H + STRIP_GAP) - STRIP_GAP;
}

function stripWidth(scene: NodeGraphScene): number {
  const strips = scene.strips ?? [];
  if (strips.length === 0) return 0;
  const gutter = gutterFor(strips.map((s) => s.label));
  const cols = Math.max(
    ...strips.map((s) => Math.max(s.slots ?? 0, s.values.length)),
  );
  return cellX(gutter, cols) - FORM.cellGap + FORM.pad;
}

/** 장면 한 장의 크기. 걸음 재생 패널은 모든 걸음 중 가장 큰 것으로 무대를 고정한다. */
export function nodeGraphSize(scene: NodeGraphScene): {
  width: number;
  height: number;
} {
  const g = place(scene);
  return {
    width: Math.max(g.width, Math.ceil(stripWidth(scene))),
    height: g.height + stripHeight(scene),
  };
}

function SceneBody({ scene, top }: { scene: NodeGraphScene; top: number }) {
  const g = place(scene);
  const directed = scene.directed ?? true;
  const strips = scene.strips ?? [];
  const gutter = gutterFor(strips.map((s) => s.label));
  // 간선을 먼저, 정점을 나중에 그려 정점이 간선 끝을 덮는다. 새로 쓴 간선은 맨 뒤에 그려 위로 온다.
  const order = [...scene.edges].sort(
    (x, y) =>
      (x.state === "focus" ? 2 : x.state === "read" ? 1 : 0) -
      (y.state === "focus" ? 2 : y.state === "read" ? 1 : 0),
  );
  return (
    <g transform={top === 0 ? undefined : `translate(0 ${top})`}>
      {scene.rules !== undefined || scene.bands !== undefined ? (
        <GuideView scene={scene} g={g} />
      ) : null}
      {(scene.groups ?? []).map((grp) => (
        <GroupView
          key={`g-${grp.members.join(",")}`}
          group={grp}
          placed={g.placed}
        />
      ))}
      {order.map((e) => (
        <EdgeView
          key={`e-${e.from}-${e.to}-${scene.edges.indexOf(e)}`}
          edge={e}
          all={scene.edges}
          placed={g.placed}
          directed={directed}
        />
      ))}
      {[...g.placed.values()].map((p) => (
        <NodeView key={`n-${p.node.id}`} p={p} />
      ))}
      {scene.edges.map((e, i) => (
        <EdgeLabel
          key={`l-${e.from}-${e.to}-${String(i)}`}
          edge={e}
          all={scene.edges}
          placed={g.placed}
        />
      ))}
      {strips.map((s, n) => {
        const slots = Math.max(s.slots ?? 0, s.values.length);
        const states: Partial<Record<number, CellState>> = {
          ...(s.states ?? {}),
        };
        for (let i = s.values.length; i < slots; i++) states[i] = "empty";
        const values = Array.from({ length: slots }, (_, i) =>
          i < s.values.length ? (s.values[i] as number | string) : "",
        );
        return (
          <g key={`s-${s.label}`} data-viz-strip={s.label}>
            <CellRow
              gutter={gutter}
              y={g.height + FORM.laneGap + n * (CELL_H + STRIP_GAP)}
              row={{ label: s.label, values, states }}
            />
          </g>
        );
      })}
    </g>
  );
}

/** 그래프 한 장. */
export function NodeGraph(props: NodeGraphProps): ReactElement {
  const size = nodeGraphSize(props);
  return (
    <Canvas
      viewBox={`0 0 ${size.width} ${size.height}`}
      width={size.width}
      height={size.height}
      title={props.title}
    >
      <SceneBody scene={props} top={0} />
    </Canvas>
  );
}

export interface GraphFrame {
  /** 걸음 표지 — `T3` 처럼 본문의 걸음 번호와 글자 그대로 같다. */
  readonly id: string;
  readonly text: string;
  readonly scene: NodeGraphScene;
}

export interface NodeGraphFilmProps {
  readonly title: string;
  readonly frames: readonly GraphFrame[];
}

const HEAD = 30;
const BADGE_W = 40;
const BADGE_H = 22;
const FRAME_GAP = 20;

/** 정적 그림 — 걸음마다 배지 + 한 줄 + 장면 한 장을 위에서 아래로(`CellStageFilm` 과 같은 칸 경계). */
export function NodeGraphFilm({
  title,
  frames,
}: NodeGraphFilmProps): ReactElement {
  const sizes = frames.map((f) => nodeGraphSize(f.scene));
  const width = Math.ceil(
    Math.max(
      ...sizes.map((s) => s.width),
      ...frames.map(
        (f) => FORM.pad + BADGE_W + FORM.pad + widthOf(f.text, 13) + FORM.pad,
      ),
    ),
  );
  const tops: number[] = [];
  let y = FORM.pad;
  for (const s of sizes) {
    tops.push(y);
    y += HEAD + s.height + FRAME_GAP;
  }
  const height = y - FRAME_GAP + FORM.pad;
  const cells = filmCells(tops, height);
  return (
    <Canvas
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      title={title}
    >
      {frames.map((f, n) => {
        const top = tops[n] as number;
        return (
          <g
            key={f.id}
            data-viz-step={f.id}
            data-viz-y={cells[n]?.y}
            data-viz-h={cells[n]?.h}
          >
            {n > 0 ? (
              <path
                d={`M ${FORM.pad} ${top - FRAME_GAP / 2} H ${width - FORM.pad}`}
                style={{
                  stroke: "var(--bbangto-viz-ext-step-todo)",
                  strokeWidth: FORM.borderWidth,
                }}
              />
            ) : null}
            <rect
              x={FORM.pad}
              y={top}
              width={BADGE_W}
              height={BADGE_H}
              rx={FORM.radius}
              style={{
                fill: "var(--bbangto-viz-ext-step-current-fill)",
                stroke: "var(--bbangto-viz-ext-step-current-fill)",
                strokeWidth: FORM.currentWidth,
              }}
            />
            <text
              x={FORM.pad + BADGE_W / 2}
              y={top + BADGE_H / 2}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fill: "var(--bbangto-viz-ext-step-current-text)",
                fontFamily: vvar("typography", "mono", "font"),
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {f.id}
            </text>
            <text
              x={FORM.pad + BADGE_W + FORM.pad}
              y={top + BADGE_H / 2}
              dominantBaseline="central"
              style={{ ...text("cell-text", 13), fontWeight: 600 }}
            >
              {f.text}
            </text>
            <SceneBody scene={f.scene} top={top + HEAD} />
          </g>
        );
      })}
    </Canvas>
  );
}
