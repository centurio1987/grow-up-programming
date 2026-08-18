/**
 * `code.final` 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/array/mosAlgorithm/mosAlgorithm.ts` 는 학습자 스텁(`Not implemented`)
 * 이라 그대로 쓸 수 없다. **케이스만 물려받고 구현은 여기서 새로 짓는다.**
 */

/** 각 구간 `[l, r]` 의 서로 다른 원소 수를 **질의 입력 순서 그대로** 돌려준다. */
export function mosAlgorithm(
  arr: number[],
  queries: [number, number][],
): number[] {
  if (queries.length === 0) return [];

  // 블록 크기. √n 이 이동 총량을 가장 작게 만든다 — 가이드의 「비용을 세는 과정」 참고.
  const block = Math.max(1, Math.floor(Math.sqrt(arr.length)));

  // 원래 순서를 잃지 않으려고 인덱스를 함께 들고 정렬한다.
  const order = queries.map((q, i) => ({ l: q[0], r: q[1], i }));
  order.sort((x, y) => {
    const bx = Math.floor(x.l / block);
    const by = Math.floor(y.l / block);
    if (bx !== by) return bx - by;
    // 같은 블록 안에서는 r 로 정렬한다. r 가 한 방향으로만 흐르게 된다.
    return x.r - y.r;
  });

  const count = new Map<number, number>();
  let distinct = 0;
  const add = (value: number): void => {
    const next = (count.get(value) ?? 0) + 1;
    count.set(value, next);
    if (next === 1) distinct++;
  };
  const remove = (value: number): void => {
    const next = (count.get(value) as number) - 1;
    count.set(value, next);
    if (next === 0) distinct--;
  };

  const out = new Array<number>(queries.length);
  // 빈 구간에서 시작한다. `curL > curR` 이면 아무것도 안 담은 상태다.
  let curL = 0;
  let curR = -1;

  for (const q of order) {
    // 넓히기를 먼저, 좁히기를 나중에. 반대로 하면 `curL` 이 `curR` 을 앞질러
    // 담지도 않은 값을 빼게 된다.
    while (curL > q.l) add(arr[--curL] as number);
    while (curR < q.r) add(arr[++curR] as number);
    while (curL < q.l) remove(arr[curL++] as number);
    while (curR > q.r) remove(arr[curR--] as number);
    out[q.i] = distinct;
  }

  return out;
}
