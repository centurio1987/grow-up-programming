export function insertionSort(A: number[]): number[] {
  const sortedA: number[] = [];

  for (let item of A) {
    sortedA.push(item);
    for (let i = sortedA.length - 2; i >= 0; i--) {
      if (sortedA[i]! > sortedA[sortedA.length - 1]!) {
        let swap = sortedA[i]!;
        sortedA[i] = sortedA[sortedA.length - 1]!;
        sortedA[sortedA.length - 1] = swap;

        break;
      }
    }
  }

  return sortedA;
}
