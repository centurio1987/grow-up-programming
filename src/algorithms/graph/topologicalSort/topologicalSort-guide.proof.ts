/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/topologicalSort/topologicalSort-guide.md
 *
 * **세는 사본이 넷 있다**(`bruteForce`·`scanEdges`·`scanArray`·`withContainer`). 정본은 몇
 * 칸을 읽었는지를 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 아래 표의 「결과」 칸 중 옳은 쪽은 전부
 * 정본이나 정본에서 기계로 만든 변이가 낸 값이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { topologicalSort } from "./topologicalSort-guide.ref.ts";

type Edge = [number, number];

/**
 * 본문 전개가 쓰는 고정 입력. 출발 후보가 둘(4·5)이고, 정점 0 과 1 은 선행 정점이 둘씩이라
 * 「줄였는데 아직 0 이 아니다」 갈래가 실제로 실행된다.
 */
const WALK_N = 6;
const WALK_EDGES: Edge[] = [
  [5, 2],
  [5, 0],
  [4, 0],
  [4, 1],
  [2, 3],
  [3, 1],
];

/** 마름모 그래프. 유효한 순서가 둘이라 「답이 하나가 아니다」를 보이는 자리다. */
const DIAMOND_N = 4;
const DIAMOND_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
];

/** 정점 `v` 개를 한 줄로 이은 유향 그래프 — `0 → 1 → … → v-1`. */
function chain(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) out.push([i, i + 1]);
  return out;
}

/** 정점 0 이 나머지 전부를 가리키는 그래프. */
function star(v: number): Edge[] {
  const out: Edge[] = [];
  for (let i = 1; i < v; i++) out.push([0, i]);
  return out;
}

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** `[4, 5, 2, 0, 3, 1]` 꼴 — 본문 표기와 같다. `null` 은 그대로 적는다. */
const show = (xs: number[] | null): string =>
  xs === null ? "null" : `[${xs.join(", ")}]`;

/** `1,299,994` 꼴 — 본문 표기와 같다. */
const comma = (n: number): string => n.toLocaleString("en-US");

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((cell, c) =>
        alignRight.includes(c)
          ? padLeft(cell, widths[c] ?? 0)
          : pad(cell, widths[c] ?? 0),
      )
      .join("   ")
      .replace(/\s+$/, ""),
  );
}

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

/** 순열 하나가 모든 간선의 방향을 지키는가. 읽은 간선 끝점 수도 함께 돌려준다. */
function isValid(
  order: number[],
  edges: Edge[],
): { ok: boolean; reads: number } {
  const at: number[] = Array.from({ length: order.length }, () => -1);
  for (const [i, v] of order.entries()) at[v] = i;
  let reads = 0;
  for (const [u, v] of edges) {
    reads += 2;
    if ((at[u] as number) >= (at[v] as number)) return { ok: false, reads };
  }
  return { ok: true, reads };
}

/**
 * 가장 단순한 방법 — 정점의 **모든 순열**을 사전순으로 만들어 하나씩 검사하고, 처음으로
 * 모든 간선을 지키는 것이 나오면 멈춘다. 기법이 하나도 안 들어간 풀이다.
 */
function bruteForce(n: number, edges: Edge[]) {
  const perm: number[] = [];
  const used: boolean[] = Array.from({ length: n }, () => false);
  let tried = 0;
  let reads = 0;
  let answer: number[] | null = null;

  const walk = (): void => {
    if (answer !== null) return;
    if (perm.length === n) {
      tried++;
      const r = isValid(perm, edges);
      reads += r.reads;
      if (r.ok) answer = [...perm];
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] === true) continue;
      used[v] = true;
      perm.push(v);
      walk();
      perm.pop();
      used[v] = false;
      if (answer !== null) return;
    }
  };
  walk();
  return { answer, tried, reads };
}

/** 유효한 순열이 모두 몇 개인가. 정점 수가 작을 때만 쓴다. */
function countValid(n: number, edges: Edge[]): number {
  const perm: number[] = [];
  const used: boolean[] = Array.from({ length: n }, () => false);
  let found = 0;
  const walk = (): void => {
    if (perm.length === n) {
      if (isValid(perm, edges).ok) found++;
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] === true) continue;
      used[v] = true;
      perm.push(v);
      walk();
      perm.pop();
      used[v] = false;
    }
  };
  walk();
  return found;
}

/**
 * 방식 A — 남은 선행 정점 수를 세어 두지 않고, 한 자리를 정할 때마다 **간선 목록 전체**를
 * 다시 읽어 「아직 안 뺀 정점 중 도착점으로 한 번도 안 나오는 것」을 찾는다.
 */
