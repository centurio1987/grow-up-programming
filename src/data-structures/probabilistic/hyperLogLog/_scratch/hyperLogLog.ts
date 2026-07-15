/**
 * HyperLogLog — 가이드 본문과 1:1 대응하는 자기검증용 스크래치 구현.
 * 실행: bun src/data-structures/probabilistic/hyperLogLog/_scratch/hyperLogLog.ts
 */

class HyperLogLog {
  private readonly p: number;
  private readonly m: number;
  private readonly M: Uint8Array;
  private readonly alphaM: number;

  constructor(precision: number = 10) {
    this.p = precision;
    this.m = 1 << precision;
    this.M = new Uint8Array(this.m);
    this.alphaM = 0.7213 / (1 + 1.079 / this.m);
  }

  private hash(item: string): number {
    let h = 0x811c9dc5; // FNV-1a 32비트 offset basis
    for (let i = 0; i < item.length; i++) {
      h ^= item.charCodeAt(i);
      h = Math.imul(h, 0x01000193); // FNV prime
    }
    return h >>> 0;
  }

  add(item: string): void {
    const h = this.hash(item);
    const j = h >>> (32 - this.p);
    const w = this.p === 32 ? 0 : h & ((1 << (32 - this.p)) - 1);
    // Math.clz32(w)는 w를 항상 "32비트 정수"로 보고 선행 0을 센다.
    // w는 마스킹으로 상위 p비트가 이미 0으로 고정돼 있으므로,
    // 그 p비트만큼을 빼야 (32-p)비트짜리 실제 꼬리 안에서의 선행 0 개수가 된다.
    const rho = Math.clz32(w) - this.p + 1;
    if (rho > this.M[j]!) this.M[j] = rho;
  }

  count(): number {
    let sum = 0;
    let zeros = 0;
    for (let j = 0; j < this.m; j++) {
      sum += 2 ** -this.M[j]!;
      if (this.M[j] === 0) zeros++;
    }
    let E = (this.alphaM * this.m * this.m) / sum;

    if (E <= 2.5 * this.m) {
      if (zeros > 0) E = this.m * Math.log(this.m / zeros);
    } else if (E > (1 / 30) * 2 ** 32) {
      E = -(2 ** 32) * Math.log(1 - E / 2 ** 32);
    }
    return Math.round(E);
  }

  merge(other: HyperLogLog): HyperLogLog {
    if (other.p !== this.p) throw new Error("precision mismatch");
    const result = new HyperLogLog(this.p);
    for (let j = 0; j < this.m; j++) {
      result.M[j] = Math.max(this.M[j]!, other.M[j]!);
    }
    return result;
  }

  error(): number {
    return 1.04 / Math.sqrt(this.m);
  }

  // 검증 전용 노출
  debugRow(item: string) {
    const h = this.hash(item);
    const j = h >>> (32 - this.p);
    const w = this.p === 32 ? 0 : h & ((1 << (32 - this.p)) - 1);
    const rho = Math.clz32(w) - this.p + 1;
    return { item, h: (h >>> 0).toString(2).padStart(32, "0"), j, w: (w >>> 0).toString(2).padStart(32 - this.p, "0"), rho };
  }

  bucketsSnapshot(): number[] {
    return Array.from(this.M);
  }
}

// ---- 실측 1: precision=3(m=8) 트레이스 ----
console.log("=== precision=3, m=8 트레이스 ===");
const hll3 = new HyperLogLog(3);
const names = ["alice", "bob", "carol", "dave", "eve"];
for (const name of names) {
  const row = hll3.debugRow(name);
  hll3.add(name);
  console.log(
    `add('${name}'): h=${row.h} j=${row.j} w=${row.w} rho=${row.rho} -> M=${JSON.stringify(hll3.bucketsSnapshot())}`,
  );
}
console.log("count() =", hll3.count(), " (실제 유니크 수 = 5)");
console.log("error() =", hll3.error());

// ---- 실측 2: 소규모 보정 경로 확인 (원소 0개) ----
console.log("\n=== 빈 HLL ===");
const hllEmpty = new HyperLogLog(4);
console.log("count() =", hllEmpty.count(), "buckets=", hllEmpty.bucketsSnapshot());

// ---- 실측 3: merge ----
console.log("\n=== merge ===");
const a = new HyperLogLog(3);
const b = new HyperLogLog(3);
for (const n of ["alice", "bob"]) a.add(n);
for (const n of ["carol", "dave", "eve"]) b.add(n);
const merged = a.merge(b);
console.log("a.buckets =", a.bucketsSnapshot());
console.log("b.buckets =", b.bucketsSnapshot());
console.log("merged.buckets =", merged.bucketsSnapshot());
console.log("merged.count() =", merged.count());
console.log("a unchanged after merge:", a.bucketsSnapshot());

