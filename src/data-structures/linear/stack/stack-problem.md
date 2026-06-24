# Stack (스택)

## 한 줄 요약

> 마지막에 넣은 것을 먼저 꺼내는 LIFO(Last-In-First-Out) 자료구조.

## 스토리

소현은 텍스트 에디터를 만들고 있다. 사용자가 글자를 입력하거나 삭제할 때마다 그 동작을 기록해 두었다가, Ctrl+Z를 누르면 가장 최근 동작부터 순서대로 되돌려야 한다. 예를 들어 "Hello"를 입력한 뒤 "World"를 추가했다면, 첫 번째 Ctrl+Z는 "World" 입력을 취소하고, 두 번째 Ctrl+Z는 "Hello" 입력을 취소해야 한다.

소현은 동작 기록을 배열에 저장하고 매번 앞에서부터 뒤로 탐색해 최근 동작을 찾으려 했다. 그런데 문서가 길어질수록 Ctrl+Z를 누를 때마다 에디터가 버벅였다. 문서 편집 동작이 최대 $10^6$번에 달하는 상황에서 O(n) 탐색은 너무 느렸다.

"가장 최근 동작"만 필요하다면, 동작을 쌓아두고 맨 위만 꺼내면 된다. 스택은 이 직관을 그대로 구현한다. push로 동작을 기록하고, pop으로 최근 동작을 O(1)에 꺼낸다. 에디터의 undo 기능뿐 아니라, 브라우저 뒤로가기·함수 호출 스택·괄호 짝 맞추기 등 "가장 최근 것을 먼저 처리"해야 하는 모든 상황에서 스택이 빛을 발한다.

## 함수 인터페이스

```ts
export class Stack<T> {
  push(item: T): void;
  pop(): T | undefined;
  peek(): T | undefined;
  isEmpty(): boolean;
  size(): number;
}
```

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `push(item)` | 아이템을 스택 맨 위에 추가한다 | `void` |
| `pop()` | 맨 위 아이템을 제거하고 반환한다. 비어있으면 `undefined` | `T \| undefined` |
| `peek()` | 맨 위 아이템을 제거하지 않고 반환한다. 비어있으면 `undefined` | `T \| undefined` |
| `isEmpty()` | 스택이 비어있으면 `true` 반환 | `boolean` |
| `size()` | 현재 아이템 개수 반환 | `number` |

## 제약 조건

- $1 \leq n \leq 10^6$ (총 연산 횟수)
- 모든 연산은 O(1) amortized 이내에 처리되어야 한다
- 시간 제한: 1초, 메모리 제한: 256 MB
- 타입 파라미터 `T`는 임의의 타입을 허용한다

## 문제 상세

제네릭 스택 `Stack<T>`를 구현하라. 스택은 LIFO(Last-In-First-Out) 원칙을 따른다. 즉, 가장 마지막에 삽입된 원소가 가장 먼저 제거된다.

내부 저장소는 자유롭게 선택할 수 있지만, `push` / `pop` / `peek` 세 연산 모두 최악의 경우 O(1) 또는 amortized O(1)이어야 한다. `isEmpty()`와 `size()`는 O(1)이어야 한다.

`pop()`과 `peek()`은 스택이 비어있을 때 예외를 던지지 않고 `undefined`를 반환한다.

## 예시

```ts
const stack = new Stack<number>();

stack.isEmpty(); // true
stack.size();    // 0

stack.push(1);
stack.push(2);
stack.push(3);

stack.peek();    // 3  (제거 없이 조회)
stack.size();    // 3

stack.pop();     // 3
stack.pop();     // 2
stack.peek();    // 1
stack.size();    // 1

stack.pop();     // 1
stack.pop();     // undefined  (빈 스택에서 pop)
stack.isEmpty(); // true
```
