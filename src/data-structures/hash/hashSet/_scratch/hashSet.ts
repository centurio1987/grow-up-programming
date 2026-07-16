/**
 * hashSet-guide.new.mdx E3 자기검증용 스크래치.
 * 가이드 본문 코드를 그대로 옮겨 실측한다. sibling hashSet.ts와 무관.
 */

class HashMapChaining<K, V> {
  private buckets: Array<Array<[K, V]>>;
  private capacity: number;
  private count = 0;
  private readonly LOAD_FACTOR = 0.75;

  constructor(initialCapacity: number = 16) {
    this.capacity = initialCapacity;
    this.buckets = Array.from({ length: this.capacity }, () => []);
  }

  private hash(key: K): number {
    const s = String(key);
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (h * 31 + s.charCodeAt(i)) % this.capacity;
    }
    return h;
  }

  private resize(): void {
    const old = this.buckets;
    this.capacity *= 2;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.count = 0;
    for (const chain of old) {
      for (const [k, v] of chain) this.set(k, v);
    }
  }

  set(key: K, value: V): void {
    const idx = this.hash(key);
    const chain = this.buckets[idx]!;
    for (const pair of chain) {
      if (pair[0] === key) {
        pair[1] = value;
        return;
      }
    }
    chain.push([key, value]);
    this.count++;
    if (this.count / this.capacity > this.LOAD_FACTOR) this.resize();
  }

  has(key: K): boolean {
    const chain = this.buckets[this.hash(key)]!;
    return chain.some(([k]) => k === key);
  }

  delete(key: K): boolean {
    const chain = this.buckets[this.hash(key)]!;
    const idx = chain.findIndex(([k]) => k === key);
    if (idx === -1) return false;
    chain.splice(idx, 1);
    this.count--;
    return true;
  }

  size(): number {
    return this.count;
  }

  keys(): K[] {
    const result: K[] = [];
    for (const chain of this.buckets) for (const [k] of chain) result.push(k);
    return result;
  }

  /** 시각화 전용: 각 버킷이 비어있는지(0) 원소가 있는지(1) 나타낸다. */
  bucketOccupancy(): number[] {
    return this.buckets.map((chain) => (chain.length > 0 ? 1 : 0));
  }

  bucketIndexOf(key: K): number {
    return this.hash(key);
  }
}

class HashSet<T> {
  private map: HashMapChaining<T, true>;

  constructor(initialCapacity: number = 16) {
    this.map = new HashMapChaining<T, true>(initialCapacity);
  }

  add(item: T): void {
    this.map.set(item, true);
  }

  has(item: T): boolean {
    return this.map.has(item);
  }

  delete(item: T): boolean {
    return this.map.delete(item);
  }

  size(): number {
    return this.map.size();
  }

  values(): T[] {
    return this.map.keys();
  }

  union(other: HashSet<T>): HashSet<T> {
    const result = new HashSet<T>();
    for (const x of this.values()) result.add(x);
    for (const x of other.values()) result.add(x);
    return result;
  }

  intersection(other: HashSet<T>): HashSet<T> {
    const result = new HashSet<T>();
    for (const x of this.values()) {
      if (other.has(x)) result.add(x);
    }
    return result;
  }

  difference(other: HashSet<T>): HashSet<T> {
    const result = new HashSet<T>();
    for (const x of this.values()) {
      if (!other.has(x)) result.add(x);
    }
    return result;
  }

  /** 시각화 전용 접근자 (가이드 본문 검증용) */
  __map(): HashMapChaining<T, true> {
    return this.map;
  }
}

