/**
 * `linear/xorLinkedList` 계약 스위트(규약2).
 *
 * 이 파일은 계약을 **다시 적지 않는다.** 계약은 `./xorLinkedList.ts` 헤더 한 곳이고(규약1),
 * 여기 있는 것은 그 계약을 기계가 검사하는 형태로 옮긴 것뿐이다.
 *
 * 검증 등급 `invariant` → 축3 엄격도는 `regression`(±60% · 2점 · 적대적 선택). **이 구조가
 * 첫 `invariant` 사례다** — 앞의 넷은 `basic` 하나와 `complexity` 셋이었다.
 *
 * **적대적 시나리오가 하나도 없다.** 빠뜨린 것이 아니라 이 계약에 적대적 입력이라는 것이
 * 정의되지 않아서다. 연산이 셋인데 `append` 의 비용은 값에 기대지 않고 순회 둘은
 * 인자가 없다. 남는 자유도는 호출 순서 하나인데, 붙이기와 읽기만 있는 순서 공간에서는
 * 어떤 순서가 다른 순서보다 나쁜 구현이 없다. 규약2가 `regression` 에서 적대적 입력을
 * 선택으로 둔 것이 여기서 값을 한다.
 */

import type { ContractSpec } from "../../_contract/runContract";

/** 헤더 연산 계약 표의 세 행을 그대로 옮긴 표면. */
export interface XorLinkedListContract {
  append(value: number): void;
  toArray(): number[];
  toArrayReverse(): number[];
}

/** 축1 참조 모델. 자명한 배열이면 된다 — 축1은 의미만 보고 비용은 보지 않는다. */
type Model = number[];

export const xorLinkedListContract: ContractSpec<XorLinkedListContract, Model> =
  {
    name: "XorLinkedList",
    grade: "invariant",
    model: () => [],

    ops: [
      {
        name: "append",
        // 음수와 0 이 섞이도록 잡는다. 0 은 빈자리 표시와 헷갈릴 수 있는 값이다.
        arg: (rng) => Math.floor(rng() * 200) - 100,
        onImpl: (impl, arg) => {
          impl.append(arg as number);
        },
        onModel: (model, arg) => {
          model.push(arg as number);
        },
      },
      {
        name: "toArray",
        arg: () => undefined,
        onImpl: (impl) => impl.toArray(),
        onModel: (model) => [...model],
      },
      {
        name: "toArrayReverse",
        arg: () => undefined,
        onImpl: (impl) => impl.toArrayReverse(),
        onModel: (model) => [...model].reverse(),
      },
    ],

    edges: [
      {
        name: "빈 수열에서 두 순회는 빈 배열이다",
        steps: [{ op: "toArray" }, { op: "toArrayReverse" }],
      },
      {
        name: "원소가 하나면 두 순회가 같은 배열을 돌려준다",
        steps: [
          { op: "append", arg: 42 },
          { op: "toArray" },
          { op: "toArrayReverse" },
          { op: "toArray" },
        ],
      },
      {
        name: "원소가 둘이면 두 순회가 정확히 뒤집힌다",
        steps: [
          { op: "append", arg: 100 },
          { op: "append", arg: 200 },
          { op: "toArray" },
          { op: "toArrayReverse" },
        ],
      },
      {
        // 빈자리 표시로 0 을 쓰는 구현이 값 0 을 끝으로 오인하면 여기서 갈린다.
        name: "값 0 은 빈자리 표시와 섞이지 않는다",
        steps: [
          { op: "append", arg: 0 },
          { op: "append", arg: 0 },
          { op: "toArray" },
          { op: "toArrayReverse" },
          { op: "toArray" },
        ],
      },
      {
        name: "같은 값을 여러 번 붙여도 개수가 유지된다",
        steps: [
          { op: "append", arg: 7 },
          { op: "append", arg: 7 },
          { op: "append", arg: 7 },
          { op: "toArray" },
          { op: "toArray" },
        ],
      },
      {
        // 읽기가 상태를 바꾸면 두 번째 순회부터 갈린다.
        name: "붙이는 도중에 읽어도 그때까지의 수열이 나오고 상태가 바뀌지 않는다",
        steps: [
          { op: "append", arg: 1 },
          { op: "toArray" },
          { op: "append", arg: 2 },
          { op: "toArray" },
          { op: "toArrayReverse" },
          { op: "toArray" },
          { op: "toArray" },
        ],
      },
      {
        name: "음수와 큰 값이 그대로 나온다",
        steps: [
          { op: "append", arg: -1 },
          { op: "append", arg: Number.MAX_SAFE_INTEGER },
          { op: "append", arg: Number.MIN_SAFE_INTEGER },
          { op: "toArray" },
          { op: "toArrayReverse" },
        ],
      },
    ],

    invariants: [
      // 옛 1번(「세고 있는 수와 내놓을 수 있는 수가 같다」)은 세어 둔 수를 읽는 행이 표면에서
      // 빠져 경로가 순회 하나로 줄었다 — 헤더 불변식 절의 판별 그대로다.
      {
        name: "두 방향이 같은 수열을 읽는다",
        check: (impl) => {
          const forward = impl.toArray();
          const backward = impl.toArrayReverse();
          const expected = [...forward].reverse();
          if (backward.length !== expected.length) {
            return `앞→뒤 ${forward.length}개 / 뒤→앞 ${backward.length}개`;
          }
          for (let i = 0; i < expected.length; i++) {
            if (backward[i] !== expected[i]) {
              return `${i}번째에서 갈린다 — 뒤→앞 ${backward[i]} / 앞→뒤를 뒤집으면 ${expected[i]}`;
            }
          }
          return null;
        },
      },
    ],

    scenarios: [
      {
        // 상각이므로 n 회 측정한다(§규약2 시나리오 규칙 4).
        covers: ["append"],
        qualifier: "amortized",
        bound: "O(1)",
        adversarial: false,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) ctx.step(() => impl.append(i));
        },
      },
      {
        covers: ["toArray"],
        qualifier: "worst",
        bound: "O(n)",
        adversarial: false,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) impl.append(i);
          for (let i = 0; i < 3; i++) ctx.step(() => impl.toArray());
        },
      },
      {
        covers: ["toArrayReverse"],
        qualifier: "worst",
        bound: "O(n)",
        adversarial: false,
        run: (impl, n, ctx) => {
          for (let i = 0; i < n; i++) impl.append(i);
          for (let i = 0; i < 3; i++) ctx.step(() => impl.toArrayReverse());
        },
      },
    ],
  };