function scanEdges(n: number, edges: Edge[]) {
  const done: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  let reads = 0;

  for (let round = 0; round < n; round++) {
    const blocked: boolean[] = Array.from({ length: n }, () => false);
    for (const [u, v] of edges) {
      reads += 2;
      if (done[u] === false) blocked[v] = true;
    }
    let pick = -1;
    for (let v = 0; v < n; v++) {
      reads++;
      if (done[v] === false && blocked[v] === false) {
        pick = v;
        break;
      }
    }
    if (pick < 0) return { order: null, reads };
    done[pick] = true;
    order.push(pick);
  }
  return { order, reads };
}

/**
 * 방식 B — 남은 선행 정점 수를 배열에 세어 두되, 그 값이 0 인 정점을 찾을 때마다 **배열
 * 전체를 앞에서부터** 다시 읽는다. `deep.build` ⑤ 가 먼저 시험하는 후보다.
 */
function scanArray(n: number, edges: Edge[]) {
  const next: number[][] = Array.from({ length: n }, () => []);
  const remaining: number[] = Array.from({ length: n }, () => 0);
  let reads = 0;
  for (const [u, v] of edges) {
    reads += 2;
    (next[u] as number[]).push(v);
    remaining[v] = (remaining[v] as number) + 1;
  }

  const done: boolean[] = Array.from({ length: n }, () => false);
  const order: number[] = [];
  for (let round = 0; round < n; round++) {
    let pick = -1;
    for (let v = 0; v < n; v++) {
      reads++;
      if (done[v] === false && remaining[v] === 0) {
        pick = v;
        break;
      }
    }
    if (pick < 0) return { order: null, reads };
    done[pick] = true;
    order.push(pick);
    for (const v of next[pick] as number[]) {
      reads++;
      remaining[v] = (remaining[v] as number) - 1;
    }
  }
  return { order, reads };
}

type Container = "큐" | "스택" | "최소 힙";

/**
 * 방식 C — 값이 0 이 **되는 그 자리**에서 후보 통에 담는다. 통을 셋 중 하나로 갈아 끼워
 * 결과와 계수가 어떻게 갈리는지 본다. `큐` 가 정본과 같은 조합이다.
 */
function withContainer(n: number, edges: Edge[], kind: Container) {
  const next: number[][] = Array.from({ length: n }, () => []);
  const remaining: number[] = Array.from({ length: n }, () => 0);
  let reads = 0;
  for (const [u, v] of edges) {
    reads += 2;
    (next[u] as number[]).push(v);
    remaining[v] = (remaining[v] as number) + 1;
  }

  const pool: number[] = [];
  for (let v = 0; v < n; v++) {
    reads++;
    if (remaining[v] === 0) pool.push(v);
  }

  const take = (): number => {
    if (kind === "큐") return pool.shift() as number;
    if (kind === "스택") return pool.pop() as number;
    // 최소 힙 — 여기서는 남은 후보 전체를 읽어 최솟값을 고르는 것으로 대신한다.
    let best = 0;
    for (let i = 1; i < pool.length; i++) {
      reads++;
      if ((pool[i] as number) < (pool[best] as number)) best = i;
    }
    return pool.splice(best, 1)[0] as number;
  };

  const order: number[] = [];
  while (pool.length > 0) {
    const u = take();
    order.push(u);
    for (const v of next[u] as number[]) {
      reads++;
      remaining[v] = (remaining[v] as number) - 1;
      if (remaining[v] === 0) pool.push(v);
    }
  }
  return { order: order.length === n ? order : null, reads };
}

/** 정본과 같은 절차. 읽고 쓴 배열 칸만 덧붙여 센다 — `deep.math` 의 닫힌 형태와 맞춘다. */
function countCells(n: number, edges: Edge[]): number {
  let cells = 0;
  const next: number[][] = Array.from({ length: n }, () => []);
  cells += n;
  const remaining: number[] = Array.from({ length: n }, () => 0);
  cells += n;
  for (const [u, v] of edges) {
    cells += 4;
    (next[u] as number[]).push(v);
    remaining[v] = (remaining[v] as number) + 1;
  }

  const queue: number[] = [];
  for (let v = 0; v < n; v++) {
    cells++;
    if (remaining[v] === 0) {
      queue.push(v);
      cells++;
    }
  }

  const order: number[] = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head] as number;
    cells += 3;
    head++;
    order.push(u);
    for (const v of next[u] as number[]) {
      cells += 2;
      remaining[v] = (remaining[v] as number) - 1;
      if (remaining[v] === 0) {
        queue.push(v);
        cells++;
      }
    }
  }
  return cells;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  topologicalSort(n: number, edges: Edge[]): number[] | null;
}

