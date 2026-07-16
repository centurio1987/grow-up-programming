// FNV-1a 32비트 해시 — 문자열을 결정론적으로 하나의 정수로 압축한다.
function fnv1a(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0; // 부호 없는 32비트 정수로 변환
}

// sfc32 — 작은 상태로 빠르게 도는 시드 기반 PRNG. 같은 시드면 항상 같은 수열을 낸다.
function sfc32(a: number, b: number, c: number, d: number) {
  return function (): number {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

const PRIME = 2147483647; // 2^31 - 1 (메르센 소수)

export class MinHash {
  private readonly k: number;
  private readonly a: number[];
  private readonly b: number[];
  private sig: number[];

  constructor(numHashes: number) {
    this.k = numHashes;
    const rand = sfc32(0x9e3779b9, 0x243f6a88, 0xb7e15162, 0x2545f491); // 고정 시드
    this.a = [];
    this.b = [];
    for (let i = 0; i < numHashes; i++) {
      let ai = Math.floor(rand() * (PRIME - 1)) + 1;
      if (ai % 2 === 0) ai += 1; // a는 홀수로 강제(PRIME과 서로소 보장)
      this.a.push(ai);
      this.b.push(Math.floor(rand() * PRIME));
    }
    this.sig = new Array(numHashes).fill(Infinity);
  }

  update(set: Iterable<string>): void {
    this.sig = new Array(this.k).fill(Infinity);
    for (const x of set) {
      const base = BigInt(fnv1a(x));
      for (let i = 0; i < this.k; i++) {
        // a*base가 안전 정수 범위를 넘으므로 BigInt로 모듈러 연산
        const h = Number((BigInt(this.a[i]!) * base + BigInt(this.b[i]!)) % BigInt(PRIME));
        if (h < this.sig[i]!) this.sig[i] = h;
      }
    }
  }

  signature(): number[] {
    return this.sig.slice();
  }

  static jaccard(a: MinHash, b: MinHash): number {
    let matches = 0;
    for (let i = 0; i < a.k; i++) {
      if (a.sig[i] === b.sig[i]) matches++;
    }
    return matches / a.k;
  }

  static exact(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 && b.size === 0) return 1;
    let interCount = 0;
    for (const x of a) if (b.has(x)) interCount++;
    const unionCount = a.size + b.size - interCount;
    return interCount / unionCount;
  }
}

// ---- 실측 검증 드라이버 (가이드 본문 수치의 근거) ----
function trace() {
  const mh = new MinHash(4);
  console.log("=== 대표: apple/banana/cherry, k=4 ===");
  console.log(
    "fnv1a: apple=",
    fnv1a("apple"),
    "banana=",
    fnv1a("banana"),
    "cherry=",
    fnv1a("cherry"),
    "durian=",
    fnv1a("durian"),
  );
  console.log("a[]=", (mh as any).a);
  console.log("b[]=", (mh as any).b);

  const words = ["apple", "banana", "cherry"];
  let sig = new Array(4).fill(Infinity);
  for (const w of words) {
    const base = BigInt(fnv1a(w));
    const hs: number[] = [];
    for (let i = 0; i < 4; i++) {
      const h = Number((BigInt((mh as any).a[i]) * base + BigInt((mh as any).b[i])) % BigInt(PRIME));
      hs.push(h);
      if (h < sig[i]) sig[i] = h;
    }
    console.log(`${w}: h=[${hs.join(", ")}] -> sig=[${sig.join(", ")}]`);
  }

  const mhA = new MinHash(4);
  mhA.update(["apple", "banana", "cherry"]);
  console.log("signature A:", mhA.signature());

  const mhB = new MinHash(4);
  mhB.update(["apple", "cherry", "durian"]);
  console.log("signature B:", mhB.signature());

  console.log("jaccard estimate:", MinHash.jaccard(mhA, mhB));
  console.log(
    "jaccard exact:",
    MinHash.exact(new Set(["apple", "banana", "cherry"]), new Set(["apple", "cherry", "durian"])),
  );

  // 엣지: 빈 집합
  const e1 = new MinHash(4);
  e1.update([]);
  console.log("empty signature:", e1.signature());
  console.log("empty exact:", MinHash.exact(new Set(), new Set()));

  // 엣지: numHashes = 1
  const e2 = new MinHash(1);
  e2.update(["a", "b", "c"]);
  console.log("numHashes=1 signature:", e2.signature());

  // 동일 집합, 순서 무관
  const s1 = new MinHash(8);
  const s2 = new MinHash(8);
  s1.update(["x", "y", "z"]);
  s2.update(["z", "x", "y"]);
  console.log("order-invariant equal:", JSON.stringify(s1.signature()) === JSON.stringify(s2.signature()));

  // 큰 표본으로 정확도 확인 (무작위 교차검증)
  const big1 = Array.from({ length: 200 }, (_, i) => `w${i}`);
  const big2 = Array.from({ length: 200 }, (_, i) => `w${i + 100}`); // 100개 겹침, 300 합집합
  const m1 = new MinHash(256);
  const m2 = new MinHash(256);
  m1.update(big1);
  m2.update(big2);
  console.log("big jaccard estimate (k=256):", MinHash.jaccard(m1, m2));
  console.log("big jaccard exact:", MinHash.exact(new Set(big1), new Set(big2)));
}

trace();
