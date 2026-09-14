/**
 * 결함 fixture — 넣은 키를 줄에 쌓아 두기만 하다가 **다른 연산이 오면 쌓인 것을 한꺼번에**
 * `heap/vanEmdeBoasTree` 정본에 넣는 정수 집합.
 *
 * 정본(`../../heap/vanEmdeBoasTree/_reference/vanEmdeBoasTree.ts`)을 그대로 쓰고 넣기만 미룬다.
 * 자명한 구현이 아니고 **답은 전부 옳다**(축1 통과 — 다른 연산이 먼저 비우므로 밖에서 보이는 상태가
 * 정본과 같다).
 *
 * **이 fixture 는 계약이 일곱 행을 전부 `worst` 로 적어 추가로 배제하는 계열을 재려고 지었다**
 * (§규약1 「강한 한정자의 근거는 추가로 배제되는 계열을 수치로 낸다」). 쌓인 키 하나가 정본에
 * 들어가는 일은 평생 한 번이므로 **호출열 전체의 평균은 정본과 같은 계급**이다.
 *
 * - **걸리는 것 — 원소 수를 키우는 지우기·조회 시나리오.** n 개를 넣은 뒤 오는 첫 호출 하나가
 *   n 개를 한꺼번에 넣는다. `worst` 통계가 최댓값이라 그 한 번이 그대로 보고된다.
 * - **같은 입력을 `amortized` 로 다시 재면 통과한다**(하네스 자기시험 — 넣기 n 번과 조회 n 번을
 *   전부 걸음으로 잰다).
 * - 넣기 시나리오는 통과한다(넣기 자체는 줄에 붙이기라 상수다). 우주를 키우는 두 시나리오도
 *   통과한다 — 준비로 넣는 키가 둘뿐이라 쌓이는 것이 없다.
 *
 * 계측은 정본의 `__cost` 에 이 파일이 줄에 붙인 횟수를 더한 것이다(§규약2 계측 단위 — 줄의 칸
 * 하나에 1).
 */

import { VanEmdeBoasTree } from "../../heap/vanEmdeBoasTree/_reference/vanEmdeBoasTree";

export class FlushingIntegerSet {
  readonly #inner: VanEmdeBoasTree;
  readonly #universe: number;
  readonly #pending: number[] = [];
  #own = 0;

  constructor(universe: number) {
    this.#inner = new VanEmdeBoasTree(universe);
    this.#universe = universe;
  }

  get __cost(): number {
    return this.#inner.__cost + this.#own;
  }

  insert(x: number): void {
    if (!Number.isInteger(x) || x < 0 || x >= this.#universe) {
      throw new RangeError(`우주 밖 키 — ${x}`);
    }
    this.#own += 1;
    this.#pending.push(x);
  }

  delete(x: number): boolean {
    this.#flush();
    return this.#inner.delete(x);
  }

  has(x: number): boolean {
    this.#flush();
    return this.#inner.has(x);
  }

  min(): number | null {
    this.#flush();
    return this.#inner.min();
  }

  max(): number | null {
    this.#flush();
    return this.#inner.max();
  }

  successor(x: number): number | null {
    this.#flush();
    return this.#inner.successor(x);
  }

  predecessor(x: number): number | null {
    this.#flush();
    return this.#inner.predecessor(x);
  }

  #flush(): void {
    for (const x of this.#pending) this.#inner.insert(x);
    this.#pending.length = 0;
  }
}