// ---- 실측 4: 중간 규모 정확도(precision=10, n=100000 유니크) ----
console.log("\n=== precision=10, n=100000 유니크 문자열 ===");
const hllBig = new HyperLogLog(10);
const N = 100_000;
for (let i = 0; i < N; i++) hllBig.add(`user-${i}`);
const est = hllBig.count();
const err = Math.abs(est - N) / N;
console.log("count() =", est, " 실제 =", N, " 상대오차 =", (err * 100).toFixed(3) + "%", " error() 상한 =", (hllBig.error() * 100).toFixed(2) + "%");

// ---- 실측 5: 중복 추가 멱등성 ----
console.log("\n=== 중복 추가 ===");
const hllDup = new HyperLogLog(6);
hllDup.add("x");
const before = hllDup.count();
hllDup.add("x");
hllDup.add("x");
const after = hllDup.count();
console.log("중복 전:", before, "중복 후:", after, "동일?", before === after);

// ---- 실측 6: precision 경계값 ----
console.log("\n=== precision=4(최소권장), precision=16(최대) 스모크 ===");
const hllMin = new HyperLogLog(4);
for (let i = 0; i < 50; i++) hllMin.add(`k${i}`);
console.log("p=4 m=16 count(50개 추가) =", hllMin.count(), "error() =", hllMin.error());

console.log("\n=== hllMin buckets 디버그 ===");
console.log(hllMin.bucketsSnapshot());

// ---- 실측 7: "코드 진화 사다리" 비교용 — 단일 버킷(무분할) 추정 vs 버킷 분할 ----
console.log("\n=== 단일 버킷(p=0) 방식과 버킷 분할(p=10) 방식 비교, N=100000 ===");
function fnv1a(item: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < item.length; i++) {
    h ^= item.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
{
  let maxRho = 0;
  const N2 = 100_000;
  for (let i = 0; i < N2; i++) {
    const h = fnv1a(`user-${i}`);
    const rho = Math.clz32(h) + 1; // p=0: 전체 32비트가 곧 tail
    if (rho > maxRho) maxRho = rho;
  }
  const singleBucketEstimate = 2 ** maxRho;
  console.log(
    `단일 버킷: maxRho=${maxRho} -> n≈2^${maxRho}=${singleBucketEstimate} (실제=${N2}, 상대오차=${(
      (Math.abs(singleBucketEstimate - N2) / N2) *
      100
    ).toFixed(1)}%)`,
  );
}
{
  // 5개 원소용 단일 버킷 추정 (본문 트레이스와 동일 입력)
  let maxRho = 0;
  for (const name of names) {
    const h = fnv1a(name);
    const rho = Math.clz32(h) + 1;
    if (rho > maxRho) maxRho = rho;
    console.log(`  ${name}: h=${(h>>>0).toString(2).padStart(32,"0")} rho=${rho}`);
  }
  console.log(`단일 버킷(5개 원소): maxRho=${maxRho} -> n≈2^${maxRho}=${2 ** maxRho} (실제=5)`);
}

// ---- 실측 8: clz32 버그 재현(가이드 함정용) — precision=10에서 -p 보정 누락 시 ----
console.log("\n=== 함정 재현: rho = clz32(w)+1 (p 보정 누락) ===");
{
  const p = 10;
  const m = 1 << p;
  const buckets = new Uint8Array(m);
  const N3 = 100_000;
  for (let i = 0; i < N3; i++) {
    const h = fnv1a(`user-${i}`);
    const j = h >>> (32 - p);
    const w = h & ((1 << (32 - p)) - 1);
    const rhoBuggy = Math.clz32(w) + 1; // 버그: -p 보정 누락
    if (rhoBuggy > buckets[j]!) buckets[j] = rhoBuggy;
  }
  let sum = 0, zeros = 0;
  for (let j = 0; j < m; j++) {
    sum += 2 ** -buckets[j]!;
    if (buckets[j] === 0) zeros++;
  }
  const alphaM = 0.7213 / (1 + 1.079 / m);
  let E = (alphaM * m * m) / sum;
  if (E <= 2.5 * m) {
    if (zeros > 0) E = m * Math.log(m / zeros);
  } else if (E > (1 / 30) * 2 ** 32) {
    E = -(2 ** 32) * Math.log(1 - E / 2 ** 32);
  }
  console.log(`버그 버전 count() = ${Math.round(E)} (실제=${N3}, 상대오차=${((Math.abs(Math.round(E)-N3)/N3)*100).toFixed(0)}%)`);
}
