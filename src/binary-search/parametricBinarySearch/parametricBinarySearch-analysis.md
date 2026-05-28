# Parametric Binary Search — 솔루션 분석 보고서

## 1. 접근 방법 분석

접근 방법은 **올바르다**. 파라메트릭 이진 탐색을 적용하여 최적화 문제를 판정 문제로 변환하는 전략이 정확히 맞다.

- 탐색 범위를 `lo = max(A)`, `hi = sum(A)`로 설정하는 것은 정답의 하한·상한에 해당한다.
- `feasible(mid)` 판정 함수를 탐욕 순회로 구현하려는 의도는 맞다.
- 단조성을 이용하여 이진 탐색으로 수렴하려는 구조도 올바르다.

---

## 2. 테스트 결과 분석

**결과: 전체 테스트 무한 루프로 중단 (정상 종료 불가)**

`mid` 계산 공식 오류(버그 1)로 인해 루프가 발산하여 단 하나의 테스트도 완료되지 않는다. 예를 들어 `lo=10, hi=28`일 때 잘못된 공식이 `mid=29`를 반환하고(hi=28 초과), `feasible(29)=true`로 `hi=28`로 재설정된 뒤 다음 iteration에서도 동일한 `mid=29`가 산출되는 사이클이 반복된다.

버그 1을 제거하더라도 버그 3·4가 남아 있어 `feasible` 함수가 잘못된 값을 반환하므로 대부분의 테스트가 오답을 출력한다.

---

## 3. 버그 목록

### 버그 1 — Mid 계산 공식 오류 (무한 루프 유발)

**위치**: 6번째 줄 (초기화), 25번째 줄 (루프 내부)

```typescript
// 잘못됨
let mid = lo + Math.floor((lo + hi) / 2);
```

**정확한 공식**:
$$\text{mid} = \left\lfloor \frac{\text{lo} + \text{hi}}{2} \right\rfloor \quad \left( = \text{lo} + \left\lfloor \frac{\text{hi} - \text{lo}}{2} \right\rfloor \right)$$

**현재 공식이 계산하는 값**:
$$\text{lo} + \left\lfloor \frac{\text{lo} + \text{hi}}{2} \right\rfloor = \frac{3 \cdot \text{lo}}{2} + \frac{\text{hi}}{2}$$

lo > 0이면 이 값은 $\text{hi}$를 초과한다. 예: `lo=10, hi=28`이면

- 잘못된 공식: $10 + \lfloor 38/2 \rfloor = 10 + 19 = 29$ (hi=28 초과)
- 올바른 공식: $\lfloor 38/2 \rfloor = 19$ (범위 $[10, 28]$ 내)

`mid > hi`이면 `feasible(mid)=true`가 되어 `hi = mid − 1`로 설정해도 다음 iteration에서 또다시 `mid > hi`인 동일한 값이 산출된다. 결과적으로 루프가 수렴하지 않고 **무한 반복**된다.

**수정**:
```typescript
let mid = Math.floor((lo + hi) / 2);
// 또는: lo + Math.floor((hi - lo) / 2)
```

---

### 버그 2 — 이진 탐색 패턴 혼용 및 반환값 오류

**위치**: 19번째 줄 (루프 조건), 21번째 줄 (hi 업데이트), 28번째 줄 (반환값)

```typescript
while (lo <= hi) {          // 패턴 A
  if (feasible(A, mid, K)) {
    hi = mid - 1;           // 패턴 A
  } else {
    lo = mid + 1;
  }
  mid = lo + Math.floor((lo + hi) / 2);
}
return mid;                 // 패턴 A에서 lo를 반환해야 함
```

`while (lo <= hi)` + `hi = mid − 1` 조합(패턴 A)에서 루프 종료 시 정답은 `lo`이다. `mid`는 루프가 끝난 뒤(`lo > hi` 상태에서) 다시 계산되므로 의미 없는 값이다.

