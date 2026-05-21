# minMaxPair 해설

## 성능 목표 예측

| 항목 | 값 |
|------|-----|
| 입력 크기 $n$ | $1 \leq n \leq 10^5$ |
| 값 범위 | 정수, 비교 연산만 사용 |

**naive 선형 탐색의 한계.** 최솟값과 최댓값을 별도로 구하는 가장 단순한 방법:

```
min_val = arr[0]
for i in 1..n-1: if arr[i] < min_val: min_val = arr[i]
max_val = arr[0]
for i in 1..n-1: if arr[i] > max_val: max_val = arr[i]
```

비교 횟수: $(n-1) + (n-1) = 2n - 2$. 시간복잡도는 여전히 $O(n)$이라 "불가능한 속도"는 아니지만, 비교 횟수 기준으로 최적이 아니다. 최솟값과 최댓값 탐색을 각각 독립 스캔으로 처리하기 때문에 원소를 두 번씩 방문한다.

**목표 복잡도와 근거.** 시간복잡도는 $O(n)$으로 동일하지만, **비교 횟수를 $\lfloor 3n/2 \rfloor - 2$로 줄이는 것이 목표**다. 분할 정복으로 두 원소를 한 번의 비교로 "최솟값 후보군"과 "최댓값 후보군"에 동시에 배정할 수 있어, 두 스캔을 하나로 합쳐 약 25%의 비교를 줄인다. 비교 자체가 비싼 연산이거나 비교 횟수가 알고리즘 하한 기준인 경우에 이 최적화가 실질적 의미를 가진다.

**공간 복잡도.** 재귀 스택 $O(\log n)$. 구간 크기가 1 또는 2이면 즉시 반환하므로 깊이가 $\log n$을 넘지 않는다.

---

## 목표 함수

```ts
function minMaxPair(arr: number[]): { min: number; max: number }
```

### 파라미터 표

| 파라미터 | 의미 | 제약 |
|---------|------|------|
| `arr` | 최솟값과 최댓값을 구할 정수 배열 | 길이 $n$, $1 \leq n \leq 10^5$ |

**반환값.** `{ min, max }` — `min`은 배열 전체의 최솟값, `max`는 배열 전체의 최댓값.

### 엣지케이스

1. **`n = 1`** — 원소 하나뿐이므로 `{ min: arr[0], max: arr[0] }` 반환. 비교 횟수 0.
2. **`n = 2`** — 두 원소를 한 번 비교해 더 작은 것이 min, 더 큰 것이 max. 비교 횟수 1.
3. **모든 원소가 같을 때** — `min === max`로 같은 값을 가진 결과 반환. 알고리즘 흐름은 정상이다.
4. **배열이 내림차순 정렬된 경우** — `min = arr[n-1]`, `max = arr[0]`. 분할 정복이 이를 자연스럽게 발견한다.

---

## 핵심 아이디어

### 원형 아이디어와 naive 접근

"배열을 처음부터 끝까지 스캔하면서 현재까지의 min과 max를 갱신한다"는 방법이 가장 직관적이다. 이 접근의 폭발 지점은 비교 횟수가 $2(n-1)$이라는 것이다. 즉, 각 원소를 min용으로 한 번, max용으로 한 번 비교해 총 두 번 비교한다. 원소 수가 클수록 비교 횟수의 비효율이 누적된다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1.** 두 원소 $a$, $b$를 한 번 비교하면 "더 작은 것은 min 후보, 더 큰 것은 max 후보"임을 동시에 알 수 있다. 즉 1번의 비교로 두 가지 정보를 동시에 얻는다.
- **관찰 2.** 배열을 절반으로 나눠 각각의 `(min, max)` 쌍을 재귀적으로 구하면, 병합 단계에서 `min(minL, minR)`과 `max(maxL, maxR)` 비교 2회만으로 전체 답을 얻는다. 좌·우 각각의 최솟값/최댓값이 이미 보장되어 있으므로 다른 비교가 필요 없다.
- **관찰 3.** 점화식 $T(n) = 2T(n/2) + 2$를 풀면 $T(n) = \lfloor 3n/2 \rfloor - 2$가 나온다. 이는 비교 횟수의 이론적 하한과 일치한다(정보이론적으로 최솟값과 최댓값을 동시에 찾으려면 적어도 $\lceil 3n/2 \rceil - 2$번의 비교가 필요함이 증명되어 있다).

### 관찰을 형식화: 상태/구조 정의

재귀 함수 `solve(arr, lo, hi)`는 다음을 반환한다:

$$\text{solve}(arr, lo, hi) = \left( \min_{lo \leq i \leq hi} arr[i],\; \max_{lo \leq i \leq hi} arr[i] \right)$$

이 형태여야 하는 이유: 병합 단계에서 "두 (min, max) 쌍을 합쳐 전체 (min, max)를 얻는다"는 조합이 $O(1)$ 비교만으로 가능하기 때문이다. `(min, max)` 쌍을 한 단위로 전파함으로써, 좌·우 절반의 정보를 독립적으로 구축한 뒤 최소한의 비교로 합칠 수 있다.

**비교 횟수 점화식 유도:**

- 기저 $T(1) = 0$ (비교 없음), $T(2) = 1$ (한 번 비교).
- 재귀: $T(n) = 2T(n/2) + 2$.
- 마스터 정리 또는 전개로 해결:

$$T(n) = 2T(n/2) + 2 = 4T(n/4) + 2 + 2 = \cdots = n \cdot T(1) + 2(\log_2 n - 1 \text{회 병합})$$

보다 정밀하게: $T(n) = 3n/2 - 2$ (짝수 $n$ 기준). 홀수 $n$이면 $T(n) = \lceil 3n/2 \rceil - 2$.

