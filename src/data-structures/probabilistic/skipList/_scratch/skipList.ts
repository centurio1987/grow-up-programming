/**
 * skipList-guide.new.mdx E3 자기검증용 스크래치.
 * 위쪽 "가이드 본문 코드" 블록은 MDX 본문에 그대로 옮겨 붙일 코드다(sibling skipList.ts와 무관,
 * 가이드 자체가 oracle). 아래쪽은 그 코드를 실행해 본문 수치를 검증하는 하니스다.
 */

/* ============================== 가이드 본문 코드: 최종 구현 ============================== */

type SLNode = {
  key: number;
  next: (SLNode | undefined)[];
};

const MAX_LEVEL = 16;
const P = 0.5;

function randomLevel(random: () => number = Math.random): number {
  let level = 1;
  while (random() < P && level < MAX_LEVEL) level++;
  return level;
}

class SkipList {
  private head: SLNode = { key: -Infinity, next: new Array(MAX_LEVEL).fill(undefined) };
  private currentLevel = 0; // 0-indexed 현재 최고 사용 레벨
  private random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  insert(key: number): void {
    const update: SLNode[] = new Array(MAX_LEVEL);
    let current = this.head;
    for (let i = this.currentLevel; i >= 0; i--) {
      while (current.next[i] !== undefined && current.next[i]!.key < key) {
        current = current.next[i]!;
      }
      update[i] = current;
    }
    const found = current.next[0];
    if (found !== undefined && found.key === key) return; // 중복 무시

    const newLevel = randomLevel(this.random);
    if (newLevel - 1 > this.currentLevel) {
      for (let i = this.currentLevel + 1; i <= newLevel - 1; i++) update[i] = this.head;
      this.currentLevel = newLevel - 1;
    }
    const newNode: SLNode = { key, next: new Array(newLevel).fill(undefined) };
    for (let i = 0; i < newLevel; i++) {
      newNode.next[i] = update[i].next[i];
      update[i].next[i] = newNode;
    }
  }

  search(key: number): boolean {
    let current = this.head;
    for (let i = this.currentLevel; i >= 0; i--) {
      while (current.next[i] !== undefined && current.next[i]!.key < key) {
        current = current.next[i]!;
      }
    }
    const next = current.next[0];
    return next !== undefined && next.key === key;
  }

  delete(key: number): void {
    const update: SLNode[] = new Array(MAX_LEVEL);
    let current = this.head;
    for (let i = this.currentLevel; i >= 0; i--) {
      while (current.next[i] !== undefined && current.next[i]!.key < key) {
        current = current.next[i]!;
      }
      update[i] = current;
    }
    const target = current.next[0];
    if (target === undefined || target.key !== key) return;

    for (let i = 0; i <= this.currentLevel; i++) {
      if (update[i].next[i] !== target) break;
      update[i].next[i] = target.next[i];
    }
    while (this.currentLevel > 0 && this.head.next[this.currentLevel] === undefined) {
      this.currentLevel--;
    }
  }

  toArray(): number[] {
    const result: number[] = [];
    let current = this.head.next[0];
    while (current !== undefined) {
      result.push(current.key);
      current = current.next[0];
    }
    return result;
  }

  /** 검증 전용 훅: 레벨별 키 나열(가이드 본문에는 싣지 않음, 진단용). */
  _debugLevels(): number[][] {
    const levels: number[][] = [];
    for (let i = this.currentLevel; i >= 0; i--) {
      const row: number[] = [];
      let n = this.head.next[i];
      while (n !== undefined) {
        row.push(n.key);
        n = n.next[i];
      }
      levels.push(row);
    }
    return levels;
  }
}

/* ============================== 가이드 본문 코드: 원형(naive) ============================== */

class NaiveNode {
  key: number;
  next: NaiveNode | undefined;
  constructor(key: number) {
    this.key = key;
  }
}

class NaiveSortedList {
  private head: NaiveNode | undefined;

  insert(key: number): void {
    let prev: NaiveNode | undefined;
    let current = this.head;
    while (current !== undefined && current.key < key) {
      prev = current;
      current = current.next;
    }
    if (current !== undefined && current.key === key) return; // 중복 무시
    const node = new NaiveNode(key);
    node.next = current;
    if (prev === undefined) this.head = node;
    else prev.next = node;
  }

  search(key: number): boolean {
    let current = this.head;
    while (current !== undefined && current.key < key) current = current.next;
    return current !== undefined && current.key === key;
  }

  toArray(): number[] {
    const result: number[] = [];
    let current = this.head;
    while (current !== undefined) {
      result.push(current.key);
      current = current.next;
    }
    return result;
  }
}

/* ============================== 가이드 본문 코드: 결정론적 익스프레스(개선 단계 스케치) ============================== */

