// 가이드 본문 코드의 자기 검증용 스크래치 실행 파일.
// 가이드 -guide.new.mdx의 "아이디어를 코드로 옮기기" 절 코드를 그대로 옮겨,
// 본문에 실은 트레이스·시뮬 프레임 수치와 실측이 일치하는지 확인한다.

class LCTNode {
  left: LCTNode | null = null;
  right: LCTNode | null = null;
  parent: LCTNode | null = null;
  rev = false;
  readonly id: number;

  constructor(id: number) {
    this.id = id;
  }
}

class LinkCutTree {
  private nodes: LCTNode[];

  constructor(n: number) {
    this.nodes = Array.from({ length: n }, (_, i) => new LCTNode(i));
  }

  private isRoot(x: LCTNode): boolean {
    const p = x.parent;
    return p === null || (p.left !== x && p.right !== x);
  }

  private pushDown(x: LCTNode): void {
    if (!x.rev) return;
    const { left, right } = x;
    x.left = right;
    x.right = left;
    if (x.left) x.left.rev = !x.left.rev;
    if (x.right) x.right.rev = !x.right.rev;
    x.rev = false;
  }

  private rotate(x: LCTNode): void {
    const p = x.parent!;
    const g = p.parent;
    const wasRoot = this.isRoot(p);
    const isLeft = p.left === x;

    // x의 안쪽 자식을 p에게 넘기고, p를 x의 자식으로 끌어내린다.
    if (isLeft) {
      p.left = x.right;
      if (x.right) x.right.parent = p;
      x.right = p;
    } else {
      p.right = x.left;
      if (x.left) x.left.parent = p;
      x.left = p;
    }
    p.parent = x;
    x.parent = g;

    // g가 진짜 부모였을 때만(선호 경로 안이었을 때만) g의 자식 포인터를 갱신한다.
    // wasRoot면 g는 path-parent였을 뿐이므로 g의 left/right는 건드리지 않는다.
    if (!wasRoot && g) {
      if (g.left === p) g.left = x;
      else if (g.right === p) g.right = x;
    }
  }

  private splay(x: LCTNode): void {
    while (!this.isRoot(x)) {
      const p = x.parent!;
      const g = p.parent;
      if (!this.isRoot(p)) this.pushDown(g!);
      this.pushDown(p);
      this.pushDown(x);
      if (!this.isRoot(p)) {
        const zigzig = (g!.left === p) === (p.left === x);
        this.rotate(zigzig ? p : x);
      }
      this.rotate(x);
    }
    this.pushDown(x);
  }

  /** v에서 (현재 makeRoot된) 실제 루트까지의 경로를 하나의 선호 경로로 합친다. */
  private access(v: LCTNode): void {
    let last: LCTNode | null = null;
    let x: LCTNode | null = v;
    while (x !== null) {
      this.splay(x);
      x.right = last; // 아래쪽(먼저 처리한) 경로를 오른쪽 자식으로 붙인다
      last = x;
      x = x.parent; // isRoot였으므로 이 parent는 path-parent
    }
    this.splay(v);
  }

  /** access(v) 후 v를 원래 트리의 루트로 만든다(경로 반전 태그). */
  private makeRoot(v: LCTNode): void {
    this.access(v);
    v.rev = !v.rev;
  }

  /** x가 속한 aux 트리(선호 경로)의 최소 깊이 노드 = 그 트리의 실제 루트. */
  private findRoot(x: LCTNode): LCTNode {
    this.access(x);
    let cur = x;
    this.pushDown(cur);
    while (cur.left !== null) {
      cur = cur.left;
      this.pushDown(cur);
    }
    this.splay(cur);
    return cur;
  }

  link(u: number, v: number): void {
    const nu = this.nodes[u]!;
    const nv = this.nodes[v]!;
    this.makeRoot(nu);
    nu.parent = nv; // path-parent 포인터로 두 트리를 잇는다 (nu는 자신 트리의 root)
  }

  cut(u: number, v: number): void {
    const nu = this.nodes[u]!;
    const nv = this.nodes[v]!;
    this.makeRoot(nu);
    this.access(nv);
    // 직접 간선이면 nv.left는 정확히 nu 하나뿐이다 (u가 최소 깊이 노드).
    const left = nv.left!;
    left.parent = null;
    nv.left = null;
  }

  connected(u: number, v: number): boolean {
    if (u === v) return true;
    const nu = this.nodes[u]!;
    const nv = this.nodes[v]!;
    this.makeRoot(nu);
    return this.findRoot(nv) === nu;
  }
}

// ---- 실측 검증 ----

function assertEq(actual: unknown, expected: unknown, label: string): void {
  const ok = actual === expected;
  console.log(`${ok ? "OK" : "FAIL"} ${label}: got=${actual} expected=${expected}`);
  if (!ok) process.exitCode = 1;
}

