# kthSmallest 분석 보고서

## 분석 대상 코드 (현재 상태)

```ts
export function kthSmallest(A: number[], k: number): number {
  A.sort((a, b) => a - b);

  return A[k - 1]!;
}
```

---

## 1. 접근 방법 방향성 분석

### 결과적 방향성: 올바름

문제 정의는 다음과 같다.

$$\text{kthSmallest}(A, k) = \text{sort}(A)[k-1]$$

현재 구현은 배열 `A`를 오름차순으로 정렬한 뒤 1-based 인덱스 `k`에 해당하는 `A[k - 1]`을 반환한다. 이는 문제 정의를 그대로 옮긴 것으로, **반환값의 정확성 측면에서 방향성은 올바르다.**

비교 함수 `(a, b) => a - b`도 적절하다. JavaScript `Array.prototype.sort`는 인자가 없으면 원소를 문자열로 변환해 사전식으로 비교하므로 숫자 정렬에는 비교 함수가 필수다. 음수와 큰 수($\pm 10^9$)가 섞여도 `a - b`는 안전하다($|a - b| \leq 2 \times 10^9 < 2^{53}$이므로 부동소수점 오차 없음).

### 부작용(side effect) 관점: 주의 필요

`A.sort(...)`는 **입력 배열 `A`를 제자리(in-place)에서 변형**한다. 따라서 함수 호출 후 호출자가 보유한 원본 배열의 원소 순서가 바뀐다. 문제는 반환값만 요구하고 입력 보존을 명시하지 않으므로 채점은 통과하지만, "조회 함수가 입력을 변형한다"는 것은 일반적으로 바람직하지 않은 계약(contract)이다. 자세한 내용은 §2의 정확성 분석에서 다룬다.

---

## 2. 정확성 분석

### 테스트 결과

```
bun test src/sorting/kthSmallest/kthSmallest.test.ts
 11 pass / 0 fail   [24.00ms]
```

11개 테스트를 모두 통과한다. 기본 동작(k=1, k=3, k=N), 중복·음수·동일 원소, 경계값($\pm 10^9$), N=100,000 성능 테스트가 모두 정상이다. **반환값은 항상 정확하다.**

### 잠복 부작용: 입력 배열 변형

테스트는 통과하지만, 구현에는 테스트가 검출하지 못하는 부작용이 있다.

`A.sort()`가 입력을 제자리 정렬하므로, 다음과 같이 호출 측이 원본 순서에 의존하면 문제가 된다.

```ts
const data = [3, 1, 2];
const second = kthSmallest(data, 2);  // 2
// 이 시점에서 data는 [1, 2, 3]으로 바뀌어 있음 (원본 [3, 1, 2] 소실)
```

현재 테스트 스위트가 이를 잡지 못하는 이유:

1. 대부분의 테스트는 배열 리터럴을 인자로 직접 넘겨, 변형되어도 참조하는 곳이 없다.
2. 성능 테스트(63~65행)는 `const expected = [...A].sort(...)`로 검증하지만, 이 줄은 `kthSmallest(A, k)` **호출 이후** 실행된다. 그 시점에 `A`는 이미 정렬된 상태이고, 정렬된 배열을 다시 정렬해도 결과가 같으므로 검증이 우연히 통과한다.

**부작용 제거(권장):** 입력을 복사한 뒤 정렬한다.

```ts
export function kthSmallest(A: number[], k: number): number {
  const sorted = [...A].sort((a, b) => a - b);
  return sorted[k - 1]!;
}
```

이는 정확성·복잡도에 영향을 주지 않으면서 입력 불변성(immutability)을 보장한다. (단, §3의 Quickselect로 교체하면 별도의 복사 전략이 필요하다 — 후술.)

### 입력 보존 회귀 테스트(권장)

```ts
test("입력 배열을 변형하지 않는다", () => {
  const input = [3, 1, 2];
  kthSmallest(input, 2);
  expect(input).toEqual([3, 1, 2]);
});
```

---

## 3. 최적화 분석

### 현재 시간 복잡도: $O(N \log N)$

`Array.prototype.sort`는 비교 기반 정렬이므로 $O(N \log N)$이다. N=100,000에서 $N \log_2 N \approx 1.7 \times 10^6$ 비교로, 현대 JS 엔진에서 100ms 이내에 충분히 처리된다. **성능 테스트는 통과한다.**

### 개선 여지: $k$번째 원소만 필요하다

