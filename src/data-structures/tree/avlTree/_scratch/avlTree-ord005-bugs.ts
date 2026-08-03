// 구현 함정의 "구체적 잘못된 값" 실측 (D6)

class Node {
  value: number;
  left: Node | undefined = undefined;
  right: Node | undefined = undefined;
  height = 1;
  constructor(v: number) { this.value = v; }
}
const h = (n: Node | undefined) => n?.height ?? 0;
const bf = (n: Node) => h(n.left) - h(n.right);
const upd = (n: Node) => { n.height = 1 + Math.max(h(n.left), h(n.right)); };

type Mode = "ok" | "swapUpdateOrder" | "noInnerCheck" | "noSuccessorDelete";

function make(mode: Mode) {
  function rotR(z: Node): Node {
    const y = z.left!;
    z.left = y.right; y.right = z;
    if (mode === "swapUpdateOrder") { upd(y); upd(z); } else { upd(z); upd(y); }
    return y;
  }
  function rotL(z: Node): Node {
    const y = z.right!;
    z.right = y.left; y.left = z;
    if (mode === "swapUpdateOrder") { upd(y); upd(z); } else { upd(z); upd(y); }
    return y;
  }
  function reb(n: Node): Node {
    upd(n);
    const b = bf(n);
    if (b > 1) {
      if (mode !== "noInnerCheck" && bf(n.left!) < 0) n.left = rotL(n.left!);
      return rotR(n);
    }
    if (b < -1) {
      if (mode !== "noInnerCheck" && bf(n.right!) > 0) n.right = rotR(n.right!);
      return rotL(n);
    }
    return n;
  }
  function ins(node: Node | undefined, v: number): Node {
    if (!node) return new Node(v);
    if (v < node.value) node.left = ins(node.left, v);
    else node.right = ins(node.right, v);
    return reb(node);
  }
  function del(node: Node | undefined, v: number): Node | undefined {
    if (!node) return undefined;
    if (v < node.value) node.left = del(node.left, v);
    else if (v > node.value) node.right = del(node.right, v);
    else {
      if (!node.left) return node.right;
      if (!node.right) return node.left;
      let s = node.right; while (s.left) s = s.left;
      node.value = s.value;
      if (mode !== "noSuccessorDelete") node.right = del(node.right, s.value);
    }
    return reb(node);
  }
  return { ins, del };
}

function draw(node: Node | undefined, prefix = "", isLeft = true): string {
  if (!node) return "";
  let out = "";
  if (node.right) out += draw(node.right, prefix + (isLeft ? "│   " : "    "), false);
  out += prefix + (isLeft ? "└── " : "┌── ") + `${node.value}(h=${node.height},bf=${bf(node)})\n`;
  if (node.left) out += draw(node.left, prefix + (isLeft ? "    " : "│   "), true);
  return out;
}
function realHeight(n: Node | undefined): number { return n ? 1 + Math.max(realHeight(n.left), realHeight(n.right)) : 0; }
function inOrder(n: Node | undefined, acc: number[] = []): number[] { if (!n) return acc; inOrder(n.left, acc); acc.push(n.value); inOrder(n.right, acc); return acc; }
function worstBf(n: Node | undefined): number { if (!n) return 0; return Math.max(Math.abs(bf(n)), worstBf(n.left), worstBf(n.right)); }

console.log("=== A. updateHeight 순서를 바꾸면 (rotateRight에서 y 먼저) ===");
{
  const { ins } = make("swapUpdateOrder");
  let root: Node | undefined;
  for (const v of [30, 20, 10]) root = ins(root, v);
  console.log("30,20,10 삽입 후 (height 필드):");
  console.log(draw(root));
  console.log("루트 height 필드 =", root!.height, ", 실제 높이 =", realHeight(root));
  // 이어서 더 삽입하면?
  for (const v of [5, 3]) root = ins(root, v);
  console.log("이어서 5,3 삽입 후:");
  console.log(draw(root));
  console.log("실제 높이", realHeight(root), "최대 |bf|(필드 기준)", worstBf(root), "inOrder", inOrder(root));
  // 정상 버전과 대조
  const ok = make("ok");
  let r2: Node | undefined;
  for (const v of [30, 20, 10, 5, 3]) r2 = ok.ins(r2, v);
  console.log("정상 버전:");
  console.log(draw(r2));
  console.log("실제 높이", realHeight(r2));
}

console.log("=== B. 안쪽 부호 검사(bf(node.left) < 0)를 빼면 ===");
{
  const { ins } = make("noInnerCheck");
  let root: Node | undefined;
  for (const v of [30, 10, 20]) root = ins(root, v);
  console.log("30,10,20 삽입 후:");
  console.log(draw(root));
  console.log("루트 bf =", bf(root!), "→ 불변식 위반:", Math.abs(bf(root!)) > 1);
  // 정상 대조
  const ok = make("ok");
  let r2: Node | undefined;
  for (const v of [30, 10, 20]) r2 = ok.ins(r2, v);
  console.log("정상 버전:"); console.log(draw(r2));
  // 계속 삽입하면 높이가 어떻게 벌어지는지
  let bug: Node | undefined; let good: Node | undefined;
  const bugIns = make("noInnerCheck").ins; const goodIns = make("ok").ins;
  const seq = [50, 25, 75, 10, 30, 60, 80, 5, 15, 27, 35];
  for (const v of seq) { bug = bugIns(bug, v); good = goodIns(good, v); }
  console.log("같은 입력", seq.join(","), "→ 버그 높이", realHeight(bug), "정상 높이", realHeight(good), "버그 최대|bf|", worstBf(bug));
  console.log("버그 트리:"); console.log(draw(bug));
}

console.log("=== C. 후계자를 실제로 지우지 않으면 ===");
{
  const { ins, del } = make("noSuccessorDelete");
  let root: Node | undefined;
  for (const v of [5, 3, 7, 1, 4, 6, 8]) root = ins(root, v);
  root = del(root, 5);
  console.log("delete(5) 후 inOrder:", inOrder(root));
  console.log(draw(root));
  const ok = make("ok");
  let r2: Node | undefined;
  for (const v of [5, 3, 7, 1, 4, 6, 8]) r2 = ok.ins(r2, v);
  r2 = ok.del(r2, 5);
  console.log("정상 delete(5) 후 inOrder:", inOrder(r2));
}

console.log("=== D. 재귀 반환값을 다시 대입하지 않으면 (node.left = ... 없이) ===");
{
  // 회전으로 서브트리 루트가 바뀌었는데 부모가 옛 루트를 계속 가리키는 상황을 재현
  function insNoReassign(node: Node | undefined, v: number): Node {
    if (!node) return new Node(v);
    if (v < node.value) {
      const res = insNoReassign(node.left, v);
      if (node.left === undefined) node.left = res; // 새 노드만 연결, 회전 결과는 무시
    } else {
      const res = insNoReassign(node.right, v);
      if (node.right === undefined) node.right = res;
    }
    upd(node);
    const b = bf(node);
    if (b > 1) { const y = node.left!; node.left = y.right; y.right = node; upd(node); upd(y); return y; }
    if (b < -1) { const y = node.right!; node.right = y.left; y.left = node; upd(node); upd(y); return y; }
    return node;
  }
  let root: Node | undefined;
  for (const v of [10, 20, 30, 40, 50]) root = insNoReassign(root, v);
  console.log("10,20,30,40,50 삽입 (반환값 미대입):");
  console.log(draw(root));
  console.log("inOrder:", inOrder(root), "실제 높이:", realHeight(root));
}
