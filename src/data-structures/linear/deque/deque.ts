/**
 * Deque — 한 수열의 양 끝에서 넣고 빼는 컨테이너.
 *
 * **목적.** 삽입·제거·조회를 수열의 두 끝으로 제한해, 어느 쪽 끝이든 원소 수와 무관한
 * 비용으로 다루는 것.
 * 임의 위치 접근·탐색·순회는 이 계약에 없다. 담긴 원소 수를 읽는 일과 비었는지 묻는 일도 없다.
 *
 * **뺀 두 행의 판정은 목적 항목 밖에 적는다.** `size()` · `isEmpty()` 는 원칙 A 판정표 ③ 의
 * 판정으로 뺐다 — 판정 줄과 목적 인용은 `docs/ORD-006-conventions.md` 「판정표 ③ 의 103 행을
 * 묶어 판정했다」 절에, 행 단위 대장은 `tools/_baseline/principle-a-verdicts.tsv` 에 있다.
 * 판정의 결론을 목적 문단 안에 적으면 다음 판정이 자기 메아리를 근거로 읽는다(§원칙 A A5′-2).
 *
 * **불변식.** 없다. 각 연산의 의미가 각각 옳으면 따로 깨질 수 있는 상태 성질이 남지 않는다.
 * 앞과 뒤가 같은 수열의 두 끝이라는 사실은 아래 `peekFront`·`peekBack`의 의미가 그대로
 * 정의한다.
 *
 * **연산 계약.** 상한은 원소 수 n 에 대한 것이다.
 *
 * | 연산 | 의미 | 상한 | 한정자 |
 * |---|---|---|---|
 * | `pushFront(item)` | `item`을 앞 끝에 놓는다. 직후 `peekFront()`는 `item`을 돌려준다 | O(1) | amortized |
 * | `pushBack(item)` | `item`을 뒤 끝에 놓는다. 직후 `peekBack()`은 `item`을 돌려준다 | O(1) | amortized |
 * | `popFront()` | 앞 끝 원소를 제거하고 돌려준다. 비어 있으면 `null`, 상태는 불변 | O(1) | amortized |
 * | `popBack()` | 뒤 끝 원소를 제거하고 돌려준다. 비어 있으면 `null`, 상태는 불변 | O(1) | amortized |
 * | `peekFront()` | 앞 끝 원소를 제거하지 않고 돌려준다. 비어 있으면 `null` | O(1) | worst |
 * | `peekBack()` | 뒤 끝 원소를 제거하지 않고 돌려준다. 비어 있으면 `null` | O(1) | worst |
 *
 * 넣고 빼기가 `amortized`인 것은 용량을 늘리는 구현을 배제하지 않기 위해서다. 개별 호출
 * 하나가 상수를 넘겨도 n 회의 총비용이 O(n)이면 계약을 지킨 것이다.
 *
 * **주입 정책.** 없다. `T`는 임의 타입이고 비교·해시·동등성을 쓰지 않으므로 주입할 것이 없다.
 * 빈 덱에서 `pop`·`peek`은 예외를 던지지 않고 `null`을 돌려준다 — 이 선택은 계약의 일부이며,
 * 그 대가로 `T`에 `null`이 섞이면 "비어 있음"과 "값이 `null`인 원소"가 구분되지 않는다.
 *
 * **검증 등급.** `complexity`.
 * 상한이 자명한 구현으로 달성되지 않는다. 반례는 배열 하나에 `unshift`·`shift`를 쓰는
 * 구현이다 — `pushFront`·`popFront`가 뒤 원소 전부를 옮기므로 O(n)이 된다. 양쪽 끝을 모두
 * 상수 비용으로 두려면 상각 설계가 필요하다.
 *
 * **필요충분조건.**
 * - 의미: 양 끝이 **같은 수열의 두 끝**이 아니면 덱이 아니다. 한쪽 끝만 열려 있으면 스택이고,
 *   넣는 끝과 빼는 끝이 서로 고정되면 큐다.
 * - 비용: 양쪽이 다 열려 있더라도 어느 한쪽 연산이 원소 수에 비례하면 덱이 아니다. 그건
 *   앞뒤로 읽을 수 있는 배열일 뿐이고, 양쪽을 쓰는 알고리즘이 그 자리에서 한 차수 느려진다.
 */
export class Deque<T> {
  pushFront(item: T): void {
    throw new Error("Not implemented");
  }

  pushBack(item: T): void {
    throw new Error("Not implemented");
  }

  popFront(): T | null {
    throw new Error("Not implemented");
  }

  popBack(): T | null {
    throw new Error("Not implemented");
  }

  peekFront(): T | null {
    throw new Error("Not implemented");
  }

  peekBack(): T | null {
    throw new Error("Not implemented");
  }
}
