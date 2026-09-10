/**
 * `deep.walk.final` 이 싣는 코드의 정본.
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

  // 구역 크기. 식의 `B` 가 이것이다 — √n 이 이동 총량을 가장 작게 만든다(「수식 정의와 유도」 ④).
  const block = Math.max(1, Math.floor(Math.sqrt(arr.length)));
  // 식의 `blk(l)`. 왼쪽 끝이 `l` 인 질의의 구역 번호다.
  const blk = (l: number): number => Math.floor(l / block);

  // 원래 순서를 잃지 않으려고 인덱스를 함께 들고 정렬한다.
  const order = queries.map((q, i) => ({ l: q[0], r: q[1], i }));
  order.sort((x, y) => {
    if (blk(x.l) !== blk(y.l)) return blk(x.l) - blk(y.l);
    // 같은 구역 안에서는 r 로 정렬한다. curR 이 한 방향으로만 이동하게 된다.
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
    while (curL > q.l) add(arr[--curL] as number); // L+ 왼쪽 넓힘
    while (curR < q.r) add(arr[++curR] as number); // R+ 오른쪽 넓힘
    while (curL < q.l) remove(arr[curL++] as number); // L− 왼쪽 좁힘
    while (curR > q.r) remove(arr[curR--] as number); // R− 오른쪽 좁힘
    out[q.i] = distinct;
  }

  return out;
}
