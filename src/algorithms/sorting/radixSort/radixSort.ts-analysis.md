# radixSort.ts 분석 보고서

## 1. 접근 방법 분석

LSD(Least Significant Digit) 기수 정렬을 10개의 큐(버킷)로 구현하는 방향은 올바르다.

- **기수 정렬 원리**: 자릿수(digit) 단위로 정렬을 반복한다. 1의 자리 → 10의 자리 → 100의 자리 순서로 안정(stable) 분류를 반복하면 최종 결과가 정렬된다.
- **큐 사용**: 자릿수 값 0~9에 대응하는 10개의 큐(버킷)에 원소를 분배(distribute)하고, 순서대로 수집(collect)한다. 이 방향성은 정확하다.

그러나 구현에 4개의 버그가 있으며 테스트는 **무한 루프**로 진행 불가 상태다.

---

## 2. 정확성 분석

### 테스트 결과: 무한 루프 — 모든 테스트 실패

원인은 Bug #1(아래)이다. `while (poped)` 조건이 0이 아닌 원소에서 무한 반복된다.

### Bug #1 (Critical — 무한 루프): `while (poped)` 루프 변수 미갱신

```ts
const poped = sorted.shift();  // 단 한 번만 값을 가져옴
while (poped) {                // poped는 루프 내에서 변하지 않음
  const found = poped % mask;
  queue[found]!.push(poped);  // 동일한 poped를 무한 반복 삽입
}
```

`poped`는 `sorted.shift()`로 한 번 설정된 후 루프 내에서 변경되지 않는다. `poped`가 0이 아닌 양수이면 조건이 항상 참이므로 **무한 루프**가 발생한다.

의도: 루프는 `sorted`의 **모든 원소**를 순차적으로 꺼내 해당 자릿수 큐에 넣는 구조여야 한다.

```ts
// 올바른 구조
for (const num of sorted) {
  const digit = Math.floor(num / divisor) % RADIX;
  queue[digit]!.push(num);
}
sorted.length = 0;  // 원소를 모두 큐로 이동했으므로 비움
```

### Bug #2 (Critical — 잘못된 자릿수 추출): `poped % mask` 가 단일 자릿수가 아님

```ts
let mask = Math.pow(RADIX, round);  // round=1이면 mask=10, round=2이면 mask=100
const found = poped % mask;         // round=2: found = poped % 100 → 0..99 범위
queue[found]!.push(poped);          // found가 10 이상이면 queue[10] 이상 접근 → out of bounds
```

`poped % mask`는 현재 라운드까지의 **하위 모든 자릿수를 합친 값**(0 ~ mask-1 범위)을 반환한다. 이는 현재 자릿수 **한 자리**(0~9)가 아니다.

| round | mask | `poped % mask` 범위 | 원하는 값 | 오류 |
|-------|------|---------------------|-----------|------|
| 1 | 10 | 0~9 | 1의 자리 | 우연히 일치 |
| 2 | 100 | 0~99 | 10의 자리(0~9) | queue 인덱스 범위 초과 |
| 3 | 1000 | 0~999 | 100의 자리(0~9) | 심각한 범위 초과 |

올바른 자릿수 추출 공식 (라운드를 0-indexed `i`로 표현):

```
digit_at_position_i = Math.floor(num / Math.pow(RADIX, i)) % RADIX
```

즉, `i=0` (1의 자리): `num % 10`, `i=1` (10의 자리): `Math.floor(num / 10) % 10`, 이와 같이 표현된다.

### Bug #3 (Critical — 라운드당 원소 1개만 처리): 외부 루프 구조 오류

```ts
for (let i = 0; i <= maximumRound; i++) {
  const poped = sorted.shift();  // 원소 1개만 꺼냄
  while (poped) { ... }          // 이 1개를 큐에 넣으려 시도
  for (let subQueue of queue) {
    sorted.push(subQueue.shift()!);  // 큐에서 원소 1개씩만 수집
  }
  ...
}
```

