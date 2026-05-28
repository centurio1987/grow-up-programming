# radixTree 해설

## 성능 목표 예측

| 제약 | 값 |
|------|----|
| 단어/접두사 길이 $L$ | $\leq 10^5$ |
| 총 문자 수 | $\leq 10^5$ |
| 삽입 단어 수 $k$ | 제한 없음 (총 문자 수 조건으로 간접 제약) |

**Trie 대비 naive 공간 문제:**
일반 Trie는 단일 자식만 갖는 노드 체인을 그대로 저장한다.
예: `"application"` 하나를 삽입하면 11개의 노드가 생성된다.
단어가 공통 접두사를 거의 공유하지 않는다면 노드 수 = 총 문자 수 = $O\!\left(\sum L_i\right)$.

**목표 복잡도:**

| 연산 | 시간 | 근거 |
|------|------|------|
| `insert(word)` | $O(L)$ | 엣지 라벨 비교 + 최대 1회 분할 |
| `search(word)` | $O(L)$ | 엣지 라벨 순차 소비 |
| `startsWith(prefix)` | $O(L)$ | 동일 |
| 공간 | $O(k)$ 노드 | 노드 수 ≤ $2k - 1$ (삽입 단어 수) |

Trie에서 $O\!\left(\sum L_i\right)$ 노드가 필요했던 것이, Radix Tree에서 $O(k)$ 노드로 압축된다. 연산 시간은 동일하게 $O(L)$이다.

## 목표 함수 (클래스)

```ts
class RadixTree {
  insert(word: string): void
  search(word: string): boolean
  startsWith(prefix: string): boolean
}
```

**파라미터 표:**

| 파라미터 | 의미 | 제약 |
|----------|------|------|
| `word` | 삽입하거나 검색할 단어 | $0 \leq |word| \leq 10^5$ |
| `prefix` | 접두사 검색에 사용 | $0 \leq |prefix| \leq 10^5$ |

**반환값:**
- `search(word)`: `word`가 이전에 `insert`된 적이 있으면 `true`
- `startsWith(prefix)`: `prefix`로 시작하는 단어가 하나라도 있으면 `true`

**엣지케이스:**

| 케이스 | 동작 |
|--------|------|
| 빈 문자열 삽입 후 `search("")` | `true` (루트에 isEnd 표시) |
| `insert("abc")` 후 `search("ab")` | `false` (중간 노드, isEnd 없음) |
| `insert("ab")` 후 `startsWith("abc")` | `false` (경로 없음) |
| `insert("abc")`, `insert("ab")` 후 `search("ab")` | `true` (엣지 분할 후 중간 노드에 isEnd) |

## 핵심 아이디어

**핵심 아이디어**: "하나의 자식밖에 없는 노드 체인은 정보가 없으니, 통째로 하나의 엣지 라벨로 압축한다."

일반 Trie는 문자마다 노드를 하나씩 만들어 단어가 길수록 노드가 선형으로 쌓인다. Radix Tree는 분기가 없는 노드 체인을 하나의 라벨 문자열로 압축해 노드 수를 삽입 단어 수에 비례하도록 줄인다. 검색·삽입 시간은 여전히 O(단어 길이)이지만 메모리를 크게 절약할 수 있다.

**풀이 구조**
1. 삽입 시 루트에서 출발해 단어의 남은 부분(remaining)을 라벨과 비교하며 내려간다.
2. 공통 접두사 길이를 계산해 라벨 전체가 소비되면 자식으로 이동한다.
3. 부분 일치이면 공통 접두사로 중간 노드를 생성하고 기존 자식과 새 단어를 분기시킨다.
4. 검색/접두사 검사는 라벨을 통째로 소비하며 경로를 따라 내려가는 방식으로 진행한다.

**조건**: 공통 접두사를 많이 공유하는 단어 집합을 저장할 때 Trie 대비 노드 수를 O(k)로 줄이고 싶을 때. 삽입과 검색의 시간 복잡도가 Trie와 동일(O(L))해도 괜찮은 상황.

**대표 예시**: `"application"`, `"apple"`, `"app"` 세 단어 삽입
일반 Trie라면 노드가 최소 11개 필요하지만 Radix Tree는 `"app"` → `"l"` 분기와 `"ication"` 분기로 노드를 크게 줄인다. `"app"` 노드에 isEnd가 표시되고, `"le"`와 `"lication"` 두 가지 엣지로 분기된다.

**언제 쓰나**
IP 라우팅 테이블, 자동완성처럼 단어 수가 매우 많고 공통 접두사가 길 때 메모리 효율이 중요한 상황에서 Trie 대신 Radix Tree를 선택한다.

---

### 원형 아이디어와 naive 접근

일반 Trie는 한 노드에 한 글자를 저장한다.

