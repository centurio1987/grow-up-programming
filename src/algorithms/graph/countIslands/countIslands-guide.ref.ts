/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/countIslands/countIslands.ts` 는 학습자 스텁이라 본문에 실을 수
 * 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 격자를 행
 * 우선으로 한 번 통과하면서 아직 표시가 없는 땅 칸을 만나면 섬 수를 하나 늘리고, 그 칸에서
 * 시작한 스택 한 바퀴가 그 덩어리의 칸을 전부 표시한다.
 *
 * **재귀를 쓰지 않는다.** 이 문제의 제약은 칸 수 `R·C ≤ 10^6` 이고, 한 줄로 이어진 섬이
 * 들어오면 재귀 깊이가 그 섬의 칸 수까지 자란다. 호출 한도는 실행 환경이 정하는 값이라
 * 깊이를 입력에 맡길 수 없어서, 담아 두는 자리를 **배열 하나**로 옮겨 잡았다.
 *
 * **입력을 변형하지 않는다.** 문제 계약이 `grid` 와 그 행 배열을 모두 그대로 두라고 못
 * 박았다. 방문 칸을 `0` 으로 덮어쓰는 흔한 구현은 여기서 쓸 수 없고, 그래서 같은 칸 수짜리
 * 표시 배열 `seen` 을 따로 잡는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 바깥
 * 반복의 `seen[start] === true` 검사가 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 * 그 검사를 빼면 같은 섬을 그 섬의 칸 수만큼 되풀이해 센다.
 *
 * 절차 자체가 다른 것(표시를 꺼낼 때 켜기 · 큐로 바꾸기 · 재귀 · 여덟 방향)은 변이가 아니라
 * 별도 구현이라 `countIslands-guide.proof.ts` 안에 따로 적었다.
 */

/** 상 · 하 · 좌 · 우. 이 넷이 문제가 말하는 「한 변을 공유한다」의 전부다. */
const DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * `0`(물)과 `1`(땅)로 채워진 직사각형 격자에서 상하좌우로 이어진 땅 덩어리의 개수.
 * 대각선으로만 닿은 두 칸은 다른 덩어리다. 입력 `grid` 는 변형하지 않는다.
 */
export function countIslands(grid: number[][]): number {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;

  // `seen[r * C + c]` 는 칸 (r, c) 가 **이미 센 섬에 속한 것으로 처리됐는가** 다.
  const seen: boolean[] = Array.from({ length: R * C }, () => false);
  const stack: number[] = [];
  let islands = 0;

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const start = r * C + c;
      // ① 물이거나 이미 센 섬의 칸이다 — 여기서 새 섬을 시작하지 않는다.
      if ((grid[r] as number[])[c] === 0 || seen[start] === true) continue;

      // ② 표시가 없는 땅 칸이다 — 새 섬 하나가 여기서 시작한다.
      islands++;
      seen[start] = true;
      stack.push(start);

      while (stack.length > 0) {
        const cur = stack.pop() as number;
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of DIRS) {
          const nr = cr + dr;
          const nc = cc + dc;
          // ③ 격자 밖이다 — 값을 읽기 **전에** 거른다.
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;

          const next = nr * C + nc;
          // ④ 물이거나 이미 담은 칸이다 — 다시 담으면 같은 칸을 두 번 처리한다.
          if ((grid[nr] as number[])[nc] === 0 || seen[next] === true) continue;

          // ⑤ 처음 보는 땅 칸이다 — **담는 그 자리에서** 표시를 켠다.
          seen[next] = true;
          stack.push(next);
        }
      }
    }
  }

  return islands;
}
