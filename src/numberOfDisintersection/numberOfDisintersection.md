# numberOfDisintersection 솔루션 분석 보고서

> 분석 일자: 2026-04-27  
> 테스트 결과: 9 pass / 4 fail

---

## 현재 구현

```ts
export function solution(A: number[]): number {
  let count = 0;
  const aRange = [];
  for (let i = 0; i < A.length; i++) {
    aRange.push([i - A[i]!, i + A[i]!]);
  }

  for (let i = 0; i < aRange.length - 1; i++) {
    for (let j = i + 1; j < aRange.length; j++) {
      if (aRange[i]![1]! >= aRange[j]![0]!) {
        count++;
      }
    }
  }

  return count;
}
```

---

## 1. 접근 방향성

**방향은 올바르다.** 각 원판 $J$를 수직선 위 구간으로 변환하는 방법을 선택했다:

$$I_J = [J - A[J],\; J + A[J]]$$

두 원판의 교차 조건은 두 구간의 겹침과 동치이므로:

$$\text{intersect}(i, j) \iff I_i \cap I_j \neq \emptyset \iff \text{left}_i \leq \text{right}_j \;\wedge\; \text{left}_j \leq \text{right}_i$$

이 환원 자체는 문제를 올바르게 모델링한다.

---

## 2. 정확성 분석

### 2-1. 교차 조건 검사 (충분함)

현재 코드는 `right_i >= left_j` 만 체크한다:

```ts
if (aRange[i]![1]! >= aRange[j]![0]!) {  // right_i >= left_j
```

교차의 완전한 조건은 두 개지만, **루프 구조상 `i < j`가 보장**되므로 두 번째 조건은 체크가 불필요하다:

$$\text{right}_j = j + A[j] \geq j \geq i + 1 > i \geq i - A[i] = \text{left}_i$$

즉 `i < j`이면 `right_j >= left_i`는 항상 성립하므로, `right_i >= left_j` 하나만 체크하면 충분하다. **교차 조건 자체는 문제 없다.**

### 2-2. N=4472 케이스 — 코드는 정확, 테스트 기대값이 오류

모든 원판의 반지름이 N=4472일 때 두 원판 $i < j$의 교차 조건:

$$i + 4472 \geq j - 4472 \implies j - i \leq 8944$$

$j - i$의 최대값은 4471이므로 모든 쌍이 교차한다.  
실제 쌍 수: $\dfrac{4472 \times 4471}{2} = 9{,}997{,}156$

**원인은 코드가 아닌 테스트 오류였다.** 테스트 생성 시 9,997,756으로 잘못 계산하여 기대값을 잘못 기입했다. 코드가 반환한 9,997,156이 올바른 값이다. 테스트 기대값을 `9_997_156`으로 수정했다.

### 2-3. -1 반환 로직 없음

10,000,000 초과 시 -1을 반환하는 코드가 전혀 없다:

```ts
// 현재: count를 무한히 누적하고 그대로 반환
return count; // 4,999,950,000 반환 (N=100,000 전체 교차 시)
```

필요한 로직:

```ts
if (count > 10_000_000) return -1;
```

---

## 3. 최적화 분석

### 현재 복잡도: O(N²)

```ts
for (let i = 0; i < aRange.length - 1; i++) {
  for (let j = i + 1; j < aRange.length; j++) {  // 이중 루프
    ...
  }
}
```

N=100,000이면 약 **50억 번** 연산 → 4초 이상 소요.

### 목표 복잡도: O(N log N)

**정렬 + 이진 탐색** 방식으로 해결 가능하다.

#### 핵심 아이디어

왼쪽 끝 배열 `starts`와 오른쪽 끝 배열 `ends`를 각각 정렬한다. `ends`를 순회하며, 각 원판 $i$의 오른쪽 끝 `ends[i]`보다 왼쪽 끝이 작거나 같은 원판의 수를 이진 탐색으로 구한다. 이 수에서 이미 카운팅된 원판(자기 포함)을 빼면 새로 교차하는 쌍의 수가 된다.

