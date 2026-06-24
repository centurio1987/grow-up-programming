# quicksort.ts 분석 보고서

## 1. 접근 방법 분석

Lomuto Partition Scheme에 중간값 피벗(middle pivot)을 조합한 방향성으로 접근했다. 이 선택은 올바르다.

- **Lomuto Partition**: 피벗을 배열의 끝으로 이동한 뒤, 포인터 `i`와 `j`를 사용해 피벗보다 작은 원소를 앞쪽에 모은다.
- **중간값 피벗**: 이미 정렬된 배열에서 항상 첫 번째 또는 마지막 원소를 피벗으로 선택하면 O(N²)로 퇴화하는 최악의 경우를 피할 수 있다. 중간 인덱스를 초기 피벗으로 사용하는 것은 이를 방어하는 표준적인 방법이다.

## 2. 정확성 분석 (테스트 결과)

**결과: 10개 테스트 전부 실패 (RangeError: Maximum call stack size exceeded)**

현재 구현에는 5개의 버그가 있으며, 핵심 원인은 재귀 종료 조건의 부재다.

### Bug #1 (Critical): 재귀 기저 조건 없음

```ts
// sort 함수 진입부에 기저 조건이 없다
function sort(arr: number[], lo: number, hi: number) {
  // if (lo >= hi) return; ← 이 줄이 없음
  ...
}
```

`sort(arr, 0, 0)` (원소 1개)이 호출되면:
1. `pivotIdx = 0`, `arr[0]`을 `arr[0]`과 교환 (no-op)
2. `j` 루프는 `j < 0`이므로 실행되지 않음
3. `arr[0] = pivot`, `arr[0] = swap2` (자기 자신으로 복원)
4. `sort(arr, 0, -1)`, `sort(arr, 0, 0)` 호출
5. `sort(arr, 0, 0)`이 다시 동일하게 실행 → **무한 재귀**

### Bug #2: `i` 초기값이 `lo` 대신 `0`으로 하드코딩

```ts
let i = 0;  // ← lo여야 한다
```

`lo`가 0이 아닌 서브배열 `[lo, hi]`를 처리할 때, "작은 원소 영역"의 시작점이 `lo`가 아닌 `0`부터 시작되어 파티셔닝 결과가 잘못된 인덱스를 가리킨다.

### Bug #3: `j` 루프 시작이 `lo` 대신 `0`으로 하드코딩

```ts
for (let j = 0; j < hi; j++) {  // ← j = lo여야 한다
```

서브배열 `[lo, hi]`만 처리해야 하는데, `[0, hi]` 전체를 다시 스캔한다. 이미 정렬된 앞쪽 영역을 불필요하게 재처리하고, 분할 결과도 오염된다.

### Bug #4: 왼쪽 재귀 호출의 `lo`가 `0`으로 하드코딩

```ts
sort(arr, 0, i - 1);  // ← sort(arr, lo, i - 1)여야 한다
```

피벗 왼쪽 서브배열의 하한이 항상 `0`으로 고정되어, 상위 호출이 이미 처리한 영역을 재귀적으로 다시 처리한다.

### Bug #5: 오른쪽 재귀 호출이 피벗을 포함

```ts
sort(arr, i, hi);  // ← sort(arr, i + 1, hi)여야 한다
```

파티션 후 `arr[i]`에는 피벗이 최종 위치에 놓인다. 이 위치는 이미 정렬 완료된 원소이므로 재귀에 포함해선 안 된다. `sort(arr, i, hi)`는 피벗을 다시 처리 대상에 넣어 불필요한 작업을 유발하고, 기저 조건이 없는 현재 코드에서는 무한 재귀의 추가 경로가 된다.

## 3. 최적화 분석

### 3.1 현재 구조의 핵심 아이디어 (Lomuto Partition Scheme)

알고리즘 원형인 Lomuto Partition의 올바른 형태는 다음과 같다.

**전제**: 배열의 범위 `[lo, hi]`를 피벗을 기준으로 두 부분으로 나눈다.

