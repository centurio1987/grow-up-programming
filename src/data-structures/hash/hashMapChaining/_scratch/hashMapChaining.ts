// E3 self-verification scratch — extracted from guide body, run with:
//   bun src/data-structures/hash/hashMapChaining/_scratch/hashMapChaining.ts

class HashMapChaining<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private capacity: number;
  private count: number;
  private readonly LOAD_FACTOR = 0.75;

  constructor(initialCapacity: number = 16) {
    this.capacity = initialCapacity;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.count = 0;
  }

  private hashWith(key: K, capacity: number): number {
    const s = String(key);
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) % capacity;
    }
    return h;
  }

  private hash(key: K): number {
    return this.hashWith(key, this.capacity);
  }

  private resize(): void {
    const newCapacity = this.capacity * 2;
    const newBuckets: Array<Array<[K, V]>> = Array.from({ length: newCapacity }, () => []);
    for (const chain of this.buckets) {
      for (const [k, v] of chain) {
        const newIndex = this.hashWith(k, newCapacity);
        newBuckets[newIndex]!.push([k, v]);
      }
    }
    this.buckets = newBuckets;
    this.capacity = newCapacity;
  }

  set(key: K, value: V): void {
    const index = this.hash(key);
    const chain = this.buckets[index]!;
    for (let i = 0; i < chain.length; i++) {
      if (chain[i]![0] === key) {
        chain[i] = [key, value];
        return;
      }
    }
    chain.push([key, value]);
    this.count++;
    if (this.count / this.capacity > this.LOAD_FACTOR) {
      this.resize();
    }
  }

  get(key: K): V | undefined {
    const chain = this.buckets[this.hash(key)]!;
    for (const [k, v] of chain) {
      if (k === key) return v;
    }
    return undefined;
  }

  has(key: K): boolean {
    const chain = this.buckets[this.hash(key)]!;
    return chain.some(([k]) => k === key);
  }

  delete(key: K): boolean {
    const chain = this.buckets[this.hash(key)]!;
    for (let i = 0; i < chain.length; i++) {
      if (chain[i]![0] === key) {
        chain.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  size(): number {
    return this.count;
  }

  keys(): K[] {
    const result: K[] = [];
    for (const chain of this.buckets) {
      for (const [k] of chain) result.push(k);
    }
    return result;
  }

  values(): V[] {
    const result: V[] = [];
    for (const chain of this.buckets) {
      for (const [, v] of chain) result.push(v);
    }
    return result;
  }

  // 시각화/디버깅용: 각 버킷의 체인 길이 배열
  chainLengths(): number[] {
    return this.buckets.map((c) => c.length);
  }
}

function log(label: string, value: unknown) {
  console.log(label, JSON.stringify(value));
}

// ---- 대표 시나리오: 문서 "실행 시각화"와 1:1 대응 (initialCapacity=4) ----
console.log("=== 대표 시나리오 (capacity=4 시작) ===");
const m = new HashMapChaining<string, number>(4);
log("초기 chainLengths", m.chainLengths());

m.set("a", 1);
log('set("a",1) → hash', undefined);
log("  chainLengths", m.chainLengths());

m.set("b", 2);
log("  chainLengths", m.chainLengths());

m.set("c", 3);
log("  chainLengths (count/capacity=3/4)", m.chainLengths());

m.set("e", 5); // e도 해시 1 → a와 충돌 → count 4/4=1.0>0.75 → resize
log("  chainLengths AFTER resize (capacity now 8)", m.chainLengths());
log("  size()", m.size());

log('get("e")', m.get("e"));
log('get("z") (없는 키)', m.get("z"));

log('delete("a")', m.delete("a"));
log("  chainLengths after delete a", m.chainLengths());
log('has("a") after delete', m.has("a"));
log("size()", m.size());
log("keys()", m.keys());
log("values()", m.values());

// ---- 개별 해시값 검증 (capacity=4, capacity=8) ----
console.log("\n=== 해시값 직접 계산 ===");
function hashOf(key: string, capacity: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % capacity;
  return h;
}
for (const k of ["a", "b", "c", "e"]) {
  console.log(k, "cap4=", hashOf(k, 4), "cap8=", hashOf(k, 8));
}

// ---- 엣지 케이스 ----
console.log("\n=== 엣지 케이스 ===");
const empty = new HashMapChaining<string, number>(4);
log("빈 맵 get", empty.get("x"));
log("빈 맵 has", empty.has("x"));
log("빈 맵 delete", empty.delete("x"));
log("빈 맵 size", empty.size());
log("빈 맵 keys", empty.keys());

const overwrite = new HashMapChaining<string, number>(4);
overwrite.set("k", 1);
overwrite.set("k", 2); // 같은 키 재삽입 → 덮어쓰기, count 불변
log("덮어쓰기 후 get", overwrite.get("k"));
log("덮어쓰기 후 size (1이어야 함)", overwrite.size());

const delMissing = new HashMapChaining<string, number>(4);
delMissing.set("p", 1);
log("없는 키 delete", delMissing.delete("q"));
log("size 불변", delMissing.size());

// ---- 무작위 교차검증: Map과 비교 ----
console.log("\n=== 무작위 교차검증 (vs 내장 Map) ===");
function randomKey(rng: () => number): string {
  const chars = "abcdefghij";
  const len = 1 + Math.floor(rng() * 4);
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(rng() * chars.length)];
  return s;
}
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(42);
const oracle = new Map<string, number>();
const hm = new HashMapChaining<string, number>(4);
let mismatches = 0;
for (let i = 0; i < 2000; i++) {
  const op = Math.floor(rng() * 4);
  const key = randomKey(rng);
  if (op === 0) {
    const v = Math.floor(rng() * 1000);
    oracle.set(key, v);
    hm.set(key, v);
  } else if (op === 1) {
    if (oracle.get(key) !== hm.get(key)) mismatches++;
  } else if (op === 2) {
    if (oracle.has(key) !== hm.has(key)) mismatches++;
  } else {
    const oExisted = oracle.delete(key);
    const hExisted = hm.delete(key);
    if (oExisted !== hExisted) mismatches++;
  }
  if (oracle.size !== hm.size()) mismatches++;
}
console.log("mismatches:", mismatches, "(0이어야 함)");
console.log("최종 size 일치:", oracle.size === hm.size(), oracle.size, hm.size());
const oracleKeysSorted = [...oracle.keys()].sort();
const hmKeysSorted = hm.keys().sort();
console.log("키 집합 일치:", JSON.stringify(oracleKeysSorted) === JSON.stringify(hmKeysSorted));
