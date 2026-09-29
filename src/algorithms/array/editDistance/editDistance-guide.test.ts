/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/array/editDistance/editDistance.test.ts` 는 학습자가 채우는 파일을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다. 벽시계를 재는
 * 「성능」 케이스는 옮기지 않았다 — 실행마다 값이 달라 판정이 안 된다. 그 케이스의
 * **입출력**(N=M=1,000 에서의 반환값)은 아래에서 그대로 확인한다.
 */
import { expect, test } from "bun:test";
import { editDistance } from "./editDistance-guide.ref.ts";

const CASES: [string, string, number][] = [
  // 기본
  ["horse", "ros", 3],
  ["intention", "execution", 5],
  ["abc", "abc", 0],
  ["kitten", "sitting", 3],
  ["flaw", "lawn", 2],
  // 엣지
  ["", "abc", 3],
  ["abc", "", 3],
  ["", "", 0],
  ["a", "b", 1],
  ["a", "ab", 1],
  ["ab", "a", 1],
  // 바운더리
  ["x", "x", 0],
];

for (const [s, t, want] of CASES) {
  test(`정본 — "${s}" · "${t}"`, () => {
    expect(editDistance(s, t)).toBe(want);
  });
}

test("본문 전개가 쓰는 입력", () => {
  // `deep.build`·`deep.walk`·`.sim.ts` 가 모두 이 입력을 쓴다.
  expect(editDistance("horse", "ros")).toBe(3);
});

test("N=1,000 을 빈 문자열로", () => {
  expect(editDistance("a".repeat(1000), "")).toBe(1000);
});

test("N=1,000 동일 문자열", () => {
  const s = "a".repeat(1000);
  expect(editDistance(s, s)).toBe(0);
});

test("N=M=1,000 공통 글자 없음", () => {
  // 원본 테스트의 「성능」 케이스와 같은 입력이다. 벽시계 대신 반환값만 본다.
  expect(editDistance("a".repeat(1000), "b".repeat(1000))).toBe(1000);
});

/**
 * 한 번의 편집으로 갈 수 있는 문자열을 전부 만들며 너비 우선으로 찾아가는 기준 구현.
 * 편집 거리의 정의를 그대로 옮긴 것이라 답의 기준이 된다.
 *
 * 알파벳은 `s` 와 `t` 에 나오는 글자로 제한한다 — 최소 비용 편집 목록은 `t` 에 없는 글자를
 * 새로 넣을 이유가 없으므로 답이 달라지지 않는다.
 */
function byBreadthFirst(s: string, t: string): number {
  if (s === t) return 0;
  const alphabet = [...new Set([...s, ...t])];
  let frontier = new Set([s]);
  const seen = new Set([s]);
  for (let depth = 1; depth <= 6; depth++) {
    const next = new Set<string>();
    for (const x of frontier) {
      const neighbours: string[] = [];
      for (let k = 0; k < x.length; k++) {
        neighbours.push(x.slice(0, k) + x.slice(k + 1)); // 삭제
        for (const ch of alphabet) {
          if (ch !== x[k]) neighbours.push(x.slice(0, k) + ch + x.slice(k + 1)); // 교체
        }
      }
      for (let k = 0; k <= x.length; k++) {
        for (const ch of alphabet) {
          neighbours.push(x.slice(0, k) + ch + x.slice(k)); // 삽입
        }
      }
      for (const y of neighbours) {
        if (y === t) return depth;
        if (seen.has(y)) continue;
        seen.add(y);
        next.add(y);
      }
    }
    frontier = next;
  }
  throw new Error(`깊이 6 안에서 "${t}" 에 도달하지 못했다`);
}

test("작은 입력 전수에서 한 번씩 편집해 찾아가는 방식과 같은 답을 낸다", () => {
  // 알파벳 {a,b} 위의 길이 0~3 문자열 쌍 전부(15 × 15 = 225 쌍).
  const words: string[] = [];
  for (let len = 0; len <= 3; len++) {
    for (let code = 0; code < 2 ** len; code++) {
      let w = "";
      for (let k = 0; k < len; k++) w += ((code >> k) & 1) === 1 ? "b" : "a";
      words.push(w);
    }
  }
  for (const s of words) {
    for (const t of words) {
      expect(editDistance(s, t)).toBe(byBreadthFirst(s, t));
    }
  }
});

test("답은 길이 차이 이상이고 긴 쪽의 길이 이하다", () => {
  for (let seed = 0; seed < 200; seed++) {
    const s = Array.from(
      { length: (seed % 9) + 1 },
      (_, k) => "abcd"[((seed + 1) * (k + 3) * 7) % 4] as string,
    ).join("");
    const t = Array.from(
      { length: (seed % 7) + 1 },
      (_, k) => "abcd"[((seed + 2) * (k + 5) * 11) % 4] as string,
    ).join("");
    const got = editDistance(s, t);
    expect(got).toBeGreaterThanOrEqual(Math.abs(s.length - t.length));
    expect(got).toBeLessThanOrEqual(Math.max(s.length, t.length));
    // 세 연산의 비용이 같으므로 두 문자열의 순서를 바꿔도 답이 같다.
    expect(editDistance(t, s)).toBe(got);
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에서
 * 만든 계측 사본을 실행해 걸음을 만드는 함수 — 와 글자 그대로 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./editDistance-guide.sim.ts");
  const { simStepsFromRef, trace, TABLE_OPTIONS, S, T } = await import(
    "./editDistance-guide.fig.tsx"
  );
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.row12.steps)).toEqual(plain(want.row12));
  expect(plain(sim.row34.steps)).toEqual(plain(want.row34));
  expect(plain(sim.row5.steps)).toEqual(plain(want.row5));
  for (const part of [sim.row12, sim.row34, sim.row5]) {
    expect(plain(part.rowHeads)).toEqual(plain(TABLE_OPTIONS.rowHeads));
    expect(plain(part.colHeads)).toEqual(plain(TABLE_OPTIONS.colHeads));
  }
  // 패널이 내미는 값이 정본의 DP 테이블 · 답과 같은지 — 정본에 직접 다시 묻는다.
  const rows = trace(S, T).rows;
  expect(sim.row12.result).toBe(`[${rows[2]?.join(", ")}]`);
  expect(sim.row34.result).toBe(`[${rows[4]?.join(", ")}]`);
  expect(sim.row5.result).toBe(String(editDistance(S, T)));
});
