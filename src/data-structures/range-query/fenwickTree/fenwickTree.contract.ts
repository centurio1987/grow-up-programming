/**
 * `range-query/fenwickTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./fenwickTree.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 83).** `runContract` 는 인자 없는 팩토리를 받는데 이
 * 구조는 **자리 수를 생성자로 받는다.** 축1은 고정된 자리 수 하나에서 돌면 되지만 축3은
 * 크기 사다리를 오르므로, 껍데기가 `reset(n)` 으로 그 크기의 표를 다시 세우고 버린 표의
 * 비용을 이어서 센다. 껍데기는 계약의 일부가 아니고 `check-contract.ts` 의 명세↔스텁·정본
 * 대조에도 걸리지 않는다(그 대조가 보는 것은 `<name>.ts` 와 `_reference/<name>.ts` 다).
 *
 * **범위 밖 인자를 관측값으로 만든다.** 계약이 그 자리에 `RangeError` 를 적었는데 하네스는
 * 던진 것을 값으로 대조하지 못한다(`runContract.ts` 의 축1은 반환값만 본다). 그래서 양쪽을
 * 같은 방식으로 감싸 문자열 하나로 바꾼다 — 무작위 시퀀스는 범위 안에서만 인자를 뽑으므로
 * 이 감싸기가 걸리는 자리는 경계 케이스 둘뿐이다. `RangeError` 가 아닌 예외는 그대로
 * 올려보낸다(스텁의 `Not implemented` 가 통과로 읽히면 안 된다).
 *
 * **시나리오가 넷이고, 그중 적대적인 것이 하나다.** 이 계약은 네 행이 전부 `worst` 라
 * 축3 통계가 **단일 연산 최대 비용**이고, 그래서 인자를 전부 지나는 훑기가 어느 구현의
 * 최악 인자도 그 안에 담는다. 손으로 고른 적대적 입력이 훑기보다 **덜 잡는 것**을 실제로
 * 재서 아래 주석에 남겼다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **세 행**을 그대로 옮긴 표면. 생성자 행은 껍데기가 나른다. */
export interface FenwickTreeContract {
  update(i: number, delta: number): void;
  prefixSum(i: number): number;
  rangeSum(from: number, to: number): number;
}

type Built = FenwickTreeContract & { __cost?: number };

/** 축1이 도는 자리 수. 무작위 인자가 표를 자주 덮도록 좁게 잡는다. */
const SLOTS = 16;

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

/** 하네스용 껍데기. `reset(n)` 으로 그 크기의 표를 다시 세운다. */
export class Sized {
  readonly #make: (n: number) => Built;
  #impl: Built;
  #carried = 0;

  constructor(make: (n: number) => Built) {
    this.#make = make;
    this.#impl = make(SLOTS);
  }

  get __cost(): number {
    return this.#carried + (this.#impl.__cost ?? 0);
  }

  reset(n: number): void {
    this.#carried += this.#impl.__cost ?? 0;
    this.#impl = this.#make(n);
  }

  update(i: number, delta: number): void {
    this.#impl.update(i, delta);
  }

  prefixSum(i: number): number {
    return this.#impl.prefixSum(i);
  }

  rangeSum(from: number, to: number): number {
    return this.#impl.rangeSum(from, to);
  }
}

/**
 * 축1 참조 모델. 값을 배열에 그대로 적어 두고 물을 때마다 훑는다 — 축1은 의미만 보므로
 * 자명한 구현으로 충분하다.
 *
 * 같은 모양이 축3에서는 결함 fixture 가 된다(`_contract/_fixtures/scanningRangeSums.ts`).
 */
interface Model {
  values: number[];
}

function slotInRange(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i < SLOTS;
}

function lengthInRange(i: number): boolean {
  return Number.isInteger(i) && i >= 0 && i <= SLOTS;
}

function modelUpdate(
  model: Model,
  i: number,
  delta: number,
): string | undefined {
  if (!slotInRange(i) || !Number.isInteger(delta)) return OUT_OF_RANGE;
  model.values[i] = (model.values[i] as number) + delta;
  return undefined;
}

