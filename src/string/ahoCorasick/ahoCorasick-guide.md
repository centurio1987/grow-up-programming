# ahoCorasick 해설

## 성능 목표 예측

| 제약 | 값 |
|------|----|
| 텍스트 길이 $n$ | $1 \leq n \leq 10^5$ |
| 패턴 수 $k$ | $1 \leq k$ |
| 전체 패턴 길이 합 $\sum |p_i|$ | $\leq 10^5$ |

**naive 접근의 한계:**
각 패턴에 KMP를 독립적으로 적용한다고 가정하자.

- 패턴 $p_i$ 하나에 KMP 적용: $O(n + |p_i|)$
- 패턴 $k$개 전체: $O(k \cdot n + \sum |p_i|)$
- $k = 10^5$, $n = 10^5$이면 $10^{10}$ 연산 → 시간 초과

텍스트를 패턴마다 다시 스캔하는 것 자체가 낭비다. 텍스트를 한 번만 읽으면서 모든 패턴을 동시에 매칭해야 한다.

**목표 복잡도:**

| 항목 | 목표 | 근거 |
|------|------|------|
| 구축 | $O\!\left(\sum |p_i|\right)$ | Trie 삽입 + BFS 실패 링크 |
| 매칭 | $O(n + z)$ | 텍스트 1회 순회, $z$ = 전체 매칭 수 |
| 공간 | $O\!\left(\sum |p_i|\right)$ | Trie 노드 수 ≤ 전체 패턴 문자 수 |

$n, \sum|p_i| \leq 10^5$이면 $O(n + \sum|p_i| + z)$ 내에 처리 가능하다.

## 목표 함수

```ts
function ahoCorasick(
  text: string,
  patterns: string[]
): Array<{ patternIndex: number; position: number }>
```

**파라미터 표:**

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `text` | 검색 대상 텍스트 $T$ | $1 \leq n \leq 10^5$ |
| `patterns` | 검색할 패턴 배열 $\{p_0, \ldots, p_{k-1}\}$ | $\sum |p_i| \leq 10^5$ |

**반환값:** `{ patternIndex: i, position: j }` 형태의 객체 배열. `position` 오름차순, 동률 시 `patternIndex` 오름차순.

**엣지케이스:**

| 케이스 | 동작 |
|--------|------|
| 길이 0인 패턴 포함 | 해당 패턴 무시 (매칭 결과에 포함하지 않음) |
| 동일한 패턴이 여러 인덱스로 전달 | 각각 별도의 `patternIndex`로 독립 보고 |
| 패턴이 텍스트 끝부분에 등장 | `position = n - |p_i|` 정상 반환 |
| 패턴들이 서로 접두사-접미사 관계 (`"a"`, `"aa"`) | 같은 위치에서 여러 패턴 동시 보고 |

## 핵심 아이디어

### 원형 아이디어와 naive 접근

가장 단순한 방법은 패턴 각각에 KMP를 적용하는 것이다.

```
result = []
for i = 0 to k-1:
  positions = kmp(text, patterns[i])    // O(n + |p_i|)
  for pos in positions:
    result.push({ patternIndex: i, position: pos })
sort result
return result
```

패턴 수가 클 때 텍스트를 $k$번 반복 스캔하므로 $O(k \cdot n)$ 시간이 소요된다.
낭비의 본질: 각 스캔에서 서로 다른 패턴을 찾지만, 텍스트를 읽는 행위 자체가 반복된다.

### 어떤 관찰이 돌파구가 되는가

- **모든 패턴의 접두사를 하나의 Trie로 공유할 수 있다.** Trie는 여러 패턴의 공통 접두사를 단 한 번만 저장한다. 텍스트를 순회하면서 Trie 안에서 현재 상태를 업데이트하면, 단일 패스로 모든 패턴의 매칭을 탐색할 수 있다.
- **불일치 시 "이미 매칭된 정보"를 버리지 않아도 된다.** KMP의 실패 함수처럼, Trie 위에서도 "현재 매칭된 접미사와 일치하는 최장 패턴 접두사"로 이동하는 실패 링크를 미리 계산할 수 있다.
- **한 위치에서 여러 패턴이 겹쳐 끝날 수 있다.** 실패 링크 체인 위를 따라가며 중간에 패턴이 끝나는 노드를 빠르게 찾는 딕셔너리 링크(output link)를 추가하면, 하나의 위치에서 모든 매칭을 $O(z_i)$에 보고할 수 있다.

