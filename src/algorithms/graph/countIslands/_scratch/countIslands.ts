// 자기검증용 스크래치 — countIslands 문제/테스트/가이드 본문 값을 실측 검증한다. 프로덕션 아님.
// 실행: bun src/algorithms/graph/countIslands/_scratch/countIslands.ts

type Grid = number[][];

// (A) base — 재귀 flood fill. 간결하지만 큰 그리드에서 호출 스택 오버플로 위험.
// 입력 grid는 변형하지 않고 별도 visited를 쓴다.
function countRecursive(grid: Grid): number {
  const R = grid.length;
  if (R === 0) return 0;
  const C = grid[0]!.length;
  if (C === 0) return 0;
  const visited: boolean[][] = Array.from({ length: R }, () => new Array(C).fill(false));
  let count = 0;

  const fill = (r: number, c: number) => {
    if (r < 0 || r >= R || c < 0 || c >= C) return;
    if (visited[r]![c] || grid[r]![c] !== 1) return;
    visited[r]![c] = true;
    fill(r - 1, c);
    fill(r + 1, c);
    fill(r, c - 1);
    fill(r, c + 1);
  };

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r]![c] === 1 && !visited[r]![c]) {
        count++;
        fill(r, c);
      }
    }
  }
  return count;
}

// (B) optimized — 명시적 스택 flood fill. 큰 그리드에서도 스택 깊이에 안전.
function countIterative(grid: Grid): number {
  const R = grid.length;
  if (R === 0) return 0;
  const C = grid[0]!.length;
  if (C === 0) return 0;
  const visited = new Uint8Array(R * C);
  let count = 0;
  const stack: number[] = [];
  const DR = [-1, 1, 0, 0];
  const DC = [0, 0, -1, 1];

  for (let sr = 0; sr < R; sr++) {
    for (let sc = 0; sc < C; sc++) {
      if (grid[sr]![sc] !== 1 || visited[sr * C + sc]) continue;
      count++;
      stack.push(sr * C + sc);
      visited[sr * C + sc] = 1;
      while (stack.length > 0) {
        const id = stack.pop()!;
        const r = (id / C) | 0;
        const c = id % C;
        for (let d = 0; d < 4; d++) {
          const nr = r + DR[d]!;
          const nc = c + DC[d]!;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          const nid = nr * C + nc;
          if (visited[nid] || grid[nr]![nc] !== 1) continue;
          visited[nid] = 1;
          stack.push(nid);
        }
      }
    }
  }
  return count;
}

function assertEqual(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`[FAIL] ${label}\n  expected ${e}\n  actual   ${a}`);
  console.log(`[ok] ${label} => ${a}`);
}

type Case = { grid: Grid; expected: number; label: string };
const cases: Case[] = [
  { label: "예시1 L자+고립", grid: [[1, 1, 0], [0, 1, 0], [0, 0, 1]], expected: 2 },
  { label: "예시2 체커보드 5섬", grid: [[1, 0, 1], [0, 1, 0], [1, 0, 1]], expected: 5 },
  { label: "예시3 전부 물", grid: [[0, 0], [0, 0]], expected: 0 },
  { label: "예시4 전부 땅", grid: [[1, 1], [1, 1]], expected: 1 },
  { label: "예시5 단일 땅", grid: [[1]], expected: 1 },
  { label: "예시6 단일 물", grid: [[0]], expected: 0 },
  { label: "예시7 1행 갈라짐", grid: [[1, 0, 1, 1]], expected: 2 },
  { label: "경계 빈 그리드", grid: [], expected: 0 },
  { label: "경계 빈 행", grid: [[]], expected: 0 },
  { label: "경계 대각선만 접함", grid: [[1, 0], [0, 1]], expected: 2 },
  { label: "경계 N행1열", grid: [[1], [1], [0], [1]], expected: 2 },
];

for (const c of cases) {
  const rec = countRecursive(c.grid);
  const it = countIterative(c.grid);
  assertEqual(rec, c.expected, `${c.label} (recursive)`);
  assertEqual(it, c.expected, `${c.label} (iterative)`);
}

// 입력 불변 확인
{
  const grid: Grid = [[1, 1, 0], [0, 1, 0], [0, 0, 1]];
  const snap = JSON.stringify(grid);
  countIterative(grid);
  assertEqual(JSON.stringify(grid), snap, "입력 grid 불변");
}

// 큰 그리드: 재귀는 터지고 반복은 안전
{
  const N = 1000; // 1000x1000 = 10^6 셀, 전부 땅 → 1 섬
  const grid: Grid = Array.from({ length: N }, () => new Array(N).fill(1));

  let recursiveOverflowed = false;
  try {
    countRecursive(grid);
  } catch (e) {
    recursiveOverflowed = e instanceof RangeError;
  }
  console.log(`[obs] 재귀 ${N}x${N} 오버플로 발생: ${recursiveOverflowed}`);

  const t0 = performance.now();
  const islands = countIterative(grid);
  const elapsed = performance.now() - t0;
  assertEqual(islands, 1, "반복 1000x1000 전부 땅 = 1섬");
  console.log(`[perf] iterative ${N}x${N}: ${elapsed.toFixed(1)}ms`);
}

console.log("\n모든 검증 통과.");
