/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/graph/zeroOneBfs/zeroOneBfs.ts` 는 학습자 스텁이라 절차가 없다.
 * 여기 있는 것이 가이드가 가르치는 절차다 — 간선 목록을 이웃 목록으로 바꾸고, 시작 정점을
 * 덱에 넣은 뒤, **덱 앞에서 정점을 꺼내 가중치 0 인 이웃은 덱 앞에, 가중치 1 인 이웃은 덱
 * 뒤에** 넣는다. 가이드 본문의 전체 코드는 이 파일에서 옮긴다.
 *
 * **계수를 세거나 덱 내부를 들여다보는 사본은 여기 두지 않는다.** 그런 사본은
 * `zeroOneBfs-guide.proof.ts` 가 따로 갖는다 — 이 파일은 가이드가 싣는 코드와 글자 그대로
 * 같아야 한다.
 *
 * **`if (w === 0)` 와 `else` 를 중괄호로 감싼 것에 이유가 있다.** `invariant` 절의 ③ 이
 * **덱 앞에 넣는 줄 하나만** 지운 사본을 만들어 실행하는데(`check-proof.ts` 의 `loadMutant`),
 * 중괄호가 없으면 그 줄을 지운 자리에 `else` 만 남아 문법이 깨진다.
 */

/** 간선 하나 — `[u, v, w]` 는 가중치 `w` 인 방향 간선 `u → v` 이고 `w` 는 0 이거나 1 이다. */
export type Edge = [number, number, number];

/**
 * 가중치가 0 이거나 1 인 방향 그래프에서 `source` 로부터 각 정점까지의 최소 비용.
 * 도달할 수 없는 정점은 `-1` 이고 `source` 자신은 `0` 이다.
 */
export function zeroOneBfs(n: number, edges: Edge[], source: number): number[] {
  // 아직 아무 경로도 못 찾은 상태를 `Infinity` 로 둔다. 어떤 유한한 값도 그보다 작다.
  const dist: number[] = Array.from(
    { length: n },
    () => Number.POSITIVE_INFINITY,
  );

  // 방향 간선이므로 `u` 쪽 목록에만 넣는다.
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) (adj[u] as [number, number][]).push([v, w]);

  dist[source] = 0;
  const deque = new ZeroOneDeque();
  deque.pushBack(source);

  while (deque.size() > 0) {
    const u = deque.popFront() as number;

    for (const [v, w] of adj[u] as [number, number][]) {
      const nd = (dist[u] as number) + w;

      // ① 지금 적힌 값보다 작지 않다 — 고칠 것이 없으므로 그대로 둔다.
      if (nd >= (dist[v] as number)) continue;

      dist[v] = nd;
      if (w === 0) {
        // ② 비용 0 — 거리가 그대로라 덱 앞에 넣는다.
        deque.pushFront(v);
      } else {
        // ③ 비용 1 — 거리가 하나 커져 덱 뒤에 넣는다.
        deque.pushBack(v);
      }
    }
  }

  // ④ 한 번도 도달하지 못한 정점을 `-1` 로 적는다.
  return dist.map((d) => (d === Number.POSITIVE_INFINITY ? -1 : d));
}

/**
 * 앞뒤 어느 쪽으로도 넣고 앞에서 꺼내는 덱.
 *
 * 배열 두 개로 만든다 — `front` 는 **뒤집어** 담아서 마지막 칸이 논리적 맨 앞이고, `back` 은
 * 그대로 담아서 첫 칸이 `front` 를 다 꺼낸 다음 차례다. 네 연산이 전부 배열 끝을 건드리므로
 * 원소를 옮기는 자리가 `front` 가 비었을 때의 뒤집기 한 곳뿐이다.
 */
class ZeroOneDeque {
  private front: number[] = [];
  private back: number[] = [];

  size(): number {
    return this.front.length + this.back.length;
  }

  pushFront(x: number): void {
    this.front.push(x);
  }

  pushBack(x: number): void {
    this.back.push(x);
  }

  popFront(): number | undefined {
    if (this.front.length === 0) {
      // `reverse()` 는 `back` 을 제자리에서 뒤집고 같은 배열을 돌려준다. 그래서 다음 줄이
      // 새 배열을 넣어 두 이름이 같은 배열을 가리키는 상태를 끊는다.
      this.front = this.back.reverse();
      this.back = [];
    }
    return this.front.pop();
  }
}