전체 정렬은 모든 원소의 상대 순서를 결정한다. 그러나 문제는 **$k$번째 원소 하나**만 요구한다. 나머지 $N-1$개의 정렬 정보는 버려진다. 이 낭비를 제거하면 평균 $O(N)$에 답을 구할 수 있다. 성능 테스트 주석이 "Quickselect 기준"이라고 명시한 것도 이 때문이다.

| 방법 | 평균 | 최악 | 비고 |
|------|------|------|------|
| 전체 정렬 (현재) | $\Theta(N \log N)$ | $O(N \log N)$ | 구현 단순, 모든 순서 계산 |
| **Quickselect** | $\Theta(N)$ | $O(N^2)$ | 한쪽만 재귀, 무작위 피벗 권장 |
| Median-of-Medians | $\Theta(N)$ | $O(N)$ | 최악도 선형, 상수 큼 |
| 최소 힙 k회 추출 | $\Theta(N + k \log N)$ | 동일 | k가 작을 때 유리 |

---

## 3.1 핵심 개선 아이디어: Quickselect

### 핵심 아이디어

배열을 **하나의 피벗(pivot)** 기준으로 두 부분으로 나눈다(분할, partition).

- 왼쪽 부분: 피벗보다 작은 원소들
- 오른쪽 부분: 피벗보다 큰(또는 같은) 원소들

분할이 끝나면 피벗은 **정렬 후 자신이 놓일 최종 위치** `p`(0-based)에 자리잡는다. 이제 세 경우로 나뉜다.

1. `p == k - 1`: 피벗이 곧 $k$번째 원소다. 즉시 반환한다.
2. `p > k - 1`: 찾는 원소는 피벗보다 작으므로 **왼쪽 부분에만** 있다. 왼쪽만 다시 분할한다.
3. `p < k - 1`: 찾는 원소는 피벗보다 크므로 **오른쪽 부분에만** 있다. 오른쪽만 다시 분할한다.

전체 정렬(Quicksort)은 양쪽을 모두 재귀하지만, Quickselect는 **한쪽만** 재귀한다. 이 한 가지 차이가 평균 복잡도를 $O(N \log N)$에서 $O(N)$으로 낮춘다.

### 3.1.1 알고리즘 원형에서 개선책 유도 과정

**Step 1 — 원형 알고리즘: Quicksort**

Quicksort는 피벗으로 배열을 분할한 뒤 양쪽을 각각 재귀 정렬한다.

```
quicksort(A, lo, hi):
    if lo >= hi: return
    p = partition(A, lo, hi)      # 피벗을 최종 위치 p에 배치
    quicksort(A, lo, p - 1)       # 왼쪽 재귀
    quicksort(A, p + 1, hi)       # 오른쪽 재귀
```

평균 비용: 매 단계에서 길이 $N$ 구간을 분할하는 데 $O(N)$, 두 부분을 모두 재귀하므로

$$T(N) = 2\,T(N/2) + O(N) = O(N \log N)$$

**Step 2 — 관찰 1: partition은 피벗의 최종 순위를 확정한다**

분할 함수는 피벗을 위치 `p`에 놓는데, 이 `p`는 "피벗보다 작은 원소의 개수"와 정확히 같다. 즉 **정렬을 끝내지 않아도, 분할 한 번이면 피벗이 정렬 후 몇 번째인지(`p`)를 알 수 있다.**

분할(Lomuto 방식) 의사코드:

```
partition(A, lo, hi):
    pivot = A[hi]                 # 마지막 원소를 피벗으로 선택
    i = lo                        # i: 피벗보다 작은 원소가 들어갈 자리
    for j from lo to hi - 1:
        if A[j] < pivot:
            swap(A[i], A[j])
            i = i + 1
    swap(A[i], A[hi])             # 피벗을 i 위치로 이동
    return i                      # 피벗의 최종 위치
```

분할이 끝나면 `A[lo..i-1] < A[i] <= A[i+1..hi]`가 성립한다. `A[i]`는 더 이상 움직이지 않는다.

**Step 3 — 관찰 2: 찾는 원소는 한쪽에만 있다**

분할로 얻은 `p`와 목표 인덱스 `k - 1`을 비교하면, 정답이 속한 부분이 **한쪽으로 확정**된다.

- `p == k - 1`이면 `A[p]`가 정답이다.
- `p > k - 1`이면 정답은 `A[lo..p-1]`에 있다. 오른쪽 `A[p+1..hi]`는 전부 정답보다 크므로 볼 필요가 없다.
- `p < k - 1`이면 정답은 `A[p+1..hi]`에 있다. 왼쪽은 볼 필요가 없다.

