export function binarySearch(A: number[], target: number): number {
  //가정
  if (A.length < 1) {
    return -1;
  }

  //초기화
  let left = 0;
  let right = A.length - 1;

  //종료 조건 및 핵심 로직
  while (left <= right) {
    let mid = left + Math.floor((right - left) / 2);

    if (target === A[mid]!) {
      return mid;
    } else if (target < A[mid]!) {
      right = mid - 1;
    } else if (target >= A[mid]!) {
      left = mid + 1;
    }
  }

  //리턴
  return -1;
}
