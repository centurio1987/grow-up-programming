/**
 * 결함 fixture — 원소마다 **집합 번호표**를 적어 두고, 합칠 때 한쪽 집합의 번호표를 전부 다시 적는
 * 분리 집합. 두 가지로 고른다.
 *
 * 대상 계약: `disjoint-set/unionFind`.
 *
 * **동작은 옳다.** 축1을 전부 통과한다. 번호표마다 그 집합의 원소 목록과 가장 작은 원소를 들어,
 * `find`·`connected` 는 번호표 하나를 읽는 상수다. 걸리는 자리는 `union` 이고, 어느 쪽을 다시 적는가
 * (`policy`)가 걸리는지를 가른다.
 *
 * | `policy` | 합칠 때 다시 적는 쪽 | 계약에 대해 |
 * |---|---|---|
 * | `first` | 앞 인자의 집합 | **어긴다.** 큰 집합을 앞 인자로 넘기며 하나씩 붙이면 호출마다 그 집합 전부를 다시 적는다 |
 * | `smaller` | 원소가 적은 쪽 | **로그 인수만큼 어기고 스위트를 통과한다.** 한 원소가 다시 적힐 때마다 그 원소의 집합이 두 배 이상이 되므로 원소마다 로그 번 — 합치기의 상각이 로그다. 계약은 역아커만 함수를 적었고 그 차이는 축3의 해상도 아래다(불변 사실 53·62) |
 *
 * `first` 는 **자명한 구현**이다(헤더 「검증 등급」). `smaller` 는 `tree/linkCutTree` 의
 * `_fixtures/relabelingForest.ts` 와 같은 설계에서 **빼기를 뗀 것**이고, 저쪽에서 걸렸던 `cut` 이 이 계약에
 * 없으므로 여기서는 어느 행에서도 다항 계급으로 걸리지 않는다.
 *
 * 축3 계측 단위는 정본과 같다 — *"원소 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 공개 연산 한 번에
 * 1, 다시 적는 번호표 하나에 1 이다.
 */

export type RelabelingPolicy = "first" | "smaller";

export class RelabelingPartition {
  readonly #policy: RelabelingPolicy;
  /** 원소마다 집합 번호표. 번호표는 처음에 그 집합을 이룬 원소의 번호다. */
  readonly #label: number[] = [];
  /** 번호표마다 그 집합의 원소들. 쓰이지 않는 번호표는 빈 배열이다. */
  readonly #members: number[][] = [];
  /** 번호표마다 그 집합의 가장 작은 원소. */
  readonly #smallest: number[] = [];

  __cost = 0;

  constructor(n: number, policy: RelabelingPolicy) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `원소 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    this.#policy = policy;
    for (let element = 0; element < n; element++) {
      this.#label.push(element);
      this.#members.push([element]);
      this.#smallest.push(element);
    }
  }

  find(x: number): number {
    this.__cost += 1;
    return this.#smallest[this.#labelOf(x)] as number;
  }

  union(x: number, y: number): void {
    this.__cost += 1;
    const left = this.#labelOf(x);
    const right = this.#labelOf(y);
    if (left === right) return;

    const leftMembers = this.#members[left] as number[];
    const rightMembers = this.#members[right] as number[];
    const [from, into] =
      this.#policy === "first" || leftMembers.length < rightMembers.length
        ? [left, right]
        : [right, left];

    const moving = this.#members[from] as number[];
    const staying = this.#members[into] as number[];
    for (const element of moving) {
      this.__cost += 1;
      this.#label[element] = into;
      staying.push(element);
    }
    this.#members[from] = [];
    this.#smallest[into] = Math.min(
      this.#smallest[into] as number,
      this.#smallest[from] as number,
    );
  }

  connected(x: number, y: number): boolean {
    this.__cost += 1;
    return this.#labelOf(x) === this.#labelOf(y);
  }

  #labelOf(x: number): number {
    if (!Number.isInteger(x) || x < 0 || x >= this.#label.length) {
      throw new RangeError(
        `원소는 0 이상 ${this.#label.length} 미만의 정수여야 한다 — 받은 값은 ${x} 이다`,
      );
    }
    return this.#label[x] as number;
  }
}