따라서 Quicksort의 두 재귀 호출 중 **항상 하나는 버릴 수 있다.**

**Step 4 — 형식화: Quickselect**

```
quickselect(A, lo, hi, target):   # target = k - 1 (0-based)
    while lo < hi:
        p = partition(A, lo, hi)
        if p == target: return A[p]
        else if p < target: lo = p + 1   # 오른쪽만
        else:               hi = p - 1   # 왼쪽만
    return A[lo]                          # 구간이 한 원소로 좁혀짐
```

(재귀를 반복문으로 펼쳤다 — 한쪽만 재귀하므로 꼬리 재귀이고, 반복문으로 바꾸면 호출 스택을 $O(1)$로 유지할 수 있다.)

**Step 5 — 복잡도 유도**

매 분할 비용은 구간 길이에 비례한다. 피벗이 매번 구간을 절반으로 나눈다고 가정하면, 처리하는 총 원소 수는

$$N + \frac{N}{2} + \frac{N}{4} + \cdots = N \sum_{t=0}^{\infty} \left(\frac{1}{2}\right)^t = 2N = O(N)$$

Quicksort의 $2\,T(N/2)$가 Quickselect에서는 $T(N/2)$ **하나**로 줄어든 결과다.

$$T(N) = T(N/2) + O(N) = O(N)$$

무작위 입력 또는 무작위 피벗에서 기댓값으로 평균 $O(N)$이 성립한다.

**Step 6 — 최악의 경우와 회피**

피벗이 매번 구간의 최솟값(또는 최댓값)으로 뽑히면 한쪽이 비고 다른 쪽이 $N-1$개 남아

$$T(N) = T(N - 1) + O(N) = O(N^2)$$

이 된다(예: 이미 정렬된 입력에서 마지막 원소를 피벗으로 고정 선택할 때). 회피책:

1. **무작위 피벗:** `lo..hi`에서 무작위 인덱스를 골라 `A[hi]`와 교환한 뒤 분할한다. 어떤 입력이든 기대 $O(N)$.
2. **Median-of-Medians:** 피벗을 결정적으로 "중앙값의 근사"로 고르면 최악도 $O(N)$이 보장되지만 상수가 커서 실무에서는 보통 무작위 피벗을 쓴다.

### 참고 구현 (무작위 피벗 + 입력 비변형)

```ts
export function kthSmallest(A: number[], k: number): number {
  const a = [...A];            // 입력 보존 (§2 부작용 제거)
  let lo = 0;
  let hi = a.length - 1;
  const target = k - 1;        // 0-based

  while (lo < hi) {
    const p = partition(a, lo, hi);
    if (p === target) return a[p]!;
    if (p < target) lo = p + 1;
    else hi = p - 1;
  }
  return a[lo]!;
}

function partition(a: number[], lo: number, hi: number): number {
  const r = lo + Math.floor(Math.random() * (hi - lo + 1));
  [a[r], a[hi]] = [a[hi]!, a[r]!];   // 무작위 피벗을 끝으로 이동
  const pivot = a[hi]!;
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j]! < pivot) {
      [a[i], a[j]] = [a[j]!, a[i]!];
      i++;
    }
  }
  [a[i], a[hi]] = [a[hi]!, a[i]!];
  return i;
}
```

---

---

## [컨셉 변경] 커스텀 퀵 정렬 구현 분석

### 변경 내용

이전 구현: `A.sort((a, b) => a - b)` (JS 내장 정렬)  
현재 구현: 직접 작성한 Lomuto Partition 기반 퀵 정렬

방향성은 이전과 동일하다 — **전체 정렬 후 `A[k-1]` 인덱싱**. 복잡도도 동일한 O(N log N)이며 Quickselect O(N)로 가기 위한 중간 단계로 해석된다.

### 테스트 결과: 5 pass / 6 fail

| # | 테스트 | 결과 | 원인 |
|---|--------|------|------|
| 1 | k=3인 경우 | ❌ | Bug #2 (오른쪽 재귀 누락) |
| 2 | k=1인 경우 | ✅ | 최솟값은 첫 파티션에서 위치 확정 |
| 3 | k=N인 경우 | ❌ | Bug #2 |
| 4 | 중복이 많은 배열 | ✅ | A[3]=2 우연히 정확 |
| 5 | 음수가 섞인 배열 | ❌ | Bug #2 |
| 6 | 모든 원소가 같은 배열 | ✅ | 교환이 no-op, 결과 무관 |
| 7 | 최소 길이 (N=1) | ✅ | 기저 조건 충족 |
| 8 | 길이 2 — 작은 쪽 | ❌ | Bug #1 |
| 9 | 길이 2 — 큰 쪽 | ❌ | Bug #1 |
| 10 | 최솟/최댓값 경계 | ✅ | 3원소 파티션 후 우연히 정확 |
| 11 | 성능 N=100,000 | ❌ | Bug #2로 잘못된 결과 |

