/**
 * 결함 fixture — `tree/merkleTree` 정본과 **같은 토큰 모양**(블록 `L` · 마디 `N` + 왼쪽 길이 · 빈 칸 `E` · 뿌리 `R` + n)으로 짓되, **위층을 언제
 * 다시 짓는가**만 갈아 끼운다.
 *
 * 대상 계약: `tree/merkleTree`.
 *
 * 토큰 모양과 검증이 정본(`tree/merkleTree/_reference/merkleTree.ts`)과 같아 답은 어느 규칙에서도 전부 옳다(축1 통과). 규칙 하나가 결함 계열
 * 하나이고, 같은 코드를 벌마다 파일로 나누지 않으려고 한 파일에 둔다(`levelRuleSkipList.ts` 와 같은 모양).
 *
 * | 규칙 | 무엇 | 이 계약에서 |
 * |---|---|---|
 * | `eagerRebuild` | 고칠 때마다 위층 전부를 다시 짓는다 | 자명한 구현 — 고치기가 블록 수에 비례한다 |
 * | `leafOnly` | 블록 토큰만 들고, 뿌리 · 증명을 읽을 때마다 위층 전부를 다시 짓는다 | 자명한 구현 — 읽기가 블록 수에 비례한다 |
 * | `dirtyPaths` | 고친 자리만 적어 두고(상수), 다음 읽기가 적어 둔 자리의 길을 한꺼번에 다시 짓는다 | 뒤 호출로 미루는 계열(T1-06 첫째) — 고친 뒤 첫 읽기가 고친 수에 비례한다. 호출열 평균은 정본과 같은 계급이다 |
 * | `flushWhenFull` | 고친 것을 쌓아 두다 블록 칸 수의 1/64 이 차거나 읽을 때 위층 전부를 다시 짓는다 | 이따금 비싼 고치기 — 단일 호출 최대로만 걸린다 |
 * | `deferredBuild` | 생성자는 블록을 베껴 두기만 하고 첫 읽기가 나무를 짓는다(그 전의 고치기는 사본을 고친다) | 짓기를 첫 읽기로 미루는 계열 — 짓자마자 읽는 첫 걸음에서 걸린다 |
 *
 * 계측은 §규약2 계측 단위 — 정본과 같은 자리(해시 한 번 · 칸 하나)에 1. 어느 시나리오에서 걸리는지는
 * `_contract/runContract.merkleTree.test.ts` 가 고정한다.
 */

export type RecomputeRule =
  | "eagerRebuild"
  | "leafOnly"
  | "dirtyPaths"
  | "flushWhenFull"
  | "deferredBuild";

export class RecomputeRuleMerkleTree {
  readonly #hash: (data: string) => string;
  readonly #rule: RecomputeRule;
  readonly #size: number;
  readonly #capacity: number;
  readonly #nodes: string[];
  #root = "";
  /** `dirtyPaths` — 고친 블록 칸 번호. */
  #dirty: number[] = [];
  /** `flushWhenFull` — 쌓아 둔 고치기. */
  #pending: [number, string][] = [];
  /** `deferredBuild` — 아직 짓지 않은 블록 사본. */
  #copy: string[] | null = null;
  __cost = 0;

