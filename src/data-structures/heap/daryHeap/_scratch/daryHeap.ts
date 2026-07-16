// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출한 사본.
class DaryHeap<T> {
  private data: T[] = [];
  private readonly d: number;
  private readonly compare: (a: T, b: T) => number;

  constructor(d: number, compare: (a: T, b: T) => number) {
    if (d < 2) throw new Error("d는 2 이상이어야 합니다");
    this.d = d;
    this.compare = compare;
  }

  size(): number {
    return this.data.length;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  peek(): T | undefined {
    return this.data.length > 0 ? this.data[0] : undefined;
  }

  push(item: T): void {
    this.data.push(item);
    this.siftUp(this.data.length - 1);
  }

  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const min = this.data[0];
    const last = this.data.pop() as T;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.siftDown(0);
    }
    return min;
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const p = Math.floor((i - 1) / this.d);
      if (this.compare(this.data[i] as T, this.data[p] as T) < 0) {
        [this.data[i], this.data[p]] = [this.data[p] as T, this.data[i] as T];
        i = p;
      } else {
        break;
      }
    }
  }

  private siftDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let best = i;
      const firstChild = this.d * i + 1;
      for (let k = 0; k < this.d; k++) {
        const c = firstChild + k;
        if (c >= n) break;
        if (this.compare(this.data[c] as T, this.data[best] as T) < 0) best = c;
      }
      if (best === i) break;
      [this.data[i], this.data[best]] = [this.data[best] as T, this.data[i] as T];
      i = best;
    }
  }

  /** 검증용: 내부 배열을 그대로 노출 (실전 API에는 없음) */
  __dump(): T[] {
    return [...this.data];
  }
}

function log(label: string, value: unknown) {
  console.log(label, JSON.stringify(value));
}

// ── 1. 가이드 본문 시나리오: d=3, push(10,5,15,3) → pop() ──
{
  const h = new DaryHeap<number>(3, (a, b) => a - b);
  h.push(10);
  log("push(10)", h.__dump());
  h.push(5);
  log("push(5)", h.__dump());
  h.push(15);
  h.push(3);
  log("push(15),push(3)", h.__dump());
  const popped = h.pop();
  log("pop() 반환값", popped);
  log("pop() 후 배열", h.__dump());
}

// ── 2. 엣지: 빈 힙 ──
{
  const h = new DaryHeap<number>(4, (a, b) => a - b);
  log("빈 힙 pop()", h.pop());
  log("빈 힙 peek()", h.peek());
  log("빈 힙 isEmpty()", h.isEmpty());
  log("빈 힙 size()", h.size());
}

// ── 3. 엣지: 원소 1개 ──
{
  const h = new DaryHeap<number>(4, (a, b) => a - b);
  h.push(42);
  log("size==1 peek", h.peek());
  log("size==1 pop", h.pop());
  log("pop 후 size", h.size());
  log("pop 후 isEmpty", h.isEmpty());
}

// ── 4. d=2 (이진 힙과 동일해야 함) vs d=8 비교, 같은 입력 오름차순 pop 검증 ──
for (const d of [2, 4, 8]) {
  const h = new DaryHeap<number>(d, (a, b) => a - b);
  const input = [10, 5, 15, 3, 8, 1, 20, 7];
  for (const v of input) h.push(v);
  const out: number[] = [];
  while (!h.isEmpty()) out.push(h.pop() as number);
  log(`d=${d} 정렬 출력`, out);
}

// ── 5. 최대 힙 (비교자 역전) ──
{
  const h = new DaryHeap<number>(2, (a, b) => b - a);
  h.push(1);
  h.push(9);
  h.push(5);
  log("최대힙 pop 순서", [h.pop(), h.pop(), h.pop()]);
}

// ── 6. 중복값 ──
{
  const h = new DaryHeap<number>(3, (a, b) => a - b);
  for (const v of [5, 5, 5, 1, 1]) h.push(v);
  const out: number[] = [];
  while (!h.isEmpty()) out.push(h.pop() as number);
  log("중복값 pop 순서", out);
}

