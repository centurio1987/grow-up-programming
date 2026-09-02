/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/segmentTreeRangeMin/segmentTreeRangeMin.ts` 는 학습자 스텁이라
 * 가이드가 그대로 인용할 수 없다. 가이드 본문의 코드는 이 파일에서 옮기고, 증명
 * 사이드카(`*.proof.ts`)와 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 세 곳을
 * 바꾼다 — 통째로 들어가는지 재는 조건 한 줄 · 질의 호출부 한 줄 · 상향 재계산 한 줄
 * (꼬리 주석의 원문자 ⑤ 로 찾는다).
 * 맞는 줄이 정확히 하나가 아니면 던지므로, 그 세 식을 주석에 다시 적지 않는다.
 */

export type SegOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

/**
 * 정수 배열 `A` 에 점 갱신과 구간 최솟값 질의를 섞어 걸고, 질의의 답만 순서대로 돌려준다.
 *
 * `update` 는 `A[i]` 를 `v` 로 덮어쓰고(누적이 아니다), `query` 는 양끝을 포함하는 구간
 * `[l, r]` 의 최솟값을 답한다. 질의가 하나도 없으면 빈 배열을 돌려준다.
 */
export function segmentTreeRangeMin(A: number[], ops: SegOp[]): number[] {
  const N = A.length;
  // 겹치지 않는 가지가 돌려줄 값. 어떤 원소보다도 커야 최솟값 계산을 바꾸지 않는다.
  const INF = Number.MAX_SAFE_INTEGER;
  // 노드 번호가 이 칸 수를 넘지 않는다 — 근거는 「수식 정의와 유도」에 있다.
  const tree = new Array<number>(4 * N).fill(INF);

  /** 자식 둘의 값을 합쳐 부모 값을 만든다. 아직 안 채운 칸은 INF 로 읽는다. */
  const merge = (node: number): number =>
    Math.min(tree[2 * node] ?? INF, tree[2 * node + 1] ?? INF);

  /** 노드 `node` 가 구간 `[s, e]` 를 담당하도록 아래에서 위로 값을 채운다. */
  function build(node: number, s: number, e: number): void {
    if (s === e) {
      tree[node] = A[s] ?? INF;
      return;
    }
    const mid = (s + e) >> 1;
    build(2 * node, s, mid);
    build(2 * node + 1, mid + 1, e);
    tree[node] = merge(node);
  }

  /** `A[i]` 를 `v` 로 바꾸고 그 리프에서 뿌리까지의 노드만 다시 계산한다. */
  function update(
    node: number,
    s: number,
    e: number,
    i: number,
    v: number,
  ): void {
    if (s === e) {
      tree[node] = v; // ④ 리프 도달 — 새 값을 그대로 쓴다
      return;
    }
    const mid = (s + e) >> 1;
    if (i <= mid) update(2 * node, s, mid, i, v);
    else update(2 * node + 1, mid + 1, e, i, v);
    tree[node] = merge(node); // ⑤ 상향 재계산
  }

  /** 노드 `node`(담당 `[s, e]`)에서 질의 `[l, r]` 의 최솟값을 답한다. */
  function query(
    node: number,
    s: number,
    e: number,
    l: number,
    r: number,
  ): number {
    if (r < s || e < l) return INF; // ① 겹치지 않는다
    if (l <= s && e <= r) return tree[node] ?? INF; // ② 통째로 들어간다
    const mid = (s + e) >> 1;
    // ③ 걸쳐 있다 — 두 자식에게 나눠 묻고 작은 쪽을 고른다
    return Math.min(
      query(2 * node, s, mid, l, r),
      query(2 * node + 1, mid + 1, e, l, r),
    );
  }

  build(1, 0, N - 1);

  const result: number[] = [];
  for (const op of ops) {
    if (op.type === "update") update(1, 0, N - 1, op.i, op.v);
    else result.push(query(1, 0, N - 1, op.l, op.r));
  }
  return result;
}