// 1) 가이드 시뮬레이션과 동일한 시퀀스 (n=5)
{
  const lct = new LinkCutTree(5);
  assertEq(lct.connected(0, 1), false, "초기 connected(0,1)");
  lct.link(0, 1);
  lct.link(1, 2);
  assertEq(lct.connected(0, 2), true, "link(0,1),link(1,2) 후 connected(0,2)");
  assertEq(lct.connected(0, 3), false, "connected(0,3)");
  lct.link(3, 4);
  assertEq(lct.connected(3, 4), true, "link(3,4) 후 connected(3,4)");
  assertEq(lct.connected(2, 3), false, "connected(2,3)");
  lct.cut(1, 2);
  assertEq(lct.connected(0, 2), false, "cut(1,2) 후 connected(0,2)");
  assertEq(lct.connected(0, 1), true, "cut(1,2) 후에도 connected(0,1)");
  assertEq(lct.connected(0, 0), true, "connected(0,0)");
}

// 2) 문제 예시 시퀀스 (linkCutTree-problem.md)
{
  const lct = new LinkCutTree(5);
  assertEq(lct.connected(0, 1), false, "problem: connected(0,1) 초기");
  lct.link(0, 1);
  lct.link(1, 2);
  assertEq(lct.connected(0, 2), true, "problem: connected(0,2)");
  assertEq(lct.connected(0, 3), false, "problem: connected(0,3)");
  lct.link(3, 4);
  assertEq(lct.connected(3, 4), true, "problem: connected(3,4)");
  assertEq(lct.connected(2, 3), false, "problem: connected(2,3)");
  lct.cut(1, 2);
  assertEq(lct.connected(0, 2), false, "problem: connected(0,2) after cut");
  assertEq(lct.connected(0, 1), true, "problem: connected(0,1) after cut");
  assertEq(lct.connected(0, 0), true, "problem: connected(0,0)");
}

// 3) 엣지 케이스: 원상복구
{
  const lct = new LinkCutTree(3);
  lct.link(0, 1);
  assertEq(lct.connected(0, 1), true, "edge: link 후 connected");
  lct.cut(0, 1);
  assertEq(lct.connected(0, 1), false, "edge: cut 후 다시 분리");
  lct.link(1, 0); // 반대 방향으로 다시 연결 (u, v 순서 바꿔도 동작해야 함)
  assertEq(lct.connected(0, 1), true, "edge: 역방향 link 후 connected");
  assertEq(lct.connected(1, 1), true, "edge: connected(x,x)");
  assertEq(lct.connected(0, 2), false, "edge: 3번째 노드는 여전히 분리");
}

// 4) 무작위 교차검증: naive Union-Find(재구성)로 비교
{
  function makeNaive(n: number) {
    const parent = Array.from({ length: n }, (_, i) => i);
    function find(x: number): number {
      while (parent[x] !== x) x = parent[x]!;
      return x;
    }
    const adj: Set<number>[] = Array.from({ length: n }, () => new Set());
    return {
      link(u: number, v: number) {
        adj[u]!.add(v);
        adj[v]!.add(u);
      },
      cut(u: number, v: number) {
        adj[u]!.delete(v);
        adj[v]!.delete(u);
      },
      connected(u: number, v: number): boolean {
        if (u === v) return true;
        const seen = new Set([u]);
        const stack = [u];
        while (stack.length) {
          const x = stack.pop()!;
          for (const y of adj[x]!) {
            if (!seen.has(y)) {
              if (y === v) return true;
              seen.add(y);
              stack.push(y);
            }
          }
        }
        return false;
      },
    };
  }

  function mulberry32(seed: number) {
    let a = seed;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const n = 12;
  const rand = mulberry32(20260714);
  const lct = new LinkCutTree(n);
  const naive = makeNaive(n);
  // 현재 존재하는 간선을 무작위 cut 대상으로 뽑기 위해 별도로 추적한다.
  const edges: [number, number][] = [];

  let mismatches = 0;
  for (let step = 0; step < 500; step++) {
    const op = rand();
    if (op < 0.4 && edges.length < n - 1) {
      // link: 서로 다른 트리에 있는 두 노드를 찾을 때까지 시도
      let u = 0;
      let v = 0;
      let tries = 0;
      do {
        u = Math.floor(rand() * n);
        v = Math.floor(rand() * n);
        tries++;
      } while ((u === v || naive.connected(u, v)) && tries < 50);
      if (u !== v && !naive.connected(u, v)) {
        lct.link(u, v);
        naive.link(u, v);
        edges.push([u, v]);
      }
    } else if (op < 0.6 && edges.length > 0) {
      const idx = Math.floor(rand() * edges.length);
      const [u, v] = edges[idx]!;
      lct.cut(u, v);
      naive.cut(u, v);
      edges.splice(idx, 1);
    } else {
      const u = Math.floor(rand() * n);
      const v = Math.floor(rand() * n);
      const a = lct.connected(u, v);
      const b = naive.connected(u, v);
      if (a !== b) {
        mismatches++;
        console.log(`FAIL random step=${step} connected(${u},${v}) lct=${a} naive=${b}`);
      }
    }
  }
  assertEq(mismatches, 0, "무작위 500스텝 교차검증 불일치 수");
}

console.log("모든 검증 완료");
