export function insertionSort(A: number[]): number[] {
  const sortedA = Array.from(A);

  for (let i = 1; i < sortedA.length; i++) {
    const key = sortedA[i]!;

    let j = i - 1;
    while (j >= 0) {
      const comparedTarget = sortedA[j]!;

      if (comparedTarget > key) {
        sortedA[j + 1] = comparedTarget;
      } else {
        break;
      }
      j--;
    }
    sortedA[j + 1] = key;
  }

  return sortedA;
}
