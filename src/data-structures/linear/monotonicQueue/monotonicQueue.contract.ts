/**
 * `linear/monotonicQueue` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./monotonicQueue.ts` 헤더 한 곳이고(규약1), 여기 있는
 * 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `complexity` → 축3 엄격도는 `discriminating`(±30% · 3점 · 적대적 필수). 축2는 공집합이다 —
 * 헤더의 불변식 절이 「없다」다.
 *
 * **헤더 검증 등급 문단이 든 자명한 길 넷 중 셋을 결함 fixture 로 두었고, 셋이 서로 다른 행에서 걸린다.**
 * 적대적 입력이 구현마다 다르기 때문이다(불변 사실 24 · 57).
 * - `max` — 물을 때 훑는 구현. 어떤 입력에서든 걸린다.
 * - `dequeue` — 가장 큰 원소 하나만 들고 있는 구현. **내림차순으로 채워야** 빼는 원소가 늘 최댓값이다.
 * - `enqueue` — 칸마다 뒤쪽 최댓값을 올려 적는 구현. **앞선 것보다 큰 값이 이어 들어와야** 앞선 칸을 전부
 *   고친다.
 * 넷째 길(앞쪽 최댓값을 칸마다 적는 배열)은 fixture 로 두지 않았다 — 빼기마다 전부 다시 적으면 `dequeue` 가
 * 입력과 무관하게 비례해 둘째 fixture 보다 넓게 걸리고, 안 적으면 값이 틀려 축1이 잡는다(논증이고 실행하지
 * 않았다).
 *
 * **넣기 시나리오는 한정자 근거도 함께 잰다.** 내림차순 절반 뒤에 모두보다 큰 값을 넣으면 후보를 버리는
 * 계열이 그 한 호출에 절반을 버린다 — 상각으로는 통과하고 한 호출 최대로는 걸린다. 빼기 시나리오는 두
 * 무더기 계열이 같은 모양이다. 자기시험이 두 시나리오를 두 통계로 다시 잰다(불변 사실 195 의 방식).
 *
 * **스위트를 비교자에 대해 짓는 함수로 둔다**(`linear/monotonicStack` 과 같은 처리). 등록 · vector 는
 * 오름차순 비교자로 지은 객체 하나를 쓰고, 뒤집은 쪽은 자기시험이 축1로 돌린다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 여섯 행(생성자 제외)을 그대로 옮긴 표면. */
