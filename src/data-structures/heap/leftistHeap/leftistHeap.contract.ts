/**
 * `heap/leftistHeap` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./leftistHeap.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수).
 *
 * **껍데기를 하나 씌운다(불변 사실 52 ④).** `runContract` 는 인자 없는 팩토리로 받은
 * **하나**에 연산을 이어 붙이는데, 이 계약의 `merge` 는 **같은 계약을 만족하는 두 번째 큐**를
 * 인자로 받는다. 껍데기가 그 두 번째 큐를 짓고, 합칠 큐를 채우는 일(준비)과 합치는
 * 일(측정)을 갈라 준다 — 갈라 두지 않으면 합치기 시나리오가 재는 것이 합치기가 아니라
 * 채우기가 된다.
 *
 * **껍데기가 합치기의 두 약속을 한 관측으로 만든다.** 계약이 적은 것은 「넘겨받은 큐의
 * 원소가 전부 이 큐로 오고, 넘겨받은 큐는 빈다」이고 그 둘은 서로 다른 객체에서 읽힌다.
 * `absorb()` 가 두 크기를 쌍으로 돌려주므로 축1이 호출 자리에서 둘 다 본다.
 *
 * 껍데기는 **계약의 일부가 아니다.** 구조에도 없고 `check-contract.ts` 의 명세↔스텁·정본
 * 대조에도 걸리지 않는다(그 대조가 보는 것은 `<name>.ts` 와 `_reference/<name>.ts` 다).
 * 버려진 큐가 쓴 걸음은 껍데기가 이어서 센다 — 합치기의 비용이 두 객체에 갈려 쌓이므로
 * 한쪽만 세면 절반을 놓친다.
 *
 * **n 은 담긴 원소 수다.** `merge` 행에서만 「합친 뒤의 원소 수」로 읽는다 — 계약 표가 그
 * 행에 대해 그렇게 정의한다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 여섯 행을 그대로 옮긴 표면. */
export interface MergeableQueue<T> {
  enqueue(item: T): void;
  dequeue(): T | null;
  merge(other: MergeableQueue<T>): void;
  peek(): T | null;
  size(): number;
  isEmpty(): boolean;
}

type Measured<T> = MergeableQueue<T> & { __cost?: number };

/**
 * 하네스용 껍데기. 합칠 큐를 따로 짓고(`stage`) 합치는 일만 걸음으로 잰다(`absorb`).
 *
 * `stage` 를 `absorb` 와 갈라 둔 이유가 축3에 있다 — 두 일을 한 메서드에 묶으면
 * `ctx.step` 이 채우기까지 함께 재고, 그러면 합치기 행의 성장률이 채우기의 성장률이 된다.
 */
export class MergeSite<T> {
  readonly #make: () => Measured<T>;
  #main: Measured<T>;
  #staged: Measured<T> | null = null;
  /** 합쳐져 비워진 큐가 쓴 걸음. 그 객체를 놓아 버리기 전에 옮겨 담는다. */
  #carried = 0;

  constructor(make: () => Measured<T>) {
    this.#make = make;
    this.#main = make();
  }

  get __cost(): number {
    return (
      this.#carried + (this.#main.__cost ?? 0) + (this.#staged?.__cost ?? 0)
    );
  }

  enqueue(item: T): void {
    this.#main.enqueue(item);
  }

  dequeue(): T | null {
    return this.#main.dequeue();
  }

  peek(): T | null {
    return this.#main.peek();
  }

  size(): number {
    return this.#main.size();
  }

  isEmpty(): boolean {
    return this.#main.isEmpty();
  }

  /** 합칠 큐를 지어 채운다. 준비 작업이므로 `ctx.step` 밖에서 부른다. */
  stage(values: readonly T[]): void {
    const other = this.#make();
    for (const value of values) other.enqueue(value);
    this.#staged = other;
  }

