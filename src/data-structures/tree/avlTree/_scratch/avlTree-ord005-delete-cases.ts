// 삭제 재균형: bf(y)=0 vs bf(y)=+1 의 "회전 후 서브트리 높이" 직접 구성 실측

class Node {
  value: number; left: Node | undefined; right: Node | undefined; height = 1;
  constructor(v: number, l?: Node, r?: Node) { this.value = v; this.left = l; this.right = r; upd(this); }
}
const h = (n: Node | undefined) => n?.height ?? 0;
const bf = (n: Node) => h(n.left) - h(n.right);
function upd(n: Node) { n.height = 1 + Math.max(h(n.left), h(n.right)); }
let rot = 0;
const rotR = (z: Node): Node => { rot++; const y = z.left!; z.left = y.right; y.right = z; upd(z); upd(y); return y; };
const rotL = (z: Node): Node => { rot++; const y = z.right!; z.right = y.left; y.left = z; upd(z); upd(y); return y; };
function reb(n: Node): Node {
  upd(n); const b = bf(n);
  if (b > 1) { if (bf(n.left!) < 0) n.left = rotL(n.left!); return rotR(n); }
  if (b < -1) { if (bf(n.right!) > 0) n.right = rotR(n.right!); return rotL(n); }
  return n;
}
function del(node: Node | undefined, v: number): Node | undefined {
  if (!node) return undefined;
  if (v < node.value) node.left = del(node.left, v);
  else if (v > node.value) node.right = del(node.right, v);
  else {
    if (!node.left) return node.right;
    if (!node.right) return node.left;
    let s = node.right; while (s.left) s = s.left;
    node.value = s.value; node.right = del(node.right, s.value);
  }
  return reb(node);
}
function draw(node: Node | undefined, prefix = "", isLeft = true): string {
  if (!node) return "";
  let out = "";
  if (node.right) out += draw(node.right, prefix + (isLeft ? "│   " : "    "), false);
  out += prefix + (isLeft ? "└── " : "┌── ") + `${node.value}(h=${node.height},bf=${bf(node)})\n`;
  if (node.left) out += draw(node.left, prefix + (isLeft ? "    " : "│   "), true);
  return out;
}
const ok = (n: Node | undefined): boolean => !n || (Math.abs(bf(n)) <= 1 && ok(n.left) && ok(n.right));

console.log("=== 케이스 A: bf(y) = 0 ===");
{
  //        50
  //     30      70
  //   20  40   60
  //  10   35
  const t = new Node(50,
    new Node(30, new Node(20, new Node(10)), new Node(40, new Node(35))),
    new Node(70, new Node(60)));
  console.log("삭제 전 (루트 높이 " + h(t) + ", bf(z)=" + bf(t) + ", bf(y)=" + bf(t.left!) + ", 불변식 " + ok(t) + ")");
  console.log(draw(t));
  rot = 0;
  const after = del(t, 60)!;
  console.log(`delete(60) → 회전 ${rot}회, 서브트리 높이 ${h(after)} (삭제 전 3), 불변식 ${ok(after)}`);
  console.log(draw(after));
}

console.log("=== 케이스 B: bf(y) = +1 ===");
{
  //        50
  //     30      70
  //   20  40   60
  //  10
  const t = new Node(50,
    new Node(30, new Node(20, new Node(10)), new Node(40)),
    new Node(70, new Node(60)));
  console.log("삭제 전 (루트 높이 " + h(t) + ", bf(z)=" + bf(t) + ", bf(y)=" + bf(t.left!) + ", 불변식 " + ok(t) + ")");
  console.log(draw(t));
  rot = 0;
  const after = del(t, 60)!;
  console.log(`delete(60) → 회전 ${rot}회, 서브트리 높이 ${h(after)} (삭제 전 4), 불변식 ${ok(after)}`);
  console.log(draw(after));
}

console.log("=== 케이스 A': bf(y)=0 이고 z 가 더 큰 트리의 일부일 때 — 위로 전파되는가? ===");
{
  // 루트 100 아래 왼쪽에 위 케이스 A 서브트리(높이 3), 오른쪽에 높이 3 서브트리
  const A = () => new Node(50,
    new Node(30, new Node(20, new Node(10)), new Node(40, new Node(35))),
    new Node(70, new Node(60)));
  const right = () => new Node(150, new Node(120, new Node(110)), new Node(170, new Node(160)));
  const t = new Node(100, A(), right());
  console.log("삭제 전 루트 높이 " + h(t));
  rot = 0;
  const after = del(t, 60)!;
  console.log(`delete(60) → 회전 ${rot}회, 루트 높이 ${h(after)}, 불변식 ${ok(after)}`);
}

console.log("=== 케이스 B': bf(y)=+1 이고 z 가 더 큰 트리의 일부일 때 ===");
{
  const B = () => new Node(50,
    new Node(30, new Node(20, new Node(10)), new Node(40)),
    new Node(70, new Node(60)));
  const right = () => new Node(150, new Node(120, new Node(110)), new Node(170, new Node(160)));
  const t = new Node(100, B(), right());
  console.log("삭제 전 루트 높이 " + h(t) + ", 왼쪽 서브트리 높이 " + h(t.left));
  rot = 0;
  const after = del(t, 60)!;
  console.log(`delete(60) → 회전 ${rot}회, 루트 높이 ${h(after)}, 왼쪽 서브트리 높이 ${h(after.left)}, 불변식 ${ok(after)}`);
  console.log(draw(after));
}
