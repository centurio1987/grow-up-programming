// ===== 출발점: 순열 대입 naive =====
function isIsomorphicByPermutation(
  n: number,
  edges1: [number, number][],
  edges2: [number, number][]
): boolean {
  const edgeSet2 = new Set(
    edges2.map(([u, v]) => (u < v ? `${u},${v}` : `${v},${u}`))
  );
  const perm = Array.from({ length: n }, (_, i) => i);

  function tryPermutations(k: number): boolean {
    if (k === n) {
      for (const [u, v] of edges1) {
        const a = perm[u]!;
        const b = perm[v]!;
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        if (!edgeSet2.has(key)) return false;
      }
      return true;
    }
    for (let i = k; i < n; i++) {
      [perm[k], perm[i]] = [perm[i]!, perm[k]!];
      if (tryPermutations(k + 1)) return true;
      [perm[k], perm[i]] = [perm[i]!, perm[k]!];
    }
    return false;
  }

  return tryPermutations(0);
}

// ===== 공통: 인접 리스트, 중심 탐색 =====
function buildAdjacency(n: number, edges: [number, number][]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u]!.push(v);
    adj[v]!.push(u);
  }
  return adj;
}

function findCenters(n: number, adj: number[][]): number[] {
  const degree = adj.map((list) => list.length);
  const removed = new Array<boolean>(n).fill(false);
  let leaves: number[] = [];
  for (let v = 0; v < n; v++) if (degree[v] === 1) leaves.push(v);
  let remaining = n;
  while (remaining > 2) {
    const next: number[] = [];
    for (const v of leaves) {
      removed[v] = true;
      remaining--;
      for (const u of adj[v]!) {
        if (!removed[u]) {
          degree[u]!--;
          if (degree[u] === 1) next.push(u);
        }
      }
    }
    leaves = next;
  }
  return leaves;
}

// ===== 아이디어를 코드로 옮기기: 문자열 정규형 (기본 구현) =====
function encodeStringForm(adj: number[][], root: number): string {
  const n = adj.length;
  const parent = new Array<number>(n).fill(-1);
  const order: number[] = [];
  const visited = new Array<boolean>(n).fill(false);
  const stack: number[] = [root];
  visited[root] = true;
  while (stack.length > 0) {
    const v = stack.pop()!;
    order.push(v);
    for (const u of adj[v]!) {
      if (!visited[u]) {
        visited[u] = true;
        parent[u] = v;
        stack.push(u);
      }
    }
  }
  const canon = new Array<string>(n).fill("");
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i]!;
    const childForms: string[] = [];
    for (const u of adj[v]!) {
      if (u !== parent[v]) childForms.push(canon[u]!);
    }
    childForms.sort();
    canon[v] = "(" + childForms.join("") + ")";
  }
  return canon[root]!;
}

function treeIsomorphismBasic(
  n: number,
  edges1: [number, number][],
  edges2: [number, number][]
): boolean {
  if (n === 1) return true;
  const adj1 = buildAdjacency(n, edges1);
  const adj2 = buildAdjacency(n, edges2);
  const centers1 = findCenters(n, adj1);
  const centers2 = findCenters(n, adj2);
  const form1 = encodeStringForm(adj1, centers1[0]!);
  for (const c2 of centers2) {
    if (encodeStringForm(adj2, c2) === form1) return true;
  }
  return false;
}

// ===== 최적화 코드: 정수 라벨 정규형 =====
function encodeLabeled(
  adj: number[][],
  root: number,
  labelOf: Map<string, number>
): number {
  const n = adj.length;
  const parent = new Array<number>(n).fill(-1);
  const order: number[] = [];
  const visited = new Array<boolean>(n).fill(false);
  const stack: number[] = [root];
  visited[root] = true;
  while (stack.length > 0) {
    const v = stack.pop()!;
    order.push(v);
    for (const u of adj[v]!) {
      if (!visited[u]) {
        visited[u] = true;
        parent[u] = v;
        stack.push(u);
      }
    }
  }
  const label = new Array<number>(n).fill(-1);
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i]!;
    const childLabels: number[] = [];
    for (const u of adj[v]!) {
      if (u !== parent[v]) childLabels.push(label[u]!);
    }
    childLabels.sort((a, b) => a - b);
    const key = childLabels.join(",");
    let id = labelOf.get(key);
    if (id === undefined) {
      id = labelOf.size;
      labelOf.set(key, id);
    }
    label[v] = id;
  }
  return label[root]!;
}

