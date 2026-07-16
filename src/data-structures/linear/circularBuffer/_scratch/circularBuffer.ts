// ORD-003 E3 자기검증용 스크래치. 가이드 본문 코드를 그대로 추출해 실행한다.

// ── 원형(naive): 동적 배열 + splice ─────────────────────────────
class NaiveLogBuffer<T> {
  private buf: T[] = [];
  constructor(private capacity: number) {}

  write(item: T): void {
    this.buf.push(item);
    if (this.buf.length > this.capacity) {
      this.buf.splice(0, 1); // O(n) 시프트
    }
  }

  read(): T | undefined {
    return this.buf.shift(); // O(n)
  }

  toArray(): T[] {
    return [...this.buf];
  }
}

// ── 개선: 고정 배열 + head/tail, "슬롯 하나 예약"으로 empty/full 구분 ──
class ReserveSlotRingBuffer<T> {
  private buf: (T | undefined)[];
  private head = 0;
  private tail = 0;

  constructor(private capacity: number) {
    this.buf = new Array(capacity);
  }

  isFull(): boolean {
    return (this.tail + 1) % this.capacity === this.head;
  }

  isEmpty(): boolean {
    return this.head === this.tail;
  }

  write(item: T): void {
    if (this.isFull()) {
      this.head = (this.head + 1) % this.capacity; // oldest 제거
    }
    this.buf[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
  }

  read(): T | undefined {
    if (this.isEmpty()) return undefined;
    const x = this.buf[this.head];
    this.head = (this.head + 1) % this.capacity;
    return x;
  }

  usedSlots(): number {
    return (this.tail - this.head + this.capacity) % this.capacity;
  }
}

// ── 최종: count 필드로 예약 슬롯 없이 capacity 전부 사용 ──────────
export class CircularBuffer<T> {
  private buf: (T | undefined)[];
  private head = 0;
  private tail = 0;
  private count = 0;

  constructor(private capacity: number) {
    this.buf = new Array(capacity);
  }

  write(item: T): void {
    this.buf[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity; // oldest 자동 제거
    }
  }

  read(): T | undefined {
    if (this.count === 0) return undefined;
    const x = this.buf[this.head];
    this.buf[this.head] = undefined; // GC 도움
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return x;
  }

  peek(): T | undefined {
    if (this.count === 0) return undefined;
    return this.buf[this.head];
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  size(): number {
    return this.count;
  }
}

// ── 검증 ────────────────────────────────────────────────────────
function assertEq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    throw new Error(`FAIL ${label}: actual=${a} expected=${e}`);
  }
  console.log(`OK   ${label}: ${a}`);
}

console.log("=== 원형(naive) 동작 확인 ===");
{
  const nb = new NaiveLogBuffer<number>(3);
  nb.write(1);
  nb.write(2);
  nb.write(3);
  assertEq(nb.toArray(), [1, 2, 3], "naive write x3");
  nb.write(4);
  assertEq(nb.toArray(), [2, 3, 4], "naive write(4) 오버플로우 후 splice");
}

console.log("\n=== 개선(예약 슬롯) 결함 재현: capacity=3인데 실사용 2개 ===");
{
  const rb = new ReserveSlotRingBuffer<number>(3);
  assertEq(rb.isEmpty(), true, "reserve isEmpty initial");
  rb.write(1);
  rb.write(2);
  assertEq(rb.isFull(), true, "reserve isFull after 2 writes (capacity=3인데!)");
  assertEq(rb.usedSlots(), 2, "reserve usedSlots at declared-full");
  rb.write(3); // isFull이었으므로 head 전진 후 write → 사실상 1을 덮어씀
  assertEq(rb.read(), 2, "reserve read() — 1이 아니라 2가 나옴(1은 조용히 유실)");
  assertEq(rb.read(), 3, "reserve read() 두번째");
  assertEq(rb.isEmpty(), true, "reserve read 이후 isEmpty");
}

console.log("\n=== 최종 CircularBuffer: 가이드 시뮬레이션 트레이스 ===");
{
  const buf = new CircularBuffer<number>(3);
  assertEq(buf.isEmpty(), true, "초기 isEmpty");
  assertEq(buf.size(), 0, "초기 size");

  buf.write(1);
  assertEq(buf.size(), 1, "write(1) 후 size");

  buf.write(2);
  assertEq(buf.size(), 2, "write(2) 후 size");

  buf.write(3);
  assertEq(buf.isFull(), true, "write(3) 후 isFull");
  assertEq(buf.size(), 3, "write(3) 후 size");
  assertEq(buf.peek(), 1, "write(3) 후 peek == oldest(1)");

  buf.write(4); // 오버플로우: oldest(1) 제거
  assertEq(buf.size(), 3, "write(4) 오버플로우 후 size 유지");
  assertEq(buf.peek(), 2, "write(4) 후 peek == 2 (1이 사라짐)");

  assertEq(buf.read(), 2, "read() → 2");
  assertEq(buf.size(), 2, "read() 후 size");

  assertEq(buf.read(), 3, "read() → 3");
  assertEq(buf.size(), 1, "read() 후 size");

  assertEq(buf.read(), 4, "read() → 4");
  assertEq(buf.isEmpty(), true, "모두 읽은 후 isEmpty");

  assertEq(buf.read(), undefined, "빈 상태 read() → undefined");
}

