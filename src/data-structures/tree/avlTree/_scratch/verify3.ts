import { AVLTree } from "./avlTree-extracted";

let seed = 42;
function rnd() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  seed |= 0;
  return (seed >>> 0) / 4294967296;
}

const t = new AVLTree<number>();
const ref = new Set<number>();
const N = 2000;

// re-derive bf/height check via inOrder + manual walk using any-cast internal (not exported) -
// instead just verify size/order correctness + no crash. For bf invariant, re-implement a checker
// using the tree's public API only (has/min/max/inOrder) plus a small reflection walk.
function checkInvariant(tree: any): { ok: boolean; maxAbsBf: number } {
  let maxAbsBf = 0;
  let ok = true;
  const heightOf = (n: any): number => (n ? n.height : 0);
  const walk = (n: any) => {
    if (!n) return;
    const bfv = heightOf(n.left) - heightOf(n.right);
    maxAbsBf = Math.max(maxAbsBf, Math.abs(bfv));
    if (Math.abs(bfv) > 1) ok = false;
    walk(n.left);
    walk(n.right);
  };
  walk(tree.root);
  return { ok, maxAbsBf };
}

for (let i = 0; i < N; i++) {
  const v = Math.floor(rnd() * 500);
  if (rnd() < 0.7) {
    t.insert(v);
    ref.add(v);
  } else {
    t.delete(v);
    ref.delete(v);
  }
  const inv = checkInvariant(t);
  if (!inv.ok) {
    console.log(`FAIL invariant at i=${i}`);
    process.exit(1);
  }
  const sorted = t.inOrder();
  const expected = Array.from(ref).sort((a, b) => a - b);
  if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
    console.log(`FAIL order at i=${i}`);
    process.exit(1);
  }
  if (t.size() !== ref.size) {
    console.log(`FAIL size at i=${i}`);
    process.exit(1);
  }
}
console.log(`OK: extracted guide code passes N=${N} stress test. final size=${t.size()}, height=${t.height()}`);

// also re-check the four rotation demos + delete demo from the guide text produce exactly
// the labels claimed.
function dump(tree: any) {
  const walk = (n: any): any => {
    if (!n) return null;
    const kids = [walk(n.left), walk(n.right)].filter((k) => k !== null);
    const bfv = (n.left ? n.left.height : 0) - (n.right ? n.right.height : 0);
    return { id: n.value, label: `${n.value} (h=${n.height},bf=${bfv})`, ...(kids.length ? { children: kids } : {}) };
  };
  return JSON.stringify(walk(tree.root));
}

for (const [name, seq] of [
  ["LL", [30, 20, 10]],
  ["RR", [10, 20, 30]],
  ["LR", [30, 10, 20]],
  ["RL", [10, 30, 20]],
] as const) {
  const tt = new AVLTree<number>();
  for (const v of seq) tt.insert(v);
  console.log(name, dump(tt));
}
