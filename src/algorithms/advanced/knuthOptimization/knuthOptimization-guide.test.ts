/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/advanced/knuthOptimization/knuthOptimization.test.ts` 는 학습자
 * 스텁을 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본
 * (`knuthOptimization-guide.ref.ts`)에 다시 건다. 벽시계를 재는 케이스(`n = 500` 을 500ms
 * 안에)는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 같은 규모를 **후보
 * 수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 */
import { expect, test } from "bun:test";
import { INF, knuthOptimization } from "./knuthOptimization-guide.ref.ts";

/** 후보 범위를 안 좁히고 가르는 자리를 전부 넣는 구간 DP. 답의 기준으로만 쓴다. */
function fullScan(freq: number[]): number {
  const n = freq.length;
  if (n <= 1) return 0;
  const prefix = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < n; i++)
    prefix[i + 1] = (prefix[i] as number) + (freq[i] as number);
  const dp: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      let best = INF;
      for (let k = i; k < j; k++) {
        const val =
          ((dp[i] as number[])[k] as number) +
          ((dp[k + 1] as number[])[j] as number);
        if (val < best) best = val;
      }
      (dp[i] as number[])[j] =
        best + ((prefix[j + 1] as number) - (prefix[i] as number));
    }
  }
  return (dp[0] as number[])[n - 1] as number;
}

const CASES: [string, number[], number][] = [
  ["[10,20,30] → 90", [10, 20, 30], 90],
  ["[40,30,30,20] 검증", [40, 30, 30, 20], 240],
  ["[1,2,3,4,5] 검증", [1, 2, 3, 4, 5], 33],
  ["길이 1 — 병합할 것 없음 → 0", [100], 0],
  ["길이 2 — 단일 병합", [5, 7], 12],
  ["모두 같은 값 [10,10,10,10]", [10, 10, 10, 10], 80],
  ["0 포함 [0,5,0]", [0, 5, 0], 10],
  ["모두 0인 배열 → 0", [0, 0, 0, 0], 0],
  ["매우 큰 값 단일 [10^6]", [1_000_000], 0],
  ["[1,2,3] → 9", [1, 2, 3], 9],
  ["[10,20] → 30", [10, 20], 30],
  ["본문 전개가 쓰는 고정 입력", [1, 3, 5, 2], 22],
];

for (const [name, freq, want] of CASES) {
  test(`정본 — ${name}`, () => {
    expect(knuthOptimization(freq)).toBe(want);
  });
}

test("빈 배열도 0 을 돌려준다", () => {
  expect(knuthOptimization([])).toBe(0);
});

test("크기가 하나뿐이면 그 값과 무관하게 0 이다", () => {
  for (const v of [0, 1, 7, 1_000_000]) expect(knuthOptimization([v])).toBe(0);
});

test("파일 500 개에서 후보를 전부 넣은 답과 같다", () => {
  const freq = Array.from({ length: 500 }, (_, i) => (i % 97) + 1);
  expect(knuthOptimization(freq)).toBe(fullScan(freq));
});

test("크기가 모두 같은 배열 · 앞이 큰 배열에서도 전부 넣은 답과 같다", () => {
  const flat = new Array<number>(120).fill(1);
  const head = Array.from({ length: 120 }, (_, i) => (i === 0 ? 1000 : 1));
  const tail = Array.from({ length: 120 }, (_, i) => (i === 119 ? 1000 : 1));
  for (const freq of [flat, head, tail]) {
    expect(knuthOptimization(freq)).toBe(fullScan(freq));
  }
});

test("길이 1~9 를 전수로 만들어 전부 넣은 답과 대조한다", () => {
  for (let n = 1; n <= 9; n++) {
    for (let seed = 0; seed < 40; seed++) {
      const freq = Array.from(
        { length: n },
        (_, i) => ((i + 1) * (seed + 3) * 7919) % 23,
      );
      expect(knuthOptimization(freq)).toBe(fullScan(freq));
    }
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본과 같은
 * 답을 내는지 스스로 대조하는 걸음 기록에서 만든 걸음 — 와 글자 그대로 같아야 한다. 다르면 리터럴을
 * 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./knuthOptimization-guide.sim.ts");
  const { simStepsFromRef, TABLE_OPTIONS } = await import(
    "./knuthOptimization-guide.fig.tsx"
  );
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.knuthWalk.steps)).toEqual(plain(simStepsFromRef()));
  expect(plain(sim.knuthWalk.rowHeads)).toEqual(plain(TABLE_OPTIONS.rowHeads));
  expect(plain(sim.knuthWalk.colHeads)).toEqual(plain(TABLE_OPTIONS.colHeads));
  expect(plain(sim.knuthWalk.strip)).toEqual(plain(TABLE_OPTIONS.strip));
  // 패널이 내미는 답과 마지막 걸음의 DP 테이블이 정본과 같은지 — 정본에 직접 다시 묻는다.
  const freq = [1, 3, 5, 2];
  expect(sim.knuthWalk.result).toBe(String(knuthOptimization(freq)));
  expect(sim.knuthWalk.steps.at(-1)?.table[0]?.at(-1)).toBe(
    String(knuthOptimization(freq)),
  );
  // 걸음 수 — 준비 한 걸음 + 칸 n(n-1)/2 개 + 반환 한 걸음.
  expect(sim.knuthWalk.steps.length).toBe(1 + (4 * 3) / 2 + 1);
});
