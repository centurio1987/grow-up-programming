/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/tree/heavyLightDecomposition/heavyLightDecomposition-guide.md
 *
 * **세는 사본과 트리 만들기는 `<name>-guide.alt.ts` 에 있다.** 정본은 배열 칸을 몇 번 읽었는지
 * 내보내지 않으므로 세는 자리만 덧붙인 사본이 필요한데, 그 사본을 이 파일과 대조 하네스가 각각
 * 한 벌씩 들면 계수 모델이 갈라진다. **답이 맞는지는 사본이 아니라 정본이 진다.**
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  binary,
  branchCounts,
  caterpillar,
  chain,
  decompose,
  type Edge,
  heightTrap,
  hldCounted,
  leafFirstCaterpillar,
  lightEdges,
  measure,
  naiveWalk,
  pathVertices,
  plainPos,
  runCount,
  segmentCount,
  star,
} from "./heavyLightDecomposition-guide.alt.ts";
import { HeavyLightDecomposition } from "./heavyLightDecomposition-guide.ref.ts";

const REF = new URL("./heavyLightDecomposition-guide.ref.ts", import.meta.url)
  .pathname;

/* ────────────────────────── 전개가 쓰는 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 갈래가 둘인 정점(0 과 2)이 있어 무거운 자식을 고르는 비교가
 * 실제로 실행되고, 질의 셋이 구간 수 1·3·2 를 각각 한 번씩 낸다.
 */
const WALK_N = 9;
const WALK_EDGES: Edge[] = [
  [0, 1],
  [0, 2],
  [1, 5],
  [5, 6],
  [2, 3],
  [2, 4],
  [4, 7],
  [7, 8],
];
const WALK_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Structure {
  update(node: number, value: number): void;
  queryPath(u: number, v: number): number;
}

type Ctor = new (
  n: number,
  edges: Edge[],
  root: number,
  values: number[],
) => Structure;

const REFCLASS: Ctor = HeavyLightDecomposition;

/** 전개가 쓰는 작업 목록 — 질의 · 질의 · 갱신 · 질의. */
function walkAnswers(Cls: Ctor): number[] {
  const h = new Cls(WALK_N, WALK_EDGES, 0, WALK_VALUES.slice());
  const out = [h.queryPath(0, 7), h.queryPath(3, 6)];
  h.update(4, 100);
  out.push(h.queryPath(8, 6));
  return out;
}

/** 어떤 트리에도 걸 수 있는 작업 목록. 질의 넷과 갱신 하나다. */
function probe(Cls: Ctor, v: number, edges: Edge[]): number[] {
  const values = Array.from({ length: v }, (_, i) => (i % 97) + 1);
  const h = new Cls(v, edges, 0, values);
  const pick = (i: number): [number, number] => [i % v, (37 * i) % v];
  const out: number[] = [];
  for (const i of [1, 2, 3]) {
    const [a, b] = pick(i);
    out.push(h.queryPath(a, b));
  }
  h.update(v - 1, 1000);
  const [a, b] = pick(4);
  out.push(h.queryPath(a, b));
  return out;
}

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

const comma = (n: number): string => n.toLocaleString("en-US");

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

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 무거운 자식을 크기가 아니라 **처음 만난 자식**으로 고른다. `best[p]` 가 0 인 것은 그 부모의
 * 자식을 아직 하나도 안 본 자리뿐이라, 조건을 이렇게 바꾸면 첫 자식만 뽑힌다.
 */
