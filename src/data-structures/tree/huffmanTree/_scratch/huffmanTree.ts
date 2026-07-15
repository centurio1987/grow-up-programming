// E3 자기검증용 스크래치 — 가이드 본문 코드를 추출해 그대로 실행한다.
// bun src/data-structures/tree/huffmanTree/_scratch/huffmanTree.ts

interface HuffmanLeaf {
  char: string;
  freq: number;
  seq: number;
}
interface HuffmanInternal {
  char: null;
  freq: number;
  seq: number;
  left: HuffmanNode;
  right: HuffmanNode;
}
type HuffmanNode = HuffmanLeaf | HuffmanInternal;

class MinHeap {
  private items: HuffmanNode[] = [];

  get size(): number {
    return this.items.length;
  }

  insert(node: HuffmanNode): void {
    this.items.push(node);
    this.bubbleUp(this.items.length - 1);
  }

  extractMin(): HuffmanNode {
    const min = this.items[0];
    const last = this.items.pop() as HuffmanNode;
    if (this.items.length > 0) {
      this.items[0] = last;
      this.bubbleDown(0);
    }
    return min as HuffmanNode;
  }

  // freq가 같으면 seq(삽입 순서)로 비긴다 — 안정적인 트리 구성을 위한 핵심.
  private less(a: HuffmanNode, b: HuffmanNode): boolean {
    return a.freq !== b.freq ? a.freq < b.freq : a.seq < b.seq;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.less(this.items[i], this.items[parent])) {
        [this.items[i], this.items[parent]] = [this.items[parent], this.items[i]];
        i = parent;
      } else break;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.items.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.less(this.items[l], this.items[smallest])) smallest = l;
      if (r < n && this.less(this.items[r], this.items[smallest])) smallest = r;
      if (smallest === i) break;
      [this.items[i], this.items[smallest]] = [this.items[smallest], this.items[i]];
      i = smallest;
    }
  }
}

export class HuffmanTree {
  private root: HuffmanNode;
  private codes = new Map<string, string>();

  constructor(frequencies: Map<string, number>) {
    if (frequencies.size === 0) throw new Error("frequencies는 비어 있을 수 없습니다");

    const heap = new MinHeap();
    let seq = 0;
    for (const [char, freq] of frequencies) {
      heap.insert({ char, freq, seq: seq++ });
    }

    while (heap.size > 1) {
      const left = heap.extractMin();
      const right = heap.extractMin();
      heap.insert({ char: null, freq: left.freq + right.freq, seq: seq++, left, right });
    }
    this.root = heap.extractMin();
    this.buildCodes(this.root, "");
  }

  private buildCodes(node: HuffmanNode, prefix: string): void {
    if (node.char !== null) {
      this.codes.set(node.char, prefix || "0"); // 단일 문자 예외
      return;
    }
    this.buildCodes(node.left, prefix + "0");
    this.buildCodes(node.right, prefix + "1");
  }

  encode(text: string): string {
    let result = "";
    for (const ch of text) {
      const code = this.codes.get(ch);
      if (code === undefined) throw new Error(`frequencies에 없는 문자: ${ch}`);
      result += code;
    }
    return result;
  }

  decode(bits: string): string {
    if (this.root.char !== null) {
      // 리프 하나뿐인 트리 — 좌우 이동 없이 비트 수만큼 같은 문자를 반복
      return this.root.char.repeat(bits.length);
    }
    let node: HuffmanNode = this.root;
    let result = "";
    for (const bit of bits) {
      node = bit === "0" ? (node as HuffmanInternal).left : (node as HuffmanInternal).right;
      if (node.char !== null) {
        result += node.char;
        node = this.root;
      }
    }
    return result;
  }

  codeTable(): Map<string, string> {
    return new Map(this.codes);
  }

  compressionRatio(text: string): number {
    return this.encode(text).length / (text.length * 8);
  }
}

// ---- 실측 검증 ----
function freqOf(text: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const ch of text) m.set(ch, (m.get(ch) ?? 0) + 1);
  return m;
}

