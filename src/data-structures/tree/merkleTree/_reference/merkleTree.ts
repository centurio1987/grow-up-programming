/**
 * `tree/merkleTree` 정본(규약2).
 *
 * 계약은 `../merkleTree.ts` 헤더 한 곳이다. 이 파일은 그 계약을 실제로 지키는 구현 **하나**이고, 계약이 허용하는 유일한
 * 구현이 아니다 — 뿌리와 증명은 구현이 고르는 토큰이라 모양(자리를 채우는 방식 · 해시에 넘기는 문자열의 짜임)이 다른
 * 구현도 두 약속(결속 · 검증)과 상한을 지키면 같은 계약이다. 이 파일이 정본인 것은 계약이 고른 계급을 대표하기 때문이지
 * 계약이 이 모양을 지목해서가 아니다.
 *
 * **축3 계측(`__cost`).** 세는 단위는 §규약2 계측 단위 그대로다 — **주입된 해시를 한 번 부를 때마다 1**, 그리고 **자리 · 증명
 * 토큰 하나를 지나갈 때마다 1**. 해시가 받는 문자열의 길이와 문자열을 잇는 런타임 비용은 세지 않는다 — 헤더가 해시 한 번을 한
 * 걸음으로 친 것과 같은 자리다. `__cost` 는 계약이 아니라 정본의 의무다(불변 사실 23).
 *
 * **모양.** 블록 수 n 이상인 가장 작은 2의 거듭제곱 P 칸의 완전 이진 나무를 배열 하나에 층 순서로 둔다(마디 `v` 의 자식은
 * `2v` · `2v + 1`). 비는 칸은 빈 칸 토큰 하나로 채운다. 해시에 넘기는 문자열은 **어느 둘도 같아지지 않게** 짠다 — 블록 토큰은
 * `L` + 블록, 마디 토큰은 `N` + 왼쪽 토큰 길이 + `:` + 왼쪽 + 오른쪽, 빈 칸은 `E`, 뿌리는 `R` + n + `:` + 꼭대기 토큰. 첫 글자가
 * 갈래를 가르고 길이 붙이기가 두 토큰의 경계를 정하므로, 주입된 해시가 단사면 뿌리 하나가 수열 하나를 가리킨다(결속). **뿌리에
 * n 을 넣는 이유** — 빈 칸 토큰은 블록 토큰과 갈래가 달라 섞이지 않지만, 증명만 받는 검증 쪽은 나무의 칸 수를 증명에서 읽으므로
 * n 이 뿌리에 묶여 있어야 증명이 칸 수를 속일 수 없다.
 *
 * **증명**은 `#` + n 하나와, 블록 칸에서 꼭대기로 오르며 만나는 형제 토큰들이다. **검증**은 담긴 블록을 읽지 않는다 — 증명의
 * n 으로 자리가 범위 안인지 · 증명 길이가 맞는지 보고, 블록 토큰에서 형제를 차례로 붙여 뿌리를 다시 짓고 받은 뿌리와 견준다.
 *
 * **생성자가 받은 배열을 들고 있지 않는다** — 블록을 토큰으로 바꿔 두고 원래 문자열은 버린다.
 */

// #region guide:core/class
export class MerkleTree {
  readonly #hash: (data: string) => string;
  /** 담긴 블록 수 n. */
  readonly #size: number;
  /** 블록 칸 수 P — n 이상인 가장 작은 2의 거듭제곱(n = 0 이면 1). */
  readonly #capacity: number;
  /** 층 순서 배열. 마디 `v`(1 부터)의 자식은 `2v` · `2v + 1`, 블록 칸은 `P` … `2P - 1`. */
  readonly #nodes: string[];
  #root: string;

  /** 축3 계측. 파일 헤더의 단위 설명 참고. */
  __cost = 0;

  constructor(blocks: string[], hash: (data: string) => string) {
    this.#hash = hash;
    this.#size = blocks.length;
    let capacity = 1;
    while (capacity < this.#size) capacity *= 2;
    this.#capacity = capacity;
    this.#nodes = new Array<string>(2 * capacity);

    const empty = this.#call("E");
    for (let i = 0; i < capacity; i++) {
      this.__cost += 1;
      this.#nodes[capacity + i] =
        i < this.#size ? this.#call(`L${blocks[i] as string}`) : empty;
    }
    for (let v = capacity - 1; v >= 1; v--) {
      this.#nodes[v] = this.#join(
        this.#nodes[2 * v] as string,
        this.#nodes[2 * v + 1] as string,
      );
    }
    this.#root = this.#seal(this.#size, this.#nodes[1] as string);
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

  verify(
    rootHash: string,
    index: number,
    block: string,
    proof: string[],
  ): boolean {
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
    return this.#seal(size, token) === rootHash;
  }

  update(index: number, block: string): void {
    this.#checkIndex(index);
    let v = this.#capacity + index;
    this.#nodes[v] = this.#call(`L${block}`);
    for (v >>= 1; v >= 1; v >>= 1) {
      this.__cost += 1;
      this.#nodes[v] = this.#join(
        this.#nodes[2 * v] as string,
        this.#nodes[2 * v + 1] as string,
      );
    }
    this.#root = this.#seal(this.#size, this.#nodes[1] as string);
  }

  #checkIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.#size) {
      throw new RangeError(
        `자리는 0 이상 ${this.#size} 미만의 정수여야 한다 — 받은 값은 ${index} 다`,
      );
    }
  }

  /** 두 토큰을 잇는다 — 왼쪽 길이를 붙여 경계를 정한다. */
  #join(left: string, right: string): string {
    return this.#call(`N${left.length}:${left}${right}`);
  }

  /** 꼭대기 토큰에 블록 수를 묶어 뿌리를 짓는다. */
  #seal(size: number, top: string): string {
    return this.#call(`R${size}:${top}`);
  }

  /** 주입받은 해시를 한 번 부른다. 부르는 자리를 하나로 모아 계측이 새지 않게 한다. */
  #call(data: string): string {
    this.__cost += 1;
    return this.#hash(data);
  }
}
// #endregion
