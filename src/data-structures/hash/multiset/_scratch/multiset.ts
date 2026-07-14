// E3 자기검증용 스크래치. 가이드 본문에 실리는 코드와 100% 동일하게 유지한다.

export class Multiset<T> {
  private _data: T[];
  private _comparator: (a: T, b: T) => number;

  constructor(comparator?: (a: T, b: T) => number) {
    this._data = [];
    this._comparator = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  }

  private lowerBound(item: T): number {
    let lo = 0,
      hi = this._data.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this._comparator(this._data[mid]!, item) < 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  private upperBound(item: T): number {
    let lo = 0,
      hi = this._data.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this._comparator(this._data[mid]!, item) <= 0) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  add(item: T): void {
    const pos = this.lowerBound(item);
    this._data.splice(pos, 0, item);
  }

  delete(item: T): boolean {
    const pos = this.lowerBound(item);
    if (pos < this._data.length && this._comparator(this._data[pos]!, item) === 0) {
      this._data.splice(pos, 1);
      return true;
    }
    return false;
  }

  deleteAll(item: T): number {
    const lo = this.lowerBound(item);
    const hi = this.upperBound(item);
    this._data.splice(lo, hi - lo);
    return hi - lo;
  }

  has(item: T): boolean {
    const pos = this.lowerBound(item);
    return pos < this._data.length && this._comparator(this._data[pos]!, item) === 0;
  }

  count(item: T): number {
    return this.upperBound(item) - this.lowerBound(item);
  }

  min(): T | undefined {
    return this._data[0];
  }

  max(): T | undefined {
    return this._data[this._data.length - 1];
  }

  size(): number {
    return this._data.length;
  }

  toArray(): T[] {
    return [...this._data];
  }

  // 검증 전용 노출 (private 우회) — 가이드 본문에는 싣지 않는다.
  __lowerBound(item: T): number {
    return this.lowerBound(item);
  }
  __upperBound(item: T): number {
    return this.upperBound(item);
  }
}

function assertEq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${label} — actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${label} = ${a}`);
  }
}

console.log("=== 1. lowerBound/upperBound on [1,2,2,2,5,7] ===");
{
  const ms = new Multiset<number>();
  for (const x of [1, 2, 2, 2, 5, 7]) ms.add(x);
  console.log("toArray:", ms.toArray());
  assertEq(ms.toArray(), [1, 2, 2, 2, 5, 7], "toArray after 6 adds");
  assertEq(ms.__lowerBound(2), 1, "lowerBound(2)");
  assertEq(ms.__upperBound(2), 4, "upperBound(2)");
  assertEq(ms.count(2), 3, "count(2)");
}

console.log("\n=== 2. 문제 예시 트레이스 (multiset-problem.md) ===");
{
  const ms = new Multiset<number>();
  ms.add(3);
  ms.add(1);
  ms.add(2);
  ms.add(2);
  assertEq(ms.toArray(), [1, 2, 2, 3], "toArray");
  assertEq(ms.count(2), 2, "count(2)");
  assertEq(ms.min(), 1, "min()");
  assertEq(ms.max(), 3, "max()");
  assertEq(ms.delete(2), true, "delete(2)");
  assertEq(ms.toArray(), [1, 2, 3], "toArray after delete(2)");
  assertEq(ms.deleteAll(2), 1, "deleteAll(2)");
  assertEq(ms.size(), 2, "size()");
}

console.log("\n=== 3. 실행 시각화 steps 트레이스 (구 가이드 steps 재검증) ===");
{
  const ms = new Multiset<number>();
  assertEq(ms.toArray(), [], "초기 상태");

  ms.add(3);
  assertEq(ms.toArray(), [3], "add(3)");
  assertEq(ms.__lowerBound(3) === 0, true, "lowerBound(3) before add was 0 (checked pre-add manually below)");

  const ms2 = new Multiset<number>();
  ms2.add(3);
  ms2.add(1);
  assertEq(ms2.toArray(), [1, 3], "add(1) after [3]");

  ms2.add(2);
  assertEq(ms2.toArray(), [1, 2, 3], "add(2) after [1,3]");

  ms2.add(2);
  assertEq(ms2.toArray(), [1, 2, 2, 3], "add(2) dup after [1,2,3]");
  assertEq(ms2.__lowerBound(2), 1, "lowerBound(2) on [1,2,2,3]");
  assertEq(ms2.__upperBound(2), 3, "upperBound(2) on [1,2,2,3]");
  assertEq(ms2.count(2), 2, "count(2) on [1,2,2,3]");

  assertEq(ms2.delete(2), true, "delete(2) result");
  assertEq(ms2.toArray(), [1, 2, 3], "toArray after delete(2)");
}

console.log("\n=== 4. 엣지 케이스 ===");
{
  const empty = new Multiset<number>();
  assertEq(empty.min(), undefined, "empty.min()");
  assertEq(empty.max(), undefined, "empty.max()");
  assertEq(empty.has(5), false, "empty.has(5)");
  assertEq(empty.count(5), 0, "empty.count(5)");
  assertEq(empty.delete(5), false, "empty.delete(5)");
  assertEq(empty.deleteAll(5), 0, "empty.deleteAll(5)");

  const single = new Multiset<number>();
  single.add(7);
  assertEq(single.min(), 7, "single.min()");
  assertEq(single.max(), 7, "single.max()");
  assertEq(single.delete(7), true, "single.delete(7)");
  assertEq(single.toArray(), [], "single after delete -> empty");

  const allSame = new Multiset<number>();
  for (let i = 0; i < 5; i++) allSame.add(9);
  assertEq(allSame.__lowerBound(9), 0, "allSame lowerBound(9)");
  assertEq(allSame.__upperBound(9), 5, "allSame upperBound(9)");
  assertEq(allSame.count(9), 5, "allSame count(9)");
  assertEq(allSame.deleteAll(9), 5, "allSame deleteAll(9)");
  assertEq(allSame.size(), 0, "allSame size after deleteAll");

  // 삽입 위치가 배열 끝 / 시작 확인
  const boundary = new Multiset<number>();
  boundary.add(5);
  boundary.add(10);
  assertEq(boundary.__lowerBound(20), 2, "lowerBound(20) > all -> length");
  assertEq(boundary.__lowerBound(1), 0, "lowerBound(1) < all -> 0");
}

console.log("\n=== 5. 함정 재현: lowerBound를 upperBound 공식으로 잘못 구현하면? ===");
{
  // <= 를 사용하는(원래 upperBound 공식) 버전을 lowerBound 대신 delete에 쓰면
  // 어떤 값이 나오는지 수치로 확인한다.
  class BuggyMultiset<T> {
    private _data: T[] = [];
    private _comparator: (a: T, b: T) => number = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    add(item: T) {
      let lo = 0,
        hi = this._data.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this._comparator(this._data[mid]!, item) < 0) lo = mid + 1;
        else hi = mid;
      }
      this._data.splice(lo, 0, item);
    }
    toArray() {
      return [...this._data];
    }
    // 버그: lowerBound 자리에 upperBound 공식(<=)을 그대로 씀
    buggyDelete(item: T): boolean {
      let lo = 0,
        hi = this._data.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (this._comparator(this._data[mid]!, item) <= 0) lo = mid + 1;
        else hi = mid;
      }
      const pos = lo; // 실제로는 upperBound(item)
      if (pos < this._data.length && this._comparator(this._data[pos]!, item) === 0) {
        this._data.splice(pos, 1);
        return true;
      }
      return false;
    }
  }
  const bug = new BuggyMultiset<number>();
  for (const x of [1, 2, 2, 3]) bug.add(x);
  assertEq(bug.toArray(), [1, 2, 2, 3], "buggy 삽입 결과(정상)");
  const result = bug.buggyDelete(2);
  console.log("buggyDelete(2) on [1,2,2,3] =>", result, bug.toArray());
  assertEq(result, false, "버그 버전 delete(2)는 잘못 false를 반환한다");
  assertEq(bug.toArray(), [1, 2, 2, 3], "버그 버전은 아무것도 지우지 못한다(2가 분명히 있는데도)");
}

console.log("\n=== 6. 코드 진화 사다리 — 원형(naive sort) 함정 재현 ===");
{
  class MultisetNaive {
    private data: number[] = [];
    add(item: number): void {
      this.data.push(item);
      // 함정: comparator 없이 기본 sort() 호출 -> 사전식(lexicographic) 비교
      this.data.sort();
    }
    toArray() {
      return [...this.data];
    }
  }
  const naive = new MultisetNaive();
  naive.add(10);
  naive.add(1);
  naive.add(2);
  console.log("naive.add(10); add(1); add(2) =>", naive.toArray());
  assertEq(naive.toArray(), [1, 10, 2], "comparator 없는 기본 sort()의 사전식 정렬 결과");
}

console.log("\n=== 7. 개선 단계(선형 탐색) 정확성 확인 ===");
{
  class MultisetLinear<T> {
    private data: T[] = [];
    private cmp: (a: T, b: T) => number = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    add(item: T): void {
      let i = 0;
      while (i < this.data.length && this.cmp(this.data[i]!, item) < 0) i++;
      this.data.splice(i, 0, item);
    }
    toArray() {
      return [...this.data];
    }
  }
  const lin = new MultisetLinear<number>();
  lin.add(10);
  lin.add(1);
  lin.add(2);
  assertEq(lin.toArray(), [1, 2, 10], "선형 탐색 버전은 comparator 기준으로 올바르게 정렬됨");
}

console.log("\n=== 8. 슬라이딩 윈도우 중앙값 (lower/upper 2-multiset, k=3) ===");
{
  // lower: 작은 절반, upper: 큰 절반. 둘 다 오름차순 comparator(기본값)를 그대로 쓴다.
  // lower.max()는 lower 안에서 가장 큰 값(=중앙값 후보), upper.min()은 upper 안에서 가장 작은 값.
  function slidingWindowMedian(vals: number[], k: number): number[] {
    const lower = new Multiset<number>();
    const upper = new Multiset<number>();
    const result: number[] = [];

    const insert = (v: number) => {
      if (lower.size() === 0 || v <= (lower.max() as number)) lower.add(v);
      else upper.add(v);
    };
    const remove = (v: number) => {
      if (lower.has(v) && v <= (lower.max() as number)) lower.delete(v);
      else upper.delete(v);
    };
    const rebalance = () => {
      while (lower.size() > upper.size() + 1) {
        const m = lower.max() as number;
        lower.delete(m);
        upper.add(m);
      }
      while (upper.size() > lower.size()) {
        const m = upper.min() as number;
        upper.delete(m);
        lower.add(m);
      }
    };

    for (let i = 0; i < vals.length; i++) {
      insert(vals[i]!);
      if (i >= k) remove(vals[i - k]!);
      rebalance();
      if (i >= k - 1) {
        const median =
          k % 2 === 1 ? (lower.max() as number) : ((lower.max() as number) + (upper.min() as number)) / 2;
        result.push(median);
      }
    }
    return result;
  }

  function bruteSlidingWindowMedian(vals: number[], k: number): number[] {
    const result: number[] = [];
    for (let i = k - 1; i < vals.length; i++) {
      const window = vals.slice(i - k + 1, i + 1).slice().sort((a, b) => a - b);
      const mid = Math.floor(k / 2);
      const median = k % 2 === 1 ? window[mid]! : (window[mid - 1]! + window[mid]!) / 2;
      result.push(median);
    }
    return result;
  }

  const input = [1, 3, -1, -3, 5, 3, 6, 7];
  const got = slidingWindowMedian(input, 3);
  const expected = bruteSlidingWindowMedian(input, 3);
  console.log("slidingWindowMedian(k=3) =", got);
  assertEq(got, expected, "슬라이딩 윈도우 중앙값(k=3) vs brute force");
}

console.log("\n=== 9. 무작위 교차검증 (brute-force 정렬 배열과 비교) ===");
{
  function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  const rng = makeRng(20260714);
  let fails = 0;
  for (let trial = 0; trial < 200; trial++) {
    const ms = new Multiset<number>();
    let brute: number[] = [];
    const ops = 40;
    for (let i = 0; i < ops; i++) {
      const roll = rng();
      const v = Math.floor(rng() * 20) - 5; // -5..14
      if (roll < 0.55) {
        ms.add(v);
        brute.push(v);
        brute.sort((a, b) => a - b);
      } else if (roll < 0.75) {
        const r1 = ms.delete(v);
        const idx = brute.indexOf(v);
        const r2 = idx !== -1;
        if (r2) brute.splice(idx, 1);
        if (r1 !== r2) {
          console.error(`FAIL trial ${trial} step ${i}: delete(${v}) ms=${r1} brute=${r2}`);
          fails++;
        }
      } else if (roll < 0.85) {
        const removed = ms.deleteAll(v);
        const bruteRemoved = brute.filter((x) => x === v).length;
        brute = brute.filter((x) => x !== v);
        if (removed !== bruteRemoved) {
          console.error(`FAIL trial ${trial} step ${i}: deleteAll(${v}) ms=${removed} brute=${bruteRemoved}`);
          fails++;
        }
      } else {
        const c1 = ms.count(v);
        const c2 = brute.filter((x) => x === v).length;
        if (c1 !== c2) {
          console.error(`FAIL trial ${trial} step ${i}: count(${v}) ms=${c1} brute=${c2}`);
          fails++;
        }
      }
      const arr = ms.toArray();
      if (JSON.stringify(arr) !== JSON.stringify(brute)) {
        console.error(`FAIL trial ${trial} step ${i}: toArray mismatch ms=${JSON.stringify(arr)} brute=${JSON.stringify(brute)}`);
        fails++;
      }
      if (ms.size() !== brute.length) {
        console.error(`FAIL trial ${trial} step ${i}: size mismatch ms=${ms.size()} brute=${brute.length}`);
        fails++;
      }
      const mn = ms.min();
      const mx = ms.max();
      const bmn = brute.length ? brute[0] : undefined;
      const bmx = brute.length ? brute[brute.length - 1] : undefined;
      if (mn !== bmn || mx !== bmx) {
        console.error(`FAIL trial ${trial} step ${i}: min/max mismatch ms=(${mn},${mx}) brute=(${bmn},${bmx})`);
        fails++;
      }
    }
  }
  if (fails === 0) {
    console.log("OK: 200 trial * 40 ops 무작위 교차검증 전부 일치");
  } else {
    console.error(`FAIL: 무작위 교차검증 불일치 ${fails}건`);
    process.exitCode = 1;
  }
}

console.log("\n=== 10. add(4) on [1,2,2,2,5,7] — before/after 및 이진 탐색 좁혀가기 ===");
{
  const ms = new Multiset<number>();
  for (const x of [1, 2, 2, 2, 5, 7]) ms.add(x);
  assertEq(ms.__lowerBound(4), 4, "lowerBound(4) on [1,2,2,2,5,7]");
  ms.add(4);
  console.log("add(4) 결과:", ms.toArray());
  assertEq(ms.toArray(), [1, 2, 2, 2, 4, 5, 7], "add(4) 삽입 후 배열");
}

console.log("\n=== 검증 종료 ===");
