# Mo's Algorithm 해설

## 성능 목표 예측

| 제약 항목 | 값 |
|-----------|-----|
| 배열 크기 $n$ | $\leq 10^4$ |
| 질의 수 $q$ | $\leq 10^4$ |
| 원소 값 범위 | $A[i] \in \mathbb{Z}$ |
| 인덱스 | 0-기반 폐구간 $[l, r]$ |

**naive 접근의 문제점**: 각 질의 $[l_i, r_i]$마다 독립적으로 구간을 순회하여 distinct count를 계산하면 질의당 $O(n)$이다. $q = 10^4$개의 질의에 대해 총 $O(qn) = O(10^8)$으로 시간 초과 위험이 높다. 단순한 접두사 합으로는 "distinct count"를 미리 계산할 수 없다. 두 접두사 합의 차가 겹치는 원소를 제거하는 방법이 없기 때문이다.

**목표 복잡도**: $O((n + q)\sqrt{n})$. $n = q = 10^4$이면 $(10^4 + 10^4) \times 100 = 2 \times 10^6$으로 충분히 빠르다.

**공간 복잡도**: $O(n + q)$. 빈도 배열 `freq`와 정렬된 질의 배열이 필요하다.

---

## 목표 함수

```ts
function mosAlgorithm(
  arr: number[],
  queries: [number, number][],
): number[]
```

| 파라미터 | 의미 | 제약 |
|---------|------|------|
| `arr` | 정수 배열 | $1 \leq n \leq 10^4$, $A[i] \in \mathbb{Z}$ |
| `queries` | $[l, r]$ 구간 질의 배열 | $q \leq 10^4$, $0 \leq l \leq r < n$ |

**반환값**: 각 질의 $[l_i, r_i]$에 대해 $\{A[k] \mid l_i \leq k \leq r_i\}$의 원소 종류 수를 담은 배열. 반환 배열은 입력 `queries`의 원래 순서를 따른다.

**엣지케이스**:
1. `l == r` → distinct count는 항상 1.
2. 배열의 모든 원소가 동일한 경우 → 모든 질의의 답이 1.
3. `queries`가 빈 배열인 경우 → 빈 배열 반환.
4. 동일한 질의 구간이 여러 번 등장하는 경우 → 같은 답이 여러 번 반환되며 정렬 후 포인터를 이동하지 않아 효율적이다.
5. 모든 원소가 서로 다른 경우 → distinct count는 $r - l + 1$이다.

---

## 핵심 아이디어

### 원형 아이디어와 naive 접근

두 포인터 `curL`, `curR`로 현재 처리 중인 구간을 유지하고, 다음 질의 구간으로 포인터를 하나씩 이동하면서 distinct count를 유지하는 방법을 생각해 볼 수 있다. 원소를 추가할 때 `freq[x]++`, `freq[x] == 1`이면 `distinctCount++`이고, 제거할 때 `freq[x]--`, `freq[x] == 0`이면 `distinctCount--`로 관리하면 이동당 $O(1)$이다.

**폭발 지점**: 질의 순서가 임의로 주어지면 포인터 이동 총량이 최악 $O(qn)$에 달한다. 예를 들어 질의들이 $[0, n-1], [0, 0], [0, n-1], [0, 0], \ldots$ 패턴이면 매번 $n$번씩 이동한다. 질의를 적절히 정렬하면 이동 총량을 줄일 수 있지 않을까?

### 어떤 관찰이 돌파구가 되는가

