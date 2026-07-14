import { AVLTree } from "./avlTree-extracted";

function dump(tree: any) {
  const walk = (n: any): any => {
    if (!n) return null;
    const kids = [walk(n.left), walk(n.right)].filter((k) => k !== null);
    const bfv = (n.left ? n.left.height : 0) - (n.right ? n.right.height : 0);
    return { id: n.value, label: `${n.value} (h=${n.height},bf=${bfv})`, ...(kids.length ? { children: kids } : {}) };
  };
  return JSON.stringify(walk(tree.root));
}

const t = new AVLTree<number>();
for (const v of [30, 20, 10, 5, 15, 25, 35, 1]) {
  t.insert(v);
  console.log(`insert(${v}) ->`, dump(t), "h=", t.height());
}
console.log("delete(20) ->", t.delete(20), dump(t), "h=", t.height());
console.log("delete(35) ->", t.delete(35), dump(t), "h=", t.height());

console.log("\n--- 1..7 ascending (self-check Q1) ---");
const t2 = new AVLTree<number>();
for (const v of [1,2,3,4,5,6,7]) t2.insert(v);
console.log(dump(t2));

console.log("\n--- 10,20,5,1,15 no-rotation (self-check Q2) ---");
const t3 = new AVLTree<number>();
for (const v of [10,20,5,1,15]) {
  t3.insert(v);
  console.log(`insert(${v}) ->`, dump(t3));
}