```
TrieNode:
  children: Map<char, TrieNode>
  isEnd: boolean

insert("banana"):
  root → 'b' → 'a' → 'n' → 'a' → 'n' → 'a' (isEnd)
```

`"banana"` 하나를 삽입해도 6개 노드가 생성된다. 단어들이 공통 접두사를 거의 공유하지 않을 때 노드 수가 총 문자 수에 비례한다.

낭비의 원인: 중간 노드들이 하나의 자식만 가지는 "체인"을 형성한다. 이 체인은 분기점이 없으므로 하나의 노드로 합칠 수 있다.

### 어떤 관찰이 돌파구가 되는가

- **단일 자식 체인은 정보량이 없다.** `'b' → 'a' → 'n'` 체인에서 각 노드는 "유일한 다음 노드"만 가리키므로, 전체를 `"ban"` 하나의 라벨로 표현해도 정보 손실이 없다.
- **분기는 엣지 라벨의 첫 글자로 구분할 수 있다.** 자식 노드를 첫 글자로 구분하면 $O(1)$ 탐색이 가능하고, 라벨 전체는 노드에 저장한다.
- **새 단어 삽입 시 기존 엣지와 공통 접두사에서 분할한다.** 기존 엣지를 공통 접두사와 나머지로 분리하는 것이 insert의 핵심 연산이다. 분할은 $O(L)$ 시간이고, 노드 수를 최대 1 증가시킨다.

### 관찰을 형식화: 상태/구조 정의

**노드 구조:**

```
RadixNode:
  children: Map<firstChar, RadixNode>  // 키 = 라벨 첫 글자
  label: string                        // 이 엣지의 전체 라벨
  isEnd: boolean
```

자식 Map의 키를 "라벨 첫 글자"로 사용하는 이유: 두 엣지가 같은 첫 글자로 시작한다면, 공통 접두사를 부모 엣지로 올려야 한다. Radix Tree의 불변식에 의해 같은 부모의 자식 엣지들은 모두 서로 다른 첫 글자로 시작한다. 따라서 Map의 키로 첫 글자를 사용하면 $O(1)$에 해당 엣지를 찾을 수 있다.

라벨 전체를 첫 글자 외에도 저장하는 이유: `search`와 `startsWith`에서 엣지 라벨과 남은 문자열(remaining)을 길이가 다른 경우까지 비교해야 하기 때문이다. 단순히 첫 글자만 비교하면 `"ban"`과 `"bat"`가 동일하게 취급된다.

### 점화식 또는 핵심 연산

**공통 접두사 길이:**

$$\text{lcp}(a, b) = \max \{ k \mid a[0..k-1] = b[0..k-1] \}$$

insert에서 `lcp = commonPrefixLength(remaining, child.label)`을 계산한 후:

1. $\text{lcp} = |\text{child.label}|$: 라벨 전체가 소비됨 → 자식으로 이동
2. $\text{lcp} = |\text{remaining}|$ (단, $< |\text{child.label}|$): remaining이 라벨의 접두사 → 중간 노드 생성 후 isEnd 설정
3. $0 < \text{lcp} < \min(|\text{remaining}|, |\text{child.label}|)$: 부분 일치 → 엣지 분할
4. $\text{lcp} = 0$: 해당 첫 글자의 자식이 없음 (Map 조회 실패) → 새 노드 추가

엣지 분할 시 생성되는 중간 노드 mid:
- label = `child.label[0..lcp-1]` (공통 접두사)
- 기존 자식의 label = `child.label[lcp..]` (나머지)
- new leaf의 label = `remaining[lcp..]` (삽입 단어의 나머지)

### 정당성 — 왜 이것이 옳은가

귀납적으로 "Radix Tree의 불변식: 같은 부모의 자식 엣지들은 서로 다른 첫 글자를 가진다"가 삽입 후에도 유지됨을 보인다.

- 기저: 루트에 자식이 없을 때 첫 삽입 → 자식 1개, 불변식 성립.
- 귀납: 삽입 전 불변식이 성립한다고 가정. 새 단어 삽입 시:
  - 기존 자식과 첫 글자가 다른 경우 → 새 자식 추가, 불변식 유지.
  - 기존 자식과 첫 글자가 같은 경우 → 엣지 분할. 분할 후 중간 노드 mid의 자식은 기존 자식의 나머지(첫 글자 = `child.label[lcp]`)와 새 단어의 나머지(첫 글자 = `remaining[lcp]`)이다. 이 두 글자는 서로 다름(왜냐하면 `lcp`가 최대 공통 접두사 길이이므로 `child.label[lcp] != remaining[lcp]`). 불변식 유지.

까다로운 케이스: `insert("abc")` 후 `insert("ab")`를 할 때, `"abc"`의 엣지를 `"ab"`와 `"c"`로 분할해야 한다. 이때 중간 노드의 isEnd = true (remaining이 빈 문자열이 되므로).

