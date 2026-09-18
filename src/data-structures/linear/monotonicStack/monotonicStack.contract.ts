/**
 * `linear/monotonicStack` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./monotonicStack.ts` 헤더 한 곳이고(규약1), 여기 있는
 * 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택). 축2는 공집합이다 — 헤더의
 * 불변식 절이 「없다」다.
 *
 * **배제해야 할 계열이 둘이고 서로 다른 행에서 걸린다.** 최댓값을 물을 때마다 훑는 구현은 `max` 에서,
 * 가장 큰 원소 하나만 기억하다 그것이 빠질 때 훑는 구현은 `pop` 에서 걸린다. `pop` 시나리오가 적대적인
 * 이유가 뒤엣것이다 — 오름차순으로 채우면 빼는 원소가 늘 그때의 최댓값이다(불변 사실 24).
 *
 * **스위트를 비교자에 대해 짓는 함수로 둔다.** 계약은 비교자를 주입받고 방향을 정하지 않으므로, 뒤집은
 * 비교자로 같은 스위트를 돌리면 참조 모델이 최솟값을 답해야 한다. 등록 · vector 는 오름차순 비교자로 지은
 * 객체 하나(`monotonicStackContract`)를 쓰고, 뒤집은 쪽은 하네스 자기시험이 축1로 돌린다
 * (`src/data-structures/_contract/runContract.monotonicStack.test.ts`).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 네 행(생성자 제외)을 그대로 옮긴 표면. */