/** 레벨 0 배열 위에 고정 간격(step)마다 익스프레스 포인터를 두는 2-레벨 스케치. */
function deterministicExpressSearch(sortedKeys: number[], target: number): number {
  const step = Math.max(1, Math.floor(Math.sqrt(sortedKeys.length)));
  let comparisons = 0;
  let i = 0;
  // 1단계: step 간격으로 크게 점프
  while (i + step < sortedKeys.length && sortedKeys[i + step]! < target) {
    i += step;
    comparisons++;
  }
  // 2단계: 좁은 구간에서 하나씩 확인
  while (i < sortedKeys.length && sortedKeys[i]! < target) {
    i++;
    comparisons++;
  }
  return comparisons;
}

/* ============================== 검증 하니스 ============================== */

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${label}: ${a}`);
  }
}

console.log("=== 1. 구 sim 프레임 재현 (레벨 0 기준) ===");
{
  const sl = new SkipList();
  assertEqual(sl.toArray(), [], "초기 상태");
  sl.insert(3);
  assertEqual(sl.toArray(), [3], "insert(3)");
  sl.insert(1);
  assertEqual(sl.toArray(), [1, 3], "insert(1)");
  sl.insert(5);
  assertEqual(sl.toArray(), [1, 3, 5], "insert(5)");
  assertEqual(sl.search(3), true, "search(3)");
  sl.delete(1);
  assertEqual(sl.toArray(), [3, 5], "delete(1) 이후");
}

console.log("\n=== 2. problem.md 예시 재현 ===");
{
  const sl = new SkipList();
  sl.insert(3);
  sl.insert(1);
  sl.insert(5);
  sl.insert(3); // 중복 무시
  assertEqual(sl.toArray(), [1, 3, 5], "toArray 초기");
  assertEqual(sl.search(3), true, "search(3)");
  assertEqual(sl.search(2), false, "search(2)");
  sl.delete(1);
  assertEqual(sl.toArray(), [3, 5], "delete(1) 이후");
  sl.delete(99);
  assertEqual(sl.toArray(), [3, 5], "delete(99) 없는 키 무시");
}

console.log("\n=== 3. 다단계(멀티레벨) 예시 — 스크립트 RNG로 레벨 강제 ===");
{
  // key=1 -> level2([<0.5, >=0.5]) key=3 -> level1([>=0.5])
  // key=5 -> level3([<0.5,<0.5,>=0.5]) key=7 -> level1([>=0.5]) key=9 -> level2([<0.5,>=0.5])
  const script = [0.1, 0.9, 0.9, 0.1, 0.2, 0.9, 0.9, 0.1, 0.9];
  let idx = 0;
  const scriptedRandom = () => script[idx++]!;
  const sl = new SkipList(scriptedRandom);
  for (const k of [1, 3, 5, 7, 9]) sl.insert(k);
  assertEqual(sl.toArray(), [1, 3, 5, 7, 9], "다단계 예시 toArray");
  const levels = sl._debugLevels();
  console.log("levels(top→0):", JSON.stringify(levels));
  // 기대: level2=[5], level1=[1,5,9], level0=[1,3,5,7,9]
  assertEqual(levels, [[5], [1, 5, 9], [1, 3, 5, 7, 9]], "레벨별 구조");
}

console.log("\n=== 4. search(7) 경로 트레이스 (위 다단계 구조에서) ===");
{
  const script = [0.1, 0.9, 0.9, 0.1, 0.2, 0.9, 0.9, 0.1, 0.9];
  let idx = 0;
  const scriptedRandom = () => script[idx++]!;
  const sl = new SkipList(scriptedRandom);
  for (const k of [1, 3, 5, 7, 9]) sl.insert(k);

  // search 로직을 그대로 복제하되 방문 경로를 기록한다(가이드 본문 트레이스 검증용).
  const trace: string[] = [];
  const anySl = sl as unknown as { head: SLNode; currentLevel: number };
  let current = anySl.head;
  for (let i = anySl.currentLevel; i >= 0; i--) {
    while (current.next[i] !== undefined && current.next[i]!.key < 7) {
      current = current.next[i]!;
      trace.push(`레벨${i}: -> ${current.key}`);
    }
    trace.push(`레벨${i}: 다음 노드 key >= 7 (또는 끝) → 한 레벨 하강`);
  }
  console.log(trace.join("\n"));
  assertEqual(sl.search(7), true, "search(7) 결과");
  assertEqual(sl.search(6), false, "search(6) 결과(없는 키)");
}

console.log("\n=== 5. 중복 키 함정 재현: update 루프에 <= 를 쓰면 벌어지는 일 ===");
{
  // 버그 버전: while (current.next[i].key <= key) 로 바꾼 insert
  function buggyInsertTwice(): number[] {
    const sl2 = new SkipList();
    // insert를 그대로 쓰되, 첫 삽입 후 "버그가 있다면" 상황을 수작업으로 재현:
    // <= 버전에서는 update-구성 루프가 key와 같은 노드까지 전진해 버려
    // current 자체가 key 노드가 되고, current.next[0]는 그 다음 노드가 되므로
    // "current.next[0].key === key" 중복 검사가 항상 거짓이 된다.
    // 이를 실제 코드로 재현해 본다.
    type Node = { key: number; next: (Node | undefined)[] };
    const head: Node = { key: -Infinity, next: new Array(MAX_LEVEL).fill(undefined) };
    let currentLevel = 0;
    function buggyInsert(key: number) {
      const update: Node[] = new Array(MAX_LEVEL);
      let current = head;
      for (let i = currentLevel; i >= 0; i--) {
        while (current.next[i] !== undefined && current.next[i]!.key <= key) {
          // 버그: < 대신 <=
          current = current.next[i]!;
        }
        update[i] = current;
      }
      const found = current.next[0];
      if (found !== undefined && found.key === key) return;
      const newLevel = 1;
      const newNode: Node = { key, next: new Array(newLevel).fill(undefined) };
      for (let i = 0; i < newLevel; i++) {
        newNode.next[i] = update[i].next[i];
        update[i].next[i] = newNode;
      }
    }
    buggyInsert(3);
    buggyInsert(3); // 같은 키 재삽입 — 정상이면 무시돼야 한다
    const result: number[] = [];
    let n = head.next[0];
    while (n !== undefined) {
      result.push(n.key);
      n = n.next[0];
    }
    return result;
  }
  const buggyResult = buggyInsertTwice();
  console.log("버그 버전 insert(3); insert(3); toArray() =", JSON.stringify(buggyResult));
  assertEqual(buggyResult, [3, 3], "버그 버전은 중복을 막지 못한다");

  const sl = new SkipList();
  sl.insert(3);
  sl.insert(3);
  assertEqual(sl.toArray(), [3], "정상 버전은 중복을 막는다");
}

console.log("\n=== 6. 결정론적 익스프레스(개선 단계) 비교 비용 ===");
{
  const sorted = Array.from({ length: 100 }, (_, i) => i);
  const naiveComparisons = (() => {
    let c = 0;
    for (const v of sorted) {
      c++;
      if (v >= 77) break;
    }
    return c;
  })();
  const expressComparisons = deterministicExpressSearch(sorted, 77);
  console.log(`n=100, target=77 → naive 선형비교=${naiveComparisons}, 결정론적 익스프레스=${expressComparisons}`);
}

console.log("\n=== 7. 무작위 교차검증 (1000회, n<=500) ===");
{
  for (let trial = 0; trial < 1000; trial++) {
    const n = 1 + Math.floor(Math.random() * 500);
    const keys = new Set<number>();
    while (keys.size < n) keys.add(Math.floor(Math.random() * 1000) - 500);
    const keyArr = [...keys];
    const sl = new SkipList();
    const reference = new Set<number>();
    for (const k of keyArr) {
      sl.insert(k);
      reference.add(k);
    }
    // 무작위 삭제
    const toDelete = keyArr.filter(() => Math.random() < 0.3);
    for (const k of toDelete) {
      sl.delete(k);
      reference.delete(k);
    }
    const expectedSorted = [...reference].sort((a, b) => a - b);
    const actual = sl.toArray();
    if (JSON.stringify(actual) !== JSON.stringify(expectedSorted)) {
      console.error(`FAIL trial ${trial}: mismatch`);
      process.exitCode = 1;
      break;
    }
    for (const k of keyArr) {
      const expected = reference.has(k);
      if (sl.search(k) !== expected) {
        console.error(`FAIL trial ${trial}: search(${k}) mismatch`);
        process.exitCode = 1;
      }
    }
  }
  if (process.exitCode !== 1) console.log("ok   1000회 무작위 교차검증 통과");
}

console.log("\n=== 8. 엣지 케이스 ===");
{
  const sl = new SkipList();
  assertEqual(sl.search(1), false, "빈 리스트 search");
  assertEqual(sl.toArray(), [], "빈 리스트 toArray");
  sl.delete(1); // 없는 키 삭제 시도 — 에러 없이 무시
  assertEqual(sl.toArray(), [], "빈 리스트에서 delete 후에도 빈 배열");

  sl.insert(-5);
  assertEqual(sl.toArray(), [-5], "크기 1(음수 키)");
  assertEqual(sl.search(-5), true, "크기 1 search 성공");
  sl.delete(-5);
  assertEqual(sl.toArray(), [], "크기 1 삭제 후 다시 빈 리스트");

  // 경계값
  sl.insert(-(2 ** 31));
  sl.insert(2 ** 31 - 1);
  assertEqual(sl.toArray(), [-(2 ** 31), 2 ** 31 - 1], "정수 경계값");
}

console.log("\n모든 검증 완료.");
