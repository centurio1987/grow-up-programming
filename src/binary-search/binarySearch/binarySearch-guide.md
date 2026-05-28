# Binary Search — 해설

## 성능 목표 예측

| 항목 | 값 |
|------|-----|
| 입력 크기 | $N \leq 10^6$ |
| 원소 값 범위 | $-2^{31} \leq A[i], \text{target} \leq 2^{31} - 1$ |
| 목표 시간 복잡도 | $O(\log N)$ |
| 목표 공간 복잡도 | $O(1)$ |

**naive 접근의 한계 분석**: 가장 단순한 접근은 배열을 처음부터 끝까지 순회하며 `A[i] === target`인지 확인하는 선형 탐색이다. 시간복잡도는 $O(N)$이고, $N = 10^6$이면 최악의 경우 $10^6$회 비교가 필요하다. 이는 제한 시간 내에 통과 가능한 수준이지만, **배열이 정렬되어 있다는 정보를 전혀 활용하지 않는다**는 점에서 낭비다.

배열의 정렬(단조성)이라는 부가 정보를 활용하면, 매 단계마다 탐색 구간을 절반으로 줄일 수 있다. 이 경우 비교 횟수는 $\log_2(10^6) \approx 20$회로 줄어들어, $N$이 $10^9$까지 커져도 30회 이내에 끝난다.

**공간 복잡도**: 포인터 `lo`, `hi`, `mid` 세 변수만 사용하므로 $O(1)$이다. 재귀로 구현하면 호출 스택 $O(\log N)$이 추가되므로, 반복문 구현이 공간 측면에서 유리하다.

---

## 목표 함수

```typescript
function binarySearch(A: number[], target: number): number
```

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `A` | 오름차순 정렬된 정수 배열 | 길이 $0 \leq N \leq 10^6$, $A[i] \leq A[i+1]$ |
| `target` | 찾을 목표값 | $-2^{31} \leq \text{target} \leq 2^{31} - 1$ |
| **반환** | `A[i] === target`을 만족하는 인덱스 `i`; 없으면 `-1` | — |

**엣지케이스**:

| 케이스 | 입력 예시 | 기대 출력 |
|--------|-----------|-----------|
| 빈 배열 | `A = []`, `target = 5` | `-1` |
| 단일 원소, 일치 | `A = [7]`, `target = 7` | `0` |
| 단일 원소, 불일치 | `A = [7]`, `target = 3` | `-1` |
| 경계값: 배열 첫 원소 | `A = [1,2,3,4,5]`, `target = 1` | `0` |
| 경계값: 배열 마지막 원소 | `A = [1,2,3,4,5]`, `target = 5` | `4` |
| 존재하지 않는 값 | `A = [1,3,5]`, `target = 2` | `-1` |
| 최대 입력 크기 | $N = 10^6$, target이 중간쯤 | 정상 인덱스 반환 |

---

## 핵심 아이디어

**핵심 아이디어**: "정렬된 배열에서는 중간을 한 번 확인하는 것만으로 탐색 범위를 절반씩 줄일 수 있다."

배열이 정렬되어 있다는 사실은 강력한 단서다. 임의의 위치 중간값과 목표값을 비교하면, 목표값이 왼쪽 절반에 있는지 오른쪽 절반에 있는지를 즉시 알 수 있다. 이 과정을 반복하면 $N = 10^6$인 배열에서도 20번 이내의 비교로 답을 찾는다.

**풀이 구조**
1. 탐색 구간을 `[lo, hi]`로 초기화하고, 불변식 "target이 있다면 반드시 이 구간 안에 있다"를 유지한다.
2. 중간점 `mid = lo + ⌊(hi - lo) / 2⌋`를 계산한다.
3. `A[mid]`와 target을 비교해 일치하면 반환, target이 크면 `lo = mid + 1`, 작으면 `hi = mid - 1`로 구간을 좁힌다.
4. `lo > hi`가 되면 target이 없으므로 `-1`을 반환한다.

**조건**: 배열이 오름차순으로 정렬되어 있어야 한다 (단조성 보장).

**대표 예시**: `A = [1, 3, 5, 7, 9]`, `target = 7` 탐색
구간 `[0, 4]` → `mid = 2`, `A[2] = 5 < 7` → `lo = 3`. 구간 `[3, 4]` → `mid = 3`, `A[3] = 7 == 7` → 인덱스 3 반환.
단 2번의 비교로 탐색 완료.