function modelPrefixSum(model: Model, i: number): number | string {
  if (!lengthInRange(i)) return OUT_OF_RANGE;
  let sum = 0;
  for (let at = 0; at < i; at++) sum += model.values[at] as number;
  return sum;
}

function modelRangeSum(
  model: Model,
  from: number,
  to: number,
): number | string {
  if (!lengthInRange(from) || !lengthInRange(to) || from > to) {
    return OUT_OF_RANGE;
  }
  let sum = 0;
  for (let at = from; at < to; at++) sum += model.values[at] as number;
  return sum;
}

/** 무작위 자리와 정수 증분. 증분에 음수를 섞는 것은 계약이 되돌리기를 약속하기 때문이다. */
function slotAndDelta(rng: () => number): [number, number] {
  return [Math.floor(rng() * SLOTS), Math.floor(rng() * 19) - 9];
}

/** 무작위 구간. `from <= to` 를 지켜 뽑는다 — 뒤집힌 구간은 경계 케이스가 따로 본다. */
function span(rng: () => number): [number, number] {
  const a = Math.floor(rng() * (SLOTS + 1));
  const b = Math.floor(rng() * (SLOTS + 1));
  return a <= b ? [a, b] : [b, a];
}

/** 시나리오 준비 — 전 자리를 0 이 아닌 값으로 채운다. 준비는 걸음에 안 들어간다. */
function fill(impl: Sized, n: number): void {
  for (let i = 0; i < n; i++) impl.update(i, (i % 7) - 3);
}

