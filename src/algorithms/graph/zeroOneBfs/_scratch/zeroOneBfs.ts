// E3 자기검증용 스크래치 — 가이드 본문에 실을 코드를 그대로 옮겨 실행 검증한다.

// ── 기본 구현 (naive 배열 unshift/shift) ──────────────────────────────
function zeroOneBfsBase(
  n: number,
  edges: [number, number, number][],
  source: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u]!.push([v, w]);
  }

  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;

  const deque: number[] = [source];

  while (deque.length > 0) {
    const v = deque.shift()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        if (weight === 0) {
          deque.unshift(w);
        } else {
          deque.push(w);
        }
      }
    }
  }

  return dist.map((d) => (d === Infinity ? -1 : d));
}

// ── 최적화 구현 (두 배열 deque, amortized O(1)) ───────────────────────
class ZeroOneDeque {
  private front: number[] = []; // 역순 저장: front[length-1] = 논리적 맨 앞
  private back: number[] = []; // 정순 저장: back[0] = front 다음 원소

  pushFront(x: number): void {
    this.front.push(x);
  }

  pushBack(x: number): void {
    this.back.push(x);
  }

  popFront(): number | undefined {
    if (this.front.length > 0) return this.front.pop();
    if (this.back.length > 0) {
      this.front = this.back.reverse();
      this.back = [];
      return this.front.pop();
    }
    return undefined;
  }

  isEmpty(): boolean {
    return this.front.length === 0 && this.back.length === 0;
  }

  // 디버깅/트레이스용: 논리 순서(front → back) 배열 반환
  snapshot(): number[] {
    return [...this.front].reverse().concat(this.back);
  }
}

function zeroOneBfs(
  n: number,
  edges: [number, number, number][],
  source: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u]!.push([v, w]);
  }

  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;

  const deque = new ZeroOneDeque();
  deque.pushFront(source);

  while (!deque.isEmpty()) {
    const v = deque.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        if (weight === 0) {
          deque.pushFront(w);
        } else {
          deque.pushBack(w);
        }
      }
    }
  }

  return dist.map((d) => (d === Infinity ? -1 : d));
}

// 트레이스용: sim의 각 프레임에 대응하는 deque 상태를 출력하는 버전
function zeroOneBfsTraced(
  n: number,
  edges: [number, number, number][],
  source: number,
): void {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u]!.push([v, w]);
  }

  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;

  const deque = new ZeroOneDeque();
  deque.pushFront(source);
  console.log("init deque=", deque.snapshot(), "dist=", dist);

  while (!deque.isEmpty()) {
    const v = deque.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        if (weight === 0) {
          deque.pushFront(w);
        } else {
          deque.pushBack(w);
        }
      }
    }
    console.log(`popped ${v} -> deque=`, deque.snapshot(), "dist=", dist);
  }
}

// ── 검증 ──────────────────────────────────────────────────────────
const n = 5;
const edges: [number, number, number][] = [
  [0, 1, 1],
  [0, 2, 0],
  [2, 1, 0],
  [2, 3, 1],
  [1, 3, 1],
  [3, 4, 0],
];
const source = 0;

console.log("=== 대표 예시 트레이스 ===");
zeroOneBfsTraced(n, edges, source);

console.log("=== 대표 예시 결과 비교 ===");
console.log("base     :", zeroOneBfsBase(n, edges, source));
console.log("optimized:", zeroOneBfs(n, edges, source));

console.log("=== 엣지 케이스 ===");
console.log("V=1, E=0        :", zeroOneBfs(1, [], 0), zeroOneBfsBase(1, [], 0));
console.log("source만 존재    :", zeroOneBfs(3, [], 1), zeroOneBfsBase(3, [], 1));
console.log(
  "도달 불가       :",
  zeroOneBfs(4, [[0, 1, 1], [2, 3, 0]], 0),
  zeroOneBfsBase(4, [[0, 1, 1], [2, 3, 0]], 0),
);
console.log(
  "모두 가중치 1   :",
  zeroOneBfs(4, [[0, 1, 1], [1, 2, 1], [2, 3, 1]], 0),
  zeroOneBfsBase(4, [[0, 1, 1], [1, 2, 1], [2, 3, 1]], 0),
);
console.log(
  "모두 가중치 0   :",
  zeroOneBfs(4, [[0, 1, 0], [1, 2, 0], [2, 3, 0]], 0),
  zeroOneBfsBase(4, [[0, 1, 0], [1, 2, 0], [2, 3, 0]], 0),
);
console.log(
  "혼합(문제 예시) :",
  zeroOneBfs(4, [[0, 1, 1], [1, 2, 1], [0, 3, 0], [3, 2, 0]], 0),
  zeroOneBfsBase(4, [[0, 1, 1], [1, 2, 1], [0, 3, 0], [3, 2, 0]], 0),
);
console.log(
  "0-weight 사이클 :",
  zeroOneBfs(3, [[0, 1, 0], [1, 2, 0], [2, 0, 0]], 0),
  zeroOneBfsBase(3, [[0, 1, 0], [1, 2, 0], [2, 0, 0]], 0),
);

