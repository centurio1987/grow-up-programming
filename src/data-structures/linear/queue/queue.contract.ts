/**
 * `linear/queue` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./queue.ts` 헤더 한 곳이고(규약1), 여기
 * 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `basic` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **`basic` 인데 적대적 시나리오가 하나 있다.** 엄격도가 적대적 입력을 요구하지 않을 뿐
 * 금지하지도 않는다. 배제해야 할 구현이 둘이고 **서로 반대쪽에서 걸리기 때문에** 두었다 —
 * 앞을 실제로 지우는 구현은 꺼내기에서, 앞에 끼워 넣는 구현은 넣기에서 걸린다. 한쪽만 두면
 * 다른 쪽이 통과한다(불변 사실 24).
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 세 행을 그대로 옮긴 표면. */
export interface QueueContract<T> {
  enqueue(item: T): void;
  dequeue(): T | null;
  front(): T | null;
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

export const queueContract: ContractSpec<QueueContract<number>, Model> = {
  name: "Queue",
  grade: "basic",
  model: () => [],

  ops: [
    {
      name: "enqueue",
      arg: (rng) => Math.floor(rng() * 100),
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
  ],

  edges: [
    {
      name: "빈 큐에서 dequeue·front 는 null 이고 상태를 바꾸지 않는다",
      steps: [
        { op: "dequeue" },
        { op: "front" },
        { op: "dequeue" },
        { op: "front" },
      ],
    },
    {
      name: "먼저 들어온 것이 먼저 나간다",
      steps: [
        { op: "enqueue", arg: 1 },
        { op: "enqueue", arg: 2 },
        { op: "enqueue", arg: 3 },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "dequeue" },
      ],
    },
    {
      name: "front 는 상태를 바꾸지 않고, 직후 dequeue 가 같은 값을 준다",
      steps: [
        { op: "enqueue", arg: 7 },
        { op: "enqueue", arg: 8 },
        { op: "front" },
        { op: "front" },
        { op: "dequeue" },
        { op: "front" },
      ],
    },
    {
      // 넣는 자리와 빼는 자리를 나눠 드는 구현이 갈리는 자리다. 다 뺀 뒤에 다시 넣으면
      // 빼는 쪽이 비어 있으므로 옮기기가 한 번 더 일어난다.
      name: "비웠다가 다시 채워도 순서가 어긋나지 않는다",
      steps: [
        { op: "enqueue", arg: 1 },
        { op: "enqueue", arg: 2 },
        { op: "dequeue" },
        { op: "dequeue" },
        { op: "front" },
        { op: "enqueue", arg: 3 },
        { op: "front" },
        { op: "dequeue" },
        { op: "front" },
      ],
    },
    {
      name: "넣기와 꺼내기를 번갈아 해도 한 칸짜리 큐가 된다",
      steps: [
        { op: "enqueue", arg: 1 },
        { op: "dequeue" },
        { op: "enqueue", arg: 2 },
        { op: "dequeue" },
        { op: "enqueue", arg: 3 },
        { op: "front" },
        { op: "dequeue" },
      ],
    },
    {
      name: "빈 큐에서 꺼낸 뒤에도 다음 넣기가 정상이다",
      steps: [
        { op: "dequeue" },
        { op: "enqueue", arg: 5 },
        { op: "front" },
        { op: "dequeue" },
        { op: "front" },
      ],
    },
  ],

  // 헤더의 불변식 절이 「없다」다. 두 행을 뺀 뒤 관측 경로가 둘인 성질은
  // `front`↔`dequeue` 하나뿐이고, 그 정합을 `front` 행이 이미 적고 있어 각 연산의
  // 의미이며 축1의 몫이다.
  invariants: [],

  scenarios: [
    {
      covers: ["enqueue"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) ctx.step(() => impl.enqueue(i));
      },
    },
    {
      // 전부 채우고 전부 뺀다. **명세의 반례가 정확히 이 자리에서 걸린다** — 앞을 실제로
      // 지우는 구현은 꺼낼 때마다 뒤 원소를 전부 당긴다.
      covers: ["dequeue"],
      qualifier: "amortized",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.enqueue(i);
        for (let i = 0; i < n; i++) ctx.step(() => impl.dequeue());
      },
    },
    // **넣기·꺼내기 교대 시나리오를 두지 않는다.** 실제로 지어 재 봤고 세 구현이 전부
    // 연산당 2.00 으로 같았다. 큐가 늘 한 칸이라 원소 수에 비례하는 구현도 그 자리에서는
    // 상수이기 때문이다. 같은 패턴이 `linear/deque` 에서는 최악이었다(B7 두 배열 덱
    // $r = 4.00$) — 적대성이 구현만이 아니라 **계약에 대해서도** 정의된다는 것의 사례이고,
    // 자리는 가이드다(§규약2).
    {
      covers: ["front"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: false,
      run: (impl, n, ctx) => {
        for (let i = 0; i < n; i++) impl.enqueue(i);
        for (let i = 0; i < n; i++) {
          ctx.step(() => {
            impl.front();
          });
        }
      },
    },
  ],
};