기수 정렬의 외부 루프는 자릿수 위치(1의 자리, 10의 자리, …)에 대한 반복이다. 각 반복에서:

1. `sorted`의 **전체 원소**를 자릿수에 따라 큐에 분배해야 한다.
2. 모든 큐의 **전체 원소**를 순서대로 `sorted`로 수집해야 한다.

현재 코드는 `sorted.shift()`로 원소를 1개만 꺼내고, `subQueue.shift()`로 각 큐에서 1개만 수집한다. N개 원소 중 최대 10개(큐 수)만 처리되고 나머지는 버려진다.

### Bug #4 (Logic — 큐 미초기화): 라운드 간 큐 내용 누적

```ts
const queue: number[][] = Array.from({ length: RADIX }, (v, k) => []);
// 큐가 루프 밖에서 단 한 번 생성됨
for (let i = 0; i <= maximumRound; i++) {
  // ... 분배 후 수집
  // 큐를 비우지 않으므로 다음 라운드에 이전 내용이 남아 있음
}
```

각 라운드 종료 후 큐를 비워야 한다(`queue[d].length = 0` 또는 라운드마다 새로 생성). 현재 코드는 이전 라운드의 잔류 원소가 다음 라운드에 섞인다.

---

## 3. 최적화 분석

기수 정렬은 비교 기반 정렬이 아니므로 비교 기반 정렬의 하한인 O(N log N)에 묶이지 않는다.

### 3.1 핵심 아이디어 (LSD 기수 정렬)

**전제**: 모든 원소의 최대 자릿수를 `d`라 하면, `d`번의 안정 정렬로 배열을 정렬할 수 있다.

**단계별 전개**:

**Step 1 — 자릿수 정의**

10진수 정수 `num`의 위치 `i` (0-indexed, 0 = 1의 자리)에 해당하는 자릿수:

$$\text{digit}(num, i) = \left\lfloor \frac{num}{10^i} \right\rfloor \bmod 10$$

**Step 2 — 1회 패스: 특정 자릿수로 안정 분류(Stable Distribution)**

자릿수 위치 `i`에 대해:
1. 0~9에 대응하는 10개의 큐 `Q[0]..Q[9]`를 준비한다.
2. 배열의 원소를 순서대로 스캔하여 `digit(num, i)` 값에 해당하는 큐에 삽입한다.
3. 큐 `Q[0]`, `Q[1]`, ..., `Q[9]` 순으로 원소를 순서대로 꺼내 배열에 다시 채운다.

이 1회 패스의 결과: 배열이 자릿수 위치 `i`의 값을 기준으로 **안정 정렬**된다.  
"안정(stable)"이란 동일한 자릿수 값을 가진 원소들의 상대 순서가 패스 전과 동일하게 유지됨을 의미한다.

**Step 3 — LSD 순서로 d회 반복**

위치 `i = 0`(1의 자리)부터 `i = d-1`(최고 자릿수)까지 순서대로 패스를 수행한다.

왜 LSD(Least Significant Digit, 낮은 자리부터) 순서가 올바른가:

귀납적으로 증명한다. i번째 패스 완료 후 다음 불변 조건(invariant)이 성립한다고 가정한다:
> 배열은 하위 `i+1`개 자릿수(위치 0 ~ i)를 연결한 수 기준으로 정렬되어 있다.

`i+1`번째 패스에서 위치 `i+1`의 자릿수로 안정 정렬하면:
- 위치 `i+1`이 다른 원소들은 올바른 순서로 배치된다.
- 위치 `i+1`이 같은 원소들은 안정 정렬에 의해 이전 패스의 순서(하위 `i+1`자리 기준 정렬)가 그대로 유지된다.

따라서 패스 후 불변 조건이 `i+1`로 확장된다. 마지막 패스 후 모든 자릿수를 고려한 정렬이 완료된다.

**Step 4 — 최대 자릿수 `d` 결정**

배열의 최댓값 `M`에 대해:

$$d = \lfloor \log_{10} M \rfloor + 1$$