**단계별 전개**:

1. **피벗 선택 및 끝으로 이동**  
   인덱스 `pivotIdx = lo + ⌊(hi - lo) / 2⌋`의 원소를 `arr[hi]`와 교환한다.  
   이유: Lomuto 방식은 피벗이 `arr[hi]`에 있다고 가정하고 동작한다.

2. **파티션 포인터 초기화**  
   `i = lo`로 설정한다. `i`는 "피벗보다 작은 원소들의 다음 삽입 위치"를 가리킨다.  
   불변 조건: 루프 진행 중 항상 `arr[lo..i-1] < pivot` 이다.

3. **스캔 및 교환 (j = lo to hi - 1)**  
   `arr[j] < pivot`이면 `arr[i]`와 `arr[j]`를 교환하고 `i`를 1 증가시킨다.  
   루프 종료 후: `arr[lo..i-1]`은 모두 피벗보다 작고, `arr[i..hi-1]`은 모두 피벗보다 크거나 같다.

4. **피벗을 최종 위치에 배치**  
   `arr[i]`와 `arr[hi]`(= pivot)를 교환한다.  
   결과: `arr[i]` = pivot, `arr[lo..i-1] < pivot`, `arr[i+1..hi] >= pivot`  
   → `arr[i]`는 정렬 완료된 상태. 이 인덱스를 파티션 포인트라 한다.

5. **재귀 호출**  
   - `sort(arr, lo, i - 1)`: 피벗 왼쪽 서브배열
   - `sort(arr, i + 1, hi)`: 피벗 오른쪽 서브배열
   - 기저 조건: `lo >= hi`이면 즉시 반환 (원소가 0개 또는 1개이면 이미 정렬됨)

**시간 복잡도**:
- 평균: O(N log N) — 매 파티션이 배열을 절반에 가깝게 나눌 때
- 최악: O(N²) — 매 파티션이 1:N-1로 나뉠 때
- 중간 피벗을 사용하면 이미 정렬된 입력에서 최악의 경우를 방지한다.

**공간 복잡도**: O(log N) 재귀 스택 (평균), O(N) 최악

### 3.2 개선 가능한 추가 최적화

현재 중간 피벗은 최악의 경우를 완전히 방지하지 못한다. 예: `[1, 3, 2, 4, ...]`처럼 중간값이 항상 최솟값이나 최댓값인 배열.

**Median-of-Three**: `arr[lo]`, `arr[mid]`, `arr[hi]` 세 값의 중앙값을 피벗으로 선택한다. 이 방법은 구현 복잡도 증가 없이 최악의 경우 발생 확률을 유의미하게 낮춘다.

**소규모 서브배열 삽입 정렬**: `hi - lo < 10` 이하의 소규모 서브배열에는 삽입 정렬(Insertion Sort)을 사용한다. 삽입 정렬은 재귀 오버헤드가 없고, 소규모에서 캐시 친화적이어서 실제 성능이 개선된다. Java의 표준 라이브러리(`Arrays.sort`)가 이 방식을 사용한다.

---

## 남은 버그 요약

| 번호 | 위치 | 현재 코드 | 수정 코드 |
|------|------|-----------|-----------|
| #1 | `sort` 함수 진입부 | (없음) | `if (lo >= hi) return;` 추가 |
| #2 | 39번째 줄 | `let i = 0` | `let i = lo` |
| #3 | 39번째 줄 | `for (let j = 0; ...)` | `for (let j = lo; ...)` |
| #4 | 53번째 줄 | `sort(arr, 0, i - 1)` | `sort(arr, lo, i - 1)` |
| #5 | 54번째 줄 | `sort(arr, i, hi)` | `sort(arr, i + 1, hi)` |

---

## [2차 수정] 버그 수정 이력 및 잔존 버그

### 테스트 결과: 2 pass / 10 fail → 8 fail 잔존

### 수정된 항목

**Bug #1 수정 (30번째 줄)**

