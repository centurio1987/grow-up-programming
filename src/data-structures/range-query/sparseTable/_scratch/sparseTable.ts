// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 옮겨 실행한다.
// (sibling sparseTable.ts는 스텁이며 oracle이 아니다. 이 스크래치가 가이드 자신의 코드다.)

class SparseTable {
  private n: number;
  private log: number[];
  private table: number[][];
  private merge: (a: number, b: number) => number;

  constructor(arr: number[], merge: (a: number, b: number) => number) {
    const n = arr.length;
    this.n = n;
    this.merge = merge;

    // log[i] = floor(log2(i)), 질의마다 다시 계산하지 않도록 미리 채운다.
    this.log = new Array(n + 1).fill(0);
    for (let i = 2; i <= n; i++) {
      this.log[i] = this.log[Math.floor(i / 2)]! + 1;
    }

    const LOG = this.log[n]! + 1;
    this.table = Array.from({ length: LOG }, () => new Array(n).fill(0));
    this.table[0] = arr.slice();

    for (let k = 1; k < LOG; k++) {
      for (let i = 0; i + (1 << k) <= n; i++) {
        this.table[k]![i] = merge(this.table[k - 1]![i]!, this.table[k - 1]![i + (1 << (k - 1))]!);
      }
    }
  }

  query(l: number, r: number): number {
    const len = r - l + 1;
    const k = this.log[len]!;
    const left = this.table[k]![l]!;
    const right = this.table[k]![r - (1 << k) + 1]!;
    return this.merge(left, right);
  }
}

function naiveQuery(arr: number[], l: number, r: number, merge: (a: number, b: number) => number): number {
  let acc = arr[l]!;
  for (let i = l + 1; i <= r; i++) acc = merge(acc, arr[i]!);
  return acc;
}

// --- 1) 가이드 본문에 실을 트레이스: [8, 6, 7, 3, 5], min ---
console.log("=== trace: [8, 6, 7, 3, 5], merge=min ===");
const arr1 = [8, 6, 7, 3, 5];
const st1 = new SparseTable(arr1, Math.min);
console.log("table[0] =", st1["table"][0]);
console.log("table[1] =", st1["table"][1]);
console.log("table[2] =", st1["table"][2]);
console.log("log[1..5] =", st1["log"].slice(1, 6));

const queries1: [number, number][] = [
  [1, 4],
  [0, 4],
  [0, 2],
  [2, 3],
  [3, 4],
  [0, 0],
  [4, 4],
];
for (const [l, r] of queries1) {
  const got = st1.query(l, r);
  const want = naiveQuery(arr1, l, r, Math.min);
  console.log(`query(${l},${r}) = ${got}  (naive=${want})  ${got === want ? "OK" : "MISMATCH"}`);
}

// --- 2) gcd 예시 ---
console.log("\n=== trace: [12, 8, 6, 4], merge=gcd ===");
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const arr2 = [12, 8, 6, 4];
const st2 = new SparseTable(arr2, gcd);
for (const [l, r] of [
  [0, 3],
  [0, 1],
  [2, 3],
] as [number, number][]) {
  const got = st2.query(l, r);
  const want = naiveQuery(arr2, l, r, gcd);
  console.log(`query(${l},${r}) = ${got}  (naive=${want})  ${got === want ? "OK" : "MISMATCH"}`);
}

// --- 3) 무작위 교차검증 (min/max) ---
console.log("\n=== random cross-check ===");
let mismatches = 0;
for (let trial = 0; trial < 200; trial++) {
  const n = 1 + Math.floor(Math.random() * 40);
  const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 1000) - 500);
  const opName = trial % 2 === 0 ? "min" : "max";
  const op = opName === "min" ? Math.min : Math.max;
  const st = new SparseTable(arr, op);
  for (let q = 0; q < 20; q++) {
    const l = Math.floor(Math.random() * n);
    const r = l + Math.floor(Math.random() * (n - l));
    const got = st.query(l, r);
    const want = naiveQuery(arr, l, r, op);
    if (got !== want) {
      mismatches++;
      console.log(`MISMATCH n=${n} op=${opName} l=${l} r=${r} got=${got} want=${want} arr=${JSON.stringify(arr)}`);
    }
  }
}
console.log(`random trials done. mismatches = ${mismatches}`);

// --- 4) 왜 sum엔 못 쓰는지 실측으로 보이기 ---
console.log("\n=== sum은 왜 안 되는가: 겹치는 구간에서 이중 계산 ===");
const arrSum = [1, 2, 3, 4, 5];
const sum = (a: number, b: number) => a + b;
const stSum = new SparseTable(arrSum, sum);
// query(0, 4): len=5, k=floor(log2 5)=2, 왼쪽 [0,3] 오른쪽 [1,4] — 인덱스 1,2,3이 겹친다.
const gotSum = stSum.query(0, 4);
const trueSum = arrSum.reduce((a, b) => a + b, 0);
console.log(`sparseTable.query(0,4) with sum = ${gotSum}  (실제 합 = ${trueSum})  ${gotSum === trueSum ? "OK(우연히 맞음)" : "틀림 — 겹친 원소 이중 합산"}`);
