# External Merge Sort — 해설

## 성능 목표 예측

| 항목 | 값 |
|------|----|
| 입력 크기 N | 1 ≤ N ≤ 10⁷ |
| 메모리 제한 M | 동시에 올릴 수 있는 정수 개수 |
| Run 개수 R | $R = \lceil N / M \rceil$ |
| 목표 시간 복잡도 | **O(N log N)** |
| 디스크 I/O | **O(N)** 회 읽기·쓰기 |
| 메모리 사용 | **O(M + R)** |

**naive 접근의 한계:**
$N = 10^7$개의 정수를 메모리에 한꺼번에 올려 정렬하면 메모리 제한을 초과한다. 예컨대 4바이트 정수 기준으로 $10^7$개는 약 40MB이고, $M$이 그보다 훨씬 작은 경우 단순 인메모리 정렬은 불가능하다. 디스크에서 줄 단위로 읽으면서 비교 기반으로 전체를 정렬하면 $O(N^2)$ I/O가 발생하여 사실상 불가능하다.

**목표 복잡도의 근거:**
- Run 생성 단계: 크기 $M$인 청크를 메모리 내 정렬($O(M \log M)$) 후 디스크에 기록. 청크 수 $R = \lceil N/M \rceil$이므로 총 비용 $O(N \log M)$.
- K-way 병합 단계: 크기 $R$인 최소 힙으로 N개의 원소를 처리. 총 비용 $O(N \log R)$.
- 합산: $O(N \log M + N \log R) = O(N \log N)$ ($M \cdot R \approx N$이므로 $\log M + \log R \approx \log N$).
- 디스크: 모든 원소를 Run 생성 시 1회, 병합 시 1회 읽고 씀 → $O(N)$ I/O.

---

## 목표 함수

```ts
async function externalMergeSort(
  inputPath: string,
  outputPath: string,
  memoryLimit: number,
): Promise<string>
```

| 파라미터 | 의미 | 제약 |
|---------|------|------|
| `inputPath` | 라인당 정수 1개인 텍스트 파일 경로 | 파일이 존재해야 함 |
| `outputPath` | 정렬 결과를 기록할 출력 파일 경로 | 쓰기 권한 필요 |
| `memoryLimit` ($M$) | 동시에 메모리에 올릴 수 있는 정수 개수 | $1 \leq M \leq N$ |

**반환값:** `outputPath`와 동일한 문자열 (Promise로 비동기 반환).

**엣지케이스:**

| 케이스 | 설명 | 처리 방법 |
|--------|------|----------|
| $N = 0$ (빈 파일) | 입력 정수가 없음 | 빈 출력 파일 생성 후 반환 |
| $N \leq M$ | 전체가 메모리에 들어감 | Run 1개 생성 후 바로 정렬·출력 |
| $M = 1$ | 원소 1개씩 처리 | Run이 N개 생성, 힙 크기 N |
| 동일 값 다수 | 중복 정수 가득 | 정상 처리됨 (각 줄을 독립적으로 처리) |
| 임시 파일 정리 | 종료 후 run 파일이 남으면 디스크 낭비 | 종료 전 반드시 삭제 |

---

## 핵심 아이디어

**핵심 아이디어**: "메모리에 다 올릴 수 없다면, 메모리에 맞게 나눠 정렬하고 나중에 병합한다."

데이터가 메모리 한계를 넘으면 인메모리 정렬이 불가능하다. 이때 메모리에 올릴 수 있는 크기 $M$씩 잘라 각각 정렬해 디스크에 저장한 뒤(Run 생성), 모든 Run을 min-heap으로 동시에 병합하는 K-way merge를 수행한다. 메모리는 항상 $O(M + R)$ 수준만 사용한다.

**풀이 구조**
1. 입력을 $M$개씩 읽어 인메모리 정렬 후 임시 파일(Run)로 저장
2. 마지막 청크가 $M$개 미만이면 동일하게 처리
3. 각 Run의 첫 원소를 min-heap에 삽입
4. 힙에서 최솟값을 꺼내 출력 파일에 기록하고, 해당 Run의 다음 원소를 힙에 삽입
5. 힙이 빌 때까지 반복. 임시 파일 삭제 후 출력 경로 반환

**조건**: 디스크 I/O가 가능한 환경. 입력이 텍스트 파일 형태(라인당 정수 1개)로 주어짐. $N > M$일 때 유효하며, $N \leq M$이면 인메모리 정렬로 충분.

**대표 예시**: 40GB 로그 파일에서 타임스탬프 기준 정렬
메모리가 1GB뿐인 서버에서 수억 개의 로그 라인을 정렬해야 할 때, 1GB씩 나눠 정렬해 수십 개의 Run을 만들고 min-heap으로 병합하면 전체 파일을 메모리 초과 없이 정렬할 수 있다.

**언제 쓰나**
데이터 크기가 메모리를 초과해 디스크를 중간 저장소로 써야 하는 경우에 사용한다. 데이터베이스 정렬, 빅데이터 전처리, 로그 분석 등 대용량 파일 처리의 핵심 알고리즘이다.