export const fenwickTreeContract: ContractSpec<Sized, Model> = {
  name: "FenwickTree",
  grade: "complexity",
  model: () => ({ values: new Array<number>(SLOTS).fill(0) }),

  ops: [
    {
      name: "update",
      arg: (rng) => slotAndDelta(rng),
      onImpl: (impl, arg) => {
        const [i, delta] = arg as [number, number];
        return observe(() => impl.update(i, delta));
      },
      onModel: (model, arg) => {
        const [i, delta] = arg as [number, number];
        return modelUpdate(model, i, delta);
      },
    },
    {
      name: "prefixSum",
      arg: (rng) => Math.floor(rng() * (SLOTS + 1)),
      onImpl: (impl, arg) => observe(() => impl.prefixSum(arg as number)),
      onModel: (model, arg) => modelPrefixSum(model, arg as number),
    },
    {
      name: "rangeSum",
      arg: (rng) => span(rng),
      onImpl: (impl, arg) => {
        const [from, to] = arg as [number, number];
        return observe(() => impl.rangeSum(from, to));
      },
      onModel: (model, arg) => {
        const [from, to] = arg as [number, number];
        return modelRangeSum(model, from, to);
      },
    },
  ],

  edges: [
    {
      name: "아무것도 고치지 않은 표는 어느 앞구간도 0 이다",
      steps: [
        { op: "prefixSum", arg: 0 },
        { op: "prefixSum", arg: SLOTS },
        { op: "rangeSum", arg: [0, SLOTS] },
        { op: "rangeSum", arg: [3, 3] },
      ],
    },
    {
      // 앞구간 길이 0 과 빈 구간. 「앞이 하나도 없다」가 값으로 관측되는 자리다.
      name: "길이 0 의 앞구간과 빈 구간은 값을 넣은 뒤에도 0 이다",
      steps: [
        { op: "update", arg: [0, 5] },
        { op: "update", arg: [SLOTS - 1, 7] },
        { op: "prefixSum", arg: 0 },
        { op: "rangeSum", arg: [0, 0] },
        { op: "rangeSum", arg: [SLOTS, SLOTS] },
      ],
    },
    {
      // 마지막 자리는 길이 n 의 앞구간에만 보인다. 경계를 하나 밀면 여기서 갈린다.
      name: "마지막 자리는 앞구간 길이 n 에서만 보인다",
      steps: [
        { op: "update", arg: [SLOTS - 1, 4] },
        { op: "prefixSum", arg: SLOTS - 1 },
        { op: "prefixSum", arg: SLOTS },
        { op: "rangeSum", arg: [SLOTS - 1, SLOTS] },
      ],
    },
    {
      // 같은 자리를 여러 번 고치면 쌓이고, 음수로 되돌려진다.
      name: "같은 자리를 거듭 고치면 쌓이고 음수로 되돌아온다",
      steps: [
        { op: "update", arg: [2, 10] },
        { op: "update", arg: [2, 10] },
        { op: "prefixSum", arg: 3 },
        { op: "update", arg: [2, -20] },
        { op: "prefixSum", arg: 3 },
        { op: "rangeSum", arg: [2, 3] },
      ],
    },
    {
      // 헤더 불변식을 손으로 짚은 자리. 쪼갠 합이 통째 합과 같다.
      name: "앞구간을 둘로 쪼개 더하면 통째 앞구간과 같다",
      steps: [
        { op: "update", arg: [1, 3] },
        { op: "update", arg: [5, -8] },
        { op: "update", arg: [9, 12] },
        { op: "prefixSum", arg: 4 },
        { op: "rangeSum", arg: [4, 11] },
        { op: "prefixSum", arg: 11 },
      ],
    },
    {
      // 계약의 주입 정책. 하네스가 던진 것을 값으로 못 보므로 양쪽을 같은 방식으로 감싼다
      // (파일 헤더 참고).
      name: "범위 밖 자리·길이·뒤집힌 구간은 전부 RangeError 다",
      steps: [
        { op: "update", arg: [SLOTS, 1] },
        { op: "update", arg: [-1, 1] },
        { op: "prefixSum", arg: SLOTS + 1 },
        { op: "prefixSum", arg: -1 },
        { op: "rangeSum", arg: [4, 2] },
        { op: "rangeSum", arg: [0, SLOTS + 1] },
        { op: "prefixSum", arg: SLOTS },
      ],
    },
    {
      // 주입 정책의 「값은 정수다」. 결합적으로 더할 수 없는 값을 막는 자리다.
      name: "정수가 아닌 증분은 RangeError 다",
      steps: [
        { op: "update", arg: [3, 0.5] },
        { op: "update", arg: [3, Number.NaN] },
        { op: "update", arg: [3, Number.POSITIVE_INFINITY] },
        { op: "prefixSum", arg: SLOTS },
      ],
    },
  ],

  /**
   * 헤더 불변식 절의 한 항목을 옮긴 것. 관측 경로가 둘인 성질이고, 어느 계약 줄도 둘이
   * 같아야 한다고 적지 않는다.
   */
  invariants: [
    {
      name: "앞구간과 구간이 갈리지 않는다",
      check(impl) {
        for (let from = 0; from <= SLOTS; from++) {
          for (let to = from; to <= SLOTS; to++) {
            const split = impl.prefixSum(from) + impl.rangeSum(from, to);
            const whole = impl.prefixSum(to);
            if (split !== whole) {
              return `prefixSum(${from}) + rangeSum(${from}, ${to}) = ${split} 인데 prefixSum(${to}) = ${whole} 다`;
            }
          }
        }
        return null;
      },
    },
  ],

  scenarios: [
    {
      covers: ["update"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **앞자리 하나만 되풀이해 고치기.** 앞으로 접어 둔 계열을 겨눈 입력이다 —
      // 앞구간 합을 그대로 적어 두는 구현에서 자리 `0` 을 고치면 표 전체가 달라진다
      // (`EagerPrefixSums` 가 1,024 → 4,096 → 16,384 로 $r = 4.00$).
      //
      // **겨눈 입력이 겨누지 않은 입력보다 덜 잡는다.** 같은 행의 훑기 시나리오는
      // `MirroredPrefixSums` 도 잡는데 여기서는 그것이 **통과한다**(1 → 1 → 1) —
      // 뒤에서부터 접어 두면 자리 `0` 앞에 고칠 것이 하나뿐이다. 적대성은 (계약, 구현)
      // 쌍에 대해 정의된다는 것의 실물이고(불변 사실 57), 이 시나리오를 남겨 두는 이유가
      // 그 수치를 고정하는 것이다.
      //
      // 정본은 11 → 13 → 15($r$ = 1.18 · 1.15).
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let k = 0; k < n; k++) ctx.step(() => impl.update(0, 1));
      },
    },
    {
      covers: ["update"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // **전 자리를 차례로 고치기.** 어느 자리가 최악인지 몰라도 되는 시나리오다 — 자리를
      // 전부 지나므로 **어느 구현의 최악 자리도 그 안에 있다.** 통계가 단일 연산 최대이므로
      // (한정자가 `worst`) 그 최악 하나가 그대로 판정에 들어간다.
      //
      // 앞으로 접은 계열과 뒤로 접은 계열을 **함께** 잡는다 — `EagerPrefixSums` 와
      // `MirroredPrefixSums` 가 둘 다 1,024 → 4,096 → 16,384 로 $r = 4.00$ 이다.
      //
      // 정본의 단일 호출 최대는 위 시나리오와 **같은 값**이다(11 → 13 → 15). 최대를 만드는
      // 자리가 `0` 이고 훑기가 그 자리를 지나기 때문이다. 평균은 6.0 → 7.0 → 8.0 인데
      // `worst` 통계는 평균을 보지 않는다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        for (let i = 0; i < n; i++) ctx.step(() => impl.update(i, 1));
      },
    },
    {
      covers: ["prefixSum"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // **전 자리를 채운 뒤 모든 앞구간 길이를 차례로 묻기.** 값 배열 계열(`ScanningRangeSums`,
      // 1,023 → 4,095 → 16,383 · $r = 4.00$)과 묶음 계열(`BlockedPrefixSums`, 62 → 126 → 254 ·
      // $r$ = 2.03 · 2.02)을 함께 잡는다. 뒤엣것이 이 행에서 **상한 선택이 실제로 배제하는
      // 계열**이다 — `O(sqrt n)` 으로 적었다면 통과했다.
      //
      // 채우는 일은 준비라 걸음에 안 든다. **채워도 재는 값이 하나도 바뀌지 않는다** —
      // 다섯 구현 모두 질의 비용이 담긴 값에 기대지 않아서, 빈 표에서 잰 값과 같다(실측).
      // 그래도 채우는 이유는 값이 든 자리 수에 비용이 기대는 구현을 빈 표가 통째로
      // 놓아주기 때문이다.
      //
      // **손으로 고른 적대적 입력을 여기서 뺐다.** 길이 `n - 1`(비트가 전부 선 자리)만
      // 되풀이해 묻는 시나리오를 지어 재 보니 다섯 구현의 통계가 이 시나리오와 **전부
      // 같았다** — `worst` 통계가 단일 연산 최대이고 훑기가 그 최악 길이를 이미 지나기
      // 때문이다. 가르지 못하는 시나리오는 두지 않는다(불변 사실 57).
      //
      // 정본은 10 → 12 → 14($r$ = 1.20 · 1.17). 길이 `i` 의 비용이 `i` 의 1 비트 수라서
      // 최대가 정확히 $\log_2 n$ 이다.
      run: (impl, n, ctx) => {
        impl.reset(n);
        fill(impl, n);
        for (let i = 0; i < n; i++) ctx.step(() => void impl.prefixSum(i));
      },
    },
    {
      covers: ["rangeSum"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // **왼쪽 끝을 옮기며 끝까지의 구간을 묻기.** 두 인자 중 하나를 `n` 으로 눌러 두고
      // 나머지 하나만 키운다(§규약2 시나리오 규칙 3). 폭이 `n` 에서 0 까지 줄어들므로
      // 훑는 계열의 최악 폭이 그 안에 있다.
      //
      // `ScanningRangeSums`(1,024 → 4,096 → 16,384 · $r = 4.00$)와
      // `BlockedPrefixSums`(94 → 190 → 382 · $r$ = 2.02 · 2.01)를 잡는다. 앞구간 합을
      // 미리 적어 두는 계열 둘은 여기서 상수라 통과한다 — 계약을 어겨서가 아니라
      // 계급 아래라서 통과하는 자리다(§규약2 「축3은 상한이 아니라 성장 계급을 판정한다」).
      //
      // 정본은 11 → 13 → 15($r$ = 1.18 · 1.15). 두 끝의 비트 수가 더해지므로 앞구간 하나를
      // 묻는 것보다 정확히 하나 크다(`n` 의 1 비트가 하나다).
      run: (impl, n, ctx) => {
        impl.reset(n);
        fill(impl, n);
        for (let i = 0; i < n; i++) ctx.step(() => void impl.rangeSum(i, n));
      },
    },
  ],
};