**언제 쓰나**
"정렬된 배열에서 값이나 경계 인덱스를 찾아라"는 유형에 즉시 적용한다. 이진 탐색의 변형인 lower_bound, upper_bound, 회전 배열 탐색도 모두 이 핵심 구조를 공유한다.

---

### 원형 아이디어와 naive 접근

문제를 가장 단순하게 풀면: 인덱스 $i = 0$부터 $N-1$까지 순서대로 `A[i] === target`인지 확인하고, 처음 일치하는 $i$를 반환한다.

```
for i from 0 to N-1:
    if A[i] == target:
        return i
return -1
```

이 접근의 문제는 시간복잡도 $O(N)$이다. 더 심각한 것은 **배열이 정렬되어 있다는 정보를 전혀 사용하지 않는다**는 점이다. 예컨대 `A[i] > target`이 되는 순간 이미 target은 배열에 없음을 알 수 있는데, naive 접근은 이 사실을 무시하고 계속 순회한다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1 (단조성)**: 배열이 오름차순으로 정렬되어 있으므로, 임의의 인덱스 $m$에 대해 `A[m] < target`이면 $A[0], A[1], \ldots, A[m]$ 중 어느 것도 target일 수 없다. 반대로 `A[m] > target`이면 $A[m], A[m+1], \ldots, A[N-1]$ 중 어느 것도 target일 수 없다.
- **관찰 2 (절반 제거)**: 위 관찰에 따라 중간점 $m$을 하나 선택하면, 비교 한 번으로 탐색 대상 절반을 제거할 수 있다.
- **관찰 3 (로그 수렴)**: 매 단계마다 탐색 구간이 절반이 되므로, $N$개 원소 배열에서 최대 $\lceil \log_2 N \rceil$번 비교로 결론에 이른다.

### 관찰을 형식화: 상태/구조 정의

탐색 구간을 닫힌 구간 $[\text{lo}, \text{hi}]$로 정의한다. 루프 전체에 걸쳐 다음 불변식이 유지된다:

> **불변식**: target이 배열 안에 존재한다면, 반드시 $A[\text{lo} \ldots \text{hi}]$ 구간 안에 있다.

초기에 $\text{lo} = 0$, $\text{hi} = N - 1$로 설정하면 불변식이 자명하게 성립한다. `lo > hi`가 되는 순간 탐색 가능한 구간이 없어지므로, target이 배열에 없음이 확정된다.

*왜 반열린 구간 $[\text{lo}, \text{hi})$를 쓰지 않는가*: 닫힌 구간 표현이 경계 조건(`lo == hi`인 단일 원소 구간)을 자연스럽게 처리하며, `hi = mid - 1` 갱신 시 오프바이원(off-by-one) 오류가 줄어든다.

### 점화식 또는 핵심 연산

각 반복에서 중간점을 계산한다:

$$\text{mid} = \text{lo} + \left\lfloor \frac{\text{hi} - \text{lo}}{2} \right\rfloor$$

- $(\text{lo} + \text{hi}) / 2$ 대신 위 식을 쓰는 이유: 두 큰 정수의 합이 오버플로를 일으킬 수 있기 때문이다.

비교 결과에 따른 분기:

$$\text{hi}' = \begin{cases}
  \text{mid} - 1 & A[\text{mid}] > \text{target} \quad \text{(오른쪽 제거)} \\
  \text{hi} & A[\text{mid}] = \text{target} \quad \text{(즉시 반환)} \\
  \text{hi} & A[\text{mid}] < \text{target} \quad \text{(좌측 포인터 이동)}
\end{cases}$$

$$\text{lo}' = \begin{cases}
  \text{lo} & A[\text{mid}] > \text{target} \quad \text{(우측 포인터 유지)} \\
  \text{lo} & A[\text{mid}] = \text{target} \quad \text{(즉시 반환)} \\
  \text{mid} + 1 & A[\text{mid}] < \text{target} \quad \text{(왼쪽 제거)}
\end{cases}$$

각 항의 의미:
- $A[\text{mid}] > \text{target}$: 단조성에 의해 $[\text{mid}, \text{hi}]$에 target이 없으므로 `hi = mid - 1`.
- $A[\text{mid}] < \text{target}$: 단조성에 의해 $[\text{lo}, \text{mid}]$에 target이 없으므로 `lo = mid + 1`.
- `mid + 1`, `mid - 1`을 쓰는 것은 `A[mid] ≠ target`이 확인된 후이므로 `mid` 자체를 구간에서 제외해도 안전하다.

### 정당성 — 왜 이것이 옳은가