function treeIsomorphism(
  n: number,
  edges1: [number, number][],
  edges2: [number, number][]
): boolean {
  if (n === 1) return true;
  const adj1 = buildAdjacency(n, edges1);
  const adj2 = buildAdjacency(n, edges2);
  const centers1 = findCenters(n, adj1);
  const centers2 = findCenters(n, adj2);

  const labelOf = new Map<string, number>(); // 두 트리가 공유하는 라벨 사전
  const id1 = encodeLabeled(adj1, centers1[0]!, labelOf);
  for (const c2 of centers2) {
    if (encodeLabeled(adj2, c2, labelOf) === id1) return true;
  }
  return false;
}

// ================= 검증 =================
console.log("=== naive 실행 (n=4 시뮬 입력) ===");
console.log(
  isIsomorphicByPermutation(
    4,
    [
      [0, 1],
      [1, 2],
      [1, 3],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 3],
    ]
  )
);

console.log("=== 시뮬레이션 입력 트레이스 ===");
{
  const n = 4;
  const edges1: [number, number][] = [
    [0, 1],
    [1, 2],
    [1, 3],
  ];
  const edges2: [number, number][] = [
    [2, 0],
    [2, 1],
    [2, 3],
  ];
  const adj1 = buildAdjacency(n, edges1);
  const adj2 = buildAdjacency(n, edges2);
  const centers1 = findCenters(n, adj1);
  const centers2 = findCenters(n, adj2);
  console.log("centers1", centers1, "centers2", centers2);
  console.log("degree1", adj1.map((l) => l.length));
  console.log("degree2", adj2.map((l) => l.length));
  const form1 = encodeStringForm(adj1, centers1[0]!);
  const form2 = encodeStringForm(adj2, centers2[0]!);
  console.log("form1", form1, "form2", form2);
  console.log("basic result", treeIsomorphismBasic(n, edges1, edges2));
  console.log("optimized result", treeIsomorphism(n, edges1, edges2));
}

console.log("=== 문제 예시 검증 ===");
console.log(
  "예시1(true 기대)",
  treeIsomorphism(
    4,
    [
      [0, 1],
      [0, 2],
      [1, 3],
    ],
    [
      [2, 0],
      [2, 1],
      [1, 3],
    ]
  )
);
console.log(
  "예시2(false 기대)",
  treeIsomorphism(
    4,
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
    [
      [0, 1],
      [0, 2],
      [0, 3],
    ]
  )
);
console.log("예시3(n=1, true 기대)", treeIsomorphism(1, [], []));
console.log(
  "예시4(스타 두 개, true 기대)",
  treeIsomorphism(
    5,
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    [
      [4, 0],
      [4, 1],
      [4, 2],
      [4, 3],
    ]
  )
);
console.log(
  "예시5(가지 분기 위치 다름, false 기대)",
  treeIsomorphism(
    5,
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
    ],
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ]
  )
);
console.log(
  "예시6(n=2, true 기대)",
  treeIsomorphism(2, [[0, 1]], [[1, 0]])
);

console.log("=== 엣지: 중심 2개(짝수 체인) ===");
{
  // 체인 0-1-2-3 (중심: 1,2), 체인 3-2-1-0 라벨만 반대로 재배치한 것과 동일 구조
  const n = 4;
  const chain: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
  ];
  const chainShift: [number, number][] = [
    [3, 2],
    [2, 1],
    [1, 0],
  ];
  console.log("centers(chain)", findCenters(n, buildAdjacency(n, chain)));
  console.log("동형 여부(true 기대)", treeIsomorphism(n, chain, chainShift));
}