---

### 원형 아이디어와 naive 접근

가장 단순한 접근: 입력 파일을 한 줄씩 읽어 배열에 축적한 뒤, 다 읽은 후 정렬해서 출력 파일에 쓴다.

```
lines = readAllLines(inputPath)      // 메모리에 N개 전부 올림
nums = lines.map(parseInt)
nums.sort()                          // O(N log N)
writeAllLines(outputPath, nums)
```

이 방법은 $N \leq M$이면 작동하지만, $N > M$이면 메모리 제한 초과로 프로세스가 종료된다. 디스크를 중간 저장소로 활용해야 한다는 결론에 도달한다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1 (분할 가능성):** 메모리에 $M$개씩 올려서 정렬한 뒤 디스크에 저장하면, 각 청크는 내부적으로 정렬된 상태로 보존된다. 이 정렬된 청크를 **run**이라 부른다.
- **관찰 2 (정렬된 시퀀스 병합의 효율성):** $R$개의 정렬된 배열을 병합할 때, 매 단계마다 가장 작은 원소는 각 run의 첫 원소 중 하나여야 한다. 따라서 $R$개 run의 현재 최솟값만 추적하면 전체 병합이 가능하다.
- **관찰 3 (힙의 활용):** $R$개의 현재 최솟값 중 전체 최솟값을 $O(\log R)$에 찾는 자료구조가 최소 힙(min-heap)이다. 힙 없이 선형 탐색을 쓰면 $O(N \cdot R)$이 되어 비효율적이다.

### 관찰을 형식화: 상태/구조 정의

**Phase 1 상태:** 임시 파일 목록 `runPaths`, 현재 메모리 내 청크 `chunk`.
- 불변식: 각 임시 파일은 내부적으로 오름차순 정렬된 정수 시퀀스를 담고 있다.

**Phase 2 상태:** 최소 힙 `heap`, 각 run에 대응하는 파일 리더 `readers`.
- 힙 원소 형식: `(value, runIndex)` — 값이 같을 때 run 인덱스로 비교해 힙을 결정론적으로 유지한다.
- 불변식: 힙은 각 run의 현재 선두 원소를 정확히 1개씩 보유한다 (run이 소진되면 해당 슬롯 없음).

이 정의가 왜 이 형태여야 하는가: 힙에 전체 run의 모든 원소를 넣으면 $O(N)$ 메모리가 필요하고 메모리 제한을 위반한다. 선두 원소만 힙에 유지하면 $O(R)$ 공간으로 충분하다.

### 점화식 또는 핵심 연산

**Phase 1 — Run 생성의 청크 분할:**

$$R = \left\lceil \frac{N}{M} \right\rceil, \quad \text{Run}_i \text{ 크기} = \min(M,\ N - i \cdot M)$$

각 Run은 `sort(chunk)` 후 임시 파일로 기록된다. 메모리 내 정렬 비용은 $O(M \log M)$이고, $R$개 Run을 생성하는 총 비용:

$$\sum_{i=0}^{R-1} O(M \log M) = O(N \log M)$$

**Phase 2 — K-way Merge의 힙 연산:**

힙에서 최솟값 $v$를 추출하고, $v$가 속한 run $r$의 다음 원소 $v'$를 힙에 삽입한다:

$$\text{heap.pop}() \rightarrow (v, r), \quad \text{write}(v), \quad \text{if } \text{readers}[r] \text{ has next: heap.push}(v', r)$$

각 원소가 힙에 1회 삽입·1회 추출되며, 각 연산 비용 $O(\log R)$이므로 총 $O(N \log R)$.

### 정당성 — 왜 이것이 옳은가

Phase 1 종료 후 각 Run이 오름차순임은 인메모리 정렬의 정확성으로 보장된다. Phase 2에서 힙의 불변식 "힙은 각 run의 현재 선두 원소를 1개씩 보유"가 유지되면, 힙에서 pop한 값은 항상 모든 run의 현재 선두 원소 중 최솟값이다. 각 run은 내부적으로 오름차순이므로, pop 순서는 전체 정렬 순서와 일치한다. 귀납적으로: pop된 $k$번째 값이 전체 $k$번째 최솟값임을 각 단계에서 보장할 수 있다. 힙이 빌 때 모든 원소가 출력 파일에 기록되므로 데이터 손실이 없다.

### 구현 디테일과 최적화

- **비동기 파일 I/O:** TypeScript에서는 `Bun.file()` 또는 `fs.promises`를 활용해 비동기 읽기/쓰기를 수행한다. `async/await`로 구조화하면 코드가 명확해진다.
- **임시 파일 명명:** 충돌 방지를 위해 `tmp_run_0.txt`, `tmp_run_1.txt` 형태 또는 UUID 기반 이름을 사용한다.
- **메모리 제약 준수:** Phase 2에서 각 run의 파일 내용을 통째로 읽으면 제약 위반이다. 줄 단위로 스트리밍하거나 버퍼 크기를 제한해야 한다.
- **임시 파일 정리:** 예외가 발생해도 임시 파일이 삭제되도록 `try/finally` 블록으로 보호한다.
- **흔한 함정 — Run 소진 처리:** 특정 run이 소진된 후 해당 리더에서 다음 줄을 읽으려 하면 오류가 발생한다. 리더가 EOF에 도달하면 힙에 더 이상 삽입하지 않아야 한다.
- **흔한 함정 — 빈 마지막 청크:** 입력이 $M$의 배수일 때 마지막 청크 처리 조건을 빠뜨리면 원소가 누락된다. 루프 종료 후 `chunk.length > 0` 확인이 필수다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
async function externalMergeSort(inputPath, outputPath, M):
    // ─── Phase 1: Run 생성 ───
    runPaths = []                          // 불변식: runPaths의 각 파일은 내부 오름차순
    chunk = []                             // 불변식: len(chunk) ≤ M

    for each line in readLines(inputPath):
        chunk.append(parseInt(line))
        if len(chunk) == M:                // 청크가 꽉 찼을 때
            sort(chunk)                    // O(M log M)
            runPath = writeTempFile(chunk) // 디스크에 기록
            runPaths.append(runPath)
            chunk = []                     // 초기화

    if len(chunk) > 0:                     // 마지막 불완전 청크 처리
        sort(chunk)
        runPath = writeTempFile(chunk)
        runPaths.append(runPath)

    // ─── Phase 2: K-way Merge ───
    // 불변식: heap은 각 run의 현재 선두 원소를 정확히 1개씩 보유
    heap = MinHeap()
    readers = []

    for i, path in enumerate(runPaths):
        reader = openLineReader(path)
        firstLine = reader.readLine()
        if firstLine exists:
            heap.push((parseInt(firstLine), i))
        readers.append(reader)

    writer = openFileWriter(outputPath)

    while heap is not empty:
        (val, i) = heap.pop()              // 전체 최솟값 추출
        writer.writeLine(val)              // 출력 파일에 기록
        nextLine = readers[i].readLine()   // 해당 run의 다음 원소
        if nextLine exists:
            heap.push((parseInt(nextLine), i))

    // ─── 정리 ───
    for reader in readers: reader.close()
    writer.close()
    for path in runPaths: deleteFile(path) // 임시 파일 삭제

    return outputPath
```

### Activity Diagram

```mermaid
flowchart TD
    A([시작]) --> B[chunk = [], runPaths = []]
    B --> C[inputPath에서 한 줄 읽기]
    C --> D{파일 끝?}
    D -- No --> E[chunk에 parseInt 추가]
    E --> F{len_chunk == M?}
    F -- Yes --> G[sort chunk\n임시 파일 쓰기\nrunPaths에 추가\nchunk 초기화]
    G --> C
    F -- No --> C
    D -- Yes --> H{len_chunk > 0?}
    H -- Yes --> G2[sort chunk\n마지막 임시 파일 쓰기]
    G2 --> I[각 run의 선두 원소를 MinHeap에 삽입]
    H -- No --> I
    I --> J{heap 비었나?}
    J -- Yes --> K[리더·라이터 닫기\n임시 파일 삭제]
    K --> Z([반환 outputPath])
    J -- No --> L[heap.pop → val, runIndex]
    L --> M[outputPath에 val 기록]
    M --> N[readers_runIndex 에서 다음 줄 읽기]
    N --> O{다음 줄 존재?}
    O -- Yes --> P[heap.push 다음값 runIndex]
    P --> J
    O -- No --> J
```

**핵심 불변식:** Phase 1 종료 시 각 run 파일은 내부적으로 오름차순. Phase 2 진행 중 힙은 각 run의 현재 선두 원소를 정확히 1개씩 보유하며, 힙에서 pop한 값은 아직 출력되지 않은 원소 중 전체 최솟값이다.

---

**예시** ($N = 9$, $M = 3$):

```
입력:  5 1 8 3 7 2 9 4 6

Phase 1 Run 생성:
  청크 1: [5, 1, 8] → 정렬 → Run1: [1, 5, 8]
  청크 2: [3, 7, 2] → 정렬 → Run2: [2, 3, 7]
  청크 3: [9, 4, 6] → 정렬 → Run3: [4, 6, 9]

Phase 2 K-way Merge:
  초기 힙: [(1,R1), (2,R2), (4,R3)]
  pop (1,R1) → write 1, push (5,R1). 힙: [(2,R2),(4,R3),(5,R1)]
  pop (2,R2) → write 2, push (3,R2). 힙: [(3,R2),(4,R3),(5,R1)]
  pop (3,R2) → write 3, push (7,R2). 힙: [(4,R3),(5,R1),(7,R2)]
  ... (계속)
  최종 출력: [1, 2, 3, 4, 5, 6, 7, 8, 9]
```
