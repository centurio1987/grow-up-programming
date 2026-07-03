export function prefixSumRangeQuery(
  A: number[],
  queries: Array<[number, number]>,
): number[] {
  const result: number[] = [];
  const accSumArr = [A[0]];
  for (let i = 1; i < A.length; i++) {
    accSumArr[i] = accSumArr[i - 1]! + A[i]!;
  }

  for (let query of queries) {
    const r = accSumArr[query[1]!]!;
    const l = query[0]! === 0 ? 0 : accSumArr[query[0]! - 1]!;
    result.push(r - l);
  }

  return result;
}
