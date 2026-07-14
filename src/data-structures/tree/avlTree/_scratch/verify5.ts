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
let maxHeightSeen = 0;
let maxSizeAtMaxHeight = 0;
let worstAbsBf = 0;

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
  if (rnd() < 0.7) { t.insert(v); ref.add(v); } else { t.delete(v); ref.delete(v); }
  const inv = checkInvariant(t);
  worstAbsBf = Math.max(worstAbsBf, inv.maxAbsBf);
  if (t.height() > maxHeightSeen) { maxHeightSeen = t.height(); maxSizeAtMaxHeight = t.size(); }
}
console.log(`worst|bf|=${worstAbsBf} maxHeightSeen=${maxHeightSeen} atSize=${maxSizeAtMaxHeight} finalSize=${t.size()}`);
const bound = (n:number)=>1.44*Math.log2(n+2)-0.33;
console.log(`bound at size=${maxSizeAtMaxHeight}:`, bound(maxSizeAtMaxHeight).toFixed(2));