### 점화식 또는 핵심 연산

**병합 단계의 핵심 연산** — 좌·우 결과 $(\text{minL}, \text{maxL})$, $(\text{minR}, \text{maxR})$이 주어졌을 때:

$$\text{result.min} = \min(\text{minL}, \text{minR}), \quad \text{result.max} = \max(\text{maxL}, \text{maxR})$$

이 두 비교가 병합의 전부다. 각 항의 의미:

- $\min(\text{minL}, \text{minR})$: 좌측 절반과 우측 절반의 각 최솟값 중 더 작은 것이 전체 최솟값. 좌·우 각각 내부에서 이미 최솟값이 확정되어 있으므로 다른 원소와 비교할 필요가 없다.
- $\max(\text{maxL}, \text{maxR})$: 마찬가지로 두 최댓값 중 더 큰 것이 전체 최댓값.

### 정당성 — 왜 이것이 옳은가

**귀납적 정당성.** 구간 크기 $k$에 대한 귀납법:

- 기저: $k = 1$이면 `arr[lo]`가 자명하게 최솟값이자 최댓값. $k = 2$이면 한 번의 비교로 두 원소 중 min, max가 결정된다.
- 귀납: 크기 $< k$인 구간에서 `solve`가 올바른 `(min, max)`를 반환한다고 가정한다. 크기 $k$인 구간에서 재귀 호출로 좌·우 각각의 올바른 `(minL, maxL)`, `(minR, maxR)`을 얻는다(귀납 가정). 병합 단계의 두 비교가 전체 min, max를 정확히 결정한다(관찰 2).

**비교 횟수가 최적인 이유.** 최솟값을 찾으려면 $n-1$번의 비교가 필요하다(각 원소가 적어도 한 번씩 "졌다"는 증거 필요). 최댓값도 마찬가지다. 두 정보를 완전히 독립으로 구하면 $2(n-1)$회지만, 한 비교의 결과가 두 문제에 동시에 기여하면 절감할 수 있다. 분할 정복에서 기저 $T(2) = 1$이 이를 실현한다.

**까다로운 케이스.** `n`이 홀수이면 분할 시 한 쪽이 한 원소 더 많다. 예를 들어 $n = 5$이면 왼쪽 $[0, 2]$, 오른쪽 $[3, 4]$. 각각 재귀로 처리되어 비교 횟수는 $T(3) + T(2) + 2$. 홀수 $n$에서도 $\lceil 3n/2 \rceil - 2$를 달성한다.

### 구현 디테일과 최적화

- **기저 케이스 2가지 명시**: `lo == hi` (원소 1개)와 `lo + 1 == hi` (원소 2개)를 별도로 처리해야 한다. 2개짜리 기저를 처리하지 않으면 `mid = lo`가 되어 재귀가 종료되지 않는다.
- **반복문 버전**: 재귀 대신 반복문으로 원소를 두 개씩 묶어 처리할 수 있다. `n`이 홀수이면 첫 원소를 초기 min, max로 사용하고 나머지를 쌍으로 처리한다. 이 방식도 동일한 비교 횟수를 달성하면서 재귀 오버헤드를 피할 수 있다.
- **빈 배열 처리**: $n \geq 1$ 제약이 있으므로 빈 배열은 고려하지 않아도 되지만, 방어적으로 처리하는 것이 좋다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
function minMaxPair(arr):
    return solve(arr, 0, |arr| - 1)

function solve(arr, lo, hi):
    // 불변식 진입: lo <= hi

    // 기저 1: 원소 1개 — 비교 0회
    if lo == hi:
        return { min: arr[lo], max: arr[lo] }

    // 기저 2: 원소 2개 — 비교 1회
    if lo + 1 == hi:
        if arr[lo] <= arr[hi]:
            return { min: arr[lo], max: arr[hi] }
        else:
            return { min: arr[hi], max: arr[lo] }

    mid = (lo + hi) / 2
    left  = solve(arr, lo, mid)        // 귀납: arr[lo..mid]의 정확한 (min, max)
    right = solve(arr, mid+1, hi)      // 귀납: arr[mid+1..hi]의 정확한 (min, max)

    // 병합: 비교 2회
    // 불변식: 아래 결과는 arr[lo..hi] 전체의 정확한 min, max
    return {
        min: min(left.min, right.min),
        max: max(left.max, right.max)
    }
```

**핵심 불변식:** `solve(arr, lo, hi)`가 반환하는 `{ min, max }`는 `arr[lo..hi]` 구간의 정확한 최솟값과 최댓값이며, 사용된 비교 횟수는 $T(hi - lo + 1) = \lfloor 3(hi - lo + 1)/2 \rfloor - 2$를 넘지 않는다.

### Activity Diagram

```mermaid
flowchart TD
    A([시작: solve lo hi]) --> B{lo == hi?}
    B -->|Yes, 원소 1개 — 비교 0회| C["return { min: arr[lo], max: arr[lo] }"]
    B -->|No| D{lo + 1 == hi?}
    D -->|Yes, 원소 2개 — 비교 1회| E{"arr[lo] <= arr[hi]?"}
    E -->|Yes| F["return { min: arr[lo], max: arr[hi] }"]
    E -->|No| G["return { min: arr[hi], max: arr[lo] }"]
    D -->|No, 원소 3개 이상| H["mid = (lo+hi)/2"]
    H --> I["left = solve(arr, lo, mid)"]
    H --> J["right = solve(arr, mid+1, hi)"]
    I --> K["병합: min(left.min, right.min), max(left.max, right.max) — 비교 2회"]
    J --> K
    K --> L["return { min, max }"]
```