export interface MonotonicStackContract<T> {
  push(item: T): void;
  pop(): T | null;
  peek(): T | null;
  max(): T | null;
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

type Comparator = (a: number, b: number) => number;

/**
 * 스위트가 쓰는 비교자. **방향은 계약의 일부가 아니다** — 뒤집으면 같은 코드가 최솟값을 답한다.
 * 스위트가 하나를 골라야 해서 고른 것뿐이다(`heap/priorityQueue` 의 `ascending` 과 같은 처리).
 */
export const ascending: Comparator = (a, b) => a - b;
/** 최솟값을 묻는 스택으로 접히는 쪽. 자기시험이 이 방향으로 축1을 한 번 더 돈다. */
export const descending: Comparator = (a, b) => b - a;

/** 같은 크기의 원소가 자주 겹치고 음수가 섞이도록 좁게 잡는다. */
function someValue(rng: () => number): number {
  return Math.floor(rng() * 24) - 8;
}

/** 담긴 원소를 전부 훑어 비교자 기준 가장 큰 것을 찾는다. 같은 크기면 먼저 본 것을 둔다. */
function modelMax(model: Model, compare: Comparator): number | null {
  if (model.length === 0) return null;
  let best = model[0] as number;
  for (const value of model) if (compare(value, best) > 0) best = value;
  return best;
}

export function monotonicStackSpec(
  compare: Comparator,
  name = "MonotonicStack",
): ContractSpec<MonotonicStackContract<number>, Model> {
  return {
    name,
    grade: "basic",
    model: () => [],

    ops: [
      {
        name: "push",
        arg: (rng) => someValue(rng),
        onImpl: (impl, arg) => {
          impl.push(arg as number);
        },
        onModel: (model, arg) => {
          model.push(arg as number);
        },
      },
      {
        name: "pop",
        arg: () => undefined,
        onImpl: (impl) => impl.pop(),
        onModel: (model) =>
          model.length === 0 ? null : (model.pop() as number),
      },
      {
        name: "peek",
        arg: () => undefined,
        onImpl: (impl) => impl.peek(),
        onModel: (model) =>
          model.length === 0 ? null : (model[model.length - 1] as number),
      },
      {
        name: "max",
        arg: () => undefined,
        onImpl: (impl) => impl.max(),
        onModel: (model) => modelMax(model, compare),
      },
    ],

    edges: [
      {
        name: "빈 스택에서 pop·peek·max 는 null 이고 상태를 바꾸지 않는다",
        steps: [
          { op: "pop" },
          { op: "peek" },
          { op: "max" },
          { op: "pop" },
          { op: "peek" },
          { op: "max" },
        ],
      },
      {
        name: "가장 큰 원소를 빼면 그 아래에서 가장 큰 원소가 답이 된다",
        steps: [
          { op: "push", arg: 3 },
          { op: "push", arg: 1 },
          { op: "push", arg: 5 },
          { op: "push", arg: 2 },
          { op: "max" },
          { op: "pop" },
          { op: "max" },
          { op: "pop" },
          { op: "max" },
          { op: "pop" },
          { op: "max" },
          { op: "pop" },
          { op: "max" },
        ],
      },
      {
        // 최댓값 곁 무더기에 「더 클 때만」 올리는 구현이 여기서 갈린다. 같은 크기 둘 중 하나를 빼면
        // 곁 무더기의 최댓값까지 빠진다.
        name: "같은 크기의 원소 둘 중 하나를 빼도 그 크기가 답으로 남는다",
        steps: [
          { op: "push", arg: 4 },
          { op: "push", arg: 4 },
          { op: "pop" },
          { op: "max" },
          { op: "pop" },
          { op: "max" },
        ],
      },
      {
        name: "나중에 넣은 작은 원소는 답을 바꾸지 않고, 빼도 답이 그대로다",
        steps: [
          { op: "push", arg: 5 },
          { op: "push", arg: 1 },
          { op: "push", arg: 2 },
          { op: "max" },
          { op: "peek" },
          { op: "pop" },
          { op: "pop" },
          { op: "max" },
          { op: "peek" },
        ],
      },
      {
        // 한 번 기억한 최댓값을 비울 때 지우지 않는 구현이 다음 채우기에서 갈린다.
        name: "비웠다가 다시 채우면 전에 담았던 원소가 답에 남지 않는다",
        steps: [
          { op: "push", arg: 9 },
          { op: "pop" },
          { op: "peek" },
          { op: "push", arg: 2 },
          { op: "max" },
          { op: "peek" },
        ],
      },
      {
        // 최댓값의 처음 값을 0 으로 잡는 구현이 여기서 갈린다.
        name: "음수만 담아도 그중 가장 큰 원소를 답한다",
        steps: [
          { op: "push", arg: -5 },
          { op: "push", arg: -3 },
          { op: "push", arg: -7 },
          { op: "max" },
          { op: "pop" },
          { op: "max" },
          { op: "pop" },
          { op: "pop" },
          { op: "max" },
        ],
      },
      {
        name: "꺼내는 순서가 넣은 순서의 역순이다",
        steps: [
          { op: "push", arg: 1 },
          { op: "push", arg: 2 },
          { op: "push", arg: 3 },
          { op: "pop" },
          { op: "max" },
          { op: "pop" },
          { op: "max" },
          { op: "pop" },
          { op: "peek" },
        ],
      },
    ],

    // 헤더의 불변식 절이 「없다」다. 최댓값을 읽는 경로가 `max` 하나이고, `peek`↔`pop` 의 정합은
    // 계약 줄이 이미 적는다 — 각 연산의 의미이고 축1의 몫이다.
    invariants: [],

    scenarios: [
      {
        // 상각이므로 n 회 측정한다(§규약2 시나리오 규칙 4). 무작위 값이라 같은 크기가 섞인다.
        covers: ["push"],
        qualifier: "amortized",
        bound: "O(1)",
        adversarial: false,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) {
            const value = Math.floor(ctx.rng() * n);
            ctx.step(() => impl.push(value));
          }
        },
      },
      {
        // **오름차순으로 채우고 전부 뺀다.** 빼는 원소가 늘 그때의 최댓값이라, 최댓값 하나만 기억하는
        // 구현이 뺄 때마다 남은 것을 다시 훑는다.
        covers: ["pop"],
        qualifier: "amortized",
        bound: "O(1)",
        adversarial: true,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) impl.push(i);
          for (let i = 0; i < n; i++) ctx.step(() => impl.pop());
        },
      },
      {
        // 오름차순으로 채운 뒤 하나 빼고(준비) 묻기를 되풀이한다. 빼기 뒤에 묻는 이유는 최댓값을
        // 묻는 호출에 몰아 다시 계산하는 계열이 빠진 자리를 매번 만나게 하려는 것이다.
        covers: ["max"],
        qualifier: "worst",
        bound: "O(1)",
        adversarial: false,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) impl.push(i);
          for (let i = 0; i < n / 2; i++) {
            impl.pop();
            ctx.step(() => {
              impl.max();
            });
          }
        },
      },
      {
        covers: ["peek"],
        qualifier: "worst",
        bound: "O(1)",
        adversarial: false,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) impl.push(i);
          for (let i = 0; i < n; i++) {
            ctx.step(() => {
              impl.peek();
            });
          }
        },
      },
    ],
  };
}

/** 등록 · vector · 실행부가 쓰는 스위트. 오름차순 비교자로 짓는다. */
export const monotonicStackContract = monotonicStackSpec(ascending);