```ts
export function solution(A: number[]): number {
  const N = A.length;
  if (N === 0) return 0;

  const starts = A.map((r, i) => i - r).sort((a, b) => a - b);
  const ends = A.map((r, i) => i + r).sort((a, b) => a - b);

  let count = 0;

  for (let i = 0; i < N; i++) {
    // ends[i] 이하인 starts의 개수 (이진 탐색, upperBound)
    let lo = 0,
      hi = N;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (starts[mid]! <= ends[i]!) lo = mid + 1;
      else hi = mid;
    }
    // lo = ends[i] 이하인 starts의 수
    // (i+1)은 자기 자신을 포함한 "이미 닫힌 원판" 수
    count += lo - (i + 1);
    if (count > 10_000_000) return -1;
  }

  return count;
}
```

#### 복잡도 비교

| 항목           | 현재 구현       | 개선 후            |
| -------------- | --------------- | ------------------ |
| 시간 복잡도    | $O(N^2)$        | $O(N \log N)$      |
| N=100,000 성능 | ~4,000ms (실패) | ~수 ms (통과 예상) |

---

## 4. 수정 요약

| 문제             | 원인                            | 수정 방법                                    |
| ---------------- | ------------------------------- | -------------------------------------------- |
| ~~정확도 오차~~  | 코드 정확, 테스트 기대값 오기입 | 테스트 수정 완료 (`9_997_756` → `9_997_156`) |
| -1 미반환        | 초과 체크 로직 없음             | `if (count > 10_000_000) return -1` 추가     |
| 성능 초과 (~4초) | O(N²) 이중 루프                 | 정렬 + 이진 탐색 O(N log N)으로 교체         |

---

## 5. O(N²)와 O(N log N)의 근본적 차이

### O(N²)의 본질: 열거(Enumeration)

```
for i in 0..N:
  for j in i+1..N:
    check(i, j)  // 쌍을 하나하나 확인
```

N개 구간에서 가능한 쌍 N(N-1)/2개를 직접 열거한다.

---

### O(N log N)의 핵심 전환: 열거 → 세기(Counting)

쌍을 직접 보지 않고, "몇 개의 구간과 교차하는가"를 한 번에 계산한다.

#### 전제: 오른쪽 끝 기준 정렬 시 교차 조건이 단순해진다

두 구간 A, B가 교차하려면 두 조건이 모두 필요하다:

$$\text{left}_A \leq \text{right}_B \quad \wedge \quad \text{left}_B \leq \text{right}_A$$

오른쪽 끝 기준으로 정렬하여 $\text{right}_A \leq \text{right}_B$를 보장하면:

$$\text{left}_A \leq \text{right}_A \leq \text{right}_B \quad \Rightarrow \quad \text{left}_A \leq \text{right}_B \quad \text{(자동 성립)}$$

조건이 하나로 줄어든다:

$$\text{교차} \iff \text{left}_B \leq \text{right}_A$$

#### 핵심 전환: 정렬된 배열의 범위 질문

구간 A(오른쪽 끝 = right_A)와 교차하는 구간 B의 수는:

$$\text{count} = \#\{B \mid \text{left}_B \leq \text{right}_A\}$$

이것은 starts 배열에서 right_A 이하인 원소의 개수다. 정렬된 배열에서 이 질문은 O(log N) 이진 탐색으로 답할 수 있다.

```ts
// 쌍을 열거하는 게 아니라 "몇 개?"를 한 번에 계산
lo = binarySearch(starts, right_A); // O(log N)
```

---

### 복잡도가 줄어드는 이유

| 항목      | O(N²)                         | O(N log N)                        |
| --------- | ----------------------------- | --------------------------------- |
| 접근      | 쌍을 직접 열거                | 각 구간이 몇 개와 교차하는지 계산 |
| 내부 연산 | 각 쌍마다 조건 검사 O(1) × N² | 각 구간마다 이진탐색 O(log N) × N |
| 핵심 도구 | 비교                          | 정렬된 배열의 prefix count        |

