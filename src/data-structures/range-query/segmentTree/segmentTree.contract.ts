/**
 * `range-query/segmentTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./segmentTree.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 83·185).** `runContract` 는 인자 없는 팩토리를 받는데 이
 * 구조는 **초기 수열과 결합과 항등원을 생성자로 받는다.** 축1은 고정된 자리 수 하나에서
 * 돌면 되지만 축3은 크기 사다리를 오르므로, 껍데기가 `reset(n)` 으로 그 크기의 구조를 다시
 * 세우고 버린 것의 비용을 이어서 센다. 껍데기는 계약의 일부가 아니고
 * `check-contract.ts` 의 명세↔스텁·정본 대조에도 걸리지 않는다.
 *
 * **스위트가 도는 결합 하나를 두 성질로 골랐다.** 계약은 임의의 결합을 받는데 스위트는 하나만
 * 돌 수 있으므로(§규약2 「원소 타입이 하나다」), 계약이 실제로 배제하는 두 계열을 **함께**
 * 겨누는 것을 고른다.
 *
 * | 성질 | 이 결합에서 | 이것이 없으면 안 걸리는 fixture |
 * |---|---|---|
 * | 되돌리는 값이 없다 | `1 ∘ 2 = 1` 이고 `1` 에서 `2` 를 되찾을 수 없다 | `prefixDifferenceRangeFold` |
 * | 교환적이지 않다 | `1 ∘ 2 = 1` 인데 `2 ∘ 1 = 2` 다 | `unorderedRangeFold` |
 *
 * 최솟값은 앞엣것만 만족한다 — 최솟값으로 돌았다면 접는 차례가 뒤바뀐 구현이 어느 축에도
 * 보이지 않는다. 다른 결합(합·최솟값)에서도 같은 정본이 서는 것은 `./segmentTree.test.ts`
 * 가 따로 본다.
 *
 * **범위 밖 인자를 관측값으로 만든다.** 계약이 그 자리에 `RangeError` 를 적었는데 하네스는
 * 던진 것을 값으로 대조하지 못한다(`runContract.ts` 의 축1은 반환값만 본다). 그래서 양쪽을
 * 같은 방식으로 감싸 문자열 하나로 바꾼다. `RangeError` 가 아닌 예외는 그대로 올려보낸다
 * (스텁의 `Not implemented` 가 통과로 읽히면 안 된다).
 *
 * **시나리오가 셋이고, 그중 적대적인 것이 하나다.** 근거는 아래 각 시나리오 주석에 있다 —
 * `update` 는 인자 공간이 자리 하나라 훑기가 최악 인자를 포섭하고(불변 사실 160),
 * `query` 는 경계가 둘이라 **포섭되지 않는다.**
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **두 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface SegmentTreeContract {
  update(i: number, value: number): void;
  query(from: number, to: number): number;
}

type Built = SegmentTreeContract & { __cost?: number };

/** 축1이 도는 자리 수. 무작위 구간이 표를 자주 덮도록 좁게 잡는다. */
export const SLOTS = 16;

/**
 * 스위트가 도는 결합 — **왼쪽에서 처음 만나는 0 아닌 값.**
 *
 * 결합적이다: 어느 쪽으로 묶어도 「왼쪽부터 훑어 처음 만나는 0 아닌 값」이다.
 * 항등원은 `0` 이다. 자세한 선택 근거는 파일 헤더의 표.
 */
export function firstNonZero(a: number, b: number): number {
  return a !== 0 ? a : b;
}

/** 위 결합의 항등원. */
export const IDENTITY = 0;

/**
 * 크기 n 의 초기 수열. 세 자리마다 하나를 `0` 으로 두어 항등원이 실제로 섞이게 한다 —
 * 전부 0 이 아니면 어느 구간의 답이든 첫 자리라서 접는 차례가 관측되지 않는다.
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
export class Sized {
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

  update(i: number, value: number): void {
    this.#impl.update(i, value);
  }

  query(from: number, to: number): number {
    return this.#impl.query(from, to);
  }
}

/**
 * 축1 참조 모델. 값을 배열에 그대로 적어 두고 물을 때마다 왼쪽부터 접는다 — 축1은 의미만
 * 보므로 자명한 구현으로 충분하다.
 *
 * 같은 모양이 축3에서는 결함 fixture 가 된다(`_contract/_fixtures/scanningRangeFold.ts`).
 */
