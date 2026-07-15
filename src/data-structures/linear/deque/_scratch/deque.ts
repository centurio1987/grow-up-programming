/**
 * ORD-003 deque 가이드 자기검증 스크립트.
 * 가이드 본문에 싣는 모든 클래스/수치/트레이스를 이 파일에서 실측한다.
 * 실행: bun src/data-structures/linear/deque/_scratch/deque.ts
 */

// ── 0. 원형(naive): 단일 배열 + unshift/shift ─────────────────────────────
class NaiveArrayDeque<T> {
  private data: T[] = [];
  opCost = 0; // 이동한 원소 수 누적 (unshift/shift 비용의 대리 지표)

  pushFront(item: T): void {
    this.opCost += this.data.length; // unshift: 기존 원소 전부 한 칸씩 밀림
    this.data.unshift(item);
  }
  pushBack(item: T): void {
    this.data.push(item); // O(1)
  }
  popFront(): T | undefined {
    if (this.data.length === 0) return undefined;
    this.opCost += this.data.length - 1; // shift: 나머지 전부 한 칸씩 당겨짐
    return this.data.shift();
  }
  popBack(): T | undefined {
    return this.data.pop(); // O(1)
  }
  peekFront(): T | undefined {
    return this.data[0];
  }
  peekBack(): T | undefined {
    return this.data[this.data.length - 1];
  }
  isEmpty(): boolean {
    return this.data.length === 0;
  }
  size(): number {
    return this.data.length;
  }
}

// ── 1. 개선(buggy amortized): 두 배열, 바닥나면 "한 번에 하나씩" shift ────
class ShiftPerPopDeque<T> {
  private front: T[] = []; // 역순
  private back: T[] = []; // 정순
  opCost = 0;

  pushFront(item: T): void {
    this.front.push(item);
  }
  pushBack(item: T): void {
    this.back.push(item);
  }
  popFront(): T | undefined {
    if (this.front.length > 0) return this.front.pop();
    if (this.back.length === 0) return undefined;
    this.opCost += this.back.length - 1; // back.shift() 비용
    return this.back.shift();
  }
  popBack(): T | undefined {
    if (this.back.length > 0) return this.back.pop();
    if (this.front.length === 0) return undefined;
    this.opCost += this.front.length - 1; // front.shift() 비용
    return this.front.shift();
  }
  size(): number {
    return this.front.length + this.back.length;
  }
}

// ── 2. 최종: 두 배열 + "바닥나면 절반씩 재분배" ────────────────────────────
export class Deque<T> {
  private front: T[] = []; // 역순 저장. front[length-1] = 논리적 맨 앞
  private back: T[] = []; // 정순 저장. back[0] = 논리적 front 바로 다음
  opCost = 0; // 계측용(가이드 코드에는 없음, 여기서만 추가)

  private rebalance(needFront: boolean): void {
    // front 또는 back 중 하나가 완전히 빈 상태에서만 호출된다.
    const logical = [...this.front].reverse().concat(this.back); // front-to-back 순서로 합친다
    this.opCost += logical.length; // 재조정 비용: 전체 원소를 한 번씩 만짐
    const total = logical.length;
    if (total === 1) {
      // 원소가 1개뿐이면 "절반씩"이 불가능하다 — 지금 요청받은 쪽에 몰아준다.
      this.front = needFront ? logical : [];
      this.back = needFront ? [] : logical;
      return;
    }
    const mid = Math.ceil(total / 2); // total>=2이므로 양쪽 다 최소 1개씩 확보된다
    this.front = logical.slice(0, mid).reverse(); // 앞쪽 절반 (역순 저장)
    this.back = logical.slice(mid); // 뒤쪽 절반 (정순 저장)
  }

  pushFront(item: T): void {
    this.front.push(item);
  }
  pushBack(item: T): void {
    this.back.push(item);
  }
  popFront(): T | undefined {
    if (this.front.length === 0) {
      if (this.back.length === 0) return undefined;
      this.rebalance(true);
    }
    return this.front.pop();
  }
  popBack(): T | undefined {
    if (this.back.length === 0) {
      if (this.front.length === 0) return undefined;
      this.rebalance(false);
    }
    return this.back.pop();
  }
  peekFront(): T | undefined {
    return this.front.length > 0 ? this.front[this.front.length - 1] : this.back[0];
  }
  peekBack(): T | undefined {
    return this.back.length > 0 ? this.back[this.back.length - 1] : this.front[0];
  }
  isEmpty(): boolean {
    return this.front.length + this.back.length === 0;
  }
  size(): number {
    return this.front.length + this.back.length;
  }
}

// ── 3. 오라클: 정확성 대조용 (느리지만 명백히 옳음) ────────────────────────
class ReferenceDeque<T> {
  private data: T[] = [];
  pushFront(item: T): void {
    this.data.unshift(item);
  }
  pushBack(item: T): void {
    this.data.push(item);
  }
  popFront(): T | undefined {
    return this.data.shift();
  }
  popBack(): T | undefined {
    return this.data.pop();
  }
  peekFront(): T | undefined {
    return this.data[0];
  }
  peekBack(): T | undefined {
    return this.data[this.data.length - 1];
  }
  isEmpty(): boolean {
    return this.data.length === 0;
  }
  size(): number {
    return this.data.length;
  }
}

