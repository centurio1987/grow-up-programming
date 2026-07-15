// E3 자기검증 스크래치 — 가이드 본문 코드를 그대로 추출해 실행한다.
// bun src/data-structures/probabilistic/bloomFilter/_scratch/bloomFilter.ts

class Naive1BitFilter {
  private bits: boolean[];

  constructor(size: number) {
    this.bits = new Array(size).fill(false);
  }

  private hash(item: string): number {
    let h = 5381;
    for (let i = 0; i < item.length; i++) h = (h * 33) ^ item.charCodeAt(i);
    return (h >>> 0) % this.bits.length;
  }

  add(item: string): void {
    this.bits[this.hash(item)] = true;
  }

  has(item: string): boolean {
    return this.bits[this.hash(item)]!;
  }
}

class KHashFilter {
  private bits: boolean[];
  private k: number;

  constructor(size: number, k: number) {
    this.bits = new Array(size).fill(false);
    this.k = k;
  }

  private hash(item: string, seed: number): number {
    let h = 5381 + seed * 1000003; // 시드로 서로 다른 해시 함수를 흉내
    for (let i = 0; i < item.length; i++) h = (h * 33) ^ item.charCodeAt(i);
    return (h >>> 0) % this.bits.length;
  }

  add(item: string): void {
    for (let j = 0; j < this.k; j++) this.bits[this.hash(item, j)] = true;
  }

  has(item: string): boolean {
    for (let j = 0; j < this.k; j++) {
      if (!this.bits[this.hash(item, j)]) return false;
    }
    return true;
  }
}

class BloomFilter {
  private bits: Uint32Array;
  private m: number;
  private k: number;

  constructor(size: number, hashCount: number) {
    this.m = size;
    this.k = hashCount;
    this.bits = new Uint32Array(Math.ceil(size / 32));
  }

  private hash1(item: string): number {
    // FNV-1a
    let h = 2166136261;
    for (let i = 0; i < item.length; i++) {
      h ^= item.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  private hash2(item: string): number {
    // djb2
    let h = 5381;
    for (let i = 0; i < item.length; i++) {
      h = (h * 33) ^ item.charCodeAt(i);
    }
    return h >>> 0;
  }

  private positions(item: string): number[] {
    const h1 = this.hash1(item);
    const h2 = this.hash2(item);
    const pos: number[] = [];
    for (let i = 0; i < this.k; i++) {
      pos.push((h1 + i * h2) % this.m); // 해시 계산은 2번뿐, 나머지는 산술
    }
    return pos;
  }

  private setBit(pos: number): void {
    this.bits[pos >>> 5]! |= 1 << (pos & 31);
  }

  private testBit(pos: number): boolean {
    return (this.bits[pos >>> 5]! & (1 << (pos & 31))) !== 0;
  }

  add(item: string): void {
    for (const pos of this.positions(item)) this.setBit(pos);
  }

  has(item: string): boolean {
    for (const pos of this.positions(item)) {
      if (!this.testBit(pos)) return false; // 하나라도 0이면 즉시 확정
    }
    return true;
  }

  // 검증 전용 노출(가이드 본문 스펙 절의 실측 위치 확인용)
  debugPositions(item: string): number[] {
    return this.positions(item);
  }
}

function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "OK " : "FAIL"} ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

// ---- 원형: size=10, cat/dog/bird add, 8개 미등록 단어 조회 ----
{
  const f = new Naive1BitFilter(10);
  ["cat", "dog", "bird"].forEach((x) => f.add(x));
  const unknown = ["fish", "lion", "wolf", "bear", "duck", "frog", "hare", "seal"];
  const fp = unknown.filter((x) => f.has(x));
  assertEq("[원형] false positive 목록", fp, ["frog", "hare"]);
}

// ---- 개선: size=10, k=3, 동일 조건 ----
{
  const f = new KHashFilter(10, 3);
  ["cat", "dog", "bird"].forEach((x) => f.add(x));
  const unknown = ["fish", "lion", "wolf", "bear", "duck", "frog", "hare", "seal"];
  const fp = unknown.filter((x) => f.has(x));
  assertEq("[개선] false positive 목록", fp, ["lion"]);
}

// ---- 최종: 전체 스펙 절의 m=16,k=3 예시 ----
{
  const bf = new BloomFilter(16, 3);
  assertEq("[스펙] apple positions", bf.debugPositions("apple"), [15, 12, 9]);
  assertEq("[스펙] banana positions", bf.debugPositions("banana"), [0, 6, 12]);
  assertEq("[스펙] cherry positions", bf.debugPositions("cherry"), [8, 10, 12]);

  bf.add("apple");
  bf.add("banana");
  assertEq("[스펙] has(cherry)", bf.has("cherry"), false);
  assertEq("[스펙] has(apple)", bf.has("apple"), true);
  assertEq("[스펙] has(banana)", bf.has("banana"), true);
}

// ---- 함정: m=10, k=4, "x3" 위치 붕괴 ----
{
  const bf = new BloomFilter(10, 4);
  assertEq('[함정] positions("x3")', bf.debugPositions("x3"), [6, 6, 6, 6]);
}

// ---- 문제 예시 재현 ----
{
  const bf = new BloomFilter(1000, 4);
  bf.add("apple");
  bf.add("banana");
  assertEq("[문제예시] has(apple)", bf.has("apple"), true);
  assertEq("[문제예시] has(banana)", bf.has("banana"), true);
  assertEq("[문제예시] has(cherry)", bf.has("cherry"), false);

  const large = new BloomFilter(100_000, 7);
  large.add("registered");
  assertEq("[문제예시] large.has(registered)", large.has("registered"), true);
  assertEq("[문제예시] large.has(not-registered-0)", large.has("not-registered-0"), false);

  const tiny = new BloomFilter(1, 1);
  tiny.add("x");
  assertEq("[문제예시] tiny.has(x)", tiny.has("x"), true);
  assertEq("[문제예시] tiny.has(y)", tiny.has("y"), true);
}

// ---- no false negative 대량/무작위 교차검증 ----
{
  const bf = new BloomFilter(20_000, 5);
  const items: string[] = [];
  for (let i = 0; i < 1000; i++) {
    const s = `key-${i}`;
    items.push(s);
    bf.add(s);
  }
  const allTrue = items.every((x) => bf.has(x));
  assertEq("[대량] 1000개 add 후 전원 has=true (no false negative)", allTrue, true);
}

{
  // 무작위 문자열 500개로 no-false-negative 재검증
  const bf = new BloomFilter(50_000, 6);
  const items: string[] = [];
  for (let i = 0; i < 500; i++) {
    const s = Math.random().toString(36).slice(2) + i;
    items.push(s);
    bf.add(s);
  }
  const allTrue = items.every((x) => bf.has(x));
  assertEq("[무작위] 500개 무작위 문자열 add 후 전원 has=true", allTrue, true);
}

console.log("모든 검증 완료");