interface Model {
  values: number[];
}

function slotInRange(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i < SLOTS;
}

function edgeInRange(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i <= SLOTS;
}

function modelUpdate(
  model: Model,
  i: number,
  value: number,
): string | undefined {
  if (!slotInRange(i)) return OUT_OF_RANGE;
  model.values[i] = value;
  return undefined;
}

function modelQuery(model: Model, from: number, to: number): number | string {
  if (!edgeInRange(from) || !edgeInRange(to) || from > to) return OUT_OF_RANGE;
  let acc = IDENTITY;
  for (let at = from; at < to; at++) {
    acc = firstNonZero(acc, model.values[at] as number);
  }
  return acc;
}

/** 무작위 자리와 값. 값에 `0` 을 섞는 것은 항등원이 자리에 들어가도 되기 때문이다. */
function slotAndValue(rng: () => number): [number, number] {
  return [Math.floor(rng() * SLOTS), Math.floor(rng() * 7) - 3];
}

/** 무작위 구간. `from <= to` 를 지켜 뽑는다 — 뒤집힌 구간은 경계 케이스가 따로 본다. */
function span(rng: () => number): [number, number] {
  const a = Math.floor(rng() * (SLOTS + 1));
  const b = Math.floor(rng() * (SLOTS + 1));
  return a <= b ? [a, b] : [b, a];
}

