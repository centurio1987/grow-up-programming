// ---- naive (원형) ----
class SubtreeSumQueryNaive {
  private n: number;
  private children: number[][];
  private values: number[];

  constructor(n: number, edges: [number, number][], root: number, values: number[]) {
    this.n = n;
    this.values = values.slice();
    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u]!.push(v);
      adj[v]!.push(u);
    }
    this.children = Array.from({ length: n }, () => []);
    const visited = new Array(n).fill(false);
    const stack = [root];
    visited[root] = true;
    const parent = new Array(n).fill(-1);
    while (stack.length > 0) {
      const u = stack.pop()!;
      for (const v of adj[u]!) {
        if (!visited[v]) {
          visited[v] = true;
          parent[v] = u;
          this.children[u]!.push(v);
          stack.push(v);
        }
      }
    }
  }

  update(node: number, value: number): void {
    this.values[node] = value;
  }

  querySubtree(node: number): number {
    let total = 0;
    const stack = [node];
    while (stack.length > 0) {
      const u = stack.pop()!;
      total += this.values[u]!;
      for (const c of this.children[u]!) stack.push(c);
    }
    return total;
  }
}

// ---- 중간 개선: Euler Tour + 평탄화 배열(선형 스캔) ----
class SubtreeSumQueryFlatScan {
  private in_: number[];
  private out_: number[];
  private flatVal: number[]; // 1-indexed, flatVal[0]은 미사용

  constructor(n: number, edges: [number, number][], root: number, values: number[]) {
    this.in_ = new Array(n).fill(0);
    this.out_ = new Array(n).fill(0);
    this.flatVal = new Array(n + 1).fill(0);

    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u]!.push(v);
      adj[v]!.push(u);
    }

    let timer = 0;
    const stack: [number, number, number][] = [[root, -1, 0]];
    while (stack.length > 0) {
      const [v, par, leaving] = stack.pop()!;
      if (leaving) {
        this.out_[v] = timer;
      } else {
        timer++;
        this.in_[v] = timer;
        stack.push([v, par, 1]);
        const neighbors = adj[v]!;
        for (let k = neighbors.length - 1; k >= 0; k--) {
          const u = neighbors[k]!;
          if (u !== par) stack.push([u, v, 0]);
        }
      }
    }

    for (let v = 0; v < n; v++) {
      this.flatVal[this.in_[v]!] = values[v]!;
    }
  }

  update(node: number, value: number): void {
    this.flatVal[this.in_[node]!] = value; // O(1) — 값을 그 자리에서 바로 교체
  }

  querySubtree(node: number): number {
    let total = 0;
    for (let i = this.in_[node]!; i <= this.out_[node]!; i++) {
      total += this.flatVal[i]!; // O(구간 길이) — 여전히 최악 O(n)
    }
    return total;
  }
}

// ---- 최종: Euler Tour + BIT ----
class SubtreeSumQuery {
  private n: number;
  private in_: number[];
  private out_: number[];
  private curVal: number[];
  private bit: number[];

  constructor(n: number, edges: [number, number][], root: number, values: number[]) {
    this.n = n;
    this.in_ = new Array(n).fill(0);
    this.out_ = new Array(n).fill(0);
    this.curVal = values.slice();
    this.bit = new Array(n + 1).fill(0);

    const adj: number[][] = Array.from({ length: n }, () => []);
    for (const [u, v] of edges) {
      adj[u]!.push(v);
      adj[v]!.push(u);
    }

    let timer = 0;
    // 스택 원소: [정점, 부모, 탈출여부(0|1)]
    const stack: [number, number, number][] = [[root, -1, 0]];
    while (stack.length > 0) {
      const [v, par, leaving] = stack.pop()!;
      if (leaving) {
        this.out_[v] = timer;
      } else {
        timer++;
        this.in_[v] = timer;
        stack.push([v, par, 1]);
        const neighbors = adj[v]!;
        for (let k = neighbors.length - 1; k >= 0; k--) {
          const u = neighbors[k]!;
          if (u !== par) stack.push([u, v, 0]);
        }
      }
    }

    for (let v = 0; v < n; v++) {
      this.bitUpdate(this.in_[v]!, values[v]!);
    }
  }

  private bitUpdate(i: number, delta: number): void {
    for (; i <= this.n; i += i & -i) {
      this.bit[i]! += delta;
    }
  }

  private bitQuery(i: number): number {
    let s = 0;
    for (; i > 0; i -= i & -i) {
      s += this.bit[i]!;
    }
    return s;
  }

  update(node: number, value: number): void {
    const delta = value - this.curVal[node]!;
    this.curVal[node] = value;
    this.bitUpdate(this.in_[node]!, delta);
  }

  querySubtree(node: number): number {
    return this.bitQuery(this.out_[node]!) - this.bitQuery(this.in_[node]! - 1);
  }
}