- **관찰 1**: $n$을 블록 크기 $B = \lfloor\sqrt{n}\rfloor$으로 나누면 $\lceil n/B \rceil \approx \sqrt{n}$개의 블록이 생긴다. $l$이 같은 블록에 속하는 질의들끼리는 $r$만 바뀌므로, 같은 블록 내에서 $r$을 단조 증가 순으로 정렬하면 `curR`의 총 이동 횟수가 블록당 $O(n)$이다.
- **관찰 2**: 다른 블록으로 이동할 때 `curL`의 이동량은 최대 $B$이다. 블록이 $\sqrt{n}$개이고 질의가 $q$개이면 `curL`의 총 이동량은 $O(B \cdot q) = O(\sqrt{n} \cdot q)$이다.
- **관찰 3**: 두 이동량을 합치면 $O(n\sqrt{n} + q\sqrt{n}) = O((n+q)\sqrt{n})$이다. 이는 $O(qn)$에 비해 $\sqrt{n}$배 빠르다.

### 관찰을 형식화: 상태/구조 정의

블록 크기 $B = \lfloor\sqrt{n}\rfloor$로 정한다. 질의를 다음 기준으로 정렬한다:

$$\text{key}(l, r) = \left(\left\lfloor \frac{l}{B} \right\rfloor, r\right)$$

즉, 1차 키는 $l$이 속한 블록 번호, 2차 키는 $r$의 값이다.

이 형태여야 하는 근거: 같은 블록 내에서 $r$을 단조 순서로 방문하면 `curR`이 역방향으로 이동하지 않는다. 블록이 바뀔 때만 `curL`이 최대 $2B$만큼 이동한다. 이 두 이동을 독립적으로 분석하면 전체 복잡도가 $O((n+q)\sqrt{n})$이다.

**상태 변수**:
- `curL`, `curR`: 현재 활성 구간 $[\text{curL}, \text{curR}]$
- `freq[x]`: 현재 구간에서 원소 $x$의 등장 횟수
- `distinctCount`: 현재 구간의 distinct 원소 수

### 점화식 또는 핵심 연산

**원소 추가** (`add(x)`):
$$\text{freq}[x] \mathrel{+}= 1 \quad \Rightarrow \quad (\text{if } \text{freq}[x] = 1) \;\; \text{distinctCount} \mathrel{+}= 1$$

**원소 제거** (`remove(x)`):
$$\text{freq}[x] \mathrel{-}= 1 \quad \Rightarrow \quad (\text{if } \text{freq}[x] = 0) \;\; \text{distinctCount} \mathrel{-}= 1$$

**포인터 이동 비용 분석**:

- `curR` 이동: 같은 블록 내에서 $r$이 오름차순이므로 블록당 최대 $n$번. 블록 수 $\lceil n/B \rceil \approx \sqrt{n}$이므로 총 $O(n\sqrt{n})$.
- `curL` 이동: 블록이 바뀔 때마다 최대 $2B$번. 블록 전환 횟수 $\leq q$이므로 총 $O(qB) = O(q\sqrt{n})$.
- 합계: $O((n+q)\sqrt{n})$.

### 정당성 — 왜 이것이 옳은가

**결과 정확성**: 포인터 이동은 `add`/`remove` 함수를 통해 `distinctCount`를 정확히 유지한다. `add(x)` 후 `freq[x] == 1`이면 새 원소가 처음 등장한 것이므로 `distinctCount++`가 맞고, `remove(x)` 후 `freq[x] == 0`이면 원소가 구간에서 사라진 것이므로 `distinctCount--`가 맞다. 인덱스 원상복구 배열 `origIdx`를 통해 결과를 원래 질의 순서로 저장한다.

**불변식**: 어떤 시점에서도 `curL ≤ curR`이고, `freq[x]`는 현재 구간 $[curL, curR]$에서 $x$의 등장 횟수이며, `distinctCount`는 현재 구간의 distinct 원소 수이다.

**까다로운 케이스**: 초기 상태를 `curL = 0, curR = -1`로 설정하면 구간이 비어있는 상태에서 시작할 수 있다. 첫 번째 질의가 `[l, r]`이면 `curR`을 $r$까지 오른쪽으로 확장한 뒤 `curL`을 $l$로 맞춘다. `curR < curL`인 상태가 중간에 발생하지 않도록 확장 후 축소 순서를 지켜야 한다.

### 구현 디테일과 최적화