### Bug #1: 기저 조건이 2-원소 배열을 건너뜀

```ts
if (hi - lo < 2) return;  // ← hi - lo < 1 이어야 한다
```

`hi - lo < 2`는 `hi - lo == 0`(원소 1개)과 `hi - lo == 1`(원소 2개) 모두에서 반환한다. 2-원소 서브배열은 정렬이 필요하지만 처리되지 않는다.

**반례**: `kthSmallest([10, 5], 1)`:
- sort([10,5], 0, 1): hi-lo=1 < 2 → 즉시 반환
- A = [10, 5] (정렬 안 됨)
- return A[0] = 10. 기댓값: 5 ❌

수정: `if (hi - lo < 1) return;`

### Bug #2: 오른쪽 재귀 호출 누락

```ts
sort(arr, lo, i - 1);
// sort(arr, i + 1, hi); ← 이 줄이 없다
```

파티션 후 피벗 오른쪽 서브배열(`arr[i+1..hi]`)이 재귀 정렬되지 않는다. 피벗보다 크거나 같은 원소들의 순서가 확정되지 않으므로 `k`가 피벗 위치보다 큰 경우 항상 오답이 된다.

**반례**: `kthSmallest([3,1,4,1,5,9,2,6], 3)`:

| 단계 | arr 상태 | 설명 |
|------|----------|------|
| 초기 | `[3,1,4,1,5,9,2,6]` | |
| pivotIdx=3, pivot=1 → arr[7]↔arr[3] | `[3,1,4,6,5,9,2,1]` | |
| 파티션 루프: 없음 (모두 1 이상) | i=0 | |
| 피벗 배치: arr[0]↔arr[7] | `[1,1,4,6,5,9,2,3]` | 피벗 1이 arr[0]에 배치 |
| sort(arr,0,-1): 반환 | — | |
| sort(arr,1,7): **누락** | — | arr[1..7]=[1,4,6,5,9,2,3] 미정렬 |
| 최종 arr | `[1,1,4,6,5,9,2,3]` | |

k=3 → A[2]=4. 기댓값: 2. ❌

### 잔존 버그 요약

| 번호 | 줄 | 현재 코드 | 수정 코드 |
|------|-----|-----------|-----------|
| #1 | 11 | `if (hi - lo < 2) return;` | `if (hi - lo < 1) return;` |
| #2 | 34 | (없음) | `sort(arr, i + 1, hi);` 추가 |

---

## [컨셉 변경 2] Quickselect 구현 시도 분석

### 변경 내용

이전 구현: Lomuto Partition 기반 **전체 정렬** (sort 함수에 k 없음)  
현재 구현: Lomuto Partition 기반 **Quickselect** (sort 함수에 k 추가, 한쪽 서브배열만 재귀)

`sort` 함수가 `k`를 인자로 받고, 분할 후 피벗 위치 `i`와 `k-1`을 비교해 한쪽만 재귀하는 구조다. Quickselect의 핵심 아이디어를 적용한 것이다. 방향성은 올바르다.

### 테스트 결과: 2 pass / 9 fail

```
bun test src/sorting/kthSmallest/kthSmallest.test.ts
2 pass / 9 fail   [41.00ms]
```

| # | 테스트 | 결과 | 원인 |
|---|--------|------|------|
| 1 | k=3인 경우 | ❌ | Bug #2 + Bug #3 |
| 2 | k=1인 경우 | ❌ | Bug #2 + Bug #3 |
| 3 | k=N인 경우 | ❌ | Bug #2 + Bug #3 |
| 4 | 중복이 많은 배열 | ✅ | 피벗이 첫 분할에서 k-1=3에 정확히 안착 |
| 5 | 음수가 섞인 배열 | ❌ | Bug #2 + Bug #3 |
| 6 | 모든 원소가 같은 배열 | ❌ | Bug #1 (단일 원소 도달 시 undefined 반환) |
| 7 | 최소 길이 (N=1) | ❌ | Bug #1 |
| 8 | 길이 2 — 작은 쪽 | ❌ | Bug #3 (잘못된 방향으로 재귀) |
| 9 | 길이 2 — 큰 쪽 | ✅ | 피벗이 첫 분할에서 k-1=1에 정확히 안착 |
| 10 | 최댓값/최솟값 경계 | ❌ | Bug #4 (k-2번째=0, if(0) → throw) |
| 11 | 성능 N=100,000 | ❌ | Bug #2 + Bug #3 |

