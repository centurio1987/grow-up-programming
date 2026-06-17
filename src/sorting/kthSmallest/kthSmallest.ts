export function kthSmallest(A: number[], k: number): number {
  A.sort((a, b) => a - b);

  return A[k - 1]!;
}
