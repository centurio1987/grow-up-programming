/**
 * 신규 자료구조 50개의 디렉토리 + 최소 스텁 파일을 일괄 생성한다.
 * 이미 파일이 존재하면 덮어쓰지 않는다.
 */
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

const BASE = "src/data-structures";

const structures: Array<{ dir: string; className: string }> = [
  // Wave 1 — 선형 / 연결 리스트
  { dir: "singlyLinkedList", className: "SinglyLinkedList" },
  { dir: "dynamicArray", className: "DynamicArray" },
  { dir: "xorLinkedList", className: "XorLinkedList" },
  { dir: "unrolledLinkedList", className: "UnrolledLinkedList" },
  { dir: "bitArray", className: "BitArray" },
  { dir: "gapBuffer", className: "GapBuffer" },
  { dir: "pieceTable", className: "PieceTable" },

  // Wave 2 — 스택·큐·힙
  { dir: "monotonicStack", className: "MonotonicStack" },
  { dir: "monotonicQueue", className: "MonotonicQueue" },
  { dir: "priorityQueue", className: "PriorityQueue" },
  { dir: "maxHeap", className: "MaxHeap" },
  { dir: "binomialHeap", className: "BinomialHeap" },
  { dir: "fibonacciHeap", className: "FibonacciHeap" },
  { dir: "leftistHeap", className: "LeftistHeap" },
  { dir: "pairingHeap", className: "PairingHeap" },
  { dir: "daryHeap", className: "DaryHeap" },

  // Wave 3 — 해시
  { dir: "hashMapChaining", className: "HashMapChaining" },
  { dir: "hashMapOpenAddressing", className: "HashMapOpenAddressing" },
  { dir: "hashSet", className: "HashSet" },
  { dir: "cuckooFilter", className: "CuckooFilter" },
  { dir: "minHash", className: "MinHash" },
  { dir: "hyperLogLog", className: "HyperLogLog" },

  // Wave 4 — 탐색 트리
  { dir: "avlTree", className: "AVLTree" },
  { dir: "redBlackTree", className: "RedBlackTree" },
  { dir: "splayTree", className: "SplayTree" },
  { dir: "scapegoatTree", className: "ScapegoatTree" },
  { dir: "cartesianTree", className: "CartesianTree" },
  { dir: "twoThreeTree", className: "TwoThreeTree" },
  { dir: "bTree", className: "BTree" },
  { dir: "bPlusTree", className: "BPlusTree" },
  { dir: "vanEmdeBoasTree", className: "VanEmdeBoasTree" },

  // Wave 5 — 특수 트리 / 문자열
  { dir: "merkleTree", className: "MerkleTree" },
  { dir: "huffmanTree", className: "HuffmanTree" },
  { dir: "trie", className: "Trie" },
  { dir: "radixTree", className: "RadixTree" },
  { dir: "suffixTree", className: "SuffixTree" },
  { dir: "ternarySearchTree", className: "TernarySearchTree" },
  { dir: "suffixArray", className: "SuffixArray" },
  { dir: "rollingHash", className: "RollingHash" },
  { dir: "ahoCorasick", className: "AhoCorasick" },

  // Wave 6 — 구간·공간 트리
  { dir: "segmentTree", className: "SegmentTree" },
  { dir: "sparseTable", className: "SparseTable" },
  { dir: "intervalTree", className: "IntervalTree" },
  { dir: "kdTree", className: "KDTree" },
  { dir: "quadtree", className: "Quadtree" },
  { dir: "persistentSegmentTree", className: "PersistentSegmentTree" },

  // Wave 7 — 그래프 / 집합 / 기타
  { dir: "graphAdjList", className: "GraphAdjList" },
  { dir: "graphAdjMatrix", className: "GraphAdjMatrix" },
  { dir: "dag", className: "DAG" },
  { dir: "multiset", className: "Multiset" },
  { dir: "disjointSetRollback", className: "DisjointSetRollback" },
  { dir: "concurrentSkipList", className: "ConcurrentSkipList" },
];

function writeIfNotExists(filePath: string, content: string) {
  if (existsSync(filePath)) {
    console.log(`  SKIP (exists): ${filePath}`);
    return;
  }
  writeFileSync(filePath, content, "utf-8");
  console.log(`  CREATE: ${filePath}`);
}

let created = 0;
let skipped = 0;

for (const { dir, className } of structures) {
  const dirPath = join(BASE, dir);
  mkdirSync(dirPath, { recursive: true });

  const tsPath = join(dirPath, `${dir}.ts`);
  const testPath = join(dirPath, `${dir}.test.ts`);

  const tsContent = `/**
 * ${className}
 *
 * TODO: 아래 주석에 문제 설명을 작성하고 메서드를 구현하라.
 */
export class ${className} {
  // TODO: 메서드를 추가하고 구현하라
}
`;

  const testContent = `import { test, expect, describe } from "bun:test";
import { ${className} } from "./${dir}";

describe("${className}", () => {
  describe("기본", () => {
    test.todo("기본 동작 테스트를 작성하라");
  });

  describe("엣지", () => {
    test.todo("엣지 케이스 테스트를 작성하라");
  });

  describe("성능", () => {
    test.todo("성능 테스트를 작성하라");
  });
});
`;

  const before = created;
  writeIfNotExists(tsPath, tsContent);
  writeIfNotExists(testPath, testContent);

  if (created > before) created += 2 - (created - before);
  else skipped += 2;
}

// 실제 카운트를 다시 계산
let createdCount = 0;
let skippedCount = 0;
for (const { dir } of structures) {
  const dirPath = join(BASE, dir);
  // 이 시점에 파일이 있으면 처리됨
  if (existsSync(join(dirPath, `${dir}.ts`))) createdCount++;
  if (existsSync(join(dirPath, `${dir}.test.ts`))) createdCount++;
}

console.log(`\n완료: ${structures.length}개 자료구조 디렉토리 준비`);
