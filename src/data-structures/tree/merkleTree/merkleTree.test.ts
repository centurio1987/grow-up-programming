/**
 * `tree/merkleTree` 계약 스위트 실행부(규약2).
 *
 * `runContract` 호출과, 계약 스위트가 담지 못하는 **주입 정책**만 둔다. 무엇을 검사하는지는 `./merkleTree.contract.ts` 에 있고,
 * 계약 자체는 `./merkleTree.ts` 헤더 한 곳이다.
 *
 * 대상이 둘이다. **스텁은 실패하는 것이 정상이고**(미구현) 정본은 통과해야 한다. 축3은 계측기가 붙은 정본에만 돈다.
 *
 * **계측 경로가 `injected` 다**(`range-query/segmentTree` 와 같다). 하네스가 해시 호출 횟수를 밖에서 세고, 자기 보고 `__cost` 가 그보다
 * 작으면 실패한다. 축1 은 단사 해시 `wrap`, 축3 은 짧은 해시 `digest` 를 주입한다(`./merkleTree.contract.ts` 머리말).
 *
 * 벽시계 테스트는 두지 않는다(불변 사실 7). 물려받은 시험의 「1024개 블록 트리 구성 및 모든 증명 검증이 100ms 이내」가 재는 것은 그
 * 기계의 상수다. 자리는 축3이다.
 */

import { describe, expect, test } from "bun:test";
import { runContract } from "../../_contract/runContract";
import { MerkleTree as Reference } from "./_reference/merkleTree";
import { MerkleTree } from "./merkleTree";
import {
  digest,
  type MerkleTreeContract,
  merkleTreeContract,
  Rebuildable,
  wrap,
} from "./merkleTree.contract";

runContract(
  () => new Rebuildable((blocks) => new MerkleTree(blocks, wrap)),
  merkleTreeContract,
  { label: "스텁" },
);

runContract(
  () => new Rebuildable((blocks) => new Reference(blocks, wrap)),
  merkleTreeContract,
  {
    label: "정본",
    cost: {
      kind: "injected",
      make: (tick) =>
        new Rebuildable(
          (blocks) =>
            new Reference(blocks, (data) => {
              tick();
              return digest(data);
            }),
        ),
    },
  },
);

/**
 * 주입 정책은 계약의 일부다(규약1). 계약 스위트는 해시 **하나**로 도는데 계약이 요구하는 것은 두 의무(순수 · 단사)를 지키는 **임의의**
 * 해시이므로, 다른 단사 해시에서도 서는지와 호출자가 넘긴 배열 · 돌려받은 증명을 고쳐도 답이 그대로인지는 여기서 본다.
 */
function checkInjectionPolicy(
  label: string,
  make: (
    blocks: string[],
    hash: (data: string) => string,
  ) => MerkleTreeContract,
): void {
  describe(`MerkleTree 주입 정책 [${label}]`, () => {
    test("길이를 붙이는 다른 단사 해시에서도 결속 · 완전성 · 건전성이 선다", () => {
      const tagged = (data: string) => `${data.length}#${data}`;
      const tree = make(["tx1", "tx2", "tx3"], tagged);
      const root = tree.rootHash();
      const proof = tree.getProof(2);
      expect(tree.verify(root, 2, "tx3", proof)).toBe(true);
      expect(tree.verify(root, 2, "tx2", proof)).toBe(false);
      expect(tree.verify(root, 3, "tx3", proof)).toBe(false);
      expect(make(["tx1", "tx2", "tx3", "tx3"], tagged).rootHash()).not.toBe(
        root,
      );
      expect(make(["tx1", "tx2", "tx3"], tagged).rootHash()).toBe(root);
    });

    test("생성자가 돌아온 뒤 호출자가 블록 배열을 고쳐도 담긴 수열은 그대로다", () => {
      const given = ["a", "b"];
      const tree = make(given, wrap);
      const root = tree.rootHash();
      given[0] = "z";
      given.push("c");
      expect(tree.rootHash()).toBe(root);
      expect(tree.verify(root, 0, "a", tree.getProof(0))).toBe(true);
      expect(() => tree.getProof(2)).toThrow(RangeError);
    });

    // 증명 토큰의 값은 계약이 정하지 않으므로 두 증명을 값으로 견주지 않는다 — 다시 받은 증명이 여전히 참인지만 본다.
    test("돌려받은 증명을 고쳐도 다시 받은 증명으로 한 검증은 참이다", () => {
      const tree = make(["a", "b", "c", "d"], wrap);
      const root = tree.rootHash();
      const first = tree.getProof(1);
      first.pop();
      first[0] = "?";
      expect(tree.verify(root, 1, "b", tree.getProof(1))).toBe(true);
      expect(tree.rootHash()).toBe(root);
    });
  });
}

checkInjectionPolicy("스텁", (blocks, hash) => new MerkleTree(blocks, hash));
checkInjectionPolicy("정본", (blocks, hash) => new Reference(blocks, hash));
