// 가이드 본문 코드 자기검증용 스크래치. bun으로 직접 실행한다.

interface SkipNode<T> {
  value: T | null; // null은 Head/Tail sentinel 전용
  forward: SkipNode<T>[];
}

class ConcurrentSkipList<T> {
  private maxLevel: number;
  private compare: (a: T, b: T) => number;
  private head: SkipNode<T>;
  private tail: SkipNode<T>;
  private level: number;
  private count: number;
  private maxNode: SkipNode<T> | null; // 레벨 0 마지막 실제 노드 (O(1) max용)

  constructor(maxLevel: number = 16, comparator?: (a: T, b: T) => number) {
    this.maxLevel = maxLevel;
    this.compare = comparator ?? ((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    this.tail = { value: null, forward: [] };
    this.head = { value: null, forward: new Array(maxLevel).fill(this.tail) };
    this.level = 1;
    this.count = 0;
    this.maxNode = null;
  }

  private randomLevel(): number {
    let lvl = 1;
    while (Math.random() < 0.5 && lvl < this.maxLevel) lvl++;
    return lvl;
  }

  private findUpdate(value: T): SkipNode<T>[] {
    const update: SkipNode<T>[] = new Array(this.maxLevel).fill(this.head);
    let current = this.head;
    for (let lv = this.level - 1; lv >= 0; lv--) {
      while (
        current.forward[lv] !== this.tail &&
        this.compare(current.forward[lv]!.value as T, value) < 0
      ) {
        current = current.forward[lv]!;
      }
      update[lv] = current;
    }
    return update;
  }

  has(value: T): boolean {
    const update = this.findUpdate(value);
    const candidate = update[0]!.forward[0]!;
    return candidate !== this.tail && this.compare(candidate.value as T, value) === 0;
  }

  insert(value: T): void {
    const update = this.findUpdate(value);
    const candidate = update[0]!.forward[0]!;
    if (candidate !== this.tail && this.compare(candidate.value as T, value) === 0) return; // 중복 무시

    const newLevel = this.randomLevel();
    if (newLevel > this.level) {
      for (let i = this.level; i < newLevel; i++) update[i] = this.head;
      this.level = newLevel;
    }

    const newNode: SkipNode<T> = { value, forward: new Array(newLevel) };
    for (let i = 0; i < newLevel; i++) {
      newNode.forward[i] = update[i]!.forward[i]!;
      update[i]!.forward[i] = newNode;
    }
    if (newNode.forward[0] === this.tail) this.maxNode = newNode; // 레벨 0 맨 끝이면 새 최댓값
    this.count++;
  }

  delete(value: T): boolean {
    const update = this.findUpdate(value);
    const target = update[0]!.forward[0]!;
    if (target === this.tail || this.compare(target.value as T, value) !== 0) return false;

    for (let i = 0; i < this.level; i++) {
      if (update[i]!.forward[i] !== target) break;
      update[i]!.forward[i] = target.forward[i]!;
    }
    while (this.level > 1 && this.head.forward[this.level - 1] === this.tail) {
      this.level--;
    }
    if (this.maxNode === target) {
      // update[0]는 target의 레벨 0 직전 노드 — 삭제 후 그대로 새 최댓값 후보
      this.maxNode = update[0] === this.head ? null : update[0]!;
    }
    this.count--;
    return true;
  }

  min(): T | undefined {
    const first = this.head.forward[0]!;
    return first === this.tail ? undefined : (first.value as T);
  }

  max(): T | undefined {
    return this.maxNode === null ? undefined : (this.maxNode.value as T);
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head.forward[0]!;
    while (current !== this.tail) {
      result.push(current.value as T);
      current = current.forward[0]!;
    }
    return result;
  }

  size(): number {
    return this.count;
  }
}

// ---- 실측 검증 ----

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   ${label}: ${a}`);
  }
}

console.log("=== 대표 시나리오 (가이드 본문 트레이스) ===");
const sl = new ConcurrentSkipList<number>();
sl.insert(3);
assertEqual(sl.toArray(), [3], "insert(3) 후 toArray");
sl.insert(1);
assertEqual(sl.toArray(), [1, 3], "insert(1) 후 toArray");
sl.insert(7);
assertEqual(sl.toArray(), [1, 3, 7], "insert(7) 후 toArray");
assertEqual(sl.has(3), true, "has(3)");
assertEqual(sl.has(5), false, "has(5)");
assertEqual(sl.min(), 1, "min()");
assertEqual(sl.max(), 7, "max()");
assertEqual(sl.delete(1), true, "delete(1) 반환");
assertEqual(sl.toArray(), [3, 7], "delete(1) 후 toArray");
assertEqual(sl.min(), 3, "delete 후 min()");
assertEqual(sl.size(), 2, "size()");

console.log("\n=== problem.md 예시 교차검증 ===");
const sl3 = new ConcurrentSkipList<number>();
sl3.insert(3);
sl3.insert(1);
sl3.insert(2);
assertEqual(sl3.toArray(), [1, 2, 3], "toArray");
assertEqual(sl3.has(2), true, "has(2)");
assertEqual(sl3.min(), 1, "min()");
assertEqual(sl3.max(), 3, "max()");
assertEqual(sl3.delete(2), true, "delete(2)");
assertEqual(sl3.toArray(), [1, 3], "delete 후 toArray");
assertEqual(sl3.size(), 2, "size()");

const sl4 = new ConcurrentSkipList<number>(16, (a, b) => b - a);
sl4.insert(1);
sl4.insert(3);
sl4.insert(2);
assertEqual(sl4.toArray(), [3, 2, 1], "내림차순 comparator toArray");
assertEqual(sl4.min(), 3, "내림차순 min() (comparator 기준 첫 원소)");
assertEqual(sl4.max(), 1, "내림차순 max() (comparator 기준 마지막 원소)");

console.log("\n=== 엣지 케이스 ===");
const empty = new ConcurrentSkipList<number>();
assertEqual(empty.min(), undefined, "빈 리스트 min()");
assertEqual(empty.max(), undefined, "빈 리스트 max()");
assertEqual(empty.has(1), false, "빈 리스트 has(1)");
assertEqual(empty.delete(1), false, "빈 리스트 delete(1)");
assertEqual(empty.toArray(), [], "빈 리스트 toArray()");
assertEqual(empty.size(), 0, "빈 리스트 size()");

const single = new ConcurrentSkipList<number>();
single.insert(5);
assertEqual(single.min(), 5, "size=1 min()");
assertEqual(single.max(), 5, "size=1 max()");
assertEqual(single.delete(5), true, "size=1 delete(5)");
assertEqual(single.min(), undefined, "delete 후 다시 빈 리스트 min()");
assertEqual(single.max(), undefined, "delete 후 다시 빈 리스트 max()");
assertEqual(single.size(), 0, "delete 후 size()");

const dup = new ConcurrentSkipList<number>();
dup.insert(4);
dup.insert(4);
dup.insert(4);
assertEqual(dup.size(), 1, "중복 insert 3회 후 size()");
assertEqual(dup.toArray(), [4], "중복 insert 후 toArray()");

const neg = new ConcurrentSkipList<number>();
[-5, 3, -1, 0, 10, -100].forEach((v) => neg.insert(v));
assertEqual(neg.toArray(), [-100, -5, -1, 0, 3, 10], "음수 포함 정렬");
assertEqual(neg.min(), -100, "음수 포함 min()");
assertEqual(neg.max(), 10, "음수 포함 max()");

console.log("\n=== 최댓값 삭제 후 재계산 (maxNode 갱신 경로) ===");
const mx = new ConcurrentSkipList<number>();
[1, 5, 9].forEach((v) => mx.insert(v));
assertEqual(mx.max(), 9, "max() before delete(9)");
mx.delete(9);
assertEqual(mx.max(), 5, "delete(9) 후 max()");
mx.delete(5);
assertEqual(mx.max(), 1, "delete(5) 후 max()");
mx.delete(1);
assertEqual(mx.max(), undefined, "전부 삭제 후 max()");

console.log("\n=== 무작위 교차검증 (배열 기준 오라클, 100회) ===");
function referenceSort(values: number[]): number[] {
  const set = new Set(values);
  return Array.from(set).sort((a, b) => a - b);
}

let randomFailures = 0;
for (let trial = 0; trial < 100; trial++) {
  const ops: string[] = [];
  const model = new Set<number>();
  const testList = new ConcurrentSkipList<number>();
  const opCount = 30 + Math.floor(Math.random() * 30);
  for (let i = 0; i < opCount; i++) {
    const v = Math.floor(Math.random() * 20) - 5; // -5..14
    const op = Math.random();
    if (op < 0.5) {
      model.add(v);
      testList.insert(v);
      ops.push(`insert(${v})`);
    } else if (op < 0.8) {
      const hadIt = model.has(v);
      model.delete(v);
      const deleted = testList.delete(v);
      if (deleted !== hadIt) {
        console.error(`FAIL trial ${trial}: delete(${v}) mismatch actual=${deleted} expected=${hadIt}`);
        randomFailures++;
      }
      ops.push(`delete(${v})`);
    } else {
      const hasExpected = model.has(v);
      const hasActual = testList.has(v);
      if (hasActual !== hasExpected) {
        console.error(`FAIL trial ${trial}: has(${v}) mismatch actual=${hasActual} expected=${hasExpected}`);
        randomFailures++;
      }
      ops.push(`has(${v})`);
    }
  }
  const expectedArr = referenceSort(Array.from(model));
  const actualArr = testList.toArray();
  if (JSON.stringify(actualArr) !== JSON.stringify(expectedArr)) {
    console.error(`FAIL trial ${trial}: toArray mismatch\n ops=${ops.join(",")}\n actual=${JSON.stringify(actualArr)}\n expected=${JSON.stringify(expectedArr)}`);
    randomFailures++;
  }
  const expectedMin = expectedArr.length > 0 ? expectedArr[0] : undefined;
  const expectedMax = expectedArr.length > 0 ? expectedArr[expectedArr.length - 1] : undefined;
  if (testList.min() !== expectedMin) {
    console.error(`FAIL trial ${trial}: min mismatch actual=${testList.min()} expected=${expectedMin}`);
    randomFailures++;
  }
  if (testList.max() !== expectedMax) {
    console.error(`FAIL trial ${trial}: max mismatch actual=${testList.max()} expected=${expectedMax}`);
    randomFailures++;
  }
  if (testList.size() !== expectedArr.length) {
    console.error(`FAIL trial ${trial}: size mismatch actual=${testList.size()} expected=${expectedArr.length}`);
    randomFailures++;
  }
}
if (randomFailures === 0) {
  console.log("OK   무작위 100회 교차검증 전부 통과");
} else {
  console.error(`FAIL 무작위 교차검증 실패 ${randomFailures}건`);
  process.exitCode = 1;
}

console.log("\n=== randomLevel 분포 스팟체크 (참고용, 실패로 처리하지 않음) ===");
function randomLevelStandalone(maxLevel: number): number {
  let lvl = 1;
  while (Math.random() < 0.5 && lvl < maxLevel) lvl++;
  return lvl;
}
const levelCounts: Record<number, number> = {};
for (let i = 0; i < 20000; i++) {
  const lvl = randomLevelStandalone(16);
  levelCounts[lvl] = (levelCounts[lvl] ?? 0) + 1;
}
console.log("레벨별 빈도(20000회):", levelCounts);

console.log("\n=== 고정 시나리오: ascii art 구조 재현 (Math.random 강제 시퀀스) ===");
{
  const queue: number[] = [];
  const originalRandom = Math.random;
  Math.random = () => {
    const v = queue.shift();
    if (v === undefined) throw new Error("random queue exhausted");
    return v;
  };

  function levelSeq(target: number): number[] {
    // randomLevel: lvl=1; while (rand()<0.5 && lvl<maxLevel) lvl++; return lvl
    // target까지 도달하려면 (target-1)번 <0.5, 마지막 1번 >=0.5
    const seq: number[] = [];
    for (let i = 0; i < target - 1; i++) seq.push(0.1);
    seq.push(0.9);
    return seq;
  }

  const scen = new ConcurrentSkipList<number>();
  const plan: Array<[number, number]> = [
    [1, 2],
    [2, 1],
    [3, 3],
    [5, 1],
    [7, 2],
    [9, 1],
  ];
  for (const [value, lvl] of plan) {
    queue.push(...levelSeq(lvl));
    scen.insert(value);
  }
  Math.random = originalRandom;

  // 내부 구조를 레벨별로 덤프 (private 필드 접근을 위해 as any 사용 — 스크래치 검증 전용)
  const internal = scen as any;
  const head = internal.head;
  const tail = internal.tail;
  const level = internal.level;
  for (let lv = level - 1; lv >= 0; lv--) {
    const row: (number | string)[] = ["Head"];
    let cur = head;
    while (cur.forward[lv] !== tail) {
      cur = cur.forward[lv];
      row.push(cur.value);
    }
    row.push("Tail");
    console.log(`레벨 ${lv}:`, row.join(" -> "));
  }

  assertEqual(scen.toArray(), [1, 2, 3, 5, 7, 9], "고정 시나리오 toArray (레벨 무관하게 항상 성립)");
  assertEqual(scen.has(3), true, "고정 시나리오 has(3)");
  assertEqual(scen.has(6), false, "고정 시나리오 has(6) (없는 값)");
  assertEqual(scen.min(), 1, "고정 시나리오 min()");
  assertEqual(scen.max(), 9, "고정 시나리오 max()");
}

console.log("\n=== 시뮬레이션 시나리오 재현: insert(3,lvl1) insert(1,lvl2) insert(7,lvl1) has(3) delete(1) ===");
{
  const queue: number[] = [];
  const originalRandom = Math.random;
  Math.random = () => {
    const v = queue.shift();
    if (v === undefined) throw new Error("random queue exhausted");
    return v;
  };
  function levelSeq(target: number): number[] {
    const seq: number[] = [];
    for (let i = 0; i < target - 1; i++) seq.push(0.1);
    seq.push(0.9);
    return seq;
  }
  function dump(list: any, label: string) {
    const head = list.head, tail = list.tail, level = list.level;
    console.log(`-- ${label} (level=${level}) --`);
    for (let lv = level - 1; lv >= 0; lv--) {
      const row: (number | string)[] = ["Head"];
      let cur = head;
      while (cur.forward[lv] !== tail) { cur = cur.forward[lv]; row.push(cur.value); }
      row.push("Tail");
      console.log(`  레벨 ${lv}:`, row.join(" -> "));
    }
  }

  const sim = new ConcurrentSkipList<number>();
  queue.push(...levelSeq(1)); sim.insert(3); dump(sim, "insert(3) lvl1");
  queue.push(...levelSeq(2)); sim.insert(1); dump(sim, "insert(1) lvl2");
  queue.push(...levelSeq(1)); sim.insert(7); dump(sim, "insert(7) lvl1");
  assertEqual(sim.toArray(), [1, 3, 7], "시뮬 3단계 후 toArray");
  assertEqual(sim.has(3), true, "시뮬 has(3)");
  const deleted = sim.delete(1);
  assertEqual(deleted, true, "시뮬 delete(1) 반환값");
  assertEqual(sim.toArray(), [3, 7], "시뮬 delete(1) 후 toArray");
  dump(sim, "delete(1) 후");
  Math.random = originalRandom;
}

console.log("\n=== 고정 구조에서 has(7) 계단식 경로 추적 ===");
{
  const queue: number[] = [];
  const originalRandom = Math.random;
  Math.random = () => {
    const v = queue.shift();
    if (v === undefined) throw new Error("random queue exhausted");
    return v;
  };
  function levelSeq(target: number): number[] {
    const seq: number[] = [];
    for (let i = 0; i < target - 1; i++) seq.push(0.1);
    seq.push(0.9);
    return seq;
  }
  const scen = new ConcurrentSkipList<number>();
  const plan: Array<[number, number]> = [[1, 2], [2, 1], [3, 3], [5, 1], [7, 2], [9, 1]];
  for (const [value, lvl] of plan) {
    queue.push(...levelSeq(lvl));
    scen.insert(value);
  }
  Math.random = originalRandom;

  // findUpdate를 흉내내며 경로와 비교 횟수를 기록 (private 접근을 위해 any 캐스팅)
  const internal = scen as any;
  const head = internal.head, tail = internal.tail, level = internal.level;
  const compareFn = internal.compare;
  let current = head;
  let compareCount = 0;
  const path: string[] = [];
  for (let lv = level - 1; lv >= 0; lv--) {
    const before = current.value === null ? "Head" : current.value;
    while (current.forward[lv] !== tail) {
      compareCount++;
      if (compareFn(current.forward[lv].value, 7) < 0) {
        current = current.forward[lv];
      } else {
        break;
      }
    }
    const after = current.value === null ? "Head" : current.value;
    path.push(`레벨${lv}: ${before} → ${after} (update[${lv}]=${after})`);
  }
  const candidate = current.forward[0];
  compareCount++;
  const found = candidate !== tail && compareFn(candidate.value, 7) === 0;
  console.log("경로:", path.join(" | "));
  console.log("총 비교 횟수:", compareCount, "결과:", found);
  assertEqual(found, true, "has(7) 고정 구조 결과");
  assertEqual(compareCount, 5, "has(7) 총 비교 횟수");
}

console.log("\n=== 확인 질문 검증: has(6) 비교 횟수 ===");
{
  const queue: number[] = [];
  const originalRandom = Math.random;
  Math.random = () => { const v = queue.shift(); if (v === undefined) throw new Error("exhausted"); return v; };
  function levelSeq(target: number): number[] { const seq: number[] = []; for (let i = 0; i < target - 1; i++) seq.push(0.1); seq.push(0.9); return seq; }
  const scen = new ConcurrentSkipList<number>();
  const plan: Array<[number, number]> = [[1, 2], [2, 1], [3, 3], [5, 1], [7, 2], [9, 1]];
  for (const [value, lvl] of plan) { queue.push(...levelSeq(lvl)); scen.insert(value); }
  Math.random = originalRandom;
  const internal = scen as any;
  const head = internal.head, tail = internal.tail, level = internal.level, compareFn = internal.compare;
  let current = head, compareCount = 0;
  for (let lv = level - 1; lv >= 0; lv--) {
    while (current.forward[lv] !== tail) {
      compareCount++;
      if (compareFn(current.forward[lv].value, 6) < 0) current = current.forward[lv]; else break;
    }
  }
  const candidate = current.forward[0];
  compareCount++;
  const found = candidate !== tail && compareFn(candidate.value, 6) === 0;
  console.log("has(6) 비교 횟수:", compareCount, "결과:", found);
  assertEqual(found, false, "has(6) 결과");
  assertEqual(compareCount, 5, "has(6) 비교 횟수");
}

console.log("\n=== 점검문제 검증: has(4), delete(7) ===");
{
  const queue: number[] = [];
  const originalRandom = Math.random;
  Math.random = () => { const v = queue.shift(); if (v === undefined) throw new Error("exhausted"); return v; };
  function levelSeq(target: number): number[] { const seq: number[] = []; for (let i = 0; i < target - 1; i++) seq.push(0.1); seq.push(0.9); return seq; }
  const scen = new ConcurrentSkipList<number>();
  const plan: Array<[number, number]> = [[1, 2], [2, 1], [3, 3], [5, 1], [7, 2], [9, 1]];
  for (const [value, lvl] of plan) { queue.push(...levelSeq(lvl)); scen.insert(value); }
  Math.random = originalRandom;
  const internal = scen as any;

  function traceHas(target: number) {
    const head = internal.head, tail = internal.tail, level = internal.level, compareFn = internal.compare;
    let current = head, compareCount = 0;
    for (let lv = level - 1; lv >= 0; lv--) {
      while (current.forward[lv] !== tail) {
        compareCount++;
        if (compareFn(current.forward[lv].value, target) < 0) current = current.forward[lv]; else break;
      }
    }
    const candidate = current.forward[0];
    compareCount++;
    const found = candidate !== tail && compareFn(candidate.value, target) === 0;
    return { compareCount, found };
  }
  console.log("has(4):", traceHas(4));
  assertEqual(traceHas(4).found, false, "has(4) 결과");
  assertEqual(traceHas(4).compareCount, 4, "has(4) 비교 횟수");

  console.log("max() before delete(7):", scen.max());
  const beforeMax = scen.max();
  scen.delete(7);
  console.log("max() after delete(7):", scen.max(), "toArray:", scen.toArray());
  assertEqual(beforeMax, 9, "delete(7) 전 max()");
  assertEqual(scen.max(), 9, "delete(7) 후 max() (7은 max가 아니었으므로 불변)");
  assertEqual(scen.toArray(), [1, 2, 3, 5, 9], "delete(7) 후 toArray");
}
