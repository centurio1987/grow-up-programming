// SLF(Shortest Label First) 효과를 보여주기 위한 구체 수치 검증용 스크래치.
// "더 빠르게 만들 단서 찾기" / "단서를 최적화로 연결하기" 절의 예시 숫자를 실측한다.

type Edge = [number, number, number];

function adjOf(n: number, edges: Edge[]) {
  const adj: Array<Array<[number, number]>> = Array.from({ length: n }, () => []);
  for (const [u, v, w] of edges) adj[u].push([v, w]);
  return adj;
}

function spfaBasicCount(n: number, edges: Edge[], src: number) {
  const adj = adjOf(n, edges);
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const inQueue = new Array(n).fill(false);
  const queue: number[] = [src];
  inQueue[src] = true;
  let pops = 0;
  const order: number[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    pops++;
    order.push(u);
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
  return { dist, pops, order };
}

function spfaSLFCount(n: number, edges: Edge[], src: number) {
  const adj = adjOf(n, edges);
  const dist = new Array(n).fill(Infinity);
  dist[src] = 0;
  const inQueue = new Array(n).fill(false);
  const deque: number[] = [src];
  inQueue[src] = true;
  let pops = 0;
  const order: number[] = [];
  while (deque.length > 0) {
    const u = deque.shift()!;
    pops++;
    order.push(u);
    inQueue[u] = false;
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        if (!inQueue[v]) {
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
  return { dist, pops, order };
}

const n = 7;
const edges: Edge[] = [
  [0, 1, 100],
  [0, 2, 1],
  [2, 1, 1],
  [1, 3, 1],
  [3, 4, 1],
  [4, 5, 1],
  [5, 6, 1],
];

const basic = spfaBasicCount(n, edges, 0);
const slf = spfaSLFCount(n, edges, 0);

console.log("basic dist:", basic.dist, "pops:", basic.pops, "order:", basic.order);
console.log("slf   dist:", slf.dist, "pops:", slf.pops, "order:", slf.order);

if (basic.dist.join(",") !== slf.dist.join(",")) {
  throw new Error("dist mismatch between basic and SLF!");
}
console.log("dist 일치 확인, pops 비교:", basic.pops, "vs", slf.pops);