export const segmentTreeContract: ContractSpec<Sized, Model> = {
  name: "SegmentTree",
  grade: "complexity",
  model: () => ({ values: initialValues(SLOTS) }),

  ops: [
    {
      name: "update",
      arg: (rng) => slotAndValue(rng),
      onImpl: (impl, arg) => {
        const [i, value] = arg as [number, number];
        return observe(() => impl.update(i, value));
      },
      onModel: (model, arg) => {
        const [i, value] = arg as [number, number];
        return modelUpdate(model, i, value);
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
        return modelQuery(model, from, to);
      },
    },
  ],

  edges: [
    {
      // 빈 구간의 답이 항등원이라는 것은 **주입 정책이 항등원을 받는 이유**다. 값으로
      // 관측되지 않으면 그 요구가 계약에 남을 이유가 없다.
      name: "빈 구간은 어디서 물어도 항등원이다",
      steps: [
        { op: "query", arg: [0, 0] },
        { op: "query", arg: [7, 7] },
        { op: "query", arg: [SLOTS, SLOTS] },
      ],
    },
    {
      // 경계가 `[0, n]` 인 인자는 경계 케이스가 `n` 을 반드시 짚는다(불변 사실 166).
      // 마지막 자리는 오른쪽 끝이 `n` 인 구간에만 보인다.
      name: "마지막 자리는 오른쪽 끝이 n 인 구간에서만 보인다",
      steps: [
        { op: "update", arg: [SLOTS - 1, 41] },
        { op: "query", arg: [SLOTS - 1, SLOTS - 1] },
        { op: "query", arg: [SLOTS - 1, SLOTS] },
        { op: "query", arg: [0, SLOTS] },
      ],
    },
    {
      // **접는 차례가 계약이다.** 왼쪽부터 접으므로 답은 앞자리에서 먼저 정해진다.
      // 통 하나로 모으는 구현이 여기서 갈린다(`unorderedRangeFold`).
      name: "왼쪽부터 접는다 — 차례를 바꾸면 답이 갈린다",
      steps: [
        { op: "update", arg: [1, 0] },
        { op: "update", arg: [2, 0] },
        { op: "update", arg: [3, 5] },
        { op: "update", arg: [6, 9] },
        { op: "query", arg: [1, 7] },
        { op: "query", arg: [4, 8] },
        { op: "query", arg: [1, 3] },
      ],
    },
    {
      // 되돌리는 값이 없다는 것이 값으로 관측되는 자리. 앞구간 둘의 차로 답하는 구현이
      // 여기서 갈린다(`prefixDifferenceRangeFold`).
      name: "구간의 답은 두 앞구간에서 되찾아지지 않는다",
      steps: [
        { op: "update", arg: [0, 4] },
        { op: "update", arg: [1, 7] },
        { op: "update", arg: [2, 0] },
        { op: "update", arg: [3, 6] },
        { op: "query", arg: [0, 2] },
        { op: "query", arg: [0, 4] },
        { op: "query", arg: [2, 4] },
      ],
    },
    {
      // 자리를 전부 항등원으로 만들면 어느 구간도 항등원이다. 채워 넣은 잎이 답을 바꾸지
      // 않는다는 것을 값으로 짚는 자리이기도 하다.
      name: "전 자리가 항등원이면 어느 구간도 항등원이다",
      steps: [
        { op: "update", arg: [1, 0] },
        { op: "update", arg: [2, 0] },
        { op: "update", arg: [4, 0] },
        { op: "update", arg: [5, 0] },
        { op: "update", arg: [7, 0] },
        { op: "update", arg: [8, 0] },
        { op: "update", arg: [10, 0] },
        { op: "update", arg: [11, 0] },
        { op: "update", arg: [13, 0] },
        { op: "update", arg: [14, 0] },
        { op: "query", arg: [0, SLOTS] },
        { op: "query", arg: [3, 12] },
      ],
    },
    {
      // 계약의 주입 정책. 하네스가 던진 것을 값으로 못 보므로 양쪽을 같은 방식으로 감싼다
      // (파일 헤더 참고).
      name: "범위 밖 자리·경계·뒤집힌 구간은 전부 RangeError 다",
      steps: [
        { op: "update", arg: [SLOTS, 1] },
        { op: "update", arg: [-1, 1] },
        { op: "query", arg: [0, SLOTS + 1] },
        { op: "query", arg: [-1, 3] },
        { op: "query", arg: [5, 2] },
        { op: "query", arg: [0, SLOTS] },
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
      covers: ["update"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // **전 자리를 차례로 고치기.** 갱신의 인자 공간은 자리 하나뿐이라 유한하고 훑을 수
      // 있다 — 불변 사실 160 의 적용 조건이 그대로 맞는다. 통계가 단일 연산 최대이므로
      // 어느 구현의 최악 자리도 이 시나리오 안에 있다.
      //
      // 손으로 고른 적대적 입력을 여기서 뺐다. 한 자리만 되풀이해 고치는 시나리오를 지어
      // 재 보니 여섯 구현의 통계가 이 시나리오와 **전부 같았다**(측정값은 배치 보고).
      // 가르지 못하는 시나리오는 두지 않는다(불변 사실 57·161).
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) ctx.step(() => impl.update(i, i + 1));
      },
    },
    {
      covers: ["query"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // **왼쪽 끝을 옮기며 끝까지의 구간을 묻기.** 두 경계 중 하나를 `n` 으로 눌러 두고
      // 나머지 하나만 키운다(§규약2 시나리오 규칙 3). 폭이 `n` 에서 0 까지 줄어드므로
      // 훑는 계열과 묶는 계열의 최악 폭이 그 안에 있다.
      //
      // **이 선이 인자 공간 전부가 아니다.** `query` 의 인자는 쌍이라 공간이 2차원이고,
      // 이 시나리오는 `to = n` 인 선 하나만 지난다. 그 선 위에서만 빠른 구현이 실제로
      // 있고(`suffixOnlyRangeFold`) 여기를 통과한다 — 아래 적대적 시나리오가 그것을 잡는다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) ctx.step(() => void impl.query(i, n));
      },
    },
    {
      covers: ["query"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **두 경계가 다 어긋난 구간을 되풀이해 묻기.** 왼쪽 끝을 1, 오른쪽 끝을 `n - 1` 로
      // 두면 어느 층에서도 구간이 마디 하나에 딱 맞지 않아, 마디를 모으는 계열이 양쪽에서
      // 최대만큼 걸어야 한다.
      //
      // **훑기가 이 입력을 담지 못한다.** 불변 사실 160 은 인자 공간을 다 지나는 시나리오가
      // 최악 인자를 포섭한다고 적었고 적용 조건으로 「인자 공간이 유한하고 훑을 수 있을
      // 것」을 달았는데, 쌍의 공간은 $n^2$ 이라 그 조건이 여기서 깨진다. 같은 트랙의 앞
      // 유닛(`range-query/fenwickTree`)에서 규칙이 섰고 다음 유닛에서 조건이 걸린다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let k = 0; k < n; k++) ctx.step(() => void impl.query(1, n - 1));
      },
    },
  ],
};