```ts
// 이전
function sort(arr: number[], lo: number, hi: number) {
  // 기저 조건 없음

// 수정 후
function sort(arr: number[], lo: number, hi: number) {
  if (hi - lo < 1) return;
```

`hi - lo < 1`은 `lo >= hi`와 동치다. `hi = lo`(원소 1개)일 때 `0 < 1`이므로 반환, `hi < lo`(빈 범위)일 때도 음수 `< 1`이므로 반환한다. 이 조건으로 빈 배열(hi=-1, lo=0)과 단일 원소 테스트가 통과된다.

**Bug #2 수정 (40번째 줄)**

```ts
// 이전
let i = 0;

// 수정 후
let i = lo;
```

### 새로 도입된 버그 (Bug #3-New)

Bug #3을 수정하는 과정에서 `j = 0` → `j = lo + 1`로 변경됐으나, 올바른 값은 `j = lo`다.

```ts
// 현재 (잘못됨)
for (let j = lo + 1; j < hi; j++) {

// 올바른 형태
for (let j = lo; j < hi; j++) {
```

**왜 `lo + 1`이 틀린가:**

Lomuto Partition의 루프 불변 조건은 다음과 같다.

```
루프 진행 중 항상:
  arr[lo..i-1] < pivot
  arr[i..j-1] >= pivot
```

`i = lo`로 초기화했을 때 "작은 원소 영역"은 비어 있고(`arr[lo..lo-1]`), `j = lo`부터 스캔을 시작해 `arr[lo]`를 포함한 모든 원소를 피벗과 비교해야 한다.

`j = lo + 1`로 시작하면 `arr[lo]`가 스캔 대상에서 누락된다. 이후 루프 내에서 `arr[i=lo]`와 `arr[j]`를 교환할 때 `arr[lo]`는 `j` 위치로 이동하지만, 이 원소 자체는 피벗과 비교된 적이 없으므로 파티션 불변 조건이 보장되지 않는다.

**반례**: `arr = [2, 5, 1]`, `lo = 0`, `hi = 2`

| 단계 | arr 상태 | 설명 |
|------|----------|------|
| 초기 | `[2, 5, 1]` | pivotIdx=1, arr[1]=5 |
| 피벗 이동 | `[2, 1, 5]` | arr[1]↔arr[2], pivot=5 |
| j=1: arr[1]=1<5 → swap(i=0,j=1) | `[1, 2, 5]` | i=1 |
| 루프 종료 | — | arr[lo=0]=2는 한 번도 비교 안 됨 |
| 피벗 배치: swap(i=1, hi=2) | `[1, 5, 2]` | **오류**: 2 < 5인데 pivot 오른쪽에 위치 |

`arr[lo] = 2 < pivot = 5`이므로 왼쪽 파티션에 속해야 하지만, `j = lo + 1` 때문에 비교를 건너뛰어 오른쪽 파티션에 남는다.

### 잔존 버그 요약

| 번호 | 줄 | 현재 코드 | 수정 코드 | 상태 |
|------|-----|-----------|-----------|------|
| #1 | 30 | (없음) | `if (lo >= hi) return;` | ✅ 수정됨 |
| #2 | 40 | `let i = 0` | `let i = lo` | ✅ 수정됨 |
| #3 | 41 | `for (let j = lo + 1; ...)` | `for (let j = lo; ...)` | ❌ 미수정 (lo+1로 변경됐으나 lo여야 함) |
| #4 | 55 | `sort(arr, 0, i - 1)` | `sort(arr, lo, i - 1)` | ❌ 미수정 |
| #5 | 56 | `sort(arr, i, hi)` | `sort(arr, i + 1, hi)` | ❌ 미수정 |

---

## [3차 수정] 버그 수정 이력 및 잔존 버그

### 테스트 결과: 2 pass / 10 fail — 변화 없음

### 수정된 항목

**Bug #3 수정 (41번째 줄)**

```ts
// 이전
for (let j = lo + 1; j < hi; j++) {

// 수정 후
for (let j = lo; j < hi; j++) {
```

