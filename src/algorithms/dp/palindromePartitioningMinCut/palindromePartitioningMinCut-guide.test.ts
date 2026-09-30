/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/palindromePartitioningMinCut/palindromePartitioningMinCut.test.ts`
 * 는 학습자 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 * 「성능」 케이스의 벽시계 단언(`100ms 이내`)은 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 입력의 값 대조는 남긴다.
 *
 * **원본의 기댓값 하나를 그대로 옮기지 않았다.** `palindromePartitioningMinCut.test.ts:63-68`
 * 이 `"ab".repeat(1000)` 의 답을 `s.length - 1` = `1999` 로 적었는데, 그 문자열은 자리
 * 1 부터 끝까지가 통째로 회문이라(자리 `1+k` 와 `1999−k` 의 홀짝이 같다) `"a"` 와
 * `"bab…ab"` 로 **한 번만** 자르면 되고 답이 `1` 이다. 원본 주석도 *"(n-1)컷이 아니라 더
 * 적을 수도 있지만"* 이라 적어 두고 `1999` 로 걸었다. 여기서는 `1` 로 건다 —
 * **원본은 이 카드의 범위 밖이라 고치지 않고 보고에만 적는다.**
 */
import { expect, test } from "bun:test";
import { palindromePartitioningMinCut } from "./palindromePartitioningMinCut-guide.ref.ts";

const CASES: [string, number][] = [
  // 기본
  ["aab", 1],
  ["a", 0],
  ["ab", 1],
  ["abcbm", 2],
  // 엣지
  ["aba", 0],
  ["aaaaa", 0],
  ["abcde", 4],
  ["abba", 0],
  ["abacdc", 1],
  // 바운더리
  ["z", 0],
  ["aa", 0],
  // 문제 예시
  ["noonracecar", 1],
];

for (const [s, want] of CASES) {
  test(`정본 — palindromePartitioningMinCut("${s}") = ${want}`, () => {
    expect(palindromePartitioningMinCut(s)).toBe(want);
  });
}

test("바운더리 — 글자 2,000 개가 전부 'a' 면 통째로 회문이라 0 이다", () => {
  expect(palindromePartitioningMinCut("a".repeat(2000))).toBe(0);
});

test("바운더리 — 'ab' 를 1,000 번 되풀이하면 1 이다 (원본은 1999 로 적혀 있다)", () => {
  const s = "ab".repeat(1000);
  expect(palindromePartitioningMinCut(s)).toBe(1);
  // 근거: 자리 1 부터 끝까지가 회문이다.
  const tail = s.slice(1);
  expect(tail).toBe([...tail].reverse().join(""));
});

test("성능 케이스와 같은 입력 — 글자 2,000 개에서 답이 나온다", () => {
  const s = Array.from({ length: 2000 }, (_, t) =>
    String.fromCharCode(97 + ((t * 7919) % 26)),
  ).join("");
  expect(palindromePartitioningMinCut(s)).toBe(1999);
});

test("전개가 쓰는 입력 — s='abaab' 은 1 이다", () => {
  expect(palindromePartitioningMinCut("abaab")).toBe(1);
  // 전개가 짚는 접두사 셋. 컷 표가 오르내린다는 것이 여기서 보인다.
  expect(palindromePartitioningMinCut("ab")).toBe(1);
  expect(palindromePartitioningMinCut("aba")).toBe(0);
  expect(palindromePartitioningMinCut("abaa")).toBe(1);
});

test("본문 불변식이 드는 자리 — 글자 하나·빈 문자열·전체가 회문", () => {
  expect(palindromePartitioningMinCut("")).toBe(0);
  expect(palindromePartitioningMinCut("q")).toBe(0);
  expect(palindromePartitioningMinCut("racecar")).toBe(0);
});

test("본문 수식 절이 드는 자리 — 길이 2·3 회문이 없으면 답이 글자 수 − 1 이다", () => {
  const s = "abc".repeat(20);
  expect(palindromePartitioningMinCut(s)).toBe(s.length - 1);
  // 길이 2 회문 하나만 생겨도 답이 글자 수 − 1 에서 내려온다.
  const withPair = `${s}c`;
  expect(palindromePartitioningMinCut(withPair)).toBe(withPair.length - 2);
});

test("본문 인용이 드는 자리 — 논문이 적은 PL(S) 와 컷 수 + 1 이 같다", () => {
  expect(palindromePartitioningMinCut("abaab") + 1).toBe(2);
  expect(palindromePartitioningMinCut("abaca") + 1).toBe(3);
  expect(palindromePartitioningMinCut("abbaabaabbba") + 1).toBe(3);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./palindromePartitioningMinCut-guide.sim.ts");
  const {
    simStepsFromRef,
    simResults,
    TABLE_OPTIONS,
    ARRAY_OPTIONS,
    trace,
    WALK,
  } = await import("./palindromePartitioningMinCut-guide.fig.tsx");
  const want = simStepsFromRef();
  const results = simResults();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.palShort.steps)).toEqual(plain(want.palShort));
  expect(plain(sim.palLong.steps)).toEqual(plain(want.palLong));
  expect(plain(sim.cutFirst.steps)).toEqual(plain(want.cutFirst));
  expect(plain(sim.cutLast.steps)).toEqual(plain(want.cutLast));
  for (const part of [sim.palShort, sim.palLong]) {
    expect(plain(part.rowHeads)).toEqual(plain(TABLE_OPTIONS.rowHeads));
    expect(plain(part.colHeads)).toEqual(plain(TABLE_OPTIONS.colHeads));
    expect(plain(part.strip)).toEqual(plain(TABLE_OPTIONS.strip));
  }
  for (const part of [sim.cutFirst, sim.cutLast]) {
    expect(part.arrayName).toBe(ARRAY_OPTIONS.arrayName as string);
    expect(part.rangeLabel).toBe(ARRAY_OPTIONS.rangeLabel);
  }
  expect(sim.palShort.result).toBe(results.palShort);
  expect(sim.palLong.result).toBe(results.palLong);
  expect(sim.cutFirst.result).toBe(results.cutFirst);
  // 패널이 내미는 값이 정본의 DP 테이블 · 답과 같은지 — 정본에 직접 다시 묻는다.
  const t = trace(WALK);
  expect(sim.cutFirst.result).toBe(
    `[${t.cut.slice(0, WALK.length - 1).join(", ")}]`,
  );
  expect(sim.cutLast.result).toBe(String(palindromePartitioningMinCut(WALK)));
  // 걸음 수 — 대각선 한 걸음 + 판정 칸 n(n−1)/2 개 + 컷 DP 테이블 깔기 + 컷 걸음 + 답을 읽는 한 걸음.
  const n = WALK.length;
  const total =
    sim.palShort.steps.length +
    sim.palLong.steps.length +
    sim.cutFirst.steps.length +
    sim.cutLast.steps.length;
  expect(total).toBe(1 + (n * (n - 1)) / 2 + 1 + t.cutRecs.length + 1);
});