**귀납적 정당화**: 매 반복 시작 시 불변식 "target이 존재하면 $A[\text{lo} \ldots \text{hi}]$ 안에 있다"가 성립한다고 가정한다. 분기 후에도 이 불변식이 유지됨을 보인다.
- `A[mid] < target`이면 $A[0 \ldots \text{mid}]$의 모든 원소가 target보다 작으므로, `lo = mid + 1`로 갱신해도 target은 여전히 $A[\text{lo}' \ldots \text{hi}]$ 안에 있다.
- `A[mid] > target`인 경우도 대칭적으로 성립한다.

**종료 보장**: 매 반복마다 구간 크기 $\text{hi} - \text{lo}$가 적어도 1 감소한다(정확히는 절반 이하로 줄어든다). 따라서 유한 번 반복 후 반드시 `lo > hi`가 된다.

**까다로운 케이스**: `lo == hi`인 단일 원소 구간에서도 루프 조건 `lo <= hi`가 참이므로 정상적으로 비교가 수행된다. 이 경우 `A[mid] == target`이면 `mid`를 반환하고, 아니면 `lo > hi`가 되어 종료한다.

### 구현 디테일과 최적화

- **오버플로 방지**: `mid = Math.floor((lo + hi) / 2)`는 lo와 hi가 모두 $2^{30}$ 이상이면 합산 시 32비트 정수 오버플로가 발생한다. `lo + Math.floor((hi - lo) / 2)`를 쓰면 안전하다.
- **반복문 vs 재귀**: 재귀 구현은 코드가 간결하지만 호출 스택 $O(\log N)$ 공간이 추가된다. $N = 10^6$이면 스택 깊이 약 20으로 문제없지만, 공간 제약이 엄격한 환경에서는 반복문이 유리하다.
- **흔한 함정**: `while (lo < hi)` + `hi = mid`를 쓰는 변형도 있는데, 이 경우 `mid = lo + Math.floor((hi - lo) / 2)`를 반드시 내림 계산해야 한다. `hi - lo`가 1일 때 `mid = lo`가 되므로, `lo = mid + 1`을 하지 않으면 `lo == hi == mid`인 상태에서 무한 루프가 발생한다.
- **중복 원소**: 문제에서 중복이 허용된다면 "leftmost index" 또는 "rightmost index"를 반환하는 변형이 필요하다. 이 구현은 "임의의 일치 인덱스"를 반환한다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
function binarySearch(A, target):
    lo ← 0                              // 불변식: target은 A[lo..hi] 안에 존재 (있다면)
    hi ← length(A) - 1                 // 초기 구간은 전체 배열

    while lo <= hi:                     // 탐색 구간이 비어있지 않은 동안
        mid ← lo + floor((hi - lo) / 2) // 오버플로 방지; lo <= mid <= hi 보장

        if A[mid] == target:
            return mid                  // 발견: 불변식이 보장한 위치에서 찾음

        else if A[mid] < target:
            lo ← mid + 1               // A[mid] ≠ target, 단조성에 의해 [lo, mid] 제거
                                        // 새 불변식: target은 A[lo'..hi] 안에 존재

        else:                           // A[mid] > target
            hi ← mid - 1               // A[mid] ≠ target, 단조성에 의해 [mid, hi] 제거
                                        // 새 불변식: target은 A[lo..hi'] 안에 존재

    return -1                           // lo > hi: 탐색 공간이 소진됨 → 존재하지 않음
```

**핵심 불변식**: target이 A 안에 존재한다면, 루프의 모든 시점에서 반드시 $A[\text{lo} \ldots \text{hi}]$ 구간 안에 있다.

### Activity Diagram

```mermaid
flowchart TD
    A([시작]) --> B["lo = 0, hi = N-1\n불변식: target ∈ A[lo..hi] (if exists)"]
    B --> C{lo <= hi?}
    C -- No --> G([-1 반환\ntarget 없음])
    C -- Yes --> D["mid = lo + ⌊(hi-lo)/2⌋\n오버플로 방지"]
    D --> E{A[mid] vs target}
    E -- "A[mid] == target" --> F([mid 반환])
    E -- "A[mid] < target\n왼쪽 전체 제거" --> H["lo = mid + 1\n불변식 유지"]
    E -- "A[mid] > target\n오른쪽 전체 제거" --> I["hi = mid - 1\n불변식 유지"]
    H --> C
    I --> C
```

**핵심 불변식**: $\text{target} \in A \Rightarrow \text{target} \in A[\text{lo} \ldots \text{hi}]$
