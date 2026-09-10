/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/binary-search/ternarySearch/ternarySearch.ts` 와 **같은 계약**이다 —
 * 단봉 함수 `f` 와 닫힌 구간 `[lo, hi]`, 허용 오차 `epsilon` 을 받아 최솟점의 근삿값을
 * 돌려준다. 원본은 학습자가 채우는 스텁이라 본문이 그것을 옮길 수 없다.
 *
 * 이름은 가이드 기호표에 맞췄다 — `third` 는 구간 길이의 3분의 1, `m1`·`m2` 는 이번에
 * 함숫값을 잴 두 내부점이다. 가이드 본문의 코드는 이 파일에서 옮긴다.
 */

/**
 * `[lo, hi]` 위에서 단봉인 `f` 의 최솟점을 오차 `epsilon` 이내로 찾는다.
 *
 * 반환값은 마지막 구간의 중점이고, 실제 최솟점과의 거리는 `epsilon / 2` 를 넘지 않는다.
 */
export function ternarySearch(
  f: (x: number) => number,
  lo: number,
  hi: number,
  epsilon: number,
): number {
  // 후보 구간은 닫힌 구간 [lo, hi] 다. 시작할 때 이미 epsilon 이하면 반복에 들어가지 않는다.
  while (hi - lo > epsilon) {
    // 구간 길이의 3분의 1. 구간이 줄면 이 값도 함께 줄어야 하므로 반복 안에서 다시 계산한다.
    const third = (hi - lo) / 3;
    const m1 = lo + third;
    const m2 = hi - third;

    if (f(m1) < f(m2)) {
      // ① 왼쪽 점이 더 낮다 — 최솟점은 m2 왼쪽이다. 오른쪽 3분의 1 을 후보에서 뺀다.
      hi = m2;
    } else {
      // ② 오른쪽 점이 더 낮거나 같다 — 최솟점은 m1 오른쪽이다. 왼쪽 3분의 1 을 뺀다.
      lo = m1;
    }
  }

  // 남은 구간의 길이가 epsilon 이하다. 중점과 최솟점의 거리는 epsilon / 2 를 넘지 않는다.
  return (lo + hi) / 2;
}
