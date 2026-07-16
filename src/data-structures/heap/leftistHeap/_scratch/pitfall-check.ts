// D6 함정 포인팅용 — 복원 스왑을 빼먹으면 어떤 값이 나오는지 실측

class N<T> {
  item: T; rank = 1; left: N<T> | null = null; right: N<T> | null = null;
  constructor(item: T) { this.item = item; }
}
function rank<T>(n: N<T> | null) { return n === null ? 0 : n.rank; }

// 버그 버전: 좌향 속성 복원 스왑을 빼먹음
function buggyMerge<T>(a: N<T> | null, b: N<T> | null, cmp: (x: T, y: T) => number): N<T> | null {
  if (a === null) return b;
  if (b === null) return a;
  if (cmp(a.item, b.item) > 0) [a, b] = [b, a];
  a.right = buggyMerge(a.right, b, cmp);
  // (의도적으로 스왑 생략)
  a.rank = rank(a.right) + 1;
  return a;
}

function rightSpineLength<T>(n: N<T> | null): number {
  let len = 0;
  while (n !== null) { len++; n = n.right; }
  return len;
}

const cmp = (a: number, b: number) => a - b;
let root: N<number> | null = null;
for (let i = 1; i <= 8; i++) {
  const node = new N(i);
  root = buggyMerge(root, node, cmp);
}
console.log("버그 버전 - 오름차순 1..8 삽입 후 오른쪽 경로 길이:", rightSpineLength(root), "(전체 노드 8개, 정상이면 O(log 8)=3 이하여야 함)");

// 올바른 버전으로 같은 입력 비교
function correctMerge<T>(a: N<T> | null, b: N<T> | null, cmp: (x: T, y: T) => number): N<T> | null {
  if (a === null) return b;
  if (b === null) return a;
  if (cmp(a.item, b.item) > 0) [a, b] = [b, a];
  a.right = correctMerge(a.right, b, cmp);
  const lr = rank(a.left), rr = rank(a.right);
  if (lr < rr) [a.left, a.right] = [a.right, a.left];
  a.rank = Math.min(lr, rr) + 1;
  return a;
}
let root2: N<number> | null = null;
for (let i = 1; i <= 8; i++) {
  const node = new N(i);
  root2 = correctMerge(root2, node, cmp);
}
console.log("정상 버전 - 오름차순 1..8 삽입 후 오른쪽 경로 길이:", rightSpineLength(root2), "(rank 상한 floor(log2(9))=3)");