// ── 7-1. D6 함정 검증: parent 공식에서 "-1"을 빠뜨린 버그 버전 ──
class BuggyDaryHeap<T> {
  private data: T[] = [];
  constructor(
    private readonly d: number,
    private readonly compare: (a: T, b: T) => number,
  ) {}
  push(item: T): void {
    this.data.push(item);
    let i = this.data.length - 1;
    while (i > 0) {
      const p = Math.floor(i / this.d); // 버그: floor((i-1)/d)여야 함
      if (this.compare(this.data[i] as T, this.data[p] as T) < 0) {
        [this.data[i], this.data[p]] = [this.data[p] as T, this.data[i] as T];
        i = p;
      } else break;
    }
  }
  __dump(): T[] {
    return [...this.data];
  }
}
{
  const buggy = new BuggyDaryHeap<number>(3, (a, b) => a - b);
  const correct = new DaryHeap<number>(3, (a, b) => a - b);
  const seq = [10, 5, 15, 3, 8, 1];
  for (const v of seq) {
    buggy.push(v);
    correct.push(v);
  }
  log("D6 함정: 버그 버전 최종 배열", buggy.__dump());
  log("D6 함정: 정상 버전 최종 배열", correct.__dump());

  // 버그 버전 배열이 진짜 힙 불변식을 만족하는지 "정상 parent 공식"으로 검사
  function isValidHeap(arr: number[], d: number): boolean {
    for (let i = 1; i < arr.length; i++) {
      const p = Math.floor((i - 1) / d);
      if ((arr[p] as number) > (arr[i] as number)) return false;
    }
    return true;
  }
  function firstViolation(arr: number[], d: number): void {
    for (let i = 1; i < arr.length; i++) {
      const p = Math.floor((i - 1) / d);
      if ((arr[p] as number) > (arr[i] as number)) {
        log("최초 위반 지점", { i, parent: p, "arr[parent]": arr[p], "arr[i]": arr[i] });
        return;
      }
    }
  }
  log("버그 버전 배열이 유효한 힙인가?", isValidHeap(buggy.__dump(), 3));

  // 더 큰 무작위 입력으로 버그 버전이 정렬 순서를 깨뜨리는지 탐색
  function mulberry32b(seed: number) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rngB = mulberry32b(777);
  let foundBreak = false;
  for (let trial = 0; trial < 30 && !foundBreak; trial++) {
    const n = 10 + Math.floor(rngB() * 20);
    const vals: number[] = [];
    for (let i = 0; i < n; i++) vals.push(Math.floor(rngB() * 100));
    const b = new BuggyDaryHeap<number>(3, (a, c) => a - c);
    for (const v of vals) b.push(v);
    if (!isValidHeap(b.__dump(), 3)) {
      foundBreak = true;
      log("버그 버전이 힙 불변식을 깬 최초 사례 (입력)", vals);
      log("버그 버전이 힙 불변식을 깬 최초 사례 (배열)", b.__dump());
      firstViolation(b.__dump(), 3);
    }
  }
  log("30회 중 불변식 깨짐 발견?", foundBreak);

  // 사람이 손으로 따라갈 수 있는 최소 반례 (브루트포스로 탐색해 확정)
  const seqSmall = [1, 4, 2, 5, 6, 7, 3];
  const bSmall = new BuggyDaryHeap<number>(3, (a, c) => a - c);
  const cSmall = new DaryHeap<number>(3, (a, c) => a - c);
  for (const v of seqSmall) {
    bSmall.push(v);
    cSmall.push(v);
  }
  log("최소 반례: 버그 버전 최종 배열", bSmall.__dump());
  log("최소 반례: 버그 버전 불변식 검사", isValidHeap(bSmall.__dump(), 3));
  log("최소 반례: 정상 버전 최종 배열", cSmall.__dump());
  log("최소 반례: 정상 버전 불변식 검사", isValidHeap(cSmall.__dump(), 3));
}

// ── 7. 무작위 교차검증: DaryHeap push/pop 결과가 정렬 결과와 일치하는지 ──
{
  function mulberry32(seed: number) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(12345);
  let allOk = true;
  for (const d of [2, 3, 4, 5, 8]) {
    for (let trial = 0; trial < 20; trial++) {
      const n = Math.floor(rng() * 50) + 1;
      const vals: number[] = [];
      for (let i = 0; i < n; i++) vals.push(Math.floor(rng() * 200) - 100);
      const h = new DaryHeap<number>(d, (a, b) => a - b);
      for (const v of vals) h.push(v);
      const out: number[] = [];
      while (!h.isEmpty()) out.push(h.pop() as number);
      const expected = [...vals].sort((a, b) => a - b);
      const ok = JSON.stringify(out) === JSON.stringify(expected);
      if (!ok) {
        allOk = false;
        console.log(`FAIL d=${d} trial=${trial}`, { vals, out, expected });
      }
    }
  }
  log("무작위 교차검증 (5×20=100 trial) 전부 통과?", allOk);
}