console.log("\n=== 문제 예시(circularBuffer-problem.md) 재현 ===");
{
  const buf = new CircularBuffer<number>(3);
  buf.write(1);
  buf.write(2);
  buf.write(3);
  assertEq(buf.isFull(), true, "예시: isFull");
  assertEq(buf.peek(), 1, "예시: peek == 1");
  buf.write(4);
  assertEq(buf.peek(), 2, "예시: write(4) 후 peek == 2");
  assertEq(buf.read(), 2, "예시: read == 2");
  assertEq(buf.read(), 3, "예시: read == 3");
  assertEq(buf.size(), 1, "예시: size == 1");
  assertEq(buf.read(), 4, "예시: read == 4");
  assertEq(buf.isEmpty(), true, "예시: isEmpty");
  assertEq(buf.read(), undefined, "예시: read == undefined");
}

console.log("\n=== 엣지케이스: capacity=1 ===");
{
  const buf = new CircularBuffer<number>(1);
  buf.write(10);
  assertEq(buf.isFull(), true, "cap=1 write 1번 후 isFull");
  buf.write(20); // 매번 덮어씀
  assertEq(buf.peek(), 20, "cap=1 write 2번째부터 덮어씀");
  assertEq(buf.size(), 1, "cap=1 size는 항상 1 이하");
  assertEq(buf.read(), 20, "cap=1 read");
  assertEq(buf.isEmpty(), true, "cap=1 read 후 empty");
}

console.log("\n=== 엣지케이스: write N번 → read N번 → 재사용 ===");
{
  const buf = new CircularBuffer<number>(3);
  buf.write("a");
  buf.write("b");
  buf.write("c");
  assertEq(buf.read(), "a", "재사용 전 read a");
  assertEq(buf.read(), "b", "재사용 전 read b");
  assertEq(buf.read(), "c", "재사용 전 read c");
  assertEq(buf.isEmpty(), true, "완전히 비움");
  buf.write("x");
  buf.write("y");
  assertEq(buf.size(), 2, "재사용 후 size");
  assertEq(buf.peek(), "x", "재사용 후 peek");
}

console.log("\n=== 확인 질문 검증: capacity=3에 write 5회 후 head/tail ===");
class InstrumentedCircularBuffer<T> {
  buf: (T | undefined)[];
  head = 0;
  tail = 0;
  count = 0;
  constructor(private capacity: number) {
    this.buf = new Array(capacity);
  }
  write(item: T): void {
    this.buf[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }
}
{
  const ib = new InstrumentedCircularBuffer<number>(3);
  for (let v = 1; v <= 5; v++) ib.write(v);
  assertEq(ib.head, 2, "write 5회 후 head");
  assertEq(ib.tail, 2, "write 5회 후 tail");
  assertEq(ib.count, 3, "write 5회 후 count (head==tail이어도 가득 참)");
}

console.log("\n=== 무작위 교차검증: CircularBuffer vs 배열 기반 오라클 ===");
{
  function oracleStep(
    oracle: number[],
    capacity: number,
    op: "write" | "read",
    value?: number,
  ): number | undefined {
    if (op === "write") {
      oracle.push(value!);
      if (oracle.length > capacity) oracle.shift();
      return undefined;
    } else {
      return oracle.length > 0 ? oracle.shift() : undefined;
    }
  }

  let seed = 42;
  function rand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  for (let trial = 0; trial < 20; trial++) {
    const capacity = 1 + Math.floor(rand() * 5);
    const buf = new CircularBuffer<number>(capacity);
    const oracle: number[] = [];
    let nextVal = 0;
    for (let step = 0; step < 200; step++) {
      if (rand() < 0.6) {
        const v = nextVal++;
        buf.write(v);
        oracleStep(oracle, capacity, "write", v);
      } else {
        const got = buf.read();
        const expected = oracleStep(oracle, capacity, "read");
        if (got !== expected) {
          throw new Error(
            `FAIL random trial=${trial} step=${step} capacity=${capacity}: got=${got} expected=${expected}`,
          );
        }
      }
      if (buf.size() !== oracle.length) {
        throw new Error(
          `FAIL random size mismatch trial=${trial} step=${step}: buf.size()=${buf.size()} oracle.length=${oracle.length}`,
        );
      }
    }
  }
  console.log("OK   무작위 20회 x 200 스텝 교차검증 통과");
}

console.log("\n모든 검증 통과");
