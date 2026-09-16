/**
 * 결함 fixture — **물려받은 문제 문서의 설계** 그대로인 머클 나무. 블록 토큰 = `hash(블록)`, 마디 토큰 = `hash(왼쪽 + 오른쪽)`, 칸이
 * 모자라면 **마지막 블록 토큰을 복제해** 2의 거듭제곱으로 채우고, 뿌리 = 꼭대기 토큰, 증명 = 형제 토큰들, 검증은 자리의 홀짝으로 형제를
 * 붙여 뿌리와 견준다(`tree/merkleTree/merkleTree-problem.md` 의 「트리 구성」 · 「검증」).
 *
 * 대상 계약: `tree/merkleTree`.
 *
 * 이 설계는 계약의 **결속**(다른 수열 → 다른 뿌리)과 **검증**(없는 자리는 거짓)을 둘 다 어긴다. 끝 블록을 한 번 더 붙인 수열이 같은
 * 뿌리를 받고(`[a, b, c]` 와 `[a, b, c, c]`), 뿌리가 블록 수를 모르므로 검증이 복제된 자리(자리 3)의 증명을 참으로 받는다. 비트코인 거래
 * 나무에 같은 모양의 약점이 알려져 있다고들 하는데 이 저장소에서 확인하지 않았다. 고치기 · 증명의 범위 검사와 비용 계급은 정본과 같다.
 *
 * 계측은 §규약2 계측 단위 — 해시 한 번 · 칸 하나에 1. 어느 경계 케이스에서 걸리는지는 `_contract/runContract.merkleTree.test.ts` 가
 * 고정한다.
 */

export class DuplicatingLastMerkleTree {
  readonly #hash: (data: string) => string;
  readonly #size: number;
  readonly #capacity: number;
  readonly #nodes: string[];
  __cost = 0;

  constructor(blocks: string[], hash: (data: string) => string) {
    this.#hash = hash;
    this.#size = blocks.length;
    let capacity = 1;
    while (capacity < this.#size) capacity *= 2;
    this.#capacity = capacity;
    this.#nodes = new Array<string>(2 * capacity);
    for (let i = 0; i < this.#size; i++) {
      this.#nodes[capacity + i] = this.#call(blocks[i] as string);
    }
    this.#pad();
    for (let v = capacity - 1; v >= 1; v--) this.#pull(v);
  }

  rootHash(): string {
    this.__cost += 1;
    return this.#nodes[1] as string;
  }

  getProof(index: number): string[] {
    this.#checkIndex(index);
    const tokens: string[] = [];
    for (let v = this.#capacity + index; v > 1; v >>= 1) {
      this.__cost += 1;
      tokens.push(this.#nodes[v ^ 1] as string);
    }
    return tokens;
  }

  verify(root: string, index: number, block: string, proof: string[]): boolean {
    if (!Number.isInteger(index) || index < 0) return false;
    let token = this.#call(block);
    let at = index;
    for (const sibling of proof) {
      this.__cost += 1;
      token =
        at & 1 ? this.#call(sibling + token) : this.#call(token + sibling);
      at >>= 1;
    }
    return at === 0 && token === root;
  }

  update(index: number, block: string): void {
    this.#checkIndex(index);
    this.#nodes[this.#capacity + index] = this.#call(block);
    const touched = new Set<number>([this.#capacity + index]);
    if (index === this.#size - 1) {
      this.#pad();
      for (let i = this.#size; i < this.#capacity; i++) {
        touched.add(this.#capacity + i);
      }
    }
    let level = [...touched];
    while (level.length > 0 && !(level.length === 1 && level[0] === 1)) {
      const parents = new Set<number>();
      for (const v of level) if (v > 1) parents.add(v >> 1);
      for (const parent of parents) this.#pull(parent);
      level = [...parents];
    }
  }

  /** 칸이 남으면 마지막 블록 토큰을 복제한다. 빈 수열은 빈 문자열의 토큰 하나다. */
  #pad(): void {
    const last =
      this.#size === 0
        ? this.#call("")
        : (this.#nodes[this.#capacity + this.#size - 1] as string);
    for (let i = this.#size; i < this.#capacity; i++) {
      this.__cost += 1;
      this.#nodes[this.#capacity + i] = last;
    }
  }

  #pull(v: number): void {
    this.#nodes[v] = this.#call(
      (this.#nodes[2 * v] as string) + (this.#nodes[2 * v + 1] as string),
    );
  }

  #checkIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#size) {
      throw new RangeError(`자리 ${index} 는 범위 밖이다`);
    }
  }

  #call(data: string): string {
    this.__cost += 1;
    return this.#hash(data);
  }
}
