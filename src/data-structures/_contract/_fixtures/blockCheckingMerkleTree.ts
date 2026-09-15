/**
 * 결함 fixture — `tree/merkleTree` 정본을 그대로 쓰되 **검증이 담긴 블록과 지금의 뿌리 · 증명에 견주는** 구현.
 *
 * 대상 계약: `tree/merkleTree`.
 *
 * 물려받은 표면(`verify(index, block, proof)` — 뿌리 인자가 없다)에서는 이 구현과 정본이 **같은 답을 낸다** — 지금 수열의 지금 뿌리에
 * 대해서는 「블록이 그 자리 블록이고 증명이 그 자리 증명인가」와 「증명으로 다시 지은 뿌리가 지금 뿌리인가」가 같은 물음이다(주입
 * 해시가 단사일 때). 뿌리를 인자로 받는 계약에서는 **고치기 전 · 다시 짓기 전의 뿌리**를 묻는 순간 갈린다 — 이 구현은 담긴 블록이
 * 바뀌었다고 거짓을 낸다. 「검증은 블록을 갖지 않은 쪽이 한다」가 관측되는 자리가 이것이다.
 *
 * 계측은 안쪽 정본의 `__cost` 에 이 파일의 몫(블록 · 증명 토큰 하나를 견줄 때 1)을 더한 것이다(§규약2 계측 단위).
 */

import { MerkleTree } from "../../tree/merkleTree/_reference/merkleTree";

export class BlockCheckingMerkleTree {
  readonly #inner: MerkleTree;
  readonly #blocks: string[];
  #own = 0;

  constructor(blocks: string[], hash: (data: string) => string) {
    this.#inner = new MerkleTree(blocks, hash);
    this.#blocks = [...blocks];
  }

  get __cost(): number {
    return this.#own + this.#inner.__cost;
  }

  rootHash(): string {
    return this.#inner.rootHash();
  }

  getProof(index: number): string[] {
    return this.#inner.getProof(index);
  }

  verify(root: string, index: number, block: string, proof: string[]): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.#blocks.length) {
      return false;
    }
    this.#own += 1;
    if (root !== this.#inner.rootHash() || block !== this.#blocks[index]) {
      return false;
    }
    const own = this.#inner.getProof(index);
    if (own.length !== proof.length) return false;
    for (let i = 0; i < own.length; i++) {
      this.#own += 1;
      if (own[i] !== proof[i]) return false;
    }
    return true;
  }

  update(index: number, block: string): void {
    this.#inner.update(index, block);
    this.#blocks[index] = block;
  }
}
