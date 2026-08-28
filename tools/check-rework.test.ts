/**
 * `check-rework.ts` 자기시험. **재배치와 재작성을 가르는가**를 본다 — 이 도구가 생긴 이유가
 * 그 둘이 `git diff` 로는 구분되지 않는다는 것이기 때문이다.
 */
import { expect, test } from "bun:test";
import { rework, slice } from "./check-rework.ts";

/** 시험 표본에서 절을 자른다. 못 찾으면 시험이 그 자리에서 실패해야 하므로 던진다. */
const cut = (text: string): string[] => {
  const out = slice(text, "## 아이디어 상세");
  if (out === null) throw new Error("표본에 「아이디어 상세」 절이 없다");
  return out;
};

const OLD = `## 아이디어 상세 — 창 옮기기를 떠올리는 과정

**① 문제를 고정한다.** 시그니처는 이렇다.

**② 단순한 방법은 1억 칸이다.**

**③ 창을 이어받으면 비용이 이동 칸 수가 된다.**

**④ 창을 옮기면 count 는 어떻게 정리되는가.**

**⑤ 그 비용은 질의 순서가 정한다.**

## 수식 정의와 유도
`;

test("문단을 옮기고 번호만 다시 붙이면 재작성률이 낮다", () => {
  // 걸음 ④ 를 지우고 나머지 번호를 하나씩 당긴 것 — 문장은 그대로다.
  const moved = `## 아이디어 상세 — 질의 재정렬을 떠올리는 과정

**① 문제를 고정한다.** 시그니처는 이렇다.

**② 단순한 방법은 1억 칸이다.**

**③ 창을 이어받으면 비용이 이동 칸 수가 된다.**

**④ 그 비용은 질의 순서가 정한다.**

## 수식 정의와 유도
`;
  const r = rework(cut(OLD), cut(moved));
  expect(r.rate).toBeLessThan(0.6);
  expect(r.reused).toContain("**③ 창을 이어받으면 비용이 이동 칸 수가 된다.**");
});

test("구성을 다시 짜서 문장을 새로 쓰면 재작성률이 높다", () => {
  const rewritten = `## 아이디어 상세 — 질의 재정렬을 떠올리는 과정

**① 문제를 고정한다.** 시그니처는 이렇다.

**② 겹침을 매번 다시 세는 것이 1억 칸의 정체다.**

**③ 비용 식에 배열 값이 없다 — 순서만이 비용을 정한다.**

**④ 좋은 순서의 조건은 둘인데 기준의 앞자리는 하나다.**

**⑤ 앞자리를 성기게 만들어 뒷값에 자리를 준다.**

## 수식 정의와 유도
`;
  const r = rework(cut(OLD), cut(rewritten));
  expect(r.rate).toBeGreaterThan(0.6);
});

test("들여쓰기만 바꾼 줄은 새로 쓴 것으로 세지 않는다", () => {
  const reindented = OLD.replace(
    "**⑤ 그 비용은 질의 순서가 정한다.**",
    "  **⑤   그 비용은 질의 순서가 정한다.**",
  );
  const r = rework(cut(OLD), cut(reindented));
  expect(r.fresh).toBe(0);
});

test("절을 찾지 못하면 null 이다", () => {
  expect(slice(OLD, "## 없는 절")).toBeNull();
});

test("다음 `## ` 헤딩 직전까지만 잘라 낸다", () => {
  const section = cut(OLD);
  expect(section.some((l) => l.startsWith("## 수식"))).toBe(false);
  expect(section.some((l) => l.startsWith("**⑤"))).toBe(true);
});