### 구현 디테일과 최적화

- **엣지 분할 후 기존 자식 재연결:** `child.label = child.label[lcp:]`로 단축한 후, `mid.children[child.label[0]] = child`로 재연결한다. 이때 `child.label[0]`은 단축 후의 첫 글자임에 주의.
- **remaining이 빈 문자열인 경우:** 루프 밖에서 `cur.isEnd = true`를 설정해야 한다. 루프 조건이 `remaining != ""`이므로 루프를 빠져나온 후에도 처리가 필요하다.
- **startsWith에서 remaining이 라벨의 접두사인 경우:** `lcp == len(remaining)`이면 remaining이 완전히 소비되었으므로 즉시 `true` 반환. 이 조건을 `lcp == len(child.label)` 앞에 처리해야 한다.
- **흔한 함정:** 분할 후 `cur.children[firstCh] = mid`로 부모-자식 연결을 업데이트하지 않으면 기존 자식을 참조하게 된다.

## 수도 코드와 Activity Diagram

### 의사코드

```
RadixNode:
  children: Map<char, RadixNode>  // 키 = 라벨 첫 글자
  label: string
  isEnd: boolean = false

insert(word):
  cur = root
  remaining = word                     // 불변식: remaining이 단조 감소

  while remaining != "":
    firstCh = remaining[0]
    if firstCh not in cur.children:
      // 해당 첫 글자의 자식 없음 → 새 leaf 추가
      cur.children[firstCh] = RadixNode(label=remaining, isEnd=true)
      return

    child = cur.children[firstCh]
    lcp = commonPrefixLength(remaining, child.label)

    if lcp == len(child.label):
      // 라벨 전체 소비 → 자식으로 이동
      remaining = remaining[lcp:]
      cur = child
    else:
      // 부분 일치 → 엣지 분할
      mid = RadixNode(label=child.label[0..lcp-1], isEnd=false)
      oldSuffix = child.label[lcp:]
      child.label = oldSuffix
      mid.children[oldSuffix[0]] = child   // 기존 자식 재연결

      newSuffix = remaining[lcp:]
      if newSuffix == "":
        mid.isEnd = true
      else:
        mid.children[newSuffix[0]] = RadixNode(label=newSuffix, isEnd=true)

      cur.children[firstCh] = mid          // 부모-자식 연결 업데이트
      return

  cur.isEnd = true                         // remaining 소진 → 현재 노드가 끝

search(word):
  cur = root
  remaining = word                         // 불변식: remaining이 단조 감소
  while remaining != "":
    firstCh = remaining[0]
    if firstCh not in cur.children: return false
    child = cur.children[firstCh]
    if not remaining.startsWith(child.label): return false
    remaining = remaining[len(child.label):]
    cur = child
  return cur.isEnd

startsWith(prefix):
  cur = root
  remaining = prefix                       // 불변식: remaining이 단조 감소
  while remaining != "":
    firstCh = remaining[0]
    if firstCh not in cur.children: return false
    child = cur.children[firstCh]
    lcp = commonPrefixLength(remaining, child.label)
    if lcp == len(remaining): return true  // prefix 완전 소비 → 존재
    if lcp < len(child.label): return false // 중간 불일치
    remaining = remaining[lcp:]
    cur = child
  return true
```

### Activity Diagram

```mermaid
flowchart TD
    A[cur=root, remaining=word] --> B{remaining 비어있음?}
    B -- Yes --> C[cur.isEnd=true, 종료]
    B -- No --> D["firstCh = remaining[0]"]
    D --> E{cur.children에 firstCh 존재?}
    E -- No --> F[새 leaf 노드: label=remaining, isEnd=true, 연결 후 종료]
    E -- Yes --> G["child = cur.children[firstCh]"]
    G --> H["lcp = commonPrefixLength(remaining, child.label)"]
    H --> I{lcp == len(child.label)?}
    I -- Yes --> J["remaining = remaining[lcp:], cur = child"]
    J --> B
    I -- No --> K[중간 노드 mid 생성: label=공통접두사]
    K --> L["child.label = child.label[lcp:], mid에 기존 child 재연결"]
    L --> M{"remaining[lcp:] 비어있음?"}
    M -- Yes --> N[mid.isEnd = true]
    M -- No --> O["mid에 new leaf 연결: label=remaining[lcp:]"]
    N --> P["cur.children[firstCh] = mid, 종료"]
    O --> P
```

**핵심 불변식:** 루프 내 `remaining`은 단조 감소하며, 삽입 단어를 한 글자씩이 아닌 라벨 단위로 소비하므로 최대 $O(L)$ 반복에 종료가 보장된다. 트리의 어느 노드에서도 같은 첫 글자를 가진 두 자식 엣지는 존재하지 않는다.
