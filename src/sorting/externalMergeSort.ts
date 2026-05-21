/**
 * External Merge Sort (외부 정렬)
 *
 * 메모리에 모두 적재할 수 없는 대용량 정수 데이터 파일을 정렬한다.
 *
 * 입력 파일 `inputPath`는 한 줄에 정수 하나씩 저장된 텍스트 파일이다.
 * 메모리 제한 `memoryLimit`(원소 개수 단위)을 넘지 않게 다음 두 단계로 정렬한다:
 *
 * 1. Run 생성: 입력을 $\lceil N / M \rceil$개의 청크로 분할하여 각 청크를
 *    메모리에서 정렬한 뒤 임시 파일(run)에 기록한다. 비용 $O(N \log M)$.
 * 2. K-way merge: 모든 run을 최소힙으로 병합하여 `outputPath`에 기록한다.
 *    비용 $O(N \log R)$, 여기서 $R$은 run 개수.
 *
 * 총 시간 복잡도:
 *
 * $$T(N, M) = O\left( N \log M + N \log \lceil N/M \rceil \right) = O(N \log N)$$
 *
 * 디스크 I/O는 $O(N)$ 회 읽고/쓴다.
 *
 * 제약:
 * - $1 \leq N \leq 10^7$, $1 \leq M \leq N$
 * - 동시에 메모리에 적재되는 정수 개수는 $O(M + R)$을 초과하지 않아야 한다.
 *
 * @param inputPath - 정렬할 입력 파일 경로 (라인당 정수 1개)
 * @param outputPath - 정렬 결과를 기록할 출력 파일 경로
 * @param memoryLimit - 메모리에 동시에 올릴 수 있는 정수 개수 상한 ($M$)
 * @returns 작성된 출력 파일 경로 (`outputPath`와 동일)
 */
export function externalMergeSort(
  inputPath: string,
  outputPath: string,
  memoryLimit: number,
): Promise<string> {
  throw new Error("Not implemented");
}