  /** 지어 둔 큐를 합치고 `[이 큐의 크기, 넘겨받은 큐의 크기]` 를 돌려준다. */
  absorb(): [number, number] {
    const other = this.#staged;
    if (other === null) throw new Error("합칠 큐를 먼저 지어야 한다");

    this.#main.merge(other);
    const left = other.size();
    const mine = this.#main.size();
    this.#carried += other.__cost ?? 0;
    this.#staged = null;
    return [mine, left];
  }
}

/**
 * 축1 참조 모델. 순서 없는 배열 하나이고 최우선 원소는 매번 훑어 찾는다 — 축1은 의미만
 * 보므로 자명한 구현으로 충분하다. 합치기는 두 배열을 이어 붙이는 일이다.
 */
type Model = number[];

/** 같은 우선순위 원소가 자주 겹치도록 좁게 잡는다. */
const DOMAIN = 24;

/** 합칠 큐에 담는 원소 수의 상한. 빈 큐를 합치는 자리도 나오도록 0 을 포함한다. */
const MERGE_BATCH = 5;

/**
 * 호출 **하나**를 재는 시나리오가 같은 상태를 다시 만드는 횟수.
 *
 * `worst` 통계는 걸음별 최댓값이라 표본이 하나면 그 하나의 흔들림이 곧 판정이 된다. 세 번
 * 재고 최댓값을 취하면 사다리 세 점이 같은 뜻의 값을 갖는다.
 */
const ROUNDS = 3;

/**
 * 스위트가 쓰는 비교자. 원소 타입은 `number` 다(§규약2).
 *
 * **이 방향은 계약의 일부가 아니다.** 계약은 비교자를 주입받고 「최우선」을 그 비교자로
 * 정의한다. 스위트가 하나를 골라야 해서 고른 것뿐이다.
 */
export const ascending = (a: number, b: number): number => a - b;

function modelTop(model: Model): number | null {
  if (model.length === 0) return null;
  let best = model[0] as number;
  for (const value of model) if (value < best) best = value;
  return best;
}

function modelDequeue(model: Model): number | null {
  const top = modelTop(model);
  if (top === null) return null;
  model.splice(model.indexOf(top), 1);
  return top;
}