### 관찰을 형식화: 상태/구조 정의

**Trie 노드 구조:**

```
AhoNode:
  children: Map<char, AhoNode>
  fail: AhoNode           // 실패 링크
  dict: AhoNode | null    // 딕셔너리 링크 (실패 링크 체인 중 첫 번째 출력 노드)
  output: Array<{ patternIndex, len }>  // 이 노드에서 끝나는 패턴들
```

**실패 링크의 정의:**
노드 $v$가 Trie 루트에서 문자열 $w$를 따라 도달하는 노드라면,
$$\text{fail}(v) = \text{Trie 내에서 } w \text{의 진접미사(proper suffix) 중 가장 긴 패턴 접두사의 끝 노드}$$

이 정의가 이 형태여야 하는 이유: 불일치 시 텍스트를 되감지 않고도 "현재까지 매칭된 부분의 접미사로 시작하는 패턴"을 이어서 탐색할 수 있다. 더 짧은 접미사를 사용하면 유효 매칭을 놓친다.

**딕셔너리 링크의 정의:**
$$\text{dict}(v) = \text{fail}(v) \text{로 거슬러 올라가는 경로 중 output이 있는 첫 번째 노드}$$

한 텍스트 위치에서 여러 패턴이 매칭될 수 있으므로, 이 링크로 단락 연결(shortcut)을 만들어 $O(z_i)$에 모두 수집한다.

### 점화식 또는 핵심 연산

**실패 링크 구축 (BFS 순서로):**

루트의 자식 노드 $c$에 대해:
$$\text{fail}(c) = \text{root}$$

깊이 $d$의 노드 $v$ (부모 $u$, 엣지 레이블 $ch$)에 대해:
$$\text{fail}(v) = \begin{cases}
\text{root} & \text{if } \text{fail}(u) \text{에서 } ch \text{로 가는 자식이 없음} \\
\text{fail}(u).\text{children}[ch] & \text{otherwise}
\end{cases}$$

- 첫째 항: 실패 링크를 따라 루트까지 올라가도 같은 문자로 시작하는 자식이 없으면 루트가 실패 링크
- 둘째 항: 실패 링크에서 $ch$로 이동 가능하면 그 노드가 실패 링크 (BFS 처리 순서 덕분에 부모의 실패 링크는 이미 계산되어 있음)

**매칭 전이:**

텍스트 문자 $T[i]$를 처리할 때 현재 상태 $\text{cur}$에서:
$$\text{cur}' = \begin{cases}
\text{cur}.\text{children}[T[i]] & \text{if 전이 존재} \\
\text{fail}(\text{cur}) \text{으로 이동 후 재시도} & \text{if 전이 없음} \\
\text{root} & \text{if 루트에서도 전이 없음}
\end{cases}$$

전이 성공 후 $\text{cur}'$와 $\text{dict}(\text{cur}')$가 가리키는 체인의 output을 수집한다.

### 정당성 — 왜 이것이 옳은가

불변식: 텍스트 $T[0 \ldots i]$를 처리한 후 `cur`는 "$T[0 \ldots i]$의 접미사 중 Trie 안 어떤 패턴의 접두사와 일치하는 가장 긴 것의 끝 노드"이다.

- BFS 순서로 실패 링크를 구축하면, 부모의 실패 링크가 자식보다 먼저 계산된다. 따라서 귀납적으로 각 노드의 실패 링크가 정확히 정의된다.
- 매칭 단계에서 실패 링크를 따라 이동해도 "텍스트 포인터 $i$는 절대 후퇴하지 않는다"는 성질이 유지된다. 실패 링크 이동 횟수는 $i$의 총 증가 횟수 $n$에 한정된다.
- 까다로운 케이스: `"a"`, `"aa"` 두 패턴이 있을 때, `"aa"`의 끝 노드에서 딕셔너리 링크를 따라가면 `"a"`의 끝 노드에 도달한다. 따라서 두 패턴 모두 정확히 보고된다.