N개 구간 각각에 대해 "몇 개?"를 O(log N)에 답하므로 전체 O(N log N).

---

## 6. 최적화: 이진탐색도 필요 없다 (Two Pointer로 O(N))

ends를 순회할 때 ends[i]는 단조 증가한다. 따라서 이진탐색 없이 포인터를 앞으로만 움직여도 된다:

```ts
let lo = 0;
for (let i = 0; i < N; i++) {
  while (lo < N && starts[lo]! <= ends[i]!) lo++; // 포인터는 뒤로 가지 않음
  count += lo - (i + 1);
}
```

각 포인터가 N번씩만 이동 → 정렬 O(N log N) + 탐색 O(N) = O(N log N) (병목은 정렬).

---

## 반복 2 — 투 포인터 구현 시도 (3 pass / 10 fail)

### 변경된 구현

```ts
const lefts = A.map((i, r) => i - r).sort((a, b) => a - b);
const rights = A.map((i, r) => i + r).sort((a, b) => a - b);

let counts = 0;
let rightIdx = 0;

for (let leftIdx = 0; leftIdx < lefts.length; leftIdx++) {
  while (rightIdx < rights.length) {
    if (lefts[leftIdx]! <= rights[rightIdx]!) {
      counts = rights.length - rightIdx;
      break;
    } else {
      rightIdx++;
    }
  }
}
return counts;
```

### 개선된 점

O(N²) 이중 루프를 완전히 제거하고 투 포인터 구조를 도입했다. 방향성 자체는 올바르다.

### 남은 버그

**버그 1: `map` 콜백 파라미터 순서 오류**

`Array.prototype.map`의 콜백은 `(value, index)` 순서다. 현재 코드는 반대로 사용한다:

```ts
A.map((i, r) => i - r); // i = value(반지름), r = index → A[j] - j  (잘못됨)
```

올바른 left는 `j - A[j]`이어야 한다:

```ts
A.map((r, i) => i - r); // r = value(반지름), i = index → j - A[j]  (올바름)
```

`rights`는 덧셈 교환법칙으로 우연히 정확하지만, `lefts`는 완전히 다른 값이 된다:

| j   | A[j] | 올바른 `j−A[j]` | 현재 `A[j]−j` |
| --- | ---- | --------------- | ------------- |
| 0   | 1    | −1              | **1**         |
| 1   | 5    | −4              | **4**         |
| 3   | 1    | 2               | **−2**        |
| 5   | 0    | 5               | **−5**        |

**버그 2: 순회 기준이 반대**

올바른 투 포인터는 **`ends`(오른쪽 끝)를 기준**으로 순회하며, `starts`(왼쪽 끝) 포인터를 전진시킨다. 현재는 `lefts`를 기준으로 `rights`를 탐색한다:

|             | 올바른 방향                         | 현재 코드                             |
| ----------- | ----------------------------------- | ------------------------------------- |
| 기준 순회   | `ends[i]` (오른쪽 끝)               | `lefts[leftIdx]` (왼쪽 끝)            |
| 포인터 탐색 | `starts[lo] <= ends[i]` 이면 `lo++` | `lefts[i] <= rights[ri]` 이면 `break` |

**버그 3: `counts` 누산이 아닌 덮어쓰기**

```ts
counts = rights.length - rightIdx; // SET — 마지막 값만 남음
```

각 단계의 기여를 누산해야 한다:

```ts
count += lo - (i + 1); // ADD
```

**버그 4: -1 반환 로직 없음** (이전과 동일)

`count > 10_000_000` 초과 시 -1을 반환하는 코드가 없다.

### 올바른 투 포인터 구현

```ts
const starts = A.map((r, i) => i - r).sort((a, b) => a - b);
const ends = A.map((r, i) => i + r).sort((a, b) => a - b);

let count = 0;
let lo = 0;

for (let i = 0; i < N; i++) {
  while (lo < N && starts[lo]! <= ends[i]!) lo++;
  count += lo - (i + 1);
  if (count > 10_000_000) return -1;
}
return count;
```

