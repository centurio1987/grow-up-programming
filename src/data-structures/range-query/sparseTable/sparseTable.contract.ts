/**
 * `range-query/sparseTable` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./sparseTable.ts` 헤더 한 곳이고(규약1), 여기 있는 것은 그 계약을 기계가
 * 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **불변 구조라 껍데기를 씌운다(불변 사실 52 ④).** `runContract` 는 인자 없는 팩토리를 받아 그 하나에 연산을 이어 붙이는데,
 * 이 구조는 **생성자로 다 지어지고 그 뒤로 변하지 않는다.** 그래서 `reindex(values)` 하나를 가진 껍데기를 대상으로 삼는다 —
 * `trie/suffixArray` 의 `Rebuildable` 과 같은 모양이고, 버린 표의 비용은 이어서 센다. 껍데기는 **계약의 일부가 아니고**
 * `check-contract.ts` 의 명세↔스텁·정본 대조에도 걸리지 않는다. 생성자 행을 재는 자리가 `reindex` 다.
 *
 * **결합은 `segmentTree` 스위트의 `firstNonZero` 를 그대로 가져온다 — 그리고 그 결합이 멱등이다.** `firstNonZero(a, a) = a`
 * 이고 결합적이며 교환적이지 않다. 헤더 「주입 정책」이 요구하는 세 의무(결합법칙 · 항등원 · 멱등)를 지키면서 **접는 차례를
 * 뒤집은 구현을 가를 수 있는** 결합이다 — 최솟값 · 최댓값 · 최대공약수는 멱등이지만 교환적이라 차례가 관측되지 않는다
 * (불변 사실 172). 세 의무를 이 결합이 지키는 것은 하네스 자기시험이 작은 정의역을 훑어 확인한다.
 *
 * **무작위 시퀀스의 구간 경계는 지금 색인한 자리 수 + 1 로 나눈 나머지로 읽는다**(불변 사실 325 와 같은 규칙) — 인자 생성기가
 * 모델을 못 받는데 `reindex` 가 길이를 바꾸기 때문이다. 음수는 그대로 넘겨 거절 경로를 돌린다.
 */

import type { ContractSpec } from "../../_contract/runContract";
import {
  firstNonZero,
  IDENTITY,
  initialValues,
} from "../segmentTree/segmentTree.contract";

export { firstNonZero, IDENTITY, initialValues };

/** 헤더 연산 계약 표의 질의 행을 옮긴 표면. 생성자 행은 껍데기의 `reindex` 가 나른다. */
export interface SparseTableContract {
  query(from: number, to: number): number;
}

type Built = SparseTableContract & { __cost?: number };

/** 질의 시나리오가 재는 호출 수. `worst` 라 n 에 묶지 않는다(§「`worst` 시나리오는 재는 호출 수를 n 에 묶지 않아도 된다」). */
export const STEPS = 32;

/** 범위 밖 호출의 관측값. 계약이 `RangeError` 를 적은 자리다. */
const OUT_OF_RANGE = "RangeError";

function observe(call: () => unknown): unknown {
  try {
    return call();
  } catch (error) {
    if (error instanceof RangeError) return OUT_OF_RANGE;
    throw error;
  }
}

/**
 * 하네스용 껍데기. `reindex` 로 새 수열을 색인하고, 버린 표의 비용은 이어서 센다. 처음에는 빈 수열을 색인한다.
 *
 * 계약에 없는 연산이므로 `check-contract.ts` 의 명세↔스텁·정본 대조에는 걸리지 않는다.
 */
export class Reindexable implements SparseTableContract {
  readonly #make: (values: number[]) => Built;
  #index: Built;
  #length = 0;
  #carried = 0;

  constructor(make: (values: number[]) => Built) {
    this.#make = make;
    this.#index = make([]);
  }

  get __cost(): number {
    return this.#carried + (this.#index.__cost ?? 0);
  }

  reindex(values: number[]): void {
    this.#carried += this.#index.__cost ?? 0;
    this.#length = values.length;
    this.#index = this.#make(values);
  }