**블록 크기 최적화**: 이론적으로는 $B = \lfloor\sqrt{n}\rfloor$가 최적이지만, $B = \max(1, \lfloor\sqrt{n}\rfloor)$로 처리하여 $n = 0$ 또는 $n = 1$의 경계 케이스를 방지한다.

**홀짝 블록 r 정렬 반전**: 짝수 블록은 $r$ 오름차순, 홀수 블록은 $r$ 내림차순으로 정렬하면 블록 전환 시 `curR`의 역방향 이동량이 줄어 상수 인자가 작아진다.

**`freq` 배열**: 원소 값이 넓은 범위($\mathbb{Z}$)를 가질 수 있으므로 직접 배열 대신 `Map<number, number>`을 사용하거나, 좌표 압축을 거쳐 배열로 관리한다.

**함정**: 질의 재정렬 후 결과를 저장할 때 원래 인덱스(`origIdx`)를 반드시 기억해야 한다. 정렬 순서로 `answers` 배열을 채우면 반환 순서가 뒤바뀐다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
mosAlgorithm(arr, queries):
    n = arr.length
    B = max(1, floor(sqrt(n)))        // 블록 크기

    // 각 질의에 원래 인덱스 부여
    indexed = [(l, r, i) for i, [l,r] in enumerate(queries)]

    // 1차: 블록 번호(floor(l/B)), 2차: r 오름차순 정렬
    sort indexed by (floor(l/B), r)

    freq = {}                          // 원소 → 현재 구간 내 등장 횟수
    distinctCount = 0                  // 불변식: 현재 [curL, curR]의 distinct count
    curL = 0, curR = -1               // 초기: 빈 구간
    answers = array of size q

    for (l, r, origIdx) in indexed:
        // 구간 확장 (원소 추가)
        while curR < r: curR++; add(arr[curR])
        while curL > l: curL--; add(arr[curL])
        // 구간 축소 (원소 제거)
        while curR > r: remove(arr[curR]); curR--
        while curL < l: remove(arr[curL]); curL++

        answers[origIdx] = distinctCount  // 원래 질의 인덱스에 저장

    return answers

add(x):
    freq[x] = (freq[x] ?? 0) + 1
    if freq[x] == 1: distinctCount++  // 처음 등장 → distinct 증가

remove(x):
    freq[x]--
    if freq[x] == 0: distinctCount--  // 사라짐 → distinct 감소
```

### Activity Diagram

```mermaid
flowchart TD
    A([mosAlgorithm]) --> B["B=sqrt(n), 질의에 origIdx 부여"]
    B --> C["정렬: (블록 번호, r) 기준"]
    C --> D["curL=0, curR=-1, distinctCount=0"]
    D --> E{다음 정렬된 질의 (l,r,origIdx)?}
    E -- 없음 --> F([return answers])
    E -- 있음 --> G["목표 구간 (l, r) 확인"]
    G --> H{curR < r?}
    H -- Yes → 오른쪽 확장 --> I["curR++, add(arr[curR])"]
    I --> H
    H -- No --> J{curL > l?}
    J -- Yes → 왼쪽 확장 --> K["curL--, add(arr[curL])"]
    K --> J
    J -- No --> L{curR > r?}
    L -- Yes → 오른쪽 축소 --> M["remove(arr[curR]), curR--"]
    M --> L
    L -- No --> N{curL < l?}
    N -- Yes → 왼쪽 축소 --> O["remove(arr[curL]), curL++"]
    O --> N
    N -- No → 구간 일치 --> P["answers[origIdx] = distinctCount"]
    P --> E
```

**핵심 불변식**: 어떤 시점에서도 `freq[x]`는 현재 구간 $[\text{curL}, \text{curR}]$에서 $x$의 등장 횟수이며, `distinctCount`는 $\{A[k] \mid \text{curL} \leq k \leq \text{curR}\}$의 크기이다. 포인터 이동 총량은 질의 정렬에 의해 $O((n+q)\sqrt{n})$으로 제한된다.
