// E3 자기검증용 스크래치 — bitArray-guide.new.mdx의 "아이디어를 코드로 옮기기" 절과
// 동일한 코드를 그대로 옮겨 실행 결과를 실측한다.

class BitArray {
  private words: Uint32Array;
  private _size: number;

  constructor(size: number) {
    if (size < 1) throw new RangeError("size must be >= 1");
    this._size = size;
    this.words = new Uint32Array(Math.ceil(size / 32));
  }

  private addr(index: number): [number, number] {
    return [index >>> 5, 1 << (index & 31)];
  }

  set(index: number): void {
    if (index < 0 || index >= this._size) return;
    const [w, mask] = this.addr(index);
    this.words[w] = (this.words[w] ?? 0) | mask;
  }

  clear(index: number): void {
    if (index < 0 || index >= this._size) return;
    const [w, mask] = this.addr(index);
    this.words[w] = (this.words[w] ?? 0) & ~mask;
  }

  get(index: number): boolean {
    if (index < 0 || index >= this._size) return false;
    const [w, mask] = this.addr(index);
    return ((this.words[w] ?? 0) & mask) !== 0;
  }

  toggle(index: number): void {
    if (index < 0 || index >= this._size) return;
    const [w, mask] = this.addr(index);
    this.words[w] = (this.words[w] ?? 0) ^ mask;
  }

  count(): number {
    let total = 0;
    for (let n of this.words) {
      n = n - ((n >>> 1) & 0x55555555);
      n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
      n = (n + (n >>> 4)) & 0x0f0f0f0f;
      total += (n * 0x01010101) >>> 24;
    }
    return total;
  }

  size(): number {
    return this._size;
  }
}

// ---- 코드 진화 사다리 3단계 (count 전용, 독립 함수로 검증) ----

function countBitsNaive(words: Uint32Array): number {
  let total = 0;
  for (const word of words) {
    let n = word;
    while (n !== 0) {
      total += n & 1;
      n >>>= 1;
    }
  }
  return total;
}

function countBitsKernighan(words: Uint32Array): number {
  let total = 0;
  for (const word of words) {
    let n = word;
    while (n !== 0) {
      n &= n - 1;
      total++;
    }
  }
  return total;
}

function countBitsSwar(words: Uint32Array): number {
  let total = 0;
  for (let n of words) {
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    n = (n + (n >>> 4)) & 0x0f0f0f0f;
    total += (n * 0x01010101) >>> 24;
  }
  return total;
}

function assertEq(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "OK  " : "FAIL"} ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
  if (!ok) process.exitCode = 1;
}

console.log("=== 시뮬레이션 프레임 재현 (steps와 1:1 대조) ===");
{
  const ba = new BitArray(8);
  assertEq("초기 words[0]", ba["words"][0], 0);
  ba.set(0);
  assertEq("set(0) 후 words[0]", ba["words"][0], 0b00000001);
  ba.set(3);
  assertEq("set(3) 후 words[0]", ba["words"][0], 0b00001001);
  ba.toggle(0);
  assertEq("toggle(0) 후 words[0]", ba["words"][0], 0b00001000);
  ba.set(7);
  assertEq("set(7) 후 words[0]", ba["words"][0], 0b10001000);
  assertEq("count()", ba.count(), 2);
}

console.log("\n=== 대표 사례: BitArray(100) ===");
{
  const ba = new BitArray(100);
  assertEq("words.length", ba["words"].length, 4);
  ba.set(0);
  ba.set(31);
  ba.set(32);
  ba.set(99);
  assertEq("get(0)", ba.get(0), true);
  assertEq("get(1)", ba.get(1), false);
  assertEq("get(31)", ba.get(31), true);
  assertEq("get(32)", ba.get(32), true);
  assertEq("get(99)", ba.get(99), true);
  assertEq("count() after 4 sets", ba.count(), 4);
  ba.toggle(0);
  assertEq("count() after toggle(0)", ba.count(), 3);
  ba.clear(31);
  assertEq("count() after clear(31)", ba.count(), 2);
  assertEq("size()", ba.size(), 100);
}

console.log("\n=== 엣지 케이스 ===");
{
  // size=1
  const ba1 = new BitArray(1);
  assertEq("size=1 초기 get(0)", ba1.get(0), false);
  ba1.set(0);
  assertEq("size=1 set(0) 후 get(0)", ba1.get(0), true);
  assertEq("size=1 count()", ba1.count(), 1);

  // size가 정확히 32의 배수 (패딩 없음)
  const ba32 = new BitArray(32);
  assertEq("size=32 words.length", ba32["words"].length, 1);
  for (let i = 0; i < 32; i++) ba32.set(i);
  assertEq("size=32 전부 set 후 count()", ba32.count(), 32);

  // 범위 밖 index
  const baR = new BitArray(8);
  baR.set(8); // 범위 밖 → no-op이어야 함
  assertEq("범위 밖 set(8) 후 count()", baR.count(), 0);
  baR.set(-1); // 범위 밖 → no-op
  assertEq("범위 밖 set(-1) 후 count()", baR.count(), 0);
  assertEq("범위 밖 get(8)", baR.get(8), false);
  assertEq("범위 밖 get(-1)", baR.get(-1), false);

  // constructor guard
  let threw = false;
  try {
    new BitArray(0);
  } catch (e) {
    threw = e instanceof RangeError;
  }
  assertEq("size<1 RangeError", threw, true);
}