export interface MonotonicQueueContract<T> {
  enqueue(item: T): void;
  dequeue(): T | null;
  front(): T | null;
  max(): T | null;
  isEmpty(): boolean;
  size(): number;
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

type Comparator = (a: number, b: number) => number;

/**
 * 스위트가 쓰는 비교자. **방향은 계약의 일부가 아니다** — 뒤집으면 같은 코드가 최솟값을 답한다.
 * 스위트가 하나를 골라야 해서 고른 것뿐이다.
 */
export const ascending: Comparator = (a, b) => a - b;
/** 최솟값을 묻는 큐(물려받은 `slidingWindowMin` 의 자리)로 접히는 쪽. */
export const descending: Comparator = (a, b) => b - a;

/** 같은 크기의 원소가 자주 겹치고 음수가 섞이도록 좁게 잡는다. */
function someValue(rng: () => number): number {
  return Math.floor(rng() * 24) - 8;
}

/** 담긴 원소를 전부 훑어 비교자 기준 가장 큰 것을 찾는다. */
function modelMax(model: Model, compare: Comparator): number | null {
  if (model.length === 0) return null;
  let best = model[0] as number;
  for (const value of model) if (compare(value, best) > 0) best = value;
  return best;
}

export function monotonicQueueSpec(
  compare: Comparator,
  name = "MonotonicQueue",
): ContractSpec<MonotonicQueueContract<number>, Model> {
  return {
    name,
    grade: "complexity",
    model: () => [],

    ops: [
      {
        name: "enqueue",
        arg: (rng) => someValue(rng),
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
        onModel: (model) =>
          model.length === 0 ? null : (model.shift() as number),
      },
      {
        name: "front",
        arg: () => undefined,
        onImpl: (impl) => impl.front(),
        onModel: (model) => (model.length === 0 ? null : (model[0] as number)),
      },
      {
        name: "max",
        arg: () => undefined,
        onImpl: (impl) => impl.max(),
        onModel: (model) => modelMax(model, compare),
      },
      {
        name: "isEmpty",
        arg: () => undefined,
        onImpl: (impl) => impl.isEmpty(),
        onModel: (model) => model.length === 0,
      },
      {
        name: "size",
        arg: () => undefined,
        onImpl: (impl) => impl.size(),
        onModel: (model) => model.length,
      },
    ],

    edges: [
      {
        name: "빈 큐에서 dequeue·front·max 는 null 이고 상태를 바꾸지 않는다",
        steps: [
          { op: "dequeue" },
          { op: "front" },
          { op: "max" },
          { op: "size" },
          { op: "isEmpty" },
        ],
      },
      {
        name: "가장 큰 원소가 앞 끝으로 나가면 그 뒤에서 가장 큰 원소가 답이 된다",
        steps: [
          { op: "enqueue", arg: 5 },
          { op: "enqueue", arg: 1 },
          { op: "enqueue", arg: 3 },
          { op: "enqueue", arg: 2 },
          { op: "max" },
          { op: "dequeue" },
          { op: "max" },
          { op: "dequeue" },
          { op: "max" },
          { op: "dequeue" },
          { op: "max" },
          { op: "dequeue" },
          { op: "max" },
        ],
      },
      {
        // 후보를 버리는 구현이 원소까지 함께 버리면 여기서 갈린다. 작은 원소는 최댓값 후보에서 빠져도
        // 순서대로 나와야 한다.
        name: "뒤에 들어온 큰 원소에 가려진 작은 원소도 들어온 순서대로 나온다",
        steps: [
          { op: "enqueue", arg: 1 },
          { op: "enqueue", arg: 2 },
          { op: "enqueue", arg: 9 },
          { op: "max" },
          { op: "front" },
          { op: "dequeue" },
          { op: "dequeue" },
          { op: "max" },
          { op: "front" },
          { op: "size" },
        ],
      },
      {
        // 나가는 원소를 크기로 견주어 후보를 내리는 구현이 크기가 같은 원소 둘에서 갈린다 — 후보가 둘 중
        // 어느 것인지 크기만으로는 모른다.
        name: "같은 크기의 원소 둘 중 하나가 나가도 그 크기가 답으로 남는다",
        steps: [
          { op: "enqueue", arg: 4 },
          { op: "enqueue", arg: 4 },
          { op: "dequeue" },
          { op: "max" },
          { op: "dequeue" },
          { op: "max" },
        ],
      },
      {
        name: "같은 크기의 원소가 떨어져 있어도 앞의 것이 나간 뒤 뒤의 것이 답으로 남는다",
        steps: [
          { op: "enqueue", arg: 4 },
          { op: "enqueue", arg: 1 },
          { op: "enqueue", arg: 4 },
          { op: "dequeue" },
          { op: "max" },
          { op: "dequeue" },
          { op: "max" },
          { op: "front" },
        ],
      },
      {
        // 한 번 기억한 최댓값을 비울 때 지우지 않는 구현이 다음 채우기에서 갈린다.
        name: "비웠다가 다시 채우면 전에 담았던 원소가 답에 남지 않는다",
        steps: [
          { op: "enqueue", arg: 7 },
          { op: "dequeue" },
          { op: "isEmpty" },
          { op: "enqueue", arg: 2 },
          { op: "max" },
          { op: "front" },
          { op: "size" },
        ],
      },
      {
        // 최댓값의 처음 값을 0 으로 잡는 구현이 여기서 갈린다.
        name: "음수만 담아도 그중 가장 큰 원소를 답한다",
        steps: [
          { op: "enqueue", arg: -5 },
          { op: "enqueue", arg: -3 },
          { op: "enqueue", arg: -7 },
          { op: "max" },
          { op: "dequeue" },
          { op: "dequeue" },
          { op: "max" },
        ],
      },
      {
        // 넣는 무더기와 빼는 무더기를 나눠 드는 구현이 옮긴 직후 새로 넣은 원소와 옮긴 원소를 함께 견주는
        // 자리다.
        name: "한 번 빼고 난 뒤 새로 넣은 원소와 남은 원소를 함께 견준다",
        steps: [
          { op: "enqueue", arg: 2 },
          { op: "enqueue", arg: 6 },
          { op: "enqueue", arg: 1 },
          { op: "dequeue" },
          { op: "enqueue", arg: 3 },
          { op: "max" },
          { op: "dequeue" },
          { op: "max" },
          { op: "front" },
          { op: "dequeue" },
          { op: "max" },
        ],
      },
      {
        // 크기 3 창을 [1, 3, -1, -3, 5, 3, 6, 7] 위로 한 칸씩 민다. 물려받은 문서의 예시를 호출열로 옮겼다.
        name: "넣기와 빼기를 번갈아 창을 밀어도 창 안의 최댓값을 답한다",
        steps: [
          { op: "enqueue", arg: 1 },
          { op: "enqueue", arg: 3 },
          { op: "enqueue", arg: -1 },
          { op: "max" },
          { op: "dequeue" },
          { op: "enqueue", arg: -3 },
          { op: "max" },
          { op: "dequeue" },
          { op: "enqueue", arg: 5 },
          { op: "max" },
          { op: "dequeue" },
          { op: "enqueue", arg: 3 },
          { op: "max" },
          { op: "dequeue" },
          { op: "enqueue", arg: 6 },
          { op: "max" },
          { op: "dequeue" },
          { op: "enqueue", arg: 7 },
          { op: "max" },
        ],
      },
    ],

    // 헤더의 불변식 절이 「없다」다. 최댓값을 읽는 경로가 `max` 하나이고, `front`↔`dequeue` ·
    // `isEmpty`↔`size` 의 정합은 계약 줄이 이미 적는다 — 각 연산의 의미이고 축1의 몫이다.
    invariants: [],

    scenarios: [
      {
        // **내림차순으로 절반을 넣고, 모두보다 큰 값을 오름차순으로 절반 넣는다.** 뒤 절반의 넣기마다 앞선
        // 칸 전부가 새 원소보다 작으므로, 칸마다 뒤쪽 최댓값을 올려 적는 구현이 전부를 고친다. 후보를 버리는
        // 계열은 뒤 절반의 첫 넣기 하나가 절반을 버리고 나머지는 하나씩만 버린다 — 상각은 상수이고 한 호출
        // 최대는 n 에 비례한다(헤더 한정자 문단).
        covers: ["enqueue"],
        qualifier: "amortized",
        bound: "O(1)",
        adversarial: true,
        run: (impl, n, ctx) => {
          const half = n / 2;
          for (let i = 0; i < half; i++) ctx.step(() => impl.enqueue(half - i));
          for (let i = 0; i < half; i++) ctx.step(() => impl.enqueue(n + i));
        },
      },
      {
        // **내림차순으로 채우고 앞 끝에서 전부 뺀다.** 빼는 원소가 늘 그때의 최댓값이라, 가장 큰 원소 하나만
        // 들고 있는 구현이 뺄 때마다 남은 것을 다시 훑는다. 두 무더기 계열은 첫 빼기 하나가 전부를 옮긴다 —
        // 상각은 상수이고 한 호출 최대는 n 에 비례한다.
        covers: ["dequeue"],
        qualifier: "amortized",
        bound: "O(1)",
        adversarial: true,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) impl.enqueue(n - i);
          for (let i = 0; i < n; i++) ctx.step(() => impl.dequeue());
        },
      },
      {
        // 내림차순으로 채운 뒤 하나 빼고(준비) 묻기를 되풀이한다. 빼기 뒤에 묻는 이유는 최댓값을 묻는 호출에
        // 몰아 다시 계산하는 계열이 빠진 자리를 매번 만나게 하려는 것이다.
        covers: ["max"],
        qualifier: "worst",
        bound: "O(1)",
        adversarial: false,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) impl.enqueue(n - i);
          for (let i = 0; i < n / 2; i++) {
            impl.dequeue();
            ctx.step(() => {
              impl.max();
            });
          }
        },
      },
      {
        // 셋을 한 걸음에 묶는다 — `isEmpty` 혼자로는 잴 것이 없다(`linear/queue` 와 같은 처리).
        covers: ["front", "isEmpty", "size"],
        qualifier: "worst",
        bound: "O(1)",
        adversarial: false,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) impl.enqueue(Math.floor(ctx.rng() * n));
          for (let i = 0; i < n; i++) {
            ctx.step(() => {
              impl.front();
              impl.isEmpty();
              impl.size();
            });
          }
        },
      },
    ],
  };
}

/** 등록 · vector · 실행부가 쓰는 스위트. 오름차순 비교자로 짓는다. */
export const monotonicQueueContract = monotonicQueueSpec(ascending);