| 패턴 | 루프 조건 | feasible=true 시 | feasible=false 시 | 반환 |
|------|-----------|-------------------|-------------------|------|
| A | `lo <= hi` | `hi = mid − 1` | `lo = mid + 1` | `lo` |
| B (가이드) | `lo < hi` | `hi = mid` | `lo = mid + 1` | `lo` |

패턴 B를 적용하면 `hi = mid`(mid−1 아님)로 설정해야 하며, `lo == hi`일 때 루프가 종료되어 정답이 확정된다.

**수정 (패턴 B 기준)**:
```typescript
while (lo < hi) {
  const mid = lo + Math.floor((hi - lo) / 2);
  if (feasible(A, mid, K)) {
    hi = mid;         // mid 자체가 정답 후보이므로 제외하지 않음
  } else {
    lo = mid + 1;
  }
}
return lo;            // lo == hi == 정답
```

---

### 버그 3 — feasible: accSum 이중 계산 오류

**위치**: 47–50번째 줄

```typescript
if (accSum + item > mid) {
  count++;
  accSum = item;   // (1) accSum = item으로 설정
}
accSum += item;    // (2) item을 다시 더함 → accSum = 2 * item !!
```

새 구간을 시작할 때 현재 원소(`item`)가 새 구간의 첫 번째 원소가 되어야 하므로, 처리 후 `accSum = item`이어야 한다. 그러나 (1)에서 `item`으로 설정한 뒤 (2)에서 다시 더해 `accSum = 2 * item`이 된다.

**추적 예시**: `A=[7,2,5,10,8]`, `mid=18`

| item | 조건 | 올바른 accSum | 버그 accSum |
|------|------|--------------|------------|
| 7 | 7≤18 | 7 | 7 |
| 2 | 9≤18 | 9 | 9 |
| 5 | 14≤18 | 14 | 14 |
| 10 | 24>18 (새 구간) | **10** | **20** (=10+10) |
| 8 | 18≤18 (정상) / 28>18 (버그) | 18 | → count+1, **16** |

버그로 인해 올바를 때 1회인 분할이 2회로 카운트된다.

**수정**:
```typescript
if (accSum + item > mid) {
  count++;
  accSum = 0;    // 0으로 초기화
}
accSum += item; // accSum = 0 + item = item ✓
```

---

### 버그 4 — feasible: count 초기화 및 비교 기준 오류

**위치**: 42번째 줄 (초기화), 53번째 줄 (반환 조건)

```typescript
let count = 0;       // 분할 횟수(경계 개수)를 카운트
// ...
return count <= K;   // 오류: K+1개 구간까지 허용함
```

count=0은 "새 구간이 시작된 횟수"(partition boundary 개수)를 나타낸다. 구간 수 = count + 1이므로:

| count (splits) | 실제 구간 수 | K=2에서 코드 판정 | K=2에서 올바른 판정 |
|---------------|------------|-----------------|-----------------|
| 0 | 1 | 0≤2=true ✓ | true ✓ |
| 1 | 2 | 1≤2=true ✓ | true ✓ |
| 2 | **3** | 2≤2=**true** ❌ | **false** ✓ |
| 3 | 4 | 3≤2=false ✓ | false ✓ |

K개 이하 구간 조건: count ≤ K−1, 즉 **`count < K`**.

가이드는 count=1로 시작하여 "현재 구간 수"를 직접 세므로 `count <= K`가 정확하다.

**수정 방법 A** (초기화 유지, 비교 수정):
```typescript
let count = 0;
// ...
return count < K;   // count <= K-1
```

**수정 방법 B** (가이드 방식, 초기화 변경):
```typescript
let count = 1;      // 첫 번째 구간은 항상 존재
// ...
return count <= K;
```

---

## 4. 올바른 구현

```typescript
export function parametricBinarySearch(A: number[], K: number): number {
  let lo = Math.max(...A);
  let hi = A.reduce((acc, cur) => acc + cur);

  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (feasible(A, mid, K)) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}

function feasible(A: number[], mid: number, K: number): boolean {
  let count = 1;
  let accSum = 0;

  for (const item of A) {
    if (accSum + item > mid) {
      count++;
      accSum = 0;
    }
    accSum += item;
  }

  return count <= K;
}
```

