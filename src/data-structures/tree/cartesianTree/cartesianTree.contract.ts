/**
 * `tree/cartesianTree` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./cartesianTree.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 52 ④).** `runContract` 는 인자 없는 팩토리를 받아 그
 * 하나에 연산을 이어 붙이는데, 이 구조는 **생성자로 다 지어지고 그 뒤로 변하지 않는다.**
 * 그대로 넘기면 축1이 수열 하나에 대한 질의만 보게 된다.
 *
 * **껍데기가 자리 하나를 더 든다.** `left()`·`right()` 는 값이 아니라 **같은 계약을 만족하는
 * 객체**를 돌려주므로 하네스의 관측값이 될 수 없다. 껍데기는 지금 서 있는 마디를 자리로 들고
 * `goLeft`·`goRight` 로 한 걸음씩 옮긴다 — 그래야 훑기 시나리오가 재는 것이 **한 걸음의
 * 비용**이 된다. 걸음마다 뿌리에서 다시 내려가면 O(1) 행을 잴 수 없다.
 *
 * 껍데기는 **계약의 일부가 아니다.** 구조에도 없고 `check-contract.ts` 의 명세↔스텁·정본
 * 대조에도 걸리지 않는다(그 대조가 보는 것은 `<name>.ts` 와 `_reference/<name>.ts` 다).
 *
 * **n 은 색인한 수열의 길이다.** 담긴 원소의 수가 곧 수열의 길이이므로 둘이 갈리지 않는다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/**
 * 헤더 연산 계약 표의 **네 행**을 그대로 옮긴 표면. 생성자 행이 빠진 것은 그것을
 * `runContract` 의 팩토리와 `Walkable#rebuild` 가 나르기 때문이다.
 */
export interface CartesianTreeContract<T> {
  size(): number;
  value(): T | null;
  left(): CartesianTreeContract<T> | null;
  right(): CartesianTreeContract<T> | null;
  inOrder(): T[];
}

type Built<T> = CartesianTreeContract<T> & { __cost?: number };

/**
 * 하네스용 껍데기. `rebuild` 로 새 수열을 색인하고, 버린 트리의 비용은 이어서 센다.
 *
 * 자리(`#at`)는 지금 서 있는 부분트리다. 빈 트리에서는 뿌리 객체 자신이고, 그 객체의
 * `left()`·`right()` 가 `null` 이라 걸음이 막힌다.
 */
export class Walkable<T> {
  #make: (seq: readonly T[]) => Built<T>;
  #root: Built<T>;
  #at: Built<T>;
  #carried = 0;

  constructor(make: (seq: readonly T[]) => Built<T>) {
    this.#make = make;
    this.#root = make([]);
    this.#at = this.#root;
  }

  get __cost(): number {
    return this.#carried + (this.#root.__cost ?? 0);
  }

  rebuild(seq: readonly T[]): void {
    this.#carried += this.#root.__cost ?? 0;
    this.#root = this.#make(seq);
    this.#at = this.#root;
  }

  /** 자리를 뿌리로 되돌린다. 트리를 건드리지 않으므로 비용이 없다. */
  toRoot(): void {
    this.#at = this.#root;
  }

  goLeft(): boolean {
    const child = this.#at.left();
    if (child === null) return false;
    this.#at = child as Built<T>;
    return true;
  }

  goRight(): boolean {
    const child = this.#at.right();
    if (child === null) return false;
    this.#at = child as Built<T>;
    return true;
  }

  size(): number {
    return this.#at.size();
  }

  value(): T | null {
    return this.#at.value();
  }

  inOrder(): T[] {
    return this.#at.inOrder();
  }
}

/**
 * 축1 참조 모델. 트리를 짓지 않고 **수열과 구간 두 끝**만 든다.
 *
 * 부분트리에 담긴 값이 수열에서 반드시 붙어 있다는 것이 이 모델이 서는 자리다 — 그래서
 * 「지금 서 있는 마디」가 구간 `[lo, hi)` 하나로 적히고, 뿌리 값은 그 구간의 최솟값이다.
 */
interface Model<T> {
  seq: T[];
  lo: number;
  hi: number;
}

/**
 * 구간 `[lo, hi)` 에서 비교자 기준 최소가 서는 자리. 최소가 여럿이면 **가장 앞선 것**이다 —
 * 계약이 적은 「동등하면 수열에서 앞선 자리가 조상」이 이 한 줄이다.
 */
function argmin<T>(
  seq: readonly T[],
  lo: number,
  hi: number,
  compare: (a: T, b: T) => number,
): number {
  let best = lo;
  for (let i = lo + 1; i < hi; i++) {
    if (compare(seq[i] as T, seq[best] as T) < 0) best = i;
  }
  return best;
}

function numeric(a: number, b: number): number {
  return a - b;
}