---

## 반복 3 — map 파라미터 수정 + 누산 방식 수정 (2 pass / 11 fail)

### 변경된 구현

```ts
const lefts = A.map((r, i) => i - r).sort((a, b) => a - b); // (r, i) 순서 수정
const rights = A.map((r, i) => i + r).sort((a, b) => a - b);

let counts = 0;
let rightIdx = 0;

for (let leftIdx = 0; leftIdx < lefts.length; leftIdx++) {
  while (rightIdx < rights.length) {
    if (lefts[leftIdx]! <= rights[rightIdx]!) {
      counts = counts + rights.length - rightIdx; // += 방식으로 수정
      break;
    } else {
      rightIdx++;
    }
  }
}
return counts;
```

### 개선된 점

| 버그                | 반복 2                                | 반복 3                              |
| ------------------- | ------------------------------------- | ----------------------------------- |
| `map` 파라미터 순서 | `(i, r)` ❌                           | `(r, i)` ✅                         |
| `counts` 누산       | `counts = N - rightIdx` (덮어쓰기) ❌ | `counts = counts + N - rightIdx` ✅ |

`lefts`가 이제 올바른 `j - A[j]` 값을 담는다.

### 남은 버그

**버그 1: 순회 기준이 반대 — 근본적 논리 오류**

현재 로직: 각 `lefts[leftIdx]`에 대해 `rights[rightIdx]` 이상인 rights의 개수를 누산한다.

$$\text{counts} = \sum_{\text{leftIdx}} (\text{rights.length} - \text{rightIdx})$$

이것은 "각 구간의 왼쪽 끝에 도달하는 오른쪽 끝의 수"를 합산하는 것으로, **모든 쌍을 두 번씩 카운트**하고 자기 자신과의 쌍도 포함된다.

`A=[10,10,10]`으로 추적:

```
lefts  = [-10, -9, -8],  rights = [10, 11, 12],  rightIdx=0

leftIdx=0, left=-10: -10 <= rights[0]=10 → counts = 0+3-0 = 3
leftIdx=1, left= -9: -9  <= rights[0]=10 → counts = 3+3-0 = 6
leftIdx=2, left= -8: -8  <= rights[0]=10 → counts = 6+3-0 = 9

반환: 9  (정답: 3)
```

3개 구간이 모두 교차할 때 정답은 C(3,2)=3인데, 각 왼쪽 끝마다 rights 3개 전부를 더해 9가 된다.

올바른 방향은 **`ends`를 순회**하며 그 시점까지 열린(started) 구간 수에서 이미 닫힌 구간 수를 빼는 것이다:

```
ends 기준 순회: ends[i]가 현재 구간의 오른쪽 끝
lo = 해당 시점까지 start ≤ ends[i]인 구간 수
새 교차 쌍 = lo - (i+1)  → 자기 자신과 이미 처리된 구간을 제외
```

**버그 2: -1 반환 로직 없음** (이전과 동일)

`count > 10_000_000` 초과 시 -1을 반환하는 코드가 없다.

---

## 반복 4 — `- 1 - leftIdx` 보정 추가 (11 pass / 2 fail)

> 분석 일자: 2026-04-27  
> 테스트 결과: 11 pass / 2 fail

### 변경된 구현

```ts
const lefts = A.map((r, i) => i - r).sort((a, b) => a - b);
const rights = A.map((r, i) => i + r).sort((a, b) => a - b);

let counts = 0;
let rightIdx = 0;

for (let leftIdx = 0; leftIdx < lefts.length; leftIdx++) {
  while (rightIdx < rights.length) {
    if (lefts[leftIdx]! <= rights[rightIdx]!) {
      counts = counts + rights.length - rightIdx - 1 - leftIdx;
      break;
    } else {
      rightIdx++;
    }
  }
}

return counts;
```

### 개선된 점

반복 3의 핵심 버그였던 이중 계산 문제를 `- 1 - leftIdx` 보정으로 해결했다.

