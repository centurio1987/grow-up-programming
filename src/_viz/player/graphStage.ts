/**
 * 걸음 재생 패널의 무대 갈래 「그래프」 — 정점 · 간선 · 정점 묶음 · 무대 아래 배열 띠를 `NodeGraph`
 * 장면으로 옮긴다(KAN-058, SPEC §13 「다른 갈래의 무대」의 그래프 줄).
 *
 * 무대는 **그래프 전체**를 첫 걸음부터 그린다. 정점과 간선의 자리는 패널 하나에 한 번만 적고
 * (`layout`), 걸음마다 바뀌는 것 — 정점의 상태와 값, 간선의 종류와 상태, 묶음, 띠 — 만 걸음에 싣는다.
 * 자리가 걸음 사이에 안 바뀌니 무대 높이도 안 바뀐다(시안 규칙 5).
 *
 * 걸음에 따라 없어지는 간선은 `hidden` 으로 뺀다 — 정점 자리는 그대로이고 그 걸음의 장면에서 선만 빠진다.
 *
 * 상태 어휘는 칸 무대와 같다. 정점은 새로 씀(`focus`) · 읽음(`read`) · 아직(`empty`) · 이번 걸음 밖
 * (`out`) · 끝남(적지 않음), 간선은 새로 씀 · 읽음 · 이번 걸음 밖 · 끝남이다. 값은 `.sim.ts` 가 싣고,
 * 그 값이 정본 실행과 같은지는 가이드의 시험이 잰다 — 여기서는 계산하지 않고 **배치만** 한다.
 */

import type { CellState } from "../patterns/ArrayStrip";
import type {
  EdgeKind,
  EdgeState,
  GraphBand,
  GraphGroup,
  GraphRule,
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
    /**
     * 이 걸음에 없는 간선 — 그리지 않는다. 아직 안 생긴 간선은 `state: "out"`(흐린 선)으로 두지만,
     * 걸음 사이에 부모가 바뀌는 구조(라딕스 트리가 라벨을 가르면 옛 간선이 없어진다)에서 **이미
     * 사라진** 간선을 흐린 선으로 남기면 앞으로 생길 간선으로 읽힌다. 그때 이것을 쓴다(KAN-058).
     */
    readonly hidden?: boolean;
  }[];
  readonly groups?: readonly GraphGroup[];
  readonly strips?: readonly GraphStrip[];
  /**
   * 평면 그림의 세로 기준선과 세로 띠 — 걸음마다 자리가 바뀔 수 있다(분할 정복이 가르는 분할선과 그
   * 양옆의 띠). 적지 않으면 그리지 않는다(KAN-058 첫 편 `closestPairOfPoints`).
   */
  readonly rules?: readonly GraphRule[];
  readonly bands?: readonly GraphBand[];
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
    edges: layout.edges.flatMap((e, i) =>
      s.edges[i]?.hidden
        ? []
        : [
            {
              ...e,
              kind: s.edges[i]?.kind,
              state: s.edges[i]?.state,
              label: s.edges[i]?.label,
            },
          ],
    ),
    groups: s.groups,
    strips: s.strips,
    directed: layout.directed,
    unit: layout.unit,
    ...(s.rules !== undefined ? { rules: s.rules } : {}),
    ...(s.bands !== undefined ? { bands: s.bands } : {}),
  };
}

export const graphCalc = (s: GraphStep) => s.calc ?? null;
export const graphVars = (s: GraphStep) => s.vars ?? null;
