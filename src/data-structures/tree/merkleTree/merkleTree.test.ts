import { test, expect, describe } from "bun:test";
import { MerkleTree } from "./merkleTree";

describe("MerkleTree", () => {
  describe("기본", () => {
    test("4개 블록으로 트리를 구성하고 루트 해시를 반환한다", () => {
      const blocks = ["tx1", "tx2", "tx3", "tx4"];
      const tree = new MerkleTree(blocks);
      const root = tree.rootHash();
      expect(typeof root).toBe("string");
      expect(root.length).toBe(64); // SHA-256 hex
    });

    test("동일한 블록 배열은 항상 동일한 루트 해시를 생성한다", () => {
      const blocks = ["a", "b", "c", "d"];
      const t1 = new MerkleTree(blocks);
      const t2 = new MerkleTree(blocks);
      expect(t1.rootHash()).toBe(t2.rootHash());
    });

    test("블록 내용이 다르면 루트 해시가 달라진다", () => {
      const t1 = new MerkleTree(["tx1", "tx2", "tx3", "tx4"]);
      const t2 = new MerkleTree(["tx1", "tx2", "tx3", "TAMPERED"]);
      expect(t1.rootHash()).not.toBe(t2.rootHash());
    });

    test("getProof가 log n 길이의 증명 경로를 반환한다", () => {
      const blocks = ["a", "b", "c", "d"];
      const tree = new MerkleTree(blocks);
      // 4개 리프 → 증명 경로 길이는 2
      expect(tree.getProof(0).length).toBe(2);
      expect(tree.getProof(2).length).toBe(2);
    });

    test("올바른 블록과 증명 경로로 verify가 true를 반환한다", () => {
      const blocks = ["tx1", "tx2", "tx3", "tx4"];
      const tree = new MerkleTree(blocks);
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block === undefined) continue;
        const proof = tree.getProof(i);
        expect(tree.verify(i, block, proof)).toBe(true);
      }
    });

    test("잘못된 블록으로 verify가 false를 반환한다", () => {
      const blocks = ["tx1", "tx2", "tx3", "tx4"];
      const tree = new MerkleTree(blocks);
      const proof = tree.getProof(0);
      expect(tree.verify(0, "FAKE_TX", proof)).toBe(false);
    });

    test("update 후 루트 해시가 변경된다", () => {
      const blocks = ["tx1", "tx2", "tx3", "tx4"];
      const tree = new MerkleTree(blocks);
      const before = tree.rootHash();
      tree.update(1, "tx2_modified");
      expect(tree.rootHash()).not.toBe(before);
    });

    test("update 후 변경된 블록의 증명 검증이 새 값으로 통과된다", () => {
      const blocks = ["tx1", "tx2", "tx3", "tx4"];
      const tree = new MerkleTree(blocks);
      tree.update(2, "tx3_new");
      const proof = tree.getProof(2);
      expect(tree.verify(2, "tx3_new", proof)).toBe(true);
      expect(tree.verify(2, "tx3", proof)).toBe(false);
    });

    test("홀수 개 블록도 처리한다 (마지막 블록 복제)", () => {
      const blocks = ["a", "b", "c"];
      const tree = new MerkleTree(blocks);
      expect(typeof tree.rootHash()).toBe("string");
      const proof = tree.getProof(0);
      expect(tree.verify(0, "a", proof)).toBe(true);
    });

    test("블록 1개로 트리를 구성한다", () => {
      const tree = new MerkleTree(["only"]);
      expect(typeof tree.rootHash()).toBe("string");
      expect(tree.verify(0, "only", tree.getProof(0))).toBe(true);
    });
  });

  describe("엣지", () => {
    test("빈 배열은 에러를 던진다", () => {
      expect(() => new MerkleTree([])).toThrow();
    });

    test("범위를 벗어난 인덱스로 getProof 호출 시 에러를 던진다", () => {
      const tree = new MerkleTree(["a", "b"]);
      expect(() => tree.getProof(5)).toThrow();
    });

    test("잘못된 증명(proof 배열 조작)으로 verify가 false를 반환한다", () => {
      const blocks = ["tx1", "tx2", "tx3", "tx4"];
      const tree = new MerkleTree(blocks);
      const proof = tree.getProof(0);
      if (proof[0] !== undefined) proof[0] = "0".repeat(64);
      expect(tree.verify(0, "tx1", proof)).toBe(false);
    });

    test("8개 블록 트리의 증명 경로 길이가 3이다", () => {
      const blocks = ["a", "b", "c", "d", "e", "f", "g", "h"];
      const tree = new MerkleTree(blocks);
      expect(tree.getProof(0).length).toBe(3);
    });
  });

  describe("성능", () => {
    test("1024개 블록 트리 구성 및 모든 증명 검증이 100ms 이내에 완료된다", () => {
      const n = 1024;
      const blocks = Array.from({ length: n }, (_, i) => `tx${i}`);
      const start = Date.now();
      const tree = new MerkleTree(blocks);
      for (let i = 0; i < n; i++) {
        const block = blocks[i];
        if (block === undefined) continue;
        const proof = tree.getProof(i);
        expect(tree.verify(i, block, proof)).toBe(true);
      }
      expect(Date.now() - start).toBeLessThan(100);
    });

    test("1024번 update가 100ms 이내에 완료된다", () => {
      const n = 1024;
      const blocks = Array.from({ length: n }, (_, i) => `tx${i}`);
      const tree = new MerkleTree(blocks);
      const start = Date.now();
      for (let i = 0; i < n; i++) {
        tree.update(i % n, `new_tx${i}`);
      }
      expect(Date.now() - start).toBeLessThan(100);
    });
  });
});