function assertEq(actual: unknown, expected: unknown, label: string): void {
  if (actual !== expected) {
    throw new Error(`FAIL ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  }
}

console.log("=== 시나리오 A: FIFO 패턴 (pushBack n번 → popFront n번) ===");
for (const n of [500, 1000, 2000]) {
  const naive = new NaiveArrayDeque<number>();
  const shiftPerPop = new ShiftPerPopDeque<number>();
  const final = new Deque<number>();
  for (let i = 0; i < n; i++) {
    naive.pushBack(i);
    shiftPerPop.pushBack(i);
    final.pushBack(i);
  }
  for (let i = 0; i < n; i++) {
    naive.popFront();
    shiftPerPop.popFront();
    final.popFront();
  }
  console.log(
    `n=${n}: naive(단일배열).opCost=${naive.opCost}, 개선(shiftPerPop).opCost=${shiftPerPop.opCost}, 최종(rebalance).opCost=${final.opCost}`,
  );
}

console.log("\n=== 시나리오 B: 교대 패턴 (pushBack n번 채운 뒤 popFront/popBack 번갈아) ===");
for (const n of [500, 1000, 2000]) {
  const shiftPerPop = new ShiftPerPopDeque<number>();
  const final = new Deque<number>();
  for (let i = 0; i < n; i++) {
    shiftPerPop.pushBack(i);
    final.pushBack(i);
  }
  for (let i = 0; i < n; i++) {
    shiftPerPop.popFront();
    shiftPerPop.popBack();
    final.popFront();
    final.popBack();
  }
  console.log(`n=${n}: 개선(shiftPerPop).opCost=${shiftPerPop.opCost}, 최종(rebalance).opCost=${final.opCost}`);
}

console.log("\n=== 가이드 canonical 트레이스 (steps와 1:1 대조) ===");
{
  const dq = new Deque<number>();
  console.log("초기: isEmpty =", dq.isEmpty()); // true

  dq.pushBack(1);
  console.log("pushBack(1) 후 size =", dq.size(), "peekBack =", dq.peekBack());

  dq.pushBack(2);
  console.log("pushBack(2) 후 size =", dq.size(), "peekBack =", dq.peekBack());

  dq.pushFront(0);
  console.log("pushFront(0) 후 size =", dq.size(), "peekFront =", dq.peekFront());

  const b = dq.popBack();
  console.log("popBack() =", b, "| size =", dq.size(), "| peekBack now =", dq.peekBack());

  const f = dq.popFront();
  console.log("popFront() =", f, "| size =", dq.size(), "| peekFront now =", dq.peekFront());

  assertEq(b, 2, "popBack 반환값");
  assertEq(f, 0, "popFront 반환값");
  assertEq(dq.size(), 1, "최종 size");
  assertEq(dq.peekFront(), 1, "최종 peekFront");
  assertEq(dq.peekBack(), 1, "최종 peekBack");
}

console.log("\n=== 엣지 케이스 ===");
{
  const dq = new Deque<number>();
  assertEq(dq.popFront(), undefined, "빈 덱 popFront");
  assertEq(dq.popBack(), undefined, "빈 덱 popBack");
  assertEq(dq.peekFront(), undefined, "빈 덱 peekFront");
  assertEq(dq.isEmpty(), true, "빈 덱 isEmpty");

  dq.pushBack(42);
  assertEq(dq.popFront(), 42, "원소 1개 popFront");
  assertEq(dq.isEmpty(), true, "pop 후 isEmpty");

  const dq2 = new Deque<number>();
  dq2.pushFront(9);
  assertEq(dq2.peekFront(), 9, "pushFront 직후 peekFront");
  dq2.pushBack(99);
  assertEq(dq2.peekBack(), 99, "pushBack 직후 peekBack");
  console.log("엣지 케이스 전부 통과");
}

console.log("\n=== 재조정(rebalance) 절반-분배 실측 ===");
{
  const dq = new Deque<number>();
  for (let i = 1; i <= 7; i++) dq.pushBack(i); // back=[1..7], front=[]
  console.log("pushBack 1..7 후 size =", dq.size());
  const v1 = dq.popFront(); // front가 비어 있으므로 rebalance 트리거
  console.log("popFront() =", v1, "(재조정 직후 첫 반환값)");
  assertEq(v1, 1, "재조정 후 popFront는 논리적으로 가장 오래된 1을 반환해야 함");
}

console.log("\n=== 정확성 랜덤 교차검증 (Deque vs ReferenceDeque) ===");
{
  let seed = 42;
  function rnd(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  const trials = 5;
  for (let t = 0; t < trials; t++) {
    const dq = new Deque<number>();
    const ref = new ReferenceDeque<number>();
    const ops = 3000;
    for (let i = 0; i < ops; i++) {
      const choice = Math.floor(rnd() * 6);
      const val = Math.floor(rnd() * 1000);
      switch (choice) {
        case 0:
          dq.pushFront(val);
          ref.pushFront(val);
          break;
        case 1:
          dq.pushBack(val);
          ref.pushBack(val);
          break;
        case 2: {
          const a = dq.popFront();
          const b = ref.popFront();
          assertEq(a, b, `trial${t} op${i} popFront`);
          break;
        }
        case 3: {
          const a = dq.popBack();
          const b = ref.popBack();
          assertEq(a, b, `trial${t} op${i} popBack`);
          break;
        }
        case 4:
          assertEq(dq.peekFront(), ref.peekFront(), `trial${t} op${i} peekFront`);
          break;
        case 5:
          assertEq(dq.peekBack(), ref.peekBack(), `trial${t} op${i} peekBack`);
          break;
      }
      assertEq(dq.size(), ref.size(), `trial${t} op${i} size`);
      assertEq(dq.isEmpty(), ref.isEmpty(), `trial${t} op${i} isEmpty`);
    }
  }
  console.log(`랜덤 교차검증 ${trials}회 * 3000연산 전부 통과`);
}

console.log("\n모든 검증 통과.");
