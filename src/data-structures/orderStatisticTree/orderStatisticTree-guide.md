# Order Statistic Tree 해설

## 성능 목표 예측

| 제약 항목 | 값 |
|-----------|-----|
| 원소 수 $n$ | $\leq 10^5$ |
| 질의 수 $q$ | $\leq 10^5$ |
| 원소 값 범위 | $|x| \leq 10^9$ |

**naive 접근의 문제점**: 정렬된 배열로 집합을 유지하면 `kth`와 `rank`를 $O(\log n)$ 이진 탐색으로 처리할 수 있으나, 삽입/삭제 시 배열 이동이 $O(n)$이 된다. $q = 10^5$번의 혼합 연산에서 총 $O(qn) = O(10^{10})$이 되어 불가능하다. 값 범위 $|x| \leq 10^9$가 매우 넓으므로 직접 인덱싱도 불가능하다.

**목표 복잡도**: 네 연산 모두 $O(\log n)$. $q \log n \approx 10^5 \times 17 \approx 1.7 \times 10^6$으로 충분히 빠르다.

**공간 복잡도**: $O(n)$. 노드당 `key`, `left`, `right`, `size` 필드를 유지한다.

---

## 목표 함수

```ts
class OrderStatisticTree {
  constructor(): OrderStatisticTree
  insert(x: number): void
  delete(x: number): void
  kth(k: number): number
  rank(x: number): number
}
```

| 파라미터 | 의미 | 제약 |
|---------|------|------|
| `x` (insert) | 삽입할 값 (중복 허용) | $|x| \leq 10^9$ |
| `x` (delete) | 삭제할 값 (하나만) | 존재하지 않으면 무시 |
| `k` (kth) | 정렬된 순서에서 1-기반 순위 | $1 \leq k \leq |S|$ |
| `x` (rank) | 순위를 구할 값 | $|x| \leq 10^9$ |

**반환값**: `kth(k)`는 정렬된 다중 집합 $S$에서 $k$번째 원소를 반환한다. `rank(x)`는 $|\{y \in S \mid y < x\}|$, 즉 $x$보다 작은 원소의 개수를 반환한다.

**엣지케이스**:
1. 동일한 값을 여러 번 `insert` 후 하나만 `delete` → 나머지 복사본은 유지된다.
2. `delete(x)` when $x \notin S$ → 아무 변화 없음.
3. `kth(1)` → 최솟값, `kth(|S|)` → 최댓값.
4. `rank(x)` when $x$ is the smallest element → 0 반환.
5. `rank(x)` for $x$ not in $S$ → $x$보다 작은 원소의 수를 반환. 예: $S = \{1, 3, 5\}$, `rank(4)` = 2.

---

## 핵심 아이디어

**핵심 아이디어**: "각 노드에 서브트리 크기를 저장하면, 균형 BST 위에서 $k$번째 원소와 순위를 $O(\log n)$에 바로 구할 수 있다."

정렬된 집합에서 삽입·삭제뿐 아니라 "$k$번째로 작은 값은?" 또는 "이 값보다 작은 원소가 몇 개인가?"를 빠르게 답하고 싶을 때가 있다. 일반 BST는 이 두 연산에 $O(n)$이 걸리지만, 각 노드에 `size` 필드 하나를 추가하면 중위 순회 없이 한 번의 하향 탐색으로 $O(\log n)$에 처리할 수 있다. 균형 보장은 Treap이나 AVL 트리로 해결한다.

**풀이 구조**
1. 각 노드에 key, left, right, size 필드를 유지한다
2. 삽입/삭제 시 경로 위 모든 노드에서 `pullUp`으로 size를 갱신한다
3. `kth(k)`: 왼쪽 서브트리 크기 $ls$와 $k$ 비교로 방향을 결정하며 하향 탐색한다
4. `rank(x)`: $x > v.key$일 때 $ls + 1$을 누적하며 하향 탐색한다

**조건**: 삽입·삭제가 동적으로 일어나면서 순서 통계($k$번째 원소, 순위)를 반복 조회해야 하는 상황, 값 범위가 너무 넓어 직접 인덱싱이 불가능한 경우

**대표 예시**: 실시간 리더보드의 순위 조회
$10^5$명의 점수가 계속 갱신되는 리더보드에서 "현재 $k$등의 점수는?" 또는 "이 점수의 현재 순위는?"을 매 질의마다 $O(\log n)$에 응답한다. 정렬 배열로는 삽입·삭제가 $O(n)$이지만 Order Statistic Tree로는 모든 연산이 $O(\log n)$이다.

