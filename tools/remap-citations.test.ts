import { expect, test } from "bun:test";
import { mapLine, parseHunks, rewriteCitations } from "./remap-citations.ts";

// 가짜 경로는 조립해서 쓴다 — 소스에 경로와 줄 번호가 그대로 붙어 있으면 인용 검사가 진짜 인용으로
// 읽고 「가리키는 파일이 없다」로 막는다(첫 판에서 실제로 막혔다).
const A = ["tools", "a.ts"].join("/");
const B = ["tools", "b.ts"].join("/");
const at = (path: string, line: string): string => `\`${path}:${line}\``;

test("변경 구간으로 옛 줄의 새 번호를 계산한다 — 삽입 · 삭제 · 바뀐 줄", () => {
  const hunks = parseHunks(
    [
      "@@ -10,0 +11,3 @@", // 10 줄 뒤에 세 줄 삽입
      "@@ -20,2 +23 @@", // 20·21 줄이 한 줄로 바뀜
      "@@ -30 +32,0 @@", // 30 줄 삭제
    ].join("\n"),
  );
  expect(mapLine(hunks, 5)).toBe(5);
  expect(mapLine(hunks, 10)).toBe(10);
  expect(mapLine(hunks, 11)).toBe(14);
  expect(mapLine(hunks, 20)).toBeNull();
  expect(mapLine(hunks, 22)).toBe(24);
  expect(mapLine(hunks, 30)).toBeNull();
  expect(mapLine(hunks, 31)).toBe(32);
});

test("경로 인용 · 범위 · 붙은 백틱 인용을 고치고, 다른 파일의 인용은 두지 않는다", () => {
  const text = [
    `근거는 ${at(A, "10")} 과 ${at(A, "10-12")} 이다.`,
    `같은 줄 뒤 ${at(A, "12")} · \`:10\` — 그리고 ${at(B, "10")} 과 \`:10\``,
    `여기는 ${at(A, "99")} 라 안 옮긴다.`,
  ].join("\n");
  const moves = new Map([
    [10, 14],
    [12, 16],
  ]);
  const r = rewriteCitations(text, A, moves);
  expect(r.text.split("\n")).toEqual([
    `근거는 ${at(A, "14")} 과 ${at(A, "14-16")} 이다.`,
    `같은 줄 뒤 ${at(A, "16")} · \`:14\` — 그리고 ${at(B, "10")} 과 \`:10\``,
    `여기는 ${at(A, "99")} 라 안 옮긴다.`,
  ]);
  expect(r.changed).toBe(5);
});

test("경로:줄:열(실행 로그의 사본)은 인용이 아니라 두지 않는다", () => {
  const log = `at x (${A}:10:4)`;
  expect(rewriteCitations(log, A, new Map([[10, 14]])).text).toBe(log);
});

test("쉼표로 이은 뒷번호는 변경 구간 계산으로 옮기고, 바뀐 줄이면 둔다", () => {
  const hunks = parseHunks("@@ -10,0 +11,3 @@\n@@ -40 +43 @@");
  const text = `근거 ${at(A, "20,30,40")}`;
  const r = rewriteCitations(text, A, new Map([[20, 23]]), (n) =>
    mapLine(hunks, n),
  );
  expect(r.text).toBe(`근거 ${at(A, "23,33,40")}`);
});
