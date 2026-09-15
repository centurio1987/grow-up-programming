/**
 * 결함 fixture — `probabilistic/minHash` 계약의 비용 행 하나(`add`)만 어기는 구현.
 *
 * 정본을 그대로 쓰되, 넣기 전에 **들어온 원소를 늘어놓은 목록을 앞에서부터 훑어** 이미 들어온 원소인지 본다. 이미 들어왔으면
 * 정본을 부르지 않는다. 서명은 정본의 것이라 결정적인 쪽 · 오차 판정 · `similarity` 시나리오를 정본과 같은 값으로 통과하고,
 * 넣기 하나가 들어온 원소 수 n 에 비례해 `add` 시나리오에서만 걸린다. 서명이 중복에 무감하므로 중복 검사가 필요 없다는 것,
 * 그리고 헤더의 `add` 상한이 그 훑기를 배제한다는 것을 보이는 자리다.
 *
 * 계측은 안에 든 정본의 것에 훑은 목록 칸 수를 더한다(§규약2 계측 단위 — 지나간 수).
 */

import { MinHash } from "../../probabilistic/minHash/_reference/minHash";

export class ScanningDedupMinHash {
  readonly #inner: MinHash;
  readonly #items: string[] = [];
  #scanned = 0;

  constructor(epsilon: number, delta: number) {
    this.#inner = new MinHash(epsilon, delta);
  }

  get __cost(): number {
    return this.#inner.__cost + this.#scanned;
  }

  add(item: string): void {
    for (const seen of this.#items) {
      this.#scanned += 1;
      if (seen === item) return;
    }
    this.#scanned += 1;
    this.#items.push(item);
    this.#inner.add(item);
  }

  similarity(other: ScanningDedupMinHash): number {
    return this.#inner.similarity(other.#inner);
  }
}