  constructor(
    blocks: string[],
    hash: (data: string) => string,
    rule: RecomputeRule,
  ) {
    this.#hash = hash;
    this.#rule = rule;
    this.#size = blocks.length;
    let capacity = 1;
    while (capacity < this.#size) capacity *= 2;
    this.#capacity = capacity;
    this.#nodes = new Array<string>(2 * capacity);
    if (rule === "deferredBuild") {
      this.#copy = [];
      for (const block of blocks) {
        this.__cost += 1;
        this.#copy.push(block);
      }
      return;
    }
    this.#fillLeaves(blocks);
    if (rule !== "leafOnly") this.#rebuild();
  }

  rootHash(): string {
    this.#settle();
    this.__cost += 1;
    return this.#root;
  }

  getProof(index: number): string[] {
    this.#checkIndex(index);
    this.#settle();
    const tokens = [`#${this.#size}`];
    for (let v = this.#capacity + index; v > 1; v >>= 1) {
      this.__cost += 1;
      tokens.push(this.#nodes[v ^ 1] as string);
    }
    return tokens;
  }

  verify(root: string, index: number, block: string, proof: string[]): boolean {
    const head = proof[0];
    if (head === undefined || !/^#(0|[1-9]\d*)$/.test(head)) return false;
    const size = Number(head.slice(1));
    if (!Number.isInteger(index) || index < 0 || index >= size) return false;
    let capacity = 1;
    let levels = 0;
    while (capacity < size) {
      capacity *= 2;
      levels += 1;
    }
    if (proof.length !== levels + 1) return false;
    let token = this.#call(`L${block}`);
    let v = capacity + index;
    for (let k = 1; k <= levels; k++) {
      this.__cost += 1;
      const sibling = proof[k] as string;
      token = v & 1 ? this.#join(sibling, token) : this.#join(token, sibling);
      v >>= 1;
    }
    return this.#call(`R${size}:${token}`) === root;
  }

  update(index: number, block: string): void {
    this.#checkIndex(index);
    if (this.#copy !== null) {
      this.__cost += 1;
      this.#copy[index] = block;
      return;
    }
    if (this.#rule === "flushWhenFull") {
      this.__cost += 1;
      this.#pending.push([index, block]);
      if (this.#pending.length >= Math.max(1, this.#capacity >> 6)) {
        this.#flush();
      }
      return;
    }
    this.#nodes[this.#capacity + index] = this.#call(`L${block}`);
    if (this.#rule === "eagerRebuild") {
      this.#rebuild();
    } else if (this.#rule === "dirtyPaths") {
      this.__cost += 1;
      this.#dirty.push(this.#capacity + index);
    } else if (this.#rule === "deferredBuild") {
      for (let v = (this.#capacity + index) >> 1; v >= 1; v >>= 1) {
        this.__cost += 1;
        this.#nodes[v] = this.#join(
          this.#nodes[2 * v] as string,
          this.#nodes[2 * v + 1] as string,
        );
      }
      this.#root = this.#call(`R${this.#size}:${this.#nodes[1] as string}`);
    }
  }

  #settle(): void {
    if (this.#copy !== null) {
      const blocks = this.#copy;
      this.#copy = null;
      this.#fillLeaves(blocks);
      this.#rebuild();
      return;
    }
    if (this.#rule === "flushWhenFull") {
      if (this.#pending.length > 0) this.#flush();
      return;
    }
    if (this.#rule === "dirtyPaths") {
      if (this.#dirty.length === 0) return;
      let level = this.#dirty;
      this.#dirty = [];
      while (level.length > 0 && !(level.length === 1 && level[0] === 1)) {
        const parents = new Set<number>();
        for (const v of level) {
          this.__cost += 1;
          if (v > 1) parents.add(v >> 1);
        }
        for (const parent of parents) {
          this.#nodes[parent] = this.#join(
            this.#nodes[2 * parent] as string,
            this.#nodes[2 * parent + 1] as string,
          );
        }
        level = [...parents];
      }
      this.#root = this.#call(`R${this.#size}:${this.#nodes[1] as string}`);
      return;
    }
    if (this.#rule === "leafOnly") this.#rebuild();
  }

  #flush(): void {
    for (const [index, block] of this.#pending) {
      this.__cost += 1;
      this.#nodes[this.#capacity + index] = this.#call(`L${block}`);
    }
    this.#pending = [];
    this.#rebuild();
  }

  #fillLeaves(blocks: string[]): void {
    const empty = this.#call("E");
    for (let i = 0; i < this.#capacity; i++) {
      this.__cost += 1;
      this.#nodes[this.#capacity + i] =
        i < this.#size ? this.#call(`L${blocks[i] as string}`) : empty;
    }
  }

  #rebuild(): void {
    for (let v = this.#capacity - 1; v >= 1; v--) {
      this.#nodes[v] = this.#join(
        this.#nodes[2 * v] as string,
        this.#nodes[2 * v + 1] as string,
      );
    }
    this.#root = this.#call(`R${this.#size}:${this.#nodes[1] as string}`);
  }

  #checkIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#size) {
      throw new RangeError(`자리 ${index} 는 범위 밖이다`);
    }
  }

  #join(left: string, right: string): string {
    return this.#call(`N${left.length}:${left}${right}`);
  }

  #call(data: string): string {
    this.__cost += 1;
    return this.#hash(data);
  }
}
