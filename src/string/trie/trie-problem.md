# 접두사 트리 사전

## 한 줄 요약

> `Trie`는 단어를 삽입하고, 정확한 단어 존재 여부와 특정 접두사로 시작하는 단어의 존재 여부를 각각 조회할 수 있는 자료구조다.

## 스토리

모바일 키보드 앱을 만드는 수현은 사용자가 글자를 입력할 때마다 그 접두사로 시작하는 단어가 사전에 있는지 즉시 알아야 한다. 자동 완성 목록을 띄울지 말지 결정하기 위해서다.

동시에 사용자가 입력한 단어가 정확히 사전에 등록된 단어인지도 확인해야 맞춤법 검사가 가능하다. 수현에게는 단어 삽입, 정확 일치 검색, 접두사 검색 세 가지를 각각 단어 길이에 비례하는 시간 안에 처리하는 자료구조가 필요하다.

## 함수 인터페이스

```ts
export class Trie {
  insert(word: string): void;
  search(word: string): boolean;
  startsWith(prefix: string): boolean;
}
```

- `insert(word)` — `word`를 자료구조에 삽입한다. 반환값 없음.
- `search(word)` — `word`가 이전에 삽입된 적이 있으면 `true`, 없으면 `false`.
- `startsWith(prefix)` — `prefix`로 시작하는 단어가 하나라도 삽입되어 있으면 `true`, 없으면 `false`.

## 제약 조건

- 단어/접두사 길이 $L \leq 10^5$
- 삽입된 모든 단어의 길이 합 $\leq 10^5$
- 각 연산의 시간 복잡도: $O(L)$
- 문자 집합: 소문자 영문 알파벳 (`a`–`z`)
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

삽입된 적 없는 단어는 `search`에서 `false`를 반환한다. `startsWith`는 삽입된 단어 중 `prefix`로 시작하는 것이 하나라도 있으면 `true`다.

동일한 단어를 중복 삽입해도 오류 없이 동작해야 한다. 같은 단어를 여러 번 `insert`한 뒤 `search`하면 여전히 `true`를 반환한다.

빈 자료구조에서 `search`나 `startsWith`를 호출하면 항상 `false`를 반환한다.

`search`와 `startsWith`의 차이: `insert("apple")` 후 `search("app")`은 `false`이지만 `startsWith("app")`은 `true`다.

## 예시

```ts
const trie = new Trie();

trie.insert("apple");
trie.search("apple");     // true  — 삽입된 단어
trie.search("app");       // false — 접두사는 단어가 아님
trie.startsWith("app");   // true  — "apple"이 "app"으로 시작함

trie.insert("app");
trie.search("app");       // true  — 이제 "app" 자체도 삽입됨

trie.startsWith("ap");    // true  — "apple"과 "app" 모두 해당
trie.startsWith("b");     // false — "b"로 시작하는 단어 없음
trie.search("appl");      // false — "appl" 자체는 삽입된 적 없음
```
