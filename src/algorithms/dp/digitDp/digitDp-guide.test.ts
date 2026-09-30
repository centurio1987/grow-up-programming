/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/digitDp/digitDp.test.ts` 는 학습자 스텁을 가져오므로 그대로 재사용할
 * 수 없다. **케이스만** 옮겨 정본에 다시 건다. 「성능」 케이스의 벽시계 단언(`100ms 이내`)은
 * 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 같은 입력의 값 대조는 남긴다.
 */
import { expect, test } from "bun:test";
import { digitDp } from "./digitDp-guide.ref.ts";

const CASES: [number, number, number][] = [
  // 기본
  [20, 2, 3],
  [10, 1, 2],
  [9, 5, 1],
  [100, 10, 9],
  // 엣지
  [100, 0, 0],
  [99, 20, 0],
  [1, 1, 1],
  [1, 2, 0],
  [9, 9, 1],
  [99, 18, 1],
  // 바운더리
  [999, 27, 1],
  [1000, 1, 4],
  // 문제 예시
  [9, 5, 1],
  [100, 1, 3],
  [999, 28, 0],
];

for (const [N, K, want] of CASES) {
  test(`정본 — digitDp(${N}, ${K}) = ${want}`, () => {
    expect(digitDp(N, K)).toBe(want);
  });
}

test("성능 케이스와 같은 입력 — N = 10^15 · K = 50 에서 값이 나온다", () => {
  expect(digitDp(10 ** 15, 50)).toBe(10_614_794_989_443);
});

test("전개가 쓰는 입력 — N = 194 · K = 10 은 19 다", () => {
  expect(digitDp(194, 10)).toBe(19);
  // 전개가 갈래를 나누는 두 자리. 자유 쪽이 9 개, tight 쪽이 10 개다.
  expect(digitDp(99, 10)).toBe(9);
  expect(digitDp(194, 10) - digitDp(99, 10)).toBe(10);
});

test("하나씩 세는 방법과 값이 같다 — N ≤ 400 · K ≤ 20 전수", () => {
  const bySum = (x: number): number => {
    let s = 0;
    let v = x;
    while (v > 0) {
      s += v % 10;
      v = Math.floor(v / 10);
    }
    return s;
  };
  let checked = 0;
  for (let N = 1; N <= 400; N++) {
    for (let K = 0; K <= 20; K++) {
      let want = 0;
      for (let x = 1; x <= N; x++) if (bySum(x) === K) want++;
      expect(digitDp(N, K)).toBe(want);
      checked++;
    }
  }
  expect(checked).toBe(400 * 21);
});

test("본문 불변식이 드는 자리 — 자리 수 × 9 를 넘는 K · K = 0 · 한 자리 수", () => {
  expect(digitDp(999, 28)).toBe(0);
  expect(digitDp(10 ** 15, 135)).toBe(1);
  expect(digitDp(1, 0)).toBe(0);
  expect(digitDp(9, 0)).toBe(0);
  for (let K = 1; K <= 9; K++) expect(digitDp(9, K)).toBe(1);
});

test("본문 수식 절이 드는 자리 — N = 10^15 의 답은 W(15, K) 에 [K = 1] 을 더한 것이다", () => {
  // 자유 자리 15 개를 합 K 로 채우는 방법 수. 표로 낸다.
  const W = (m: number, t: number): number => {
    let row = [1, ...new Array<number>(t).fill(0)];
    for (let i = 0; i < m; i++) {
      const next = new Array<number>(t + 1).fill(0);
      for (let s = 0; s <= t; s++)
        for (let x = 0; x <= 9 && x <= s; x++)
          next[s] = (next[s] as number) + (row[s - x] as number);
      row = next;
    }
    return row[t] as number;
  };
  for (const K of [1, 2, 10, 50, 67, 100, 135]) {
    expect(digitDp(10 ** 15, K)).toBe(W(15, K) + (K === 1 ? 1 : 0));
  }
  // 합을 전부 더하면 15 자리 문자열의 개수다.
  let all = 0;
  for (let K = 0; K <= 135; K++) all += W(15, K);
  expect(all).toBe(10 ** 15);
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./digitDp-guide.sim.ts");
  const { simStepsFromRef, simResults, TABLE_OPTIONS, trace, WALK_N, WALK_K } =
    await import("./digitDp-guide.fig.tsx");
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.free.steps)).toEqual(plain(want.free));
  expect(plain(sim.tight.steps)).toEqual(plain(want.tight));
  for (const part of [sim.free, sim.tight]) {
    expect(plain(part.rowHeads)).toEqual(plain(TABLE_OPTIONS.rowHeads));
    expect(plain(part.colHeads)).toEqual(plain(TABLE_OPTIONS.colHeads));
    expect(part.colLabel).toBe(TABLE_OPTIONS.colLabel as string);
  }
  const results = simResults();
  expect(sim.free.result).toBe(results.free);
  expect(sim.tight.result).toBe(results.tight);
  // 패널이 내미는 값이 정본의 DP 테이블 · 답과 같은지 — 정본에 직접 다시 묻는다.
  const t = trace(WALK_N, WALK_K);
  expect(sim.free.result).toBe(String(t.memo[1]?.[0]));
  expect(sim.tight.result).toBe(String(digitDp(WALK_N, WALK_K)));
  // 걸음 수 — 두 벌을 합쳐 본문의 T1~T12 다.
  expect(sim.free.steps.length + sim.tight.steps.length).toBe(12);
  // 마지막 걸음의 DP 테이블 풀린 줄이 정본이 끝낸 DP 테이블과 같다.
  const last = sim.tight.steps.at(-1)?.table ?? [];
  t.memo.forEach((row, pos) => {
    expect(last[2 * pos + 1]).toEqual(
      row.map((v) => (v === -1 ? null : String(v))),
    );
  });
});
