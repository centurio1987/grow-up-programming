# Trie (트라이 / 접두사 트리)

## 한 줄 요약
> 문자 단위 분기 트리로 문자열 집합을 저장하고, 접두사 기반 삽입·검색·삭제·자동완성을 O(단어 길이)에 처리하라.

## 스토리
검색창에 "app"을 입력하는 순간, 구글 검색창에는 "apple", "application", "app store" 같은 자동완성 후보가 수십 밀리초 안에 나타난다. 이 속도는 해시맵으로도 달성하기 어렵다 — 모든 키를 순회해야 하기 때문이다.

트라이는 이 문제를 근본적으로 해결한다. 각 문자를 노드로 만들어 트리를 구성하면, 공통 접두사를 공유하는 단어들이 같은 경로를 공유한다. "app"을 입력하면 루트에서 'a'→'p'→'p' 노드로 딱 3번만 이동해 해당 서브트리 전체를 얻는다. 이 서브트리를 DFS로 탐색하면 모든 후보 단어를 O(접두사 길이 + 결과 수)에 가져온다.

IDE의 코드 자동완성, 사전 앱의 단어 추천, 네트워크 라우팅 테이블 등 접두사 기반 탐색이 필요한 거의 모든 곳에 트라이가 사용된다.

## 함수 인터페이스

```ts
export class Trie {
  insert(word: string): void
  search(word: string): boolean
  startsWith(prefix: string): boolean
  delete(word: string): boolean
  wordsWithPrefix(prefix: string): string[]
  size(): number
}
```

## 제약 조건
- $1 \leq$ 단어 길이 $\leq 10^3$
- $n \leq 10^4$ (삽입 단어 수)
- 문자는 임의의 UTF-8 문자열 (알파벳 소문자 기준으로 풀어도 됨)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

### 노드 구조
```ts
interface TrieNode {
  children: Map<string, TrieNode>;  // 자식 노드 맵
  isEnd: boolean;                    // 이 노드에서 단어가 끝나는가
}
```

### insert
루트에서 시작해 각 문자에 대한 자식 노드를 없으면 생성하며 내려간다. 마지막 노드의 `isEnd = true`.

### search
루트에서 내려가며 각 문자 노드를 찾는다. 끝까지 내려갔을 때 `isEnd`가 true이면 존재한다.

### startsWith
search와 동일하게 내려가되, `isEnd` 확인 없이 경로가 존재하면 true.

### delete
재귀적으로 내려가 단어 끝 노드의 `isEnd = false`로 설정. 자식이 없는 노드를 거슬러 올라가며 불필요한 노드를 정리 (pruning). 다른 단어와 공유되는 노드는 삭제하지 않는다.

### wordsWithPrefix
접두사 노드까지 이동 후 DFS로 모든 리프(isEnd) 노드를 수집.

## 예시

```ts
const trie = new Trie();
trie.insert("apple");
trie.insert("application");
trie.insert("apt");
trie.insert("banana");

console.log(trie.search("apple"));        // true
console.log(trie.search("app"));          // false (삽입 안 됨)
console.log(trie.startsWith("app"));      // true
console.log(trie.wordsWithPrefix("app")); // ["apple", "application"]
console.log(trie.size());                 // 4

trie.delete("apple");
console.log(trie.search("apple"));        // false
console.log(trie.startsWith("appl"));     // false (apple 삭제 후 appl 경로 없음)
                                          // application은 살아있으므로 startsWith("appl") → true가 될 수도 있음
```