console.log("=== 무작위 교차검증 (base vs optimized) ===");
function randTest(seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  let mismatches = 0;
  for (let t = 0; t < 200; t++) {
    const nn = 2 + Math.floor(rand() * 10);
    const ee = Math.floor(rand() * 20);
    const es: [number, number, number][] = [];
    for (let i = 0; i < ee; i++) {
      const u = Math.floor(rand() * nn);
      const v = Math.floor(rand() * nn);
      const w = rand() < 0.5 ? 0 : 1;
      es.push([u, v, w]);
    }
    const src = Math.floor(rand() * nn);
    const a = JSON.stringify(zeroOneBfsBase(nn, es, src));
    const b = JSON.stringify(zeroOneBfs(nn, es, src));
    if (a !== b) {
      mismatches++;
      console.log("MISMATCH", { nn, es, src, a, b });
    }
  }
  console.log(`무작위 200케이스 중 불일치: ${mismatches}`);
}
randTest(42);

// ── 함정 시나리오: pushFront/pushBack을 반대로 쓰면? ───────────────────
function zeroOneBfsBuggySwapped(
  n: number,
  edges: [number, number, number][],
  source: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);

  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;
  const deque = new ZeroOneDeque();
  deque.pushFront(source);

  while (!deque.isEmpty()) {
    const v = deque.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        // 함정: weight 0/1 삽입 위치를 바꿔버림
        if (weight === 0) {
          deque.pushBack(w); // 원래는 pushFront여야 함
        } else {
          deque.pushFront(w); // 원래는 pushBack이어야 함
        }
      }
    }
  }
  return dist.map((d) => (d === Infinity ? -1 : d));
}

console.log("=== 함정: pushFront/pushBack 반대로 쓰면 ===");
console.log("정답        :", zeroOneBfs(n, edges, source));
console.log("swapped(오답):", zeroOneBfsBuggySwapped(n, edges, source));

// stale 가드 없으면 어떻게 되는지: 0-weight 사이클에서 무한루프 위험을 안전하게 확인
// (가드가 있는 정상 버전은 종료함을 함께 확인)
console.log("=== stale 가드 있는 정상 버전: 0-weight 사이클도 정상 종료 ===");
console.log(zeroOneBfs(3, [[0, 1, 0], [1, 2, 0], [2, 0, 0]], 0));

// ── 함정 2: weight 구분 없이 전부 pushBack (= 그냥 BFS 취급) ──────────
function zeroOneBfsBuggyPlainBfs(
  n: number,
  edges: [number, number, number][],
  source: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);

  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;
  const deque = new ZeroOneDeque();
  deque.pushFront(source);

  while (!deque.isEmpty()) {
    const v = deque.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        deque.pushBack(w); // 함정: weight 무시하고 항상 뒤에만 넣음
      }
    }
  }
  return dist.map((d) => (d === Infinity ? -1 : d));
}

console.log("=== 함정 2: weight 무시하고 전부 pushBack ===");
console.log("정답      :", zeroOneBfs(n, edges, source));
console.log("buggy(오답):", zeroOneBfsBuggyPlainBfs(n, edges, source));

// ── 함정 3: Infinity -> -1 변환을 빼먹으면 ──────────────────────────
function zeroOneBfsNoConvert(
  n: number,
  edges: [number, number, number][],
  source: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);
  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;
  const deque = new ZeroOneDeque();
  deque.pushFront(source);
  while (!deque.isEmpty()) {
    const v = deque.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        if (weight === 0) deque.pushFront(w);
        else deque.pushBack(w);
      }
    }
  }
  return dist; // 함정: -1 변환 누락
}
console.log("=== 함정 3: Infinity -> -1 변환 누락 ===");
const unreach: [number, number, number][] = [[0, 1, 1], [2, 3, 0]];
console.log("정답      :", zeroOneBfs(4, unreach, 0));
console.log("buggy(오답):", zeroOneBfsNoConvert(4, unreach, 0));

// ── 함정 4: 유향 간선을 무향으로 등록하면 (양방향 모두 추가) ─────────
function zeroOneBfsUndirectedBug(
  n: number,
  edges: [number, number, number][],
  source: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) {
    adj[u]!.push([v, w]);
    adj[v]!.push([u, w]); // 함정: 반대 방향도 등록
  }
  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;
  const deque = new ZeroOneDeque();
  deque.pushFront(source);
  while (!deque.isEmpty()) {
    const v = deque.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        if (weight === 0) deque.pushFront(w);
        else deque.pushBack(w);
      }
    }
  }
  return dist.map((d) => (d === Infinity ? -1 : d));
}

