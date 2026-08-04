/**
 * Stack — 한쪽 끝에서만 넣고 빼는 LIFO 컨테이너.
 *
 * **목적.** 삽입·제거·조회를 컨테이너의 한쪽 끝(top)으로 제한해, 가장 최근에 넣은 원소를
 * 원소 수와 무관한 비용으로 꺼내는 것.
 * 임의 위치 접근·탐색·순회는 이 계약에 없다.
 *
 * **불변식.** 없다. 각 연산의 의미가 각각 옳으면 따로 깨질 수 있는 상태 성질이 남지 않는다.
 * LIFO 순서는 아래 `pop`·`peek`의 의미가 그대로 정의한다.
 *
 * **연산 계약.** 상한은 원소 수 n 에 대한 것이다.
 *
 * | 연산 | 의미 | 상한 | 한정자 |
 * |---|---|---|---|
 * | `push(item)` | `item`을 top 에 놓는다. 직후 `peek()`은 `item`을 돌려준다 | O(1) | amortized |
 * | `pop()` | top 원소를 제거하고 돌려준다. 비어 있으면 `null`, 상태는 불변 | O(1) | amortized |
 * | `peek()` | top 원소를 제거하지 않고 돌려준다. 비어 있으면 `null` | O(1) | worst |
 * | `isEmpty()` | `size() === 0` 과 같다 | O(1) | worst |
 * | `size()` | 현재 원소 수 | O(1) | worst |
 *
 * `amortized O(1)`은 n 회 연산의 총비용이 O(n)이라는 뜻이다. 개별 `push` 한 번이 상수를
 * 넘겨도(예: 용량 확장) 계약 위반이 아니다.
 *
 * **주입 정책.** 없다. `T`는 임의 타입이고 비교·해시·동등성을 쓰지 않으므로 주입할 것이 없다.
 * 빈 스택에서 `pop`·`peek`은 예외를 던지지 않고 `null`을 돌려준다 — 이 선택은 계약의
 * 일부이며, 그 대가로 `T`에 `null`이 섞이면 "비어 있음"과 "값이 `null`인 원소"가 구분되지
 * 않는다.
 *
 * **검증 등급.** `basic`.
 * 상한이 자명한 구현(배열 끝 조작)으로 달성되고, 불변식 절이 비어 있다.
 *
 * **필요충분조건.**
 * - 의미: 꺼내는 순서가 넣은 순서의 역순이 아니면 스택이 아니다. 넣은 순서대로 나오면 큐이고,
 *   순서를 약속하지 않으면 가방(bag)이다.
 * - 비용: 역순을 지키더라도 `push`·`pop`이 원소 수에 비례하는 비용을 쓰면 스택이 아니다.
 *   그건 한쪽 끝으로 접근을 제한한 리스트일 뿐이다.
 */
export class Stack<T> {
  push(item: T): void {
    throw new Error("Not implemented");
  }

  pop(): T | null {
    throw new Error("Not implemented");
  }

  peek(): T | null {
    throw new Error("Not implemented");
  }

  isEmpty(): boolean {
    throw new Error("Not implemented");
  }

  size(): number {
    throw new Error("Not implemented");
  }
}
