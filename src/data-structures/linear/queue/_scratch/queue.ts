// ORD-003 E3 자기검증 스크래치 — queue-guide.new.mdx 본문 코드를 그대로 옮겨 실행한다.
// 실행: bun src/data-structures/linear/queue/_scratch/queue.ts

// ── 0단계: 원형 (naive) ──────────────────────────────────────────────
class NaiveQueue<T> {
  private items: T[] = [];
  enqueue(item: T): void {
    this.items.push(item);
  }
  dequeue(): T | undefined {
    return this.items.shift(); // O(n) — 모든 뒤 원소를 한 칸씩 당긴다
  }
  front(): T | undefined {
    return this.items[0];
  }
  isEmpty(): boolean {
    return this.items.length === 0;
  }
  size(): number {
    return this.items.length;
  }
}

// ── 1단계: 개선 (head 포인터) ────────────────────────────────────────
class HeadPointerQueue<T> {
  private items: T[] = [];
  private head = 0;

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const x = this.items[this.head];
    this.head++;
    return x;
  }

  front(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.head];
  }

  isEmpty(): boolean {
    return this.head >= this.items.length;
  }

  size(): number {
    return this.items.length - this.head;
  }

  // 검증용: 내부 배열의 실제 길이 노출
  rawLength(): number {
    return this.items.length;
  }
}

// ── 2단계: 최종 (head 포인터 + 압축) ────────────────────────────────
export class Queue<T> {
  private items: T[] = [];
  private head = 0;

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const x = this.items[this.head];
    this.items[this.head] = undefined as unknown as T; // 참조 해제 (GC 도움)
    this.head++;
    this.compactIfNeeded();
    return x;
  }

  front(): T | undefined {
    return this.isEmpty() ? undefined : this.items[this.head];
  }

  isEmpty(): boolean {
    return this.head >= this.items.length;
  }

  size(): number {
    return this.items.length - this.head;
  }

  private compactIfNeeded(): void {
    // head가 1000을 넘고 배열의 절반 이상을 차지하면 압축
    if (this.head > 1000 && this.head * 2 > this.items.length) {
      this.items = this.items.slice(this.head);
      this.head = 0;
    }
  }

  // 검증용
  rawLength(): number {
    return this.items.length;
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${label} — actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`OK: ${label} → ${a}`);
  }
}

console.log("=== 대표 시나리오 (시뮬레이션 steps와 1:1 대응) ===");
{
  const q = new Queue<number>();
  assertEqual(q.isEmpty(), true, "초기 상태 isEmpty");
  q.enqueue(1);
  assertEqual([...(q as any).items].filter((v: any) => v !== undefined), [1], "enqueue(1) 후 배열");
  assertEqual(q.size(), 1, "enqueue(1) 후 size");
  q.enqueue(2);
  assertEqual(q.size(), 2, "enqueue(2) 후 size");
  q.enqueue(3);
  assertEqual(q.size(), 3, "enqueue(3) 후 size");
  const d1 = q.dequeue();
  assertEqual(d1, 1, "dequeue() 반환값");
  assertEqual(q.size(), 2, "dequeue() 후 size");
  const f1 = q.front();
  assertEqual(f1, 2, "front() 반환값");
  assertEqual(q.size(), 2, "front() 후 size 유지");
}

console.log("\n=== 엣지 케이스 ===");
{
  const q = new Queue<number>();
  assertEqual(q.dequeue(), undefined, "빈 큐 dequeue()");
  assertEqual(q.front(), undefined, "빈 큐 front()");
  q.enqueue(42);
  assertEqual(q.front(), 42, "enqueue 후 즉시 front() — FIFO 첫 값");
  const d = q.dequeue();
  assertEqual(d, 42, "1개 원소 dequeue() 반환값");
  assertEqual(q.isEmpty(), true, "1개 원소 dequeue 후 isEmpty()");
}