const REF_PATH = new URL("./topologicalSort-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 큐에 담는 조건 `remaining[v] === 0` 을 `<= 1` 로 바꾼 사본. 선행 정점이 아직 하나 남은
 * 정점이 큐에 들어간다. 씨앗을 담는 줄은 `for` 로 시작해서 이 정규식에 안 걸린다.
 */
const earlyPush = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /^\s+if \(remaining\[v\] === 0\) queue\.push\(v\);/,
    "      if ((remaining[v] as number) <= 1) queue.push(v);",
  ],
});

/** 들어오는 간선 대신 **나가는 간선**을 센 사본. `remaining[v]` 한 자리를 `remaining[u]` 로 바꿨다. */
const outDegree = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /remaining\[v\] = \(remaining\[v\] as number\) \+ 1;/,
    "remaining[u] = (remaining[u] as number) + 1;",
  ],
});

const MUTANT_CASES: { label: string; n: number; edges: Edge[] }[] = [
  { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
  { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
  { label: "한 줄로 이은 네 정점", n: 4, edges: chain(4) },
  { label: "간선이 없는 네 정점", n: 4, edges: [] },
];

const earlyRows = MUTANT_CASES.map((c) => ({
  label: c.label,
  correct: show(topologicalSort(c.n, c.edges)),
  broken: show(earlyPush.topologicalSort(c.n, c.edges)),
}));

// 하나도 안 갈리면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (earlyRows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「0 이 되기 전에 담으면 어긋난다」가 거짓이다",
  );
}

/* ────────────────────────── 블록 ────────────────────────── */

/** 순열 전수 검사가 제약 규모에서 몇 번을 검사하는가 — 수치 반박의 근거. */
const NAIVE_SCALE = [5, 10, 15, 20];

