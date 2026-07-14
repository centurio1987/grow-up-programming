import { AVLTree } from "./avlTree";

function line(s: string) {
  console.log(s);
}

function dumpTree(tree: AVLTree<number>) {
  return JSON.stringify((tree as any).__dump());
}

// ── 1. LL: 30, 20, 10 ──────────────────────────────────────────
{
  const t = new AVLTree<number>();
  line("=== LL: insert(30), insert(20), insert(10) ===");
  t.insert(30);
  line(`30 삽입 후: ${dumpTree(t)} height=${t.height()}`);
  t.insert(20);
  line(`20 삽입 후: ${dumpTree(t)} height=${t.height()}`);
  t.insert(10);
  line(`10 삽입 후(회전 결과): ${dumpTree(t)} height=${t.height()}`);
  line(`inOrder: ${JSON.stringify(t.inOrder())}`);
  line(`invariant: ${JSON.stringify(t.__checkInvariant())}`);
}

// ── 2. RR: 10, 20, 30 ──────────────────────────────────────────
{
  const t = new AVLTree<number>();
  line("\n=== RR: insert(10), insert(20), insert(30) ===");
  t.insert(10);
  t.insert(20);
  line(`20 삽입 후: ${dumpTree(t)} height=${t.height()}`);
  t.insert(30);
  line(`30 삽입 후(회전 결과): ${dumpTree(t)} height=${t.height()}`);
  line(`inOrder: ${JSON.stringify(t.inOrder())}`);
  line(`invariant: ${JSON.stringify(t.__checkInvariant())}`);
}

// ── 3. LR: 30, 10, 20 ──────────────────────────────────────────
{
  const t = new AVLTree<number>();
  line("\n=== LR: insert(30), insert(10), insert(20) ===");
  t.insert(30);
  t.insert(10);
  line(`10 삽입 후: ${dumpTree(t)} height=${t.height()}`);
  t.insert(20);
  line(`20 삽입 후(이중회전 결과): ${dumpTree(t)} height=${t.height()}`);
  line(`inOrder: ${JSON.stringify(t.inOrder())}`);
  line(`invariant: ${JSON.stringify(t.__checkInvariant())}`);
}

// ── 4. RL: 10, 30, 20 ──────────────────────────────────────────
{
  const t = new AVLTree<number>();
  line("\n=== RL: insert(10), insert(30), insert(20) ===");
  t.insert(10);
  t.insert(30);
  line(`30 삽입 후: ${dumpTree(t)} height=${t.height()}`);
  t.insert(20);
  line(`20 삽입 후(이중회전 결과): ${dumpTree(t)} height=${t.height()}`);
  line(`inOrder: ${JSON.stringify(t.inOrder())}`);
  line(`invariant: ${JSON.stringify(t.__checkInvariant())}`);
}

// ── 5. 확장 시퀀스 (실행 시각화용): 30,20,10,5,15,25,35,1 ──────
{
  const t = new AVLTree<number>();
  line("\n=== 확장 시퀀스: 30,20,10,5,15,25,35,1 ===");
  for (const v of [30, 20, 10, 5, 15, 25, 35, 1]) {
    t.insert(v);
    line(`insert(${v}) → ${dumpTree(t)} height=${t.height()} inv=${JSON.stringify(t.__checkInvariant())}`);
  }
  line(`inOrder: ${JSON.stringify(t.inOrder())}`);
}

// ── 6. 삭제: 두 자식 노드 삭제(중위 후계자) + 언더플로우 재균형 ──
{
  const t = new AVLTree<number>();
  const seq = [30, 20, 10, 5, 15, 25, 35, 1];
  for (const v of seq) t.insert(v);
  line("\n=== 삭제 시나리오: 위 트리에서 delete(20) (두 자식) ===");
  line(`삭제 전: ${dumpTree(t)}`);
  const ok = t.delete(20);
  line(`delete(20) 반환값: ${ok}`);
  line(`삭제 후: ${dumpTree(t)} height=${t.height()}`);
  line(`inOrder: ${JSON.stringify(t.inOrder())}`);
  line(`invariant: ${JSON.stringify(t.__checkInvariant())}`);
  line(`size: ${t.size()}`);

  line("\ndelete(35) (리프)");
  t.delete(35);
  line(`삭제 후: ${dumpTree(t)} height=${t.height()}`);
  line(`invariant: ${JSON.stringify(t.__checkInvariant())}`);

  line(`\nhas(20): ${t.has(20)}, has(15): ${t.has(15)}`);
  line(`min: ${t.min()}, max: ${t.max()}`);
  line(`delete(999) 존재하지 않는 값: ${t.delete(999)}`);
}

// ── 7. 무작위 삽입/삭제 스트레스 테스트: |bf| <= 1, 정렬 순회 불변 ──
{
  line("\n=== 무작위 스트레스 테스트 (n=2000, seed 고정) ===");
  let seed = 42;
  function rnd() {
    // xorshift32 (재현 가능한 의사난수)
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return (seed >>> 0) / 4294967296;
  }

  const t = new AVLTree<number>();
  const ref = new Set<number>();
  const N = 2000;
  let worstAbsBf = 0;
  let maxHeightSeen = 0;
  let maxSizeAtMaxHeight = 0;

  for (let i = 0; i < N; i++) {
    const v = Math.floor(rnd() * 500);
    if (rnd() < 0.7) {
      t.insert(v);
      ref.add(v);
    } else {
      t.delete(v);
      ref.delete(v);
    }
    const inv = t.__checkInvariant();
    worstAbsBf = Math.max(worstAbsBf, inv.maxAbsBf);
    if (!inv.ok) {
      line(`!! 불변식 위반 at i=${i}, v=${v}`);
      process.exit(1);
    }
    const sorted = t.inOrder();
    const expected = Array.from(ref).sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
      line(`!! 정렬 순회 불일치 at i=${i}, v=${v}`);
      line(`   got: ${JSON.stringify(sorted)}`);
      line(`   exp: ${JSON.stringify(expected)}`);
      process.exit(1);
    }
    if (t.size() !== ref.size) {
      line(`!! size 불일치 at i=${i}: got=${t.size()} exp=${ref.size}`);
      process.exit(1);
    }
    if (t.height() > maxHeightSeen) {
      maxHeightSeen = t.height();
      maxSizeAtMaxHeight = t.size();
    }
  }
  line(`통과: N=${N}, 최종 size=${t.size()}, worst |bf|=${worstAbsBf}`);
  line(`관측된 최대 height=${maxHeightSeen} (그때 size=${maxSizeAtMaxHeight})`);
  const bound = (n: number) => 1.44 * Math.log2(n + 2) - 0.33;
  line(`이론 상한 1.44*log2(n+2)-0.33 at n=${maxSizeAtMaxHeight}: ${bound(maxSizeAtMaxHeight).toFixed(2)}`);
}
