// 가이드 본문 코드의 자기검증용 스크래치 추출본.
// cuckooFilter-guide.new.mdx의 "아이디어를 코드로 옮기기" 코드와 동일해야 한다.
// (아래 클래스 본체는 가이드 코드 블록을 그대로 옮긴 것 — 디버그 헬퍼만 추가됨)

const BUCKET_SIZE = 2; // 데모 상수(실무 표준은 4 — 캐시 라인 친화적이고 부하율 95%까지 허용)

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function fmix32(h: number): number {
  h = h >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

class CuckooFilter {
  private buckets: number[][];
  private numBuckets: number;
  private fpMask: number;
  private count = 0;
  private readonly MAX_KICKS = 500;

  constructor(capacity: number, fingerprintSize: number = 8) {
    this.numBuckets = nextPowerOfTwo(Math.ceil(capacity / BUCKET_SIZE));
    this.buckets = Array.from({ length: this.numBuckets }, () =>
      Array(BUCKET_SIZE).fill(0),
    );
    this.fpMask = (1 << fingerprintSize) - 1;
  }

  private fingerprint(item: string): number {
    const fp = fnv1a(item) & this.fpMask;
    return fp === 0 ? 1 : fp; // 0은 "빈 슬롯" 표식이므로 절대 금지
  }

  private index1(item: string): number {
    return fnv1a(item) & (this.numBuckets - 1);
  }

  // XOR 자기 역원: index2From(index2From(i, fp), fp) === i
  private index2From(index: number, fp: number): number {
    return (index ^ (fmix32(fp) & (this.numBuckets - 1))) & (this.numBuckets - 1);
  }

  private indices(item: string): [number, number] {
    const fp = this.fingerprint(item);
    const i1 = this.index1(item);
    const i2 = this.index2From(i1, fp);
    return [i1, i2];
  }

  add(item: string): boolean {
    const fp = this.fingerprint(item);
    const i1 = this.index1(item);
    const i2 = this.index2From(i1, fp);

    if (this.placeIfRoom(i1, fp)) return true;
    if (this.placeIfRoom(i2, fp)) return true;

    // 실무 구현은 i1/i2와 슬롯을 무작위로 고른다(사이클 회피). 이 가이드는 손 추적이
    // 가능하도록 "i1부터, 슬롯 0부터"로 고정한다.
    let i = i1;
    let kicked = fp;
    for (let k = 0; k < this.MAX_KICKS; k++) {
      const slot = 0;
      const evicted = this.buckets[i]![slot]!;
      this.buckets[i]![slot] = kicked;
      kicked = evicted;
      i = this.index2From(i, kicked);
      if (this.placeIfRoom(i, kicked)) return true;
    }
    return false; // 필터 포화
  }

  private placeIfRoom(bucketIdx: number, fp: number): boolean {
    const bucket = this.buckets[bucketIdx]!;
    for (let s = 0; s < bucket.length; s++) {
      if (bucket[s] === 0) {
        bucket[s] = fp;
        this.count++;
        return true;
      }
    }
    return false;
  }

  has(item: string): boolean {
    const [i1, i2] = this.indices(item);
    const fp = this.fingerprint(item);
    return this.buckets[i1]!.includes(fp) || this.buckets[i2]!.includes(fp);
  }

  delete(item: string): boolean {
    const [i1, i2] = this.indices(item);
    const fp = this.fingerprint(item);
    for (const idx of [i1, i2]) {
      const bucket = this.buckets[idx]!;
      const pos = bucket.indexOf(fp);
      if (pos !== -1) {
        bucket[pos] = 0;
        this.count--;
        return true;
      }
    }
    return false;
  }

  size(): number {
    return this.count;
  }

  loadFactor(): number {
    return this.count / (this.numBuckets * BUCKET_SIZE);
  }

  // ---- 검증용 디버그 헬퍼 (본문 코드에는 포함하지 않음) ----
  debugFlat(): number[] {
    return this.buckets.flat();
  }
  debugFp(item: string): number {
    return this.fingerprint(item);
  }
  debugIndices(item: string): [number, number] {
    return this.indices(item);
  }
}

// ---------------- 실측 검증 ----------------

const cf = new CuckooFilter(8, 8);
console.log("numBuckets check via flat length:", cf.debugFlat().length); // 4*2=8

const items = ["sun", "blue", "hill", "lake", "dog"];
for (const it of items) {
  const fp = cf.debugFp(it);
  const [i1, i2] = cf.debugIndices(it);
  console.log(`fingerprint('${it}') = 0x${fp.toString(16)} (${fp}), i1=${i1}, i2=${i2}`);
}

console.log("--- 순차 삽입 ---");
for (const it of items) {
  const ok = cf.add(it);
  console.log(`add('${it}') => ${ok}, flat=`, cf.debugFlat(), "count=", cf.size());
}

console.log("--- has 확인 ---");
console.log("has('dog') =>", cf.has("dog"));
console.log("has('sun') =>", cf.has("sun"));
console.log("has('nope') =>", cf.has("nope"));

console.log("--- delete ---");
console.log("delete('dog') =>", cf.delete("dog"));
console.log("flat after delete=", cf.debugFlat());
console.log("has('dog') after delete =>", cf.has("dog"));
console.log("size() =>", cf.size());
console.log("loadFactor() =>", cf.loadFactor());

// 엣지 케이스
console.log("--- 엣지 케이스 ---");
const empty = new CuckooFilter(8, 8);
console.log("빈 필터 has =>", empty.has("x"));
console.log("빈 필터 delete =>", empty.delete("x"));
console.log("빈 필터 size/loadFactor =>", empty.size(), empty.loadFactor());

// 포화 테스트: 용량 초과 삽입
console.log("--- 포화 테스트 ---");
const small = new CuckooFilter(8, 8); // numBuckets=4, bucketSize=2 => 8슬롯
let successCount = 0;
let failCount = 0;
for (let i = 0; i < 40; i++) {
  const ok = small.add(`item-${i}`);
  if (ok) successCount++;
  else failCount++;
}
console.log("성공:", successCount, "실패:", failCount, "size=", small.size(), "loadFactor=", small.loadFactor());

// 무작위 교차검증: add 후 즉시 has는 항상 true (false negative 없음, 이건 절대 규칙)
console.log("--- 무작위 교차검증 (false negative 없음) ---");
let allOk = true;
for (let trial = 0; trial < 50; trial++) {
  const filter = new CuckooFilter(64, 8);
  const inserted: string[] = [];
  for (let i = 0; i < 20; i++) {
    const key = `key-${trial}-${i}-${Math.random().toString(36).slice(2, 8)}`;
    if (filter.add(key)) {
      inserted.push(key);
      if (!filter.has(key)) {
        console.log("FALSE NEGATIVE 발견! (있으면 안 됨)", key);
        allOk = false;
      }
    }
  }
}
console.log("무작위 교차검증(false negative) 전체 통과:", allOk);

// delete 불변식은 "지문 충돌이 없는 한" 성립한다 — fingerprintSize를 넉넉히 키워 충돌 확률을 낮추고 확인
console.log("--- delete 불변식 교차검증 (fingerprintSize=16으로 충돌 회피) ---");
let deleteOk = true;
for (let trial = 0; trial < 20; trial++) {
  const filter = new CuckooFilter(64, 16);
  const inserted: string[] = [];
  for (let i = 0; i < 20; i++) {
    const key = `k16-${trial}-${i}-${Math.random().toString(36).slice(2, 8)}`;
    if (filter.add(key)) inserted.push(key);
  }
  for (const key of inserted) {
    const deleted = filter.delete(key);
    const after = filter.has(key);
    if (!deleted || after) {
      console.log("삭제 불변식 위반", key, { deleted, after });
      deleteOk = false;
    }
  }
}
console.log("delete 불변식 교차검증 전체 통과:", deleteOk);

// 지문 충돌로 delete 후에도 has가 true로 남는 사례를 의도적으로 재현 (false positive 잔존)
console.log("--- 지문 충돌 시 delete 후 false positive 잔존 재현 ---");
{
  const filter = new CuckooFilter(8, 8); // fingerprintSize=8로 다시 작게
  // 8비트 지문(0~255) 공간에서 동일 지문 + 동일 버킷 쌍을 만드는 두 문자열을 탐색
  let found: [string, string] | null = null;
  outer: for (let a = 0; a < 5000 && !found; a++) {
    const ka = `c-${a}`;
    const fpA = filter.debugFp(ka);
    const idxA = filter.debugIndices(ka);
    for (let b = a + 1; b < 5000; b++) {
      const kb = `c-${b}`;
      const fpB = filter.debugFp(kb);
      const idxB = filter.debugIndices(kb);
      if (fpA === fpB && idxA[0] === idxB[0] && idxA[1] === idxB[1] && ka !== kb) {
        found = [ka, kb];
        break outer;
      }
    }
  }
  if (found) {
    const [ka, kb] = found;
    console.log(`충돌 쌍 발견: ${ka}, ${kb} (fp=0x${filter.debugFp(ka).toString(16)}, 버킷=${filter.debugIndices(ka)})`);
    filter.add(ka);
    filter.add(kb);
    filter.delete(ka);
    console.log(`delete('${ka}') 이후 has('${ka}') =>`, filter.has(ka), "(다른 항목의 동일 지문 때문에 true로 남음 — false positive)");
  } else {
    console.log("충돌 쌍을 찾지 못함(재현 실패, 탐색 범위 확대 필요)");
  }
}

// D6 함정 데모용: fp가 0이 되는 원본 문자열 탐색 (가드가 없다면 무슨 일이 생기는지 보이기 위함)
console.log("--- fp=0 가드 데모용 문자열 탐색 ---");
{
  const filter = new CuckooFilter(8, 8);
  for (let i = 0; i < 20000; i++) {
    const key = `zero-${i}`;
    // fnv1a 직접 재현 불가(비공개) → filter의 fingerprint는 이미 가드가 적용됨.
    // 별도로 가드 없는 fnv1a&mask를 재계산해서 원본이 0이었는지 확인한다.
    let hash = 0x811c9dc5;
    for (let c = 0; c < key.length; c++) {
      hash ^= key.charCodeAt(c);
      hash = Math.imul(hash, 0x01000193);
    }
    hash = hash >>> 0;
    const rawFp = hash & 0xff;
    if (rawFp === 0) {
      console.log(`발견: '${key}' → 원본 fp=0 (가드 후 fingerprint()=${filter.debugFp(key)})`);
      break;
    }
  }
}
