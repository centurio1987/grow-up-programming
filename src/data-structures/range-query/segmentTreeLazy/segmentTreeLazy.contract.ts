/**
 * `range-query/segmentTreeLazy` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./segmentTreeLazy.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** 초기 수열과 주입받는 넷을 생성자로 받는 구조라
 * `range-query/segmentTree` 와 같은 이유로 `reset(n)` 이 그 크기의 구조를 다시 세우고 버린 것의 비용을
 * 이어서 센다. 범위 밖 인자를 문자열 하나로 바꾸는 것도 그쪽 머리말 그대로다. 껍데기는 계약의 일부가 아니다.
 *
 * **스위트가 도는 대수 하나를 세 성질로 골랐다**(§규약2 「원소 타입이 하나다」 · 불변 사실 172).
 *
 * | 성질 | 이 대수에서 | 이것이 없으면 안 걸리는 fixture |
 * |---|---|---|
 * | 결합이 교환적이지 않다 | `firstNonZero(1, 2) = 1` 인데 `firstNonZero(2, 1) = 2` | `misorderedLazyRangeFold` 의 `fold` |
 * | 합성이 교환적이지 않다 | `coverCompose(5, 7) = 5` 인데 `coverCompose(7, 5) = 7` | `misorderedLazyRangeFold` 의 `compose` |
 * | 결합에 되돌리는 값이 없다 | `1` 에서 `2` 를 되찾을 수 없다 | (구간을 앞구간의 차로 답하는 계열 — `segmentTree` 와 같은 자리) |
 *
 * 결합은 `segmentTree` 스위트의 `firstNonZero` 를 그대로 가져온다. 갱신은 **「0 이 아닌 수 `u` 는 덮는 자리를 전부
 * `u` 로 덮고, `0` 은 아무것도 안 바꾼다」**다(`coverAct`·`coverCompose`). 헤더 「주입 정책」의 세 법칙을 이 대수가
 * 지킨다는 것은 하네스 자기시험이 작은 정의역을 전부 훑어 확인한다. 이 대수에서 `act` 의 셋째 인자(덮는 자리 수)는
 * 0 과 그 밖만 가른다 — **자리 수를 곱하는 대수(구간 더하기 · 구간 합)는 `./segmentTreeLazy.test.ts` 가 따로 본다.**
 *
 * **시나리오가 둘이고 둘 다 적대적이다.** 근거는 각 시나리오 주석에 있다. 두 연산 모두 인자가 경계 둘이라 한 줄 훑기가
 * 인자 공간을 포섭하지 않는다(불변 사실 167) — 그래서 양 끝이 다 어긋난 구간을 겨눈다.
 */

import type { ContractSpec } from "../../_contract/runContract";
import { firstNonZero, IDENTITY } from "../segmentTree/segmentTree.contract";

export { firstNonZero, IDENTITY };

/** 헤더 연산 계약 표의 **두 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface SegmentTreeLazyContract {
  apply(from: number, to: number, update: number): void;
  query(from: number, to: number): number;
}

type Built = SegmentTreeLazyContract & { __cost?: number };

/** 주입받는 넷의 모양. */
export type Combine = (a: number, b: number) => number;
export type Act = (update: number, value: number, count: number) => number;
export type Compose = (later: number, earlier: number) => number;

/** 축1이 도는 자리 수. `segmentTree` 스위트와 같은 값이다. */
export const SLOTS = 16;

/** 축3 시나리오가 재는 호출 수. 두 시나리오가 `worst` 라 n 에 묶지 않는다(시나리오 주석). */
const STEPS = 32;

/** 스위트가 도는 갱신 — 0 이 아닌 `update` 는 덮는 자리를 그 수로 덮고 `0` 은 그대로 둔다. 빈 구간은 항등원이다. */
export function coverAct(update: number, value: number, count: number): number {
  return update !== 0 && count > 0 ? update : value;
}

/** 위 갱신의 합성 — 나중 것이 0 이 아니면 나중 것이 이긴다. */
export function coverCompose(later: number, earlier: number): number {
  return later !== 0 ? later : earlier;
}

