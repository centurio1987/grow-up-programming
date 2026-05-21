# Segment Tree with Lazy Propagation 해설

## 성능 목표 예측

| 제약 항목 | 값 |
|-----------|-----|
| 배열 크기 $n$ | $\leq 10^5$ |
| 질의 수 $q$ | $\leq 10^5$ |
| 인덱스 | 0-기반: $0 \leq l \leq r < n$ |

**naive 접근의 문제점**: 구간 가산과 구간 합 조회를 모두 지원하는 가장 단순한 방법은 원본 배열을 직접 유지하는 것이다.

- 방법 A: 구간 가산 시 $A[l \ldots r]$ 전체를 갱신 → $O(n)$, 구간 합 조회도 $O(n)$. $q$회 혼합 질의 시 $O(qn) = O(10^{10})$ → 불가능.
- 방법 B: 접두사 합 배열을 유지 → 조회 $O(1)$이지만, 구간 가산 후 접두사 합 배열 재계산 $O(n)$ → 동일하게 $O(qn)$.
- 방법 C: 일반 세그먼트 트리(lazy 없음)로 구간 가산 → 리프까지 내려가며 모두 갱신 → 최악 $O(n)$.

**목표 복잡도**: `rangeAdd`와 `rangeSum` 모두 $O(\log n)$. $q \log n \approx 10^5 \times 17 \approx 1.7 \times 10^6$으로 충분하다.

**공간 복잡도**: $O(n)$. 세그먼트 트리 노드 수 $\leq 4n$이고, 각 노드에 `sum`과 `lazy` 두 값을 저장한다.

---

## 목표 함수

```ts
class SegmentTreeLazy {
  constructor(n: number): SegmentTreeLazy
  rangeAdd(l: number, r: number, val: number): void
  rangeSum(l: number, r: number): number
}
```

| 파라미터 | 의미 | 제약 |
|---------|------|------|
| `n` | 배열 크기 | $1 \leq n \leq 10^5$ |
| `l`, `r` | 구간 시작·끝 (0-기반) | $0 \leq l \leq r < n$ |
| `val` | 더할 값 | $\text{val} \in \mathbb{Z}$ (음수 포함) |

**반환값**: `rangeSum(l, r)`은 $\sum_{i=l}^{r} A[i]$를 반환한다.

**엣지케이스**:
1. `rangeAdd(0, n-1, val)` → 전체 구간에 가산. 루트 노드만 방문하여 $O(1)$.
2. `rangeSum(i, i)` → 단일 원소의 현재 값.
3. `val`이 음수인 경우 → 구간 감산과 동일. 지원된다.
4. `rangeAdd` 후 즉시 `rangeSum` → lazy가 올바르게 반영되어야 한다.
5. `rangeSum`만 반복 → 갱신 없이 조회만 하면 lazy 전파 없이도 루트 `sum`을 재사용한다.

---

## 핵심 아이디어

### 원형 아이디어와 naive 접근

일반 세그먼트 트리는 각 노드가 담당 구간의 합을 저장하며, 점 갱신과 구간 합 조회를 $O(\log n)$에 처리한다. 하지만 구간 $[l, r]$에 값을 더하는 "구간 갱신"을 처리하려면 해당 구간의 모든 리프를 업데이트하고 그 조상들을 다시 계산해야 한다. 최악의 경우 $O(n)$개의 리프를 방문한다.

**폭발 지점**: 구간 갱신이 리프까지 즉시 전파되면 $O(n)$이 된다. "나중에 전파하면 어떨까?"라는 아이디어가 출발점이다. 전파를 미루면, 노드가 담당 구간 전체에 동일한 값이 더해진다는 정보를 기록해 두기만 하면 된다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1**: 세그먼트 트리에서 구간 갱신 시, 질의 구간에 완전히 포함되는 노드의 담당 구간 전체에 동일한 값 $v$가 더해진다. 이 노드의 합을 즉시 $v \times (\text{구간 길이})$만큼 증가시키고 자식에게는 "나중에 $v$를 더해야 한다"는 정보만 남겨두면 $O(\log n)$개의 노드만 방문한다.
- **관찰 2**: 이 "나중에 전파할 값"을 `lazy[node]`에 저장하면 된다. 자식 노드를 실제로 방문할 때 `lazy`를 전파(`pushDown`)하면 정확성이 유지된다.
- **관찰 3**: 조회 시 노드 구간이 질의 구간에 완전히 포함되면 `sum[node]`를 즉시 반환할 수 있다. 이를 위해 `sum[node]`에는 `lazy`가 이미 반영된 값이 있어야 한다.

