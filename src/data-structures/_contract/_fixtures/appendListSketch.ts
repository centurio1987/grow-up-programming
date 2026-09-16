/**
 * 결함 fixture — `probabilistic/hyperLogLog` 계약의 비용 행 둘(`count` · `merge`)을 어기는 **정확한** 구현.
 *
 * 넣은 원소를 중복째로 배열 끝에 붙이기만 하고(`add` 상수), 추정을 물을 때마다 배열 전체를 훑어 서로 다른 원소를 센다. 합치기는
 * 두 배열의 서로 다른 원소를 옮긴 새 배열이다. 추정이 늘 정확해 오차 판정과 결정적인 쪽을 전부 통과하고, `count` 와 `merge` 가 들어온 원소
 * 수 n 에 비례해 두 시나리오에서 걸린다 — 넣을 때 아끼고 물을 때 몰아 세는 계열이다.
 *
 * 계측 단위는 정본과 같다(§규약2 계측 단위) — 배열 칸 하나를 지날 때마다 1.
 */

export class AppendListSketch {
  __cost = 0;
  readonly #items: string[] = [];
  readonly #epsilon: number;
  readonly #delta: number;

  constructor(epsilon: number, delta: number) {
    if (!(epsilon > 0 && epsilon < 1)) throw new RangeError(`ε ${epsilon}`);
    if (!(delta > 0 && delta < 1)) throw new RangeError(`δ ${delta}`);
    this.#epsilon = epsilon;
    this.#delta = delta;
    this.__cost += 1;
  }

  add(item: string): void {
    this.__cost += 1;
    this.#items.push(item);
  }

  count(): number {
    this.__cost += this.#items.length + 1;
    return new Set(this.#items).size;
  }

  merge(other: AppendListSketch): AppendListSketch {
    if (other.#epsilon !== this.#epsilon || other.#delta !== this.#delta)
      throw new RangeError("매개변수가 다르다");
    // 서로 다른 원소만 옮긴다 — 중복째 이어 붙이면 자기 자신과 거듭 합칠 때 길이가 두 배씩 는다.
    const merged = new AppendListSketch(this.#epsilon, this.#delta);
    for (const item of new Set([...this.#items, ...other.#items]))
      merged.#items.push(item);
    this.__cost += this.#items.length + other.#items.length + 1;
    return merged;
  }
}
