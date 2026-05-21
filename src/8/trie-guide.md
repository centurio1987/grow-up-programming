# trie 해설

## 성능 목표 예측

| 제약 | 값 |
|------|----|
| 단어/접두사 길이 $L$ | $\leq 10^5$ |
| 총 문자 수 | $\leq 10^5$ |

**naive 접근의 한계:**
단어 집합을 단순 배열에 저장한다고 가정하자.
- `search(word)`: 배열 선형 탐색 → $O(k \cdot L)$ (k = 저장된 단어 수)
- `startsWith(prefix)`: 모든 단어와 접두사 비교 → $O(k \cdot L)$
- $k = 10^5$, $L = 10^5$이면 $10^{10}$ 연산 → 시간 초과

**목표 복잡도:**

| 연산 | 시간 | 근거 |
|------|------|------|
| `insert(word)` | $O(L)$ | 글자마다 노드 탐색/생성 |
| `search(word)` | $O(L)$ | 글자마다 노드 탐색 후 끝 표시 확인 |
| `startsWith(prefix)` | $O(L)$ | 경로 탐색만으로 판단 |

**공간 복잡도:** $O\!\left(\sum_i L_i \cdot |\Sigma|\right)$
각 노드가 알파벳 크기 $|\Sigma|$만큼의 자식 포인터를 보유한다.
`Map<char, TrieNode>`을 쓰면 실제 사용한 자식 수에 비례하여 $O\!\left(\sum_i L_i\right)$로 줄어든다.

## 목표 함수

```ts
class Trie {
  insert(word: string): void
  search(word: string): boolean
  startsWith(prefix: string): boolean
}
```

**파라미터 표:**

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `word` | 삽입하거나 정확히 검색할 단어 | $0 \leq \lvert\text{word}\rvert \leq 10^5$ |
| `prefix` | 접두사 검색에 사용할 문자열 | $0 \leq \lvert\text{prefix}\rvert \leq 10^5$ |

**반환값:**
- `search(word)`: `word`가 이전에 `insert`된 적이 있으면 `true`, 없으면 `false`
- `startsWith(prefix)`: `prefix`로 시작하는 단어가 하나라도 삽입되어 있으면 `true`

**엣지케이스:**

| 케이스 | `search` 결과 | `startsWith` 결과 |
|--------|--------------|-------------------|
| 빈 문자열 `""` insert 후 `search("")` | `true` (루트에 isEnd 표시) | `true` |
| insert 전 `search("abc")` | `false` | `false` |
| `insert("abc")` 후 `search("ab")` | `false` (중간 노드, isEnd 없음) | `true` |
| `insert("ab")` 후 `startsWith("abc")` | — | `false` (경로가 존재하지 않음) |

## 핵심 아이디어

### 원형 아이디어와 naive 접근

가장 단순한 방법은 삽입된 단어를 `string[]`에 쌓는 것이다.

```
words = []
insert(word): words.push(word)
search(word): words.includes(word)          // O(k·L)
startsWith(p): words.some(w => w.startsWith(p))  // O(k·L)
```

문제는 $k$와 $L$이 모두 클 때 탐색이 $O(k \cdot L)$에 이른다는 점이다.
해시셋으로 `search`를 $O(L)$로 개선해도 `startsWith`는 여전히 $O(k \cdot L)$이다.

### 어떤 관찰이 돌파구가 되는가

- **공통 접두사는 반복 비교된다.** `"apple"`, `"app"`, `"application"`을 검색할 때마다 `"app"`을 반복해서 비교한다. 공통 접두사를 한 번만 저장하면 중복을 제거할 수 있다.
- **접두사 쿼리는 경로 존재 여부와 동치다.** 어떤 단어가 `prefix`로 시작한다는 것은, 루트에서 prefix의 글자를 따라가는 경로가 트리 안에 존재한다는 것과 같다. 경로 추적만으로 $O(L)$에 답할 수 있다.
- **단어의 끝은 "isEnd" 표식 하나로 표현된다.** `search`와 `startsWith`의 차이는 경로 끝 노드에 이 표식이 있는지 없는지뿐이다.

### 관찰을 형식화: 상태/구조 정의

위 관찰을 반영하면 노드를 다음과 같이 정의한다.

```
TrieNode:
  children: Map<char, TrieNode>
  isEnd: boolean = false
```

`children`을 `Map`으로 정의하는 이유: 알파벳 전체 크기 배열(`array[26]`)을 쓰면 $O(|\Sigma|)$ 공간이 노드마다 고정으로 발생하지만, `Map`을 쓰면 실제 자식 수에 비례한다.

단어 전체를 하나의 값으로 저장(해시셋 방식)하면 `startsWith`를 $O(L)$에 지원할 수 없다. 글자 단위로 분해해 공유 경로를 만들기 때문에 `startsWith`가 자연스럽게 $O(L)$이 된다.

루트는 빈 문자열 `""`을 나타내며, 루트에서 특정 노드까지의 경로 라벨을 이으면 그 노드가 대응하는 문자열이 된다.