`j = lo`로 수정되어 `arr[lo]`가 피벗과 비교 대상에 포함된다. 파티션 루프 불변 조건 `arr[lo..i-1] < pivot, arr[i..j-1] >= pivot`이 올바르게 성립한다.

### 잔존 버그 (Bug #4, #5)가 여전히 무한 재귀를 유발하는 경로

Bug #3이 수정됐음에도 2 pass / 8 fail이 유지되는 이유는 Bug #4와 Bug #5가 결합되어 무한 재귀를 발생시키기 때문이다.

**무한 재귀 경로 분석 (arr = [1, 2, 3, 4])**:

```
sort(arr, 0, 3)
  → pivot=2, i=1 배치 완료
  → sort(arr, 0, 0)     ← Bug #4 (올바른 호출: sort(arr, 0, 0), 이 경우는 우연히 일치)
  → sort(arr, 1, 3)     ← Bug #5 (올바른 호출: sort(arr, 2, 3))
       → pivot=3, i=2 배치 완료
       → sort(arr, 0, 1)  ← Bug #4 (올바른 호출: sort(arr, 1, 1))
            → pivot=arr[1]=2, i=0
            → sort(arr, 0, -1)   ← 기저 조건 충족, 반환
            → sort(arr, 0, 1)    ← Bug #5: pivot이 i=0에 배치됐는데 sort(arr, 0, 1) 재호출
                 → 동일 상태 반복 → 무한 재귀
```

**핵심**: `sort(arr, i, hi)`에서 내부 파티션 결과로 pivot이 `i` (= 새 `lo`) 위치에 오면, Bug #5에 의한 오른쪽 재귀 호출이 `sort(arr, i, hi)` 동일 범위를 재호출한다. 기저 조건 `hi - lo < 1`은 이 경우 `hi > lo`이므로 통과되지 않아 무한 재귀가 발생한다.

Bug #4로 인해 `lo > 0`인 서브 문제에서 `sort(arr, 0, i-1)` 호출 시 이미 처리된 영역을 포함하여 재처리하므로, 이 경로에서도 동일 패턴의 무한 재귀가 추가로 발생한다.

### 잔존 버그 요약

| 번호 | 줄 | 현재 코드 | 수정 코드 | 상태 |
|------|-----|-----------|-----------|------|
| #1 | 30 | (없음) | `if (lo >= hi) return;` | ✅ 수정됨 |
| #2 | 40 | `let i = 0` | `let i = lo` | ✅ 수정됨 |
| #3 | 41 | `for (let j = lo + 1; ...)` | `for (let j = lo; ...)` | ✅ 수정됨 |
| #4 | 55 | `sort(arr, 0, i - 1)` | `sort(arr, lo, i - 1)` | ❌ 미수정 |
| #5 | 56 | `sort(arr, i, hi)` | `sort(arr, i + 1, hi)` | ❌ 미수정 |

---

## [4차 수정] 버그 수정 이력 및 잔존 버그

### 테스트 결과: 9 pass / 1 fail

### 수정된 항목

**Bug #4 수정 (55번째 줄)**

```ts
// 이전
sort(arr, 0, i - 1);

// 수정 후
sort(arr, lo, i - 1);
```

**Bug #5 수정 (56번째 줄)**

```ts
// 이전
sort(arr, i, hi);

// 수정 후
sort(arr, i + 1, hi);
```

이로써 1차 분석에서 식별한 5개 버그가 모두 수정됐다. `sort` 함수는 Lomuto Partition Scheme을 올바르게 구현한다.

### 잔존 실패 원인 분석 (Bug #6): `quickSort`의 복사본 정렬

**실패 테스트**: `quicksort - 성능 테스트: 50,000개의 무작위 데이터`

```ts
// quicksort.test.ts:36-50
const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 100000) - 50000);
const arrCopy = [...arr];

quickSort(arr);          // 반환값을 사용하지 않음

arrCopy.sort((a, b) => a - b);
expect(arr).toEqual(arrCopy);  // arr 원본이 정렬됐는지 검사
```

