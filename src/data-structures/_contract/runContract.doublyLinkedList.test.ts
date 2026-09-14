/**
 * 하네스 자기시험 — `linear/doublyLinkedList` 계약 앞에 선 정본 · 결함 셋.
 *
 * **`runContract.test.ts` 에 넣지 않고 따로 둔다.** 그 파일에 줄을 넣으면 그 파일을 줄 번호로
 * 인용하는 가이드들이 밀린다(불변 사실 106 · 215).
 *
 * 보는 것은 셋이다.
 *
 * 1. **결함 둘은 동작상 옳다.** 축1 · 축2를 전부 통과하고 축3에서 서로 다른 행에 걸린다. 행 단위로
 *    적는다(불변 사실 84). 통과하는 자리에 숨은 계약 위반은 없다 — 걸리지 않는 행에서는 정본과 같은
 *    계급이다(불변 사실 62).
 * 2. **다음 원소의 값을 끌어와 덮는 우회는 축3 여섯 시나리오를 전부 통과하고 축1이 값에서 잡는다.**
 *    `linear/singlyLinkedList` 와의 반례 표가 「「다른 핸들은 그대로 유효하다」가 행에 있어서 반례가
 *    선다」고 적은 자리의 실측이다. 축3 표만 두면 「여섯 시나리오 전부 통과」가 「계약을 지킨다」로 읽히므로
 *    축1 열을 함께 적는다(`docs/ORD-006-conventions.md` 「축1이 혼자 잡는 결함 fixture」).
 * 3. **그 우회를 잡는 경계 케이스가 넷이고, 넷 다 핸들 모형의 두 문장 중 하나를 어긴 자리다** — 하나는
 *    「뺀 핸들은 죽는다」(뺀 마디가 다음 원소를 담은 채 산다), 셋은 「다른 핸들은 그대로다」(떼어 낸 마디가
 *    다음 원소의 핸들이다). 무작위 교차검증도 14번째 호출에서 잡는다.
 *
 * | 시나리오 (n = 1,024 → 4,096) | 정본 | `PredecessorWalkingList` | `SplicingHandleArray` | `SuccessorPullingList` |
 * |---|---|---|---|---|
 * | `prepend` amortized O(1) | 1.00 → 1.00 | 통과 | **걸림** 512.50 → 2,048.50 | 통과 |
 * | `append` amortized O(1) | 1.00 → 1.00 | 통과 | 통과 | 통과 |
 * | `insertAfter` amortized O(1) | 1.00 → 1.00 | 통과 | **걸림** 1,536.50 → 6,144.50 | 통과 |
 * | `remove` amortized O(1) (적대적) | 1.00 → 1.00 | **걸림** 512.50 → 2,048.50 | **걸림** 513.50 → 2,049.50 | 통과 |
 * | `toArray` worst O(n) | 1,024 → 4,096 | 통과 | 통과 | 통과 |
 * | `size` worst O(1) | 1 → 1 | 통과 | 통과 | 통과 |
 * | 축1 | 통과 | 통과 | 통과 | **걸림** — 경계 넷 · 무작위 14번째 호출 |
 */

import { describe, expect, test } from "bun:test";
import { DoublyLinkedList as Reference } from "../linear/doublyLinkedList/_reference/doublyLinkedList";
import {
  type DoublyLinkedListContract,
  doublyLinkedListContract,
} from "../linear/doublyLinkedList/doublyLinkedList.contract";
import { PredecessorWalkingList } from "./_fixtures/predecessorWalkingList";
import { SplicingHandleArray } from "./_fixtures/splicingHandleArray";
import { SuccessorPullingList } from "./_fixtures/successorPullingList";
import { rngFrom } from "./judge";
import { type CostSource, judgeScenario, runContract } from "./runContract";

type Surface = DoublyLinkedListContract<number>;

function source(make: () => Surface & { __cost: number }): CostSource<Surface> {
  return { kind: "self-reported", make };
}

const reference = source(() => new Reference<number>());
const walking = source(() => new PredecessorWalkingList());
const splicing = source(() => new SplicingHandleArray());
const pulling = source(() => new SuccessorPullingList());

/** 시나리오마다 `행 (적대적) → 통과 여부`. 이 계약은 행마다 시나리오가 하나라 이름이 겹치지 않는다. */
function verdicts(cost: CostSource<Surface>): Record<string, boolean> {
  const found: Record<string, boolean> = {};
  for (const scenario of doublyLinkedListContract.scenarios) {
    const label = `${scenario.covers.join("·")}${scenario.adversarial ? " (적대적)" : ""}`;
    found[label] = judgeScenario(
      cost,
      scenario,
      doublyLinkedListContract.grade,
    ).ok;
  }
  return found;
}

const ALL_PASS = {
  prepend: true,
  append: true,
  insertAfter: true,
  "remove (적대적)": true,
  toArray: true,
  size: true,
};

const byName = new Map(
  doublyLinkedListContract.ops.map((op) => [op.name, op] as const),
);