### Bug #1: 단일 원소 기저 조건이 값을 반환하지 않음

```ts
if (hi - lo < 1) return;   // undefined 반환
```

`hi === lo`(단일 원소)에 도달하면 `undefined`를 반환한다. Quickselect의 불변식: 재귀가 단일 원소로 좁혀졌다면 그 원소가 정답이다. `arr[lo]`를 반환해야 한다.

**반례**: `kthSmallest([42], 1)`:
- sort([42], 0, 0, 1): hi-lo=0 < 1 → return (undefined)
- result = undefined → throw Error ❌

수정: `if (hi <= lo) return arr[lo];`

### Bug #2: 재귀 호출 결과 미반환 (return 키워드 누락)

```ts
} else if (i < k - 1) {
  sort(arr, lo, i - 1, k);   // ← return 없음
} else {
  sort(arr, i + 1, hi, k);   // ← return 없음
}
```

재귀 호출이 정답을 찾아 반환해도 호출자가 `return`으로 전달하지 않는다. 결과가 버려지고 `sort`는 `undefined`를 반환한다. 외부 함수의 `if (result) return result; else throw new Error()`는 항상 `throw`에 도달한다.

수정: 두 재귀 호출 앞에 `return` 추가.

### Bug #3: 분기 방향 역전 (좌우 서브배열 선택이 반대)

```ts
if (i < k - 1) {
  sort(arr, lo, i - 1, k);   // 왼쪽으로 재귀
} else {
  sort(arr, i + 1, hi, k);   // 오른쪽으로 재귀
}
```

분할 후 피벗은 배열 내 최종 위치 `i`에 고정된다. `i`와 목표 인덱스 `k-1`의 관계는 다음과 같다.

| 조건 | 의미 | 정답이 있는 서브배열 | 현재 코드 | 올바른 코드 |
|------|------|------|------|------|
| `i < k - 1` | 피벗이 목표보다 왼쪽에 있다 | 오른쪽 `[i+1..hi]` | `[lo..i-1]` ❌ | `[i+1..hi]` |
| `i > k - 1` | 피벗이 목표보다 오른쪽에 있다 | 왼쪽 `[lo..i-1]` | `[i+1..hi]` ❌ | `[lo..i-1]` |

수정:
```ts
if (i < k - 1) {
  return sort(arr, i + 1, hi, k);   // 오른쪽
} else {
  return sort(arr, lo, i - 1, k);   // 왼쪽
}
```

**반례**: `kthSmallest([7, 10, 4, 3, 20, 15], 1)`, k=1, k-1=0:
- 첫 분할 후 피벗이 i=1에 안착 → i > k-1
- 현재 코드: sort(arr, 2, 5, 1) — 오른쪽 재귀 → 정답 없음 ❌
- 올바른 코드: sort(arr, 0, 0, 1) → arr[0] 반환 ✓

### Bug #4: `if (result)` — 정답이 0인 경우 throw

```ts
if (result) return result;
else throw new Error();
```

k번째 최솟값이 `0`이면 `result = 0`이고, `if (0)`은 falsy이므로 Error를 던진다.

**반례**: `kthSmallest([1_000_000_000, -1_000_000_000, 0], 2)` 정답=0:
- 정답을 올바르게 찾아도 `if (0)` → throw ❌

수정: `if (result !== undefined) return result;`

### 잔존 버그 요약

| 번호 | 위치 | 현재 코드 | 수정 코드 |
|------|------|-----------|-----------|
| #1 | `sort` 기저 조건 | `if (hi - lo < 1) return;` | `if (hi <= lo) return arr[lo];` |
| #2 | `i < k-1` 분기 | `sort(arr, lo, i - 1, k);` | `return sort(arr, i + 1, hi, k);` |
| #3 | `else` 분기 | `sort(arr, i + 1, hi, k);` | `return sort(arr, lo, i - 1, k);` |
| #4 | `kthSmallest` 결과 확인 | `if (result) return result;` | `if (result !== undefined) return result;` |

---

## [버그 수정] Quickselect 4개 버그 전체 수정

### 수정 내역