| 버그      | 반복 3                                    | 반복 4                                      |
| --------- | ----------------------------------------- | ------------------------------------------- |
| 이중 계산 | `rights.length - rightIdx` (과다 계산) ❌ | `rights.length - rightIdx - 1 - leftIdx` ✅ |

**`- 1 - leftIdx` 의미:**

- `-1`: 자기 자신의 right endpoint가 항상 `lefts[leftIdx]` 이상이므로, 자기 자신과의 쌍을 제거
- `-leftIdx`: leftIdx 이전에 처리된 왼쪽 끝점들과의 쌍은 이미 계산되었으므로 중복 제거

`A=[1,5,2,1,4,0]` 추적으로 검증:

```
lefts  (정렬) = [-4, -1,  0,  0,  2,  5]
rights (정렬) = [ 1,  4,  4,  5,  6,  8]

leftIdx=0 (-4): rights[0]=1 ≥ -4 → +=(6-0-1-0)=5   → counts=5
leftIdx=1 (-1): rights[0]=1 ≥ -1 → +=(6-0-1-1)=4   → counts=9
leftIdx=2 ( 0): rights[0]=1 ≥  0 → +=(6-0-1-2)=3   → counts=12
leftIdx=3 ( 0): rights[0]=1 ≥  0 → +=(6-0-1-3)=2   → counts=14
leftIdx=4 ( 2): rights[0]=1 < 2 → rightIdx++
                rights[1]=4 ≥  2 → +=(6-1-1-4)=0   → counts=14
leftIdx=5 ( 5): rights[1]=4 < 5 → rightIdx++
                rights[2]=4 < 5 → rightIdx++
                rights[3]=5 ≥  5 → +=(6-3-1-5)=-3  → counts=11

반환: 11 ✅
```

### 남은 버그

**버그: -1 반환 로직 없음**

`counts > 10_000_000`을 초과해도 그대로 누산 값을 반환한다:

```
N=4473, 모두 같은 반지름: counts=10,001,628 반환 (기대: -1)
N=100,000, 모두 같은 반지름: counts=4,999,950,000 반환 (기대: -1)
```

누산 중 초과 여부를 체크하는 조기 반환 로직이 없다:

```ts
// 현재: 초과 검사 없음
counts = counts + rights.length - rightIdx - 1 - leftIdx;

// 필요:
counts = counts + rights.length - rightIdx - 1 - leftIdx;
if (counts > 10_000_000) return -1;
```

---

## 반복 6 — `-1` 체크를 루프 후로 이동 (13 pass / 0 fail)

> 분석 일자: 2026-04-28
> 테스트 결과: 13 pass / 0 fail

### 변경된 구현

```ts
const lefts = A.map((r, i) => i - r).sort((a, b) => a - b);
const rights = A.map((r, i) => i + r).sort((a, b) => a - b);

let counts = 0;
let rightIdx = 0;

for (let leftIdx = 0; leftIdx < lefts.length; leftIdx++) {
  while (rightIdx < rights.length) {
    if (lefts[leftIdx]! <= rights[rightIdx]!) {
      counts = counts + rights.length - rightIdx - 1 - leftIdx;
      break;
    } else {
      rightIdx++;
    }
  }
}

if (counts > 10_000_000) return -1; // 루프 밖으로 이동
return counts;
```

### 개선된 점

| 버그                      | 반복 5                                          | 반복 6              |
| ------------------------- | ----------------------------------------------- | ------------------- |
| 비단조 counts로 인한 오발 | `if (counts > 10_000_000) return -1` 루프 안 ❌ | 루프 밖으로 이동 ✅ |

반복 5에서 분석한 근본 원인 — `counts`가 단조 증가하지 않아 중간 합 체크가 오발한다 — 을 `if` 위치를 루프 후로 옮겨 해결했다.

`A=[0,...,0]` (N=100,000) 케이스 검증:

```
각 leftIdx=k 단계의 증분 = N - 1 - 2k

k=0      → +99999 → counts = 99,999
k=1      → +99997 → counts = 199,996
...
k=49999  → +1     → counts = 2,500,000,000  ← 루프 안 체크였다면 -1 오발
k=50000  → -1     → counts = 2,499,999,999
...
k=99999  → -99999 → counts = 0              ← 최종 정답

루프 후 체크: 0 ≤ 10,000,000 → 0 반환 ✅
```

### 분석

**1. 접근 방향성**: 올바르다. 원판 교차를 수직선 구간 겹침으로 환원하는 모델링은 정확하다.

**2. 정확성**: 모든 13개 테스트 통과. 경계 케이스(빈 배열, N=1, 최대 반지름, -1 반환, 반지름 0)를 모두 정확히 처리한다.

**3. 최적화**: 정렬 O(N log N) + 투 포인터 O(N) = 전체 O(N log N). 성능 테스트(N=100,000 혼합, 1000ms 이내) 통과.

**한계**: 현재 알고리즘에서 `counts`는 단조 증가하지 않으므로, 루프 중간에 10,000,000 초과를 감지해 조기 종료하는 최적화를 적용할 수 없다. 이 최적화를 원한다면 ends 기준 투 포인터(표준 알고리즘)로 전환이 필요하다.

---

## 반복 5 — `if (counts > 10_000_000) return -1` 추가 (12 pass / 1 fail)

> 분석 일자: 2026-04-27  
> 테스트 결과: 12 pass / 1 fail

### 변경된 구현

```ts
const lefts = A.map((r, i) => i - r).sort((a, b) => a - b);
const rights = A.map((r, i) => i + r).sort((a, b) => a - b);

let counts = 0;
let rightIdx = 0;

for (let leftIdx = 0; leftIdx < lefts.length; leftIdx++) {
  while (rightIdx < rights.length) {
    if (lefts[leftIdx]! <= rights[rightIdx]!) {
      counts = counts + rights.length - rightIdx - 1 - leftIdx;
      if (counts > 10_000_000) return -1;
      break;
    } else {
      rightIdx++;
    }
  }
}

return counts;
```

### 개선된 점

| 버그         | 반복 4 | 반복 5                                       |
| ------------ | ------ | -------------------------------------------- |
| -1 반환 없음 | ❌     | `if (counts > 10_000_000) return -1` 추가 ✅ |

N=4473, N=100,000(큰 반지름) 케이스가 통과한다.

### 남은 버그

**버그: `counts`는 단조 증가하지 않는다 — 조기 -1 반환이 오발한다**

`rights.length - rightIdx - 1 - leftIdx` 항은 `leftIdx`가 커질수록 음수가 된다. 따라서 `counts`는 올라갔다가 다시 내려오는 형태를 띤다:

```
반복 초기  → counts 증가 (양수 항)
반복 후반  → counts 감소 (음수 항)
최종값     → 실제 교차 쌍 수
```

`A=[0,...,0]` (N=100,000, 반지름 모두 0) 추적:

```
lefts  (정렬) = [0, 1, 2, ..., 99999]
rights (정렬) = [0, 1, 2, ..., 99999]

leftIdx=k 일 때: rightIdx가 k까지 전진 → 증분 = 99999 - 2k
  k=0      → +99999 → counts=99,999
  k=1      → +99997 → counts=199,996
  ...
  k=49999  → +1     → counts=2,500,000,000  ← 10M 초과로 -1 반환
  k=50000  → -1
  ...
  k=99999  → -99999
  최종합    → 0 (실제 교차 없음)
```

실제 정답은 0이지만, 중간에 `counts`가 25억에 달하면서 `if (counts > 10_000_000) return -1`이 오발한다.

**근본 원인: 조기 종료와 알고리즘이 호환되지 않는다**

현재 알고리즘은 각 단계에서 "잠정 과추정(over-estimate)"한 뒤 후반 단계에서 음수로 보정한다. 이 구조에서는 중간 합이 최종 답보다 크게 부풀어 있어, 중간 합 기준 조기 종료가 정확하지 않다.