function assertEq(actual: number, expected: number, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL ${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`OK ${label}: ${actual}`);
}

// ---- 1. problem.md 예시 검증 ----
{
  const sst = new SubtreeSumQuery(
    6,
    [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]],
    0,
    [1, 2, 3, 4, 5, 6]
  );
  assertEq(sst.querySubtree(0), 21, "problem.md querySubtree(0)");
  assertEq(sst.querySubtree(1), 11, "problem.md querySubtree(1)");
  assertEq(sst.querySubtree(2), 9, "problem.md querySubtree(2)");
  assertEq(sst.querySubtree(3), 4, "problem.md querySubtree(3)");
  sst.update(4, 10);
  assertEq(sst.querySubtree(1), 16, "problem.md after update querySubtree(1)");
  assertEq(sst.querySubtree(0), 26, "problem.md after update querySubtree(0)");

  const single = new SubtreeSumQuery(1, [], 0, [42]);
  assertEq(single.querySubtree(0), 42, "single querySubtree(0)");
  single.update(0, 0);
  assertEq(single.querySubtree(0), 0, "single after update querySubtree(0)");

  const neg = new SubtreeSumQuery(3, [[0, 1], [0, 2]], 0, [-1, -2, -3]);
  assertEq(neg.querySubtree(0), -6, "neg querySubtree(0)");
  assertEq(neg.querySubtree(1), -2, "neg querySubtree(1)");
}

// ---- 1.5 중간 개선(FlatScan) 검증 ----
{
  const sst = new SubtreeSumQueryFlatScan(
    6,
    [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]],
    0,
    [1, 2, 3, 4, 5, 6]
  );
  assertEq(sst.querySubtree(0), 21, "FlatScan querySubtree(0)");
  assertEq(sst.querySubtree(1), 11, "FlatScan querySubtree(1)");
  sst.update(4, 10);
  assertEq(sst.querySubtree(1), 16, "FlatScan after update querySubtree(1)");
  assertEq(sst.querySubtree(0), 26, "FlatScan after update querySubtree(0)");

  // sim 고정 입력에서도 확인
  const flat = new SubtreeSumQueryFlatScan(
    5,
    [[0, 1], [0, 2], [1, 3], [1, 4]],
    0,
    [10, 20, 30, 40, 50]
  );
  assertEq(flat.querySubtree(1), 110, "FlatScan sim querySubtree(1)");
  flat.update(3, 100);
  assertEq(flat.querySubtree(0), 210, "FlatScan sim querySubtree(0) after update");
}

// ---- 2. 가이드 시뮬레이션 고정 입력 검증 ----
// n=5, edges=[[0,1],[0,2],[1,3],[1,4]], root=0, values=[10,20,30,40,50]
{
  const n = 5;
  const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4]];
  const root = 0;
  const values = [10, 20, 30, 40, 50];

  const sst = new SubtreeSumQuery(n, edges, root, values);

  // in/out 타임스탬프 직접 확인 (private 접근 위해 any 캐스팅)
  const anySst = sst as any;
  console.log("in =", anySst.in_);
  console.log("out =", anySst.out_);

  const r1 = sst.querySubtree(1);
  assertEq(r1, 110, "sim querySubtree(1)");

  sst.update(3, 100);
  assertEq(anySst.curVal[3], 100, "sim curVal[3] after update");

  const r2 = sst.querySubtree(0);
  assertEq(r2, 210, "sim querySubtree(0) after update");

  // naive와 교차검증 (같은 시퀀스)
  const naive = new SubtreeSumQueryNaive(n, edges, root, values);
  assertEq(naive.querySubtree(1), 110, "naive sim querySubtree(1)");
  naive.update(3, 100);
  assertEq(naive.querySubtree(0), 210, "naive sim querySubtree(0) after update");
}

// ---- 3. 엣지케이스: 리프, 연속 update ----
{
  const sst = new SubtreeSumQuery(
    6,
    [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5]],
    0,
    [1, 2, 3, 4, 5, 6]
  );
  assertEq(sst.querySubtree(5), 6, "edge: leaf querySubtree(5)");
  sst.update(5, 100);
  sst.update(5, 7);
  assertEq(sst.querySubtree(5), 7, "edge: consecutive update leaf");
  assertEq(sst.querySubtree(2), 10, "edge: consecutive update parent(2) = 3+7");
}

