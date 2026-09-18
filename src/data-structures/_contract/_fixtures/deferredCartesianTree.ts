/**
 * 결함 fixture — `tree/cartesianTree` 정본을 그대로 쓰되 **생성자는 받은 수열을 베껴 두기만 하고 첫 질의가 트리를 짓는** 구현.
 *
 * 대상 계약: `tree/cartesianTree`.
 *
 * 불변 사실 52 ③(계약이 구성 시점을 정한다)이 막는 계열의 실물이고, `range-query/sparseTable` 의 `deferredSparseTable.ts` 와 같은
 * 자리다. 생성자는 자리 수에 비례하는 베끼기뿐이라 구성 상한 `O(n)` 안이고(1,024 · 4,096 · 16,384 — 정본의 3,061 · 12,274 · 49,131
 * 보다 **싸다**), 처음 불린 질의 하나가 트리를 통째로 지어 훑기 상한 `O(1)` 을 어긴다. 그 뒤 질의는 정본 그대로 상수다. 답은 전부
 * 옳다(축1 통과).
 *
 * **이 계약에서는 걸리는 자리가 `sparseTable` 보다 넓고 통과하는 자리가 더 강하다.** 훑기 시나리오가 둘이고 둘 다 첫 걸음에서 트리를
 * 짓게 되므로 **둘 다 걸린다**(무작위 3,063 · 12,276 · 49,133 / 사슬 2,049 · 8,193 · 32,769 — 둘 다 $r$ = 4.00). 반면 호출 평균은
 * 저쪽처럼 「로그를 따라 자라 해상도 아래」가 아니라 **상수로 고정된다** — `amortized` 5.19 · 5.16 · 5.13 / 4.51 · 4.50 · 4.50 ·
 * `expected` 5.17 · 5.16 · 5.15 / 4.50 · 4.50 · 4.50(정본은 2.20 · 2.16 · 2.14 / 2.51 · 2.50 · 2.50 과 2.19 · 2.16 · 2.15 / 2.50 ·
 * 2.50 · 2.50). 지은 몫이 선형인데 그것을 나눠 갚을 걸음이 n 개라서다. 그러니 이 계열은 **약한 읽기 둘을 실제로 지키고**, 그것을
 * 배제하는 축은 `worst` 하나다. `inOrder` 시나리오는 그 행의 상한이 `O(n)` 이라 통과한다(4,095 · 16,383 ·
 * 65,535). 헤더 「다섯 연산이 모두 `worst` 인 근거」 문단이 이 수치를 쓰고, 자기시험은 `../runContract.cartesianTree.test.ts` 다.
 *
 * 계측은 이 파일의 몫(베끼는 자리 하나에 1)에 안쪽 정본의 `__cost` 를 더한 것이다(§규약2 계측 단위). 부분트리 객체를 이 파일이 따로
 * 감싸지 않는 것은 정본의 부분트리가 **뿌리의 칸**을 올리기 때문이다 — 걸음의 비용이 안쪽 정본의 `__cost` 에 그대로 잡힌다.
 */

import { CartesianTree } from "../../tree/cartesianTree/_reference/cartesianTree";

export class DeferredCartesianTree<T> {
  readonly #copy: T[];
  readonly #comparator: ((a: T, b: T) => number) | undefined;
  #inner: CartesianTree<T> | null = null;
  #own = 0;

  constructor(seq: readonly T[], comparator?: (a: T, b: T) => number) {
    this.#comparator = comparator;
    this.#copy = new Array<T>(seq.length);
    for (let i = 0; i < seq.length; i++) {
      this.#own += 1;
      this.#copy[i] = seq[i] as T;
    }
  }

  get __cost(): number {
    return this.#own + (this.#inner?.__cost ?? 0);
  }

  value(): T | null {
    return this.#build().value();
  }

  left(): CartesianTree<T> | null {
    return this.#build().left();
  }

  right(): CartesianTree<T> | null {
    return this.#build().right();
  }

  inOrder(): T[] {
    return this.#build().inOrder();
  }

  /** 처음 불린 질의가 트리를 짓는다. 그 뒤로는 정본 객체를 그대로 돌려준다. */
  #build(): CartesianTree<T> {
    if (this.#inner === null)
      this.#inner = new CartesianTree<T>(this.#copy, this.#comparator);
    return this.#inner;
  }
}
