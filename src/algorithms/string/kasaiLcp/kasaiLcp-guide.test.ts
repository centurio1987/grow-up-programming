/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/string/kasaiLcp/kasaiLcp.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본(`kasaiLcp-guide.ref.ts`)에 다시 건다. 벽시계를
 * 재는 케이스(`n = 100,000` 을 100ms 안에)는 옮기지 않았다 — 실행마다 값이 달라 판정이 안
 * 된다. 같은 규모를 **자료 접근 횟수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { kasaiLcp } from "./kasaiLcp-guide.ref.ts";

/** 접미사를 실제로 잘라 사전순으로 늘어놓는다. 시험용이라 값이 커지지 않는 입력에만 쓴다. */
function bruteSuffixArray(s: string): number[] {
  const n = s.length;
  const idx = Array.from({ length: n }, (_, i) => i);
  idx.sort((a, b) => {
    const sa = s.slice(a);
    const sb = s.slice(b);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });
  return idx;
}

/** 정의를 그대로 옮긴 것. 짝마다 처음부터 비교한다. */
function bruteLcp(s: string, sa: number[]): number[] {
  const n = s.length;
  const lcp = new Array<number>(n).fill(0);
  for (let r = 0; r + 1 < n; r++) {
    const a = sa[r] as number;
    const b = sa[r + 1] as number;
    let k = 0;
    while (a + k < n && b + k < n && s[a + k] === s[b + k]) k++;
    lcp[r] = k;
  }
  return lcp;
}

const CASES: [string, string, number[], number[]][] = [
  ["문제 예시 — banana", "banana", [5, 3, 1, 0, 4, 2], [1, 3, 0, 0, 2, 0]],
  ["공통 앞부분이 없다 — abc", "abc", [0, 1, 2], [0, 0, 0]],
  ["길이 1 — 이웃 자체가 없다", "a", [0], [0]],
  ["모든 글자가 같다 — aaaa", "aaaa", [3, 2, 1, 0], [1, 2, 3, 0]],
  ["두 글자가 같다 — aa", "aa", [1, 0], [1, 0]],
  [
    "본문 전개가 쓰는 고정 입력",
    "banana",
    [5, 3, 1, 0, 4, 2],
    [1, 3, 0, 0, 2, 0],
  ],
];

for (const [name, s, sa, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(kasaiLcp(s, sa)).toEqual(want);
  });
}

const BRUTE_CASES: string[] = [
  "mississippi",
  "abab",
  "complicated",
  "abracadabra",
  "cabbage",
  "aab",
  `${"ababab".repeat(8)}ab`,
  "a".repeat(64),
  "ab".repeat(32),
  `${"a".repeat(63)}b`,
];

for (const s of BRUTE_CASES) {
  test(`정본 — 짝마다 비교하는 방법과 같은 답 (n = ${s.length})`, () => {
    const sa = bruteSuffixArray(s);
    expect(kasaiLcp(s, sa)).toEqual(bruteLcp(s, sa));
  });
}

test("마지막 칸은 언제나 0 이다 (Kasai 규약)", () => {
  for (const s of BRUTE_CASES) {
    const sa = bruteSuffixArray(s);
    const lcp = kasaiLcp(s, sa);
    expect(lcp[lcp.length - 1]).toBe(0);
  }
});

test("두 글자짜리 알파벳의 길이 12 문자열 전부에서 짝마다 비교하는 방법과 같다", () => {
  const n = 12;
  for (let mask = 0; mask < 1 << n; mask++) {
    let s = "";
    for (let b = 0; b < n; b++) s += (mask >> b) & 1 ? "b" : "a";
    const sa = bruteSuffixArray(s);
    expect(kasaiLcp(s, sa)).toEqual(bruteLcp(s, sa));
  }
});

test("n = 100,000 에서도 답의 길이와 마지막 칸이 규약을 지킨다", () => {
  const n = 100_000;
  const s = "a".repeat(n);
  const sa = Array.from({ length: n }, (_, i) => n - 1 - i);
  const lcp = kasaiLcp(s, sa);
  expect(lcp.length).toBe(n);
  expect(lcp[n - 1]).toBe(0);
  expect(lcp[0]).toBe(1);
  expect(lcp[n - 2]).toBe(n - 1);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본의 기록과 대조한 걸음 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./kasaiLcp-guide.sim.ts");
  const { simStepsFromRef } = await import("./kasaiLcp-guide.fig.tsx");
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.kasaiWalk.steps)).toEqual(plain(simStepsFromRef()));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  expect(sim.kasaiWalk.result).toBe(
    `[${kasaiLcp("banana", [5, 3, 1, 0, 4, 2]).join(", ")}]`,
  );
});

test("다시 쓴 절차가 정본 계측의 기록과 같다", async () => {
  // 그림 · 증명 사이드카가 쓰는 `trace` 는 자리마다 정본 계측 사본의 기록과 대조하고, 어긋나면 던진다.
  const { trace } = await import("./kasaiLcp-guide.fig.tsx");
  for (const s of [
    "banana",
    "aaaa",
    "abab",
    "mississippi",
    "abracadabra",
    "a",
  ]) {
    const sa = bruteSuffixArray(s);
    expect(trace(s, sa).lcp).toEqual(kasaiLcp(s, sa));
  }
});