  /** 무작위 시퀀스의 경계 인자 — 음수는 그대로, 아니면 지금 넘긴 수열 길이 + 1 로 나눈 나머지. 구현에 묻지 않는다. */
  edge(raw: number): number {
    return raw < 0 ? raw : raw % (this.#length + 1);
  }

  query(from: number, to: number): number {
    return this.#index.query(from, to);
  }
}

/** 축1 참조 모델. 수열을 그대로 들고 물을 때마다 왼쪽부터 접는다 — 같은 모양이 축3에서는 질의가 폭에 비례하는 자명한 구현이다. */
interface Model {
  values: number[];
}

function modelEdge(model: Model, raw: number): number {
  return raw < 0 ? raw : raw % (model.values.length + 1);
}

function inRange(model: Model, i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i <= model.values.length;
}

export const sparseTableContract: ContractSpec<Reindexable, Model> = {
  name: "SparseTable",
  grade: "complexity",
  model: () => ({ values: [] }),

  ops: [
    {
      name: "reindex",
      // 길이 0~20. 값에 항등원 0 을 섞어 접는 차례가 관측되게 한다.
      arg: (rng) =>
        Array.from(
          { length: Math.floor(rng() * 21) },
          () => Math.floor(rng() * 7) - 3,
        ),
      onImpl: (impl, arg) => {
        impl.reindex([...(arg as number[])]);
      },
      onModel: (model, arg) => {
        model.values = [...(arg as number[])];
      },
    },
    {
      name: "query",
      arg: (rng) => [
        Math.floor(rng() * 1025) - 1,
        Math.floor(rng() * 1025) - 1,
      ],
      onImpl: (impl, arg) => {
        const [a, b] = arg as [number, number];
        const x = impl.edge(a);
        const y = impl.edge(b);
        return observe(() =>
          x >= 0 && y >= 0
            ? impl.query(Math.min(x, y), Math.max(x, y))
            : impl.query(x, y),
        );
      },
      onModel: (model, arg) => {
        const [a, b] = arg as [number, number];
        const x = modelEdge(model, a);
        const y = modelEdge(model, b);
        const [from, to] =
          x >= 0 && y >= 0 ? [Math.min(x, y), Math.max(x, y)] : [x, y];
        if (!inRange(model, from) || !inRange(model, to) || from > to) {
          return OUT_OF_RANGE;
        }
        let acc = IDENTITY;
        for (let at = from; at < to; at++) {
          acc = firstNonZero(acc, model.values[at] as number);
        }
        return acc;
      },
    },
  ],

  edges: [
    {
      // 빈 수열을 색인한 상태에서 부를 수 있는 것은 빈 구간 하나다(헤더 「주입 정책」).
      name: "빈 수열은 빈 구간 하나만 묻고 답은 항등원이다",
      steps: [
        { op: "query", arg: [0, 0] },
        { op: "query", arg: [0, 1] },
        { op: "reindex", arg: [7] },
        { op: "query", arg: [0, 1] },
        { op: "query", arg: [1, 1] },
        { op: "query", arg: [1, 2] },
      ],
    },
    {
      // **접는 차례가 계약이다.** 폭 5 인 `[1, 6)` 은 겹치는 두 칸으로 덮는 구현에서 가운데 셋이 두 번 덮이고, 두 칸의 첫 0 아닌
      // 값이 2 와 7 로 다르다 — 두 칸을 뒤집어 접는 구현이 여기서 갈린다.
      name: "왼쪽부터 접는다 — 겹쳐 덮인 가운데가 있어도 차례를 바꾸면 답이 갈린다",
      steps: [
        { op: "reindex", arg: [0, 2, 0, 0, 7, 0, 0] },
        { op: "query", arg: [1, 6] },
        { op: "query", arg: [2, 7] },
        { op: "query", arg: [0, 7] },
        { op: "query", arg: [3, 5] },
        { op: "query", arg: [5, 7] },
      ],
    },
    {
      // 경계가 `[0, n]` 인 인자는 경계 케이스가 `n` 을 반드시 짚는다(불변 사실 166). 자리 수 13 은 2의 거듭제곱이 아니다.
      name: "마지막 자리는 오른쪽 끝이 n 인 구간에서만 보인다",
      steps: [
        { op: "reindex", arg: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5] },
        { op: "query", arg: [0, 12] },
        { op: "query", arg: [0, 13] },
        { op: "query", arg: [12, 13] },
        { op: "query", arg: [9, 13] },
        { op: "query", arg: [5, 13] },
      ],
    },
    {
      // 폭이 1 · 딱 2의 거듭제곱 · 전체인 구간. 겹치는 두 칸이 같은 칸이 되는 자리도 여기다.
      name: "폭 1 · 폭이 2의 거듭제곱 · 전체 구간",
      steps: [
        { op: "reindex", arg: initialValues(16) },
        { op: "query", arg: [3, 4] },
        { op: "query", arg: [4, 8] },
        { op: "query", arg: [8, 16] },
        { op: "query", arg: [0, 16] },
        { op: "query", arg: [6, 7] },
        { op: "query", arg: [6, 6] },
      ],
    },
    {
      name: "다시 색인하면 앞 수열은 남지 않는다",
      steps: [
        { op: "reindex", arg: [1, 2, 3] },
        { op: "query", arg: [0, 3] },
        { op: "reindex", arg: [0, 4] },
        { op: "query", arg: [0, 2] },
        { op: "query", arg: [0, 3] },
        { op: "query", arg: [0, 1] },
      ],
    },
    {
      // 계약의 주입 정책. 하네스가 던진 것을 값으로 못 보므로 양쪽을 같은 방식으로 감싼다.
      name: "범위 밖 경계·뒤집힌 구간·정수 아닌 경계는 RangeError 다",
      steps: [
        { op: "reindex", arg: initialValues(16) },
        { op: "query", arg: [0, 17] },
        { op: "query", arg: [-1, 3] },
        { op: "query", arg: [5, 2] },
        { op: "query", arg: [1.5, 4] },
        { op: "query", arg: [0, 16] },
      ],
    },
  ],