### 점화식 또는 핵심 연산

**insert:** 루트에서 시작해 글자마다 자식을 따라 내려간다. 자식이 없으면 생성한다. 마지막 글자의 노드에 `isEnd = true`를 설정한다.

$$\text{cur}_0 = \text{root},\quad \text{cur}_{k+1} = \text{cur}_k.\text{children}[\,w[k]\,]$$

$k = 0, 1, \ldots, L-1$ 순서로 진행하고, 노드가 없으면 새로 만든다. 루프 종료 후 $\text{cur}_L.\text{isEnd} = \text{true}$.

**search:** 같은 경로를 따라 내려가되, 경로가 중단되면 즉시 `false`를 반환하고, 끝까지 도달했을 때 `cur.isEnd`를 반환한다.

**startsWith:** `search`와 동일한 경로 탐색을 수행하되, 끝까지 도달하면 `isEnd`와 무관하게 `true`를 반환한다.

### 정당성 — 왜 이것이 옳은가

귀납 가정: `insert(w)` 호출 후, 루트에서 $w$의 각 글자를 따라가면 항상 노드가 존재하고, 마지막 노드의 `isEnd = true`이다.

- 기저: `insert("")` → 루프가 실행되지 않고 루트에 `isEnd = true` 설정. 성립.
- 귀납: 길이 $k$까지 정상 처리된다고 가정하면, $k+1$ 글자에서도 자식이 없으면 생성 후 진행하므로 성립.

`startsWith`의 정당성: 루트에서 `prefix`의 경로가 존재한다는 것은, 그 경로를 공유하는 어떤 단어가 `insert`되었다는 것과 동치이다. 단, `prefix` 자체가 정확히 삽입된 단어일 수도 있고 더 긴 단어의 접두사일 수도 있으며, 두 경우 모두 경로는 존재한다.

까다로운 케이스: `insert("ab")` 후 `startsWith("abc")`는 `'b'` 노드에서 `'c'` 자식이 없어 `false`를 반환한다. `search("ab")` 후 `startsWith("ab")`는 경로가 존재하므로 `true`, 이는 옳다.

### 구현 디테일과 최적화

- **공간 절감:** 소문자 알파벳만 사용한다면 `Map` 대신 길이 26의 배열을 쓸 수 있다. 접근이 $O(1)$로 고정되고 캐시 친화적이다.
- **루프 종료 시점:** `search`와 `startsWith` 모두 루프 도중 자식이 없으면 즉시 반환해야 한다. 루프를 끝까지 돌고 나서 검사하면 `undefined` 접근 오류가 발생한다.
- **흔한 함정:** `search`에서 `isEnd` 확인을 빠뜨리면 `startsWith`와 동일한 동작이 된다. `insert("abc")` 후 `search("ab")`가 `true`로 잘못 반환된다.

## 수도 코드와 Activity Diagram

### 의사코드

```
TrieNode:
  children: Map<char, TrieNode>
  isEnd: boolean = false

insert(word):
  cur = root                          // 불변식: cur는 word[0..i-1]의 끝 노드
  for ch in word:
    if ch not in cur.children:
      cur.children[ch] = new TrieNode()
    cur = cur.children[ch]            // 불변식 유지
  cur.isEnd = true                    // word 전체가 삽입됨을 표시

search(word):
  cur = root                          // 불변식: cur는 word[0..i-1]의 끝 노드
  for ch in word:
    if ch not in cur.children:
      return false                    // 경로 없음 → 단어 없음
    cur = cur.children[ch]
  return cur.isEnd                    // 경로 끝에 단어 끝 표시가 있는지 확인

startsWith(prefix):
  cur = root                          // 불변식: cur는 prefix[0..i-1]의 끝 노드
  for ch in prefix:
    if ch not in cur.children:
      return false                    // 경로 없음 → 접두사 없음
    cur = cur.children[ch]
  return true                         // 경로가 존재하면 접두사 존재
```

### Activity Diagram

```mermaid
flowchart TD
    A[cur = root] --> B{word에 문자 남음?}
    B -- No --> C[cur.isEnd = true, 종료]
    B -- Yes --> D["ch = 다음 문자"]
    D --> E{cur.children에 ch 존재?}
    E -- No --> F[새 노드 생성: cur.children[ch] = new TrieNode]
    E -- Yes --> G[cur = cur.children[ch]]
    F --> G
    G --> B
```

**`search` 분기:**

```mermaid
flowchart TD
    A[cur = root] --> B{word에 문자 남음?}
    B -- No --> C{cur.isEnd?}
    C -- Yes --> T[return true]
    C -- No --> F2[return false]
    B -- Yes --> D["ch = 다음 문자"]
    D --> E{cur.children에 ch 존재?}
    E -- No --> F[return false]
    E -- Yes --> G[cur = cur.children[ch]]
    G --> B
```

**핵심 불변식:** 루프 진입 시 `cur`는 처리된 글자 시퀀스의 끝 노드이고, 루트에서 `cur`까지의 경로 라벨은 처리된 접두사와 정확히 일치한다.
