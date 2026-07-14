// E3 자기검증용 스크래치 — 가이드 본문에 싣는 코드를 그대로 추출해 실행 검증한다.
// 가이드 자체 코드가 oracle이며, sibling src/spfa.ts(학습자 스텁)와는 무관하다.

// ── 1. naive: Bellman-Ford (출발점 절 코드) ─────────────────────────────
function bellmanFordNaive(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  for (let i = 1; i <= n - 1; i++) {
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
      }
    }
  }
  return dist;
}

// ── 2. 기본 구현: FIFO 큐 SPFA (아이디어를 코드로 옮기기 절 코드) ────────
function spfaBasic(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: Array<Array<[number, number]>> = Array.from(
    { length: n },
    () => [],
  );
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
  }

  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const inQueue = new Array(n).fill(false);
  const queue: number[] = [src];
  inQueue[src] = true;

  while (queue.length > 0) {
    const u = queue.shift()!;
    inQueue[u] = false;

    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        if (!inQueue[v]) {
          queue.push(v);
          inQueue[v] = true;
        }
      }
    }
  }

  return dist;
}

// 기본 구현과 동일하지만 처리 순서(큐 상태)를 프레임으로 기록하는 트레이스 버전.
function spfaBasicTrace(
  n: number,
  edges: [number, number, number][],
  src: number,
) {
  const adj: Array<Array<[number, number]>> = Array.from(
    { length: n },
    () => [],
  );
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
  }

  const dist: (number | typeof Infinity)[] = new Array(n).fill(Infinity);
  dist[src] = 0;
  const inQueue = new Array(n).fill(false);
  const queue: number[] = [src];
  inQueue[src] = true;

  const frames: { popped: number; queueAfter: number[]; dist: number[] }[] =
    [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    inQueue[u] = false;

    for (const [v, w] of adj[u]) {
      if ((dist[u] as number) + w < (dist[v] as number)) {
        dist[v] = (dist[u] as number) + w;
        if (!inQueue[v]) {
          queue.push(v);
          inQueue[v] = true;
        }
      }
    }
    frames.push({ popped: u, queueAfter: [...queue], dist: [...dist] as number[] });
  }

  return { dist: dist as number[], frames };
}

// ── 3. 최적화: SLF(Shortest Label First) 적용 SPFA (최적화 코드 절) ────
function spfaSLF(
  n: number,
  edges: [number, number, number][],
  src: number,
): number[] {
  const adj: Array<Array<[number, number]>> = Array.from(
    { length: n },
    () => [],
  );
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
  }

  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const inQueue = new Array(n).fill(false);
  const deque: number[] = [src];
  inQueue[src] = true;

  while (deque.length > 0) {
    const u = deque.shift()!;
    inQueue[u] = false;

    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        if (!inQueue[v]) {
          // SLF: 새로 갱신된 dist[v]가 현재 큐 맨 앞보다 작으면 앞에 삽입
          if (deque.length > 0 && dist[v] < dist[deque[0]]) {
            deque.unshift(v);
          } else {
            deque.push(v);
          }
          inQueue[v] = true;
        }
      }
    }
  }

  return dist;
}

// ── 검증 ────────────────────────────────────────────────────────────────

function assertEqual(name: string, actual: number[], expected: number[]) {
  const norm = (x: number) => (x === Infinity ? "Inf" : x);
  const a = actual.map(norm).join(",");
  const b = expected.map(norm).join(",");
  if (a !== b) {
    throw new Error(`[FAIL] ${name}: got [${a}] expected [${b}]`);
  }
  console.log(`[OK] ${name}: [${a}]`);
}

// 1) 시뮬레이션 대표 예시: n=4, edges=[[0,1,4],[0,2,1],[2,1,-2],[1,3,3]], src=0
{
  const n = 4;
  const edges: [number, number, number][] = [
    [0, 1, 4],
    [0, 2, 1],
    [2, 1, -2],
    [1, 3, 3],
  ];
  const expected = [0, -1, 1, 2];
  assertEqual("basic 대표예시", spfaBasic(n, edges, 0), expected);
  assertEqual("SLF 대표예시", spfaSLF(n, edges, 0), expected);
  assertEqual("bellmanFordNaive 대표예시", bellmanFordNaive(n, edges, 0), expected);

  // 시뮬레이션 프레임 재현
  const { dist, frames } = spfaBasicTrace(n, edges, 0);
  console.log("--- 트레이스 프레임 ---");
  for (const f of frames) {
    console.log(
      `popped=${f.popped} queueAfter=[${f.queueAfter}] dist=[${f.dist.map((x) => (x === Infinity ? "Inf" : x))}]`,
    );
  }
  assertEqual("트레이스 최종 dist", dist, expected);
}

// 2) 엣지 케이스
assertEqual("n=1, edges=[]", spfaBasic(1, [], 0), [0]);
assertEqual("n=1, edges=[] (SLF)", spfaSLF(1, [], 0), [0]);

assertEqual(
  "도달 불가능",
  spfaBasic(3, [[0, 1, 2]], 0),
  [0, 2, Infinity],
);

assertEqual(
  "선형 체인 양수",
  spfaBasic(4, [[0,1,1],[1,2,1],[2,3,1]], 0),
  [0, 1, 2, 3],
);

assertEqual(
  "다중 간선 - 더 작은 가중치 채택",
  spfaBasic(2, [[0,1,5],[0,1,-2],[0,1,3]], 0),
  [0, -2],
);

assertEqual(
  "시작점이 중간 정점",
  spfaBasic(4, [[0,1,1],[1,2,1],[2,3,1]], 1),
  [Infinity, 0, 1, 2],
);

assertEqual(
  "늦게 발견된 더 짧은 경로 재완화",
  spfaBasic(3, [[0,1,10],[0,2,1],[2,1,1]], 0),
  [0, 2, 1],
);

// 3) 원형(bellmanFordNaive) vs 기본구현 vs SLF 교차검증 — 랜덤 DAG(음수 사이클 없음)
{
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed;
  };
  for (let trial = 0; trial < 200; trial++) {
    const n = 2 + (rand() % 12); // 2~13
    const edges: [number, number, number][] = [];
    const edgeCount = rand() % 20;
    for (let i = 0; i < edgeCount; i++) {
      const u = rand() % n;
      const v = rand() % n;
      const w = (rand() % 21) - 10; // -10..10
      if (u < v) edges.push([u, v, w]); // forward-only: 음수 사이클 원천 차단
    }
    const src = rand() % n;
    const dNaive = bellmanFordNaive(n, edges, src);
    const dBasic = spfaBasic(n, edges, src);
    const dSLF = spfaSLF(n, edges, src);
    const norm = (arr: number[]) =>
      arr.map((x) => (x === Infinity ? "Inf" : x)).join(",");
    if (norm(dNaive) !== norm(dBasic) || norm(dBasic) !== norm(dSLF)) {
      throw new Error(
        `[FAIL] trial ${trial}: n=${n} edges=${JSON.stringify(edges)} src=${src}\n` +
          `naive=${norm(dNaive)} basic=${norm(dBasic)} slf=${norm(dSLF)}`,
      );
    }
  }
  console.log("[OK] 랜덤 교차검증 200회 (naive == basic == SLF)");
}

console.log("모든 검증 통과");
