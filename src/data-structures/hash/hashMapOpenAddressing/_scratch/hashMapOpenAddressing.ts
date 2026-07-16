/**
 * E3 자기검증 스크래치 — 가이드 본문에 싣는 코드를 그대로 옮겨 실행한다.
 * 실행: bun src/data-structures/hash/hashMapOpenAddressing/_scratch/hashMapOpenAddressing.ts
 */

type Slot<K, V> =
  | { state: "empty" }
  | { state: "occupied"; key: K; value: V }
  | { state: "tombstone" };

class HashMapOpenAddressing<K, V> {
  private slots: Array<Slot<K, V>>;
  private capacity: number;
  private count: number;
  private readonly LOAD_FACTOR = 0.5;

  constructor(initialCapacity: number = 16) {
    this.capacity = initialCapacity;
    this.slots = Array.from({ length: this.capacity }, () => ({ state: "empty" as const }));
    this.count = 0;
  }

  private hash(key: K): number {
    const s = String(key);
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    }
    return ((h % this.capacity) + this.capacity) % this.capacity;
  }

  private resize(): void {
    const oldSlots = this.slots;
    this.capacity *= 2;
    this.slots = Array.from({ length: this.capacity }, () => ({ state: "empty" as const }));
    this.count = 0;
    for (const slot of oldSlots) {
      if (slot.state === "occupied") {
        this.set(slot.key, slot.value);
      }
    }
  }

  set(key: K, value: V): void {
    let firstTombstone = -1;
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "occupied" && slot.key === key) {
        slot.value = value;
        return;
      }
      if (slot.state === "tombstone") {
        if (firstTombstone === -1) firstTombstone = idx;
        continue;
      }
      if (slot.state === "empty") {
        const insertAt = firstTombstone !== -1 ? firstTombstone : idx;
        this.slots[insertAt] = { state: "occupied", key, value };
        this.count++;
        if (this.count / this.capacity > this.LOAD_FACTOR) this.resize();
        return;
      }
    }
  }

  get(key: K): V | undefined {
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "empty") return undefined;
      if (slot.state === "occupied" && slot.key === key) return slot.value;
    }
    return undefined;
  }

  has(key: K): boolean {
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "empty") return false;
      if (slot.state === "occupied" && slot.key === key) return true;
    }
    return false;
  }

  delete(key: K): boolean {
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "empty") return false;
      if (slot.state === "occupied" && slot.key === key) {
        this.slots[idx] = { state: "tombstone" };
        this.count--;
        return true;
      }
    }
    return false;
  }

  size(): number {
    return this.count;
  }

  // 검증 전용: 슬롯 원본 상태 노출 (private 우회)
  _debugSlots(): Slot<K, V>[] {
    return this.slots;
  }
  _debugCapacity(): number {
    return this.capacity;
  }
  _debugHash(key: K): number {
    return this.hash(key);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${label} — actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${label} — ${a}`);
  }
}

// ── 0. 실제 hash() 출력 확인 (본문에서 "hash("a")=1" 등으로 인용) ──
console.log("--- 0. 실제 hash() 출력 (capacity=8) ---");
{
  const probe = new HashMapOpenAddressing<string, number>(8);
  console.log("hash('a') =", probe._debugHash("a"));
  console.log("hash('b') =", probe._debugHash("b"));
  console.log("hash('c') =", probe._debugHash("c"));
}

// ── 1. 문제 예시 (problem.md 그대로) ──
console.log("\n--- 1. 문제 예시 트레이스 ---");
{
  const map = new HashMapOpenAddressing<string, number>();
  map.set("a", 1);
  map.set("b", 2);
  map.set("c", 3);
  assertEqual(map.get("b"), 2, 'get("b")');
  assertEqual(map.has("c"), true, 'has("c")');
  assertEqual(map.delete("b"), true, 'delete("b")');
  assertEqual(map.has("b"), false, 'has("b") after delete');
  assertEqual(map.get("c"), 3, 'get("c") after delete("b")');
  map.set("b", 99);
  assertEqual(map.get("b"), 99, 'get("b") after tombstone reuse');
  assertEqual(map.size(), 3, "size() after full sequence");
}

// ── 2. 시뮬레이션 데모: capacity=8, hash("a")=hash("b")=hash("c")=3 가정 ──
// 가이드 본문에서는 "설명 목적의 가정된 충돌 시나리오"임을 명시한다.
// 여기서는 실제 hash()를 3으로 고정한 스텁 서브클래스로 정확히 같은 확률/로직을 검증한다.
console.log("\n--- 2. 시뮬레이션 데모 (고정 해시=3 스텁) ---");
class StubbedHashMap<K, V> extends HashMapOpenAddressing<K, V> {
  private fixed: Map<K, number>;
  constructor(initialCapacity: number, fixed: Map<K, number>) {
    super(initialCapacity);
    this.fixed = fixed;
    // @ts-expect-error: private 오버라이드 (검증 전용)
    this.hash = (key: K) => this.fixed.get(key) ?? 0;
  }
}

function slotsToDemoArray<K, V>(map: HashMapOpenAddressing<K, V>): number[] {
  return map._debugSlots().map((s) => (s.state === "occupied" ? 1 : s.state === "tombstone" ? -1 : 0));
}

{
  const fixed = new Map<string, number>([
    ["a", 3],
    ["b", 3],
    ["c", 3],
  ]);
  const demo = new StubbedHashMap<string, number>(8, fixed);

  assertEqual(slotsToDemoArray(demo), [0, 0, 0, 0, 0, 0, 0, 0], "step0 초기 상태");

  demo.set("a", 1);
  assertEqual(slotsToDemoArray(demo), [0, 0, 0, 1, 0, 0, 0, 0], 'step1 set("a",1) → 슬롯3');

  demo.set("b", 2);
  assertEqual(slotsToDemoArray(demo), [0, 0, 0, 1, 1, 0, 0, 0], 'step2 set("b",2) → 슬롯4');

  demo.set("c", 3);
  assertEqual(slotsToDemoArray(demo), [0, 0, 0, 1, 1, 1, 0, 0], 'step3 set("c",3) → 슬롯5');

  demo.delete("b");
  assertEqual(slotsToDemoArray(demo), [0, 0, 0, 1, -1, 1, 0, 0], 'step4 delete("b") → 슬롯4 tombstone');

  const got = demo.get("c");
  assertEqual(got, 3, 'step5 get("c") 반환값');
  assertEqual(slotsToDemoArray(demo), [0, 0, 0, 1, -1, 1, 0, 0], "step5 배열 상태 불변");
}

// ── 3. 코드 진화 사다리: 실제 충돌 키(dog/owl/elk, capacity=8에서 모두 hash=4)로 검증 ──
console.log("\n--- 3. 코드 진화 사다리 (실제 충돌 키 dog/owl/elk) ---");
{
  const probe = new HashMapOpenAddressing<string, number>(8);
  console.log(
    "hash(dog)/hash(owl)/hash(elk) =",
    probe._debugHash("dog"),
    probe._debugHash("owl"),
    probe._debugHash("elk"),
  );
}

// 3-1. 원형: tombstone 자체가 없는 (단순 empty 되돌리기) 삭제
class NoTombstoneMap<K, V> {
  private slots: Array<{ state: "empty" } | { state: "occupied"; key: K; value: V }>;
  private capacity: number;
  constructor(capacity: number) {
    this.capacity = capacity;
    this.slots = Array.from({ length: capacity }, () => ({ state: "empty" as const }));
  }
  private hash(key: K): number {
    const s = String(key);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return ((h % this.capacity) + this.capacity) % this.capacity;
  }
  set(key: K, value: V): void {
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "occupied" && slot.key === key) { slot.value = value; return; }
      if (slot.state === "empty") { this.slots[idx] = { state: "occupied", key, value }; return; }
    }
  }
  get(key: K): V | undefined {
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "empty") return undefined;
      if (slot.state === "occupied" && slot.key === key) return slot.value;
    }
    return undefined;
  }
  delete(key: K): void {
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "empty") return;
      if (slot.state === "occupied" && slot.key === key) {
        this.slots[idx] = { state: "empty" }; // ← tombstone 없이 진짜 empty (버그)
        return;
      }
    }
  }
}
{
  const naive = new NoTombstoneMap<string, number>(8);
  naive.set("dog", 10);
  naive.set("owl", 20);
  naive.set("elk", 30);
  naive.delete("owl"); // 슬롯5(owl)를 진짜 empty로 되돌림
  const broken = naive.get("elk"); // 슬롯4(dog,불일치)→슬롯5(empty!)→중단, 슬롯6의 elk를 못 봄
  assertEqual(broken, undefined, 'Stage1(tombstone 없음): delete("owl") 후 get("elk") — 실제로는 있는데 못 찾음');
}

// 3-2. 개선: tombstone은 마킹하지만 삽입 시 재활용하지 않는 버전 (탐사 거리 낭비 측정)
class TombstoneNoReuseMap<K, V> {
  slots: Array<Slot<K, V>>;
  capacity: number;
  constructor(capacity: number) {
    this.capacity = capacity;
    this.slots = Array.from({ length: capacity }, () => ({ state: "empty" as const }));
  }
  private hash(key: K): number {
    const s = String(key);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
    return ((h % this.capacity) + this.capacity) % this.capacity;
  }
  set(key: K, value: V): number {
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "occupied" && slot.key === key) { slot.value = value; return step; }
      if (slot.state === "empty") { this.slots[idx] = { state: "occupied", key, value }; return step; }
      // tombstone이어도 재활용하지 않고 그냥 지나간다
    }
    return -1;
  }
  delete(key: K): void {
    const start = this.hash(key);
    for (let step = 0; step < this.capacity; step++) {
      const idx = (start + step) % this.capacity;
      const slot = this.slots[idx]!;
      if (slot.state === "empty") return;
      if (slot.state === "occupied" && slot.key === key) { this.slots[idx] = { state: "tombstone" }; return; }
    }
  }
}
{
  const stage2 = new TombstoneNoReuseMap<string, number>(8);
  stage2.set("dog", 10);
  stage2.set("owl", 20);
  stage2.set("elk", 30);
  stage2.delete("dog"); // 슬롯4가 tombstone
  const stepsToReinsert = stage2.set("dog", 999); // 재삽입: tombstone을 지나쳐 슬롯7까지 감
  assertEqual(stepsToReinsert, 3, 'Stage2(재활용 없음): delete 후 "dog" 재삽입 probe step 수(낭비)');
  assertEqual(
    stage2.slots.map((s) => s.state),
    ["empty", "empty", "empty", "empty", "tombstone", "occupied", "occupied", "occupied"],
    "Stage2: 슬롯4는 tombstone인 채로 방치, dog는 슬롯7로 밀려남",
  );
}

// 3-3. 최종: tombstone 마킹 + 재활용 (본문 구현과 동일)
{
  const final = new HashMapOpenAddressing<string, number>(8);
  final.set("dog", 10);
  final.set("owl", 20);
  final.set("elk", 30);
  final.delete("dog"); // 슬롯4가 tombstone
  final.set("dog", 999); // 재삽입: firstTombstone(슬롯4) 재활용
  assertEqual(
    final._debugSlots().map((s) => s.state),
    ["empty", "empty", "empty", "empty", "occupied", "occupied", "occupied", "empty"],
    "Stage3(재활용): dog가 원래 자리인 슬롯4를 그대로 재사용",
  );
  assertEqual(final.get("dog"), 999, "Stage3: 재삽입 후 조회");
  assertEqual(final.get("elk"), 30, "Stage3: 다른 키도 여전히 조회 가능");
}

// ── 4. 무작위 교차검증: 참조 구현(Map)과 비교 ──
console.log("\n--- 4. 무작위 교차검증 (n=2000, capacity=4 시작) ---");
{
  function mulberry32(seed: number) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(12345);
  const map = new HashMapOpenAddressing<string, number>(4);
  const ref = new Map<string, number>();
  const keys = Array.from({ length: 40 }, (_, i) => `k${i}`);
  let ops = 0;
  let mismatches = 0;
  for (let i = 0; i < 2000; i++) {
    const key = keys[Math.floor(rand() * keys.length)]!;
    const op = rand();
    if (op < 0.5) {
      const value = Math.floor(rand() * 1000);
      map.set(key, value);
      ref.set(key, value);
    } else if (op < 0.8) {
      const got = map.get(key);
      const expected = ref.get(key);
      ops++;
      if (got !== expected) mismatches++;
    } else {
      const delMap = map.delete(key);
      const delRef = ref.delete(key);
      ops++;
      if (delMap !== delRef) mismatches++;
    }
    // has 교차검증도 섞는다
    if (rand() < 0.3) {
      const key2 = keys[Math.floor(rand() * keys.length)]!;
      const hasMap = map.has(key2);
      const hasRef = ref.has(key2);
      ops++;
      if (hasMap !== hasRef) mismatches++;
    }
  }
  assertEqual(mismatches, 0, `무작위 ${ops}회 연산 중 불일치 수`);
  assertEqual(map.size(), ref.size, "최종 size() 일치");
  // 최종 전체 키 재확인
  let finalMismatch = 0;
  for (const k of keys) {
    if (map.get(k) !== ref.get(k)) finalMismatch++;
  }
  assertEqual(finalMismatch, 0, "최종 전체 키 get() 일치");
  console.log("최종 capacity:", map._debugCapacity(), "size:", map.size());
}

// ── 5. 엣지 케이스 ──
console.log("\n--- 5. 엣지 케이스 ---");
{
  const empty = new HashMapOpenAddressing<string, number>(4);
  assertEqual(empty.get("x"), undefined, "빈 맵 get");
  assertEqual(empty.has("x"), false, "빈 맵 has");
  assertEqual(empty.delete("x"), false, "빈 맵 delete");
  assertEqual(empty.size(), 0, "빈 맵 size");

  const one = new HashMapOpenAddressing<string, number>(1);
  one.set("only", 1); // 삽입 직후 load factor 1/1=1 > 0.5 → resize to 2
  assertEqual(one.get("only"), 1, "capacity=1에서 삽입 후 resize 뒤에도 조회 성공");
  assertEqual(one._debugCapacity(), 2, "capacity=1 → 삽입 1회 후 resize로 2");

  const dup = new HashMapOpenAddressing<string, number>(8);
  dup.set("x", 1);
  dup.set("x", 2); // 값 갱신, count 불변
  assertEqual(dup.get("x"), 2, "동일 키 재삽입은 갱신");
  assertEqual(dup.size(), 1, "동일 키 재삽입은 size 불변");

  // resize 트리거 확인: capacity=4, LOAD_FACTOR=0.5 → 2개 넘게 넣으면 resize
  const rs = new HashMapOpenAddressing<string, number>(4);
  rs.set("a", 1); // count=1, 1/4=0.25
  assertEqual(rs._debugCapacity(), 4, "1개 삽입 후 capacity 유지");
  rs.set("b", 2); // count=2, 2/4=0.5 → 0.5 > 0.5 는 false (엄격 초과만 resize)
  assertEqual(rs._debugCapacity(), 4, "load factor = 0.5 정확히는 resize 안 함(초과만)");
  rs.set("c", 3); // count=3, 3/4=0.75 > 0.5 → resize to 8
  assertEqual(rs._debugCapacity(), 8, "load factor 0.5 초과 시 resize");
  assertEqual([rs.get("a"), rs.get("b"), rs.get("c")], [1, 2, 3], "resize 후에도 기존 키 전부 조회 가능");
}

console.log("\n=== 전체 검증 완료 ===");
