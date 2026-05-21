# 사전 / 접두사 검색 (Trie)

## 함수 인터페이스

```ts
export class Trie {
  insert(word: string): void;
  search(word: string): boolean;
  startsWith(prefix: string): boolean;
}
```

## 제약 조건

- 단어/접두사 길이 $L \leq 10^{5}$
- 총 문자 수 (모든 삽입된 단어의 길이 합) $\leq 10^{5}$
- 각 연산은 키 길이 $L$ 에 비례하는 시간이어야 한다:

  $$T_{\text{insert}}(L) = T_{\text{search}}(L) = T_{\text{startsWith}}(L) = O(L)$$

## 문제 상세

문자열 집합을 트리(prefix tree)로 저장하여, 삽입/검색/접두사 검색을 키 길이에 비례하는 시간에 수행한다.

공간 복잡도는 전체 키 길이의 합 $\sum_i L_i$ 에 알파벳 크기 $|\Sigma|$ 를 곱한 정도가 허용된다.

### 메서드 명세

- `insert(word)` — 단어를 삽입한다. 반환값은 없다.
- `search(word)` — 정확히 그 단어가 이전에 `insert` 된 적이 있으면 `true` 를 반환한다.
- `startsWith(prefix)` — 그 접두사로 시작하는 단어가 하나라도 있으면 `true` 를 반환한다.

## 예시

```ts
const trie = new Trie();

trie.insert("apple");
trie.search("apple");      // true
trie.search("app");        // false
trie.startsWith("app");    // true

trie.insert("app");
trie.search("app");        // true

trie.startsWith("ap");     // true
trie.startsWith("b");      // false
```
