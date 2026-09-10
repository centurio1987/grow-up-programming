/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/directedCycleDetection/directedCycleDetection.ts` 는 학습자
 * 스텁이라 본문에 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로**
 * 같은 절차다 — 정점마다 색을 하나 두고, 지금 따라가는 경로 위의 정점을 회색으로, 나가는
 * 간선을 전부 확인한 정점을 검은색으로 칠한다. 회색 정점으로 가는 간선을 만나면 사이클이다.
 *
 * **재귀를 쓰지 않는다.** 제약이 정점 100,000 개까지이고 그 정점이 한 줄로 이어진 입력이
 * 들어올 수 있어서, 재귀로 적으면 호출 깊이가 그대로 100,000 이 된다. `stack` 배열과
 * `cursor` 배열로 옮기면 깊이가 배열 길이가 되어 그 제한을 받지 않는다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 두
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 회색인지 보는 조건 `color[v] === GRAY` 를 `color[v] !== WHITE` 로 바꾸면 색이 둘뿐인
 *   절차가 된다. 이미 끝난 정점으로 가는 간선까지 사이클로 판정한다.
 * - 경로에서 뺄 때 `color[u] = BLACK` 을 `color[u] = GRAY` 로 바꾸면 회색이 「지금 경로
 *   위」를 뜻하지 않게 된다. 끝난 정점이 회색으로 남아 다음 탐색이 그것을 사이클로 읽는다.
 */

/** 아직 한 번도 보지 않은 정점. */
const WHITE = 0;
/** 지금 따라가는 경로 위에 있는 정점. `stack` 에 들어 있는 정점과 같은 모임이다. */
const GRAY = 1;
/** 나가는 간선을 전부 확인하고 끝난 정점. 다시 내려갈 이유가 없다. */
const BLACK = 2;

/**
 * 유향 그래프에 사이클이 있으면 `true`, 없으면 `false` 를 돌려준다.
 * 자기 자신을 가리키는 간선 `[v, v]` 도 길이 1 짜리 사이클로 본다.
 */
export function directedCycleDetection(
  n: number,
  edges: [number, number][],
): boolean {
  // 간선 목록을 정점마다의 나가는 목록으로 옮긴다.
  const next: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) (next[u] as number[]).push(v);

  const color: number[] = Array.from({ length: n }, () => WHITE);
  // cursor[u] 는 next[u] 에서 다음에 확인할 자리다. 재귀에서 「돌아온 지점」이 하던 일을 한다.
  const cursor: number[] = Array.from({ length: n }, () => 0);
  const stack: number[] = [];

  for (let s = 0; s < n; s++) {
    if (color[s] !== WHITE) continue;
    color[s] = GRAY;
    stack.push(s);

    while (stack.length > 0) {
      const u = stack[stack.length - 1] as number;
      const list = next[u] as number[];
      const i = cursor[u] as number;

      if (i === list.length) {
        // ④ 나가는 간선을 다 확인했다. 검은색으로 칠하고 경로에서 뺀다.
        color[u] = BLACK;
        stack.pop();
        continue;
      }

      cursor[u] = i + 1;
      const v = list[i] as number;

      // ① 회색 정점으로 가는 간선이다. 지금 경로 위의 정점으로 되돌아왔으므로 사이클이다.
      if (color[v] === GRAY) return true;

      // ② 흰색이면 아직 안 본 정점이다. 회색으로 칠하고 그 정점으로 내려간다.
      if (color[v] === WHITE) {
        color[v] = GRAY;
        stack.push(v);
      }

      // ③ 검은색이면 이미 끝난 정점이다. 아무것도 하지 않고 다음 간선으로 넘어간다.
    }
  }

  return false;
}
