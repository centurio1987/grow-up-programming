import { expect, test } from "bun:test";
import { josa, tailOf, 과와, 으로, 은는, 을를, 이가 } from "./josa.ts";

/* ── 계약 1 — 앞 공백을 포함한다 ────────────────────────────────── */

test("계약1 — 돌려주는 조사는 언제나 앞 공백으로 시작한다", () => {
  const 낸값 = [
    을를(6),
    을를(4),
    이가(6),
    이가(4),
    은는(6),
    은는(4),
    과와(6),
    과와(4),
    으로(3),
    으로(1),
    josa(6, "이다", "다"),
  ];
  for (const v of 낸값) expect(v.startsWith(" ")).toBe(true);
  expect(`답 ${6}${을를(6)} 낸다`).toBe("답 6 을 낸다");
});

/* ── 계약 2 — 뒤 어미를 붙이지 않는다 ──────────────────────────── */

test("계약2 — 돌려주는 것은 조사 한 덩어리뿐이라 공백이 앞에 하나만 있다", () => {
  for (const v of [을를(6), 이가(4), 은는(7), 과와(2), 으로(0)]) {
    expect(v.slice(1).includes(" ")).toBe(false);
  }
});

/* ── 계약 3 — 조사만 돌려주고 값은 부르는 쪽이 적는다 ─────────── */

test("계약3 — 값이 돌아오지 않는다(값이 두 번 찍히는 실패의 자리)", () => {
  expect(을를(4567)).toBe(" 을");
  expect(을를(4567).includes("4567")).toBe(false);
  // treeIsomorphism 이 낸 「잎 4 5 6 7 4 를」 — 헬퍼가 값을 함께 냈을 때의 모양이다.
  expect(`잎 4 5 6 7${을를("4 5 6 7")} 벗긴다`).toBe("잎 4 5 6 7 을 벗긴다");
});

/* ── 계약 4 — 과/와 도 받침 판정을 받는다 ──────────────────────── */

test("계약4 — 과/와 가 받침에서 갈린다", () => {
  expect(과와(6)).toBe(" 과");
  expect(과와(4)).toBe(" 와");
  expect(과와("합")).toBe(" 과");
  expect(과와("도시")).toBe(" 와");
});

/* ── 받침 판정 ──────────────────────────────────────────────────── */

test("숫자 한 자리의 받침 — 0·1·3·6·7·8 이 받침 쪽이다", () => {
  const 받침있음 = [0, 1, 3, 6, 7, 8];
  for (let d = 0; d <= 9; d++) {
    expect(을를(d)).toBe(받침있음.includes(d) ? " 을" : " 를");
  }
});

test("ㄹ 받침은 을/를 에서는 받침 쪽이고 으로/로 에서는 받침 없음 쪽이다", () => {
  for (const d of [1, 7, 8]) {
    expect(tailOf(d)).toBe("rieul");
    expect(을를(d)).toBe(" 을");
    expect(으로(d)).toBe(" 로");
  }
  for (const d of [0, 3, 6]) {
    expect(tailOf(d)).toBe("other");
    expect(으로(d)).toBe(" 으로");
  }
  for (const d of [2, 4, 5, 9]) {
    expect(tailOf(d)).toBe("none");
    expect(으로(d)).toBe(" 로");
  }
});

test("끝이 0 이면 자리 이름이 마지막 음절이다 — 100 은 「백」이라 받침이 있다", () => {
  expect(tailOf(10)).toBe("other"); // 십
  expect(tailOf(100)).toBe("other"); // 백
  expect(tailOf(1_000)).toBe("other"); // 천
  expect(tailOf(10_000)).toBe("other"); // 만
  expect(tailOf(100_000_000)).toBe("other"); // 억
  expect(tailOf(1_000_000_000_000)).toBe("none"); // 조 — 받침이 없다
  expect(을를(1_000_000_000_000)).toBe(" 를");
  expect(을를(100_000_000)).toBe(" 을");
});

test("0 은 「영」이라 받침이 있다", () => {
  expect(tailOf(0)).toBe("other");
  expect(을를(0)).toBe(" 을");
});

test("자리 구분이 섞인 문자열도 숫자로 읽는다", () => {
  expect(을를("1,009")).toBe(" 를"); // 마지막이 9 「구」라 받침이 없다
  expect(을를("1,004")).toBe(" 를");
  expect(을를("1,006")).toBe(" 을");
  expect(을를("16,384")).toBe(" 를");
});

test("한글로 끝나면 종성으로 판정한다", () => {
  expect(을를("망원합")).toBe(" 을");
  expect(을를("정렬")).toBe(" 을"); // ㄹ 받침
  expect(으로("정렬")).toBe(" 로"); // ㄹ 은 「로」 쪽
  expect(으로("압축")).toBe(" 으로"); // ㄱ 받침
  expect(을를("배")).toBe(" 를");
  expect(이가("칸")).toBe(" 이");
  expect(이가("자리")).toBe(" 가");
});

test("숫자도 한글도 아닌 글자로 끝나면 받침 있음으로 본다", () => {
  expect(tailOf("∞")).toBe("other");
  expect(을를("∞")).toBe(" 을");
  expect(을를("A")).toBe(" 을");
});

test("끝의 공백은 판정 전에 떼어 낸다", () => {
  expect(을를("6 ")).toBe(" 을");
  expect(을를("4 ")).toBe(" 를");
});

test("bigint 도 같은 판정을 받는다", () => {
  expect(을를(8_051n)).toBe(" 을");
  expect(을를(94_906_267n)).toBe(" 을"); // 7 → ㄹ 받침
  expect(을를(2n)).toBe(" 를");
});

test("계사가 갈리는 자리는 일반형으로 적는다", () => {
  expect(josa(6, "이다", "다")).toBe(" 이다");
  expect(josa(4, "이다", "다")).toBe(" 다");
  expect(josa("1,000,000,007", "이면", "면")).toBe(" 이면");
  expect(josa(2, "이면", "면")).toBe(" 면");
});