const FIRST_CHILD = (
  await loadMutant<{ HeavyLightDecomposition: Ctor }>(REF, {
    swap: [
      /if \(sw > \(best\[p\] as number\)\) \{/,
      "if ((best[p] as number) === 0) {",
    ],
  })
).HeavyLightDecomposition;

/** 사슬 머리의 깊이 대신 **정점 자신의 깊이**로 올릴 쪽을 고른다. */
const VERTEX_DEPTH = (
  await loadMutant<{ HeavyLightDecomposition: Ctor }>(REF, {
    swap: [
      /return this\.depth\[this\.head\[x\] as number\] as number;/,
      "return this.depth[x] as number;",
    ],
  })
).HeavyLightDecomposition;

/* ────────────────────────── 되풀이 쓰는 계산 ────────────────────────── */

const popcount = (x: number): number => {
  let n = x;
  let c = 0;
  while (n > 0) {
    c += n & 1;
    n >>>= 1;
  }
  return c;
};

/** 정점 쌍 전부에서 구간 수의 최댓값. 작은 트리에만 쓴다. */
function maxSegments(
  v: number,
  edges: Edge[],
  rule: "first" | "deep" | "size",
): number {
  const d = decompose(v, edges, 0, rule);
  let best = 0;
  for (let a = 0; a < v; a++) {
    for (let b = a; b < v; b++) best = Math.max(best, segmentCount(d, a, b));
  }
  return best;
}

/** 뿌리에서 어느 정점까지 가는 가벼운 간선 수의 최댓값. */
function maxLight(v: number, edges: Edge[]): number {
  const d = decompose(v, edges, 0, "size");
  let best = 0;
  for (let a = 0; a < v; a++) best = Math.max(best, lightEdges(d, a));
  return best;
}

const TRAP = heightTrap(15);

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 질의마다 경로를 걷는 방법의 비용. */
  "naive-walk": () => {
    const rows: string[][] = [
      ["사슬 정점 V", "경로 길이", "질의 하나의 배열 칸", "질의 V 개면"],
    ];
    for (const v of [9, 100, 1_000, 10_000, 100_000]) {
      const ones = Array.from({ length: v }, () => 1);
      const total = naiveWalk(v, chain(v), 0, ones, [[0, v - 1]]).cells;
      const pre = 3 * v + 2 * (v - 1);
      const per = total - pre;
      rows.push([comma(v), comma(v - 1), comma(per), comma(per * v)]);
    }
    const out = table(rows, [0, 1, 2, 3]);
    out.push(
      "        └ 전처리를 뺀 값이다. 사슬의 양 끝을 물으면 경로가 트리 전체가 된다",
    );
    return out.join("\n");
  },

  /** `deep.build` ④ — 자리 번호를 매기는 두 방식에서 경로가 갈리는 구간 수. */
  "numbering-runs": () => {
    const rows: string[][] = [
      [
        "애벌레 정점 V",
        "최대 덩어리 · 번호순",
        "최대 덩어리 · 크기순",
        "줄 양 끝 경로 · 번호순 대 크기순",
      ],
    ];
    for (const v of [16, 32, 64, 256]) {
      const edges = caterpillar(v);
      const d = decompose(v, edges, 0, "size");
      const plain = plainPos(v, edges, 0);
      let mp = 0;
      let mh = 0;
      for (let a = 0; a < v; a++) {
        for (let b = a; b < v; b++) {
          mp = Math.max(mp, runCount(d, plain, a, b));
          mh = Math.max(mh, runCount(d, d.pos, a, b));
        }
      }
      const end = v % 2 === 0 ? v - 2 : v - 1;
      rows.push([
        comma(v),
        comma(mp),
        comma(mh),
        `${runCount(d, plain, 0, end)} 대 ${runCount(d, d.pos, 0, end)}`,
      ]);
    }
    const out = table(rows, [0, 1, 2, 3]);
    out.push(
      "        └ 줄 위의 정점마다 잎이 하나씩 달린 트리다. 왼쪽 두 칸은 정점 쌍 전부에서 잰 최댓값이고,",
    );
    out.push("          오른쪽 칸은 줄의 양 끝을 잇는 경로 하나에서 잰 값이다");
    return out.join("\n");
  },

  /** `deep.build` ⑥ — 자식을 고르는 규칙 셋을 모양 다섯에 걸어 최대 구간 수를 잰다. */
  "rule-sweep": () => {
    const shapes: [string, number, Edge[]][] = [
      ["한 줄로 이었다", 255, chain(255)],
      ["별 모양이다", 255, star(255)],
      ["잎이 먼저 나오는 애벌레다", 255, leafFirstCaterpillar(255)],
      ["꽉 찬 이진 트리다", 255, binary(255)],
      ["높이 덫이다", TRAP.v, TRAP.edges],
    ];
    const rows: string[][] = [
      [
        "트리 모양",
        "정점 V",
        "처음 만난 자식",
        "가장 깊은 자식",
        "가장 큰 부분트리",
        "2⌊log₂V⌋+1",
      ],
    ];
    for (const [name, v, edges] of shapes) {
      rows.push([
        name,
        comma(v),
        comma(maxSegments(v, edges, "first")),
        comma(maxSegments(v, edges, "deep")),
        comma(maxSegments(v, edges, "size")),
        comma(2 * Math.floor(Math.log2(v)) + 1),
      ]);
    }
    const out = table(rows, [1, 2, 3, 4, 5]);
    out.push(
      "        └ 정점 쌍 전부에서 잰 최대 구간 수다. 오른쪽 끝 칸은 뒤에서 유도하는 상한이고,",
    );
    out.push(
      "          가장 큰 부분트리 규칙만 다섯 모양 전부에서 그 안쪽이다",
    );
    return out.join("\n");
  },

  /** `deep.walk` 1~2 — 1차 순회가 정한 값. */
  "walk-pass1": () => {
    const d = decompose(WALK_N, WALK_EDGES, 0, "size");
    const ids = [...Array(WALK_N).keys()];
    const rows: string[][] = [
      ["정점 v", ...ids.map(String)],
      ["깊이 depth[v]", ...ids.map((i) => String(d.depth[i]))],
      ["부모 parent[v]", ...ids.map((i) => String(d.parent[i]))],
      ["크기 size[v]", ...ids.map((i) => String(d.size[i]))],
      [
        "무거운 자식 heavy[v]",
        ...ids.map((i) =>
          (d.heavy[i] as number) === -1 ? "-" : String(d.heavy[i]),
        ),
      ],
    ];
    const out = table(
      rows,
      ids.map((i) => i + 1),
    );
    out.push("");
    out.push(`  꺼낸 순서   ${d.order.join(" ")}`);
    out.push(
      "              └ 자식이 언제나 부모보다 뒤에 있다. 그래서 이 순서를 뒤에서 앞으로",
    );
    out.push("                오면서 크기를 더하면 한 바퀴로 끝난다");
    return out.join("\n");
  },

  /** `deep.walk` 2 — 2차 순회가 정한 사슬과 자리 번호. */
  "walk-pass2": () => {
    const d = decompose(WALK_N, WALK_EDGES, 0, "size");
    const ids = [...Array(WALK_N).keys()];
    const base: number[] = Array.from({ length: WALK_N }, () => 0);
    for (const i of ids) base[d.pos[i] as number] = WALK_VALUES[i] as number;
    const rows: string[][] = [
      ["정점 v", ...ids.map(String)],
      ["사슬 머리 head[v]", ...ids.map((i) => String(d.head[i]))],
      ["자리 번호 pos[v]", ...ids.map((i) => String(d.pos[i]))],
      ["정점 값 values[v]", ...ids.map((i) => String(WALK_VALUES[i]))],
    ];
    const out = table(
      rows,
      ids.map((i) => i + 1),
    );
    out.push("");
    out.push(`  자리 번호   ${ids.map((i) => String(i)).join(" ")}`);
    out.push(`  기저 배열   ${base.join(" ")}`);
    const chains = new Map<number, number[]>();
    for (const i of ids) {
      const h = d.head[i] as number;
      chains.set(h, [...(chains.get(h) ?? []), i]);
    }
    const parts = [...chains.entries()]
      .sort((a, b) => (d.pos[a[0]] as number) - (d.pos[b[0]] as number))
      .map(
        ([h, list]) =>
          `머리 ${h} — ${list.sort((x, y) => (d.pos[x] as number) - (d.pos[y] as number)).join("·")}`,
      );
    out.push(`  사슬 ${chains.size} 개   ${parts.join("   ")}`);
    return out.join("\n");
  },

  /** `deep.walk` 4~6 — 질의 셋과 갱신 하나를 배열 칸까지 함께 센다. */
  "walk-ops": () => {
    const d = decompose(WALK_N, WALK_EDGES, 0, "size");
    const c = hldCounted(WALK_N, WALK_EDGES, 0, WALK_VALUES.slice());
    const q1 = c.query(0, 7);
    const q2 = c.query(3, 6);
    const up = c.update(4, 100);
    const q3 = c.query(8, 6);
    const rows: string[][] = [
      ["연산", "경로", "구간 수", "답", "배열 칸"],
      [
        "queryPath(0, 7)",
        pathVertices(d, 0, 7).join("→"),
        String(segmentCount(d, 0, 7)),
        String(q1.sum),
        String(q1.cells),
      ],
      [
        "queryPath(3, 6)",
        pathVertices(d, 3, 6).join("→"),
        String(segmentCount(d, 3, 6)),
        String(q2.sum),
        String(q2.cells),
      ],
      ["update(4, 100)", "정점 4 한 자리", "-", "-", String(up)],
      [
        "queryPath(8, 6)",
        pathVertices(d, 8, 6).join("→"),
        String(segmentCount(d, 8, 6)),
        String(q3.sum),
        String(q3.cells),
      ],
    ];
    const out = table(rows, [2, 3, 4]);
    out.push(
      `        └ 전처리가 배열 칸 ${c.pre} 번이고 네 연산이 ${q1.cells + q2.cells + up + q3.cells} 번이다`,
    );
    return out.join("\n");
  },

  /** `deep.walk` 6 — 원문자 분기 여섯이 각각 어디서 몇 번 실행됐는가. */
  "branch-cover": () => {
    const b = branchCounts(
      WALK_N,
      WALK_EDGES,
      0,
      [
        [0, 7],
        [3, 6],
        [8, 6],
      ],
      4,
    );
    const rows: string[][] = [
      ["분기", "무엇을 하는가", "어디서", "몇 번"],
      ["①", "이미 지나온 정점을 건너뛴다", "T2", String(b.skip)],
      ["②", "가장 큰 자식을 무거운 자식으로 삼는다", "T4", String(b.record)],
      ["③", "사슬 머리와 자리 번호를 붙인다", "T5", String(b.place)],
      [
        "④",
        "더 깊은 머리 쪽 구간을 잘라 낸다",
        "T7 · T8 · T10",
        b.deeper.join(" · "),
      ],
      ["⑤", "남은 한 구간을 더한다", "T7 · T8 · T10", b.last.join(" · ")],
      ["⑥", "펜윅 마디를 고친다", "T9", String(b.fenwick)],
    ];
    const out = table(rows, [3]);
    out.push(
      `        └ ④ 와 ⑤ 는 질의 셋의 값을 차례로 적은 것이다. T7 은 머리가 같아 ④ 가 0 번이고,`,
    );
    out.push(
      `          ⑥ 이 고친 마디는 ${b.fenwickNodes.join(" · ")} 번이다. 여섯 분기가 전부 한 번 이상 실행됐다`,
    );
    return out.join("\n");
  },

  /** `deep.walk.final` — 정본에 전개 입력을 그대로 넣은 결과. */
  "walk-result": () => {
    const answers = walkAnswers(REFCLASS);
    const d = decompose(WALK_N, WALK_EDGES, 0, "size");
    const rows: string[][] = [
      ["연산", "답", "무엇인가"],
      [
        "queryPath(0, 7)",
        String(answers[0]),
        `경로 ${pathVertices(d, 0, 7).join("→")} 가 사슬 하나 안에 있다`,
      ],
      [
        "queryPath(3, 6)",
        String(answers[1]),
        `경로 ${pathVertices(d, 3, 6).join("→")} 가 사슬 셋에 걸친다`,
      ],
      [
        "queryPath(8, 6)",
        String(answers[2]),
        "갱신한 정점 4 를 지나므로 100 이 들어간다",
      ],
    ];
    const out = table(rows, [1]);
    out.push(`        └ 세 답을 차례로 모으면 [${answers.join(", ")}] 이다`);
    return out.join("\n");
  },

  /** `deep.walk.pause` — 무거운 자식을 처음 만난 자식으로 골라도 답이 같다. */
  "mutant-first-child": () => {
    const Mut = FIRST_CHILD;
    const rows: string[][] = [
      [
        "입력",
        "정본의 답",
        "처음 만난 자식으로 고른 답",
        "정본 최대 구간",
        "바꾼 뒤 최대 구간",
      ],
    ];
    const walkRef = walkAnswers(REFCLASS);
    const walkMut = walkAnswers(Mut);
    rows.push([
      "전개가 쓰는 아홉 정점",
      `[${walkRef.join(", ")}]`,
      `[${walkMut.join(", ")}]`,
      String(maxSegments(WALK_N, WALK_EDGES, "size")),
      String(maxSegments(WALK_N, WALK_EDGES, "first")),
    ]);
    const cases: [string, number, Edge[]][] = [
      ["잎이 먼저 나오는 애벌레 255", 255, leafFirstCaterpillar(255)],
      ["꽉 찬 이진 트리 255", 255, binary(255)],
      ["정점 하나", 1, []],
    ];
    for (const [name, v, edges] of cases) {
      rows.push([
        name,
        `[${probe(REFCLASS, v, edges).join(", ")}]`,
        `[${probe(Mut, v, edges).join(", ")}]`,
        String(maxSegments(v, edges, "size")),
        String(maxSegments(v, edges, "first")),
      ]);
    }
    const out = table(rows, [3, 4]);
    out.push("        └ 답은 네 입력에서 모두 같고 구간 수만 갈린다");
    return out.join("\n");
  },

  /** `deep.walk.pause` — 반복 횟수는 경로 길이를 따라가지 않는다. */
  "loop-vs-length": () => {
    const rows: string[][] = [
      [
        "트리 모양",
        "정점 V",
        "물어본 두 정점",
        "경로 위 정점 수",
        "구간 수",
        "배열 칸",
      ],
    ];
    const cv = 100_000;
    const dc = decompose(cv, chain(cv), 0, "size");
    const cc = hldCounted(
      cv,
      chain(cv),
      0,
      Array.from({ length: cv }, () => 1),
    );
    rows.push([
      "한 줄로 이었다",
      comma(cv),
      `0 · ${comma(cv - 1)}`,
      comma(pathVertices(dc, 0, cv - 1).length),
      String(segmentCount(dc, 0, cv - 1)),
      String(cc.query(0, cv - 1).cells),
    ]);
    const bv = 131_071;
    const db = decompose(bv, binary(bv), 0, "size");
    const cb = hldCounted(
      bv,
      binary(bv),
      0,
      Array.from({ length: bv }, () => 1),
    );
    const a = bv - 1;
    const b = Math.floor(bv / 2);
    rows.push([
      "꽉 찬 이진 트리다",
      comma(bv),
      `${comma(a)} · ${comma(b)}`,
      comma(pathVertices(db, a, b).length),
      String(segmentCount(db, a, b)),
      String(cb.query(a, b).cells),
    ]);
    const out = table(rows, [1, 3, 4, 5]);
    const longer =
      pathVertices(dc, 0, cv - 1).length / pathVertices(db, a, b).length;
    const cheaper = cb.query(a, b).cells / cc.query(0, cv - 1).cells;
    out.push(
      `        └ 위가 아래보다 경로 위 정점이 ${comma(Math.round(longer))} 배 많은데 배열 칸은 ${comma(Math.round(cheaper))} 분의 1 이다.`,
    );
    out.push("          반복 횟수를 정하는 것은 경로 길이가 아니라 구간 수다");
    return out.join("\n");
  },

  /** `related` — 가벼운 간선을 지날 때마다 부분트리가 절반 아래로 준다. */
  "size-halving": () => {
    const bv = 1_023;
    const d = decompose(bv, binary(bv), 0, "size");
    let deep = 0;
    for (let a = 0; a < bv; a++) {
      if (lightEdges(d, a) > lightEdges(d, deep)) deep = a;
    }
    // 뿌리에서 그 정점까지의 경로를 위에서 아래로 적는다.
    const down: number[] = [];
    let w = deep;
    while (true) {
      down.push(w);
      const p = d.parent[w] as number;
      if (p === w) break;
      w = p;
    }
    down.reverse();

    const rows: string[][] = [
      [
        "지난 가벼운 간선 수",
        "그때의 정점",
        "그 부분트리 크기 size",
        "직전 크기의 절반",
      ],
    ];
    let seen = 0;
    let prev = -1;
    for (const x of down) {
      const isRoot = (d.parent[x] as number) === x;
      const isLight = !isRoot && (d.head[x] as number) === x;
      if (!isRoot && !isLight) continue;
      if (isLight) seen += 1;
      rows.push([
        String(seen),
        comma(x),
        comma(d.size[x] as number),
        prev === -1 ? "-" : comma(Math.floor(prev / 2)),
      ]);
      prev = d.size[x] as number;
    }
    const out = table(rows, [0, 1, 2, 3]);
    out.push(
      `        \u2514 꽉 찬 이진 트리 정점 ${comma(bv)} 개에서 가벼운 간선을 가장 많이 지나는 정점까지 따라간 것이다.`,
    );
    out.push(
      "          크기가 매번 직전 크기의 절반 이하로 내려가고 1 아래로는 못 내려가므로 그 횟수가 유한하다",
    );
    return out.join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣어 손으로 확인한다. */
  "size-check": () => {
    const d = decompose(WALK_N, WALK_EDGES, 0, "size");
    const rows: string[][] = [
      ["정점 v", "그 아래 정점 전부", "sz(v)", "hv(v)", "가벼운 간선 수 ℓ(v)"],
    ];
    for (let v = 0; v < WALK_N; v++) {
      const under: number[] = [];
      for (let x = 0; x < WALK_N; x++) {
        let y = x;
        while (true) {
          if (y === v) {
            under.push(x);
            break;
          }
          const p = d.parent[y] as number;
          if (p === y) break;
          y = p;
        }
      }
      rows.push([
        String(v),
        under.join(" "),
        String(d.size[v]),
        (d.heavy[v] as number) === -1 ? "-" : String(d.heavy[v]),
        String(lightEdges(d, v)),
      ]);
    }
    const out = table(rows, [0, 2, 3, 4]);
    out.push(
      "        └ 손으로 센 정점 수와 sz 가 아홉 줄에서 전부 같다. 뿌리에서 가장 먼 정점 8 까지는 가벼운 간선이 한 개도 없다",
    );
    return out.join("\n");
  },

  /** `deep.math` ④ — 유도한 상한을 실측과 나란히 놓는다. */
  "light-bound": () => {
    const cases: [string, number, Edge[], boolean][] = [
      ["전개가 쓰는 아홉 정점", WALK_N, WALK_EDGES, true],
      ["꽉 찬 이진 트리 255", 255, binary(255), true],
      ["꽉 찬 이진 트리 1,023", 1_023, binary(1_023), true],
      ["꽉 찬 이진 트리 131,071", 131_071, binary(131_071), false],
      [
        "잎이 먼저 나오는 애벌레 100,000",
        100_000,
        leafFirstCaterpillar(100_000),
        false,
      ],
    ];
    const rows: string[][] = [
      [
        "트리",
        "정점 V",
        "실측 최대 ℓ",
        "상한 ⌊log₂V⌋",
        "실측 최대 s",
        "상한 2⌊log₂V⌋+1",
      ],
    ];
    for (const [name, v, edges, exact] of cases) {
      rows.push([
        name,
        comma(v),
        String(maxLight(v, edges)),
        String(Math.floor(Math.log2(v))),
        exact ? String(maxSegments(v, edges, "size")) : "-",
        String(2 * Math.floor(Math.log2(v)) + 1),
      ]);
    }
    const out = table(rows, [1, 2, 3, 4, 5]);
    out.push(
      "        └ ℓ 은 정점 전부에서 잰 최댓값이고 s 는 정점 쌍 전부에서 잰 최댓값이다.",
    );
    out.push(
      "          아래 두 줄은 쌍이 백억 개를 넘어 s 를 전수로 재지 않았다",
    );
    return out.join("\n");
  },

  /** `purpose.alt` — 두 설계를 같은 작업 목록에 걸어 잰 값. */
  "alt-flip": () => {
    const m = measure();
    const rows: string[][] = [
      [
        "질의 수",
        "무거운 경로 분할",
        "오일러 구간 갱신과 조상 표",
        "어느 쪽이 적은가",
      ],
    ];
    for (const q of [0, 10_000, 27_610, 27_611, 100_000]) {
      const a = m.hld[q] as number;
      const b = m.euler[q] as number;
      rows.push([
        comma(q),
        comma(a),
        comma(b),
        a <= b ? "경로 분할" : "오일러 구간 갱신",
      ]);
    }
    const out = table(rows, [0, 1, 2]);
    out.push(
      "        └ 꽉 찬 이진 트리 정점 100,000 개 · 질의 i 번째는 (i mod V, 37i mod V) 다.",
    );
    out.push("          한 개 단위로 재어 뒤집히는 첫 자리가 27,611 이다");
    return out.join("\n");
  },

  /** `perf.derive` — 전처리 닫힌 형태와 실측. */
  "cost-closed-form": () => {
    const cases: [string, number, Edge[]][] = [
      ["전개가 쓰는 아홉 정점", WALK_N, WALK_EDGES],
      ["한 줄로 이은 100", 100, chain(100)],
      ["별 모양 100", 100, star(100)],
      ["꽉 찬 이진 트리 1,000", 1_000, binary(1_000)],
      ["꽉 찬 이진 트리 100,000", 100_000, binary(100_000)],
    ];
    const rows: string[][] = [
      [
        "입력",
        "V",
        "R",
        "C",
        "실측 전처리",
        "47V + 2R + 2C − 3·s₂(V) − 18",
        "차이",
      ],
    ];
    for (const [name, v, edges] of cases) {
      const values = Array.from({ length: v }, (_, i) => (i % 97) + 1);
      const c = hldCounted(v, edges, 0, values);
      const closed =
        47 * v + 2 * c.records + 2 * c.chains - 3 * popcount(v) - 18;
      rows.push([
        name,
        comma(v),
        comma(c.records),
        comma(c.chains),
        comma(c.pre),
        comma(closed),
        String(c.pre - closed),
      ]);
    }
    const out = table(rows, [1, 2, 3, 4, 5, 6]);
    out.push(
      "        └ R 은 무거운 자식 자리를 새로 쓴 횟수, C 는 사슬 수, s₂(V) 는 V 를 이진수로 적었을 때 1 의 개수다",
    );
    return out.join("\n");
  },

  /** `invariant` ③ — 사슬 머리의 깊이 대신 정점의 깊이로 고르면. */
  "mutant-vertex-depth": () => {
    const Mut = VERTEX_DEPTH;
    const rows: string[][] = [["입력", "정본", "정점 자신의 깊이로 고른다"]];
    rows.push([
      "전개가 쓰는 아홉 정점",
      `[${walkAnswers(REFCLASS).join(", ")}]`,
      `[${walkAnswers(Mut).join(", ")}]`,
    ]);
    const cases: [string, number, Edge[]][] = [
      ["꽉 찬 이진 트리 15", 15, binary(15)],
      ["한 줄로 이은 8", 8, chain(8)],
      ["잎이 먼저 나오는 애벌레 31", 31, leafFirstCaterpillar(31)],
      ["정점 하나", 1, []],
    ];
    for (const [name, v, edges] of cases) {
      rows.push([
        name,
        `[${probe(REFCLASS, v, edges).join(", ")}]`,
        `[${probe(Mut, v, edges).join(", ")}]`,
      ]);
    }
    return table(rows).join("\n");
  },

  /** `perf.worst` — 모양만 바꿔 같은 작업 목록을 건다. */
  "shape-values": () => {
    const v = 20_000;
    const shapes: [string, Edge[]][] = [
      ["한 줄로 이었다", chain(v)],
      ["별 모양이다", star(v)],
      ["애벌레다", caterpillar(v)],
      ["꽉 찬 이진 트리다", binary(v)],
    ];
    const values = Array.from({ length: v }, (_, i) => (i % 97) + 1);
    const rows: string[][] = [
      ["입력 모양", "질의", "전처리 칸", "질의 칸", "합", "질의 하나 최대"],
    ];
    for (const [name, edges] of shapes) {
      const c = hldCounted(v, edges, 0, values.slice());
      let sum = 0;
      let mx = 0;
      for (let i = 0; i < v; i++) {
        const r = c.query(i % v, (37 * i) % v);
        sum += r.cells;
        mx = Math.max(mx, r.cells);
      }
      rows.push([
        name,
        "골고루",
        comma(c.pre),
        comma(sum),
        comma(c.pre + sum),
        comma(mx),
      ]);
    }
    // 가장 깊은 잎 둘을 서로 다른 절반에서 고른 질의
    const edges = binary(v);
    const c = hldCounted(v, edges, 0, values.slice());
    const d = decompose(v, edges, 0, "size");
    let deepA = 1;
    let deepB = 2;
    for (let a = 1; a < v; a++) {
      let top = a;
      while ((d.parent[top] as number) !== 0) top = d.parent[top] as number;
      if (top === 1 && (d.depth[a] as number) > (d.depth[deepA] as number))
        deepA = a;
      if (top === 2 && (d.depth[a] as number) > (d.depth[deepB] as number))
        deepB = a;
    }
    let sum2 = 0;
    let mx2 = 0;
    for (let i = 0; i < v; i++) {
      const r = c.query(deepA, deepB);
      sum2 += r.cells;
      mx2 = Math.max(mx2, r.cells);
    }
    rows.push([
      "꽉 찬 이진 트리다",
      `${comma(deepA)} · ${comma(deepB)}`,
      comma(c.pre),
      comma(sum2),
      comma(c.pre + sum2),
      comma(mx2),
    ]);
    const out = table(rows, [2, 3, 4, 5]);
    out.push(
      "        └ 정점 20,000 개 · 질의 20,000 개다. 네 모양 다 간선이 19,999 개이고, 마지막 줄은",
    );
    out.push(
      "          가장 깊은 잎 둘을 서로 다른 절반에서 골라 같은 질의를 20,000 번 되풀이한 것이다",
    );
    return out.join("\n");
  },
};