반면 표준 **ends 기준 투 포인터** 알고리즘은 `lo - (i+1) >= 0` 이 항상 보장된다:

$$\text{ends}[i] = i + A[i] \geq i \geq i - A[i] = \text{starts}[i]$$

따라서 `lo >= i + 1`이 항상 성립하고, 증분은 절대 음수가 되지 않는다. `counts`가 단조 증가하므로 중간 합 체크가 안전하게 동작한다:

```ts
const starts = A.map((r, i) => i - r).sort((a, b) => a - b);
const ends = A.map((r, i) => i + r).sort((a, b) => a - b);

let count = 0;
let lo = 0;

for (let i = 0; i < A.length; i++) {
  while (lo < A.length && starts[lo]! <= ends[i]!) lo++;
  count += lo - (i + 1); // 항상 >= 0
  if (count > 10_000_000) return -1;
}
return count;
```

# QnA

counts를 구하는 식에서, leftIdx를 빼는 항이 들어있다. 이전 순회들에서 확인한 원의 right가 이번 순회에  
 이미 포함 되지 않을 수도 있는데, leftIdx를 빼는게 어째서 논리적으로 성립하나

⏺ 날카로운 질문입니다. -leftIdx는 rightIdx와 직접적인 관계가 없습니다. 두 항이 서로 다른 역할을 합니다.

---

rights.length - rightIdx가 하는 일

현재 lefts[leftIdx] 이상인 오른쪽 끝점의 개수를 셉니다. rightIdx는 이 역할만 합니다.

---

-(1 + leftIdx)가 하는 일

우선 보정 없이 단순 합산하면 어떤 값이 나오는지 봅니다:

Total_naive = Σ (rights.length - rightIdx)  
 = # { (a, b) 쌍 : lefts[a] ≤ rights[b] }

이 값을 분해하면:

┌───────────────────────────┬──────────┬─────────────────────────────────────────────────────────────┐  
 │ 쌍 종류 │ 기여 │ 이유 │
│ │ 횟수 │ │  
 ├───────────────────────────┼──────────┼─────────────────────────────────────────────────────────────┤
│ 교차하는 미순서 쌍 {i,j} │ 2 │ left_i ≤ right_j 도 성립, left_j ≤ right_i 도 성립 │
├───────────────────────────┼──────────┼─────────────────────────────────────────────────────────────┤  
 │ 교차 안 하는 미순서 쌍 │ 1 │ 한 방향만 성립 (e.g. right_i < left_j → left_j > right_i는 │  
 │ {i,j} │ │ 불성립) │  
 ├───────────────────────────┼──────────┼─────────────────────────────────────────────────────────────┤  
 │ 자기 자신 (i, i) │ 1 │ left_i ≤ right_i 는 항상 성립 (A[i] ≥ 0) │  
 └───────────────────────────┴──────────┴─────────────────────────────────────────────────────────────┘

$$\text{Total_naive} = 2I + NP + N$$

$I$ = 교차 쌍 수, $NP$ = 비교차 쌍 수, $I + NP = \binom{N}{2}$ 이므로:

$$I = \text{Total_naive} - \binom{N}{2} - N = \text{Total_naive} - \frac{N(N+1)}{2}$$

그리고:

$$\frac{N(N+1)}{2} = \sum_{a=0}^{N-1}(a + 1)$$

이게 바로 -1 - leftIdx가 각 단계에서 빼는 값입니다.

---

결론

-leftIdx는 rightIdx가 건너뛴 원소를 보정하는 게 아닙니다. rightIdx와 완전히 독립적으로, "같은 배열끼리
세는 것"과 "이중 계산"을 제거하는 수학적 보정항입니다.

실제 알고리즘이 계산하는 것:  
 Σ (rights.length - rightIdx) ← 교차·비교차·자기쌍 전부 포함한 raw count

- Σ (1 + leftIdx) ← 비교차 쌍과 자기 자신 제거  
  = 교차하는 쌍의 수