export const leftistHeapContract: ContractSpec<MergeSite<number>, Model> = {
  name: "LeftistHeap",
  grade: "complexity",
  model: () => [],

  ops: [
    {
      name: "enqueue",
      arg: (rng) => Math.floor(rng() * DOMAIN),
      onImpl: (impl, arg) => {
        impl.enqueue(arg as number);
      },
      onModel: (model, arg) => {
        model.push(arg as number);
      },
    },
    {
      name: "dequeue",
      arg: () => undefined,
      onImpl: (impl) => impl.dequeue(),
      onModel: (model) => modelDequeue(model),
    },
    {
      name: "merge",
      // 합칠 큐에 담을 원소들. 빈 배열이면 빈 큐를 합치는 자리다.
      arg: (rng) => {
        const count = Math.floor(rng() * (MERGE_BATCH + 1));
        return Array.from({ length: count }, () => Math.floor(rng() * DOMAIN));
      },
      onImpl: (impl, arg) => {
        impl.stage(arg as number[]);
        return impl.absorb();
      },
      onModel: (model, arg) => {
        for (const value of arg as number[]) model.push(value);
        // 합친 뒤 이 큐의 크기와 넘겨받은 큐의 크기. 뒤엣것이 0 인 것이 「비운다」다.
        return [model.length, 0];
      },
    },
    {
      name: "peek",
      arg: () => undefined,
      onImpl: (impl) => impl.peek(),
      onModel: (model) => modelTop(model),
    },
    {
      name: "size",
      arg: () => undefined,
      onImpl: (impl) => impl.size(),
      onModel: (model) => model.length,
    },
    {
      name: "isEmpty",
      arg: () => undefined,
      onImpl: (impl) => impl.isEmpty(),
      onModel: (model) => model.length === 0,
    },
  ],

  edges: [
    {
      name: "빈 큐의 조회는 전부 비어 있음을 말하고 상태를 바꾸지 않는다",
      steps: [
        { op: "peek" },
        { op: "size" },
        { op: "isEmpty" },
        { op: "dequeue" },
        { op: "size" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      // 빈 큐가 양쪽에 오는 자리. 합치기를 특별 취급하는 구현이 여기서 갈린다.
      name: "빈 큐끼리 합쳐도 비어 있고 빈 큐를 합쳐도 그대로다",
      steps: [
        { op: "merge", arg: [] },
        { op: "isEmpty" },
        { op: "enqueue", arg: 4 },
        { op: "merge", arg: [] },
        { op: "size" },
        { op: "peek" },
        { op: "merge", arg: [2] },
        { op: "peek" },
        { op: "size" },
      ],
    },
    {
      name: "합친 뒤에는 두 큐를 통틀어 앞선 것부터 나온다",
      steps: [
        { op: "enqueue", arg: 9 },
        { op: "enqueue", arg: 5 },
        { op: "merge", arg: [7, 1, 3] },
        { op: "peek" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      // 「비운다」의 관측 자리. 껍데기가 합친 큐를 그대로 다시 쓰지 않으므로, 이 경계가 보는
      // 것은 합친 직후의 크기 쌍이다.
      name: "합치면 넘겨받은 큐가 비고 이 큐가 그만큼 는다",
      steps: [
        { op: "enqueue", arg: 2 },
        { op: "merge", arg: [8, 6, 4] },
        { op: "size" },
        { op: "merge", arg: [] },
        { op: "size" },
        { op: "dequeue" },
        { op: "merge", arg: [1] },
        { op: "peek" },
        { op: "size" },
      ],
    },
    {
      // 집합이 아니다. 같은 우선순위 원소가 양쪽에 있어도 담은 수만큼 나온다.
      name: "같은 원소가 양쪽에 있으면 합친 수만큼 담긴다",
      steps: [
        { op: "enqueue", arg: 5 },
        { op: "enqueue", arg: 5 },
        { op: "merge", arg: [5, 5] },
        { op: "size" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      // 최우선 원소가 합치기로 뒤늦게 들어오는 자리. 앞의 것을 캐시해 두고 합치기에서
      // 갱신을 빠뜨린 구현이 여기서 갈린다.
      name: "합치기로 들어온 원소가 최우선이면 보기가 따라 바뀐다",
      steps: [
        { op: "enqueue", arg: 5 },
        { op: "enqueue", arg: 3 },
        { op: "peek" },
        { op: "merge", arg: [1] },
        { op: "peek" },
        { op: "dequeue" },
        { op: "peek" },
        { op: "merge", arg: [4, 2] },
        { op: "peek" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
    {
      name: "peek 은 몇 번을 불러도 상태를 바꾸지 않는다",
      steps: [
        { op: "enqueue", arg: 2 },
        { op: "enqueue", arg: 1 },
        { op: "peek" },
        { op: "peek" },
        { op: "peek" },
        { op: "size" },
        { op: "dequeue" },
        { op: "size" },
        { op: "peek" },
      ],
    },
    {
      name: "전부 비웠다가 합치기로 다시 채워도 정상이다",
      steps: [
        { op: "enqueue", arg: 2 },
        { op: "dequeue" },
        { op: "isEmpty" },
        { op: "merge", arg: [8, 6] },
        { op: "peek" },
        { op: "size" },
        { op: "dequeue" },
        { op: "peek" },
        { op: "dequeue" },
        { op: "isEmpty" },
      ],
    },
  ],

  // 헤더 불변식 절이 「없다」이므로 빈 배열이다. 항목을 지우는 것과 다르다.
  invariants: [],

  scenarios: [
    {
      covers: ["enqueue"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **오름차순 넣기.** 새 원소가 늘 뒤에 서므로 담는 모양을 고쳐 쓰는 계열은 매 호출이
      // 가장 깊은 자리까지 내려간다. 내림차순이 아니라 오름차순인 것은 실측이 정했다 —
      // 합치기로 넣는 계열에서는 새 원소가 최우선이면 뿌리에서 한 걸음에 끝나므로(정본이
      // 2.00 고정) 내림차순 시나리오는 이 행에서 **아무것도 재지 못한다**
      // (불변 사실 57: 적대성은 (계약, 구현) 쌍에 대해 정의된다).
      //
      // **그 선택의 대가가 있다.** 담는 쪽 계약(`heap/priorityQueue`)은 적대적 입력이
      // 내림차순이라 정렬해 두는 계열에 최선이었고, 그래서 그 계열을 무작위 시나리오가
      // 혼자 잡았다. 여기서는 오름차순이 정렬해 두는 계열에도 최악이라(1,024 · 4,096 ·
      // 16,384) 두 시나리오가 **같은 계열을 잡는다.**
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.enqueue(i));
      },
    },
    {
      covers: ["enqueue"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // **무작위 넣기.** 자리를 유지하는 계열(늘 정렬해 두는 배열)이 뒤를 미는 일을 절반씩
      // 하므로 987 · 3,991 · 16,332 로 걸린다. 위 시나리오도 같은 계열을 잡으므로 이 행에서
      // 둘이 겨누는 계열은 하나다 — 그래도 두는 이유는 정본의 걸음이 갈리기 때문이다
      // (9 · 10 · 12 대 11 · 13 · 15). **계약이 요구하는 계급을 재는 것은 위쪽이고**,
      // 이쪽은 그 계급이 입력 모양에 기대지 않는다는 것을 잰다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) {
          const value = Math.floor(ctx.rng() * n * 4);
          ctx.step(() => impl.enqueue(value));
        }
      },
    },
    {
      covers: ["dequeue"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **넣기 n 번 뒤 빼기 한 번.** 이 계약이 빼기를 `worst` 로 적은 것이 사는 자리다 —
      // 갱신을 미뤄 두었다 빼기 때 한꺼번에 접는 계열은 그 한 호출이 담긴 수에 비례하고,
      // 시퀀스 평균으로 재면 그 하나가 묻힌다(불변 사실 63).
      //
      // 같은 상태를 ROUNDS 번 다시 만든다. 재는 것이 호출 하나뿐이라 한 번만 재면 통계가
      // 그 한 번의 흔들림을 그대로 물려받는다 — 비우고 다시 채우는 일은 걸음 밖이다.
      run: (impl, n, ctx) => {
        for (let round = 0; round < ROUNDS; round++) {
          while (!impl.isEmpty()) impl.dequeue();
          for (let i = 0; i < n; i++)
            impl.enqueue(Math.floor(ctx.rng() * n * 4));
          ctx.step(() => {
            impl.dequeue();
          });
        }
      },
    },
    {
      covers: ["dequeue"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: false,
      // **크기를 n 으로 유지하며 번갈아 부르기.** 빼기 하나가 늘 원소 n 개짜리 구조에서
      // 일어나고, 이 행에서 **호출을 n 번 재는 유일한 시나리오**다. 위 시나리오는 호출 셋을
      // 재므로 「그 하나가 얼마나 비싼가」를 보고 이쪽은 「n 번 부르는 동안 가장 비싼 호출이
      // 얼마인가」를 본다.
      //
      // 미뤄 두었다 접는 계열은 여기서도 걸리지만(903 · 1,577 · 10,086) 걸리는 이유가 위와
      // 같다 — 채우기가 끝난 뒤의 첫 빼기가 밀린 일을 갚는다. 두 시나리오가 겨누는 계열이
      // 갈리지 않는다는 사실을 여기 적어 둔다.
      //
      // **그래도 이 시나리오가 하는 일이 따로 있다.** 한정자만 `amortized` 로 바꿔 같은
      // 입력을 다시 재면 그 계열이 **통과한다**(평균 14.54 · 17.52 · 20.73). 위 시나리오는
      // 호출을 셋만 재므로 그 비교를 할 수 없다(상각은 n 회 측정을 요구한다 — §규약2
      // 시나리오 규칙 4). **이 계약이 `worst` 로 배제하는 것이 무엇인지를 수치로 보이는
      // 자리가 여기뿐이다**(불변 사실 63).
      //
      // 넣는 호출은 걸음에 넣지 않는다. 재려는 것이 빼기의 비용이기 때문이다.
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.enqueue(Math.floor(ctx.rng() * n * 4));
        for (let i = 0; i < n; i++) {
          impl.enqueue(Math.floor(ctx.rng() * n * 4));
          ctx.step(() => {
            impl.dequeue();
          });
        }
      },
    },
    {
      covers: ["merge"],
      qualifier: "worst",
      bound: "O(log n)",
      adversarial: true,
      // **같은 크기 둘 합치기.** 합친 뒤 원소가 n 개가 되도록 양쪽을 n/2 씩 채우고 한 번
      // 합친다. 이 행이 이 계약을 기본 우선순위 큐(`heap/priorityQueue`)와 가르는 자리이고,
      // 두 큐를 하나로 접는 일을 원소 수에 비례하게 하는 계열이 여기서 걸린다.
      //
      // 채우기는 걸음 밖이고, 같은 상태를 ROUNDS 번 다시 만든다 — 재는 것이 호출 하나뿐이라
      // 한 번만 재면 통계가 그 한 번의 흔들림을 그대로 물려받는다.
      run: (impl, n, ctx) => {
        const half = n >> 1;
        for (let round = 0; round < ROUNDS; round++) {
          while (!impl.isEmpty()) impl.dequeue();
          for (let i = 0; i < half; i++)
            impl.enqueue(Math.floor(ctx.rng() * n * 4));
          impl.stage(
            Array.from({ length: n - half }, () =>
              Math.floor(ctx.rng() * n * 4),
            ),
          );
          ctx.step(() => {
            impl.absorb();
          });
        }
      },
    },
    {
      covers: ["peek", "size", "isEmpty"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      // 세 조회를 한 걸음으로 묶어 잰다. 세 행이 같은 상한·한정자라 갈라 잴 이유가 없다.
      //
      // **합치기를 섞어 채운다.** 최우선 자리를 합치기에서만 훑어 찾는 계열은 채우기가
      // 넣기뿐이면 드러나지 않는다.
      //
      // **채우는 수가 n 이 아니라 n-1 인 것이 이 시나리오의 적대성이다.** 사다리의 n 이
      // 2의 거듭제곱이라, 나무를 차수별로 세우는 계열은 정확히 n 개를 담으면 자리가
      // **하나**만 찬다(1024 = 2^10). 그 상태에서 뿌리 목록을 훑어 답하는 구현이 상수로
      // 보이므로 이 행이 아무것도 재지 못한다. 하나 모자라게 채우면 자리가 전부 차서
      // 훑기가 자릿수에 비례한다 — 실측 4.00 고정에서 13 · 15 · 17 로 바뀐다.
      // (그래도 판정은 통과다. 로그 인수 하나는 축3의 해상도 아래다 — 불변 사실 53·62.)
      run: (impl, n, ctx) => {
        let filled = 0;
        while (filled + 2 <= n - 1) {
          impl.enqueue(Math.floor(ctx.rng() * n * 4));
          impl.stage([Math.floor(ctx.rng() * n * 4)]);
          impl.absorb();
          filled += 2;
        }
        while (filled < n - 1) {
          impl.enqueue(Math.floor(ctx.rng() * n * 4));
          filled += 1;
        }

        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.peek();
            impl.size();
            impl.isEmpty();
          });
        }
      },
    },
  ],
};
