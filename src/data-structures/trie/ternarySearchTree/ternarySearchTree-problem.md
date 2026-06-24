# TernarySearchTree (삼진 탐색 트리)

## 한 줄 요약
> 각 노드가 세 자식(작음/같음/큼)을 가지는 트라이 변형으로, 일반 Trie보다 메모리 효율적인 문자열 집합 자료구조를 구현하라.

## 스토리

대형 온라인 사전 서비스를 운영하고 있다. 영어 단어 50만 개를 메모리에 올려두고 사용자가 입력하는 단어의 철자가 올바른지 실시간으로 검사해야 한다.

일반 배열에 넣고 이진 탐색을 쓰면 O(m log n)이지만, 각 비교마다 문자열 전체를 비교해야 한다. 해시맵은 O(1) 조회가 가능하지만 "apple"로 시작하는 모든 단어를 자동완성으로 보여주는 기능은 지원하지 못한다. 일반 Trie는 자동완성을 지원하지만, 알파벳 26개를 위해 노드마다 26개 포인터를 저장해 메모리를 낭비한다.

**삼진 탐색 트리(TST)**는 이 세 가지 문제를 동시에 해결한다. 각 노드가 오직 세 자식(왼쪽/가운데/오른쪽)만 가지므로 BST처럼 메모리 효율적이면서, 트라이처럼 공통 접두사를 공유하여 빠른 접두사 검색이 가능하다. 실제로 GNU Aspell, ispell 같은 철자 검사기가 이 구조를 사용한다.

## 함수 인터페이스

```ts
export class TernarySearchTree {
  insert(word: string): void          // O(m), m = 단어 길이
  search(word: string): boolean       // O(m)
  startsWith(prefix: string): boolean // O(m)
  delete(word: string): boolean       // O(m)
  wordsWithPrefix(prefix: string): string[]  // O(m + k), k = 결과 총 길이
  size(): number                      // O(1)
}
```

## 제약 조건

- 시간 제한: 1초, 메모리 제한: 256 MB
- 단어는 소문자 알파벳 + 빈 문자열 허용
- 중복 삽입 시 size는 증가하지 않음
- 접두사가 단어 자체인 경우 `wordsWithPrefix`에 포함됨

## 문제 상세

### 노드 구조

각 노드는 다음을 저장한다:
- `char`: 이 노드가 담당하는 문자 하나
- `left`: `char`보다 작은 문자가 올 때 이동하는 자식
- `mid`: `char`와 같은 문자 — 다음 문자로 진행
- `right`: `char`보다 큰 문자가 올 때 이동하는 자식
- `isEnd`: 이 노드에서 단어가 끝나는지 여부

### 삽입 원리

단어의 각 문자를 현재 노드의 `char`와 비교한다:
- 작으면 왼쪽 자식으로 이동 (같은 깊이 유지)
- 크면 오른쪽 자식으로 이동 (같은 깊이 유지)
- 같으면 가운데 자식으로 이동하고 다음 문자로 진행

단어의 마지막 문자를 처리한 뒤 `isEnd = true`로 표시한다.

### 삭제 원리

재귀적으로 탐색 후 `isEnd`를 false로 변경. 단, 다른 단어가 공유하는 노드는 제거하지 않는다.

## 예시

```ts
const tst = new TernarySearchTree();
tst.insert("cat");
tst.insert("car");
tst.insert("card");
tst.insert("care");
tst.insert("bat");

tst.search("cat");    // true
tst.search("ca");     // false
tst.startsWith("ca"); // true
tst.startsWith("ba"); // true
tst.startsWith("da"); // false

tst.wordsWithPrefix("car"); // ["car", "card", "care"] (순서 무관)

tst.size();           // 5
tst.delete("card");   // true
tst.search("card");   // false
tst.search("car");    // true  (공유 노드는 유지)
tst.size();           // 4
```