console.log("=== 기본 구현 vs naive: 값 일치 무작위 교차검증 ===");
function randomTreeEdges(n: number, seed: number): [number, number][] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const edges: [number, number][] = [];
  for (let v = 1; v < n; v++) {
    const p = Math.floor(rand() * v);
    edges.push([p, v]);
  }
  return edges;
}
function shuffleRelabel(
  n: number,
  edges: [number, number][],
  seed: number
): [number, number][] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const perm = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j]!, perm[i]!];
  }
  return edges.map(([u, v]) => [perm[u]!, perm[v]!]);
}

for (let trial = 0; trial < 8; trial++) {
  const n = 3 + (trial % 6); // 3..8 (naive는 n! 이라 작게)
  const base = randomTreeEdges(n, 17 + trial * 7);
  const relabeled = shuffleRelabel(n, base, 31 + trial * 13);
  const viaNaive = isIsomorphicByPermutation(n, base, relabeled);
  const viaBasic = treeIsomorphismBasic(n, base, relabeled);
  const viaOpt = treeIsomorphism(n, base, relabeled);
  console.log(
    `trial=${trial} n=${n} naive=${viaNaive} basic=${viaBasic} opt=${viaOpt} 일치=${
      viaNaive === viaBasic && viaBasic === viaOpt
    }`
  );
  if (viaNaive !== true || viaBasic !== true || viaOpt !== true) {
    console.log("  !! 재배치는 항상 동형이어야 하는데 불일치 발견", {
      base,
      relabeled,
    });
  }
}

console.log("=== 비동형 무작위 케이스(체인 vs 임의 트리, n=6) ===");
{
  const n = 6;
  const chain: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ];
  const star: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
  ];
  console.log(
    "chain vs star (false 기대)",
    isIsomorphicByPermutation(n, chain, star),
    treeIsomorphismBasic(n, chain, star),
    treeIsomorphism(n, chain, star)
  );
}

console.log("=== 더 빠르게 만들 단서: 체인에서 문자열 길이 폭증 관찰 ===");
console.log("n=1 center=[0] formLength=2 (특수 처리: canon='()')");
for (const n of [2, 3, 4, 5, 6, 20, 50]) {
  const edges: [number, number][] = [];
  for (let i = 0; i + 1 < n; i++) edges.push([i, i + 1]);
  const adj = buildAdjacency(n, edges);
  const centers = findCenters(n, adj);
  const form = encodeStringForm(adj, centers[0]!);
  console.log(`n=${n} center=${centers} formLength=${form.length}`);
}

console.log(
  "=== 더 빠르게 만들 단서: 문자열 결합에서 실제로 복사되는 총 글자 수 ==="
);
function encodeStringFormCounting(
  adj: number[][],
  root: number
): { form: string; copiedChars: number } {
  const n = adj.length;
  const parent = new Array<number>(n).fill(-1);
  const order: number[] = [];
  const visited = new Array<boolean>(n).fill(false);
  const stack: number[] = [root];
  visited[root] = true;
  while (stack.length > 0) {
    const v = stack.pop()!;
    order.push(v);
    for (const u of adj[v]!) {
      if (!visited[u]) {
        visited[u] = true;
        parent[u] = v;
        stack.push(u);
      }
    }
  }
  const canon = new Array<string>(n).fill("");
  let copiedChars = 0;
  for (let i = order.length - 1; i >= 0; i--) {
    const v = order[i]!;
    const childForms: string[] = [];
    for (const u of adj[v]!) {
      if (u !== parent[v]) childForms.push(canon[u]!);
    }
    childForms.sort();
    const joined = childForms.join("");
    copiedChars += joined.length; // "(" + joined + ")" 를 만들 때 joined 만큼 복사
    canon[v] = "(" + joined + ")";
  }
  return { form: canon[root]!, copiedChars };
}
for (const n of [10, 100, 1000, 4000]) {
  const edges: [number, number][] = [];
  for (let i = 0; i + 1 < n; i++) edges.push([i, i + 1]);
  const adj = buildAdjacency(n, edges);
  const centers = findCenters(n, adj);
  const { copiedChars } = encodeStringFormCounting(adj, centers[0]!);
  console.log(
    `n=${n} 총 복사 글자수=${copiedChars} (n^2 대비 비율=${(
      copiedChars / (n * n)
    ).toFixed(3)}, n 대비 배율=${(copiedChars / n).toFixed(1)})`
  );
}