---

## 5. 버그 요약표

| 번호 | 위치 | 버그 내용 | 영향 |
|------|------|----------|------|
| 1 | L6, L25 | `lo + floor((lo+hi)/2)` → `floor((lo+hi)/2)` | **무한 루프** |
| 2 | L19, L21, L28 | `while(lo<=hi)` + `hi=mid-1` + `return mid` | 잘못된 반환값 |
| 3 | L48 | `accSum = item` 후 `accSum += item` → 2배 | feasible 오판정 |
| 4 | L42, L53 | count=0 시작에 `count <= K` 사용 | K+1 구간 허용 |

---

## 6. 수정 이력 및 남은 버그 (2차 분석)

### 수정된 내용

**버그 1 — 완전 수정**

L6은 이전에 수정되었고, 이번에 L25도 동일하게 수정되었다.

```typescript
// 이전 (L25, 오류)
mid = lo + Math.floor((lo + hi) / 2);

// 현재 (L25, 수정됨)
mid = lo + Math.floor((hi - lo) / 2);
```

`lo + floor((hi - lo) / 2)` = `floor((lo + hi) / 2)` 이므로 표준 중간값 공식과 동일하다. `lo ≤ mid ≤ hi` 불변식이 이제 루프 전체에서 유지된다.

**효과**: 무한 루프 해소. 테스트가 모두 종료된다.

---

### 테스트 결과 (수정 후)

```
2 pass, 13 fail
```

통과한 테스트:
- `[1,2,3,4,5,6,7,8,9,10], K=3 → 21` — 버그 3·4의 오차가 우연히 상쇄되어 통과
- `N=100,000 성능 테스트` — 결과 > 0 조건만 확인하므로 통과

실패 패턴:

| 입력 | 기댓값 | 실제값 | 오차 | 주된 원인 |
|------|--------|--------|------|----------|
| [7,2,5,10,8], K=2 | 18 | 13 | −5 | 버그 3·4 + 버그 2 |
| [1,2,3,4,5], K=2 | 9 | 5 | −4 | 버그 3·4 + 버그 2 |
| [1,2,3,4,5], K=1 | 15 | 9 | −6 | 버그 3·4 + 버그 2 |
| [5,5,5,5,5], K=1 | 25 | 14 | −11 | 버그 3·4 + 버그 2 |
| [3,1,4,1,5,9,2,6], K=1 | 31 | 22 | −9 | 버그 3·4 + 버그 2 |
| [1,4,4], K=3 | 4 | 3 | −1 | 버그 2만 |
| [1,2,3,4,5], K=5 | 5 | 4 | −1 | 버그 2만 |
| [7], K=1 | 7 | 6 | −1 | 버그 2만 |
| [0,0,0,0], K=2 | 0 | −1 | −1 | 버그 2만 |
| [5,5,5,5,5], K=5 | 5 | 4 | −1 | 버그 2만 |
| [3,1,4,1,5,9,2,6], K=8 | 9 | 8 | −1 | 버그 2만 |
| [1,1,1,1000000], K=2 | 1000000 | 999999 | −1 | 버그 2만 |
| [3,5], K=2 | 5 | 4 | −1 | 버그 2만 |

---

### 오차 패턴 분석

**오차 = −1인 경우 (버그 2만 영향)**

버그 3·4가 이 경우에는 이진 탐색의 수렴 지점에 영향을 미치지 않는다. 이진 탐색이 올바른 정답 $m^*$로 수렴하지만, 루프 종료 직전 마지막 mid 재계산에서 오차가 생긴다.

`while (lo <= hi)` 패턴에서 루프가 종료되는 두 가지 시나리오:

시나리오 A: lo = hi = m*이고 feasible(m*) = true (정상 종료)
  - hi = m* − 1 → lo = m* > hi → 루프 탈출
  - 루프 탈출 후: `mid = lo + floor((hi − lo) / 2) = m* + floor(−1/2) = m* − 1`
  - `return mid` → $m^* − 1$ ← 항상 −1 오차