/**
 * 크기 n 의 초기 수열. `segmentTree` 스위트의 `initialValues` 와 같은 규칙이다 — 세 자리마다 `0` 을 두어
 * 항등원이 섞이게 한다.
 */
export function initialValues(n: number): number[] {
  const values = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    values[i] = i % 3 === 0 ? 0 : i % 3 === 1 ? i + 1 : -(i + 1);
  }
  return values;
}

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

/** 하네스용 껍데기. `reset(n)` 으로 그 크기의 구조를 다시 세운다. */
export class LazySized implements SegmentTreeLazyContract {
  readonly #make: (values: number[]) => Built;
  #impl: Built;
  #carried = 0;

  constructor(make: (values: number[]) => Built) {
    this.#make = make;
    this.#impl = make(initialValues(SLOTS));
  }

  get __cost(): number {
    return this.#carried + (this.#impl.__cost ?? 0);
  }

  reset(n: number): void {
    this.#carried += this.#impl.__cost ?? 0;
    this.#impl = this.#make(initialValues(n));
  }

  apply(from: number, to: number, update: number): void {
    this.#impl.apply(from, to, update);
  }

  query(from: number, to: number): number {
    return this.#impl.query(from, to);
  }
}

/**
 * 축1 참조 모델. 값을 배열에 그대로 적어 두고, 갱신은 **자리마다** `coverAct(update, 값, 1)` 을 적용하고 질의는
 * 왼쪽부터 접는다 — 헤더 표의 의미 열을 글자 그대로 옮긴 것이다. 같은 모양이 축3에서는 결함 fixture 가 된다
 * (`_contract/_fixtures/scanningLazyRangeFold.ts`).
 */
interface Model {
  values: number[];
}

function edgeInRange(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i <= SLOTS;
}

function spanInRange(from: number, to: number): boolean {
  return edgeInRange(from) && edgeInRange(to) && from <= to;
}

/** 무작위 구간. `from <= to` 를 지켜 뽑는다 — 뒤집힌 구간은 경계 케이스가 따로 본다. */
function span(rng: () => number): [number, number] {
  const a = Math.floor(rng() * (SLOTS + 1));
  const b = Math.floor(rng() * (SLOTS + 1));
  return a <= b ? [a, b] : [b, a];
}

