# External Merge Sort

## 한 줄 요약

> 메모리에 한 번에 적재할 수 없는 대용량 정수 파일 `inputPath`를 `memoryLimit` 개 단위로 나눠 정렬하고, 결과를 `outputPath`에 기록한 뒤 그 경로를 반환한다.

## 스토리

데이터 센터 야간 배치 작업. 오늘 밤 처리해야 할 로그 파일에는 **`N`개**의 정수가 한 줄씩 저장되어 있다.
문제는 이 파일이 너무 커서 메모리에 한꺼번에 올릴 수 없다는 점이다.

운영팀은 서버 메모리에서 동시에 다룰 수 있는 정수 개수를 **`memoryLimit`개**로 못 박았다.
그 한도 안에서 파일 전체를 오름차순으로 정렬해 새 파일에 저장해야 한다.

## 함수 인터페이스

```ts
export function externalMergeSort(
  inputPath: string,
  outputPath: string,
  memoryLimit: number,
): Promise<string>;
```

- `inputPath` — 한 줄에 정수 하나씩 저장된 입력 텍스트 파일 경로
- `outputPath` — 정렬 결과를 기록할 출력 파일 경로 (한 줄에 정수 하나)
- `memoryLimit` — 동시에 메모리에 적재할 수 있는 정수의 최대 개수
- 반환 — 기록이 완료된 출력 파일 경로 (`outputPath`와 동일한 값)

## 제약 조건

- $1 \leq N \leq 10^7$ — 여기서 $N$은 입력 파일의 정수 개수다.
- $1 \leq \text{memoryLimit} \leq N$
- 동시에 메모리에 적재하는 정수 개수는 $O(\text{memoryLimit} + R)$를 초과하지 않아야 한다. 여기서 $R$은 분할된 run 파일의 개수다.
- $-10^9 \leq \text{각 정수} \leq 10^9$ — 음수가 포함될 수 있다.
- 입력 파일은 한 줄에 정수 하나씩 저장된 텍스트 파일이다. 빈 줄은 없다.
- 시간 제한: 1초(단, 디스크 I/O 비용으로 완화 가능), 메모리 제한: $O(\text{memoryLimit} + R)$

## 문제 상세

메모리에 모두 적재할 수 없는 대용량 정수 파일을 정렬하는 **외부 정렬(External Sort)** 을 구현한다.

- **분할 단계.** 입력 파일을 `memoryLimit`개 단위로 읽어 각 청크를 내부에서 정렬한 뒤 임시 파일(run)로 저장한다. 마지막 청크는 `memoryLimit`보다 작을 수 있다.
- **병합 단계.** 생성된 run 파일들을 동시에 열어 가장 작은 값을 순서대로 골라 `outputPath`에 기록한다. 병합 중 메모리에 유지하는 정수 수는 $O(R)$ 이하여야 한다.
- **출력 형식.** 결과 파일은 입력과 동일하게 한 줄에 정수 하나씩, 오름차순으로 기록된다.
- **반환값.** 기록이 완료된 뒤 `outputPath`를 반환한다.
- **임시 파일.** 함수가 생성한 임시 run 파일은 함수 종료 전에 정리해도 되고 남겨도 되지만, `outputPath`가 최종 결과 파일이어야 한다.
- `memoryLimit`이 $N$ 이상이면 입력 전체를 한 번에 정렬해 출력할 수 있다.

## 예시

입력 파일 `input.txt` 내용 (6개 정수, 한 줄씩):

```
5
2
9
1
7
3
```

```ts
await externalMergeSort("input.txt", "output.txt", 2);
// "output.txt"
```

출력 파일 `output.txt` 내용:

```
1
2
3
5
7
9
```

```ts
// memoryLimit이 N 이상이면 단일 run으로 처리
await externalMergeSort("input.txt", "output.txt", 100);
// "output.txt" — 결과는 동일

// 음수 포함
// input: -3, 1, -1, 2, 0, -2 → output: -3, -2, -1, 0, 1, 2
await externalMergeSort("neg.txt", "neg.out", 2);
// "neg.out"

// 단일 원소(경계: N=1)
await externalMergeSort("one.txt", "one.out", 1);
// "one.out" — input: 42 → output: 42
```