시나리오 B: lo < hi이고 feasible(mid) = false, lo = mid + 1 = hi + 1 > hi
  - 루프 탈출 후: `mid = (hi+1) + floor(−1/2) = hi`
  - `return mid` = hi ← 경우에 따라 다름

오차 −1인 케이스들은 모두 시나리오 A로 수렴한다. `return lo`로 수정하면 이 케이스들은 즉시 통과된다.

**오차 > 1인 경우 (버그 3·4가 수렴점을 왜곡)**

버그 3의 accSum 이중 계산으로 인해, 실제로는 구간을 나누지 않아도 되는 시점에 나눔이 발생하여 `count`가 실제보다 크게 산출된다. 버그 4의 count ≤ K 오차와 결합되면, 실제로는 불가능한 mid 값을 feasible로 판정하여 hi를 과도하게 줄인다. 결과적으로 이진 탐색이 정답보다 작은 값에서 수렴한다.

예: [7,2,5,10,8], K=2에서 mid=15 (실제로는 infeasible):
- 올바른 feasible(15, 2): count=3 (3개 구간 필요), 3 ≤ 2 = false
- 버그 feasible(15, 2): count=2 (accSum 이중 계산으로 2회 분할), 2 ≤ 2 = **true** (오판정)
- 결과: hi=14로 줄어 이진 탐색 범위가 좁아짐 → 13에서 종료

---

### 남은 버그 목록

| 번호 | 위치 | 상태 | 내용 |
|------|------|------|------|
| 1 | L6, L25 | ✅ **수정됨** | mid 공식 오류 |
| 2 | L19, L21, L28 | ❌ **미수정** | `return mid` → `return lo` 또는 패턴 B 적용 |
| 3 | L48 | ❌ **미수정** | `accSum = item` → `accSum = 0` |
| 4 | L42, L53 | ❌ **미수정** | `count <= K` → `count < K` (또는 count=1 초기화) |

---

## 7. 수정 이력 및 최종 상태 (3차 분석)

### 수정된 내용

**버그 2 수정** — `return mid` → `return lo` (L30)

```typescript
// 이전
return mid;

// 현재
return lo;
```

`while (lo <= hi)` 패턴에서 루프 종료 시 lo가 최솟값 $m^*$를 가리킨다. (루프 종료 조건: lo = hi + 1이고 마지막 feasible(mid)=true에서 hi=mid−1이 설정되었으므로 lo = mid = $m^*$)

**버그 3 수정** — `accSum = item` → `accSum = 0` (L50)

```typescript
// 이전
accSum = item;

// 현재
accSum = 0;
```

새 구간 시작 시 accSum을 0으로 초기화한 뒤, 이어지는 `accSum += item`에서 item만 더해져 `accSum = item`이 된다. 이중 계산이 제거된다.

**버그 4 수정** — `count = 0` → `count = 1` (L44)

```typescript
// 이전
let count = 0;

// 현재
let count = 1;
```

배열은 최소 1개 구간으로 시작한다. count=1로 초기화하면 분할이 생길 때마다 count++하여 "구간 수"를 직접 추적하므로 `count <= K` 조건이 정확하다.

---

### 테스트 결과 (최종)

```
15 pass, 0 fail  [107ms]
```

모든 테스트 통과. 성능 테스트(N=100,000)도 100ms 이내에 완료.

---

### 전체 버그 수정 이력

| 버그 | 수정 시점 | 수정 내용 |
|------|----------|----------|
| 1 (L6 초기 mid) | 1차 → 2차 | `(lo+hi)` → `(hi−lo)` |
| 1 (L25 루프 mid) | 2차 → 3차 | `(lo+hi)` → `(hi−lo)` |
| 2 (반환값) | 2차 → 3차 | `return mid` → `return lo` |
| 3 (accSum 이중) | 2차 → 3차 | `accSum = item` → `accSum = 0` |
| 4 (count 초기화) | 2차 → 3차 | `count = 0` → `count = 1` |