export const segmentTreeLazyContract: ContractSpec<LazySized, Model> = {
  name: "SegmentTreeLazy",
  grade: "complexity",
  model: () => ({ values: initialValues(SLOTS) }),

  ops: [
    {
      name: "apply",
      // 갱신 값에 0 을 섞는다 — 「0 은 아무것도 안 바꾼다」가 무작위 시퀀스에서도 지나간다.
      arg: (rng) => [...span(rng), Math.floor(rng() * 7) - 3],
      onImpl: (impl, arg) => {
        const [from, to, update] = arg as [number, number, number];
        return observe(() => impl.apply(from, to, update));
      },
      onModel: (model, arg) => {
        const [from, to, update] = arg as [number, number, number];
        if (!spanInRange(from, to)) return OUT_OF_RANGE;
        for (let at = from; at < to; at++) {
          model.values[at] = coverAct(update, model.values[at] as number, 1);
        }
        return undefined;
      },
    },
    {
      name: "query",
      arg: (rng) => span(rng),
      onImpl: (impl, arg) => {
        const [from, to] = arg as [number, number];
        return observe(() => impl.query(from, to));
      },
      onModel: (model, arg) => {
        const [from, to] = arg as [number, number];
        if (!spanInRange(from, to)) return OUT_OF_RANGE;
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
      // 빈 구간의 답이 항등원이고, 빈 구간 갱신은 아무것도 안 바꾼다.
      name: "빈 구간은 항등원이고 빈 구간 갱신은 아무것도 안 바꾼다",
      steps: [
        { op: "query", arg: [0, 0] },
        { op: "query", arg: [7, 7] },
        { op: "apply", arg: [5, 5, 9] },
        { op: "apply", arg: [SLOTS, SLOTS, 9] },
        { op: "query", arg: [SLOTS, SLOTS] },
        { op: "query", arg: [4, 7] },
        { op: "query", arg: [0, SLOTS] },
      ],
    },
    {
      // 경계가 `[0, n]` 인 인자는 경계 케이스가 `n` 을 반드시 짚는다(불변 사실 166).
      name: "마지막 자리는 오른쪽 끝이 n 인 구간에서만 고치고 보인다",
      steps: [
        { op: "apply", arg: [SLOTS - 1, SLOTS, 41] },
        { op: "query", arg: [SLOTS - 1, SLOTS - 1] },
        { op: "query", arg: [SLOTS - 1, SLOTS] },
        { op: "apply", arg: [0, SLOTS - 1, 0] },
        { op: "query", arg: [SLOTS - 2, SLOTS] },
        { op: "apply", arg: [SLOTS - 3, SLOTS, 3] },
        { op: "query", arg: [SLOTS - 1, SLOTS] },
      ],
    },
    {
      // **접는 차례가 계약이다.** 덮은 뒤에도 답은 왼쪽 자리에서 먼저 정해진다(`misorderedLazyRangeFold` 의 `fold`).
      name: "갱신 뒤에도 왼쪽부터 접는다 — 차례를 바꾸면 답이 갈린다",
      steps: [
        { op: "apply", arg: [1, 3, 0] },
        { op: "query", arg: [1, 3] },
        { op: "apply", arg: [3, 6, 5] },
        { op: "apply", arg: [6, 7, 9] },
        { op: "query", arg: [2, 7] },
        { op: "query", arg: [5, 8] },
        { op: "query", arg: [6, 11] },
      ],
    },
    {
      // **합성 차례가 계약이다.** 겹친 갱신은 나중 것이 이긴다 — 아래로 내려보내기 전에 쌓인 둘을 합성하는 구현이
      // 차례를 뒤집으면 여기서 갈린다(`misorderedLazyRangeFold` 의 `compose`).
      name: "겹친 갱신은 나중 것이 이긴다 — 합성 차례를 바꾸면 답이 갈린다",
      steps: [
        { op: "apply", arg: [0, SLOTS, 5] },
        { op: "apply", arg: [0, SLOTS, 7] },
        { op: "query", arg: [3, 4] },
        { op: "apply", arg: [0, 8, 2] },
        { op: "apply", arg: [4, 12, 6] },
        { op: "query", arg: [0, 1] },
        { op: "query", arg: [5, 6] },
        { op: "query", arg: [9, 10] },
        { op: "query", arg: [12, 13] },
      ],
    },
    {
      // 넓게 덮은 뒤 일부를 다시 덮고 쪼개 묻는다. 쌓아 둔 갱신을 일부만 건드리는 자리마다 먼저 내려보내지 않으면
      // 옛 갱신이 새 갱신 위로 올라온다.
      name: "넓게 덮은 뒤 안쪽을 덮고 쪼개 물으면 자리마다 마지막 덮은 값이다",
      steps: [
        { op: "apply", arg: [2, 14, 8] },
        { op: "apply", arg: [5, 6, 3] },
        { op: "query", arg: [4, 5] },
        { op: "query", arg: [5, 6] },
        { op: "query", arg: [6, 7] },
        { op: "apply", arg: [0, 16, 0] },
        { op: "apply", arg: [9, 11, -4] },
        { op: "query", arg: [8, 9] },
        { op: "query", arg: [10, 12] },
        { op: "query", arg: [11, 12] },
        { op: "query", arg: [1, 3] },
      ],
    },
    {
      // 갱신 `0` 은 주입자가 준 대수에서 아무것도 안 바꾸는 갱신이다 — 쌓아 둔 갱신과 합성돼도 앞 갱신이 남는다.
      name: "아무것도 안 바꾸는 갱신은 앞 갱신을 지우지 않는다",
      steps: [
        { op: "apply", arg: [0, SLOTS, 4] },
        { op: "apply", arg: [0, SLOTS, 0] },
        { op: "apply", arg: [3, 9, 0] },
        { op: "query", arg: [5, 6] },
        { op: "query", arg: [0, SLOTS] },
      ],
    },
    {
      // 계약의 주입 정책. 하네스가 던진 것을 값으로 못 보므로 양쪽을 같은 방식으로 감싼다.
      name: "범위 밖 경계·뒤집힌 구간은 두 연산 모두 RangeError 이고 상태가 바뀌지 않는다",
      steps: [
        { op: "apply", arg: [0, SLOTS + 1, 3] },
        { op: "apply", arg: [-1, 4, 3] },
        { op: "apply", arg: [6, 2, 3] },
        { op: "apply", arg: [1.5, 4, 3] },
        { op: "query", arg: [0, SLOTS + 1] },
        { op: "query", arg: [-1, 3] },
        { op: "query", arg: [5, 2] },
        { op: "query", arg: [0, SLOTS] },
        { op: "query", arg: [2, 5] },
      ],
    },
  ],

  /**
   * 헤더 불변식 절이 「없다」이므로 빈 배열이다. 항목을 지우는 것과 다르다 —
   * `check-contract.ts` 가 헤더의 번호 항목 수와 이 길이를 대조한다.
   */
  invariants: [],

  scenarios: [
    {
      covers: ["apply"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **양 끝이 어긋난 구간을 안쪽으로 좁히며 덮기.** 걸음 `i` 에서 `[i, n - i)` 를 덮는다 — 짝수 걸음은 왼쪽 끝을
      // 하나 더 밀어 홀수에 둔다. 두 경계가 어느 층에서도 마디 하나에 딱 맞지 않는 자리를 지나고, 앞 걸음이 쌓아 둔
      // 갱신을 이번 걸음이 경계 길에서 내려보내야 한다.
      //
      // **걸음 수가 n 이 아니라 `STEPS` 로 고정이다.** `worst` 통계가 단일 호출 최대라 n 회를 잴 이유가 없고
      // (§규약2 시나리오 규칙 4 는 `amortized` 의 것이다), n 회를 재면 자리 하나 바꾸기로 푸는 구현이 사다리 끝에서
      // 호출마다 로그 × 폭을 n 번 걸어 자기시험이 제한 시간을 넘긴다.
      //
      // 덮는 자리를 하나씩 고치는 구현(`scanningLazyRangeFold`)과 자리 하나 바꾸기로 푸는 구현
      // (`pointwiseLazyRangeFold`)이 구간 폭에 비례해 걸린다. 갱신을 줄에 쌓아 두는 구현(`bufferedLazyRangeFold`)은
      // 통과한다 — 걸리는 자리가 질의라서다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < STEPS; i++) {
          const from = i % 2 === 0 ? i + 1 : i;
          ctx.step(() => impl.apply(from, n - i, (i % 5) + 1));
        }
      },
    },
    {
      covers: ["query"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **갱신 n 번을 쌓아 둔 뒤 양 끝이 어긋난 구간 `[1, n - 1)` 을 `STEPS` 번 묻기.** 준비는 폭 넷짜리 갱신 n 번을
      // 흩어 두고 끝에 넓은 갱신 `STEPS` 번을 겹쳐 덮는다 — 질의가 경계 길에서 쌓인 갱신을 내려보내야 한다. 준비의
      // 갱신 폭을 좁힌 것은 자리 하나 바꾸기로 푸는 구현의 준비 비용 때문이다(재는 것이 아니라 세우는 일이다).
      //
      // 갱신을 줄에 쌓아 두는 구현은 첫 질의 하나가 쌓인 n 개 남짓을 한꺼번에 적용해 걸린다 — `worst` 통계가 단일 호출
      // 최대라서다(`amortized` 로 재면 통과한다 — 하네스 자기시험). 구간을 훑는 구현도 걸린다. 자리 하나 바꾸기로
      // 푸는 구현은 질의가 `range-query/segmentTree` 정본 그대로라 통과한다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let step = 0; step < n; step++) {
          const from = (step * 7) % (n - 4);
          impl.apply(from, from + 4, (step % 5) + 1);
        }
        for (let i = 0; i < STEPS; i++) impl.apply(i, n - i, (i % 3) + 6);
        for (let k = 0; k < STEPS; k++)
          ctx.step(() => void impl.query(1, n - 1));
      },
    },
  ],
};
