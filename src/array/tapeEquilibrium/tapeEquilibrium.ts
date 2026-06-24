export function tapeEquilibrium(_A: number[]): number {
  let D = _A[0]! * 2 - _A.reduce((acc, cur) => acc + cur);
  let min = Math.abs(D);

  for (let p = 1; p < _A.length - 1; p++) {
    const Dnext = D + 2 * _A[p]!;
    if (min > Math.abs(Dnext)) {
      min = Math.abs(Dnext);
    }

    D = Dnext;
  }

  return min;
}