**Step 5 — 시간 복잡도**

| 항목 | 비용 |
|------|------|
| 1회 패스: 원소 분배 | O(N) |
| 1회 패스: 큐 수집 | O(N + RADIX) |
| 총 패스 횟수 | d회 |
| **전체** | **O(d(N + RADIX)) = O(dN)** |

`d`는 최댓값에 의존한다. 값의 범위가 0 ~ 10^9이면 d ≤ 10으로 상수로 취급할 수 있으므로 실질적으로 **O(N)**.

비교 기반 정렬의 하한 O(N log N)을 깰 수 있는 이유: 기수 정렬은 원소를 직접 비교하지 않고 자릿수(정수 속성)를 키로 사용하기 때문이다.

**공간 복잡도**: O(N + RADIX) — 큐에 최대 N개 원소, RADIX개 큐 포인터.

### 3.2 올바른 구현 구조

```ts
export function radixSort(A: number[]): number[] {
  const sorted = [...A];
  const RADIX = 10;
  const max = Math.max(...sorted);
  if (max === 0) return sorted;

  const d = Math.floor(Math.log10(max)) + 1;

  for (let i = 0; i < d; i++) {
    const divisor = Math.pow(RADIX, i);
    const queues: number[][] = Array.from({ length: RADIX }, () => []);

    // 전체 원소를 자릿수 위치 i의 값에 따라 분배
    for (const num of sorted) {
      const digit = Math.floor(num / divisor) % RADIX;
      queues[digit]!.push(num);
    }

    // 큐 0~9 순서로 전체 원소 수집
    let idx = 0;
    for (const queue of queues) {
      for (const num of queue) {
        sorted[idx++] = num;
      }
    }
  }

  return sorted;
}
```

---

## 잔존 버그 요약

| 번호 | 위치 | 현재 코드 | 문제 | 수정 방향 |
|------|------|-----------|------|-----------|
| #1 | 20번째 줄 | `while (poped) { ... }` | `poped` 미갱신 → 무한 루프 | `for (const num of sorted)` 로 전체 순회 |
| #2 | 21번째 줄 | `poped % mask` | 단일 자릿수가 아닌 하위 전체 자릿수 반환, queue 인덱스 범위 초과 | `Math.floor(num / divisor) % RADIX` |
| #3 | 19번째 줄 | `sorted.shift()` (1개만 처리) | 라운드당 원소 1개만 분배 | 전체 원소를 루프로 처리 |
| #4 | 10번째 줄 | 큐를 루프 밖에서 1회 생성 | 라운드 간 큐 내용 누적 | 라운드마다 큐 새로 생성 또는 비우기 |

---

## [2차 수정] 버그 수정 이력 및 잔존 버그

### 테스트 결과: 1 pass / 8 fail

### 수정된 항목

**Bug #1 + Bug #3 동시 수정 (16~20번째 줄)**

```ts
// 이전
const poped = sorted.shift();
while (poped) {
  const found = poped % mask;
  queue[found]!.push(poped);
}

// 수정 후
while (sorted.length !== 0) {
  const poped = sorted.shift()!;
  const found = poped % mask;
  queue[found]!.push(poped);
}
```

`while (sorted.length !== 0)`으로 `sorted`의 전체 원소를 라운드당 하나씩 꺼내 처리한다. 무한 루프가 사라지고, 라운드당 모든 원소가 분배된다.

또한 수집 단계가 `sorted.push(...subQueue)`로 변경되어 각 큐의 전체 원소를 한 번에 수집한다.

```ts
// 이전
sorted.push(subQueue.shift()!);  // 큐에서 1개만 수집

// 수정 후
sorted.push(...subQueue);         // 큐의 전체 원소 수집
```

### 잔존 버그: Bug #2 (TypeError 발생)

**현재 오류**: `TypeError: undefined is not an object (evaluating 'queue[found].push')`

