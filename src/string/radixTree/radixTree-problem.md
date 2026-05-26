# 공백 압축된 사전 (Radix Tree / Patricia Trie)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★★ 중 — 빈출 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export class RadixTree {
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

일반적인 Trie는 단일 자식만 가지는 체인 노드들을 그대로 보존하지만, Radix Tree(Patricia Trie)는 그러한 체인을 하나의 엣지 라벨로 합쳐 저장한다. 이로써 노드 수가 키 개수에 비례하게 줄어들어 공간이 압축되며, 연산 시간은 동일하게 키 길이 $L$에 비례한다.

### 메서드 명세

- `insert(word)` — 단어를 삽입한다. 기존 엣지와 공통 접두사를 공유하면 엣지를 분할한다. 반환값은 없다.
- `search(word)` — 정확히 그 단어가 이전에 `insert` 된 적이 있으면 `true` 를 반환한다.
- `startsWith(prefix)` — 그 접두사로 시작하는 단어가 하나라도 있으면 `true` 를 반환한다.

## 예시

```ts
const rt = new RadixTree();

rt.insert("apple");
rt.search("apple");        // true
rt.search("app");          // false
rt.startsWith("app");      // true

rt.insert("app");
rt.search("app");          // true

rt.insert("application");
rt.startsWith("appl");     // true
rt.search("appl");         // false
```
