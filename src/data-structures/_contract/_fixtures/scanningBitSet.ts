/**
 * 결함 fixture — 우주 크기만큼의 칸에 키마다 있고 없음을 적고, 이웃은 **한 칸씩 훑어** 찾는
 * 정수 집합.
 *
 * `heap/vanEmdeBoasTree` 계약(`../../heap/vanEmdeBoasTree/vanEmdeBoasTree.ts`)의 자명한 구현이다.
 * **답은 전부 옳다**(축1 통과). 넣기·찾기·양 끝 읽기는 실제로 상수다 — 최소와 최대를 따로 들기
 * 때문이다.
 *
 * 걸리는 것은 **우주를 키우는 시나리오 둘**이다.
 *
 * - **이웃 찾기.** 두 키 사이의 틈을 한 칸씩 지나므로 틈이 우주만큼이면 호출 하나가 u 에
 *   비례한다 — 계약은 $O(\log\log u)$ 를 적었다.
 * - **양 끝을 지우기.** 최소나 최대를 지우면 다음 것을 찾아 칸을 훑는다. 다음 키가 우주 반대편에
 *   있으면 u 에 비례한다.
 *
 * **원소 수를 키우는 시나리오 셋은 통과한다.** 우주가 고정되면 칸 수도 고정이고, 조회 시나리오는
 * 키 범위를 4n 에 묶어 틈이 네 칸 언저리로 고정된다(`vanEmdeBoasTree.contract.ts` 의 그 시나리오
 * 주석). 이 계열이 원소 수와 무관하다는 것은 계약을 지키는 것이 아니라 **계약의 파라미터가 n 이
 * 아니라는 것**의 실물이다.
 *
 * 계측 단위는 §규약2 그대로 — 공개 연산 한 번에 1, 훑으며 지나간 칸 하나에 1, 생성자가 잡은 칸
 * 하나에 1 이다.
 */

export class ScanningBitSet {
  readonly #universe: number;
  readonly #present: Uint8Array;
  #min: number | null = null;
  #max: number | null = null;

  __cost = 0;

  constructor(universe: number) {
    if (!Number.isSafeInteger(universe) || universe < 1) {
      throw new RangeError(`우주 크기가 잘못됐다 — ${universe}`);
    }
    this.#universe = universe;
    this.#present = new Uint8Array(universe);
    this.__cost += universe;
  }

  insert(x: number): void {
    this.#check(x);
    this.__cost += 1;
    this.#present[x] = 1;
    if (this.#min === null || x < this.#min) this.#min = x;
    if (this.#max === null || x > this.#max) this.#max = x;
  }

  delete(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    if (this.#present[x] !== 1) return false;
    this.#present[x] = 0;
    if (this.#min === this.#max) {
      this.#min = null;
      this.#max = null;
    } else if (x === this.#min) {
      this.#min = this.#scanUp(x + 1);
    } else if (x === this.#max) {
      this.#max = this.#scanDown(x - 1);
    }
    return true;
  }

  has(x: number): boolean {
    this.#check(x);
    this.__cost += 1;
    return this.#present[x] === 1;
  }

  min(): number | null {
    this.__cost += 1;
    return this.#min;
  }

  max(): number | null {
    this.__cost += 1;
    return this.#max;
  }

  successor(x: number): number | null {
    this.#check(x);
    this.__cost += 1;
    if (this.#max === null || x >= this.#max) return null;
    return this.#scanUp(x + 1);
  }

  predecessor(x: number): number | null {
    this.#check(x);
    this.__cost += 1;
    if (this.#min === null || x <= this.#min) return null;
    return this.#scanDown(x - 1);
  }

  #check(x: number): void {
    if (!Number.isInteger(x) || x < 0 || x >= this.#universe) {
      throw new RangeError(`우주 밖 키 — ${x}`);
    }
  }

  #scanUp(from: number): number | null {
    for (let y = from; y < this.#universe; y++) {
      this.__cost += 1;
      if (this.#present[y] === 1) return y;
    }
    return null;
  }

  #scanDown(from: number): number | null {
    for (let y = from; y >= 0; y--) {
      this.__cost += 1;
      if (this.#present[y] === 1) return y;
    }
    return null;
  }
}
