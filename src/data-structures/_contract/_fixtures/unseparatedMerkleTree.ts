/**
 * 결함 fixture — `tree/merkleTree` 정본과 같되 **해시에 넘기는 문자열에 갈래 표시와 경계가 없는** 구현. 블록 토큰 = `hash(블록)`, 마디
 * 토큰 = `hash(왼쪽 + 오른쪽)`, 빈 칸 = `hash("")`, 뿌리 = `hash(n + ":" + 꼭대기)`. 뿌리에 블록 수를 묶는 것과 증명 · 검증의 모양은 정본과
 * 같다.
 *
 * 대상 계약: `tree/merkleTree`.
 *
 * **결속을 어긴다 — 그런데 스위트가 못 본다.** 이어 붙인 두 토큰의 경계가 해시의 출력 모양에 기대므로, 주입된 해시가 단사여도 출력끼리
 * 앞뒤가 겹칠 수 있으면(한 출력이 다른 출력의 앞머리가 되는 해시) 다른 두 수열이 같은 마디 문자열을 만든다. 스위트의 축1 해시(괄호로
 * 감싸기)에서는 그런 겹침이 무작위 수열로 생기지 않고, 겹치는 수열을 지으려면 **이 구현이 토큰을 잇는 방식을 읽어야** 한다 —
 * 시나리오가 될 수 없다(불변 사실 44). 자기시험이 그 수열을 손으로 지어 위반을 고정한다(`_contract/runContract.merkleTree.test.ts`).
 *
 * 계측은 §규약2 계측 단위 — 해시 한 번 · 칸 하나에 1.
 */

export class UnseparatedMerkleTree {
  readonly #hash: (data: string) => string;
  readonly #size: number;
  readonly #capacity: number;
  readonly #nodes: string[];
  #root: string;
  __cost = 0;

  constructor(blocks: string[], hash: (data: string) => string) {
    this.#hash = hash;
    this.#size = blocks.length;
    let capacity = 1;
    while (capacity < this.#size) capacity *= 2;
    this.#capacity = capacity;
    this.#nodes = new Array<string>(2 * capacity);
    const empty = this.#call("");
    for (let i = 0; i < capacity; i++) {
      this.__cost += 1;
      this.#nodes[capacity + i] =
        i < this.#size ? this.#call(blocks[i] as string) : empty;
    }
    for (let v = capacity - 1; v >= 1; v--) this.#pull(v);
    this.#root = this.#call(`${this.#size}:${this.#nodes[1] as string}`);
  }

  rootHash(): string {
    this.__cost += 1;
    return this.#root;
  }

  getProof(index: number): string[] {
    this.#checkIndex(index);
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
    let token = this.#call(block);
    let v = capacity + index;
    for (let k = 1; k <= levels; k++) {
      this.__cost += 1;
      const sibling = proof[k] as string;
      token = v & 1 ? this.#call(sibling + token) : this.#call(token + sibling);
      v >>= 1;
    }
    return this.#call(`${size}:${token}`) === root;
  }

  update(index: number, block: string): void {
    this.#checkIndex(index);
    let v = this.#capacity + index;
    this.#nodes[v] = this.#call(block);
    for (v >>= 1; v >= 1; v >>= 1) {
      this.__cost += 1;
      this.#pull(v);
    }
    this.#root = this.#call(`${this.#size}:${this.#nodes[1] as string}`);
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
