# Treap (Tree + Heap)

## 중요도 · 난이도

| 항목 | 값 |
|------|-----|
| 중요도 | ★ 하 — 특정 분야·고급 |
| 난이도 | 고급 |

## 함수 인터페이스

```ts
export class Treap {
  constructor();
  insert(x: number): void;
  delete(x: number): void;
  findKth(k: number): number;
}
```

## 제약 조건

- $1 \leq n \leq 10^5$ (원소 수)
- 질의 수 $q \leq 10^5$
- 키 값은 $|x| \leq 10^9$

## 문제 상세

각 노드가 키 $\mathrm{key}$와 무작위 우선순위 $\mathrm{priority}$를 갖고, 키에 대해 BST 조건, 우선순위에 대해 (최대) 힙 조건을 동시에 만족하는 자료구조를 구현하라. 무작위 우선순위 덕분에 기대 깊이가 $O(\log n)$이 되어, 다음 연산을 모두 기대 $O(\log n)$에 처리한다.

1. $\mathrm{insert}(x)$: 키 $x$를 삽입
2. $\mathrm{delete}(x)$: 키 $x$를 삭제 (한 개)
3. $\mathrm{findKth}(k)$: 정렬 순서에서 $1$-기반 $k$번째 키

### 메서드 명세

- `new Treap()` — 비어있는 Treap을 생성한다.
- `insert(x)` — 키 $x$를 삽입한다. 중복을 허용한다.
- `delete(x)` — 키 $x$를 한 개 삭제한다. 존재하지 않으면 아무 일도 하지 않는다.
- `findKth(k)` — 정렬 순서에서 $k$번째 ($1$-기반) 키를 반환한다 ($1 \leq k \leq |T|$).

## 예시

```ts
const t = new Treap();

t.insert(5);
t.insert(2);
t.insert(8);
t.insert(2);            // 중복 허용: 정렬 순서 = [2, 2, 5, 8]

t.findKth(1);           // 2
t.findKth(2);           // 2
t.findKth(3);           // 5
t.findKth(4);           // 8

t.delete(2);            // 정렬 순서 = [2, 5, 8]
t.findKth(1);           // 2
t.findKth(2);           // 5
```