### 관찰을 형식화: 상태/구조 정의

각 노드 $v$는 담당 구간 $[lo, hi]$에 대해 다음 두 값을 유지한다:

$$\text{sum}[v] = \sum_{i=lo}^{hi} A[i], \quad \text{lazy}[v] = \text{아직 자식에게 전파되지 않은 구간 가산 값}$$

불변식:
$$\text{sum}[v] \text{에는 } \text{lazy}[v] \text{가 이미 반영되어 있다}$$
$$\text{lazy}[\text{자식}] \text{에는 } \text{lazy}[v] \text{가 전파되지 않은 상태이다}$$

이 형태여야 하는 근거: `rangeSum` 조회 시 완전 포함 노드에서 즉시 값을 반환하려면 `sum[v]`가 항상 최신 합이어야 한다. `lazy[v]`는 이미 `sum[v]`에 반영되었지만 자식에게는 아직 전파되지 않은 "미전달 업데이트"를 나타낸다.

### 점화식 또는 핵심 연산

**apply(v, lo, hi, val)**: 노드 $v$의 담당 구간 전체에 $\text{val}$을 더한다.
$$\text{sum}[v] \mathrel{+}= \text{val} \times (hi - lo + 1), \quad \text{lazy}[v] \mathrel{+}= \text{val}$$

**pushDown(v, lo, hi)**: lazy를 자식에게 전파한다.
$$\text{mid} = \left\lfloor\frac{lo + hi}{2}\right\rfloor$$
$$\text{apply}(\text{left}(v), lo, \text{mid}, \text{lazy}[v])$$
$$\text{apply}(\text{right}(v), \text{mid}+1, hi, \text{lazy}[v])$$
$$\text{lazy}[v] \leftarrow 0$$

**rangeAdd(v, lo, hi, l, r, val)**: 재귀적 구간 갱신.
$$\begin{cases}
\text{return} & \text{if } r < lo \text{ or } hi < l \quad (\text{교차 없음}) \\
\text{apply}(v, lo, hi, \text{val}) & \text{if } l \leq lo \text{ and } hi \leq r \quad (\text{완전 포함}) \\
\text{pushDown}(v, lo, hi), \; \text{재귀 후 } \text{sum}[v] \mathrel{=} \text{sum}[\text{left}] + \text{sum}[\text{right}] & \text{otherwise}
\end{cases}$$

**rangeSum(v, lo, hi, l, r)**: 재귀적 구간 합 조회.
$$\begin{cases}
0 & \text{if } r < lo \text{ or } hi < l \quad (\text{교차 없음}) \\
\text{sum}[v] & \text{if } l \leq lo \text{ and } hi \leq r \quad (\text{완전 포함}) \\
\text{pushDown} \text{ 후 좌우 재귀 합} & \text{otherwise}
\end{cases}$$

### 정당성 — 왜 이것이 옳은가

**apply 정당성**: $[lo, hi]$ 전체에 $\text{val}$이 더해지면 구간 합이 $\text{val} \times (hi - lo + 1)$만큼 증가한다. `lazy[v]`에 $\text{val}$을 누적하여 이후 자식 방문 시 전파할 정보를 보관한다.

**불변식 유지**: `pushDown` 후 `lazy[v] = 0`이 되어 자식의 `sum`과 `lazy`에 갱신이 반영된다. 이후 `sum[v]`를 자식 합으로 갱신하면 불변식이 복원된다.

**까다로운 케이스**: `pushDown`은 자식 노드가 존재할 때만(리프가 아닐 때만) 호출해야 한다. 리프에서 `pushDown`을 호출하면 존재하지 않는 자식에 접근하는 오류가 발생한다. 또한 `rangeAdd` 재귀 후 반드시 `sum[v] = sum[left(v)] + sum[right(v)]`로 갱신해야 하며, 이를 빠뜨리면 부모 노드의 합이 틀려진다.