console.log("=== 함정 4: 유향 간선을 무향으로 등록 ===");
// source=3에서 시작: 원래는 3->4(w0)만 갈 수 있고 나머지는 도달 불가(역방향 없음)
console.log("정답      :", zeroOneBfs(n, edges, 3));
console.log("buggy(오답):", zeroOneBfsUndirectedBug(n, edges, 3));

// ── 함정 5: popFront에서 this.back = [] 를 빼먹으면 (별칭 버그) ────────
class BuggyDeque {
  front: number[] = [];
  back: number[] = [];
  pushFront(x: number) { this.front.push(x); }
  pushBack(x: number) { this.back.push(x); }
  popFront(): number | undefined {
    if (this.front.length > 0) return this.front.pop();
    if (this.back.length > 0) {
      this.front = this.back.reverse(); // back.reverse()는 back과 "같은 배열"을 반환
      // this.back = []; // 함정: 이 줄을 빼먹으면 front와 back이 같은 배열을 가리킨다
      return this.front.pop();
    }
    return undefined;
  }
  isEmpty() { return this.front.length === 0 && this.back.length === 0; }
}

function zeroOneBfsAliasBug(
  n: number,
  edges: [number, number, number][],
  source: number,
): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);
  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;
  const dq = new BuggyDeque();
  dq.pushFront(source);
  while (!dq.isEmpty()) {
    const v = dq.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        if (weight === 0) dq.pushFront(w);
        else dq.pushBack(w);
      }
    }
  }
  return dist.map((d) => (d === Infinity ? -1 : d));
}

console.log("=== 함정 5: this.back = [] 누락 (별칭 버그) ===");
console.log("정답      :", zeroOneBfs(n, edges, source));
console.log("buggy(오답):", zeroOneBfsAliasBug(n, edges, source));

// ── 점검 문제용 예시 계산 ──────────────────────────────────────────
console.log("=== 점검 문제 1 계산 ===");
const qN = 6;
const qEdges: [number, number, number][] = [
  [0, 1, 0],
  [1, 2, 1],
  [0, 3, 1],
  [3, 4, 0],
  [4, 5, 0],
  [2, 5, 0],
];
console.log(zeroOneBfs(qN, qEdges, 0));

// ── 최종 확인: 본문에 인용한 "51 vs 101 pop" 수치를 가이드의 실제 클래스로 재검증 ──
function zeroOneBfsSwappedCounted(
  n: number,
  edges: [number, number, number][],
  source: number,
): { dist: number[]; pops: number } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);
  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;
  const deque = new ZeroOneDeque();
  deque.pushFront(source);
  let pops = 0;
  while (!deque.isEmpty()) {
    pops++;
    const v = deque.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        if (weight === 0) deque.pushBack(w); // 반대로: 원래 pushFront여야 함
        else deque.pushFront(w); // 반대로: 원래 pushBack이어야 함
      }
    }
  }
  return { dist: dist.map((d) => (d === Infinity ? -1 : d)), pops };
}
function zeroOneBfsCorrectCounted(
  n: number,
  edges: [number, number, number][],
  source: number,
): { dist: number[]; pops: number } {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u]!.push([v, w]);
  const dist = new Array<number>(n).fill(Infinity);
  dist[source] = 0;
  const deque = new ZeroOneDeque();
  deque.pushFront(source);
  let pops = 0;
  while (!deque.isEmpty()) {
    pops++;
    const v = deque.popFront()!;
    for (const [w, weight] of adj[v]!) {
      const newDist = dist[v]! + weight;
      if (newDist < dist[w]!) {
        dist[w] = newDist;
        if (weight === 0) deque.pushFront(w);
        else deque.pushBack(w);
      }
    }
  }
  return { dist: dist.map((d) => (d === Infinity ? -1 : d)), pops };
}
function buildDiamondChain(layers: number, width: number) {
  let id = 0;
  const source = id++;
  const layerNodes: number[][] = [];
  for (let L = 0; L < layers; L++) {
    const ns: number[] = [];
    for (let i = 0; i < width; i++) ns.push(id++);
    layerNodes.push(ns);
  }
  const nn = id;
  const es: [number, number, number][] = [];
  for (let i = 0; i < width; i++) es.push([source, layerNodes[0]![i]!, i % 2]);
  for (let L = 0; L < layers - 1; L++) {
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < width; j++) {
        es.push([layerNodes[L]![i]!, layerNodes[L + 1]![j]!, (i + j) % 2]);
      }
    }
  }
  return { n: nn, edges: es };
}
console.log("=== 본문 인용 수치 재검증: 51 vs 101 pop ===");
const dch = buildDiamondChain(5, 10);
const correctRun = zeroOneBfsCorrectCounted(dch.n, dch.edges, 0);
const swappedRun = zeroOneBfsSwappedCounted(dch.n, dch.edges, 0);
console.log(`V=${dch.n} E=${dch.edges.length}`);
console.log("정답 pops:", correctRun.pops, "swapped pops:", swappedRun.pops);
console.log("결과 동일:", JSON.stringify(correctRun.dist) === JSON.stringify(swappedRun.dist));