`poped % mask`에서 `mask = 10^round`이므로 2번째 라운드(round=2, mask=100)부터 `found` 값이 0~99 범위가 된다. `queue`는 크기 10의 배열이므로 `found >= 10`이면 `queue[found]`가 `undefined`이고, `.push()`가 TypeError를 던진다.

**반례**: `radixSort([45, ...])`에서 round=2, mask=100:
- `45 % 100 = 45` → `queue[45]` = undefined → TypeError

유일하게 통과하는 테스트는 "역순 배열 `[5,4,3,2,1]`"이다. 최댓값이 5이므로 `maximumRound = floor(log10(5)) = 0`, 루프가 1회만 실행(mask=10)되고 `num % 10 ∈ [0,9]`가 보장된다.

### 잔존 버그: Bug #4 (큐 미초기화)

```ts
for (let subQueue of queue) {
  sorted.push(...subQueue);
  subQueue = [];   // ← 지역 변수 재할당. queue 배열 내 원소는 변경되지 않음
}
```

`for...of` 루프에서 `subQueue`는 `queue[i]`에 대한 **복사본 참조**이다. `subQueue = []`로 재할당해도 원본 `queue[i]`는 그대로 남아 있다. 다음 라운드에서 큐에 이전 라운드의 원소가 누적된다.

올바른 초기화 방법:
```ts
subQueue.length = 0;  // 참조를 통해 배열 자체를 비움
```

또는 라운드마다 큐를 새로 생성한다.

Bug #4는 Bug #2가 해결된 후에야 관찰 가능하다 — 현재는 2번째 라운드에 진입하기 전에 TypeError가 발생하기 때문이다. 단, max가 1자리인 입력(1회 라운드)에서는 Bug #4가 영향을 주지 않으므로 현재 통과 중인 테스트에는 나타나지 않는다.

### 잔존 버그 요약

| 번호 | 위치 | 현재 코드 | 문제 | 상태 |
|------|------|-----------|------|------|
| #1 | 16~19번째 줄 | `while (poped)` | 무한 루프 | ✅ 수정됨 |
| #2 | 18번째 줄 | `poped % mask` | 큐 인덱스 범위 초과 → TypeError | ❌ 미수정 |
| #3 | (통합) | `sorted.shift()` 1개만 처리 | 라운드당 1개 원소만 분배 | ✅ 수정됨 |
| #4 | 23번째 줄 | `subQueue = []` | 지역 변수 재할당, 큐 미초기화 | ❌ 미수정 |

---

## [3차 수정] 버그 수정 이력 및 잔존 버그

### 테스트 결과: 1 pass / 8 fail

### 수정된 항목

**Bug #2 수정 (9, 11, 18~19번째 줄)**

```ts
// 이전
let round = 1;
let mask = Math.pow(RADIX, round);   // mask = 10
const found = poped % mask;          // 하위 n자리 전체 반환, 범위 초과

// 수정 후
let round = 0;
let mask = Math.pow(RADIX, round);   // mask = 1 (10^0)
const divided = Math.floor(poped / mask);
const found = divided % RADIX;       // 올바른 자릿수 추출: Math.floor(poped / 10^i) % 10
```

`round`를 0에서 시작하고 `mask = 10^round`로 정의하면:

| round | mask | `Math.floor(poped / mask) % RADIX` | 의미 |
|-------|------|-------------------------------------|------|
| 0 | 1 | `poped % 10` | 1의 자리 |
| 1 | 10 | `Math.floor(poped / 10) % 10` | 10의 자리 |
| 2 | 100 | `Math.floor(poped / 100) % 10` | 100의 자리 |

`found` 값이 항상 0~9 범위에 들어오므로 `queue[found]`가 유효하다. TypeError가 해소된다.

### 잔존 버그: Bug #4 — `subQueue = []` 큐 미초기화 → 원소 지수적 증가

테스트 오류:
- 소규모 입력: 결과 배열에 중복 원소 (예: 4원소 입력 → 2044원소 반환)
- 대규모 입력 (N=100,000): `RangeError: Maximum call stack size exceeded`

**원인 분석**:

```ts
for (let subQueue of queue) {
  sorted.push(...subQueue);
  subQueue = [];  // 지역 변수 재할당 — queue[i]는 변경되지 않음
}
```

`for...of` 루프에서 `subQueue`는 `queue[i]`를 참조하는 지역 변수다. `subQueue = []`로 새 배열을 할당해도 `queue[i]`가 가리키는 원본 배열은 그대로 남는다.

**원소 누적 패턴**:

라운드 k 종료 후 `sorted`의 원소 수를 `S_k`라 하면:

- 라운드 k에서 `sorted`의 모든 원소가 큐로 이동 (sorted 비워짐)
- 큐 수집: `sorted += queue의 모든 원소`
- 큐는 비워지지 않으므로, 라운드 k+1 분배 후 큐에는 `S_k`(이번 라운드) + `S_k`(이전 누적) = `2·S_k`개가 쌓임
- 수집 후 `S_{k+1} = 2·S_k`

$$S_k = N \cdot 2^k$$

N개 원소, d라운드 수행 시 최종 원소 수: $N \cdot 2^d$.

예: N=4, d=10 (max=10^9) → 최종 원소 수: $4 \cdot 2^{10} = 4096$개.  
예: N=100,000, d=9 → $100,000 \cdot 2^9 = 51,200,000$개 → `sorted.push(...subQueue)`가 수천만 개 인자를 호출 스택에 올려 스택 오버플로우 발생.

**수정 방법**: `queue[i]`의 배열 자체를 비워야 한다.

```ts
// 올바른 초기화 (1) — 배열 내용을 직접 비움
subQueue.length = 0;

// 올바른 초기화 (2) — 인덱스로 접근
queue[d] = [];

// 올바른 초기화 (3) — 라운드마다 큐를 새로 생성
const queue = Array.from({ length: RADIX }, () => []);  // for 루프 안으로 이동
```

### 잔존 버그 요약

| 번호 | 위치 | 현재 코드 | 문제 | 상태 |
|------|------|-----------|------|------|
| #1 | 16~19번째 줄 | `while (poped)` | 무한 루프 | ✅ 수정됨 |
| #2 | 9, 11, 18~19번째 줄 | `poped % mask` | 큐 인덱스 범위 초과 → TypeError | ✅ 수정됨 |
| #3 | (통합) | `sorted.shift()` 1개만 처리 | 라운드당 1개 원소만 분배 | ✅ 수정됨 |
| #4 | 24번째 줄 | `subQueue = []` | 지역 변수 재할당, 큐 미초기화 → 원소 지수적 증가 | ❌ 미수정 |

---

## [4차 수정] 최종 완료

### 테스트 결과: **9 pass / 0 fail** ✅

### 수정된 항목

**Bug #4 수정 (22~25번째 줄)**

```ts
// 이전
for (let subQueue of queue) {
  sorted.push(...subQueue);
  subQueue = [];         // 지역 변수 재할당 — queue[i] 원본 미변경
}

// 수정 후
for (let j = 0; j < RADIX; j++) {
  sorted.push(...queue[j]!);
  queue[j] = [];         // 인덱스 직접 접근 — queue[j] 원본 교체
}
```

`for...of` 대신 인덱스 기반 `for` 루프를 사용해 `queue[j] = []`로 원본 배열을 새 빈 배열로 교체한다. 라운드 종료 후 모든 큐가 올바르게 비워지므로 다음 라운드에 이전 원소가 누적되지 않는다.

### 최종 버그 요약

| 번호 | 위치 | 문제 | 상태 |
|------|------|------|------|
| #1 | `while (poped)` | 무한 루프 | ✅ 수정됨 |
| #2 | `poped % mask` | 큐 인덱스 범위 초과 → TypeError | ✅ 수정됨 |
| #3 | `sorted.shift()` 1개만 처리 | 라운드당 1개 원소만 분배 | ✅ 수정됨 |
| #4 | `subQueue = []` | 지역 변수 재할당, 큐 미초기화 | ✅ 수정됨 |