/** 축1 무작위 시퀀스가 쓰는 수열. 값 범위가 좁아야 동등한 값이 생겨 처분 규칙이 걸린다. */
function someSeq(rng: () => number): number[] {
  const length = Math.floor(rng() * 9);
  const out: number[] = [];
  for (let i = 0; i < length; i++) out.push(Math.floor(rng() * 4));
  return out;
}

/** 축3 시나리오용 무작위 수열. 값 범위가 넓어 동등한 값이 드물다. */
function shuffled(n: number, rng: () => number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(Math.floor(rng() * n * 8));
  return out;
}

/** 오름차순 수열. 정하는 트리가 깊이 n 의 오른쪽 사슬이다. */
function ascending(n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) out.push(i);
  return out;
}

/**
 * 한 걸음 내려간다. 막히면 뿌리로 되돌린다.
 *
 * 되돌리기가 걸음 안에 들어 있는 것은 껍데기의 `toRoot` 가 트리를 건드리지 않아 비용이
 * 0 이기 때문이다 — 측정값에 들어오지 않는다.
 */
function descend(impl: Walkable<number>, rng: () => number): void {
  impl.size();
  impl.value();
  const first = rng() < 0.5;
  const moved = first
    ? impl.goLeft() || impl.goRight()
    : impl.goRight() || impl.goLeft();
  if (!moved) impl.toRoot();
}

export const cartesianTreeContract: ContractSpec<
  Walkable<number>,
  Model<number>
