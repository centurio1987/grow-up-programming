/**
 * MerkleTree (머클 트리)
 *
 * 데이터 블록 배열을 이진 해시 트리로 구성한다.
 * 각 리프 노드는 블록 데이터의 SHA-256 해시이며,
 * 내부 노드는 두 자식 해시를 이어붙인 값의 해시다.
 * 블록체인(비트코인, 이더리움)에서 트랜잭션 무결성 검증에 사용된다.
 *
 * 요구사항:
 * - constructor: 블록 배열로부터 머클 트리를 구성한다
 * - rootHash: 루트 해시를 반환한다
 * - getProof: 특정 인덱스 블록의 증명 경로(sibling hashes)를 반환한다
 * - verify: 증명 경로를 이용해 블록 포함 여부를 검증한다
 * - update: 특정 인덱스의 블록을 변경하고 해시를 재계산한다
 *
 * 시간복잡도:
 * - constructor: O(n)
 * - rootHash: O(1)
 * - getProof: O(log n)
 * - verify: O(log n)
 * - update: O(log n)
 */

import { createHash } from "crypto";

function sha256(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

export class MerkleTree {
  private leaves: string[];
  private tree: string[];
  private leafCount: number;

  constructor(blocks: string[]) {
    if (blocks.length === 0) {
      throw new Error("Not implemented");
    }
    throw new Error("Not implemented");
  }

  /** 루트 해시를 반환한다 */
  rootHash(): string {
    throw new Error("Not implemented");
  }

  /**
   * 인덱스 블록의 머클 증명 경로를 반환한다.
   * 반환값은 리프에서 루트 방향의 sibling 해시 배열이다.
   */
  getProof(index: number): string[] {
    throw new Error("Not implemented");
  }

  /**
   * 증명 경로를 이용해 해당 블록이 트리에 포함됐는지 검증한다.
   * @param index 블록 인덱스
   * @param block 원본 블록 데이터
   * @param proof getProof()가 반환한 sibling 해시 배열
   */
  verify(index: number, block: string, proof: string[]): boolean {
    throw new Error("Not implemented");
  }

  /**
   * 특정 인덱스의 블록을 새 데이터로 교체하고
   * 영향받는 모든 조상 노드의 해시를 재계산한다.
   */
  update(index: number, newBlock: string): void {
    throw new Error("Not implemented");
  }
}