이 테스트는 `quickSort(arr)` 호출 후 원본 `arr`이 in-place로 정렬됐기를 기대한다. 그러나 현재 구현은:

```ts
export function quickSort(nums: number[]): number[] {
  const sorted = [...nums];  // nums를 복사하여 sorted 생성
  sort(sorted, lo, hi);      // sorted만 정렬됨, nums는 변경 없음
  return sorted;             // 반환값이 테스트에서 무시됨
}
```

`nums` 자체는 수정되지 않으므로 테스트 종료 후 `arr`은 여전히 정렬 전 상태다.

**"이미 정렬된 데이터" 테스트가 통과하는 이유**:

```ts
const arr = Array.from({ length: size }, (_, i) => i);  // arr = [0, 1, 2, ..., 49999]
const arrCopy = [...arr];                                // arrCopy = [0, 1, ..., 49999]
quickSort(arr);                                          // arr 변경 없음
arrCopy.sort((a, b) => a - b);                          // arrCopy = [0, 1, ..., 49999] (이미 정렬됨)
expect(arr).toEqual(arrCopy);                           // [0..49999] == [0..49999] → PASS
```

`arr`이 초기에 이미 정렬된 상태이므로, `quickSort`가 `arr`을 변경하지 않더라도 `arr === arrCopy`가 성립한다.

**수정 방법**: `nums`를 직접 정렬하도록 `quickSort` 수정

```ts
export function quickSort(nums: number[]): number[] {
  sort(nums, 0, nums.length - 1);
  return nums;
}
```

### 최종 버그 요약

| 번호 | 위치 | 내용 | 상태 |
|------|------|------|------|
| #1 | sort 진입부 | 기저 조건 없음 | ✅ 수정됨 |
| #2 | let i | `i = 0` → `i = lo` | ✅ 수정됨 |
| #3 | for j | `j = 0` → `j = lo` | ✅ 수정됨 |
| #4 | 왼쪽 재귀 | `sort(arr, 0, i-1)` → `sort(arr, lo, i-1)` | ✅ 수정됨 |
| #5 | 오른쪽 재귀 | `sort(arr, i, hi)` → `sort(arr, i+1, hi)` | ✅ 수정됨 |
| #6 | quickSort 래퍼 | 복사본만 정렬, 원본 미변경 | ❌ 미수정 |

---

## [5차 수정] 최종 완료

### 테스트 결과: **10 pass / 0 fail** ✅

### 수정된 항목

**Bug #6 수정 (quickSort 래퍼)**

```ts
// 이전
export function quickSort(nums: number[]): number[] {
  const sorted = [...nums];   // 복사본 생성
  sort(sorted, lo, hi);
  return sorted;              // 복사본 반환, nums 미변경
}

// 수정 후
export function quickSort(nums: number[]): number[] {
  sort(nums, lo, hi);         // nums 직접 정렬 (in-place)
  return nums;
}
```

`nums`를 직접 정렬하므로 호출자가 반환값을 사용하지 않아도 원본 배열에 정렬 결과가 반영된다. 추가 O(N) 공간도 제거됐다.

### 최종 버그 요약

| 번호 | 위치 | 내용 | 상태 |
|------|------|------|------|
| #1 | sort 진입부 | 기저 조건 없음 | ✅ 수정됨 |
| #2 | let i | `i = 0` → `i = lo` | ✅ 수정됨 |
| #3 | for j | `j = 0` → `j = lo` | ✅ 수정됨 |
| #4 | 왼쪽 재귀 | `sort(arr, 0, i-1)` → `sort(arr, lo, i-1)` | ✅ 수정됨 |
| #5 | 오른쪽 재귀 | `sort(arr, i, hi)` → `sort(arr, i+1, hi)` | ✅ 수정됨 |
| #6 | quickSort 래퍼 | 복사본만 정렬, 원본 미변경 | ✅ 수정됨 |
