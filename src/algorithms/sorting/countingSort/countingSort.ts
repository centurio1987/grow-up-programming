export function countingSort(A: number[]): number[] {
  //초기화
  const frequencyList: number[] = Array.from({ length: 1001 }, () => 0);
  const outputList: number[] = [];

  for (let item of A) {
    frequencyList[item]!++;
  }

  for (let i = 0; i < frequencyList.length; i++) {
    for (let freq = 0; freq < frequencyList[i]!; freq++) {
      outputList.push(i);
    }
  }

  return outputList;
}
