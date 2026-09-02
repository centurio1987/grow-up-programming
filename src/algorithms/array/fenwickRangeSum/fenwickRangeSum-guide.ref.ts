/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/fenwickRangeSum/fenwickRangeSum.ts` 는 학습자 스텁이라 가이드가
 * 그대로 인용할 수 없다. 본문의 코드는 이 파일에서 옮기고, 증명 사이드카(`*.proof.ts`)와
 * 재실행 시험(`*.test.ts`)도 이 파일을 부른다.
 *
 * **변이 사이드카가 이 파일의 줄 모양에 기댄다.** `*.proof.ts` 가 `loadMutant` 로 네 곳을
 * 바꾼다 — 넘겨주는 바퀴의 방향 한 줄 · 변화량을 만드는 한 줄 · 접두 합의 오른쪽 끝 한 줄 ·
 * 담당 칸을 따라가는 걸음 한 줄. 맞는 줄이 정확히 하나가 아니면 던지므로, 그 네 식을 주석에
 * 다시 적지 않는다.
 */

export type FenwickOp =
  | { type: "update"; i: number; v: number }
  | { type: "query"; l: number; r: number };

/**
 * 정수 배열 `A` 에 점 갱신과 구간 합 질의를 섞어 걸고, 질의의 답만 순서대로 돌려준다.
 *
 * `update` 는 `A[i]` 를 `v` 로 덮어쓰고(누적이 아니다), `query` 는 양끝을 포함하는 구간
 * `[l, r]` 의 합을 답한다. 질의가 하나도 없으면 빈 배열을 돌려준다.
 */
export function fenwickRangeSum(A: number[], ops: FenwickOp[]): number[] {
  const N = A.length;
  // `update` 가 덮어쓰기라 옛 값이 필요하다. 논리 배열을 따로 들고 tree 와 함께 고친다.
  const arr = A.slice();
  // 칸 0 은 비워 둔다 — 0 의 담당 구간 길이가 0 이라 두 루프가 그 칸에서 멈추지 않는다.
  const tree = new Array<number>(N + 1).fill(0);

  /** 칸 `k` 가 담당하는 구간의 길이. */
  const lowbit = (k: number): number => k & -k;

  /** `arr[i-1]` 이 `delta` 만큼 달라진 것을 그 칸을 담당 구간에 품은 칸 전부에 반영한다. */
  function add(i: number, delta: number): void {
    for (let k = i; k <= N; k += lowbit(k)) {
      tree[k] = (tree[k] ?? 0) + delta; // ① 담당 칸을 따라 올라간다
    }
  }

  /** `arr[0..r-1]` 의 합. `r = 0` 이면 루프가 한 번도 실행되지 않아 0 이다. */
  function prefix(r: number): number {
    let sum = 0;
    for (let k = r; k > 0; k -= lowbit(k)) {
      sum += tree[k] ?? 0; // ② 담당 구간을 이어 붙이며 내려간다
    }
    return sum;
  }

  for (let i = 1; i <= N; i++) tree[i] = arr[i - 1] ?? 0; // ③ 자기 몫만 채운다
  for (let i = 1; i <= N; i++) {
    const j = i + lowbit(i);
    if (j <= N) tree[j] = (tree[j] ?? 0) + (tree[i] ?? 0); // ④ 위 칸에 한 번만 넘긴다
  }

  const result: number[] = [];
  for (const op of ops) {
    if (op.type === "update") {
      const delta = op.v - (arr[op.i] ?? 0); // ⑤ 덮어쓰기를 변화량으로 바꾼다
      arr[op.i] = op.v;
      add(op.i + 1, delta);
    } else {
      result.push(prefix(op.r + 1) - prefix(op.l)); // ⑥ 구간 합을 접두 합 둘의 차로
    }
  }
  return result;
}