console.log("=== labelOf 공유 안 하면 틀리는 함정 재현 ===");
{
  // 서로 다른 4가지 서브트리 모양이 섞인 트리를 만들어, 두 트리를 독립된 맵으로
  // 인코딩했을 때 뿌리 id가 어긋나는 구체 사례를 찾는다.
  function randomShapedTree(n: number, seed: number): [number, number][] {
    let s = seed;
    const rand = () => {
      s = (s * 48271) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const edges: [number, number][] = [];
    for (let v = 1; v < n; v++) {
      // 편향된 부모 선택으로 다양한 모양(체인+분기)을 유도
      const p = Math.floor(rand() * rand() * v);
      edges.push([p, v]);
    }
    return edges;
  }

  let found: {
    n: number;
    edges1: [number, number][];
    edges2: [number, number][];
    sharedEq: boolean;
    separateEq: boolean;
  } | null = null;

  for (let n = 10; n <= 16 && !found; n++) {
    for (let seed = 1; seed <= 40 && !found; seed++) {
      const base = randomShapedTree(n, seed);
      for (let relabelSeed = 1; relabelSeed <= 15 && !found; relabelSeed++) {
        const relabeled = shuffleRelabel(n, base, relabelSeed * 97 + 3);
        // 간선 나열 순서까지 흔들어 인접 리스트 삽입 순서를 바꾼다
        const shuffledOrder = [...relabeled];
        let ss = relabelSeed * 131 + 7;
        const r2 = () => {
          ss = (ss * 48271) % 2147483647;
          return (ss - 1) / 2147483646;
        };
        for (let i = shuffledOrder.length - 1; i > 0; i--) {
          const j = Math.floor(r2() * (i + 1));
          [shuffledOrder[i], shuffledOrder[j]] = [
            shuffledOrder[j]!,
            shuffledOrder[i]!,
          ];
        }

        const adj1 = buildAdjacency(n, base);
        const adj2 = buildAdjacency(n, shuffledOrder);
        const centers1 = findCenters(n, adj1);
        const centers2 = findCenters(n, adj2);

        const sharedMap = new Map<string, number>();
        const sId1 = encodeLabeled(adj1, centers1[0]!, sharedMap);
        const sId2 = encodeLabeled(adj2, centers2[0]!, sharedMap);

        const sep1 = new Map<string, number>();
        const sep2 = new Map<string, number>();
        const dId1 = encodeLabeled(adj1, centers1[0]!, sep1);
        const dId2 = encodeLabeled(adj2, centers2[0]!, sep2);

        if (sId1 === sId2 && dId1 !== dId2) {
          found = {
            n,
            edges1: base,
            edges2: shuffledOrder,
            sharedEq: sId1 === sId2,
            separateEq: dId1 === dId2,
          };
        }
      }
    }
  }

  if (found) {
    console.log(
      `발견(위양성 방향): n=${found.n}, 공유 맵 결과 일치=${found.sharedEq}, 독립 맵 결과 일치=${found.separateEq}`
    );
    console.log("edges1", JSON.stringify(found.edges1));
    console.log("edges2", JSON.stringify(found.edges2));
    console.log(
      "naive로 실제 동형 여부 재확인:",
      isIsomorphicByPermutation(found.n, found.edges1, found.edges2)
    );
  } else {
    console.log("탐색 범위 안에서 위양성 반례를 찾지 못함");
  }

  // 반대 방향: 서로 다른(비동형) 두 트리를 독립된 맵으로 인코딩했을 때
  // 우연히 같은 정수 id로 충돌하는지 탐색한다 (거짓 양성 시나리오).
  let falsePositive: {
    n: number;
    edges1: [number, number][];
    edges2: [number, number][];
    id1: number;
    id2: number;
  } | null = null;
  for (let n = 6; n <= 12 && !falsePositive; n++) {
    for (let seed1 = 1; seed1 <= 25 && !falsePositive; seed1++) {
      for (let seed2 = 1; seed2 <= 25 && !falsePositive; seed2++) {
        const eA = randomShapedTree(n, seed1 * 991 + 1);
        const eB = randomShapedTree(n, seed2 * 733 + 500);
        const adjA = buildAdjacency(n, eA);
        const adjB = buildAdjacency(n, eB);
        const cA = findCenters(n, adjA);
        const cB = findCenters(n, adjB);
        const mapA = new Map<string, number>();
        const mapB = new Map<string, number>();
        const idA = encodeLabeled(adjA, cA[0]!, mapA);
        const idB = encodeLabeled(adjB, cB[0]!, mapB);
        if (idA === idB) {
          const actuallyIso = isIsomorphicByPermutation(n, eA, eB);
          if (!actuallyIso) {
            falsePositive = { n, edges1: eA, edges2: eB, id1: idA, id2: idB };
          }
        }
      }
    }
  }
  if (falsePositive) {
    console.log(
      `발견(독립 맵의 우연한 충돌): n=${falsePositive.n}, id1=${falsePositive.id1}, id2=${falsePositive.id2} (실제로는 비동형인데도 정수 id가 같음)`
    );
    console.log("edges1", JSON.stringify(falsePositive.edges1));
    console.log("edges2", JSON.stringify(falsePositive.edges2));

    const { n, edges1, edges2 } = falsePositive;
    const adj1 = buildAdjacency(n, edges1);
    const adj2 = buildAdjacency(n, edges2);
    const centers1 = findCenters(n, adj1);
    const centers2 = findCenters(n, adj2);
    console.log("centers1", centers1, "centers2", centers2);
    console.log(
      "degree1",
      adj1.map((l) => l.length)
    );
    console.log(
      "degree2",
      adj2.map((l) => l.length)
    );
    console.log(
      "naive 정답(false 기대)",
      isIsomorphicByPermutation(n, edges1, edges2)
    );
    const sharedMap = new Map<string, number>();
    const gId1 = encodeLabeled(adj1, centers1[0]!, sharedMap);
    let sharedMatch = false;
    for (const c2 of centers2) {
      if (encodeLabeled(adj2, c2, sharedMap) === gId1) sharedMatch = true;
    }
    console.log("공유 맵을 쓰는 최종 알고리즘의 판정(false 기대)", sharedMatch);
  } else {
    console.log("탐색 범위 안에서 정수 id 충돌 반례를 찾지 못함");
  }
}

console.log("=== 임의 루트(중심 아님) vs 중심 루팅 비교 ===");
{
  const n = 4;
  const edges1: [number, number][] = [[0,1],[1,2],[1,3]];
  const edges2: [number, number][] = [[2,0],[2,1],[2,3]];
  const adj1 = buildAdjacency(n, edges1);
  const adj2 = buildAdjacency(n, edges2);
  console.log("임의 루트(정점 0)로 인코딩:");
  console.log("  T1@root0:", encodeStringForm(adj1, 0));
  console.log("  T2@root0:", encodeStringForm(adj2, 0));
  const centers1 = findCenters(n, adj1);
  const centers2 = findCenters(n, adj2);
  console.log("중심 루팅으로 인코딩:");
  console.log(`  T1@center(${centers1[0]}):`, encodeStringForm(adj1, centers1[0]!));
  console.log(`  T2@center(${centers2[0]}):`, encodeStringForm(adj2, centers2[0]!));
}

console.log("=== 정렬 생략 시 오탐 재현 ===");
{
  // 자식 순서만 다른 두 동형 트리에서, 정렬 없이 결합하면 문자열이 달라짐을 보인다.
  const n = 4;
  const edges1: [number, number][] = [[1,0],[1,2],[1,3]]; // 중심 1, 자식 인접순서 0,2,3
  const edges2: [number, number][] = [[1,3],[1,2],[1,0]]; // 같은 트리, 간선 나열만 반대
  const adj1 = buildAdjacency(n, edges1);
  const adj2 = buildAdjacency(n, edges2);
  function encodeNoSort(adj: number[][], root: number): string {
    const nn = adj.length;
    const parent = new Array<number>(nn).fill(-1);
    const order: number[] = [];
    const visited = new Array<boolean>(nn).fill(false);
    const stack: number[] = [root];
    visited[root] = true;
    while (stack.length > 0) {
      const v = stack.pop()!;
      order.push(v);
      for (const u of adj[v]!) {
        if (!visited[u]) { visited[u] = true; parent[u] = v; stack.push(u); }
      }
    }
    const canon = new Array<string>(nn).fill("");
    for (let i = order.length - 1; i >= 0; i--) {
      const v = order[i]!;
      const childForms: string[] = [];
      for (const u of adj[v]!) { if (u !== parent[v]) childForms.push(canon[u]!); }
      // 정렬을 생략
      canon[v] = "(" + childForms.join("") + ")";
    }
    return canon[root]!;
  }
  console.log("정렬 없이 결합:", encodeNoSort(adj1, 1), "vs", encodeNoSort(adj2, 1));
  console.log("정렬 포함 결합:", encodeStringForm(adj1, 1), "vs", encodeStringForm(adj2, 1));
}

console.log("=== 임의 루트 실패 사례(비대칭 트리) ===");
{
  const n = 5;
  // T1: 0-1-2 체인에 2가 추가로 리프 3,4를 가짐 (허브=2)
  const edges1: [number, number][] = [[0,1],[1,2],[2,3],[2,4]];
  // T2: 정점 0<->2 라벨만 맞바꿔 같은 트리를 재배치 (허브=0)
  const edges2: [number, number][] = [[2,1],[1,0],[0,3],[0,4]];
  const adj1 = buildAdjacency(n, edges1);
  const adj2 = buildAdjacency(n, edges2);
  console.log("degree1", adj1.map(l => l.length), "degree2", adj2.map(l => l.length));
  console.log("정점 0을 그냥 루트로 고정:");
  console.log("  T1@root0:", encodeStringForm(adj1, 0));
  console.log("  T2@root0:", encodeStringForm(adj2, 0));
  const centers1 = findCenters(n, adj1);
  const centers2 = findCenters(n, adj2);
  console.log("centers1", centers1, "centers2", centers2);
  console.log("중심으로 루팅:");
  console.log(`  T1@center(${centers1[0]}):`, encodeStringForm(adj1, centers1[0]!));
  console.log(`  T2@center(${centers2[0]}):`, encodeStringForm(adj2, centers2[0]!));
  console.log("naive로 실제 동형 확인(true 기대):", isIsomorphicByPermutation(n, edges1, edges2));
}

console.log("=== 정렬 생략 재시도 (자식 모양이 다른 트리) ===");
{
  const n = 6;
  // 중심 5: 자식 0(리프), 자식1-2(단일 체인), 자식3-4? -> 재설계: 중심 노드에 리프 하나 + cherry 하나
  // edges: 5-0(leaf), 5-1, 1-2(단일체인의 잎), 5-3, 3-4(다른 단일체인)
  const edgesA: [number, number][] = [[5,0],[5,1],[1,2],[5,3],[3,4]];
  const edgesB: [number, number][] = [[5,3],[3,4],[5,1],[1,2],[5,0]]; // 간선 나열 순서만 반대
  function encodeNoSort(adj: number[][], root: number): string {
    const nn = adj.length;
    const parent = new Array<number>(nn).fill(-1);
    const order: number[] = [];
    const visited = new Array<boolean>(nn).fill(false);
    const stack: number[] = [root];
    visited[root] = true;
    while (stack.length > 0) {
      const v = stack.pop()!;
      order.push(v);
      for (const u of adj[v]!) {
        if (!visited[u]) { visited[u] = true; parent[u] = v; stack.push(u); }
      }
    }
    const canon = new Array<string>(nn).fill("");
    for (let i = order.length - 1; i >= 0; i--) {
      const v = order[i]!;
      const childForms: string[] = [];
      for (const u of adj[v]!) { if (u !== parent[v]) childForms.push(canon[u]!); }
      canon[v] = "(" + childForms.join("") + ")"; // 정렬 생략
    }
    return canon[root]!;
  }
  const adjA = buildAdjacency(n, edgesA);
  const adjB = buildAdjacency(n, edgesB);
  console.log("A,B는 같은 트리(간선 나열 순서만 다름). naive(true 기대):", isIsomorphicByPermutation(n, edgesA, edgesB));
  console.log("정렬 없이:", encodeNoSort(adjA, 5), "vs", encodeNoSort(adjB, 5));
  console.log("정렬 포함:", encodeStringForm(adjA, 5), "vs", encodeStringForm(adjB, 5));
}

console.log("=== 대규모 성능 측정 (n=100000, 체인) ===");
{
  const n = 100000;
  const edges1: [number, number][] = [];
  const edges2: [number, number][] = [];
  for (let i = 0; i + 1 < n; i++) {
    edges1.push([i, i + 1]);
    edges2.push([n - 1 - i, n - 2 - i]); // 역순으로 재배치한 같은 체인
  }
  const t0 = performance.now();
  const result = treeIsomorphism(n, edges1, edges2);
  const t1 = performance.now();
  console.log(`n=${n} 체인 결과=${result} 소요시간=${(t1 - t0).toFixed(1)}ms`);
}
console.log("=== 대규모 성능 측정 (n=100000, 스타) ===");
{
  const n = 100000;
  const edges1: [number, number][] = [];
  const edges2: [number, number][] = [];
  for (let i = 1; i < n; i++) {
    edges1.push([0, i]);
    edges2.push([i, 0]);
  }
  const t0 = performance.now();
  const result = treeIsomorphism(n, edges1, edges2);
  const t1 = performance.now();
  console.log(`n=${n} 스타 결과=${result} 소요시간=${(t1 - t0).toFixed(1)}ms`);
}

console.log("=== 기본 구현(문자열) 체인 성능: n에 따른 시간 ===");
for (const n of [2000, 4000, 8000, 16000]) {
  const edges1: [number, number][] = [];
  const edges2: [number, number][] = [];
  for (let i = 0; i + 1 < n; i++) {
    edges1.push([i, i + 1]);
    edges2.push([i, i + 1]);
  }
  const t0 = performance.now();
  const result = treeIsomorphismBasic(n, edges1, edges2);
  const t1 = performance.now();
  console.log(`n=${n} 결과=${result} 소요시간=${(t1 - t0).toFixed(1)}ms`);
}

console.log("=== 기본 구현(문자열) 체인 성능 확장: 배증 관찰 ===");
for (const n of [5000, 10000, 20000, 40000, 80000]) {
  const edges1: [number, number][] = [];
  for (let i = 0; i + 1 < n; i++) edges1.push([i, i + 1]);
  const edges2 = edges1.map(([a, b]) => [a, b] as [number, number]);
  const t0 = performance.now();
  treeIsomorphismBasic(n, edges1, edges2);
  const t1 = performance.now();
  console.log(`n=${n} 소요시간=${(t1 - t0).toFixed(1)}ms`);
}
