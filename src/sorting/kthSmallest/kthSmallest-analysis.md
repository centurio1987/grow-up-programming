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

## 4. 요약

| 항목 | 현재 구현 | 개선안 (Quickselect) |
|------|-----------|----------------------|
| 방향성 | 올바름 (정렬 후 인덱싱) | 동일 결과 |
| 정확성 | 11/11 테스트 통과 | 동일 |
| 부작용 | **입력 배열 in-place 변형** | 입력 복사로 제거 |
| 평균 복잡도 | $\Theta(N \log N)$ | $\Theta(N)$ |
| 최악 복잡도 | $O(N \log N)$ | $O(N^2)$ (무작위 피벗으로 기대 $\Theta(N)$) |
| 성능 테스트 | 통과 (N=100,000) | 통과 (더 빠름) |

**핵심 메시지**

1. 현재 구현은 반환값이 정확하고 모든 테스트를 통과한다. 제출용으로 기능상 문제는 없다.
2. 다만 **입력 배열을 변형하는 부작용**이 있으며, 테스트는 커버리지 공백으로 이를 잡지 못한다. `[...A].sort(...)`로 손쉽게 제거할 수 있다.
3. 최적화 측면에서 전체 정렬($O(N \log N)$)은 불필요한 정보까지 계산한다. **Quickselect**는 Quicksort에서 "한쪽 재귀만 남긴다"는 단 한 가지 변형으로 평균 $O(N)$을 달성하며, 이것이 문제가 의도한 최적해다.
