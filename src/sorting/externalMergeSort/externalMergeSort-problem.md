# External Merge Sort

## 함수 인터페이스

```ts
export function externalMergeSort(
  inputPath: string,
  outputPath: string,
  memoryLimit: number,
): Promise<string>;
```

## 제약 조건

- $1 \leq N \leq 10^7$ (여기서 $N$ 은 입력 파일의 정수 개수)
- $1 \leq M \leq N$ (여기서 $M$ 은 `memoryLimit`)
- 동시에 메모리에 적재되는 정수 개수는 $O(M + R)$ 을 초과하지 않아야 한다 (여기서 $R$ 은 분할된 run 개수)
- 입력 파일은 한 줄에 정수 하나씩 저장된 텍스트 파일

## 문제 상세

메모리에 모두 적재할 수 없는 대용량 정수 데이터 파일을 정렬하는 **외부 정렬(External Sort)** 을 구현하라.

- 입력 파일 `inputPath` 는 한 줄에 정수 하나씩 저장된 텍스트 파일이다.
- 메모리 제한 `memoryLimit` (원소 개수 단위)을 넘지 않는 범위 안에서 데이터를 정렬해야 한다.
- 정렬 결과는 `outputPath` 경로에 동일한 형식(한 줄에 정수 하나)으로 기록한다.
- 반환값은 작성된 출력 파일 경로(`outputPath` 와 동일)이다.

## 예시

입력 파일 `input.txt` 내용:

```
5
2
9
1
7
3
```

호출:

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