### 구현 디테일과 최적화

- **goto 최적화:** 실패 링크를 계산할 때 직접 "goto" 전이표를 미리 채우면, 매칭 단계에서 `while (fail 이동)` 루프 없이 $O(1)$ 전이가 가능하다. Trie 노드마다 모든 문자에 대해 goto 값을 채운다 (BFS 시 부모의 goto를 상속).
- **딕셔너리 링크 누락:** 딕셔너리 링크 체인을 순회하지 않으면 실패 링크 체인 중간에 끝나는 짧은 패턴을 놓친다.
- **길이 0 패턴:** Trie 삽입 시 루트에 output을 추가하게 되어 텍스트의 모든 위치에서 매칭 보고가 발생한다. 입력 전에 필터링하는 것이 안전하다.
- **BFS vs DFS:** 실패 링크 구축은 반드시 BFS여야 한다. DFS로 처리하면 부모의 실패 링크가 아직 계산되지 않은 상태에서 자식을 처리하게 된다.

## 수도 코드와 Activity Diagram

### 의사코드

```
// 1단계: Trie 구축
buildTrie(patterns):
  root = newAhoNode()
  for i = 0 to k-1:
    if len(patterns[i]) == 0: continue      // 빈 패턴 건너뜀
    cur = root
    for ch in patterns[i]:
      if ch not in cur.children:
        cur.children[ch] = newAhoNode()
      cur = cur.children[ch]
    cur.output.push({ patternIndex: i, len: len(patterns[i]) })
  return root

// 2단계: BFS로 실패/딕셔너리 링크 구축
buildFailLinks(root):
  queue = []
  root.fail = root
  for ch, child in root.children:          // 루트 자식: 실패 링크 = 루트
    child.fail = root
    child.dict = null
    queue.push(child)

  while queue not empty:
    v = queue.dequeue()
    for ch, child in v.children:
      // 실패 링크: 부모의 실패에서 ch 전이
      f = v.fail
      while f != root and f.children[ch] == null:
        f = f.fail
      child.fail = (f.children[ch] != null and f.children[ch] != child)
                   ? f.children[ch] : root
      // 딕셔너리 링크
      child.dict = child.fail.output.nonEmpty
                   ? child.fail : child.fail.dict
      queue.push(child)

// 3단계: 매칭
search(text, root):
  result = []
  cur = root                               // 불변식: cur = T[0..i-1] 접미사 최장 매칭 노드
  for i = 0 to n-1:
    ch = text[i]
    while cur != root and cur.children[ch] == null:
      cur = cur.fail                       // 전이 불가 → 실패 링크 이동
    if cur.children[ch] != null:
      cur = cur.children[ch]              // 전이 성공
    // 현재 노드 및 딕셔너리 링크 체인에서 패턴 수집
    node = cur
    while node != null and node != root:
      for { patternIndex, len } in node.output:
        result.push({ patternIndex, position: i - len + 1 })
      node = node.dict
  sort result by position asc, then patternIndex asc
  return result
```

### Activity Diagram

```mermaid
flowchart TD
    A[패턴 Trie 삽입 - 길이 0 건너뜀] --> B[BFS: 실패 링크 및 딕셔너리 링크 구축]
    B --> C[cur = root, i = 0]
    C --> D{i < n?}
    D -- No --> Z[결과 정렬 후 반환]
    D -- Yes --> E["ch = T[i]"]
    E --> F{cur에서 ch 전이 존재?}
    F -- No --> G{cur == root?}
    G -- Yes --> H[i++]
    G -- No --> I[cur = cur.fail]
    I --> F
    F -- Yes --> J[cur = cur.children[ch]]
    J --> K[node = cur]
    K --> L{node != null AND node != root?}
    L -- No --> H
    L -- Yes --> M[node.output의 패턴 수집]
    M --> N[node = node.dict]
    N --> L
    H --> D
```

**핵심 불변식:** 텍스트 위치 $i$ 처리 후 `cur`는 $T[0 \ldots i]$의 접미사 중 Trie 안 패턴 접두사와 일치하는 최장 문자열의 끝 노드이며, 텍스트 포인터 $i$는 단조 증가한다.
