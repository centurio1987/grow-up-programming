import { AVLTree } from "./avlTree";

function dumpTree(tree: AVLTree<number>) {
  return JSON.stringify((tree as any).__dump());
}

console.log("=== 오름차순 1..7 ===");
{
  const t = new AVLTree<number>();
  for (const v of [1,2,3,4,5,6,7]) {
    t.insert(v);
    console.log(`insert(${v}) -> ${dumpTree(t)} height=${t.height()}`);
  }
  console.log("inOrder:", JSON.stringify(t.inOrder()));
}

console.log("\n=== 10,20,5,1,15 (회전 없는 케이스 확인) ===");
{
  const t = new AVLTree<number>();
  for (const v of [10,20,5,1,15]) {
    t.insert(v);
    console.log(`insert(${v}) -> ${dumpTree(t)} height=${t.height()}`);
  }
}

console.log("\n=== 점검문제용: 5,3,7,1,4,6,8 삽입 후 delete(5) ===");
{
  const t = new AVLTree<number>();
  for (const v of [5,3,7,1,4,6,8]) t.insert(v);
  console.log("삽입 후:", dumpTree(t), "height=", t.height());
  console.log("inOrder:", JSON.stringify(t.inOrder()));
  console.log("height():", t.height());
  console.log("min:", t.min(), "max:", t.max());
  const ok = t.delete(5);
  console.log("delete(5) ->", ok, dumpTree(t));
  console.log("inOrder after delete(5):", JSON.stringify(t.inOrder()));
  console.log("has(5):", t.has(5));
}