이전 분석에서 식별한 Bug #1 ~ #4 가 모두 수정됐다.

| # | 수정 전 | 수정 후 | 효과 |
|---|---------|---------|------|
| #1 | `if (hi - lo < 1) return;` | `if (hi - lo < 1) return arr[lo];` | N=1 케이스 및 단일 원소 수렴 시 정답 반환 |
| #2 | `sort(arr, lo, i - 1, k);` (return 없음) | `return sort(arr, lo, i - 1, k);` | 재귀 결과가 호출 체인으로 전파됨 |
| #3 | `i < k-1` 분기가 왼쪽 재귀 | `i > k-1` 분기가 왼쪽 재귀, `else`가 오른쪽 재귀 | 분기 방향 정상화 |
| #4 | `if (result) return result;` | `if (result !== undefined) return result;` | 정답 0을 falsy로 오판하지 않음 |

### 테스트 결과: 11 pass / 0 fail

```
bun test src/sorting/kthSmallest/kthSmallest.test.ts
 11 pass / 0 fail   [53.00ms]
```

모든 테스트를 통과한다.

### 잔존 이슈

**in-place 변형은 이슈가 아님 (계약 근거)**

파티션 과정에서 원본 배열 `A`의 원소 순서가 변형된다. 그러나 테스트는 반환값만 검증하고 입력 배열 보존을 요구하지 않는다. 따라서 in-place 변형은 계약 위반이 아니다.

이는 `quickSort`와의 차이에서 비롯된다. `quickSort` 테스트는 `expect(arr).toEqual(arrCopy)`로 원본 변형을 직접 검증한다 — 변형이 계약의 일부다. `kthSmallest` 테스트에는 이에 대응하는 검증이 없다. 계약에 없는 제약을 이슈로 간주하는 것은 두 분석 간 모순을 만들므로 올바르지 않다.

Quickselect는 in-place 파티션이 알고리즘의 핵심이다. 복사본을 만드는 것은 오히려 O(N) 추가 공간을 소모하며 표준 구현 방식이 아니다.

**최악 시간 복잡도 $O(N^2)$**

피벗을 중앙 인덱스로 고정 선택하므로 특정 입력(예: 이미 정렬된 배열)에서 분할이 항상 편향될 수 있다. 무작위 피벗을 사용하면 어떤 입력에서도 기대 $O(N)$이 보장된다.

---

## [버그 수정] 무작위 피벗 구현 오류

### 변경 내용

이전: 고정 중앙 인덱스 피벗 `lo + Math.floor((hi - lo) / 2)`  
현재: 무작위 피벗 시도 `Math.floor(Math.random() * 100_000) % arr.length`

의도는 무작위 피벗으로 O(N²) 최악 케이스를 방지하는 것으로 올바르다. 그러나 구현이 잘못됐다.

### 테스트 결과: 8 pass / 3 fail

```
bun test src/sorting/kthSmallest/kthSmallest.test.ts
 8 pass / 3 fail   [54.00ms]
```

| # | 테스트 | 결과 | 원인 |
|---|--------|------|------|
| 1 | k=3인 경우 | ❌ | Bug #1 |
| 2 | k=1인 경우 | ✅ | |
| 3 | k=N인 경우 | ✅ | |
| 4 | 중복이 많은 배열 | ✅ | |
| 5 | 음수가 섞인 배열 | ❌ | Bug #1 |
| 6 | 모든 원소가 같은 배열 | ✅ | |
| 7 | 최소 길이 (N=1) | ✅ | |
| 8 | 길이 2 — 작은 쪽 | ✅ | |
| 9 | 길이 2 — 큰 쪽 | ✅ | |
| 10 | 최댓값/최솟값 경계 | ✅ | |
| 11 | 성능 N=100,000 | ❌ | Bug #1 |

소규모 배열에서 테스트가 통과하는 이유: N이 작으면 재귀 깊이가 얕고 첫 번째 호출에서 `lo=0`이므로 `% arr.length`가 전체 배열 범위와 일치하는 경우가 많다. 재귀가 깊어질수록 서브배열 범위가 좁아지고 버그가 발현된다.

### Bug #1: 무작위 피벗이 현재 서브배열 [lo..hi] 밖을 가리킴

```ts
const pivotIdx = Math.floor(Math.random() * 100_000) % arr.length;
```

문제 1 — **서브배열 범위 무시**: `% arr.length`는 `[0..arr.length-1]` 전체에서 인덱스를 생성한다. 재귀 호출 `sort(arr, lo, hi, k)`에서 `lo > 0`이면 `pivotIdx < lo`가 될 수 있다.