function assertEq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${label}: ${a}`);
  }
}

// ---- 대표 시나리오: 소셜 네트워크 팔로우 예시 (capacity=8, 시각화용) ----
const alice = new HashSet<string>(8);
console.log("alice buckets (init):", alice.__map().bucketOccupancy());

alice.add("bob");
console.log('bucketIndexOf("bob") =', alice.__map().bucketIndexOf("bob"));
console.log("alice buckets (+bob):", alice.__map().bucketOccupancy());

alice.add("charlie");
console.log('bucketIndexOf("charlie") =', alice.__map().bucketIndexOf("charlie"));
console.log("alice buckets (+charlie):", alice.__map().bucketOccupancy());

alice.add("dave");
console.log('bucketIndexOf("dave") =', alice.__map().bucketIndexOf("dave"));
console.log("alice buckets (+dave):", alice.__map().bucketOccupancy());

const bobFollows = new HashSet<string>(8);
bobFollows.add("alice");
bobFollows.add("charlie");
bobFollows.add("eve");

const common = alice.intersection(bobFollows);
console.log("alice ∩ bobFollows =", common.values());
assertEq(common.values(), ["charlie"], "intersection result");

const allFollows = alice.union(bobFollows);
console.log("alice ∪ bobFollows size =", allFollows.size());
assertEq(allFollows.size(), 5, "union size");

const onlyAlice = alice.difference(bobFollows);
console.log("alice \\ bobFollows =", onlyAlice.values().sort());
assertEq(onlyAlice.values().sort(), ["bob", "dave"], "difference result");

assertEq(alice.has("charlie"), true, 'alice.has("charlie")');
assertEq(alice.has("alice"), false, 'alice.has("alice")');

// ---- 엣지 케이스 ----
const empty = new HashSet<string>();
assertEq(empty.values(), [], "빈 집합 values()");
assertEq(empty.has("x"), false, "빈 집합 has");
assertEq(empty.delete("x"), false, "빈 집합 delete");

const dup = new HashSet<number>();
dup.add(1);
dup.add(1);
dup.add(1);
assertEq(dup.size(), 1, "중복 add → size 불변");

const s1 = new HashSet<number>();
s1.add(1);
s1.add(2);
const s2 = new HashSet<number>(); // 빈 집합
assertEq(s1.union(s2).values().sort(), [1, 2], "한쪽 빈 집합 union");
assertEq(s1.intersection(s2).values(), [], "한쪽 빈 집합 intersection → 공집합");
assertEq(s1.difference(s2).values().sort(), [1, 2], "빈 other와 difference → this 그대로");

const sub = new HashSet<number>();
sub.add(1);
sub.add(2);
sub.add(3);
const supersetOther = new HashSet<number>();
supersetOther.add(1);
supersetOther.add(2);
supersetOther.add(3);
supersetOther.add(4);
assertEq(sub.difference(supersetOther).values(), [], "other ⊇ this → difference 빈 집합");

// 원본 불변성 확인
assertEq(s1.values().sort(), [1, 2], "union 이후 원본 this 불변");
assertEq(s2.values(), [], "union 이후 원본 other 불변");

// delete 후 has
const del = new HashSet<string>();
del.add("x");
del.add("y");
assertEq(del.delete("x"), true, "존재하는 항목 delete → true");
assertEq(del.delete("x"), false, "이미 삭제된 항목 delete → false");
assertEq(del.has("x"), false, "delete 이후 has → false");
assertEq(del.size(), 1, "delete 이후 size");

// ---- 무작위 교차검증: HashSet 연산 vs JS Set 기준 구현 ----
function randomInt(n: number) {
  return Math.floor(Math.random() * n);
}
let randomFails = 0;
for (let trial = 0; trial < 200; trial++) {
  const n = randomInt(30);
  const m = randomInt(30);
  const universe = 40;
  const a = new HashSet<number>(4);
  const refA = new Set<number>();
  for (let i = 0; i < n; i++) {
    const v = randomInt(universe);
    a.add(v);
    refA.add(v);
  }
  const b = new HashSet<number>(4);
  const refB = new Set<number>();
  for (let i = 0; i < m; i++) {
    const v = randomInt(universe);
    b.add(v);
    refB.add(v);
  }

  const refUnion = new Set([...refA, ...refB]);
  const refInter = new Set([...refA].filter((x) => refB.has(x)));
  const refDiff = new Set([...refA].filter((x) => !refB.has(x)));

  const gotUnion = new Set(a.union(b).values());
  const gotInter = new Set(a.intersection(b).values());
  const gotDiff = new Set(a.difference(b).values());

  const eq = (x: Set<number>, y: Set<number>) =>
    x.size === y.size && [...x].every((v) => y.has(v));

  if (!eq(gotUnion, refUnion) || !eq(gotInter, refInter) || !eq(gotDiff, refDiff)) {
    randomFails++;
    console.error("random trial FAIL", { a: [...refA], b: [...refB] });
  }
  if (a.size() !== refA.size || b.size() !== refB.size) {
    randomFails++;
    console.error("random trial size FAIL");
  }
}
assertEq(randomFails, 0, "무작위 200회 교차검증(union/intersection/difference/size)");

// ---- 함정 시연: naive 교집합(중첩 루프, includes)의 비용 ----
function naiveIntersection(a: string[], b: string[]): string[] {
  const result: string[] = [];
  for (const x of a) {
    if (b.includes(x)) result.push(x); // O(m) 검사를 n번 반복 → O(n*m)
  }
  return result;
}
const bigA = Array.from({ length: 2000 }, (_, i) => `id${i}`);
const bigB = Array.from({ length: 2000 }, (_, i) => `id${i + 1000}`);

let naiveComparisons = 0;
function countedIncludes(arr: string[], target: string): boolean {
  for (const v of arr) {
    naiveComparisons++;
    if (v === target) return true;
  }
  return false;
}
function naiveIntersectionCounted(a: string[], b: string[]): string[] {
  const result: string[] = [];
  for (const x of a) if (countedIncludes(b, x)) result.push(x);
  return result;
}
const naiveResult = naiveIntersectionCounted(bigA, bigB).sort();

const setA = new HashSet<string>();
for (const x of bigA) setA.add(x);
const setB = new HashSet<string>();
for (const x of bigB) setB.add(x);
const hashResult = setA.intersection(setB).values().sort();

assertEq(naiveResult, hashResult, "naive vs HashSet 교집합 결과 일치");
console.log(
  `naive 비교 횟수 = ${naiveComparisons} (|A|*|B| 근방), HashSet은 O(|A|)=~${bigA.length}회 has 호출`,
);
assertEq(naiveComparisons > bigA.length * bigB.length * 0.5, true, "naive는 실제로 O(n*m) 규모(50% 이상)");

console.log("ALL CHECKS DONE, exitCode=", process.exitCode ?? 0);

console.log("alice.values() order:", alice.values());
console.log("bobFollows.values() order:", bobFollows.values());
for (const x of alice.values()) {
  console.log(`  probe ${x}: bobFollows.has(${x}) = ${bobFollows.has(x)}`);
}