/** 초를 사람이 읽는 단위로. 값은 전부 계산해서 나온 것이다. */
function duration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(3)}초`;
  const days = seconds / 86_400;
  if (days < 365) return `${days.toFixed(1)}일`;
  return `${comma(Math.round(days / 365))}년`;
}

/** `V!` 의 자릿수. 로그를 더해서 낸다 — 큰 정수를 실제로 곱하지 않는다. */
function factorialDigits(v: number): number {
  let logSum = 0;
  for (let k = 2; k <= v; k++) logSum += Math.log10(k);
  return Math.floor(logSum) + 1;
}

export const PROOFS: Record<string, () => string> = {
  /** 순열을 전부 만들어 검사하면 제약 규모에서 얼마가 되는가. */
  "naive-scale": () => {
    const rows: string[][] = [
      [
        "정점 V",
        "순열 수 V!",
        "순열마다 간선 검사",
        "총 검사 수",
        "초당 1억 번 기준",
      ],
    ];
    for (const v of NAIVE_SCALE) {
      let perms = 1;
      for (let k = 2; k <= v; k++) perms *= k;
      const edges = v - 1;
      const checks = perms * edges;
      rows.push([
        comma(v),
        perms > 1e15 ? perms.toExponential(3) : comma(perms),
        comma(edges),
        checks > 1e15 ? checks.toExponential(3) : comma(checks),
        duration(checks / 1e8),
      ]);
    }
    const digits = factorialDigits(100_000);
    return `${table(rows, [0, 1, 2, 3, 4]).join("\n")}
        └ 정점이 100,000 개면 순열 수 V! 만 ${comma(digits)} 자리다`;
  },

  /** 전개 입력에 순열 전수 검사를 실제로 실행한 값. */
  "brute-walk": () => {
    const b = bruteForce(WALK_N, WALK_EDGES);
    const all = countValid(WALK_N, WALK_EDGES);
    return table(
      [
        ["", "값"],
        ["검사한 순열 수", comma(b.tried)],
        ["읽은 간선 끝점 수", comma(b.reads)],
        ["처음 찾은 유효한 순열", show(b.answer)],
        ["유효한 순열의 총 개수", `${comma(all)} / 720`],
      ],
      [1],
    ).join("\n");
  },

  /** 방식 A 와 방식 B 를 같은 두 입력에 걸어 읽은 원소 수를 나란히 센다. */
  "scan-vs-count": () => {
    const rows: string[][] = [
      ["", "여섯 정점에서 읽은 원소", "결과", "사슬 1,000 에서 읽은 원소"],
    ];
    const chain1000 = chain(1_000);
    const a = scanEdges(WALK_N, WALK_EDGES);
    const b = scanArray(WALK_N, WALK_EDGES);
    rows.push([
      "간선 목록을 매번 다시 읽는다",
      comma(a.reads),
      show(a.order),
      comma(scanEdges(1_000, chain1000).reads),
    ]);
    rows.push([
      "남은 선행 정점 수를 세어 둔다",
      comma(b.reads),
      show(b.order),
      comma(scanArray(1_000, chain1000).reads),
    ]);
    return table(rows, [1, 3]).join("\n");
  },

  /** 0 인 정점을 매 바퀴 다시 찾는가, 0 이 되는 자리에서 담는가. */
  "array-vs-queue": () => {
    const rows: string[][] = [["", "여섯 정점", "사슬 1,000", "사슬 10,000"]];
    rows.push([
      "매 바퀴 배열 전체를 다시 읽는다",
      comma(scanArray(WALK_N, WALK_EDGES).reads),
      comma(scanArray(1_000, chain(1_000)).reads),
      comma(scanArray(10_000, chain(10_000)).reads),
    ]);
    rows.push([
      "0 이 되는 자리에서 큐에 담는다",
      comma(withContainer(WALK_N, WALK_EDGES, "큐").reads),
      comma(withContainer(1_000, chain(1_000), "큐").reads),
      comma(withContainer(10_000, chain(10_000), "큐").reads),
    ]);
    return table(rows, [1, 2, 3]).join("\n");
  },

  /** 후보 통을 셋으로 갈아 끼운 결과와 계수. */
  "container-values": () => {
    const rows: string[][] = [
      [
        "후보 통",
        "여섯 정점의 결과",
        "유효한가",
        "마름모의 결과",
        "별 모양 1,000 에서 읽은 원소",
      ],
    ];
    for (const kind of ["큐", "스택", "최소 힙"] as Container[]) {
      const w = withContainer(WALK_N, WALK_EDGES, kind);
      const d = withContainer(DIAMOND_N, DIAMOND_EDGES, kind);
      rows.push([
        kind,
        show(w.order),
        w.order === null
          ? "—"
          : isValid(w.order, WALK_EDGES).ok
            ? "예"
            : "아니오",
        show(d.order),
        comma(withContainer(1_000, star(1_000), kind).reads),
      ]);
    }
    rows.push([
      "정본",
      show(topologicalSort(WALK_N, WALK_EDGES)),
      "예",
      show(topologicalSort(DIAMOND_N, DIAMOND_EDGES)),
      "—",
    ]);
    return table(rows, [4]).join("\n");
  },

  /** 들어오는 간선 대신 나가는 간선을 세면 어디서 갈리는가. */
  "mutant-out-degree": () =>
    table([
      ["", "들어오는 간선을 센다", "나가는 간선을 센다"],
      ...MUTANT_CASES.map((c) => [
        c.label,
        show(topologicalSort(c.n, c.edges)),
        show(outDegree.topologicalSort(c.n, c.edges)),
      ]),
    ]).join("\n"),

  /** 사이클이 있는 입력에서 큐가 비는 자리와 그때의 결과 길이. */
  "cycle-values": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      {
        label: "사이클만 있다 0→1→2→0",
        n: 3,
        edges: [
          [0, 1],
          [1, 2],
          [2, 0],
        ],
      },
      {
        label: "앞에 정점 하나 3→0, 사이클 0→1→2→0",
        n: 4,
        edges: [
          [3, 0],
          [0, 1],
          [1, 2],
          [2, 0],
        ],
      },
      { label: "자기 루프 0→0", n: 1, edges: [[0, 0]] },
      { label: "사이클이 없다 (전개 입력)", n: WALK_N, edges: WALK_EDGES },
    ];
    return table([
      ["입력", "큐가 담은 정점 수", "정점 수 n", "반환값"],
      ...cases.map((c) => {
        const got = topologicalSort(c.n, c.edges);
        const partial = withContainer(c.n, c.edges, "큐");
        // 큐가 담은 수는 반환값이 null 일 때도 세야 해서 사본에서 가져온다.
        const taken =
          partial.order === null
            ? countTaken(c.n, c.edges)
            : partial.order.length;
        return [c.label, String(taken), String(c.n), show(got)];
      }),
    ]).join("\n");
  },

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const cases: { call: string; run: () => number[] | null }[] = [
      {
        call: "topologicalSort(6, [[5,2],[5,0],[4,0],[4,1],[2,3],[3,1]])",
        run: () => topologicalSort(WALK_N, WALK_EDGES),
      },
      {
        call: "topologicalSort(4, [[0,1],[0,2],[1,3],[2,3]])",
        run: () => topologicalSort(DIAMOND_N, DIAMOND_EDGES),
      },
      {
        call: "topologicalSort(4, [[0,1],[1,2],[2,3]])",
        run: () => topologicalSort(4, chain(4)),
      },
      { call: "topologicalSort(4, [])", run: () => topologicalSort(4, []) },
      {
        call: "topologicalSort(3, [[0,1],[1,2],[2,0]])",
        run: () =>
          topologicalSort(3, [
            [0, 1],
            [1, 2],
            [2, 0],
          ]),
      },
      {
        call: "topologicalSort(1, [[0,0]])",
        run: () => topologicalSort(1, [[0, 0]]),
      },
      { call: "topologicalSort(1, [])", run: () => topologicalSort(1, []) },
    ];
    return table(cases.map((c) => [c.call, "→", show(c.run())])).join("\n");
  },

  /**
   * 「어긋난다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다 — 옛 이해 시험 `V5` 가
   * 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만 달라도 잡는다.
   */
  "mutant-early-push": () =>
    table([
      ["", "0 이 될 때만 담는다", "1 이 남아도 담는다"],
      ...earlyRows.map((r) => [r.label, r.correct, r.broken]),
    ]).join("\n"),

  /** 닫힌 형태 `7V + 6E` 가 실제 계수와 같은지 대조한다. */
  "cost-closed-form": () => {
    const cases: { label: string; n: number; edges: Edge[] }[] = [
      { label: "전개가 쓰는 여섯 정점", n: WALK_N, edges: WALK_EDGES },
      { label: "마름모 네 정점", n: DIAMOND_N, edges: DIAMOND_EDGES },
      { label: "사슬 1,000", n: 1_000, edges: chain(1_000) },
      { label: "별 모양 1,000", n: 1_000, edges: star(1_000) },
      { label: "사슬 100,000", n: 100_000, edges: chain(100_000) },
    ];
    return table(
      [
        ["입력", "V", "E", "실제 배열 칸 접근", "7V + 6E"],
        ...cases.map((c) => [
          c.label,
          comma(c.n),
          comma(c.edges.length),
          comma(countCells(c.n, c.edges)),
          comma(7 * c.n + 6 * c.edges.length),
        ]),
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** 같은 V·E 에서 모양을 바꾸면 계수가 갈리는가. */
  "shape-values": () => {
    const V = 100_000;
    const shapes: { label: string; edges: Edge[] }[] = [
      { label: "사슬 0→1→…→99,999", edges: chain(V) },
      { label: "별 모양 0 이 나머지 전부를 가리킨다", edges: star(V) },
      {
        // 사슬의 마지막 간선을 빼고 `2 → 0` 을 넣어 간선 수를 맞춘 것이다.
        label: "0→1→2→0 사이클이 앞을 막는다",
        edges: [...chain(V).slice(0, V - 2), [2, 0] as Edge],
      },
    ];
    return table(
      [
        ["입력 모양", "V", "E", "배열 칸 접근", "결과에 들어간 정점"],
        ...shapes.map((s) => {
          const got = topologicalSort(V, s.edges);
          return [
            s.label,
            comma(V),
            comma(s.edges.length),
            comma(countCells(V, s.edges)),
            got === null ? "0 (null 을 반환한다)" : comma(got.length),
          ];
        }),
      ],
      [1, 2, 3],
    ).join("\n");
  },
};

/** 큐가 실제로 담은 정점 수. 반환값이 `null` 이어도 세야 해서 따로 센다. */
function countTaken(n: number, edges: Edge[]): number {
  const next: number[][] = Array.from({ length: n }, () => []);
  const remaining: number[] = Array.from({ length: n }, () => 0);
  for (const [u, v] of edges) {
    (next[u] as number[]).push(v);
    remaining[v] = (remaining[v] as number) + 1;
  }
  const queue: number[] = [];
  for (let v = 0; v < n; v++) if (remaining[v] === 0) queue.push(v);
  let head = 0;
  while (head < queue.length) {
    const u = queue[head] as number;
    head++;
    for (const v of next[u] as number[]) {
      remaining[v] = (remaining[v] as number) - 1;
      if (remaining[v] === 0) queue.push(v);
    }
  }
  return queue.length;
}
