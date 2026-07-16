function lowestSetBitNaive(x: number): number {
  for (let i = 0; i < 32; i++) {
    if ((x >>> i) & 1) return (1 << i) >>> 0;
  }
  return 0;
}

function lowestSetBit(x: number): number {
  return (x & (-x)) >>> 0;
}

function toBin8(x: number): string {
  return (x & 0xff).toString(2).padStart(8, "0");
}

// E3 trace for x = 12
console.log("=== trace x=12 ===");
console.log("x        ", toBin8(12), 12);
console.log("~x       ", toBin8(~12));
console.log("-x=~x+1  ", toBin8(-12));
console.log("x & -x   ", toBin8(12 & -12), (12 & -12));

const tests: [number, number][] = [
  [12, 4],
  [6, 2],
  [1, 1],
  [16, 16],
  [0, 0],
  [-1, 1],
  [-12, 4],
  [8, 8],
  [-2147483648, -2147483648 >>> 0], // min int
  [2147483647, 1],
];

console.log("=== representative + edge tests ===");
for (const [x, expected] of tests) {
  const got = lowestSetBit(x);
  const gotNaive = x === -2147483648 ? "skip(naive loop uses 1<<i which overflows sign at i=31, check separately)" : lowestSetBitNaive(x);
  console.log(x, "->", got, "expected", expected, got === expected ? "OK" : "MISMATCH", "naive:", gotNaive);
}

// separately verify min int for naive using >>> semantics
console.log("naive minInt:", lowestSetBitNaive(-2147483648), "trick minInt:", lowestSetBit(-2147483648));

// random cross-check between naive and trick over 32-bit signed ints
console.log("=== random cross-check ===");
let mismatches = 0;
for (let t = 0; t < 20000; t++) {
  const x = (Math.floor(Math.random() * 4294967296) - 2147483648) | 0;
  const a = lowestSetBit(x);
  const b = lowestSetBitNaive(x);
  if (a !== b) {
    mismatches++;
    console.log("MISMATCH", x, a, b);
  }
}
console.log("mismatches:", mismatches);

// invariant check: result is power of two or zero
console.log("=== invariant r & (r-1) === 0 ===");
let invariantFail = 0;
for (let t = 0; t < 5000; t++) {
  const x = (Math.floor(Math.random() * 4294967296) - 2147483648) | 0;
  const r = lowestSetBit(x);
  if ((r & (r - 1)) !== 0) invariantFail++;
}
console.log("invariant failures:", invariantFail);
