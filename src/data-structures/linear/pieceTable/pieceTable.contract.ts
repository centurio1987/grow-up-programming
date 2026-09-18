/**
 * `linear/pieceTable` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./pieceTable.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택).
 *
 * **껍데기가 없다.** 생성자가 인자를 받지 않으므로 `runContract` 의 인자 없는 팩토리에 그대로
 * 들어간다. 크기 사다리는 시나리오가 `insert` 로 직접 올린다.
 *
 * **범위 밖 인자를 관측값으로 만든다.** 계약이 `insert`·`delete` 자리에 `RangeError` 를 적었는데
 * 하네스는 던진 것을 값으로 대조하지 못한다. 그래서 양쪽을 같은 방식으로 감싸 문자열 하나로
 * 바꾼다. `RangeError` 가 아닌 예외는 그대로 올려보낸다(스텁의 `Not implemented` 가 통과로
 * 읽히면 안 된다). `linear/gapBuffer` 스위트와 같은 처리다.
 *
 * **무작위 인자를 작은 자리에 몰리게 뽑는다.** 넣는 원소는 0~5 개, 지우는 수는 -1~3 이고 자리는
 * 두 난수의 곱으로 -1~38 에서 뽑는다(`nearOffset`). seed 1 의 500 회에서 담긴 수가 0~88(평균 36.5)이고
 * 범위 밖이 넣기 57/133 · 지우기 48/116 이다(`docs/ORD-006-runbook.md` 불변 사실 99).
 *
 * **시나리오는 상한의 파라미터마다 끝을 고정한다**(§규약2 「상한의 파라미터가 n 이 아니면
 * 시나리오가 그 파라미터를 양 끝에 고정한다」). 이 계약의 파라미터는 넷이다 — 담긴 수 n,
 * 지금까지의 편집 수 m, 넣는 원소 수 k, 그리고 m 이 허락하는 만큼 늘어난 조각이다(마지막은
 * 계약의 말이 아니라 `length` 행이 겨누는 입력의 모양이다).
 *
 * | 시나리오 | 고정 | bound |
 * |---|---|---|
 * | 넣기 · 편집 적게 | m ≤ 64 · k = 1 | `O(1)` |
 * | 넣기 · 크게 넣기 | m ≤ 8 · k = n | `O(n)` |
 * | 지우기 · 편집 적게 | m ≤ 64 · 지우는 수 = n | `O(1)` |
 * | 길이 · 편집 많이 | m = n(끝에 하나씩 붙이기) | `O(1)` |
 * | 열거 · 편집 적게 | m = 1 | `O(n)` |
 * | 열거 · 편집 많이 | m = n(앞 하나씩 지우기) | `O(n)` |
 *
 * **편집 행의 「편집 많이」 끝은 두지 않았다.** 그 끝의 bound 는 `O(n)` 인데, 그 자리에서만 걸리는
 * 결함 계열을 찾지 못했다(불변 사실 57 — 아무것도 가르지 못하는 시나리오는 두지 않는다). 거기서
 * 걸리는 것은 조각을 균형 트리에 두는 구현처럼 **계약보다 빠른** 것뿐이다(불변 사실 49).
 *
 * **편집 행이 전부 `worst` 인 것이 스위트 모양을 정한다.** `amortized` 는 n 회 측정을 요구하는데
 * (§규약2 시나리오 규칙 4) n 번 편집하면 m 이 n 이 되어 「편집 적게」 끝을 잴 수 없다. 이 사정은
 * `./pieceTable.ts` 헤더 「연산 계약」에 있다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 **세 행**(생성자 제외)을 그대로 옮긴 표면. */