**언제 쓰나**
$k$번째 원소 조회(`kth`)나 순위 계산(`rank`)이 포함된 동적 집합 문제라면 Order Statistic Tree를 고려한다. 삽입·삭제 없이 조회만 필요하다면 정렬 배열과 이진 탐색이 더 단순하다.

---

### 원형 아이디어와 naive 접근

일반적인 BST(이진 탐색 트리)는 삽입·삭제·탐색을 $O(h)$에 처리하지만, $k$번째 원소와 순위를 구하려면 추가 정보가 필요하다. 가장 단순한 방법은 `kth`를 중위 순회로 구현하는 것이지만 $O(n)$이 된다.

**폭발 지점**: 일반 BST만으로는 `kth`와 `rank`를 $O(n)$보다 빠르게 처리할 수 없다. 각 노드에 "내 서브트리에 몇 개의 원소가 있는가"를 유지하면 이 두 연산을 $O(h)$에 처리할 수 있다. 균형 BST라면 $h = O(\log n)$이다.

### 어떤 관찰이 돌파구가 되는가

- **관찰 1**: 노드 $v$의 서브트리 크기 `size(v) = size(left(v)) + size(right(v)) + 1`을 유지하면, 왼쪽 서브트리 크기만으로 $k$번째 원소가 현재 노드인지, 왼쪽/오른쪽 중 어디에 있는지 판단할 수 있다. 이 결정 하나로 탐색 범위가 절반 이하로 줄어든다.
- **관찰 2**: `rank(x)`는 루트에서 $x$를 향해 내려가면서 "현재 노드의 왼쪽 서브트리 전체 + 현재 노드" 크기를 조건부로 누적하면 된다. 이 역시 트리 깊이만큼의 시간이면 충분하다.
- **관찰 3**: 삽입/삭제 시 경로 위의 모든 노드에서 `size`를 갱신해야 하며, 균형을 유지하기 위한 회전(rotation) 시에도 `size`를 재계산해야 한다. Treap이나 AVL 트리 위에 `size`를 얹으면 된다.

### 관찰을 형식화: 상태/구조 정의

각 노드는 다음 필드를 갖는다:

$$\text{node} = \{key, \; left, \; right, \; size\}$$

$$\text{size}(v) = \text{size}(\text{left}(v)) + \text{size}(\text{right}(v)) + 1, \quad \text{size}(\text{null}) = 0$$

이 형태여야 하는 근거: `size`를 각 노드에 저장하면, `kth`와 `rank`를 루트에서 한 번의 하향 탐색으로 해결할 수 있다. 균형 BST 조건과 결합하면 모든 연산이 $O(\log n)$이 된다.

### 점화식 또는 핵심 연산

**kth 탐색** (루트에서 하향):

현재 노드의 왼쪽 서브트리 크기를 $ls = \text{size}(\text{left})$라 할 때:

$$\text{kth}(v, k) = \begin{cases}
\text{kth}(\text{left}(v), k) & \text{if } k \leq ls \\
v.key & \text{if } k = ls + 1 \\
\text{kth}(\text{right}(v), k - ls - 1) & \text{if } k > ls + 1
\end{cases}$$

각 호출에서 탐색 범위가 왼쪽 또는 오른쪽 서브트리로 정확히 절반 이하로 줄어든다(균형 BST 가정).

**rank 계산** (루트에서 하향):

$$\text{rank}(v, x) = \begin{cases}
0 & \text{if } v = \text{null} \\
\text{rank}(\text{left}(v), x) & \text{if } x \leq v.key \\
\text{size}(\text{left}(v)) + 1 + \text{rank}(\text{right}(v), x) & \text{if } x > v.key
\end{cases}$$

$x > v.key$이면 현재 노드와 왼쪽 서브트리 전체($\text{size}(\text{left}) + 1$개)가 $x$보다 작으므로 누적한다.

**size 유지**: 삽입/삭제 경로 위 모든 노드에서 `pullUp(v): v.size = size(v.left) + size(v.right) + 1`을 호출한다. Treap의 `split`/`merge` 시에도 매 호출 후 `pullUp`을 실행한다.

### 정당성 — 왜 이것이 옳은가

**kth 정당성**: 귀납적으로, 크기 $m$의 BST에서 $k$번째 원소는 왼쪽 서브트리 크기 $ls$와의 비교로 유일하게 결정된다. $k \leq ls$이면 $k$번째 원소가 왼쪽에 있음이 BST 정렬 조건에 의해 보장된다. $k = ls + 1$이면 현재 노드가 정확히 $k$번째이다. $k > ls + 1$이면 오른쪽 서브트리에서 $(k - ls - 1)$번째를 찾으면 된다.

