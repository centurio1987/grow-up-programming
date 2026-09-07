/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/dp/tspBitmask/tspBitmask.test.ts` 는 학습자 스텁을 가져오므로 그대로
 * 재사용할 수 없다. **케이스만** 옮겨 정본(`tspBitmask-guide.ref.ts`)에 다시 건다.
 * 벽시계를 재는 케이스(`n = 15` 를 200ms 안에)는 옮기지 않았다 — 실행마다 값이 달라 판정이
 * 안 된다. 같은 규모를 **전이 횟수**로 재는 자리는 「최악을 만드는 입력」이 진다.
 *
 * 도시 20 개짜리 케이스는 옮겼다. 상태 표가 20,971,520 칸이라 실행에 시간이 들지만,
 * **제약 상한이 실제로 도는지**는 이 편이 답해야 하는 것이다.
 */
import { expect, test } from "bun:test";
import { INF, tspBitmask } from "./tspBitmask-guide.ref.ts";

/** 순열을 전부 만들어 보는 기준 구현. 답의 기준으로만 쓴다. */
function bruteForce(dist: number[][]): number {
  const n = dist.length;
  if (n === 1) return 0;
  let best = INF;
  const used = new Array<boolean>(n).fill(false);
  used[0] = true;
  const go = (at: number, depth: number, cost: number): void => {
    if (depth === n) {
      const total = cost + ((dist[at] as number[])[0] as number);
      if (total < best) best = total;
      return;
    }
    const row = dist[at] as number[];
    for (let u = 1; u < n; u++) {
      if (used[u] === true) continue;
      used[u] = true;
      go(u, depth + 1, cost + (row[u] as number));
      used[u] = false;
    }
  };
  go(0, 1, 0);
  return best;
}

test("n=4 고전 예제 — 0→1→3→2→0 = 10+25+30+15", () => {
  expect(
    tspBitmask([
      [0, 10, 15, 20],
      [10, 0, 35, 25],
      [15, 35, 0, 30],
      [20, 25, 30, 0],
    ]),
  ).toBe(80);
});

test("n=3 삼각형", () => {
  expect(
    tspBitmask([
      [0, 1, 2],
      [1, 0, 3],
      [2, 3, 0],
    ]),
  ).toBe(6);
});

test("n=1 — 자기 자신만 방문하므로 0", () => {
  expect(tspBitmask([[0]])).toBe(0);
});

test("n=2 — 0↔1 왕복", () => {
  expect(
    tspBitmask([
      [0, 5],
      [5, 0],
    ]),
  ).toBe(10);
});

test("대칭이 아닌 거리 — 방향이 답을 가른다", () => {
  expect(
    tspBitmask([
      [0, 1, 10],
      [10, 0, 1],
      [1, 10, 0],
    ]),
  ).toBe(3);
});

test("모든 거리가 같으면 어떤 투어든 n × 7", () => {
  const n = 4;
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : 7)),
  );
  expect(tspBitmask(dist)).toBe(n * 7);
});

test("n=20 단일 사이클 거리 (모두 1)", () => {
  const n = 20;
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : 1)),
  );
  expect(tspBitmask(dist)).toBe(n);
});

test("n=5 비용 0 짜리 순환이 있으면 답이 0", () => {
  const n = 5;
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 0;
      if ((i + 1) % n === j || (j + 1) % n === i) return 0;
      return 100;
    }),
  );
  expect(tspBitmask(dist)).toBe(0);
});

test("n=15 생성식 행렬 — 순열을 전부 만든 답과 같다", () => {
  const n = 15;
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      i === j ? 0 : (((i + 1) * (j + 1)) % 97) + 1,
    ),
  );
  expect(tspBitmask(dist)).toBe(192);
});

test("문제 설명의 예시 넷", () => {
  expect(tspBitmask([[0]])).toBe(0);
  expect(
    tspBitmask([
      [0, 5],
      [5, 0],
    ]),
  ).toBe(10);
  expect(
    tspBitmask([
      [0, 10, 15, 20],
      [10, 0, 35, 25],
      [15, 35, 0, 30],
      [20, 25, 30, 0],
    ]),
  ).toBe(80);
  expect(
    tspBitmask([
      [0, 1, 10],
      [10, 0, 1],
      [1, 10, 0],
    ]),
  ).toBe(3);
});

test("도시 3~9 개의 생성식 행렬에서 순열 전수 탐색과 답이 같다", () => {
  for (let n = 3; n <= 9; n++) {
    for (let s = 0; s < 12; s++) {
      const dist = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) =>
          i === j ? 0 : ((i * 7 + j * 13 + s * 29) % 20) + 1,
        ),
      );
      expect(tspBitmask(dist)).toBe(bruteForce(dist));
    }
  }
});

test("거리가 상한 10^6 이어도 합이 정확하다", () => {
  const n = 8;
  const dist = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : 1000000)),
  );
  expect(tspBitmask(dist)).toBe(n * 1000000);
});
