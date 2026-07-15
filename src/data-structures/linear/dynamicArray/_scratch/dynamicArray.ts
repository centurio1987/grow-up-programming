// E3 자기검증용 스크래치 — 가이드 본문에 실리는 코드를 그대로 추출해 실행한다.
// 가이드 자신의 코드가 oracle이며, sibling dynamicArray.ts(학습자 실습 스텁)는 채점 대상이 아니다.

// ── 1) 원형(naive): push마다 새 배열 통째로 복사 ──────────────────────────
class NaiveArray<T> {
  private data: T[] = [];

  push(item: T): void {
    const newData = new Array<T>(this.data.length + 1);
    for (let i = 0; i < this.data.length; i++) newData[i] = this.data[i];
    newData[this.data.length] = item;
    this.data = newData;
  }

  toArray(): T[] {
    return this.data.slice();
  }
}

// ── 2) 개선: 2배 더블링만 있고 축소는 없는 버전 ───────────────────────────
class DoublingOnlyArray<T> {
  private data: (T | undefined)[];
  private _size: number;
  private _capacity: number;

  constructor() {
    this._capacity = 4;
    this._size = 0;
    this.data = new Array<T | undefined>(this._capacity);
  }

  push(item: T): void {
    if (this._size === this._capacity) {
      const newData = new Array<T | undefined>(this._capacity * 2);
      for (let i = 0; i < this._size; i++) newData[i] = this.data[i];
      this.data = newData;
      this._capacity *= 2;
    }
    this.data[this._size] = item;
    this._size++;
  }

  size(): number {
    return this._size;
  }

  capacity(): number {
    return this._capacity;
  }
}

// ── 3) 최종: 더블링 + 1/4 임계 축소 ──────────────────────────────────────
class DynamicArray<T> {
  private data: (T | undefined)[];
  private _size: number;
  private _capacity: number;

  constructor() {
    this._capacity = 4;
    this._size = 0;
    this.data = new Array<T | undefined>(this._capacity);
  }

  push(item: T): void {
    if (this._size === this._capacity) {
      this.resize(this._capacity * 2);
    }
    this.data[this._size] = item;
    this._size++;
  }

  pop(): T | undefined {
    if (this._size === 0) return undefined;
    this._size--;
    const val = this.data[this._size];
    this.data[this._size] = undefined;
    if (this._size <= this._capacity >> 2 && this._capacity > 4) {
      this.resize(this._capacity >> 1);
    }
    return val;
  }

  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined;
    return this.data[index];
  }

  set(index: number, item: T): void {
    if (index < 0 || index >= this._size) return;
    this.data[index] = item;
  }

  size(): number {
    return this._size;
  }

  capacity(): number {
    return this._capacity;
  }

  toArray(): T[] {
    return this.data.slice(0, this._size) as T[];
  }

  private resize(newCapacity: number): void {
    const newData = new Array<T | undefined>(newCapacity);
    for (let i = 0; i < this._size; i++) newData[i] = this.data[i];
    this.data = newData;
    this._capacity = newCapacity;
  }
}

// ── 잘못된 축소 임계값(capacity/2)을 쓰면 thrashing이 난다는 것을 보이는 변종 ──
class ThrashingArray<T> extends DynamicArray<T> {
  private resizeCount = 0;
  private cap4 = 4;
  private sz4 = 0;

  // capacity/2 기준으로 축소하는 버전을 흉내내기 위해 별도 최소 구현을 둔다.
}