> = {
  name: "CartesianTree",
  grade: "complexity",
  model: () => ({ seq: [], lo: 0, hi: 0 }),

  ops: [
    {
      name: "rebuild",
      arg: (rng) => someSeq(rng),
      onImpl: (impl, arg) => {
        impl.rebuild(arg as number[]);
      },
      onModel: (model, arg) => {
        model.seq = [...(arg as number[])];
        model.lo = 0;
        model.hi = model.seq.length;
      },
    },
    {
      name: "toRoot",
      arg: () => undefined,
      onImpl: (impl) => {
        impl.toRoot();
      },
      onModel: (model) => {
        model.lo = 0;
        model.hi = model.seq.length;
      },
    },
    {
      name: "goLeft",
      arg: () => undefined,
      onImpl: (impl) => impl.goLeft(),
      onModel: (model) => {
        if (model.hi <= model.lo) return false;
        const at = argmin(model.seq, model.lo, model.hi, numeric);
        if (at === model.lo) return false;
        model.hi = at;
        return true;
      },
    },
    {
      name: "goRight",
      arg: () => undefined,
      onImpl: (impl) => impl.goRight(),
      onModel: (model) => {
        if (model.hi <= model.lo) return false;
        const at = argmin(model.seq, model.lo, model.hi, numeric);
        if (at + 1 === model.hi) return false;
        model.lo = at + 1;
        return true;
      },
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.hi - model.lo,
    },
    {
      name: "value",
      arg: () => undefined,
      onImpl: (impl) => impl.value(),
      onModel: (model) => {
        if (model.hi <= model.lo) return null;
        return model.seq[
          argmin(model.seq, model.lo, model.hi, numeric)
        ] as number;
      },
    },
    {
      name: "inOrder",
      arg: () => undefined,
      onImpl: (impl) => impl.inOrder(),
      onModel: (model) => model.seq.slice(model.lo, model.hi),
    },
  ],

  edges: [
    {
      name: "빈 수열 — 값도 자식도 없고 훑기가 빈 배열이다",
      steps: [
        { op: "size" },
        { op: "value" },
        { op: "goLeft" },
        { op: "goRight" },
        { op: "inOrder" },
      ],
    },
    {
      name: "한 값 — 뿌리뿐이라 어느 쪽으로도 못 내려간다",
      steps: [
        { op: "rebuild", arg: [7] },
        { op: "size" },
        { op: "value" },
        { op: "goLeft" },
        { op: "goRight" },
        { op: "inOrder" },
      ],
    },
    {
      name: "오름차순 — 왼쪽이 비고 오른쪽으로만 내려가는 사슬이다",
      steps: [
        { op: "rebuild", arg: [1, 2, 3, 4] },
        { op: "value" },
        { op: "goLeft" },
        { op: "goRight" },
        { op: "value" },
        { op: "size" },
        { op: "goRight" },
        { op: "value" },
        { op: "inOrder" },
      ],
    },
    {
      name: "내림차순 — 오른쪽이 비고 왼쪽으로만 내려가는 사슬이다",
      steps: [
        { op: "rebuild", arg: [4, 3, 2, 1] },
        { op: "value" },
        { op: "goRight" },
        { op: "goLeft" },
        { op: "value" },
        { op: "inOrder" },
        { op: "goLeft" },
        { op: "value" },
      ],
    },
    {
      name: "동등한 값 — 수열에서 앞선 자리가 조상이라 오른쪽이 찬다",
      steps: [
        { op: "rebuild", arg: [1, 1] },
        { op: "value" },
        { op: "goLeft" },
        { op: "goRight" },
        { op: "size" },
        { op: "value" },
        { op: "inOrder" },
      ],
    },
    {
      name: "동등한 최소가 셋 — 앞선 것이 뿌리이고 나머지는 오른쪽으로 이어진다",
      steps: [
        { op: "rebuild", arg: [2, 5, 2, 5, 2] },
        { op: "value" },
        { op: "size" },
        { op: "goRight" },
        { op: "inOrder" },
        { op: "goRight" },
        { op: "inOrder" },
      ],
    },
    {
      name: "골짜기 — 최솟값이 가운데면 양쪽 자식이 다 찬다",
      steps: [
        { op: "rebuild", arg: [5, 10, 1, 10, 5] },
        { op: "value" },
        { op: "goLeft" },
        { op: "inOrder" },
        { op: "value" },
        { op: "toRoot" },
        { op: "goRight" },
        { op: "inOrder" },
        { op: "value" },
      ],
    },
    {
      name: "다시 색인하면 앞의 수열도 서 있던 자리도 남지 않는다",
      steps: [
        { op: "rebuild", arg: [3, 1, 2] },
        { op: "goRight" },
        { op: "value" },
        { op: "rebuild", arg: [9] },
        { op: "value" },
        { op: "size" },
        { op: "inOrder" },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 판별 절차의 후보 셋이 전부 각 연산의 의미로 흡수되고,
  // 상태를 바꾸는 연산이 없어 축2가 축1보다 더 잡는 것도 없다(불변 사실 52 ①).
  invariants: [],

  scenarios: [
    {
      // 무작위 수열. **이 시나리오는 나눠 정복 결함을 잡지 못한다** — 무작위 입력에서 그
      // 나눔이 대체로 반씩 갈려 $\Theta(n\log n)$ 이 되고($r$ = 4.80·4.46 으로 허용 상단
      // 5.20 아래다), 로그 인수 하나는 축3의 해상도 아래다(불변 사실 53). 그래도 두는 이유는
      // 아래 적대적 시나리오가 잡는 것이 「입력이 나쁠 때만」임을 이 자리가 보이기
      // 때문이다(불변 사실 24).
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        const seq = shuffled(n, ctx.rng);
        ctx.step(() => impl.rebuild(seq));
      },
    },
    {
      // 오름차순. 나눠 정복이 여기서 한쪽으로만 몰려 이차가 되고 $r$ 이 15.99·16.00 이다.
      // 정본에게는 반대로 걷어낼 마디가 하나도 없는 가장 싼 입력이라 총비용이 무작위의
      // 5,109 에서 4,095 로 내려간다 — 적대성이 (계약, 구현) 쌍에 대해 정의된다는 것의
      // 실물이다(불변 사실 57).
      covers: ["constructor"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        const seq = ascending(n);
        ctx.step(() => impl.rebuild(seq));
      },
    },
    {
      // 훑기 네 행을 한 걸음에 묶는다. `size` 나 `value` 혼자로는 걸음이 안 생겨 같은
      // 마디를 되읽게 되고, 그러면 재는 것이 트리가 아니라 캐시다.
      //
      // 무작위 수열의 트리는 기대 깊이가 로그다. **깊이에 비례하는 걸음을 여기서 못 잡는다** —
      // `pathCopyingCartesianTree` 의 단일 걸음 최대가 18 → 22 → 24 로 $r$ 이 1.22·1.09 이고
      // 허용 상단 1.30 아래다(불변 사실 53). 아래 사슬 시나리오가 그 계열을 받는다.
      covers: ["size", "value", "left", "right"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.rebuild(shuffled(n, ctx.rng));
        for (let i = 0; i < n; i++) ctx.step(() => descend(impl, ctx.rng));
      },
    },
    {
      // 같은 훑기를 사슬에서 한다. 깊이가 마디 수와 같아 뿌리로 되돌아가는 일이 거의
      // 없고, 그래서 「한 걸음」이 정말 한 걸음인지가 여기서 갈린다.
      //
      // **이 시나리오가 혼자 잡는 계열이 실물로 있다.** 부분트리 객체가 뿌리부터의 길을
      // 복사해 드는 구현이 위 무작위 시나리오를 통과하고 여기서 1,026 → 4,099 → 16,386
      // ($r = 4.00$)으로 걸린다. 앞의 두 fixture 는 두 시나리오에서 똑같이 굴어 이 갈림을
      // 말하지 못한다 — 적대적 입력의 몫은 fixture 가 둘 이상이라야 보인다(불변 사실 118).
      covers: ["size", "value", "left", "right"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.rebuild(ascending(n));
        for (let i = 0; i < n; i++) ctx.step(() => descend(impl, ctx.rng));
      },
    },
    {
      // 사슬에서 훑는다. 되돌이 호출로 지은 구현이 사다리 맨 위에서 죽는 자리이기도 하다.
      covers: ["inOrder"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.rebuild(ascending(n));
        ctx.step(() => impl.inOrder());
      },
    },
  ],
};