/** 관측값 비교. 하네스의 `sameValue` 와 같은 뜻이다 — 배열은 원소마다, 나머지는 `Object.is`. */
function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** 경계 케이스마다 첫 갈림을 값으로 돌려준다. 갈리지 않은 경계는 담지 않는다. */
function edgeSplits(make: () => Surface): Record<string, string> {
  const found: Record<string, string> = {};
  for (const edge of doublyLinkedListContract.edges) {
    const impl = make();
    const model = doublyLinkedListContract.model();
    for (const [index, step] of edge.steps.entries()) {
      const op = byName.get(step.op);
      if (!op) throw new Error(`없는 연산: ${step.op}`);
      const observed = op.onImpl(impl, step.arg);
      const expected = op.onModel(model, step.arg);
      if (!same(observed, expected)) {
        found[edge.name] =
          `${index}번째 ${step.op} — 관측 ${JSON.stringify(observed)} / 모델 ${JSON.stringify(expected)}`;
        break;
      }
    }
  }
  return found;
}

/**
 * 무작위 교차검증의 첫 갈림 자리(0부터 센 호출 번호). 갈리지 않으면 `null`. seed 와 호출 수는
 * `runContract.ts` 의 축1 무작위 교차검증과 같게 둔다(seed 1 · 500회).
 */
function randomSplitAt(make: () => Surface): number | null {
  const rng = rngFrom(1);
  const impl = make();
  const model = doublyLinkedListContract.model();
  const ops = doublyLinkedListContract.ops;
  for (let index = 0; index < 500; index++) {
    const op = ops[Math.floor(rng() * ops.length)];
    if (op === undefined) throw new Error("연산 목록이 비어 있다");
    const arg = op.arg(rng);
    if (!same(op.onImpl(impl, arg), op.onModel(model, arg))) return index;
  }
  return null;
}

// 1. 결함 둘은 동작상 옳다 — 축1 · 축2 를 전부 통과한다. 계측기를 넘기지 않으므로 축3은 돌지 않는다.
runContract(() => new PredecessorWalkingList(), doublyLinkedListContract, {
  label: "결함 fixture PredecessorWalkingList",
});
runContract(() => new SplicingHandleArray(), doublyLinkedListContract, {
  label: "결함 fixture SplicingHandleArray",
});

describe("DoublyLinkedList 축3 — 결함 둘이 다른 행에서 걸린다", () => {
  test("정본은 여섯 시나리오를 전부 통과한다", () => {
    expect(verdicts(reference)).toEqual(ALL_PASS);
  });

  test("앞 원소를 모르는 단방향 마디는 remove 에서만 걸린다", () => {
    expect(verdicts(walking)).toEqual({
      ...ALL_PASS,
      "remove (적대적)": false,
    });
  });

  test("상자를 늘어놓은 언어 배열은 prepend · insertAfter · remove 에서 걸린다", () => {
    expect(verdicts(splicing)).toEqual({
      ...ALL_PASS,
      prepend: false,
      insertAfter: false,
      "remove (적대적)": false,
    });
  });
});

describe("DoublyLinkedList 축1 — 다음 원소를 끌어와 덮는 우회는 비용이 아니라 핸들에서 걸린다", () => {
  test("정본과 결함 둘은 경계 케이스 · 무작위 교차검증에서 갈리지 않는다", () => {
    for (const make of [
      () => new Reference<number>(),
      () => new PredecessorWalkingList(),
      () => new SplicingHandleArray(),
    ]) {
      expect(edgeSplits(make)).toEqual({});
      expect(randomSplitAt(make)).toBeNull();
    }
  });

  test("축3 여섯 시나리오를 전부 통과한다", () => {
    expect(verdicts(pulling)).toEqual(ALL_PASS);
  });

  test("경계 넷에서 뺀 핸들이 살거나 이웃 핸들이 죽는다", () => {
    expect(edgeSplits(() => new SuccessorPullingList())).toEqual({
      // 0 번을 뺐는데 제 마디가 1 번 원소를 담은 채 살아 있다 — 빠진 핸들이 죽지 않는다.
      "빠진 원소의 핸들은 remove 가 false · insertAfter 가 null 이고 상태는 그대로다":
        "3번째 remove — 관측 true / 모델 false",
      // 1 번을 뺄 때 떼어 낸 것이 2 번의 마디다 — 이웃 핸들이 죽는다.
      "하나를 빼도 다음 원소의 핸들은 그대로 산다":
        "5번째 remove — 관측 false / 모델 true",
      // 0 번을 뺄 때 1 번(가운데)의 마디를 떼어 냈으므로 가운데 핸들로 끼우지 못한다.
      "양쪽 이웃을 빼도 가운데 원소의 핸들로 끼울 수 있다":
        "5번째 insertAfter — 관측 null / 모델 3",
      // 0 번을 뺄 때 2 번(뒤에 붙인 3)의 마디를 떼어 냈으므로 그 핸들로 빼지 못한다.
      "끝 원소를 빼면 이웃 원소가 새 끝이 된다":
        "8번째 remove — 관측 false / 모델 true",
    });
  });

  test("무작위 교차검증은 14번째 호출(0부터 13)에서 잡는다", () => {
    expect(randomSplitAt(() => new SuccessorPullingList())).toBe(13);
  });
});