**rank 정당성**: $x > v.key$이면 왼쪽 서브트리의 모든 원소가 $v.key < x$를 만족하므로 $\text{size}(\text{left}) + 1$개를 누적한다. $x \leq v.key$이면 현재 노드와 오른쪽 서브트리는 $\geq v.key \geq x$이므로 카운트에서 제외한다.

**불변식**: 모든 연산 전후에 $\text{size}(v) = \text{size}(\text{left}(v)) + \text{size}(\text{right}(v)) + 1$이 성립한다.

**까다로운 케이스**: 중복 원소 삽입 시 같은 키를 오른쪽 서브트리에 허용하거나(`left.key ≤ node.key < right.key` 또는 `left.key < node.key ≤ right.key`), 두 방향 모두 허용하도록 일관성 있게 정의해야 한다. `rank(x)`는 $x$보다 "엄격히 작은" 원소 수이므로, 동일 키 처리 방향이 일치해야 한다.

### 구현 디테일과 최적화

**균형 유지 방법**: Treap(무작위 우선순위 기반 `split`/`merge`)으로 구현하면 $O(\log n)$ 기대 시간이 보장된다. 각 `split`과 `merge` 후 `pullUp`을 실행하여 `size`를 갱신한다.

**delete 구현**: `delete(x)` 시 $x$를 찾아 해당 노드의 두 자식을 `merge`하여 이어붙인다. 중복이 있다면 하나만 삭제하도록 `split`으로 $x$를 정확히 하나 제거하는 방법을 사용한다.

**함정**: `size(null) = 0`을 일관되게 처리해야 한다. null 노드에 대해 `size`를 참조하면 런타임 오류가 발생한다. 헬퍼 함수 `sz(node) = node ? node.size : 0`으로 안전하게 래핑한다.

---

## 수도 코드와 Activity Diagram

### 의사코드

```
// 각 노드: { key, left, right, size }
// 불변식: size(v) = size(v.left) + size(v.right) + 1
//         BST 조건: left.key ≤ node.key, right.key ≥ node.key

pullUp(v):
    v.size = sz(v.left) + sz(v.right) + 1  // sz(null) = 0

kth(v, k) → number:
    ls = sz(v.left)                          // 왼쪽 서브트리 크기
    if k <= ls:                              // k번째가 왼쪽 서브트리에 있음
        return kth(v.left, k)
    if k == ls + 1:                          // 현재 노드가 k번째
        return v.key
    return kth(v.right, k - ls - 1)         // 오른쪽 서브트리에서 탐색

rank(v, x) → number:
    if v == null: return 0
    if x <= v.key:                           // x ≤ 현재 키 → 왼쪽으로
        return rank(v.left, x)
    else:                                    // x > 현재 키 → 왼쪽 전체 + 현재 + 오른쪽
        return sz(v.left) + 1 + rank(v.right, x)

insert(x):
    // Treap split/merge 또는 BST 삽입 + 경로 위 pullUp
    // 삽입 후 불변식: size(모든 경로 위 노드) 갱신

delete(x):
    // x가 없으면 무시
    // Treap: split으로 x를 분리 후 루트 제거하여 merge
    // 경로 위 pullUp 실행
```

### Activity Diagram

```mermaid
flowchart TD
    A([kth: v, k]) --> B["ls = sz(v.left)"]
    B --> C{k <= ls?}
    C -- Yes → 왼쪽에 있음 --> D([kth(v.left, k)])
    C -- No --> E{k == ls+1?}
    E -- Yes → 현재 노드 --> F([return v.key])
    E -- No → 오른쪽에 있음 --> G([kth(v.right, k-ls-1)])

    H([rank: v, x]) --> I{v == null?}
    I -- Yes --> J([return 0])
    I -- No --> K{x <= v.key?}
    K -- Yes → 현재·오른쪽은 ≥ x --> L([rank(v.left, x)])
    K -- No → 왼쪽+현재 누적 --> M["sz(v.left) + 1 + rank(v.right, x)"]
    M --> N([return])

    O([insert: x]) --> P["BST 삽입 또는 split/merge"]
    P --> Q["경로 위 모든 노드 pullUp"]
    Q --> R([done, size 불변식 복원])

    S([delete: x]) --> T{x ∈ S?}
    T -- No --> U([무시])
    T -- Yes --> V["노드 제거 + 자식 merge"]
    V --> W["경로 위 모든 노드 pullUp"]
    W --> X([done])
```

**핵심 불변식**: $\text{size}(v) = \text{size}(v.\text{left}) + \text{size}(v.\text{right}) + 1$이 모든 삽입·삭제·회전 연산 전후에 성립하며, 이를 통해 `kth`와 `rank`를 $O(\log n)$에 정확하게 계산할 수 있다.