// ---- 4. 무작위 교차검증: naive vs BIT ----
{
  function randomTree(n: number): [number, number][] {
    const edges: [number, number][] = [];
    for (let v = 1; v < n; v++) {
      const parent = Math.floor(Math.random() * v);
      edges.push([parent, v]);
    }
    return edges;
  }

  for (let trial = 0; trial < 30; trial++) {
    const n = 1 + Math.floor(Math.random() * 30);
    const edges = randomTree(n);
    const root = 0;
    const values = Array.from({ length: n }, () => Math.floor(Math.random() * 201) - 100);

    const naive = new SubtreeSumQueryNaive(n, edges, root, values);
    const bit = new SubtreeSumQuery(n, edges, root, values);

    for (let op = 0; op < 50; op++) {
      const node = Math.floor(Math.random() * n);
      if (Math.random() < 0.5) {
        const value = Math.floor(Math.random() * 201) - 100;
        naive.update(node, value);
        bit.update(node, value);
      } else {
        const a = naive.querySubtree(node);
        const b = bit.querySubtree(node);
        if (a !== b) {
          throw new Error(
            `무작위 교차검증 실패: trial=${trial} n=${n} node=${node} naive=${a} bit=${b}`
          );
        }
      }
    }
  }
  console.log("OK 무작위 교차검증 30 trial x 50 op 통과");
}

// ---- 5. 헷갈리기 쉬운 포인트용 구체 오답 수치 검증 ----
{
  // (a) delta 대신 절댓값을 그대로 더하는 오답 구현
  class WrongNoDelta {
    private n: number;
    private in_: number[];
    private out_: number[];
    private bit: number[];
    constructor(n: number, edges: [number, number][], root: number, values: number[]) {
      this.n = n;
      this.in_ = new Array(n).fill(0);
      this.out_ = new Array(n).fill(0);
      this.bit = new Array(n + 1).fill(0);
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [u, v] of edges) { adj[u]!.push(v); adj[v]!.push(u); }
      let timer = 0;
      const stack: [number, number, number][] = [[root, -1, 0]];
      while (stack.length > 0) {
        const [v, par, leaving] = stack.pop()!;
        if (leaving) { this.out_[v] = timer; }
        else {
          timer++; this.in_[v] = timer; stack.push([v, par, 1]);
          const nb = adj[v]!;
          for (let k = nb.length - 1; k >= 0; k--) { const u = nb[k]!; if (u !== par) stack.push([u, v, 0]); }
        }
      }
      for (let v = 0; v < n; v++) this.bitUpdate(this.in_[v]!, values[v]!);
    }
    private bitUpdate(i: number, delta: number) { for (; i <= this.n; i += i & -i) this.bit[i]! += delta; }
    private bitQuery(i: number) { let s = 0; for (; i > 0; i -= i & -i) s += this.bit[i]!; return s; }
    updateWrong(node: number, value: number) { this.bitUpdate(this.in_[node]!, value); } // delta 대신 절댓값을 그대로 더함 (버그)
    querySubtree(node: number) { return this.bitQuery(this.out_[node]!) - this.bitQuery(this.in_[node]! - 1); }
  }

  const n = 5;
  const edges: [number, number][] = [[0, 1], [0, 2], [1, 3], [1, 4]];
  const root = 0;
  const values = [10, 20, 30, 40, 50];

  const correct = new SubtreeSumQuery(n, edges, root, values);
  correct.update(3, 100);
  assertEq(correct.querySubtree(1), 170, "정답: update(3,100) 후 querySubtree(1) = 20+100+50");
  assertEq(correct.querySubtree(0), 210, "정답: update(3,100) 후 querySubtree(0)");

  const wrong = new WrongNoDelta(n, edges, root, values);
  wrong.updateWrong(3, 100); // delta 없이 100을 그대로 더함 (버그 재현)
  const wrongQ1 = wrong.querySubtree(1);
  const wrongQ0 = wrong.querySubtree(0);
  console.log(`BUG 재현: delta 없이 update(3,100) → querySubtree(1) = ${wrongQ1} (정답 170), querySubtree(0) = ${wrongQ0} (정답 210)`);
  if (wrongQ1 === 170 || wrongQ0 === 210) {
    throw new Error("버그 재현 실패: 오답 구현이 우연히 정답과 같은 값을 냈습니다");
  }

  // (b) in[node]-1 대신 in[node]를 그대로 쓰는 오답 (자기 자신 제외 버그)
  const anyCorrect = correct as any;
  const rangeWrong = anyCorrect.bitQuery(anyCorrect.out_[1]) - anyCorrect.bitQuery(anyCorrect.in_[1]); // -1 누락
  const rangeRight = anyCorrect.bitQuery(anyCorrect.out_[1]) - anyCorrect.bitQuery(anyCorrect.in_[1] - 1);
  console.log(`BUG 재현: in[node]-1 대신 in[node] 사용 → ${rangeWrong} (정답 ${rangeRight})`);
  if (rangeWrong === rangeRight) {
    throw new Error("버그 재현 실패: -1 누락이 결과에 영향을 주지 않았습니다");
  }
}

console.log("전체 통과");