문제 2 — **100_000 하드코딩**: 배열 크기와 무관한 고정값이다. 배열 크기가 100_000이 아니면 분포가 균등하지 않다(모듈로 편향).

`pivotIdx`가 `[lo..hi]` 밖을 가리키면 어떻게 되는가:

`swap(arr, hi, pivotIdx)`에서 현재 서브배열 외부의 원소가 서브배열 안으로 들어온다. 이 원소는 이전 분할에서 이미 올바른 위치에 배치됐을 수 있다. 이를 교환하면 전역 불변식 — "위치 `p`에 있는 원소는 전체 배열에서 `(p+1)`번째 원소다" — 이 깨진다. 이후 재귀는 잘못된 서브배열 구성으로 진행되어 오답을 반환한다.

**반례**: `kthSmallest([3, 1, 4, 1, 5, 9, 2, 6], 3)`, arr.length=8:
- sort(arr, 0, 7, 3): `pivotIdx = X % 8` — 이 호출은 lo=0이므로 안전
- 첫 분할 후 재귀: sort(arr, lo=4, hi=7, 3) 같은 서브범위가 생길 수 있음
- `Math.floor(Math.random() * 100_000) % 8` → [0..7] 균등 분포이지만 [4..7]만 유효
- 약 50% 확률로 pivotIdx ∈ [0..3] — 서브배열 밖 ❌

수정:
```ts
const pivotIdx = lo + Math.floor(Math.random() * (hi - lo + 1));
```

`lo + Math.floor(Math.random() * (hi - lo + 1))`은 `[lo..hi]` 범위 내 균등 분포 정수를 반환한다. `Math.random()`이 `[0, 1)`이고 `(hi - lo + 1)`을 곱하면 `[0, hi-lo+1)`이 되므로 `Math.floor` 후 `[0..hi-lo]`이고 `lo`를 더하면 `[lo..hi]`다.

### 잔존 버그 요약

| 번호 | 위치 | 현재 코드 | 수정 코드 |
|------|------|-----------|-----------|
| #1 | 피벗 선택 | `Math.floor(Math.random() * 100_000) % arr.length` | `lo + Math.floor(Math.random() * (hi - lo + 1))` |

---

## [버그 수정] 무작위 피벗 범위 수정 시도 — lo 오프셋 누락

### 변경 내용

이전: `Math.floor(Math.random() * 100_000) % arr.length`  
현재: `Math.floor(Math.random() * 100_000) % (hi - lo)`

`arr.length` 대신 `(hi - lo)`를 사용해 범위를 서브배열 길이 기준으로 좁혔다. 이전 버그의 원인인 "전체 배열 범위에서 인덱스를 생성"을 일부 완화한 것이다.

### 테스트 결과: 9 pass / 2 fail

```
bun test src/sorting/kthSmallest/kthSmallest.test.ts
 9 pass / 2 fail   [60.00ms]
```

이전(8 pass)보다 1개 더 통과했지만 여전히 틀리다.

### Bug #1: lo 오프셋 누락으로 서브배열 밖 인덱스 생성

현재 식 `Math.floor(Math.random() * 100_000) % (hi - lo)`가 생성하는 범위:

$$\lfloor \text{random} \times 100{,}000 \rfloor \bmod (hi - lo) \in [0,\ hi - lo - 1]$$

유효 범위는 `[lo..hi]`이므로, lo를 더해야 한다. 현재는 `lo` 오프셋이 없다.

| 상황 | 생성 범위 | 유효 범위 | 결과 |
|------|-----------|-----------|------|
| `lo=0, hi=7` | `[0..6]` | `[0..7]` | hi=7 선택 불가 (거의 맞음) |
| `lo=4, hi=7` | `[0..2]` | `[4..7]` | 전부 서브배열 밖 ❌ |
| `lo=0, hi=1` | `[0..0]` | `[0..1]` | 항상 0만 선택 (편향) |

추가 문제: `100_000` 하드코딩은 여전히 남아 있다. `hi - lo`가 `100_000`의 약수가 아니면 모듈로 편향(modulo bias)이 발생한다.

**올바른 식**:

$$\text{pivotIdx} = lo + \lfloor \text{Math.random()} \times (hi - lo + 1) \rfloor$$