export interface PieceTableContract<T> {
  insert(offset: number, items: readonly T[]): void;
  delete(offset: number, count: number): void;
  toArray(): T[];
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

/**
 * 축1 참조 모델. 배열 하나에 담는다 — 축1은 의미만 보고 비용은 보지 않으므로 자명한 구현으로
 * 충분하다. 같은 모양이 축3에서는 결함 fixture 가 된다(`_contract/_fixtures/splicingOffsetSequence.ts`).
 */
interface Model {
  items: number[];
}

function modelInsert(model: Model, arg: unknown): unknown {
  const [offset, items] = arg as [number, number[]];
  if (!Number.isInteger(offset) || offset < 0 || offset > model.items.length) {
    return OUT_OF_RANGE;
  }
  model.items.splice(offset, 0, ...items);
  return undefined;
}

function modelDelete(model: Model, arg: unknown): unknown {
  const [offset, count] = arg as [number, number];
  if (
    !Number.isInteger(offset) ||
    !Number.isInteger(count) ||
    offset < 0 ||
    count < 0 ||
    offset + count > model.items.length
  ) {
    return OUT_OF_RANGE;
  }
  model.items.splice(offset, count);
  return undefined;
}

/**
 * 무작위 자리. **작은 자리에 몰리게** 두 난수를 곱해 -1 이상 39 미만에서 뽑는다 — 인자 생성기가
 * 모델을 못 받으므로(`_contract/runContract.ts` 의 `BehaviorOp.arg`) 담긴 수를 보고 고를 수 없다.
 * 고르게 뽑으면 담긴 수가 작을 때 넣기가 대부분 범위 밖이라 수열이 비어 있는 채로 머문다.
 */
function nearOffset(rng: () => number): number {
  return Math.floor(rng() * rng() * 40) - 1;
}

/** `0, 1, …, count - 1` 에 `base` 를 더한 배열. 시나리오가 넣는 원소다. */
export function block(count: number, base = 0): number[] {
  return Array.from({ length: count }, (_, i) => base + i);
}

export const pieceTableContract: ContractSpec<
  PieceTableContract<number>,
  Model
> = {
  name: "PieceTable",
  grade: "invariant",
  model: () => ({ items: [] }),

  ops: [
    {
      name: "insert",
      arg: (rng) => {
        const offset = nearOffset(rng);
        const items = block(Math.floor(rng() * 6), Math.floor(rng() * 100));
        return [offset, items];
      },
      onImpl: (impl, arg) =>
        observe(() => {
          const [offset, items] = arg as [number, number[]];
          impl.insert(offset, items);
        }),
      onModel: (model, arg) => modelInsert(model, arg),
    },
    {
      name: "delete",
      arg: (rng) => [nearOffset(rng), Math.floor(rng() * 5) - 1],
      onImpl: (impl, arg) =>
        observe(() => {
          const [offset, count] = arg as [number, number];
          impl.delete(offset, count);
        }),
      onModel: (model, arg) => modelDelete(model, arg),
    },
    {
      name: "toArray",
      arg: () => undefined,
      onImpl: (impl) => impl.toArray(),
      onModel: (model) => [...model.items],
    },
  ],

  edges: [
    {
      name: "빈 수열은 길이 0 이고 빈 넣기 · 0 개 지우기는 아무것도 바꾸지 않는다",
      steps: [
        { op: "toArray" },
        { op: "toArray" },
        { op: "insert", arg: [0, []] },
        { op: "delete", arg: [0, 0] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      // 이 계약이 `linear/gapBuffer` 와 갈리는 표면이다 — 커서가 아니라 **자리를 인자로** 받고,
      // 한 번에 여러 원소를 넣는다.
      name: "앞 · 끝 · 조각 가운데에 여러 원소를 한 번에 넣는다",
      steps: [
        { op: "insert", arg: [0, [1, 2, 3]] },
        { op: "insert", arg: [3, [4]] },
        { op: "insert", arg: [0, [0]] },
        { op: "insert", arg: [2, [9, 8]] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      name: "여러 번 넣은 자리를 가로질러 한 번에 지운다",
      steps: [
        { op: "insert", arg: [0, [1, 2, 3, 4]] },
        { op: "insert", arg: [2, [7, 8]] },
        { op: "insert", arg: [6, [5]] },
        { op: "toArray" },
        { op: "delete", arg: [1, 5] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      // 경계가 「0 이상 담긴 원소 수 이하」인 인자라 위쪽 끝이 담긴 원소 수 자신이다(불변 사실 166).
      name: "넣을 자리는 0 과 담긴 원소 수를 포함하고 그 밖은 RangeError 다",
      steps: [
        { op: "insert", arg: [0, [1, 2]] },
        { op: "insert", arg: [2, [3]] },
        { op: "insert", arg: [4, [9]] },
        { op: "insert", arg: [-1, [9]] },
        { op: "insert", arg: [1.5, [9]] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      // 지우는 구간의 끝이 담긴 원소 수에 닿는 호출은 받고, 넘는 호출은 상태를 안 바꾸고 던진다.
      name: "지우는 구간이 끝에 닿으면 받고 넘거나 음수 · 정수 아님이면 RangeError 다",
      steps: [
        { op: "insert", arg: [0, [1, 2, 3, 4]] },
        { op: "delete", arg: [2, 3] },
        { op: "delete", arg: [-1, 1] },
        { op: "delete", arg: [0, -1] },
        { op: "delete", arg: [0, 0.5] },
        { op: "delete", arg: [4, 0] },
        { op: "toArray" },
        { op: "delete", arg: [2, 2] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      // 한 칸씩 뒤로 물러나며 넣는 입력 — 넣기마다 앞의 넣기를 가르므로 조각이 편집 수만큼 는다.
      name: "한 칸씩 물러나며 넣고 그 가운데를 지운다",
      steps: [
        { op: "insert", arg: [0, [1, 2]] },
        { op: "insert", arg: [1, [3]] },
        { op: "insert", arg: [1, [4]] },
        { op: "insert", arg: [1, [5]] },
        { op: "toArray" },
        { op: "delete", arg: [2, 2] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
    {
      name: "넣은 자리를 그대로 지우면 넣기 전으로 돌아간다",
      steps: [
        { op: "insert", arg: [0, [1, 2, 3, 4, 5]] },
        { op: "insert", arg: [2, [8, 9]] },
        { op: "delete", arg: [2, 2] },
        { op: "toArray" },
        { op: "insert", arg: [5, [6]] },
        { op: "delete", arg: [0, 6] },
        { op: "toArray" },
        { op: "toArray" },
      ],
    },
  ],

  invariants: [],

  scenarios: [
    {
      // **이 계약 고유의 자리다.** 한 번에 n 개를 넣어 긴 수열을 만든 뒤 앞 · 끝 · 가운데 ·
      // 무작위 자리를 돌며 한 개씩 넣는다. 편집이 64 번을 넘지 않으므로 행의 상한 `O(m + k)` 가
      // 여기서 `O(1)` 이다. **수열을 한 줄로 들고 뒤를 미는 계열과, 넣을 자리까지 원소를 옮겨
      // 가는 계열이 여기서 걸린다** — 둘 다 한 번의 편집이 담긴 수에 비례한다.
      covers: ["insert"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.insert(0, block(n));
        for (let i = 0; i < 32; i++) {
          const length = n + i;
          const offsets = [
            0,
            length,
            length >> 1,
            Math.floor(ctx.rng() * (length + 1)),
          ];
          const offset = offsets[i % 4] as number;
          ctx.step(() => impl.insert(offset, [i]));
        }
      },
    },
    {
      // 같은 행을 k 쪽 끝에서 잰다. 편집이 적은 채로 n 개씩 넣으므로 상한이 `O(n)` 이다.
      // **넘겨받은 원소를 하나씩 따로 넣는 계열이 여기서 걸린다** — 원소마다 조각을 훑는다.
      covers: ["insert"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.insert(0, block(n));
        // 담긴 수는 시나리오가 제 호출로 센다 — 계약에 그 수를 읽는 행이 없고, 늘어놓기로
        // 대신 세면 준비가 계측을 물들인다.
        let held = n;
        for (let i = 0; i < 4; i++) {
          const offset = (held >> 1) + i;
          const items = block(n, n * (i + 1));
          ctx.step(() => impl.insert(offset, items));
          held += items.length;
        }
      },
    },
    {
      // 긴 수열에서 절반을 한 번에 지우고(측정) 지운 만큼을 반대쪽 끝에 되넣는다(준비). 앞과
      // 끝을 번갈아 지우므로 **자리까지 옮겨 가는 계열**이 먼 거리를, **한 줄로 드는 계열**이 지운
      // 뒤를 당기는 일을 매번 치른다. 편집이 64 번을 넘지 않으므로 행의 상한 `O(m)` 이 `O(1)` 이고,
      // **지우는 원소 수(n)에 기대면 걸린다.**
      covers: ["delete"],
      qualifier: "worst",
      bound: "O(1)",
      adversarial: true,
      run: (impl, n, ctx) => {
        impl.insert(0, block(2 * n));
        // 위 시나리오와 같은 이유로 담긴 수를 시나리오가 센다. 지우고 같은 수를 되넣으므로
        // 이 값은 내내 2n 이다.
        const held = 2 * n;
        for (let i = 0; i < 16; i++) {
          if (i % 2 === 0) {
            ctx.step(() => impl.delete(0, n));
            impl.insert(held - n, block(n, n * (i + 2)));
          } else {
            const from = held - n;
            ctx.step(() => impl.delete(from, n));
            impl.insert(0, block(n, n * (i + 2)));
          }
        }
      },
    },

    {
      // 편집 한 번으로 n 개를 담은 뒤 열거한다. 되풀이 횟수가 n 이 아닌 이유는 O(n) 연산을
      // n 회 돌면 시나리오가 O(n^2) 이 되기 때문이다. `worst` 는 최대값으로 판정한다.
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.insert(0, block(n));
        for (let i = 0; i < 8; i++) ctx.step(() => impl.toArray());
      },
    },
    {
      // 같은 행을 m 쪽 끝에서 잰다. 2n 개를 담고 앞에서 하나씩 n 번 지워 편집 수를 n 으로
      // 올린다 — 행의 상한 `O(n + m)` 이 여기서도 `O(n)` 이다. **편집을 적어 두었다가 열거할 때
      // 되풀이하는 계열이 여기서만 걸린다**(편집마다 담긴 수만큼 옮긴다).
      covers: ["toArray"],
      qualifier: "worst",
      bound: "O(n)",
      adversarial: false,
      run: (impl, n, ctx) => {
        impl.insert(0, block(2 * n));
        for (let i = 0; i < n; i++) impl.delete(0, 1);
        for (let i = 0; i < 8; i++) ctx.step(() => impl.toArray());
      },
    },
  ],
};