  /**
   * 헤더 불변식 절이 「없다」이므로 빈 배열이다. 불변 구조라 판별 결과와 무관하게 축2가 축1보다 더 잡는 것이 없다
   * (불변 사실 52 ①) — `check-contract.ts` 가 헤더의 번호 항목 수와 이 길이를 대조한다.
   */
  invariants: [],

  scenarios: [
    {
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n log n)",
      adversarial: false,
      // **짓기 한 번.** 입력의 모양은 짓는 비용을 바꾸지 않아 적대적 입력이 없다. 칸마다 그 구간을 처음부터 훑어 접는 구현
      // (`rescanningSparseTable`)이 자리 수의 제곱으로 걸린다. 생성자 행은 n 에 대해 반복 호출되지 않아 면제할 수 있지만
      // (§규약2 시나리오 규칙 2) 등급의 반례(모든 구간을 미리 접기)가 이 행에 있어 잰다 — `trie/suffixArray` 와 같다.
      run: (impl, n, ctx) => {
        const values = initialValues(n);
        ctx.step(() => impl.reindex(values));
      },
    },
    {
      covers: ["query"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // **짓자마자 양 끝이 어긋난 넓은 구간을 `STEPS` 번.** 경계가 둘인 질의라 한 줄 훑기가 인자 공간을 포섭하지 않는다
      // (불변 사실 167). 폭이 매 걸음 조금씩 달라 층이 갈린다. 값을 훑는 구현이 폭에 비례해 걸리고, **짓기를 첫 질의로 미루는
      // 구현**(`deferredSparseTable`)이 첫 걸음에서 표 전부를 지어 걸린다 — 재는 첫 호출이 생성자 바로 뒤라서다(불변 사실 52 ③).
      run: (impl, n, ctx) => {
        impl.reindex(initialValues(n));
        for (let k = 0; k < STEPS; k++) {
          const from = 1 + (k % 8);
          const to = n - 1 - ((k * 3) % 8);
          ctx.step(() => void impl.query(from, to));
        }
      },
    },
  ],
};
