/**
 * 결함 fixture — 원소마다 부모를 가리키고, **바꾼 칸을 전부 기록해** 합치기 호출을 뒤에서부터
 * 되돌리는 분리 집합. 거는 규칙(`link`)과 지난 길을 줄이는가(`compress`)를 고른다.
 *
 * 대상 계약: `disjoint-set/disjointSetRollback`.
 *
 * **동작은 옳다.** 축1을 전부 통과한다. 뿌리마다 그 집합의 가장 작은 원소를 든다. 바꾸는 칸(부모 ·
 * 크기 · 가장 작은 원소)은 바꾸기 전 값을 기록 줄에 쌓고, 합치기 호출이 시작될 때 표지 하나를 쌓는다.
 * 되돌리기는 표지 하나를 꺼낼 때까지 줄을 거꾸로 되쓴다.
 *
 * **줄이기의 기록이 어느 호출 몫인가가 이 fixture 의 요점이다.** 합치기 호출 안의 찾기가 줄인 칸은
 * 그 호출의 표지보다 **먼저** 쌓이므로 앞 호출 몫이 되어, 이 호출을 되돌려도 남는다(그 줄이기는 앞
 * 호출까지의 간선만 쓰므로 남아도 옳다). 찾기·묻기 호출이 줄인 칸은 마지막 표지 **뒤에** 쌓이므로
 * 마지막 합치기를 되돌릴 때 함께 되돌려진다.
 *
 * | `link` | `compress` | 계약에 대해 |
 * |---|---|---|
 * | `underSecond` · `underFirst` | 끔 | **어긴다.** 큰 집합을 한쪽 인자로 넘기며 하나씩 붙이면 사슬이 서고 찾기가 원소 수에 비례한다. 자명한 구현이다 |
 * | `underSecond` · `underFirst` | 켬 | **어긴다 — 되돌리기가 든 시나리오에서만 걸린다.** 되돌리기가 없는 호출열에서는 줄이기가 사슬을 한 번 훑고 펴 두어 상각이 선다. 마지막 합치기 뒤에 깊은 원소를 묻고 되돌리고 같은 합치기를 다시 하면, 편 것이 되돌려져 같은 사슬을 거듭 훑는다 |
 * | `bySize` | 켬 | **지킨다.** 높이가 원소 수의 로그에 묶여 찾기가 호출마다 로그 안이고, 되돌리기 한 번이 되쓰는 칸은 그 전에 찾기들이 줄인 칸 수라 호출열 전체로는 상수다 — 되돌리기 **한 호출**은 원소 수에 비례할 수 있다 |
 *
 * 셋째 줄은 결함이 아니라 **`docs/ORD-006-conventions.md` B19 의 「경로를 압축하는 구현은 앞을 만족하고
 * 뒤를 만족하지 못한다 — 압축이 이전 상태를 지운다」가 계약의 문장이 아니라는 실물**이다. 줄인 칸을
 * 기록하면 지운 것이 없다. 이 파일에 두는 이유는 같은 설계에서 거는 규칙 하나만 바꾼 둘째 줄과 나란히
 * 재기 위해서다.
 *
 * 축3 계측 단위는 정본과 같다 — *"원소 하나를 지나갈 때마다 1"*(§규약2 계측 단위). 공개 연산 한 번에
 * 1, 뿌리를 찾아 올라가며 지나는 원소 하나에 1, 되돌리기가 되쓰는 기록 한 칸에 1 이다. 줄이는 두 번째
 * 걸음은 첫 걸음이 지난 원소를 다시 쓰는 것이라 따로 세지 않는다(`unionFind` 정본과 같다).
 */

export type ForestLink = "underSecond" | "underFirst" | "bySize";

/** 기록 줄의 칸. `mark` 는 합치기 호출의 시작이다. */
type Entry =
  | { kind: "mark" }
  | { kind: "parent" | "size" | "smallest"; at: number; was: number };

export class LoggingForest {
  readonly #link: ForestLink;
  readonly #compress: boolean;
  readonly #parent: number[] = [];
  readonly #size: number[] = [];
  readonly #smallest: number[] = [];
  readonly #log: Entry[] = [];
  /** 줄에 든 표지 수 — 되돌릴 합치기 호출의 수다. */
  #marks = 0;

  __cost = 0;

  constructor(n: number, link: ForestLink, compress: boolean) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `원소 수는 0 이상의 정수여야 한다 — 받은 값은 ${n} 이다`,
      );
    }
    this.#link = link;
    this.#compress = compress;
    for (let element = 0; element < n; element++) {
      this.#parent.push(element);
      this.#size.push(1);
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
    this.#log.push({ kind: "mark" });
    this.#marks += 1;
    if (left === right) return;

    let child: number;
    let parent: number;
    if (this.#link === "underSecond") {
      [child, parent] = [left, right];
    } else if (this.#link === "underFirst") {
      [child, parent] = [right, left];
    } else {
      [child, parent] =
        (this.#size[left] as number) < (this.#size[right] as number)
          ? [left, right]
          : [right, left];
    }
    this.#write("parent", child, parent);
    this.#write(
      "size",
      parent,
      (this.#size[parent] as number) + (this.#size[child] as number),
    );
    this.#write(
      "smallest",
      parent,
      Math.min(
        this.#smallest[parent] as number,
        this.#smallest[child] as number,
      ),
    );
  }

  connected(x: number, y: number): boolean {
    this.__cost += 1;
    return this.#root(x) === this.#root(y);
  }

  rollback(): boolean {
    this.__cost += 1;
    if (this.#marks === 0) return false;
    for (;;) {
      const entry = this.#log.pop();
      if (entry === undefined || entry.kind === "mark") break;
      this.__cost += 1;
      const column =
        entry.kind === "parent"
          ? this.#parent
          : entry.kind === "size"
            ? this.#size
            : this.#smallest;
      column[entry.at] = entry.was;
    }
    this.#marks -= 1;
    return true;
  }

  #write(kind: "parent" | "size" | "smallest", at: number, value: number) {
    const column =
      kind === "parent"
        ? this.#parent
        : kind === "size"
          ? this.#size
          : this.#smallest;
    this.#log.push({ kind, at, was: column[at] as number });
    column[at] = value;
  }

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
    if (this.#compress) {
      let at = x;
      while (at !== root) {
        const next = this.#parent[at] as number;
        if (next !== root) this.#write("parent", at, root);
        at = next;
      }
    }
    return root;
  }
}
