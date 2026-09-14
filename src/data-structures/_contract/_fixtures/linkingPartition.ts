/**
 * 결함 fixture — 원소마다 부모를 가리키되 **올라간 길을 줄이지 않는** 분리 집합. 세 가지로 건다.
 *
 * 대상 계약: `disjoint-set/unionFind`.
 *
 * **동작은 옳다.** 축1을 전부 통과한다. 뿌리마다 그 집합의 가장 작은 원소를 들어 `find` 가 계약의
 * 값을 돌려준다. 다른 것은 합칠 때 어느 뿌리를 어느 뿌리 아래에 거는가(`policy`)와, 찾기가 지난 길을
 * 그대로 두는 것이다.
 *
 * | `policy` | 합칠 때 | 계약에 대해 |
 * |---|---|---|
 * | `underSecond` | 앞 인자 쪽 뿌리를 뒤 인자 쪽 뿌리 아래에 건다 | **어긴다.** 큰 집합을 앞 인자로 넘기며 하나씩 붙이면 사슬이 서고 찾기가 원소 수에 비례한다 |
 * | `underFirst` | 뒤 인자 쪽 뿌리를 앞 인자 쪽 뿌리 아래에 건다 | **어긴다.** 위와 거울상이다 — 큰 집합을 뒤 인자로 넘기면 사슬이 선다 |
 * | `byRank` | 높이가 낮은 쪽 뿌리를 높은 쪽 아래에 건다 | **로그 인수만큼 어기고 스위트를 통과한다.** 높이가 원소 수의 로그에 묶여 한 번의 찾기가 로그다. 계약은 역아커만 함수를 적었고 그 차이는 축3의 해상도 아래다(불변 사실 53·62) |
 *
 * 앞의 둘은 **자명한 구현**이다(헤더 「검증 등급」). 거는 방향을 반대로 고르면 걸리는 입력이 반대로
 * 옮겨 가므로, 스위트의 합치기·찾기 시나리오는 두 방향을 한 호출열 안에서 함께 겨눈다. 셋째는
 * `docs/ORD-006-conventions.md` 「`unionFind` 의 Bound 는 늘리지 않는다」가 적은 「경로 압축 없는
 * 구현을 배제하려는 근거는 축이 아니라 가이드가 받는다」의 실물이다.
 *
 * 축3 계측 단위는 정본과 같다 — *"원소 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 공개 연산 한 번에
 * 1, 뿌리를 찾아 올라가며 지나는 원소 하나에 1 이다.
 */

export type LinkingPolicy = "underSecond" | "underFirst" | "byRank";

export class LinkingPartition {
  readonly #policy: LinkingPolicy;
  readonly #parent: number[] = [];
  readonly #height: number[] = [];
  readonly #smallest: number[] = [];

  __cost = 0;

  constructor(n: number, policy: LinkingPolicy) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `원소 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    this.#policy = policy;
    for (let element = 0; element < n; element++) {
      this.#parent.push(element);
      this.#height.push(0);
      this.#smallest.push(element);
    }
  }

  find(x: number): number {
    this.__cost += 1;
    return this.#smallest[this.#root(x)] as number;
  }

  union(x: number, y: number): void {
    this.__cost += 1;
    const left = this.#root(x);
    const right = this.#root(y);
    if (left === right) return;

    let child: number;
    let parent: number;
    if (this.#policy === "underSecond") {
      [child, parent] = [left, right];
    } else if (this.#policy === "underFirst") {
      [child, parent] = [right, left];
    } else {
      [child, parent] =
        (this.#height[left] as number) < (this.#height[right] as number)
          ? [left, right]
          : [right, left];
    }
    this.#parent[child] = parent;
    this.#height[parent] = Math.max(
      this.#height[parent] as number,
      (this.#height[child] as number) + 1,
    );
    this.#smallest[parent] = Math.min(
      this.#smallest[parent] as number,
      this.#smallest[child] as number,
    );
  }

  connected(x: number, y: number): boolean {
    this.__cost += 1;
    return this.#root(x) === this.#root(y);
  }

  /** 뿌리까지 올라간다. **지난 길을 줄이지 않는다** — 이 fixture 가 겨누는 자리가 그것이다. */
  #root(x: number): number {
    if (!Number.isInteger(x) || x < 0 || x >= this.#parent.length) {
      throw new RangeError(
        `원소는 0 이상 ${this.#parent.length} 미만의 정수여야 한다 — 받은 값은 ${x} 이다`,
      );
    }
    let root = x;
    while (this.#parent[root] !== root) {
      this.__cost += 1;
      root = this.#parent[root] as number;
    }
    return root;
  }
}