console.log("\n=== 무작위 교차검증 (BitArray vs Array<boolean> 오라클, 500회) ===");
{
  let mismatches = 0;
  for (let trial = 0; trial < 500; trial++) {
    const size = 1 + Math.floor(Math.random() * 200);
    const ba = new BitArray(size);
    const oracle = new Array<boolean>(size).fill(false);
    const ops = 50;
    for (let i = 0; i < ops; i++) {
      const idx = Math.floor(Math.random() * (size + 4)) - 2; // 범위 밖도 섞는다
      const op = Math.floor(Math.random() * 4);
      if (op === 0) {
        ba.set(idx);
        if (idx >= 0 && idx < size) oracle[idx] = true;
      } else if (op === 1) {
        ba.clear(idx);
        if (idx >= 0 && idx < size) oracle[idx] = false;
      } else if (op === 2) {
        ba.toggle(idx);
        if (idx >= 0 && idx < size) oracle[idx] = !oracle[idx];
      } else {
        const expected = idx >= 0 && idx < size ? oracle[idx] : false;
        if (ba.get(idx) !== expected) {
          mismatches++;
          console.log(`FAIL get mismatch size=${size} idx=${idx}`);
        }
      }
    }
    const expectedCount = oracle.filter(Boolean).length;
    if (ba.count() !== expectedCount) {
      mismatches++;
      console.log(`FAIL count mismatch size=${size} actual=${ba.count()} expected=${expectedCount}`);
    }
    if (ba.size() !== size) {
      mismatches++;
      console.log(`FAIL size mismatch actual=${ba.size()} expected=${size}`);
    }
  }
  assertEq("무작위 교차검증 mismatch 수", mismatches, 0);
}

console.log("\n=== 코드 진화 사다리: 세 popcount 구현이 서로 일치하는가 ===");
{
  for (let trial = 0; trial < 200; trial++) {
    const len = 1 + Math.floor(Math.random() * 5);
    const words = new Uint32Array(len);
    for (let i = 0; i < len; i++) words[i] = Math.floor(Math.random() * 0x100000000);
    const a = countBitsNaive(words);
    const b = countBitsKernighan(words);
    const c = countBitsSwar(words);
    if (a !== b || b !== c) {
      console.log("FAIL popcount 불일치", { words: Array.from(words), a, b, c });
      process.exitCode = 1;
    }
  }
  console.log("OK   naive/kernighan/swar 200회 무작위 일치");
}

console.log("\n=== 코드 진화 사다리: Kernighan이 원형보다 반복 횟수가 적은지(희소 워드) ===");
{
  function countIterNaive(word: number): number {
    let n = word, it = 0;
    while (n !== 0) { it++; n >>>= 1; }
    return it;
  }
  function countIterKernighan(word: number): number {
    let n = word, it = 0;
    while (n !== 0) { it++; n &= n - 1; }
    return it;
  }
  const word = 0b1000; // bit3 하나만 1
  assertEq("word=8, 원형 반복 횟수", countIterNaive(word), 4);
  assertEq("word=8, Kernighan 반복 횟수", countIterKernighan(word), 1);
}

console.log("\n=== D6 트랩 1: 원형 count 루프에서 >> vs >>> (bit31 세팅된 워드) ===");
{
  // words[0] = 2147483648 (= 1 << 31, unsigned) : bit31만 1
  let n = 2147483648;
  const historyWrong: number[] = [];
  for (let i = 0; i < 40; i++) {
    n = n >> 1; // 버그: >>> 이어야 함
    historyWrong.push(n);
  }
  assertEq(">> 버그: 40번 반복 후 n", n, -1);
  assertEq(">> 버그: 마지막 5개 값이 모두 -1(고착)", historyWrong.slice(-5), [-1, -1, -1, -1, -1]);

  let n2 = 2147483648;
  let iters2 = 0;
  while (n2 !== 0 && iters2 < 100) {
    n2 = n2 >>> 1;
    iters2++;
  }
  assertEq(">>> 정상: 도달까지 반복 수", iters2, 32);
  assertEq(">>> 정상: 최종 n2", n2, 0);
}

console.log("\n=== D6 트랩 2: 가드 off-by-one ('>' vs '>=') ===");
{
  const size = 8;
  const words = new Uint32Array(Math.ceil(size / 32));
  const index = 8; // size와 같음 → 유효 범위(0..7) 밖
  // 잘못된 가드: index > size 일 때만 거부 (== 인 8은 통과해버림)
  const buggyGuardRejects = index > size; // false → 거부되지 않음(버그)
  assertEq("버그 가드가 index=8을 거부하는가", buggyGuardRejects, false);
  if (!buggyGuardRejects) {
    const wordIndex = index >>> 5;
    const mask = 1 << (index & 31);
    words[wordIndex] = (words[wordIndex] ?? 0) | mask;
  }
  // 올바른 SWAR count로 패딩 오염 여부 확인
  let total = 0;
  for (let n of words) {
    n = n - ((n >>> 1) & 0x55555555);
    n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
    n = (n + (n >>> 4)) & 0x0f0f0f0f;
    total += (n * 0x01010101) >>> 24;
  }
  assertEq("버그 가드로 인한 오염된 count() (기대: 유효 비트 0개인데 1이 나옴)", total, 1);
}

console.log("\n모든 검증 완료.");
