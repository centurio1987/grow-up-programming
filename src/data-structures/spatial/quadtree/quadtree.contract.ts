/**
 * `spatial/quadtree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./quadtree.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을 기계가 검사하는
 * 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **`spatial/kdTree` 계약에서 가져오는 것 — 경계 케이스 셋과 시나리오 셋을 같은 객체로.** 두 계약의 넣기 · 범위 질의는 이름 · 뜻 ·
 * 상한 · 한정자가 같고, 가져오는 케이스와 시나리오는 그 두 연산만 부르며 정수 좌표만 넣는다(§「연산 집합이 다른 이웃에게서는 스위트
 * 항목을 따로 판정해 가져온다」 — 케이스는 부르는 연산의 뜻이 같을 때, 시나리오는 재는 행의 상한 · 한정자가 같고 채우기가 거치지 않는
 * 연산이 그 행의 상태를 바꾸지 않을 때). 저쪽이 움직이면 이 스위트가 따라 움직이고 헤더는 따라가지 않는다. `model` · `ops` 는 정의역
 * (이쪽은 유한한 수 전부)과 최근접 몫만큼 달라 따로 적는다.
 *
 * **무작위 시퀀스에 정의역 밖 점이 없다.** 이쪽의 정의역 밖은 NaN · 무한뿐이고 둘 다 JSON 에 못 담겨 vector 로 옮겨지지 않는다 — 그
 * 거절은 `./quadtree.test.ts` 의 주입 정책 시험이 본다.
 */

import type { ContractSpec } from "../../_contract/runContract";
import {
  insertScenario,
  type Point2D,
  type PointIndexSurface,
  pointIndexEdges,
  pointsInside,
  slabScenario,
  sortedPoints,
  wholeScenario,
} from "../kdTree/kdTree.contract";

export type { Point2D };

/** 헤더 연산 계약 표를 옮긴 표면 — `spatial/kdTree` 계약의 넣기 · 범위 질의와 같은 이름 · 같은 뜻이다. */
export type QuadtreeSurface = PointIndexSurface;

/** 축1 참조 모델. 넣은 점을 배열에 그대로 둔다. */
interface Model {
  points: Point2D[];
}

/** 무작위 좌표 — -4~4 의 반 칸 · 3분의 1 칸 눈금. 정수가 아닌 좌표가 섞여야 저쪽 계약과 갈리는 정의역을 지난다. */
function coordinate(rng: () => number): number {
  const step = rng() < 0.5 ? 2 : 3;
  return Math.floor(rng() * (8 * step + 1)) / step - 4;
}

export const quadtreeContract: ContractSpec<QuadtreeSurface, Model> = {
  name: "Quadtree",
  grade: "complexity",
  model: () => ({ points: [] }),

  ops: [
    {
      name: "insert",
      arg: (rng) => [coordinate(rng), coordinate(rng)],
      onImpl: (impl, arg) => {
        const [x, y] = arg as Point2D;
        impl.insert([x, y]);
      },
      onModel: (model, arg) => {
        const [x, y] = arg as Point2D;
        model.points.push([x, y]);
      },
    },
    {
      name: "rangeSearch",
      // 모서리는 -5~5 의 반 칸 눈금. 뒤집힌 사각형도 그대로 넘긴다.
      arg: (rng) => [
        [Math.floor(rng() * 21) / 2 - 5, Math.floor(rng() * 21) / 2 - 5],
        [Math.floor(rng() * 21) / 2 - 5, Math.floor(rng() * 21) / 2 - 5],
      ],
      onImpl: (impl, arg) => {
        const [min, max] = arg as [Point2D, Point2D];
        return sortedPoints(
          impl.rangeSearch([min[0], min[1]], [max[0], max[1]]),
        );
      },
      onModel: (model, arg) => {
        const [min, max] = arg as [Point2D, Point2D];
        return sortedPoints(pointsInside(model.points, min, max));
      },
    },
  ],

  edges: [
    ...pointIndexEdges,
    {
      // 이쪽 정의역은 유한한 수 전부다 — `spatial/kdTree` 가 RangeError 로 거절하는 점(정수 아님 · 절댓값 2^25 초과)을 담는다.
      name: "정수가 아니거나 아주 큰 좌표도 담는다",
      steps: [
        { op: "insert", arg: [0.5, 2] },
        { op: "insert", arg: [33554433, -1e15] },
        { op: "insert", arg: [-0.25, 1 / 3] },
        {
          op: "rangeSearch",
          arg: [
            [0, 0],
            [1, 3],
          ],
        },
        {
          op: "rangeSearch",
          arg: [
            [-1, 0.3],
            [0, 0.4],
          ],
        },
        {
          op: "rangeSearch",
          arg: [
            [-1e16, -1e16],
            [1e16, 1e16],
          ],
        },
        {
          op: "rangeSearch",
          arg: [
            [33554433, -1e15],
            [33554433, -1e15],
          ],
        },
      ],
    },
  ],

  /** 헤더 불변식 절이 「없다」이므로 빈 배열이다 — 담긴 점을 읽는 공개 연산이 범위 질의 하나다. */
  invariants: [],

  scenarios: [insertScenario, slabScenario, wholeScenario],
};