function assertEq(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: actual=${a} expected=${e}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${label}: ${a}`);
  }
}

console.log("=== 시뮬레이션 steps 실측 (본문 '실행 시각화' 대응) ===");
{
  const arr = new DynamicArray<number>();
  assertEq("초기 capacity", arr.capacity(), 4);
  assertEq("초기 size", arr.size(), 0);

  arr.push(1);
  arr.push(2);
  arr.push(3);
  arr.push(4);
  assertEq("4번 push 후 size", arr.size(), 4);
  assertEq("4번 push 후 capacity", arr.capacity(), 4);
  assertEq("4번 push 후 toArray", arr.toArray(), [1, 2, 3, 4]);

  arr.push(5);
  assertEq("5번째 push 후 capacity", arr.capacity(), 8);
  assertEq("5번째 push 후 size", arr.size(), 5);
  assertEq("5번째 push 후 toArray", arr.toArray(), [1, 2, 3, 4, 5]);

  const p1 = arr.pop();
  assertEq("pop() 반환값", p1, 5);
  assertEq("pop 후 size", arr.size(), 4);
  assertEq("pop 후 capacity(축소 없음)", arr.capacity(), 8);

  const p2 = arr.pop();
  const p3 = arr.pop();
  assertEq("두 번째 pop 반환값", p2, 4);
  assertEq("세 번째 pop 반환값", p3, 3);
  assertEq("연속 pop 후 size", arr.size(), 2);
  assertEq("연속 pop 후 capacity(축소됨)", arr.capacity(), 4);
  assertEq("최종 toArray", arr.toArray(), [1, 2]);
}

console.log("\n=== 문제 예시(problem.md) 시퀀스 실측 ===");
{
  const arr = new DynamicArray<number>();
  assertEq("초기 capacity", arr.capacity(), 4);
  arr.push(1);
  arr.push(2);
  arr.push(3);
  arr.push(4);
  assertEq("4개 push 후 capacity", arr.capacity(), 4);
  arr.push(5);
  assertEq("5개 push 후 capacity", arr.capacity(), 8);
  assertEq("5개 push 후 size", arr.size(), 5);
  assertEq("get(2)", arr.get(2), 3);
  arr.set(2, 99);
  assertEq("set(2, 99) 후 toArray", arr.toArray(), [1, 2, 99, 4, 5]);
  const a = arr.pop();
  const b = arr.pop();
  const c = arr.pop();
  assertEq("pop 1", a, 5);
  assertEq("pop 2", b, 4);
  assertEq("pop 3", c, 99);
  assertEq("3연속 pop 후 size", arr.size(), 2);
  assertEq("3연속 pop 후 capacity", arr.capacity(), 4);
}

console.log("\n=== 엣지 케이스 ===");
{
  const empty = new DynamicArray<number>();
  assertEq("빈 배열 pop", empty.pop(), undefined);
  assertEq("빈 배열 get(0)", empty.get(0), undefined);
  assertEq("빈 배열 get(-1)", empty.get(-1), undefined);
  empty.set(0, 100); // no-op이어야 함
  assertEq("빈 배열 set no-op 후 size", empty.size(), 0);

  const single = new DynamicArray<number>();
  single.push(42);
  assertEq("size=1 capacity", single.capacity(), 4);
  assertEq("size=1 get(-1)", single.get(-1), undefined);
  assertEq("size=1 get(1) 범위 밖", single.get(1), undefined);
  assertEq("size=1 pop", single.pop(), 42);
  assertEq("size=1 pop 후 capacity(4 이하로는 축소 안 함)", single.capacity(), 4);

  // capacity가 4보다 작아지지 않는지 확인 (capacity>4 조건)
  const shrinkFloor = new DynamicArray<number>();
  for (let i = 0; i < 5; i++) shrinkFloor.push(i);
  assertEq("5개 push 후 capacity", shrinkFloor.capacity(), 8);
  shrinkFloor.pop();
  shrinkFloor.pop();
  shrinkFloor.pop();
  assertEq("3번 pop 후 size", shrinkFloor.size(), 2);
  assertEq("3번 pop 후 capacity", shrinkFloor.capacity(), 4);
  shrinkFloor.pop();
  assertEq("size=1일 때 capacity(바닥 4 유지)", shrinkFloor.capacity(), 4);
  shrinkFloor.pop();
  assertEq("size=0일 때 capacity(바닥 4 유지)", shrinkFloor.capacity(), 4);
}

console.log("\n=== 무작위 교차검증 (DynamicArray vs 기준 JS Array) ===");
{
  let seed = 12345;
  function rand() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }

  for (let trial = 0; trial < 20; trial++) {
    const arr = new DynamicArray<number>();
    const ref: number[] = [];
    const ops = 200;
    for (let i = 0; i < ops; i++) {
      const r = rand();
      if (r < 0.6 || ref.length === 0) {
        const v = Math.floor(rand() * 1000);
        arr.push(v);
        ref.push(v);
      } else if (r < 0.8) {
        const a = arr.pop();
        const b = ref.pop();
        if (a !== b) {
          console.error(`FAIL trial ${trial} op ${i}: pop mismatch ${a} vs ${b}`);
          process.exitCode = 1;
        }
      } else {
        const idx = Math.floor(rand() * (ref.length + 2)) - 1; // 범위 밖도 섞는다
        if (r < 0.9) {
          const a = arr.get(idx);
          const b = idx >= 0 && idx < ref.length ? ref[idx] : undefined;
          if (a !== b) {
            console.error(`FAIL trial ${trial} op ${i}: get(${idx}) mismatch ${a} vs ${b}`);
            process.exitCode = 1;
          }
        } else {
          const v = Math.floor(rand() * 1000);
          arr.set(idx, v);
          if (idx >= 0 && idx < ref.length) ref[idx] = v;
        }
      }
      // 불변식 체크: 0 <= size <= capacity, capacity >= 4
      if (!(0 <= arr.size() && arr.size() <= arr.capacity() && arr.capacity() >= 4)) {
        console.error(`FAIL trial ${trial} op ${i}: invariant broken size=${arr.size()} capacity=${arr.capacity()}`);
        process.exitCode = 1;
      }
    }
    const finalArr = arr.toArray();
    if (JSON.stringify(finalArr) !== JSON.stringify(ref)) {
      console.error(`FAIL trial ${trial}: final mismatch`);
      process.exitCode = 1;
    }
  }
  console.log("무작위 20회 시행, 각 200연산 — 전부 일치 (아래 FAIL 없으면 통과)");
}

console.log("\n=== 원형 vs 최종 성능 비교(복사 총량) ===");
{
  // 최종(더블링) 버전의 push N번 시 총 복사 원소 수를 센다.
  class CountingDynamicArray<T> {
    private data: (T | undefined)[];
    private _size = 0;
    private _capacity = 4;
    copies = 0;
    constructor() {
      this.data = new Array<T | undefined>(this._capacity);
    }
    push(item: T) {
      if (this._size === this._capacity) {
        const newData = new Array<T | undefined>(this._capacity * 2);
        for (let i = 0; i < this._size; i++) {
          newData[i] = this.data[i];
          this.copies++;
        }
        this.data = newData;
        this._capacity *= 2;
      }
      this.data[this._size] = item;
      this._size++;
    }
  }
  const n = 100000;
  const counting = new CountingDynamicArray<number>();
  for (let i = 0; i < n; i++) counting.push(i);
  console.log(`n=${n} push 시 총 복사 원소 수 = ${counting.copies} (2n=${2 * n} 이내인가: ${counting.copies <= 2 * n})`);
}

console.log("\n=== thrashing 반례: 축소 임계값을 capacity/2로 잘못 잡으면 ===");
{
  // 잘못된 버전: size <= capacity/2 일 때 축소 (책의 capacity/4 대신)
  class WrongShrinkArray<T> {
    private data: (T | undefined)[];
    private _size = 0;
    private _capacity = 4;
    resizeCount = 0;
    constructor() {
      this.data = new Array<T | undefined>(this._capacity);
    }
    push(item: T) {
      if (this._size === this._capacity) {
        this.resize(this._capacity * 2);
      }
      this.data[this._size] = item;
      this._size++;
    }
    pop(): T | undefined {
      if (this._size === 0) return undefined;
      this._size--;
      const val = this.data[this._size];
      this.data[this._size] = undefined;
      if (this._size <= this._capacity / 2 && this._capacity > 4) {
        this.resize(this._capacity / 2);
      }
      return val;
    }
    private resize(newCapacity: number) {
      const newData = new Array<T | undefined>(newCapacity);
      for (let i = 0; i < this._size; i++) newData[i] = this.data[i];
      this.data = newData;
      this._capacity = newCapacity;
      this.resizeCount++;
    }
    capacity() {
      return this._capacity;
    }
  }
  const wrong = new WrongShrinkArray<number>();
  for (let i = 0; i < 5; i++) wrong.push(i); // size=5, capacity=8
  console.log(`5개 push 후 capacity=${wrong.capacity()}, resizeCount=${wrong.resizeCount}`);
  // 이제 pop → push → pop → push 를 10번 반복하며 resize 횟수를 센다
  const before = wrong.resizeCount;
  for (let i = 0; i < 10; i++) {
    wrong.pop(); // size=4 -> capacity/2=4 이므로 축소! capacity=4
    wrong.push(99); // size=4=capacity -> 즉시 확장! capacity=8
  }
  const after = wrong.resizeCount;
  console.log(`pop/push 10회 반복 동안 resize 발생 횟수 = ${after - before} (매 반복마다 resize면 thrashing)`);

  // 올바른 1/4 기준 버전은 같은 시나리오에서 resize가 없어야 한다
  const correct = new DynamicArray<number>();
  for (let i = 0; i < 5; i++) correct.push(i); // size=5, capacity=8
  let correctResizeHappened = false;
  const capBefore = correct.capacity();
  for (let i = 0; i < 10; i++) {
    correct.pop(); // size=4, 4 <= 8/4=2? No -> 축소 없음
    correct.push(99); // size=4=capacity? No, capacity=8 -> 확장 없음
    if (correct.capacity() !== capBefore) correctResizeHappened = true;
  }
  console.log(`1/4 기준 버전은 같은 반복에서 resize 발생 = ${correctResizeHappened} (false여야 정상)`);
}