### 구현 디테일과 최적화

**배열 기반 트리**: 루트를 인덱스 1로 하고 $\text{left}(v) = 2v$, $\text{right}(v) = 2v+1$로 정의하면 포인터 없이 배열로 구현 가능하다. 크기 $4n$의 배열이면 충분하다.

**lazy 누적 순서**: `apply`는 `lazy[v]` 누적이지 대입이 아니다. 여러 번의 `rangeAdd`가 같은 노드에 적용될 수 있으므로 `lazy[v] += val`이어야 한다.

**함정**: `pushDown`을 호출하지 않고 재귀로 내려가면 자식의 `sum`이 최신 값이 아닌 상태에서 계산이 이루어진다. 반드시 재귀 이전에 `pushDown`을 호출해야 한다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
// 배열: sum[4n], lazy[4n], 초기값 0
// 불변식: sum[v] = A[lo..hi]의 합 (lazy[v] 반영 포함)
//         lazy[v] = 자식에게 아직 전파되지 않은 구간 가산 값

apply(v, lo, hi, val):
    sum[v] += val * (hi - lo + 1)   // 불변식 유지: sum에 즉시 반영
    lazy[v] += val                   // 자식 전파는 나중으로 미룸

pushDown(v, lo, hi):
    if lazy[v] == 0: return          // 전파할 것이 없음
    mid = (lo + hi) / 2
    apply(left(v), lo, mid, lazy[v])
    apply(right(v), mid+1, hi, lazy[v])
    lazy[v] = 0                      // 전파 완료

rangeAdd(v, lo, hi, l, r, val):
    if r < lo or hi < l: return      // 교차 없음: 아무것도 안 함
    if l <= lo and hi <= r:          // 완전 포함: 바로 적용
        apply(v, lo, hi, val)
        return
    pushDown(v, lo, hi)              // 부분 포함: 자식에게 전파 후 재귀
    mid = (lo + hi) / 2
    rangeAdd(left(v), lo, mid, l, r, val)
    rangeAdd(right(v), mid+1, hi, l, r, val)
    sum[v] = sum[left(v)] + sum[right(v)]  // 자식 합으로 갱신

rangeSum(v, lo, hi, l, r):
    if r < lo or hi < l: return 0    // 교차 없음
    if l <= lo and hi <= r:          // 완전 포함: 즉시 반환
        return sum[v]
    pushDown(v, lo, hi)              // 부분 포함: 전파 후 재귀
    mid = (lo + hi) / 2
    return rangeSum(left(v), lo, mid, l, r)
         + rangeSum(right(v), mid+1, hi, l, r)
```

### Activity Diagram

```mermaid
flowchart TD
    A([rangeAdd: l,r,val]) --> B{r < lo 또는 hi < l?}
    B -- Yes → 교차 없음 --> C([return])
    B -- No --> D{l ≤ lo and hi ≤ r?}
    D -- Yes → 완전 포함 --> E["apply(v): sum+=val×len, lazy+=val"]
    E --> C
    D -- No → 부분 포함 --> F["pushDown(v): lazy→자식 전파 후 lazy=0"]
    F --> G["재귀: rangeAdd(left)"]
    F --> H["재귀: rangeAdd(right)"]
    G --> I["sum[v] = sum[left] + sum[right]"]
    H --> I
    I --> C

    J([rangeSum: l,r]) --> K{r < lo 또는 hi < l?}
    K -- Yes --> L([return 0])
    K -- No --> M{l ≤ lo and hi ≤ r?}
    M -- Yes → 완전 포함 --> N([return sum[v]])
    M -- No → 부분 포함 --> O["pushDown(v)"]
    O --> P["좌 + 우 재귀 합산"]
    P --> Q([return 합])
```

**핵심 불변식**: 임의의 시점에서 `sum[v]`는 노드 $v$의 담당 구간 $[lo, hi]$에 대한 정확한 합을 나타내며(`lazy[v]` 이미 반영), `lazy[v]`는 자식에게 아직 전파하지 않은 구간 가산 값이다. 이 불변식 덕분에 완전 포함 노드에서 즉시 값을 반환할 수 있어 $O(\log n)$이 보장된다.
