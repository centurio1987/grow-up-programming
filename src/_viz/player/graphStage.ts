/**
 * 걸음 재생 패널의 무대 갈래 「그래프」 — 정점 · 간선 · 정점 묶음 · 무대 아래 배열 띠를 `NodeGraph`
 * 장면으로 옮긴다(KAN-058, SPEC §13 「다른 갈래의 무대」의 그래프 줄).
 *
 * 무대는 **그래프 전체**를 첫 걸음부터 그린다. 정점과 간선의 자리는 패널 하나에 한 번만 적고
 * (`layout`), 걸음마다 바뀌는 것 — 정점의 상태와 값, 간선의 종류와 상태, 묶음, 띠 — 만 걸음에 싣는다.
 * 자리가 걸음 사이에 안 바뀌니 무대 높이도 안 바뀐다(시안 규칙 5).
 *
 * 상태 어휘는 칸 무대와 같다. 정점은 새로 씀(`focus`) · 읽음(`read`) · 아직(`empty`) · 이번 걸음 밖
 * (`out`) · 끝남(적지 않음), 간선은 새로 씀 · 읽음 · 이번 걸음 밖 · 끝남이다. 값은 `.sim.ts` 가 싣고,
 * 그 값이 정본 실행과 같은지는 가이드의 시험이 잰다 — 여기서는 계산하지 않고 **배치만** 한다.
 */

import type { CellState } from "../patterns/ArrayStrip";
import type {
  EdgeKind,
  EdgeState,
  GraphGroup,
  GraphStrip,
  NodeGraphScene,
  NodeId,
} from "../patterns/NodeGraph";

/** 패널 하나에 한 번 적는 자리 — 정점 좌표와 간선 목록. */
export interface GraphLayout {
  readonly nodes: readonly {
    readonly id: NodeId;
    readonly x: number;
    readonly y: number;
    readonly label?: string;
  }[];
  readonly edges: readonly {
    readonly from: NodeId;
    readonly to: NodeId;
    readonly bend?: number;
  }[];
  readonly directed?: boolean;
  readonly unit?: { readonly x: number; readonly y: number };
}

export interface GraphOptions {
  readonly layout: GraphLayout;
}

/** 걸음 하나 — `nodes` · `edges` 는 `layout` 의 차례와 같은 자리에 그 걸음의 상태를 적는다. */
export interface GraphStep {
  readonly nodes: readonly {
    readonly value?: string;
    readonly state?: CellState;
  }[];
  readonly edges: readonly {
    readonly kind?: EdgeKind;
    readonly state?: EdgeState;
    readonly label?: string;
  }[];
  readonly groups?: readonly GraphGroup[];
  readonly strips?: readonly GraphStrip[];
  /** 이번 걸음의 계산 한 줄 — 알약에 싣는다. */
  readonly calc?: { readonly expr: string; readonly result: string } | null;
  /** 무대 어디에도 자리가 없는 값만. 없으면 `null`. */
  readonly vars?: string | null;
}

/** 걸음 하나의 장면. */
export function graphScene(s: GraphStep, opts: GraphOptions): NodeGraphScene {
  const { layout } = opts;
  return {
    nodes: layout.nodes.map((n, i) => ({
      ...n,
      value: s.nodes[i]?.value,
      state: s.nodes[i]?.state,
    })),
    edges: layout.edges.map((e, i) => ({
      ...e,
      kind: s.edges[i]?.kind,
      state: s.edges[i]?.state,
      label: s.edges[i]?.label,
    })),
    groups: s.groups,
    strips: s.strips,
    directed: layout.directed,
    unit: layout.unit,
  };
}

export const graphCalc = (s: GraphStep) => s.calc ?? null;
export const graphVars = (s: GraphStep) => s.vars ?? null;