console.log("=== 대표 예시: abracadabra ===");
const text1 = "abracadabra";
const freq1 = freqOf(text1);
console.log("frequencies:", [...freq1.entries()]);
const tree1 = new HuffmanTree(freq1);
const table1 = tree1.codeTable();
console.log("codeTable:", [...table1.entries()]);
const encoded1 = tree1.encode(text1);
console.log("encode(text):", encoded1, "length:", encoded1.length);
const decoded1 = tree1.decode(encoded1);
console.log("decode(encoded) === text1:", decoded1 === text1, decoded1);
console.log("compressionRatio(text1):", tree1.compressionRatio(text1));
const encodedAb = tree1.encode("ab");
console.log('encode("ab"):', encodedAb);
console.log('decode(encode("ab")):', tree1.decode(encodedAb));

console.log("\n=== 엣지: 단일 문자 ===");
const freq2 = new Map([["x", 7]]);
const tree2 = new HuffmanTree(freq2);
console.log("codeTable:", [...tree2.codeTable().entries()]);
const encoded2 = tree2.encode("xxxx");
console.log('encode("xxxx"):', encoded2);
console.log("decode:", tree2.decode(encoded2));
console.log("compressionRatio:", tree2.compressionRatio("xxxx"));

console.log("\n=== 엣지: 빈 frequencies ===");
try {
  new HuffmanTree(new Map());
  console.log("에러 없음 (실패)");
} catch (e) {
  console.log("에러 발생(기대):", (e as Error).message);
}

console.log("\n=== 엣지: frequencies에 없는 문자 인코딩 ===");
try {
  tree1.encode("z");
  console.log("에러 없음 (실패)");
} catch (e) {
  console.log("에러 발생(기대):", (e as Error).message);
}

console.log("\n=== 무작위 교차검증 ===");
function randomText(len: number, alphabet: string): string {
  let s = "";
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
let allOk = true;
for (let trial = 0; trial < 200; trial++) {
  const alphabetLen = 2 + Math.floor(Math.random() * 8);
  const alphabet = "abcdefghij".slice(0, alphabetLen);
  const text = randomText(5 + Math.floor(Math.random() * 40), alphabet);
  const freq = freqOf(text);
  const tree = new HuffmanTree(freq);
  const encoded = tree.encode(text);
  const decoded = tree.decode(encoded);
  const table = tree.codeTable();
  // prefix-free 검증: 어떤 코드도 다른 코드의 접두사가 아니어야 한다
  const codes = [...table.values()];
  let prefixFree = true;
  for (let i = 0; i < codes.length && prefixFree; i++) {
    for (let j = 0; j < codes.length; j++) {
      if (i === j) continue;
      if (codes[j].startsWith(codes[i]) && codes[j] !== codes[i]) prefixFree = false;
    }
  }
  const expectedBits = [...freq.entries()].reduce((sum, [ch, f]) => sum + f * (table.get(ch)?.length ?? 0), 0);
  if (decoded !== text || !prefixFree || encoded.length !== expectedBits) {
    allOk = false;
    console.log("실패:", { text, decoded, prefixFree, encodedLen: encoded.length, expectedBits });
  }
}
console.log("무작위 200회 전부 통과:", allOk);

console.log("\n=== 힙 결합 순서 트레이스 (abracadabra) ===");
// buildCodes와 별개로, constructor 내부 결합 순서를 재현해 시뮬레이션 스텝과 대조한다.
{
  const trace: string[] = [];
  const heap = new MinHeap();
  let seq = 0;
  const label = (n: HuffmanNode): string => (n.char !== null ? `${n.char}:${n.freq}` : `내부:${n.freq}`);
  for (const [char, freq] of freq1) heap.insert({ char, freq, seq: seq++ });
  while (heap.size > 1) {
    const left = heap.extractMin();
    const right = heap.extractMin();
    trace.push(`${label(left)} + ${label(right)} → 내부:${left.freq + right.freq}`);
    heap.insert({ char: null, freq: left.freq + right.freq, seq: seq++, left, right });
  }
  console.log(trace.join("\n"));
}