`Math.random()` ∈ [0, 1) 이므로 `Math.random() × (hi - lo + 1)` ∈ [0, hi - lo + 1)이고, `Math.floor` 후 [0, hi - lo] ∈ ℤ이며, `lo`를 더하면 `[lo, hi]`다. `hi - lo + 1`개 원소가 각각 $\frac{1}{hi - lo + 1}$ 확률로 균등 선택된다.

```ts
const pivotIdx = lo + Math.floor(Math.random() * (hi - lo + 1));
```

### 잔존 버그 요약

| 번호 | 위치 | 현재 코드 | 수정 코드 |
|------|------|-----------|-----------|
| #1 | 피벗 선택 | `Math.floor(Math.random() * 100_000) % (hi - lo)` | `lo + Math.floor(Math.random() * (hi - lo + 1))` |

---

## [버그 수정] lo 오프셋 추가 — 11 pass / 0 fail

### 변경 내용

이전: `Math.floor(Math.random() * 100_000) % (hi - lo)`  
현재: `(Math.floor(Math.random() * 100_000) % (hi - lo)) + lo`

`lo` 오프셋이 추가되어 생성 범위가 `[0..hi-lo-1]`에서 `[lo..hi-1]`로 이동했다.

### 테스트 결과: 11 pass / 0 fail

```
bun test src/sorting/kthSmallest/kthSmallest.test.ts
 11 pass / 0 fail   [52.00ms]
```

모든 테스트를 통과한다.

### 개선 여지: hi 인덱스 제외 및 모듈로 편향

현재 식이 생성하는 범위를 정식으로 표현하면:

$$\text{pivotIdx} = \left(\lfloor \text{Math.random()} \times 100{,}000 \rfloor \bmod (hi - lo)\right) + lo \in [lo,\ hi - 1]$$

서브배열의 유효 범위는 `[lo..hi]`이므로 마지막 원소 `arr[hi]`가 직접 피벗으로 선택될 수 없다. `hi-lo+1`개 원소 중 한 개가 항상 제외된다.

**정확성 영향**: 없다. 피벗이 항상 `[lo..hi-1]` ⊂ `[lo..hi]` 내에서 선택되므로 파티션 불변식은 유지된다. 파티션 후 `arr[hi]`는 일반 원소로 루프에서 처리된다.

**균등성 영향**: 있다. `arr[hi]`가 최적 피벗일 경우 해당 원소를 선택할 기회가 없으므로 분할이 편향될 수 있다. 또한 `100_000`이 `(hi - lo)`의 배수가 아닌 경우 모듈로 편향(modulo bias)이 발생한다.

**올바른 식** (`[lo..hi]` 균등 분포):

$$\text{pivotIdx} = lo + \lfloor \text{Math.random()} \times (hi - lo + 1) \rfloor$$

`Math.random()` ∈ [0, 1)이고 `(hi - lo + 1)`을 곱하면 [0, hi-lo+1)이 되며, `Math.floor` 후 정수 [0, hi-lo]이고, `lo`를 더하면 [lo, hi]다. 각 인덱스의 선택 확률은 정확히 $\frac{1}{hi - lo + 1}$이다.

현재 구현은 모든 테스트를 통과하며 정확하다. hi 제외와 모듈로 편향은 이론적 불완전성이지 정확성 버그가 아니다.

---

## 4. 요약

| 항목 | 현재 구현 | 개선안 (Quickselect) |
|------|-----------|----------------------|
| 방향성 | 올바름 (정렬 후 인덱싱) | 동일 결과 |
| 정확성 | 11/11 테스트 통과 | 동일 |
| 입력 변형 | in-place 변형 (계약 내 동작) | 동일 (in-place 표준) |
| 평균 복잡도 | $\Theta(N \log N)$ | $\Theta(N)$ |
| 최악 복잡도 | $O(N \log N)$ | $O(N^2)$ (무작위 피벗으로 기대 $\Theta(N)$) |
| 성능 테스트 | 통과 (N=100,000) | 통과 (더 빠름) |

**핵심 메시지**

1. 현재 구현은 반환값이 정확하고 모든 테스트를 통과한다. 제출용으로 기능상 문제는 없다.
2. in-place 변형은 계약 위반이 아니다. `kthSmallest` 테스트는 반환값만 검증하며 입력 보존을 요구하지 않는다. Quickselect에서 in-place 파티션은 표준이다.
3. 최적화 측면에서 전체 정렬($O(N \log N)$)은 불필요한 정보까지 계산한다. **Quickselect**는 Quicksort에서 "한쪽 재귀만 남긴다"는 단 한 가지 변형으로 평균 $O(N)$을 달성하며, 이것이 문제가 의도한 최적해다.
