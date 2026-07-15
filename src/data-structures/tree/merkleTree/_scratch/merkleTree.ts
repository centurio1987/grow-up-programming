function sha256(data: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(data);
  return hasher.digest("hex");
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

class MerkleTree {
  private tree: string[];
  private leafCount: number;
  private n: number;

  constructor(blocks: string[]) {
    if (blocks.length === 0) throw new Error("blocks must not be empty");
    this.n = blocks.length;
    this.leafCount = nextPowerOfTwo(this.n);
    this.tree = new Array(2 * this.leafCount).fill("");

    for (let i = 0; i < this.n; i++) {
      this.tree[this.leafCount + i] = sha256(blocks[i]!);
    }
    for (let i = this.n; i < this.leafCount; i++) {
      this.tree[this.leafCount + i] = this.tree[this.leafCount + this.n - 1]!;
    }
    for (let i = this.leafCount - 1; i >= 1; i--) {
      this.tree[i] = sha256(this.tree[2 * i]! + this.tree[2 * i + 1]!);
    }
  }

  rootHash(): string {
    return this.tree[1]!;
  }

  getProof(index: number): string[] {
    let pos = this.leafCount + index;
    const proof: string[] = [];
    while (pos > 1) {
      proof.push(this.tree[pos ^ 1]!);
      pos = pos >> 1;
    }
    return proof;
  }

  verify(index: number, block: string, proof: string[]): boolean {
    let current = sha256(block);
    let pos = this.leafCount + index;
    for (const sibling of proof) {
      current = pos % 2 === 0 ? sha256(current + sibling) : sha256(sibling + current);
      pos = pos >> 1;
    }
    return current === this.rootHash();
  }

  update(index: number, newBlock: string): void {
    let pos = this.leafCount + index;
    this.tree[pos] = sha256(newBlock);
    pos = pos >> 1;
    while (pos >= 1) {
      this.tree[pos] = sha256(this.tree[2 * pos]! + this.tree[2 * pos + 1]!);
      pos = pos >> 1;
    }
  }

  // 스크래치 전용: 가이드 ascii art 검증을 위한 내부 배열 노출
  debugArray(): string[] {
    return this.tree.slice(1);
  }
}

function short(hash: string): string {
  return hash.slice(0, 6);
}

console.log("=== 대표 예시: blocks = [tx1, tx2, tx3, tx4] ===");
const tree = new MerkleTree(["tx1", "tx2", "tx3", "tx4"]);
console.log("leafCount:", 4);
console.log("h0 SHA256(tx1):", short(sha256("tx1")), sha256("tx1"));
console.log("h1 SHA256(tx2):", short(sha256("tx2")));
console.log("h2 SHA256(tx3):", short(sha256("tx3")));
console.log("h3 SHA256(tx4):", short(sha256("tx4")));
const h0 = sha256("tx1");
const h1 = sha256("tx2");
const h2 = sha256("tx3");
const h3 = sha256("tx4");
const n1 = sha256(h0 + h1);
const n2 = sha256(h2 + h3);
const root = sha256(n1 + n2);
console.log("n1 SHA256(h0+h1):", short(n1));
console.log("n2 SHA256(h2+h3):", short(n2));
console.log("root SHA256(n1+n2):", short(root));
console.log("tree.rootHash():", short(tree.rootHash()), "match:", tree.rootHash() === root);

console.log("\ngetProof(0):");
const proof0 = tree.getProof(0);
console.log(proof0.map(short));
console.log("expected [h1, n2]:", [short(h1), short(n2)]);
console.log("match:", proof0[0] === h1 && proof0[1] === n2);

console.log("\nverify(0, 'tx1', proof0):", tree.verify(0, "tx1", proof0));
console.log("verify(0, 'FAKE', proof0):", tree.verify(0, "FAKE", proof0));

console.log("\n=== update(1, 'tx2-new') ===");
const rootBefore = tree.rootHash();
tree.update(1, "tx2-new");
const rootAfter = tree.rootHash();
console.log("root before:", short(rootBefore));
console.log("root after :", short(rootAfter));
console.log("changed:", rootBefore !== rootAfter);

const proof1New = tree.getProof(1);
console.log("verify(1, 'tx2-new', new proof):", tree.verify(1, "tx2-new", proof1New));
console.log("verify(1, 'tx2', new proof) [옛 블록으로 검증 시도]:", tree.verify(1, "tx2", proof1New));

// index 0 proof은 update(1, ...) 이후에도 유효해야 함 (형제 h1이 바뀌었으므로 getProof(0)을 다시 받아야 함)
const proof0AfterUpdate = tree.getProof(0);
console.log("verify(0, 'tx1', 갱신된 proof0):", tree.verify(0, "tx1", proof0AfterUpdate));
console.log("verify(0, 'tx1', 갱신 전 proof0) [낡은 proof]:", tree.verify(0, "tx1", proof0));

console.log("\n=== 함정 시나리오: concat 순서를 반대로 하면? ===");
function verifyWrongOrder(t: MerkleTree, index: number, block: string, proof: string[]): boolean {
  let current = sha256(block);
  let pos = 4 + index; // leafCount=4 가정 (예시 전용)
  for (const sibling of proof) {
    // 항상 sibling을 앞에 두는 잘못된 구현 (홀짝 구분 없음)
    current = sha256(sibling + current);
    pos = pos >> 1;
  }
  return current === t.rootHash();
}
const tree2 = new MerkleTree(["tx1", "tx2", "tx3", "tx4"]);
const proofFor0 = tree2.getProof(0);
function wrongOrderFinalHash(t: MerkleTree, index: number, block: string, proof: string[]): string {
  let current = sha256(block);
  for (const sibling of proof) {
    current = sha256(sibling + current);
  }
  return current;
}
console.log(
  "정상 verify(0, 'tx1', proof):",
  tree2.verify(0, "tx1", proofFor0),
  "| 순서를 틀린 verify:",
  verifyWrongOrder(tree2, 0, "tx1", proofFor0),
);
console.log("정상 계산 최종 해시  :", short(tree2.rootHash()), "(root와 일치)");
console.log("순서 틀린 최종 해시 :", short(wrongOrderFinalHash(tree2, 0, "tx1", proofFor0)), "(root와 불일치)");

console.log("\n=== 엣지: 홀수 블록(n=3) 패딩 ===");
const treeOdd = new MerkleTree(["a", "b", "c"]);
const arr = treeOdd.debugArray();
console.log("tree array (1-indexed, slice):", arr.map(short));
console.log("leaf3 == leaf4 (마지막 복제):", arr[5] === arr[6]); // index in slice: leafCount=4 -> leaves at tree[4..7] -> slice idx 3..6
console.log("proof(2) works:", treeOdd.verify(2, "c", treeOdd.getProof(2)));

console.log("\n=== 엣지: 블록 1개 ===");
const treeOne = new MerkleTree(["solo"]);
console.log("rootHash === SHA256(solo):", treeOne.rootHash() === sha256("solo"));
console.log("getProof(0):", treeOne.getProof(0));
console.log("verify(0, 'solo', []):", treeOne.verify(0, "solo", treeOne.getProof(0)));

console.log("\n=== 빈 배열 ===");
try {
  new MerkleTree([]);
  console.log("에러 발생 안함 (버그)");
} catch (e) {
  console.log("에러 발생:", (e as Error).message);
}

console.log("\n=== 무작위 교차검증 (n=1..20, 각 인덱스 전수) ===");
let allOk = true;
for (let trial = 0; trial < 30; trial++) {
  const size = 1 + Math.floor(Math.random() * 20);
  const blocks = Array.from({ length: size }, (_, i) => `block-${trial}-${i}-${Math.random().toString(36).slice(2, 8)}`);
  const t = new MerkleTree(blocks);
  for (let i = 0; i < size; i++) {
    const p = t.getProof(i);
    const ok = t.verify(i, blocks[i]!, p);
    if (!ok) {
      allOk = false;
      console.log("FAIL at trial", trial, "index", i);
    }
    const fakeOk = t.verify(i, blocks[i] + "-tampered", p);
    if (fakeOk) {
      allOk = false;
      console.log("FALSE POSITIVE at trial", trial, "index", i);
    }
  }
}
console.log("무작위 교차검증 전체 통과:", allOk);

console.log("\n=== 확인 질문 검증: n=5일 때 leafCount와 패딩 개수 ===");
const treeFive = new MerkleTree(["a", "b", "c", "d", "e"]);
console.log("leafCount:", nextPowerOfTwo(5), "패딩 개수:", nextPowerOfTwo(5) - 5);