console.log("\n=== 원형(naive) vs 최종 — 결과 동일성 (소규모) ===");
{
  const naive = new NaiveQueue<number>();
  const final = new Queue<number>();
  const ops: Array<["enqueue", number] | ["dequeue"] | ["front"]> = [
    ["enqueue", 10],
    ["enqueue", 20],
    ["dequeue"],
    ["enqueue", 30],
    ["front"],
    ["dequeue"],
    ["dequeue"],
    ["dequeue"], // 빈 상태에서 dequeue
  ];
  for (const op of ops) {
    if (op[0] === "enqueue") {
      naive.enqueue(op[1]);
      final.enqueue(op[1]);
    } else if (op[0] === "dequeue") {
      assertEqual(final.dequeue(), naive.dequeue(), `dequeue 동일성 (${JSON.stringify(op)})`);
    } else {
      assertEqual(final.front(), naive.front(), `front 동일성 (${JSON.stringify(op)})`);
    }
  }
}

console.log("\n=== 무작위 교차검증 (final vs naive, 5000 ops) ===");
{
  const naive = new NaiveQueue<number>();
  const final = new Queue<number>();
  let seed = 12345;
  function rand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  let mismatches = 0;
  for (let i = 0; i < 5000; i++) {
    const r = rand();
    if (r < 0.55) {
      const v = Math.floor(rand() * 1000);
      naive.enqueue(v);
      final.enqueue(v);
    } else if (r < 0.8) {
      const a = naive.dequeue();
      const b = final.dequeue();
      if (a !== b) mismatches++;
    } else if (r < 0.95) {
      const a = naive.front();
      const b = final.front();
      if (a !== b) mismatches++;
    } else {
      if (naive.isEmpty() !== final.isEmpty()) mismatches++;
      if (naive.size() !== final.size()) mismatches++;
    }
  }
  assertEqual(mismatches, 0, "무작위 5000회 연산 mismatch 개수");
  assertEqual(naive.size(), final.size(), "무작위 연산 후 최종 size 일치");
}

console.log("\n=== 1단계(head 포인터, 압축 없음) — 메모리 누수 함정 실측 ===");
{
  const q = new HeadPointerQueue<number>();
  const N = 1_000_000;
  for (let i = 0; i < N; i++) {
    q.enqueue(i);
    q.dequeue();
  }
  assertEqual(q.size(), 0, "1단계: N회 enqueue+dequeue 후 size()");
  assertEqual(q.rawLength(), N, "1단계: 내부 배열 길이 — size()는 0인데 배열은 그대로 N칸");
}

console.log("\n=== 2단계(최종, 압축 적용) — 메모리 상한 확인 ===");
{
  const q = new Queue<number>();
  const N = 1_000_000;
  for (let i = 0; i < N; i++) {
    q.enqueue(i);
    q.dequeue();
  }
  assertEqual(q.size(), 0, "2단계: N회 enqueue+dequeue 후 size()");
  const raw = q.rawLength();
  console.log(`2단계: 내부 배열 길이 = ${raw} (압축으로 소규모 유지)`);
  if (raw > 2100) {
    console.error(`FAIL: 압축 후 배열 길이가 예상보다 큼 (${raw})`);
    process.exitCode = 1;
  } else {
    console.log(`OK: 압축 후 배열 길이 ${raw} <= 2100`);
  }
}

console.log("\n=== 성능 목표 검증: naive O(n) vs 최종 O(1) 체감 (문제 제약 n=10^6) ===");
{
  const n = 1_000_000;
  const naive = new NaiveQueue<number>();
  for (let i = 0; i < n; i++) naive.enqueue(i);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) naive.dequeue();
  const naiveMs = performance.now() - t0;

  const final = new Queue<number>();
  for (let i = 0; i < n; i++) final.enqueue(i);
  const t1 = performance.now();
  for (let i = 0; i < n; i++) final.dequeue();
  const finalMs = performance.now() - t1;

  console.log(`naive(shift) ${n}회 dequeue: ${naiveMs.toFixed(1)}ms`);
  console.log(`final(head)  ${n}회 dequeue: ${finalMs.toFixed(1)}ms`);
  if (finalMs >= naiveMs) {
    console.error("FAIL: 최종 구현이 naive보다 느림 — 성능 주장 재검토 필요");
    process.exitCode = 1;
  } else {
    console.log(`OK: 최종 구현이 naive보다 빠름 (배율 ${(naiveMs / Math.max(finalMs, 0.01)).toFixed(1)}x)`);
  }
}

console.log("\n모든 검증 완료.");
