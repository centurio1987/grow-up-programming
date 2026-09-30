/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/articulationPoints/articulationPoints-guide.md
 *
 * **계수를 세는 사본이 있다.** 정본은 몇 번 셌는지와 걸음마다의 상태를 내보내지 않으므로, 세는
 * 자리만 덧붙인 사본(`counted`)이 아니면 걸음 표를 낼 방법이 없다. **답이 맞는지는 사본이 아니라
 * 정본이 진다** — 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다.
 * 사본에는 변이 넷을 켜는 스위치도 있다(짚고 가기 · 불변식 절의 걸음 표). 그 스위치가 낸 답이
 * `loadMutant` 가 정본 소스에서 만든 변이의 답과 같은지도 같은 자리에서 확인한다.
 *
 * **큰 입력에는 기록을 끈다.** `counted(n, edges, false)` 는 걸음마다의 사본을 안 만들고 값만 센다.
 * 정점 10 만 개짜리 입력에서 걸음마다 배열 전체를 베끼면 메모리가 모자라 출력 없이 죽는다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가
 * 이 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * 블록은 마크다운 표로 낸다(SPEC §12 `L46`). 표 아래 문장의 수도 실행이 낸 값이면 그 문장까지
 * 여기서 만들고 본문은 `<!--/proof-->` 로 닫는다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 으로, 은는, 을를, 이가 } from "../../../../tools/josa.ts";
import { articulationPoints } from "./articulationPoints-guide.ref.ts";

export type Edge = [number, number];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 그래프. 정점 다섯 · 무향 간선 다섯. 삼각형 `0−1−2` 에 꼬리 `0−3−4` 가 붙었다.
 *
 * 아홉 갈래를 한 입력에서 전부 실행한다. `2−0` 이 되돌아가는 간선 갈래를 내고, 뿌리 0 이 나무
 * 자식 둘(1 과 3)을 가져 뿌리 전용 판정이 참으로 실행된다. 정점 4 는 자식이 없는 잎이라
 * `low` 가 자기 발견 순서에 그대로 남는다.
 */
export const WALK_N = 5;
export const WALK_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 3],
  [3, 4],
];

/** 사이클 하나. 단절점이 하나도 없다. */
export const RING_N = 4;
export const RING_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
];

/** 삼각형에 정점 하나가 매달린 그래프. 판정의 등호가 갈리는 자리다. */
export const TAIL_N = 4;
export const TAIL_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 1],
];

/** 삼각형 둘이 정점 하나를 함께 쓰는 그래프. */
export const SHARE_N = 5;
export const SHARE_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [1, 3],
  [3, 4],
  [4, 1],
];

/** 삼각형 둘을 간선 하나가 잇는 그래프. 그 간선의 두 끝이 단절점이다. */
export const BRIDGE_N = 6;
export const BRIDGE_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 3],
];

/** 떨어진 두 성분과 홀로 있는 정점. 바깥 반복이 세 번 탐색을 시작한다. */
export const SPLIT_N = 7;
export const SPLIT_EDGES: Edge[] = [
  [0, 1],
  [1, 2],
  [3, 4],
  [4, 5],
];

/* ── 두 끝이 같은 간선이 든 입력 — 그 간선을 거르는 줄이 실제로 실행되는 자리다 ── */

/** 삼각형에 두 끝이 같은 간선 하나. */
export const LOOP_A_N = 3;
export const LOOP_A_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 2],
  [2, 0],
];

/** 전개 입력에 두 끝이 같은 간선 둘을 더한 것. */
export const LOOP_B_N = 5;
export const LOOP_B_EDGES: Edge[] = [
  [0, 0],
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 3],
  [3, 4],
  [4, 4],
];

/** 꼬리가 붙은 삼각형에 두 끝이 같은 간선 하나. */
export const LOOP_C_N = 4;
export const LOOP_C_EDGES: Edge[] = [
  [1, 1],
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 1],
];

/** 두 끝이 같은 간선만 있는 그래프. */
export const LOOP_D_N = 3;
export const LOOP_D_EDGES: Edge[] = [
  [0, 0],
  [1, 1],
  [2, 2],
];

/** 같은 두 정점 사이에 간선이 둘 겹친 그래프. */
export const TWIN_N = 3;
export const TWIN_EDGES: Edge[] = [
  [0, 1],
  [0, 1],
  [1, 2],
];

/* ────────────────────────── 그래프 생성 ────────────────────────── */

/** 사슬 `0−1− … −(v−1)`. 양 끝을 뺀 정점 전부가 단절점이다. */
export function chain(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < v; i++) edges.push([i, i + 1]);
  return edges;
}

/** 사이클 `0−1− … −(v−1)−0`. 단절점이 없다. */
export function ring(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < v; i++) edges.push([i, (i + 1) % v]);
  return edges;
}

/** 별 — 정점 0 에서 나머지 전부로. 정점 0 하나만 단절점이다. */
export function star(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 1; i < v; i++) edges.push([0, i]);
  return edges;
}

/** 완전 그래프 — 정점 쌍마다 간선 하나. 단절점이 없다. */
export function complete(v: number): Edge[] {
  const edges: Edge[] = [];
  for (let u = 0; u < v; u++) {
    for (let x = u + 1; x < v; x++) edges.push([u, x]);
  }
  return edges;
}

/** 크기 `m` 인 사이클 `k` 개를 간선 하나씩으로 한 줄로 이은 그래프. */
export function beads(k: number, m: number): { n: number; e: Edge[] } {
  const e: Edge[] = [];
  for (let c = 0; c < k; c++) {
    const base = c * m;
    for (let i = 0; i < m; i++) e.push([base + i, base + ((i + 1) % m)]);
    if (c + 1 < k) e.push([base + m - 1, base + m]);
  }
  return { n: k * m, e };
}

/**
 * 무작위 그래프. 생성식을 시드로 고정한다.
 *
 * **곱셈 하나짜리 생성식을 쓰지 않는다.** `seed = (seed * a + c) & 0x7fffffff` 는 아래 비트의
 * 주기가 짧아서, 정점 수처럼 2 의 거듭제곱으로 나눈 나머지를 뽑으면 몇십 걸음 만에 같은 간선이
 * 되풀이된다. 그래서 비트를 섞는 생성식으로 둔다.
 */
export function scatter(v: number, m: number, seed0: number): Edge[] {
  let seed = seed0 | 0;
  const next = (): number => {
    seed ^= seed << 13;
    seed |= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed |= 0;
    return (seed >>> 0) % v;
  };
  const edges: Edge[] = [];
  for (let i = 0; i < m; i++) edges.push([next(), next()]);
  return edges;
}

/* ────────────────────────── 표기 ────────────────────────── */

/** `[0, 3]` 꼴 — 본문 표기와 같다. */
export const list = (xs: readonly (number | string)[]): string =>
  `[${xs.join(", ")}]`;

/** `[[0, 1, 2], [0, 3]]` 꼴. */
export const show2 = (gs: readonly (readonly number[])[]): string =>
  `[${gs.map((g) => list(g)).join(", ")}]`;

/** `{0, 1, 2}` 꼴 — 정점 집합. */
export const set = (xs: readonly number[]): string => `{${xs.join(", ")}}`;

/** `20,000,000,000` 꼴 — 본문 표기와 같다. */
export const comma = (n: number): string => n.toLocaleString("en-US");

/** 무향 간선 한 줄 표기 — `0−1`. */
export const ed = (a: number, b: number): string => `${a}−${b}`;

/** 마크다운 표 한 벌. `right` 는 오른쪽 정렬할 열 번호. */
export function md(
  head: readonly string[],
  rows: readonly (readonly string[])[],
  right: readonly number[] = [],
): string {
  const sep = head.map((_, i) => (right.includes(i) ? "---:" : "---"));
  return [head, sep, ...rows].map((r) => `| ${r.join(" | ")} |`).join("\n");
}

/** 한글은 고정폭 화면에서 두 칸을 먹는다(코드 옆 짧은 결과 블록의 칸 맞춤). */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 등폭 두 열 — 이름과 값. 코드 조각 바로 아래의 짧은 실행 결과에 쓴다. */
function pairs(rows: readonly [string, string][]): string[] {
  const w = Math.max(
    ...rows.filter(([, b]) => b !== "").map(([a]) => width(a)),
  );
  return rows.map(([a, b]) => (b === "" ? a : `${pad(a, w)}  ${b}`));
}

/** 발견 순서 목록 — 아직 안 본 정점은 `-`. */
export const dl = (xs: readonly number[]): string =>
  list(xs.map((d) => (d < 0 ? "-" : String(d))));

/** 개수를 한국어 수사로 — 문장이 쓰는 「세 줄」 꼴. 1~10 만 쓴다. */
const KO = [
  "",
  "한",
  "두",
  "세",
  "네",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
  "열",
];
const ko = (n: number): string => KO[n] ?? String(n);

/* ────────────────────── 계수를 세는 사본 ────────────────────── */

/** 사본에 켤 수 있는 변이 — 짚고 가기 · 불변식 절이 걸음 표를 낼 때 쓴다. */
export type Variant = "noSkip" | "strict" | "rootToo" | "noPass";

export type StepKind =
  | "진입"
  | "건너뜀"
  | "줄임"
  | "복귀"
  | "판정"
  | "뿌리 판정";

/** 간선 종류 — 무향 그래프의 깊이 우선 탐색이 간선을 가르는 둘. */
export type EdgeKindKo = "나무" | "되돌아감";

/** 뺀 걸음의 판정 — 자식 `low` 와 부모 `disc` 를 맞댄 것. 부모가 뿌리면 `rooted`. */
export interface Judge {
  lowC: number;
  discP: number;
  rooted: boolean;
  hit: boolean;
}

/** 걸음 하나의 기록. `kind` 가 이 걸음이 실행한 갈래다. */
export interface Step {
  kind: StepKind;
  label: string;
  /** 진입이면 들어간 정점, 이웃을 읽었으면 지금 정점, 뺐으면 뺀 정점, 뿌리 판정이면 뿌리. */
  v: number;
  /** 진입이면 부모(바깥 반복이면 `null`), 이웃을 읽었으면 그 이웃. */
  w: number | null;
  /** 이 걸음이 읽은 간선의 번호(`edges` 의 자리). 없으면 `null`. */
  edge: number | null;
  /** 뺀 걸음이면 부모(뿌리를 뺐으면 `null`). */
  parent: number | null;
  /** 이 걸음에서 `low` 를 고친 정점과 고치기 전 값. */
  lowFrom: { vertex: number; before: number } | null;
  judge: Judge | null;
  /** 뿌리 판정 걸음의 나무 자식 수. */
  rootKids: number | null;
  disc: number[];
  low: number[];
  call: number[];
  callI: number[];
  callP: number[];
  cut: number[];
  kinds: (EdgeKindKo | null)[];
  timer: number;
  reads: number;
}

type StepHead = Pick<
  Step,
  | "kind"
  | "label"
  | "v"
  | "w"
  | "edge"
  | "parent"
  | "lowFrom"
  | "judge"
  | "rootKids"
>;

export interface Counts {
  cut: number[];
  disc: number[];
  low: number[];
  adj: number[][];
  /** 정점의 부모. 뿌리는 `-1`. */
  parent: number[];
  /** 나무 자식 — 방문한 차례대로. */
  children: number[][];
  /** 바깥 반복이 탐색을 시작한 정점. */
  roots: number[];
  depth: number[];
  kinds: (EdgeKindKo | null)[];
  steps: Step[];
  /** 간선 목록을 읽은 횟수 — 이웃 목록을 만들며 한 번씩. */
  builds: number;
  /** 두 끝이 같아서 이웃 목록에 안 담은 간선의 수. */
  loops: number;
  /** 순회하며 읽은 이웃 자리. */
  reads: number;
  enters: number;
  pops: number;
  /** 갈래별 실행 횟수 — 나무 간선 · 이미 들어갔던 정점 읽기 · 부모 건너뛰기. */
  tree: number;
  back: number;
  skip: number;
  /** 뿌리가 아닌 부모를 단절점으로 적은 횟수. */
  marks: number;
  /** 뿌리를 단절점으로 적은 횟수. */
  rootMarks: number;
  peakCall: number;
}

/**
 * 정본과 같은 절차에 세는 자리만 덧붙인 사본. `variant` 를 주면 그 변이를 켠 판이다.
 * `record` 가 거짓이면 걸음 기록을 안 만든다(큰 입력용).
 */
export function counted(
  n: number,
  edges: Edge[],
  record = true,
  variant?: Variant,
): Counts {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const adjE: number[][] = Array.from({ length: n }, () => []);
  let builds = 0;
  let loops = 0;
  edges.forEach(([u, v], k) => {
    builds++;
    if (u === v) {
      loops++;
      return;
    }
    (adj[u] as number[]).push(v);
    (adjE[u] as number[]).push(k);
    (adj[v] as number[]).push(u);
    (adjE[v] as number[]).push(k);
  });
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const cut: boolean[] = Array.from({ length: n }, () => false);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const depth: number[] = Array.from({ length: n }, () => 0);
  const children: number[][] = Array.from({ length: n }, () => []);
  const kinds: (EdgeKindKo | null)[] = edges.map(() => null);
  const roots: number[] = [];
  const steps: Step[] = [];
  let timer = 0;
  let reads = 0;
  let enters = 0;
  let pops = 0;
  let tree = 0;
  let back = 0;
  let skip = 0;
  let marks = 0;
  let rootMarks = 0;
  let peakCall = 0;

  const callV: number[] = [];
  const callI: number[] = [];
  const callP: number[] = [];
  const marked = (): number[] => {
    const out: number[] = [];
    for (let v = 0; v < n; v++) if (cut[v] === true) out.push(v);
    return out;
  };
  const snap = (s: StepHead): void => {
    if (!record) return;
    steps.push({
      ...s,
      disc: disc.slice(),
      low: low.slice(),
      call: callV.slice(),
      callI: callI.slice(),
      callP: callP.slice(),
      cut: marked(),
      kinds: kinds.slice(),
      timer,
      reads,
    });
  };
  const blank = {
    edge: null,
    parent: null,
    lowFrom: null,
    judge: null,
    rootKids: null,
  };
  const enter = (v: number, from: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    callV.push(v);
    callI.push(0);
    callP.push(from);
    parent[v] = from;
    if (from !== -1) {
      depth[v] = (depth[from] as number) + 1;
      (children[from] as number[]).push(v);
    }
    enters++;
    peakCall = Math.max(peakCall, callV.length);
  };

  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    roots.push(root);
    let rootKids = 0;
    enter(root, -1);
    snap({ ...blank, kind: "진입", label: "③", v: root, w: null });

    while (callV.length > 0) {
      const v = callV[callV.length - 1] as number;
      const i = callI[callI.length - 1] as number;
      const nbrs = adj[v] as number[];

      if (i < nbrs.length) {
        callI[callI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        const k = (adjE[v] as number[])[i] as number;
        reads++;
        if (disc[w] === -1) {
          tree++;
          if (v === root) rootKids++;
          kinds[k] = "나무";
          enter(w, v);
          snap({ ...blank, kind: "진입", label: "④③", v: w, w: v, edge: k });
        } else if (
          variant === "noSkip" ||
          w !== (callP[callP.length - 1] as number)
        ) {
          back++;
          const before = low[v] as number;
          low[v] = Math.min(low[v] as number, disc[w] as number);
          if (kinds[k] === null) kinds[k] = "되돌아감";
          snap({
            ...blank,
            kind: "줄임",
            label: "⑤",
            v,
            w,
            edge: k,
            lowFrom: { vertex: v, before },
          });
        } else {
          skip++;
          snap({ ...blank, kind: "건너뜀", label: "⑥", v, w, edge: k });
        }
        continue;
      }

      callV.pop();
      callI.pop();
      pops++;
      const from = callP.pop() as number;
      if (from === -1) {
        snap({ ...blank, kind: "복귀", label: "⑦", v, w: null });
        continue;
      }
      const before = low[from] as number;
      if (variant !== "noPass") {
        low[from] = Math.min(low[from] as number, low[v] as number);
      }
      const rooted = from === root;
      const lowC = low[v] as number;
      const discP = disc[from] as number;
      const hit =
        (variant === "rootToo" || !rooted) &&
        (variant === "strict" ? lowC > discP : lowC >= discP);
      if (hit) {
        cut[from] = true;
        marks++;
      }
      snap({
        ...blank,
        kind: hit ? "판정" : "복귀",
        label: hit ? "⑦⑧" : "⑦",
        v,
        w: null,
        parent: from,
        lowFrom: { vertex: from, before },
        judge: { lowC, discP, rooted, hit },
      });
    }

    if (rootKids >= 2) {
      cut[root] = true;
      rootMarks++;
    }
    snap({
      ...blank,
      kind: "뿌리 판정",
      label: "⑨",
      v: root,
      w: null,
      rootKids,
    });
  }

  return {
    cut: marked(),
    disc,
    low,
    adj,
    parent,
    children,
    roots,
    depth,
    kinds,
    steps,
    builds,
    loops,
    reads,
    enters,
    pops,
    tree,
    back,
    skip,
    marks,
    rootMarks,
    peakCall,
  };
}

/** 재귀로 적은 판. 절차는 정본과 같고 호출 스택만 자바스크립트에 맡긴다. */
export function recursive(n: number, edges: Edge[]): number[] {
  const adj = neighbors(n, edges);
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  const cut: boolean[] = Array.from({ length: n }, () => false);
  let timer = 0;
  let root = 0;
  const dfs = (v: number, parent: number): number => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    let kids = 0;
    for (const w of adj[v] as number[]) {
      if (disc[w] === -1) {
        kids++;
        dfs(w, v);
        low[v] = Math.min(low[v] as number, low[w] as number);
        if (v !== root && (low[w] as number) >= (disc[v] as number)) {
          cut[v] = true;
        }
      } else if (w !== parent) {
        low[v] = Math.min(low[v] as number, disc[w] as number);
      }
    }
    return kids;
  };
  for (let s = 0; s < n; s++) {
    if (disc[s] !== -1) continue;
    root = s;
    if (dfs(s, -1) >= 2) cut[s] = true;
  }
  const out: number[] = [];
  for (let v = 0; v < n; v++) if (cut[v] === true) out.push(v);
  return out;
}

/** 이웃 목록 — 두 끝이 같은 간선은 담지 않는다. */
function neighbors(n: number, edges: Edge[]): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    if (u === v) continue;
    (adj[u] as number[]).push(v);
    (adj[v] as number[]).push(u);
  }
  return adj;
}

/** 정점 하나를 지운 뒤 남는 덩어리들. `skip` 이 `-1` 이면 아무것도 안 지운다. */
export function pieces(n: number, edges: Edge[], skip: number): number[][] {
  const adj = neighbors(n, edges);
  const seen: boolean[] = Array.from({ length: n }, () => false);
  const out: number[][] = [];
  for (let s = 0; s < n; s++) {
    if (s === skip || seen[s] === true) continue;
    const got = [s];
    seen[s] = true;
    const stack = [s];
    while (stack.length > 0) {
      const v = stack.pop() as number;
      for (const w of adj[v] as number[]) {
        if (w !== skip && seen[w] !== true) {
          seen[w] = true;
          got.push(w);
          stack.push(w);
        }
      }
    }
    out.push(got.sort((a, b) => a - b));
  }
  return out;
}

/** 정점을 하나씩 지우고 연결 성분 수를 다시 세는 방법. 탐색 횟수와 이웃 자리 읽기를 센다. */
export function byDeletion(
  n: number,
  edges: Edge[],
): { cut: number[]; reads: number; scans: number } {
  const adj = neighbors(n, edges);
  let reads = 0;
  let scans = 0;
  const components = (skip: number): number => {
    scans++;
    const seen: boolean[] = Array.from({ length: n }, () => false);
    let count = 0;
    for (let s = 0; s < n; s++) {
      if (s === skip || seen[s] === true) continue;
      count++;
      seen[s] = true;
      const stack = [s];
      while (stack.length > 0) {
        const v = stack.pop() as number;
        for (const w of adj[v] as number[]) {
          reads++;
          if (w !== skip && seen[w] !== true) {
            seen[w] = true;
            stack.push(w);
          }
        }
      }
    }
    return count;
  };
  const base = components(-1);
  const cut: number[] = [];
  for (let v = 0; v < n; v++) if (components(v) > base) cut.push(v);
  return { cut, reads, scans };
}

export interface Tree {
  disc: number[];
  parent: number[];
  children: number[][];
  depth: number[];
  roots: number[];
  treeEdges: Edge[];
  /** `[아래 끝, 위 끝]`. */
  backEdges: Edge[];
  /** `subtree[v]` — `v` 의 부분트리(자기 포함), 오름차순. */
  subtree: number[][];
}

/** 깊이 우선 탐색이 만든 나무. 나무 간선과 되돌아가는 간선을 갈라 돌려준다. */
export function tree(n: number, edges: Edge[]): Tree {
  const c = counted(n, edges, false);
  const treeEdges: Edge[] = [];
  const backEdges: Edge[] = [];
  edges.forEach(([u, v], k) => {
    if (u === v) return;
    if (c.kinds[k] === "나무") {
      treeEdges.push((c.parent[v] as number) === u ? [u, v] : [v, u]);
      return;
    }
    const a = (c.disc[u] as number) < (c.disc[v] as number) ? u : v;
    const b = a === u ? v : u;
    // 나무 간선과 두 끝이 같은 겹친 간선은 부모 건너뛰기가 정점 번호로 함께 거른다 — low 에 안 든다.
    if (c.kinds[k] === "되돌아감" && (c.parent[b] as number) !== a) {
      backEdges.push([b, a]);
    }
  });
  const subtree: number[][] = Array.from({ length: n }, () => []);
  const order = Array.from({ length: n }, (_, v) => v).sort(
    (a, b) => (c.disc[b] as number) - (c.disc[a] as number),
  );
  for (const v of order) {
    (subtree[v] as number[]).push(v);
    const p = c.parent[v] as number;
    if (p !== -1) (subtree[p] as number[]).push(...(subtree[v] as number[]));
  }
  for (const s of subtree) s.sort((a, b) => a - b);
  return {
    disc: c.disc,
    parent: c.parent,
    children: c.children,
    depth: c.depth,
    roots: c.roots,
    treeEdges,
    backEdges,
    subtree,
  };
}

/** `a` 가 `b` 의 조상인가(자기 자신 포함) — 나무의 부모를 따라 올라가 본다. */
export function isAncestor(
  parent: readonly number[],
  a: number,
  b: number,
): boolean {
  let x = b;
  while (x !== -1) {
    if (x === a) return true;
    x = parent[x] as number;
  }
  return false;
}

/**
 * 너비 우선 탐색으로 만든 나무에 같은 두 규칙을 적용한 판 — 「먼저 알아 둘 개념」의 헷갈리기 쉬운
 * 모양이다. 발견 순서는 너비 우선 탐색이 정점을 표시한 차례이고, `low` 는 나무 간선이 아닌 간선의
 * 반대쪽 끝의 발견 순서를 부분트리에서 모아 가장 작은 것을 고른다. 절차의 모양은 같고 나무만 다르다.
 */
export function bfsRule(
  n: number,
  edges: Edge[],
): {
  cut: number[];
  parent: number[];
  children: number[][];
  roots: number[];
  nonTree: Edge[];
} {
  const adj = neighbors(n, edges);
  const parent: number[] = Array.from({ length: n }, () => -1);
  const disc: number[] = Array.from({ length: n }, () => -1);
  const order: number[] = [];
  const children: number[][] = Array.from({ length: n }, () => []);
  const roots: number[] = [];
  for (let s = 0; s < n; s++) {
    if (disc[s] !== -1) continue;
    roots.push(s);
    disc[s] = order.length;
    order.push(s);
    for (let head = order.length - 1; head < order.length; head++) {
      const v = order[head] as number;
      for (const w of adj[v] as number[]) {
        if (disc[w] !== -1) continue;
        disc[w] = order.length;
        order.push(w);
        parent[w] = v;
        (children[v] as number[]).push(w);
      }
    }
  }
  const nonTree: Edge[] = [];
  const low = disc.slice();
  const used = new Set<string>();
  for (const [u, v] of edges) {
    if (u === v) continue;
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if ((parent[v] === u || parent[u] === v) && !used.has(key)) {
      used.add(key);
      continue;
    }
    nonTree.push([u, v]);
    low[u] = Math.min(low[u] as number, disc[v] as number);
    low[v] = Math.min(low[v] as number, disc[u] as number);
  }
  const cut: boolean[] = Array.from({ length: n }, () => false);
  for (let k = order.length - 1; k >= 0; k--) {
    const v = order[k] as number;
    const p = parent[v] as number;
    if (p === -1) continue;
    low[p] = Math.min(low[p] as number, low[v] as number);
    if (parent[p] !== -1 && (low[v] as number) >= (disc[p] as number)) {
      cut[p] = true;
    }
  }
  for (const r of roots) {
    if ((children[r] as number[]).length >= 2) cut[r] = true;
  }
  const out: number[] = [];
  for (let v = 0; v < n; v++) if (cut[v] === true) out.push(v);
  return { cut: out, parent, children, roots, nonTree };
}

/**
 * 정의에서 「부모 건너뛰기」를 지웠을 때의 값 — 부모로 가는 나무 간선까지 되돌아가는 간선처럼 넣고
 * 같은 최솟값을 계산한다. 변이가 아니라 **다른 정의를 계산한 것**이다.
 */
export function lowWithParent(n: number, edges: Edge[]): number[] {
  const t = tree(n, edges);
  const out = t.disc.slice();
  const adj = neighbors(n, edges);
  const order = Array.from({ length: n }, (_, v) => v).sort(
    (a, b) => (t.disc[b] as number) - (t.disc[a] as number),
  );
  for (const v of order) {
    for (const w of adj[v] as number[]) {
      if ((t.disc[w] as number) < (t.disc[v] as number)) {
        out[v] = Math.min(out[v] as number, t.disc[w] as number);
      }
    }
    const p = t.parent[v] as number;
    if (p !== -1) out[p] = Math.min(out[p] as number, out[v] as number);
  }
  return out;
}

/**
 * 정의를 그대로 계산한 `low` — `v` 의 부분트리에서 되돌아가는 간선 하나로 이르는 정점의 발견 순서와
 * `disc[v]` 를 통틀어 가장 작은 값. 절차의 순서를 안 쓰고 나무와 간선 분류에서 바로 계산한다.
 */
export function lowByDefinition(n: number, edges: Edge[]): number[] {
  const t = tree(n, edges);
  const out = t.disc.slice();
  for (const [b, a] of t.backEdges) {
    for (let v = 0; v < n; v++) {
      if ((t.subtree[v] as number[]).includes(b)) {
        out[v] = Math.min(out[v] as number, t.disc[a] as number);
      }
    }
  }
  return out;
}

/** 정점 `v` 에서 갈 수 있는 정점 중 가장 이른 발견 순서 — 「도달」로 읽은 `low`. */
export function reachLow(n: number, edges: Edge[]): number[] {
  const t = tree(n, edges);
  const groups = pieces(n, edges, -1);
  return Array.from({ length: n }, (_, v) =>
    Math.min(
      ...(groups.find((p) => p.includes(v)) as number[]).map(
        (x) => t.disc[x] as number,
      ),
    ),
  );
}

/** 주어진 `low` 로 두 규칙을 적용한 답 — 나무는 정본의 깊이 우선 탐색 트리다. */
export function ruleWith(n: number, edges: Edge[], low: number[]): number[] {
  const t = tree(n, edges);
  const out: number[] = [];
  for (let v = 0; v < n; v++) {
    const kids = t.children[v] as number[];
    if ((t.parent[v] as number) === -1) {
      if (kids.length >= 2) out.push(v);
    } else if (kids.some((c) => (low[c] as number) >= (t.disc[v] as number))) {
      out.push(v);
    }
  }
  return out;
}

/**
 * 이중 연결 성분(블록) — 간선 스택을 들어 간선을 무리로 가른다.
 *
 * `related` 절이 쓰는 값이다. 단절점은 이 무리 둘 이상에 함께 나오는 정점이고, 그것이 정본이
 * 낸 답과 같은지를 `자기대조()` 가 확인한다.
 */
export function blocks(n: number, edges: Edge[]): number[][] {
  const adj = neighbors(n, edges);
  const disc: number[] = Array.from({ length: n }, () => -1);
  const low: number[] = Array.from({ length: n }, () => -1);
  let timer = 0;
  const stack: Edge[] = [];
  const out: number[][] = [];
  const callV: number[] = [];
  const callI: number[] = [];
  const callP: number[] = [];
  const enter = (v: number, from: number): void => {
    disc[v] = timer;
    low[v] = timer;
    timer++;
    callV.push(v);
    callI.push(0);
    callP.push(from);
  };
  const lift = (v: number): void => {
    const seen = new Set<number>();
    while (stack.length > 0) {
      const e = stack[stack.length - 1] as Edge;
      if ((disc[e[0]] as number) < (disc[v] as number)) break;
      stack.pop();
      seen.add(e[0]);
      seen.add(e[1]);
    }
    const top = stack.pop();
    if (top !== undefined) {
      seen.add(top[0]);
      seen.add(top[1]);
    }
    if (seen.size > 0) out.push([...seen].sort((a, b) => a - b));
  };
  for (let root = 0; root < n; root++) {
    if (disc[root] !== -1) continue;
    enter(root, -1);
    while (callV.length > 0) {
      const v = callV[callV.length - 1] as number;
      const i = callI[callI.length - 1] as number;
      const nbrs = adj[v] as number[];
      if (i < nbrs.length) {
        callI[callI.length - 1] = i + 1;
        const w = nbrs[i] as number;
        if (disc[w] === -1) {
          stack.push([v, w]);
          enter(w, v);
        } else if (
          w !== (callP[callP.length - 1] as number) &&
          (disc[w] as number) < (disc[v] as number)
        ) {
          stack.push([v, w]);
          low[v] = Math.min(low[v] as number, disc[w] as number);
        }
        continue;
      }
      callV.pop();
      callI.pop();
      const from = callP.pop() as number;
      if (from !== -1) {
        low[from] = Math.min(low[from] as number, low[v] as number);
        if ((low[v] as number) >= (disc[from] as number)) lift(v);
      }
    }
  }
  return out.sort(
    (a, b) =>
      (a[0] as number) - (b[0] as number) ||
      (a[1] as number) - (b[1] as number),
  );
}

/** 블록 둘 이상에 함께 나오는 정점 — 블록-컷 나무에서 갈림 자리가 되는 정점이다. */
export function sharedByBlocks(n: number, edges: Edge[]): number[] {
  const seen: number[] = Array.from({ length: n }, () => 0);
  for (const b of blocks(n, edges))
    for (const v of b) seen[v] = (seen[v] as number) + 1;
  const out: number[] = [];
  for (let v = 0; v < n; v++) if ((seen[v] as number) >= 2) out.push(v);
  return out;
}

/* ────────────────────── 사본 자기대조 ────────────────────── */

const 자기대조_입력: [number, Edge[]][] = [
  [WALK_N, WALK_EDGES],
  [RING_N, RING_EDGES],
  [TAIL_N, TAIL_EDGES],
  [SHARE_N, SHARE_EDGES],
  [BRIDGE_N, BRIDGE_EDGES],
  [SPLIT_N, SPLIT_EDGES],
  [LOOP_A_N, LOOP_A_EDGES],
  [LOOP_B_N, LOOP_B_EDGES],
  [LOOP_C_N, LOOP_C_EDGES],
  [LOOP_D_N, LOOP_D_EDGES],
  [TWIN_N, TWIN_EDGES],
  [16, chain(16)],
  [16, ring(16)],
  [16, star(16)],
  [12, complete(12)],
  [12, beads(4, 3).e],
  [64, scatter(64, 96, 20260906)],
  [128, scatter(128, 256, 424242)],
];

/** 사본이 정본과 같은 답을 내는지 이 파일을 읽을 때 한 번 확인한다. */
function 자기대조(): void {
  for (const [n, edges] of 자기대조_입력) {
    const ref = list(articulationPoints(n, edges));
    if (list(counted(n, edges, false).cut) !== ref) {
      throw new Error("세는 사본이 정본과 다른 답을 낸다");
    }
    if (list(counted(n, edges, true).cut) !== ref) {
      throw new Error("기록하는 사본이 정본과 다른 답을 낸다");
    }
    if (list(recursive(n, edges)) !== ref) {
      throw new Error("재귀 사본이 정본과 다른 답을 낸다");
    }
    if (list(byDeletion(n, edges).cut) !== ref) {
      throw new Error("정점을 지워 보는 사본이 정본과 다른 답을 낸다");
    }
    if (list(sharedByBlocks(n, edges)) !== ref) {
      throw new Error("블록으로 가르는 사본이 정본과 다른 답을 낸다");
    }
    if (list(ruleWith(n, edges, lowByDefinition(n, edges))) !== ref) {
      throw new Error("정의로 계산한 low 가 정본과 다른 답을 낸다");
    }
    const c = counted(n, edges, false);
    if (list(c.low) !== list(lowByDefinition(n, edges))) {
      throw new Error("사본의 low 가 정의로 계산한 low 와 다르다");
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./articulationPoints-guide.ref.ts", import.meta.url)
  .pathname;

interface Impl {
  articulationPoints(n: number, edges: Edge[]): number[];
}

/** 두 끝이 같은 간선을 거르는 줄을 뺀 사본. */
const keepLoops = await loadMutant<Impl>(REF, {
  drop: /if \(u === v\) continue;/,
});

/** 부모 건너뛰기를 안 하고 이미 들어갔던 정점이면 전부 low 를 줄이는 사본. */
const noSkip = await loadMutant<Impl>(REF, {
  swap: [
    /\} else if \(w !== \(callP\[callP\.length - 1\] as number\)\) \{/,
    "} else if (true) {",
  ],
});

/** 판정의 등호를 뺀 사본. */
const strictly = await loadMutant<Impl>(REF, {
  swap: [
    /if \(parent !== root && \(low\[v\] as number\) >= \(disc\[parent\] as number\)\) \{/,
    "if (parent !== root && (low[v] as number) > (disc[parent] as number)) {",
  ],
});

/** 뿌리를 빼 두는 조건을 뺀 사본 — 뿌리에도 같은 규칙을 적용한다. */
const rootToo = await loadMutant<Impl>(REF, {
  swap: [
    /if \(parent !== root && \(low\[v\] as number\) >= \(disc\[parent\] as number\)\) \{/,
    "if ((low[v] as number) >= (disc[parent] as number)) {",
  ],
});

/** **불변식을 지키던 줄** 하나 — 자식의 `low` 를 부모에게 넘기는 줄을 뺀 사본. */
const noPass = await loadMutant<Impl>(REF, {
  drop: /low\[parent\] = Math\.min\(low\[parent\] as number, low\[v\] as number\);/,
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가
 * **같은 객체**다. 중화 상태에서 아래 검사를 돌리면 언제나 던지게 되고, 그러면 `check-proof`
 * 의 중화 대조가 이 편에서는 실행되지 않는다.
 */
const 중화됨 = strictly.articulationPoints === articulationPoints;

const 갈리는_변이: { label: string; impl: Impl; cases: [number, Edge[]][] }[] =
  [
    {
      label: "등호를 뺀 판",
      impl: strictly,
      cases: [
        [TAIL_N, TAIL_EDGES],
        [SHARE_N, SHARE_EDGES],
        [BRIDGE_N, BRIDGE_EDGES],
      ],
    },
    {
      label: "뿌리에도 같은 규칙을 적용한 판",
      impl: rootToo,
      cases: [
        [RING_N, RING_EDGES],
        [TAIL_N, TAIL_EDGES],
      ],
    },
    {
      label: "자식의 low 를 안 넘기는 판",
      impl: noPass,
      cases: [
        [RING_N, RING_EDGES],
        [6, ring(6)],
      ],
    },
  ];

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
// 사본의 변이 스위치가 기계로 만든 변이와 같은 답을 내는지도 여기서 본다.
if (!중화됨) {
  for (const { label, impl, cases } of 갈리는_변이) {
    if (
      cases.every(
        ([n, e]) =>
          list(articulationPoints(n, e)) ===
          list(impl.articulationPoints(n, e)),
      )
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
  const pairsOf: [Variant, Impl][] = [
    ["noSkip", noSkip],
    ["strict", strictly],
    ["rootToo", rootToo],
    ["noPass", noPass],
  ];
  for (const [variant, impl] of pairsOf) {
    for (const [n, e] of 자기대조_입력) {
      if (
        list(counted(n, e, false, variant).cut) !==
        list(impl.articulationPoints(n, e))
      ) {
        throw new Error(`사본의 ${variant} 스위치가 기계로 만든 변이와 다르다`);
      }
    }
  }
}

/** 변이 하나를 입력 여럿에 걸어 정본과 나란히 놓는다. */
function mutantRows(impl: Impl, cases: [string, number, Edge[]][]): string[][] {
  return cases.map(([label, n, e]) => {
    const a = list(articulationPoints(n, e));
    const b = list(impl.articulationPoints(n, e));
    return [label, a, b, a === b ? "같다" : "다르다"];
  });
}

const 변이_입력: [string, number, Edge[]][] = [
  ["전개 입력", WALK_N, WALK_EDGES],
  ["사이클 하나", RING_N, RING_EDGES],
  ["꼬리가 붙은 삼각형", TAIL_N, TAIL_EDGES],
  ["삼각형 둘이 정점 하나를 함께 씀", SHARE_N, SHARE_EDGES],
  ["삼각형 둘을 간선 하나가 이음", BRIDGE_N, BRIDGE_EDGES],
  ["떨어진 두 성분", SPLIT_N, SPLIT_EDGES],
];

const 자기간선_입력: [string, number, Edge[]][] = [
  ["삼각형 + 두 끝이 같은 간선 하나", LOOP_A_N, LOOP_A_EDGES],
  ["전개 입력 + 두 끝이 같은 간선 둘", LOOP_B_N, LOOP_B_EDGES],
  ["꼬리가 붙은 삼각형 + 그 간선 하나", LOOP_C_N, LOOP_C_EDGES],
  ["두 끝이 같은 간선만", LOOP_D_N, LOOP_D_EDGES],
];

/* ────────────────────────── 수치 ────────────────────────── */

export const V_LIMIT = 100_000;
export const E_LIMIT = 100_000;
export const OPS_PER_SEC = 1e8;

const LABELS: [string, string][] = [
  ["①", "이웃 목록을 만든다"],
  ["②", "정점마다의 칸을 만든다"],
  ["③", "정점에 처음 들어간다"],
  ["④", "처음 보는 이웃으로 내려간다"],
  ["⑤", "이미 들어갔던 정점에서 low 를 줄인다"],
  ["⑥", "부모를 건너뛴다"],
  ["⑦", "이웃을 다 본 정점을 빼고 low 를 넘긴다"],
  ["⑧", "뿌리가 아닌 부모를 단절점으로 적는다"],
  ["⑨", "뿌리를 나무 자식 수로 판정한다"],
];

function branchCounts(n: number, edges: Edge[]): number[] {
  const c = counted(n, edges, false);
  return [
    1,
    1,
    c.enters,
    c.tree,
    c.back,
    c.skip,
    c.pops,
    c.marks,
    c.roots.length,
  ];
}

/**
 * 걸음 하나가 다루는 자리 — 간선을 읽은 걸음이면 `u−v`, 아니면 정점 번호 하나.
 * 진입은 부모에서 자식으로 내려간 것이라 `w−v` 이고, 나머지는 지금 정점에서 이웃을 본 것이라 `v−w` 다.
 */
export function site(s: Step): string {
  if (s.w === null) return String(s.v);
  return s.kind === "진입" ? ed(s.w, s.v) : ed(s.v, s.w);
}

/** 걸음 표의 마지막 열 — 이 걸음이 한 일. */
export function stepNote(s: Step): string {
  switch (s.kind) {
    case "진입":
      return `disc[${s.v}] = low[${s.v}] = ${s.disc[s.v]}`;
    case "건너뜀":
      return `부모 ${s.w}${josa(String(s.w), "이라", "라")} low[${s.v}] 는 ${s.low[s.v]} 그대로`;
    case "줄임":
      return `low[${s.v}] = min(${s.lowFrom?.before}, disc[${s.w}] = ${s.disc[s.w as number]}) = ${s.low[s.v]}`;
    case "복귀":
      return s.parent === null
        ? "뿌리를 빼서 호출 스택이 비었다"
        : `low[${s.parent}] = min(${s.lowFrom?.before}, low[${s.v}] = ${s.low[s.v]}) = ${s.low[s.parent]}${s.judge?.rooted ? " · 부모가 뿌리라 판정하지 않는다" : ""}`;
    case "판정":
      return `low[${s.v}] = ${s.judge?.lowC} ≥ disc[${s.parent}] = ${s.judge?.discP} 이라 ${s.parent}${은는(String(s.parent))} 단절점`;
    default:
      return `뿌리 ${s.v} 의 나무 자식 ${s.rootKids} 개 — ${(s.rootKids ?? 0) >= 2 ? "단절점이다" : "단절점이 아니다"}`;
  }
}

/** 전개 입력의 걸음 기록 — 정본과 같은 절차를 실행한 사본에서. */
export function walkSteps(): { steps: Step[]; counts: Counts } {
  const counts = counted(WALK_N, WALK_EDGES);
  return { steps: counts.steps, counts };
}

/** `T#` 번호로 걸음 하나를 찾는다 — T1 이 준비라 사본의 첫 걸음이 T2 다. */
export function stepAt(steps: readonly Step[], t: number): Step {
  return steps[t - 2] as Step;
}

/** 걸음의 `T#` 번호. */
export const tOf = (steps: readonly Step[], s: Step): number =>
  steps.indexOf(s) + 2;

/** 두 규칙으로 판정한 까닭 한 칸 — 뿌리는 자식 수, 나머지는 자식 low 와 자기 disc. */
function reasonOf(c: Counts, v: number): string {
  const kids = c.children[v] as number[];
  if ((c.parent[v] as number) === -1) {
    return `뿌리 · 나무 자식 ${kids.length} 개`;
  }
  if (kids.length === 0) return "나무 자식이 없다";
  const hit = kids.find((x) => (c.low[x] as number) >= (c.disc[v] as number));
  const x = hit ?? (kids[0] as number);
  return `low[${x}] = ${c.low[x]} ${hit === undefined ? "<" : "≥"} disc[${v}] = ${c.disc[v]}`;
}

const yes = (b: boolean): string => (b ? "예" : "아니오");

/** 나무 간선이 아닌 간선이 부분트리 `sub` 에서 `v` 가 아닌 바깥으로 나가는가 — 그 간선들. */
function upEdges(t: Tree, edges: Edge[], c: number, v: number): Edge[] {
  const sub = t.subtree[c] as number[];
  const out: Edge[] = [];
  for (const [x, y] of edges) {
    if (x === y) continue;
    const xi = sub.includes(x);
    const yi = sub.includes(y);
    if (xi && !yi && y !== v) out.push([x, y]);
    else if (yi && !xi && x !== v) out.push([y, x]);
  }
  return out;
}

/** 뿌리에서 `v` 까지의 나무 경로 — 들어간 직후의 호출 스택. */
function pathTo(parent: readonly number[], v: number): number[] {
  const out: number[] = [];
  let x = v;
  while (x !== -1) {
    out.unshift(x);
    x = parent[x] as number;
  }
  return out;
}

/**
 * 가장 단순한 후보가 내는 답 — 「자식의 부분트리에 되돌아가는 간선이 하나라도 있으면 부모를 지워도
 * 붙어 있다」. 뿌리는 두 규칙과 같이 나무 자식 수로 본다.
 */
export function candidateAnswer(n: number, edges: Edge[]): number[] {
  const t = tree(n, edges);
  const out: number[] = [];
  for (let p = 0; p < n; p++) {
    const kids = t.children[p] as number[];
    if ((t.parent[p] as number) === -1) {
      if (kids.length >= 2) out.push(p);
      continue;
    }
    const loose = kids.some(
      (c) => !t.backEdges.some(([b]) => (t.subtree[c] as number[]).includes(b)),
    );
    if (loose) out.push(p);
  }
  return out;
}

export const PROOFS: Record<string, () => string> = {
  /* ─────────────── concept ─────────────── */

  /** 정의 그대로 — 정점을 하나씩 지우고 남는 덩어리를 센다. */
  conceptDelete: () => {
    const base = pieces(WALK_N, WALK_EDGES, -1).length;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const p = pieces(WALK_N, WALK_EDGES, v);
      return [
        String(v),
        p.map(set).join(" · "),
        `${base} → ${p.length}`,
        p.length > base ? "단절점" : "아니다",
      ];
    });
    const cut = rows.filter((r) => r[3] === "단절점").map((r) => r[0]);
    return [
      md(["지운 정점", "남는 덩어리", "덩어리 수", "판정"], rows, [0]),
      "",
      `덩어리 수가 늘어나는 정점은 ${cut.join(" · ")} 이고, 정본이 낸 답도 ${list(articulationPoints(WALK_N, WALK_EDGES))} 입니다.`,
    ].join("\n");
  },

  /** 두 수와 판정 규칙 둘이 낸 답. */
  conceptRules: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(c.disc[v]),
      String(c.low[v]),
      (c.children[v] as number[]).length === 0
        ? "없음"
        : (c.children[v] as number[]).join(" · "),
      reasonOf(c, v),
      c.cut.includes(v) ? "단절점" : "아니다",
    ]);
    return [
      md(
        ["정점", "disc", "low", "나무 자식", "판정의 근거", "판정"],
        rows,
        [0, 1, 2],
      ),
      "",
      `두 규칙이 낸 답은 ${list(c.cut)} 이고, 정점을 하나씩 지워 본 답도 ${list(byDeletion(WALK_N, WALK_EDGES).cut)} 입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.origin ─────────────── */

  /** 가장 단순한 방법 — 정점마다 지워 보기를 사슬에서 센다. */
  naiveScale: () => {
    const sizes = [4, 8, 16, 32, 64];
    let exact = 0;
    const rows = sizes.map((v) => {
      const e = chain(v);
      const d = byDeletion(v, e);
      const c = counted(v, e, false);
      const times = d.reads / c.reads;
      if (times === v) exact++;
      return [
        comma(v),
        comma(e.length),
        comma(d.scans),
        comma(d.reads),
        comma(c.reads),
        comma(times),
      ];
    });
    const scans = V_LIMIT + 1;
    const upper = scans * 2 * E_LIMIT;
    return [
      md(
        [
          "정점 V",
          "간선 E",
          "탐색 횟수",
          "지워 보기의 이웃 자리 읽기",
          "깊이 우선 탐색 한 번의 이웃 자리 읽기",
          "몇 배",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `${ko(sizes.length)} 줄 중 ${exact} 줄에서 「몇 배」가 정점 수 V 와 같습니다. 규모의 상한 V = E = ${comma(V_LIMIT)} 에서는 탐색이 ${comma(scans)} 번이고, 탐색 한 번이 이웃 자리를 많아야 2E = ${comma(2 * E_LIMIT)} 개 읽으니 읽기가 많아야 ${comma(upper)} 번입니다. 초당 1 억 번 기준 ${(upper / OPS_PER_SEC).toFixed(0)} 초입니다.`,
    ].join("\n");
  },

  /** 같은 입력을 두 방식으로 처리하고 계수를 나란히 놓는다. */
  twoWays: () => {
    const d = byDeletion(WALK_N, WALK_EDGES);
    const c = counted(WALK_N, WALK_EDGES, false);
    return [
      md(
        ["방법", "탐색 횟수", "이웃 자리 읽기", "답"],
        [
          ["정점마다 지워 보기", comma(d.scans), comma(d.reads), list(d.cut)],
          [
            "깊이 우선 탐색 한 번",
            comma(c.roots.length),
            comma(c.reads),
            list(c.cut),
          ],
        ],
        [1, 2],
      ),
      "",
      `두 방법의 답이 ${list(d.cut) === list(c.cut) ? "같고" : "다르고"}, 이웃 자리 읽기는 ${d.reads} 번과 ${c.reads} 번입니다. 이웃 목록의 자리는 모두 ${2 * (WALK_EDGES.length - c.loops)} 개입니다.`,
    ].join("\n");
  },

  /** 깊이 우선 탐색 한 번이 남기는 나무 — 정점마다 부모 · 나무 자식 · 부분트리. */
  treeSplit: () => {
    const t = tree(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(t.disc[v]),
      (t.parent[v] as number) === -1 ? "없음 (뿌리)" : String(t.parent[v]),
      (t.children[v] as number[]).length === 0
        ? "없음"
        : (t.children[v] as number[]).join(" · "),
      set(t.subtree[v] as number[]),
    ]);
    return [
      md(["정점", "disc", "부모", "나무 자식", "부분트리"], rows, [0, 1]),
      "",
      `나무 간선 ${t.treeEdges.length} 개와 되돌아가는 간선 ${t.backEdges.length} 개가 간선 ${WALK_EDGES.length} 개를 나눠 가집니다. 되돌아가는 간선은 ${t.backEdges.map(([b, a]) => ed(b, a)).join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** 정점을 지우면 자식의 부분트리가 조각이 된다 — 위로 가는 간선이 없을 때만. */
  observeSplit: () => {
    const t = tree(WALK_N, WALK_EDGES);
    let agree = 0;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const kids = t.children[v] as number[];
      const root = (t.parent[v] as number) === -1;
      const cells = kids.map((c) => {
        const up = upEdges(t, WALK_EDGES, c, v);
        return { c, up };
      });
      const loose = root
        ? cells.length
        : cells.filter((x) => x.up.length === 0).length + 1;
      const actual = pieces(WALK_N, WALK_EDGES, v).length;
      if (loose === actual) agree++;
      return [
        String(v),
        kids.length === 0
          ? "없음"
          : cells.map((x) => set(t.subtree[x.c] as number[])).join(" · "),
        root
          ? "뿌리라 위가 없다"
          : cells.length === 0
            ? "-"
            : cells
                .map((x) =>
                  x.up.length === 0
                    ? "없음"
                    : x.up.map(([a, b]) => ed(a, b)).join(" · "),
                )
                .join(" / "),
        String(loose),
        String(actual),
      ];
    });
    return [
      md(
        [
          "지운 정점 v",
          "v 의 나무 자식의 부분트리",
          "그 부분트리에서 v 위로 가는 간선",
          "부분트리로 센 덩어리 수",
          "지운 뒤 실제 덩어리 수",
        ],
        rows,
        [0, 3, 4],
      ),
      "",
      `${ko(WALK_N)} 줄 중 두 수가 일치한 줄은 ${agree} 줄입니다.`,
    ].join("\n");
  },

  /** 가장 단순한 후보 — 「부분트리에 되돌아가는 간선이 하나라도 있으면 붙어 있다」. */
  firstCandidate: () => {
    const t = tree(BRIDGE_N, BRIDGE_EDGES);
    const truth = articulationPoints(BRIDGE_N, BRIDGE_EDGES);
    const guess = candidateAnswer(BRIDGE_N, BRIDGE_EDGES);
    const rows: string[][] = [];
    for (let p = 0; p < BRIDGE_N; p++) {
      const kids = t.children[p] as number[];
      if ((t.parent[p] as number) === -1) continue;
      for (const c of kids) {
        const sub = t.subtree[c] as number[];
        const inside = t.backEdges.filter(([b]) => sub.includes(b));
        const g = inside.length > 0 ? "붙어 있다" : "떨어진다";
        const real = truth.includes(p) ? "떨어진다" : "붙어 있다";
        rows.push([
          ed(p, c),
          set(sub),
          inside.length === 0
            ? "없음"
            : inside.map(([b, a]) => ed(b, a)).join(" · "),
          g,
          real,
        ]);
      }
    }
    const wrong = rows.filter((r) => r[3] !== r[4]).length;
    return [
      md(
        [
          "나무 간선",
          "자식의 부분트리",
          "부분트리에서 나가는 되돌아가는 간선",
          "후보가 본 부분트리",
          "부모를 지운 실제 결과",
        ],
        rows,
      ),
      "",
      `나무 간선 ${rows.length} 개 가운데 후보가 실제와 어긋난 것은 ${wrong} 개입니다. 후보가 낸 답은 ${list(guess)} 이고, 정본이 낸 답은 ${list(truth)} 입니다.`,
    ].join("\n");
  },

  /** 「있는가」 대신 「어디까지 가는가」 — 되돌아가는 간선이 이르는 가장 이른 발견 순서. */
  candidateFix: () => {
    const t = tree(BRIDGE_N, BRIDGE_EDGES);
    const truth = articulationPoints(BRIDGE_N, BRIDGE_EDGES);
    const rows: string[][] = [];
    let agree = 0;
    for (let p = 0; p < BRIDGE_N; p++) {
      if ((t.parent[p] as number) === -1) continue;
      for (const c of t.children[p] as number[]) {
        const sub = t.subtree[c] as number[];
        const reach = t.backEdges
          .filter(([b]) => sub.includes(b))
          .map(([, a]) => t.disc[a] as number);
        const min = reach.length === 0 ? null : Math.min(...reach);
        const above = min !== null && min < (t.disc[p] as number);
        const real = truth.includes(p) ? "떨어진다" : "붙어 있다";
        if ((above ? "붙어 있다" : "떨어진다") === real) agree++;
        rows.push([
          ed(p, c),
          min === null ? "없음" : String(min),
          String(t.disc[p]),
          yes(above),
          real,
        ]);
      }
    }
    return [
      md(
        [
          "나무 간선",
          "되돌아가는 간선이 이르는 가장 이른 disc",
          "부모의 disc",
          "부모보다 위로 감",
          "부모를 지운 실제 결과",
        ],
        rows,
        [1, 2],
      ),
      "",
      `${ko(rows.length)} 줄 모두에서 「위로 감」이 예인 줄은 붙어 있고, 아니오인 줄은 떨어집니다 — 일치한 줄이 ${agree} 줄입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 깊이 우선 탐색 트리 ─────────────── */

  /** 정점 하나를 읽는 법 — 여섯 칸. */
  treeVertices: () => {
    const t = tree(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(t.disc[v]),
      (t.parent[v] as number) === -1 ? "없음 (뿌리)" : String(t.parent[v]),
      String(t.depth[v]),
      (t.children[v] as number[]).length === 0
        ? "없음"
        : (t.children[v] as number[]).join(" · "),
      set(t.subtree[v] as number[]),
      list(pathTo(t.parent, v)),
    ]);
    return md(
      [
        "정점",
        "disc",
        "부모",
        "깊이",
        "나무 자식",
        "부분트리",
        "들어간 직후의 호출 스택",
      ],
      rows,
      [0, 1, 3],
    );
  },

  /** 간선끼리의 관계 — 무향 그래프에서는 모든 간선의 두 끝이 조상과 자손이다. */
  treeEdges: () => {
    const t = tree(WALK_N, WALK_EDGES);
    const c = counted(WALK_N, WALK_EDGES, false);
    let related = 0;
    const rows = WALK_EDGES.map(([u, v], k) => {
      const top = (t.disc[u] as number) < (t.disc[v] as number) ? u : v;
      const bottom = top === u ? v : u;
      const ok = isAncestor(t.parent, top, bottom);
      if (ok) related++;
      return [
        ed(u, v),
        `${t.disc[u]} · ${t.disc[v]}`,
        String(top),
        yes(ok),
        c.kinds[k] ?? "-",
      ];
    });
    return [
      md(
        [
          "간선",
          "두 끝의 disc",
          "먼저 발견한 끝",
          "다른 끝이 그 부분트리 안",
          "종류",
        ],
        rows,
      ),
      "",
      `간선 ${WALK_EDGES.length} 개 중 두 끝이 조상과 자손인 것은 ${related} 개입니다. 나무 간선이 ${t.treeEdges.length} 개, 되돌아가는 간선이 ${t.backEdges.length} 개입니다.`,
    ].join("\n");
  },

  /** 헷갈리기 쉬운 모양 — 너비 우선 탐색 트리. */
  bfsContrast: () => {
    const t = tree(WALK_N, WALK_EDGES);
    const b = bfsRule(WALK_N, WALK_EDGES);
    const first = [
      ...t.backEdges.map(([x, y]) => [
        "깊이 우선 탐색 트리",
        ed(x, y),
        yes(isAncestor(t.parent, y, x) || isAncestor(t.parent, x, y)),
      ]),
      ...b.nonTree.map(([x, y]) => [
        "너비 우선 탐색 트리",
        ed(x, y),
        yes(isAncestor(b.parent, x, y) || isAncestor(b.parent, y, x)),
      ]),
    ];
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 하나", RING_N, RING_EDGES],
      ["꼬리가 붙은 삼각형", TAIL_N, TAIL_EDGES],
      ["삼각형 둘이 정점 하나를 함께 씀", SHARE_N, SHARE_EDGES],
      ["삼각형 둘을 간선 하나가 이음", BRIDGE_N, BRIDGE_EDGES],
    ];
    let bfsOk = 0;
    const second = cases.map(([label, n, e]) => {
      const truth = list(byDeletion(n, e).cut);
      const got = list(bfsRule(n, e).cut);
      if (got === truth) bfsOk++;
      return [label, list(articulationPoints(n, e)), got, truth];
    });
    return [
      md(["나무", "나무 간선이 아닌 간선", "두 끝이 조상과 자손"], first),
      "",
      "같은 두 규칙을 두 나무에 적용해 답을 내면 이렇습니다.",
      "",
      md(
        [
          "입력",
          "깊이 우선 탐색 트리로 낸 답",
          "너비 우선 탐색 트리로 낸 답",
          "정점을 지워 본 답",
        ],
        second,
      ),
      "",
      `${ko(cases.length)} 입력 중 너비 우선 탐색 트리로 낸 답이 정점을 지워 본 답과 일치한 것은 ${bfsOk} 개입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — low 값 ─────────────── */

  /** 정점 하나의 low 값을 정의대로 읽는다. */
  lowReadOne: () => {
    const v = 1;
    const t = tree(WALK_N, WALK_EDGES);
    const c = counted(WALK_N, WALK_EDGES, false);
    const sub = t.subtree[v] as number[];
    const backs = t.backEdges.filter(([b]) => sub.includes(b));
    const min = Math.min(
      t.disc[v] as number,
      ...backs.map(([, a]) => t.disc[a] as number),
    );
    return [
      md(
        ["항", "보는 것", "값"],
        [
          ["자기 발견 순서", `disc[${v}]`, String(t.disc[v])],
          ["부분트리", `정점 ${v} 의 부분트리`, set(sub)],
          [
            "되돌아가는 간선",
            "부분트리에서 나가는 되돌아가는 간선",
            backs.length === 0
              ? "없음"
              : backs
                  .map(([b, a]) => `${ed(b, a)} (disc ${t.disc[a]})`)
                  .join(" · "),
          ],
          ["가장 작은 값", "위 발견 순서 중 가장 작은 것", String(min)],
        ],
      ),
      "",
      `정의에서 읽은 값은 ${min}${josa(String(min), "이고", "고")}, 절차를 실행해 얻은 low[${v}] 도 ${c.low[v]} 입니다.`,
    ].join("\n");
  },

  /** 부모와 자식의 low 값. */
  lowTable: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    let a = 0;
    let b = 0;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const p = c.parent[v] as number;
      const leq = (c.low[v] as number) <= (c.disc[v] as number);
      const up = p === -1 || (c.low[p] as number) <= (c.low[v] as number);
      if (leq) a++;
      if (up) b++;
      return [
        String(v),
        String(c.disc[v]),
        String(c.low[v]),
        p === -1 ? "없음" : String(p),
        p === -1 ? "-" : String(c.low[p]),
        yes(leq),
        p === -1 ? "-" : yes(up),
      ];
    });
    return [
      md(
        [
          "정점",
          "disc",
          "low",
          "부모",
          "부모의 low",
          "low ≤ disc",
          "부모의 low ≤ 자기 low",
        ],
        rows,
        [0, 1, 2, 4],
      ),
      "",
      `low ≤ disc 는 ${ko(WALK_N)} 줄 중 ${a} 줄에서, 부모의 low ≤ 자기 low 는 부모가 있는 ${WALK_N - c.roots.length} 줄 중 ${b - c.roots.length} 줄에서 성립합니다.`,
    ].join("\n");
  },

  /** 헷갈리기 쉬운 읽기 — 갈 수 있는 정점 중 가장 이른 발견 순서. */
  lowVsReach: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const r = reachLow(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(c.disc[v]),
      String(c.low[v]),
      String(r[v]),
    ]);
    const byReach = ruleWith(WALK_N, WALK_EDGES, r);
    const byLow = ruleWith(WALK_N, WALK_EDGES, c.low);
    return [
      md(
        ["정점", "disc", "low", "갈 수 있는 정점 중 가장 이른 disc"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `두 규칙에 low 를 넣으면 답이 ${list(byLow)}, 도달로 읽은 값을 넣으면 ${list(byReach)} 입니다. 정본이 낸 답은 ${list(articulationPoints(WALK_N, WALK_EDGES))} 입니다.`,
    ].join("\n");
  },

  /** 두 규칙이 정의와 같은 답을 내는가 — 모양이 다른 아홉 그래프. */
  criterionCheck: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 하나", RING_N, RING_EDGES],
      ["꼬리가 붙은 삼각형", TAIL_N, TAIL_EDGES],
      ["삼각형 둘이 정점 하나를 함께 씀", SHARE_N, SHARE_EDGES],
      ["삼각형 둘을 간선 하나가 이음", BRIDGE_N, BRIDGE_EDGES],
      ["떨어진 두 성분", SPLIT_N, SPLIT_EDGES],
      ["사슬 (V = 8)", 8, chain(8)],
      ["별 (V = 8)", 8, star(8)],
      ["완전 그래프 (V = 8)", 8, complete(8)],
    ];
    let agree = 0;
    const rows = cases.map(([label, n, e]) => {
      const a = list(counted(n, e, false).cut);
      const d = list(byDeletion(n, e).cut);
      if (a === d) agree++;
      return [label, String(n), String(e.length), a, d];
    });
    return [
      md(
        ["입력", "V", "E", "두 규칙으로 낸 답", "정점을 지워 본 답"],
        rows,
        [1, 2],
      ),
      "",
      `${ko(cases.length)} 줄 중 두 답이 일치한 줄은 ${agree} 줄입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.build — 단계 ─────────────── */

  /** 1단계 — 정점에 들어가는 걸음. */
  stageEnter: () => {
    const { steps } = walkSteps();
    const rows = steps
      .filter((s) => s.kind === "진입")
      .map((s) => [
        `T${tOf(steps, s)}`,
        String(s.v),
        s.w === null ? "바깥 반복" : `간선 ${ed(s.w, s.v)}`,
        String(s.disc[s.v]),
        list(s.call),
        list(s.callP),
      ]);
    return md(
      [
        "걸음",
        "들어간 정점",
        "들어온 자리",
        "disc = low",
        "들어간 뒤 callV",
        "들어간 뒤 callP",
      ],
      rows,
      [3],
    );
  },

  /** 2단계 — 이웃 자리마다 셋 중 하나. */
  stageNeighbors: () => {
    const { steps, counts } = walkSteps();
    const reads = steps.filter(
      (s) => s.kind === "진입" || s.kind === "건너뜀" || s.kind === "줄임",
    );
    const rows = reads
      .filter((s) => !(s.kind === "진입" && s.w === null))
      .map((s) => {
        const from = s.kind === "진입" ? (s.w as number) : s.v;
        const to = s.kind === "진입" ? s.v : (s.w as number);
        const before = s.kind === "줄임" ? s.lowFrom?.before : s.low[from];
        return [
          `T${tOf(steps, s)}`,
          ed(from, to),
          s.kind === "진입" ? "-" : String(s.disc[to]),
          s.kind === "진입"
            ? "처음 봄"
            : s.kind === "건너뜀"
              ? "부모"
              : "이미 들어갔던 정점",
          s.kind === "진입"
            ? "내려간다"
            : s.kind === "건너뜀"
              ? "건너뛴다"
              : "low 를 줄인다",
          s.kind === "줄임" && before !== s.low[from]
            ? `${before} → ${s.low[from]}`
            : `${s.kind === "진입" ? s.low[from] : before} 그대로`,
        ];
      });
    const changed = steps.filter(
      (s) => s.kind === "줄임" && s.lowFrom?.before !== s.low[s.v],
    ).length;
    return [
      md(
        [
          "걸음",
          "이웃 자리",
          "이웃의 disc",
          "이웃의 상태",
          "갈래",
          "지금 정점의 low",
        ],
        rows,
      ),
      "",
      `이웃 자리 ${counts.reads} 개가 ${rows.length} 걸음에서 한 번씩 읽혔습니다. 내려간 자리가 ${counts.tree} 개, 부모를 건너뛴 자리가 ${counts.skip} 개, low 를 줄이는 갈래로 간 자리가 ${counts.back} 개이고 그중 값이 실제로 줄어든 것은 ${changed} 개입니다.`,
    ].join("\n");
  },

  /** 3단계 — 뺀 정점의 low 를 부모에게 넘긴다. */
  stagePass: () => {
    const { steps } = walkSteps();
    const rows = steps
      .filter((s) => s.kind === "복귀" || s.kind === "판정")
      .map((s) => [
        `T${tOf(steps, s)}`,
        String(s.v),
        String(s.low[s.v]),
        s.parent === null ? "없음" : String(s.parent),
        s.parent === null ? "-" : `${s.lowFrom?.before} → ${s.low[s.parent]}`,
      ]);
    return md(
      ["걸음", "뺀 정점", "그 정점의 low", "부모", "부모의 low"],
      rows,
      [2],
    );
  },

  /** 4단계 — 뿌리가 아닌 부모의 판정. */
  stageJudge: () => {
    const { steps } = walkSteps();
    const pops = steps.filter(
      (s) => (s.kind === "복귀" || s.kind === "판정") && s.judge !== null,
    );
    const rows = pops.map((s) => {
      const j = s.judge as Judge;
      return [
        `T${tOf(steps, s)}`,
        String(s.v),
        String(s.parent),
        String(j.lowC),
        String(j.discP),
        yes(j.rooted),
        j.rooted ? "보지 않는다" : yes(j.lowC >= j.discP),
        j.hit ? `cut[${s.parent}]` : "-",
      ];
    });
    const hits = pops.filter((s) => s.judge?.hit).map((s) => s.parent);
    const rooted = pops.filter((s) => s.judge?.rooted).length;
    return [
      md(
        [
          "걸음",
          "뺀 자식",
          "부모",
          "low[자식]",
          "disc[부모]",
          "부모가 뿌리",
          "low[자식] ≥ disc[부모]",
          "적은 것",
        ],
        rows,
        [3, 4],
      ),
      "",
      `부모가 있는 정점을 뺀 ${pops.length} 걸음 가운데 부모를 단절점으로 적은 것은 ${hits.length} 걸음(정점 ${hits.join(" · ")})이고, 부모가 뿌리라 판정하지 않은 것이 ${rooted} 걸음입니다.`,
    ].join("\n");
  },

  /** 5단계 — 뿌리는 나무 자식 수로. */
  stageRoot: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["사이클 하나", RING_N, RING_EDGES],
      ["별 (V = 5)", 5, star(5)],
      ["사슬 (V = 5)", 5, chain(5)],
      ["떨어진 두 성분", SPLIT_N, SPLIT_EDGES],
    ];
    let agree = 0;
    let total = 0;
    const rows: string[][] = [];
    for (const [label, n, e] of cases) {
      const c = counted(n, e, false);
      const truth = byDeletion(n, e).cut;
      for (const r of c.roots) {
        const kids = (c.children[r] as number[]).length;
        const said = kids >= 2;
        const real = truth.includes(r);
        total++;
        if (said === real) agree++;
        rows.push([
          label,
          String(r),
          String(kids),
          said ? "단절점" : "아니다",
          real ? "단절점" : "아니다",
        ]);
      }
    }
    return [
      md(
        ["입력", "뿌리", "나무 자식 수", "뿌리 규칙의 판정", "지워 본 판정"],
        rows,
        [1, 2],
      ),
      "",
      `뿌리 ${total} 곳 중 두 판정이 일치한 곳은 ${agree} 곳입니다.`,
    ].join("\n");
  },

  /** 호출 스택을 배열로 드는 까닭 — 재귀 판이 어느 규모에서 멈추는가. */
  designRecursion: () => {
    const rows = [100, 1_000, 10_000].map((v) => {
      const e = chain(v);
      return [
        comma(v),
        `${comma(articulationPoints(v, e).length)} 개`,
        `${comma(recursive(v, e).length)} 개`,
      ];
    });
    const big = V_LIMIT;
    const bigEdges = chain(big);
    let deep: string;
    try {
      deep = `${comma(recursive(big, bigEdges).length)} 개`;
    } catch (err) {
      deep =
        err instanceof RangeError
          ? "호출 스택이 한계를 넘어 실행이 멈춘다"
          : "실행이 멈춘다";
    }
    rows.push([
      comma(big),
      `${comma(articulationPoints(big, bigEdges).length)} 개`,
      deep,
    ]);
    return [
      md(
        ["사슬의 정점 수", "배열로 든 판의 단절점", "재귀로 적은 판의 단절점"],
        rows,
        [0],
      ),
      "",
      `사슬에서는 호출 깊이가 정점 수와 같습니다. 정확히 몇 개에서 멈추는지는 런타임이 정하는 값이고, 규모의 상한 V = ${comma(V_LIMIT)} 은 이 실행에서 멈춘 쪽에 있습니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.walk ─────────────── */

  /** T1 — 준비 조각만 실행한 결과. */
  walkT1: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const adj = c.adj.map((a, v) => `${v}:${list(a)}`).join("  ");
    const blank = Array.from({ length: WALK_N }, () => -1);
    return [
      "T1 이 끝난 시점",
      ...pairs([
        ["adj", adj],
        ["disc", list(blank)],
        ["low", list(blank)],
        ["cut", list(blank.map(() => "false"))],
        ["timer", "0"],
      ]).map((l) => `  ${l}`),
    ].join("\n");
  },

  /** 짚고 가기 — 두 끝이 같은 간선을 거르는 줄을 뺐을 때. */
  pauseSelfLoop: () => {
    const rows = 자기간선_입력.map(([label, n, e]) => {
      const c = counted(n, e, false);
      const a = list(articulationPoints(n, e));
      const b = list(keepLoops.articulationPoints(n, e));
      return [
        label,
        String(c.loops),
        a,
        b,
        a === b ? "같다" : "다르다",
        String(c.reads),
        String(c.reads + 2 * c.loops),
      ];
    });
    const same = rows.filter((r) => r[4] === "같다").length;
    return [
      md(
        [
          "입력",
          "두 끝이 같은 간선",
          "정본",
          "그 줄을 뺀 판",
          "판정",
          "정본의 이웃 자리 읽기",
          "뺀 판의 이웃 자리 읽기",
        ],
        rows,
        [1, 5, 6],
      ),
      "",
      `${ko(rows.length)} 입력 중 답이 일치한 것은 ${same} 개입니다. 뺀 판은 두 끝이 같은 간선 하나마다 이웃 자리를 2 개씩 더 읽습니다.`,
    ].join("\n");
  },

  /** T2 · T3 — 진입 조각을 실행한 결과. */
  walkT2T3: () => {
    const { steps } = walkSteps();
    const s2 = stepAt(steps, 2);
    const s3 = stepAt(steps, 3);
    const block = (s: Step, head: string): string[] => [
      head,
      ...pairs([
        ["disc", dl(s.disc)],
        ["low", dl(s.low)],
        ["callV", list(s.call)],
        ["callI", list(s.callI)],
        ["callP", list(s.callP)],
        ["timer", String(s.timer)],
      ]).map((l) => `  ${l}`),
    ];
    return [
      ...block(s2, `T2 — 바깥 반복이 정점 ${s2.v} 에 들어간다`),
      ...block(
        s3,
        `T3 — 간선 ${site(s3)}${을를(String(s3.v))} 읽고 정점 ${s3.v}${으로(String(s3.v))} 내려간다`,
      ),
    ].join("\n");
  },

  /** T4 · T7 · T10 — 이웃 하나를 읽는 세 갈래 중 둘. */
  walkT4T7T10: () => {
    const { steps } = walkSteps();
    const out: string[] = [];
    for (const t of [4, 7, 10]) {
      const s = stepAt(steps, t);
      const w = s.w as number;
      const par = s.callP[s.callP.length - 1] as number;
      out.push(`T${t} — 정점 ${s.v} 에서 이웃 ${w}${을를(String(w))} 읽는다`);
      const judge =
        s.kind === "건너뜀"
          ? `disc[${w}] = ${s.disc[w]}${josa(String(s.disc[w]), "이라", "라")} -1 이 아니고, 부모 칸이 ${par}${josa(String(par), "이라", "라")} 부모다`
          : `disc[${w}] = ${s.disc[w]}${josa(String(s.disc[w]), "이라", "라")} -1 이 아니고, 부모 칸이 ${par}${josa(String(par), "이라", "라")} 부모가 아니다`;
      const calc =
        s.kind === "건너뜀"
          ? `건너뛴다 — low[${s.v}] 는 ${s.low[s.v]} 그대로`
          : `low[${s.v}] = min(${s.lowFrom?.before}, disc[${w}] = ${s.disc[w]}) = ${s.low[s.v]}`;
      out.push(
        ...pairs([
          ["판정", judge],
          ["계산", calc],
          ["low", dl(s.low)],
          ["callV", list(s.call)],
        ]).map((l) => `  ${l}`),
      );
    }
    return out.join("\n");
  },

  /** 짚고 가기 — 부모 건너뛰기를 빼면 low 가 다른 수가 되지만 답은 그대로다. */
  pauseParentSkip: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const alt = lowWithParent(WALK_N, WALK_EDGES);
    const rows = Array.from({ length: WALK_N }, (_, v) => [
      String(v),
      String(c.disc[v]),
      String(c.low[v]),
      String(alt[v]),
      yes(c.low[v] !== alt[v]),
    ]);
    const gap = rows.filter((r) => r[4] === "예").map((r) => r[0]);
    const answers = mutantRows(noSkip, 변이_입력);
    const same = answers.filter((r) => r[3] === "같다").length;
    return [
      md(
        ["정점", "disc", "정의대로의 low", "부모까지 넣은 low", "두 값의 갈림"],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `두 값이 갈리는 정점은 ${gap.join(" · ")} 입니다. 부모 건너뛰기를 뺀 판을 여섯 입력에 실행하면 이렇습니다.`,
      "",
      md(["입력", "정본", "부모 건너뛰기를 뺀 판", "판정"], answers),
      "",
      `${ko(answers.length)} 입력 중 답이 일치한 것은 ${same} 개입니다.`,
    ].join("\n");
  },

  /** T8 · T15 — 뺀 정점의 low 를 넘기고 부모를 판정한다. */
  walkT8T15: () => {
    const { steps } = walkSteps();
    const out: string[] = [];
    for (const t of [8, 15]) {
      const s = stepAt(steps, t);
      const j = s.judge as Judge;
      const p = s.parent as number;
      out.push(`T${t} — 정점 ${s.v}${을를(String(s.v))} 뺀다`);
      out.push(
        ...pairs([
          [
            "넘기기",
            `low[${p}] = min(${s.lowFrom?.before}, low[${s.v}] = ${s.low[s.v]}) = ${s.low[p]}`,
          ],
          [
            "판정",
            `부모 ${p}${은는(String(p))} 뿌리가 아니고 low[${s.v}] = ${j.lowC} ≥ disc[${p}] = ${j.discP}${이가(String(j.discP))} ${j.hit ? "참" : "거짓"}`,
          ],
          ["cut", list(s.cut)],
          ["callV", list(s.call)],
        ]).map((l) => `  ${l}`),
      );
    }
    return out.join("\n");
  },

  /** 짚고 가기 — 판정의 등호를 뺐을 때. */
  pauseEquality: () => {
    const c = counted(TAIL_N, TAIL_EDGES, false);
    const truth = articulationPoints(TAIL_N, TAIL_EDGES);
    const rows: string[][] = [];
    for (let p = 0; p < TAIL_N; p++) {
      if ((c.parent[p] as number) === -1) continue;
      for (const k of c.children[p] as number[]) {
        const lowK = c.low[k] as number;
        const discP = c.disc[p] as number;
        rows.push([
          ed(p, k),
          String(discP),
          String(lowK),
          lowK >= discP ? "참" : "거짓",
          lowK > discP ? "참" : "거짓",
          truth.includes(p) ? "단절점" : "아니다",
        ]);
      }
    }
    const answers = mutantRows(strictly, 변이_입력);
    const off = answers.filter((r) => r[3] === "다르다").length;
    return [
      md(
        [
          "나무 간선",
          "disc[부모]",
          "low[자식]",
          "low ≥ disc",
          "low > disc",
          "부모의 실제",
        ],
        rows,
        [1, 2],
      ),
      "",
      "등호를 뺀 판을 여섯 입력에 실행하면 이렇습니다.",
      "",
      md(["입력", "정본", "등호를 뺀 판", "판정"], answers),
      "",
      `${ko(answers.length)} 입력 중 답이 갈린 것은 ${off} 개입니다.`,
    ].join("\n");
  },

  /** T16 ~ T18 — 뿌리의 자식을 빼고, 뿌리를 빼고, 뿌리를 판정한다. */
  walkT16T18: () => {
    const { steps } = walkSteps();
    const s16 = stepAt(steps, 16);
    const s17 = stepAt(steps, 17);
    const s18 = stepAt(steps, 18);
    const j = s16.judge as Judge;
    const p = s16.parent as number;
    return [
      `T16 — 정점 ${s16.v}${을를(String(s16.v))} 뺀다`,
      ...pairs([
        [
          "넘기기",
          `low[${p}] = min(${s16.lowFrom?.before}, low[${s16.v}] = ${s16.low[s16.v]}) = ${s16.low[p]}`,
        ],
        [
          "판정",
          `부모 ${p}${이가(String(p))} 뿌리라 ${j.rooted ? "보지 않는다" : "본다"}`,
        ],
        ["callV", list(s16.call)],
      ]).map((l) => `  ${l}`),
      `T17 — 정점 ${s17.v}${을를(String(s17.v))} 뺀다`,
      ...pairs([
        ["넘기기", "부모가 없어 넘기지 않는다"],
        ["callV", list(s17.call)],
      ]).map((l) => `  ${l}`),
      `T18 — 뿌리 ${s18.v}${을를(String(s18.v))} 판정한다`,
      ...pairs([
        [
          "판정",
          `rootKids = ${s18.rootKids}${josa(String(s18.rootKids), "이라", "라")} rootKids ≥ 2 가 ${(s18.rootKids ?? 0) >= 2 ? "참" : "거짓"}`,
        ],
        ["cut", list(s18.cut)],
      ]).map((l) => `  ${l}`),
    ].join("\n");
  },

  /** 짚고 가기 — 뿌리를 빼 두는 조건을 뺐을 때. */
  pauseRootRule: () => {
    const c = counted(RING_N, RING_EDGES, false);
    const r = c.roots[0] as number;
    const kid = (c.children[r] as number[])[0] as number;
    const answers = mutantRows(rootToo, 변이_입력);
    const off = answers.filter((x) => x[3] === "다르다").length;
    return [
      "사이클 하나의 뿌리부터 봅니다.",
      "",
      md(
        ["확인한 것", "사이클 하나"],
        [
          ["뿌리의 나무 자식", (c.children[r] as number[]).join(" · ")],
          [
            "뿌리 규칙의 판정",
            (c.children[r] as number[]).length >= 2 ? "단절점" : "아니다",
          ],
          [
            `자식 ${kid}${을를(String(kid))} 뺄 때의 비교`,
            `low[${kid}] = ${c.low[kid]} ≥ disc[${r}] = ${c.disc[r]}${이가(String(c.disc[r]))} ${(c.low[kid] as number) >= (c.disc[r] as number) ? "참" : "거짓"}`,
          ],
        ],
      ),
      "",
      "뿌리에도 같은 규칙을 적용한 판을 여섯 입력에 실행하면 이렇습니다.",
      "",
      md(["입력", "정본", "뿌리에도 같은 규칙을 적용한 판", "판정"], answers),
      "",
      `${ko(answers.length)} 입력 중 답이 갈린 것은 ${off} 개입니다.`,
    ].join("\n");
  },

  /** deep.walk — 고정 입력을 끝까지 실행한 걸음 표. */
  walkTrace: () => {
    const { steps, counts } = walkSteps();
    const blank = Array.from({ length: WALK_N }, () => -1);
    const rows: string[][] = [
      [
        "T1",
        "준비",
        "-",
        "①②",
        dl(blank),
        dl(blank),
        "[]",
        "[]",
        "이웃 목록과 정점마다의 칸을 만든다",
      ],
    ];
    for (const s of steps) {
      rows.push([
        `T${tOf(steps, s)}`,
        s.kind,
        site(s),
        s.label,
        dl(s.disc),
        dl(s.low),
        list(s.call),
        list(s.cut),
        stepNote(s),
      ]);
    }
    const last = steps.at(-1) as Step;
    const t = steps.length + 2;
    rows.push([
      `T${t}`,
      "반환",
      "-",
      "-",
      dl(last.disc),
      dl(last.low),
      "[]",
      list(counts.cut),
      `${list(counts.cut)}${을를(String(counts.cut.at(-1) ?? ""))} 돌려준다`,
    ]);
    return [
      md(
        [
          "걸음",
          "하는 일",
          "정점 또는 간선",
          "라벨",
          "disc",
          "low",
          "호출 스택",
          "단절점",
          "이 걸음이 한 일",
        ],
        rows,
      ),
      "",
      `이웃 자리 읽기 ${counts.reads} 번 · 진입 ${counts.enters} 번 · 호출 스택에서 빼기 ${counts.pops} 번 · 뿌리 판정 ${counts.roots.length} 번이고, 단절점은 ${counts.cut.length} 개입니다. 호출 스택은 가장 깊을 때 ${counts.peakCall} 칸이었습니다.`,
    ].join("\n");
  },

  /** deep.walk — 아홉 갈래가 두 입력에서 각각 몇 번 실행됐는가. */
  branchCoverage: () => {
    const a = branchCounts(WALK_N, WALK_EDGES);
    const b = branchCounts(BRIDGE_N, BRIDGE_EDGES);
    const rows = LABELS.map(([mark, what], i) => [
      mark,
      what,
      String(a[i]),
      String(b[i]),
    ]);
    return md(
      ["라벨", "하는 일", "전개 입력", "삼각형 둘을 간선 하나가 이음"],
      rows,
      [2, 3],
    );
  },

  /** deep.walk.final — 전체 코드를 실행한 결과. */
  finalRuns: () => {
    const cases: [number, Edge[]][] = [
      [WALK_N, WALK_EDGES],
      [RING_N, RING_EDGES],
      [TAIL_N, TAIL_EDGES],
      [4, star(4)],
      [SPLIT_N, SPLIT_EDGES],
      [1, []],
    ];
    const rows = cases.map(([n, e]) => [
      `\`articulationPoints(${n}, ${JSON.stringify(e)})\``,
      list(articulationPoints(n, e)),
    ]);
    return md(["호출", "반환값"], rows);
  },

  /* ─────────────── related ─────────────── */

  /** 블록과 블록-컷 나무. */
  blockCutTree: () => {
    const cases: [string, number, Edge[]][] = [
      ["전개 입력", WALK_N, WALK_EDGES],
      ["삼각형 둘을 간선 하나가 이음", BRIDGE_N, BRIDGE_EDGES],
      ["사이클 하나", RING_N, RING_EDGES],
      ["사슬 (V = 5)", 5, chain(5)],
      ["별 (V = 5)", 5, star(5)],
      ["삼각형 넷을 이은 그래프", beads(4, 3).n, beads(4, 3).e],
    ];
    let agree = 0;
    const rows = cases.map(([label, n, e]) => {
      const bs = blocks(n, e);
      const shared = list(sharedByBlocks(n, e));
      const ref = list(articulationPoints(n, e));
      if (shared === ref) agree++;
      return [label, String(bs.length), show2(bs), shared, ref];
    });
    return [
      md(
        [
          "입력",
          "블록 수",
          "블록",
          "블록 둘 이상에 든 정점",
          "정본이 낸 단절점",
        ],
        rows,
        [1],
      ),
      "",
      `${ko(cases.length)} 줄 중 두 열이 일치한 줄은 ${agree} 줄입니다.`,
    ].join("\n");
  },

  /* ─────────────── deep.math ─────────────── */

  /** 정의를 전개 입력에 넣어 세 항의 최솟값을 검산한다. */
  mathCheck: () => {
    const c = counted(WALK_N, WALK_EDGES, false);
    const t = tree(WALK_N, WALK_EDGES);
    let ok = 0;
    const rows = Array.from({ length: WALK_N }, (_, v) => {
      const back = t.backEdges
        .filter(([b]) => b === v)
        .map(([, a]) => c.disc[a] as number);
      const kidLow = (c.children[v] as number[]).map((x) => c.low[x] as number);
      const min = Math.min(c.disc[v] as number, ...back, ...kidLow);
      if (min === c.low[v]) ok++;
      return [
        String(v),
        String(c.disc[v]),
        back.length === 0 ? "없음" : back.join(" · "),
        kidLow.length === 0 ? "없음" : kidLow.join(" · "),
        String(min),
        String(c.low[v]),
        min === c.low[v] ? "일치" : "어긋남",
      ];
    });
    return [
      md(
        [
          "정점 v",
          "첫째 항 disc[v]",
          "둘째 항 disc[x]",
          "셋째 항 low[c]",
          "세 항의 최솟값",
          "실행이 낸 low[v]",
          "대조",
        ],
        rows,
        [0, 1, 4, 5],
      ),
      "",
      `${ko(WALK_N)} 정점 중 ${ok} 정점에서 일치합니다. 같은 실행에서 이웃 자리 읽기는 ${c.reads} 번이고 2(E − L) 은 ${2 * (WALK_EDGES.length - c.loops)} 입니다.`,
    ].join("\n");
  },

  /** 단절점 개수의 상한을 모양마다 잰다. */
  mathBound: () => {
    const cases: [string, number, Edge[]][] = [
      ["사슬 (V = 8)", 8, chain(8)],
      ["사슬 (V = 64)", 64, chain(64)],
      ["사이클 (V = 64)", 64, ring(64)],
      ["별 (V = 64)", 64, star(64)],
      ["완전 그래프 (V = 64)", 64, complete(64)],
      ["삼각형 16 개를 이은 그래프", beads(16, 3).n, beads(16, 3).e],
      ["무작위 (V = 64, E = 96)", 64, scatter(64, 96, 20260906)],
      ["간선이 없는 그래프 (V = 64)", 64, []],
    ];
    let held = 0;
    const tight: string[] = [];
    const rows = cases.map(([label, n, e]) => {
      const a = articulationPoints(n, e).length;
      const cap = Math.max(0, n - 2);
      if (a <= cap) held++;
      if (a === cap) tight.push(label);
      return [
        label,
        comma(n),
        comma(e.length),
        comma(a),
        comma(cap),
        a <= cap ? "지킨다" : "넘는다",
      ];
    });
    return [
      md(
        ["입력", "V", "E", "단절점 개수", "상한 V − 2", "상한"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `${ko(cases.length)} 줄 중 ${held} 줄이 상한을 지키고, 상한과 같은 값이 나온 것은 ${tight.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** 닫은 식에 규모를 넣는다. */
  mathScale: () => {
    const rows = [1_000, 10_000, V_LIMIT].map((v) => {
      const e = ring(v);
      const c = counted(v, e, false);
      return [
        comma(v),
        comma(e.length),
        comma(c.reads),
        comma(2 * (e.length - c.loops)),
        comma(c.enters + c.pops),
        comma(2 * v),
      ];
    });
    const same = rows.every((r) => r[2] === r[3] && r[4] === r[5]);
    return [
      md(
        [
          "사이클의 정점 V",
          "간선 E",
          "이웃 자리 읽기",
          "2(E − L)",
          "정점 만짐",
          "2V",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `세 줄 ${same ? "모두" : "중 일부만"} 실측 열이 그 오른쪽 식의 값과 같습니다.`,
    ].join("\n");
  },

  /* ─────────────── invariant ─────────────── */

  /**
   * 걸음마다 두 문장이 유지되는가.
   *
   * **원문자 라벨을 이 블록에 넣지 않는다** — `invariant` 절 전체가 원문자 금지 구역이라(`P14`)
   * 생성 블록도 그 규칙 안에 있다. 갈래는 이름으로 적는다.
   */
  invariantWatch: () => {
    const { steps, counts } = walkSteps();
    const want = lowByDefinition(WALK_N, WALK_EDGES);
    let kept = 0;
    let pops = 0;
    let popsOk = 0;
    const rows = steps.map((s) => {
      const path = s.call.every(
        (v, k) => k === 0 || (counts.parent[v] as number) === s.call[k - 1],
      );
      const asc = s.call.every(
        (v, k) =>
          k === 0 ||
          (s.disc[s.call[k - 1] as number] as number) < (s.disc[v] as number),
      );
      const bounded = s.call.every(
        (v) => (s.low[v] as number) <= (s.disc[v] as number),
      );
      const popped = s.kind === "복귀" || s.kind === "판정";
      if (path && asc && bounded) kept++;
      let last = "-";
      if (popped) {
        pops++;
        const okv = (s.low[s.v] as number) === (want[s.v] as number);
        if (okv) popsOk++;
        last = `${s.low[s.v]} · ${want[s.v]}`;
      }
      return [
        `T${tOf(steps, s)}`,
        s.kind,
        list(s.call),
        s.call.map((v) => `${s.disc[v]}`).join(" < ") || "-",
        path && asc ? "지킨다" : "깨진다",
        bounded ? "지킨다" : "깨진다",
        last,
      ];
    });
    return [
      md(
        [
          "걸음",
          "갈래",
          "호출 스택",
          "그 정점들의 disc",
          "앞 문장",
          "뒤 문장의 low ≤ disc",
          "뺀 정점의 low · 정의로 계산한 값",
        ],
        rows,
      ),
      "",
      `${rows.length} 시점 중 ${kept} 시점에서 두 문장이 유지됩니다. 정점을 뺀 ${pops} 걸음 중 뺄 때의 low 가 정의로 계산한 값과 같은 것은 ${popsOk} 걸음입니다.`,
    ].join("\n");
  },

  /** 경계 입력에서도 같은 문장이 서는가. */
  invariantEdges: () => {
    const cases: [string, number, Edge[]][] = [
      ["정점 하나, 간선 없음", 1, []],
      ["정점 둘, 간선 하나", 2, [[0, 1]]],
      ["정점 넷, 간선 없음", 4, []],
      ["두 끝이 같은 간선만", LOOP_D_N, LOOP_D_EDGES],
      ["같은 두 정점 사이의 겹친 간선", TWIN_N, TWIN_EDGES],
      ["떨어진 두 성분", SPLIT_N, SPLIT_EDGES],
      ["사슬 (V = 4)", 4, chain(4)],
      ["사이클 (V = 8)", 8, ring(8)],
    ];
    let ok = 0;
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      if (list(c.low) === list(lowByDefinition(n, e))) ok++;
      return [
        label,
        String(n),
        String(e.length),
        list(c.cut),
        String(c.reads),
        String(c.enters + c.pops),
        String(c.peakCall),
        String(c.roots.length),
      ];
    });
    return [
      md(
        [
          "입력",
          "V",
          "E",
          "단절점",
          "이웃 자리 읽기",
          "정점 만짐",
          "호출 스택 최대",
          "탐색 시작 횟수",
        ],
        rows,
        [1, 2, 4, 5, 6, 7],
      ),
      "",
      `${ko(cases.length)} 입력 중 끝난 뒤의 low 가 정의로 계산한 값과 모두 같은 입력은 ${ok} 개입니다.`,
    ].join("\n");
  },

  /** 불변식을 지키던 줄을 뺐을 때. */
  mutantNoPass: () => {
    const cases: [string, number, Edge[]][] = [
      ...변이_입력,
      ["사이클 (V = 6)", 6, ring(6)],
      ["삼각형 넷을 이은 그래프", beads(4, 3).n, beads(4, 3).e],
      ["무작위 (V = 32, E = 48)", 32, scatter(32, 48, 20260906)],
    ];
    const rows = mutantRows(noPass, cases);
    const off = rows.filter((r) => r[3] === "다르다").length;
    return [
      md(["입력", "정본", "자식의 low 를 안 넘기는 판", "판정"], rows),
      "",
      `${ko(rows.length)} 입력 중 답이 갈린 것은 ${off} 개입니다.`,
    ].join("\n");
  },

  /** 불변식이 깨지는 걸음 — 사이클 하나에서 정점을 뺄 때마다. */
  mutantNoPassTrace: () => {
    const a = counted(RING_N, RING_EDGES);
    const b = counted(RING_N, RING_EDGES, true, "noPass");
    const want = lowByDefinition(RING_N, RING_EDGES);
    const pick = (c: Counts) =>
      c.steps.filter((s) => s.kind === "복귀" || s.kind === "판정");
    const pa = pick(a);
    const pb = pick(b);
    const rows = pa.map((x, i) => {
      const y = pb[i] as Step;
      const cell = (s: Step) =>
        s.parent === null
          ? "부모 없음"
          : `low[${s.v}] = ${s.low[s.v]} · ${s.judge?.rooted ? "부모가 뿌리" : s.judge?.hit ? `cut[${s.parent}]` : "적지 않음"}`;
      return [`정점 ${x.v}`, String(want[x.v]), cell(x), cell(y)];
    });
    return [
      md(
        ["뺀 정점", "정의로 계산한 low", "정본", "자식의 low 를 안 넘기는 판"],
        rows,
      ),
      "",
      `정본의 답은 ${list(a.cut)}, 바꾼 판의 답은 ${list(b.cut)} 입니다.`,
    ].join("\n");
  },

  /* ─────────────── perf ─────────────── */

  /** 걸음마다 읽은 이웃 자리와 누적. */
  perfCount: () => {
    const { steps, counts } = walkSteps();
    let prev = 0;
    const rows = steps.map((s) => {
      const step = s.reads - prev;
      prev = s.reads;
      return [
        `T${tOf(steps, s)}`,
        s.kind,
        site(s),
        String(step),
        String(s.reads),
      ];
    });
    return [
      md(
        ["걸음", "하는 일", "정점 또는 간선", "이 걸음이 읽은 자리", "누적"],
        rows,
        [3, 4],
      ),
      "",
      `이웃 목록을 만들 때 간선 ${counts.builds} 개를 한 번씩 읽고, 순회하며 읽은 이웃 자리는 ${counts.reads} 개로 2(E − L) = ${2 * (WALK_EDGES.length - counts.loops)} 과 같습니다. 진입 ${counts.enters} 번과 빼기 ${counts.pops} 번을 더한 정점 만짐은 ${counts.enters + counts.pops} 번이고 2V 는 ${2 * WALK_N} 입니다.`,
    ].join("\n");
  },

  /** 항목마다 식과 두 규모의 값. */
  perfTotal: () => {
    const a = counted(WALK_N, WALK_EDGES, false);
    const bigN = V_LIMIT;
    const bigE = ring(bigN);
    const b = counted(bigN, bigE, false);
    const row = (
      name: string,
      f: string,
      x: (c: Counts, n: number) => number,
    ): string[] => [name, f, comma(x(a, WALK_N)), comma(x(b, bigN))];
    const rows = [
      row("이웃 목록 만들기", "E", (c) => c.builds),
      row("정점마다의 배열 셋", "3V", (_, n) => 3 * n),
      row("이웃 자리 읽기", "2(E − L)", (c) => c.reads),
      row("정점 만짐", "2V", (c) => c.enters + c.pops),
      row("답 모으기", "V", (_, n) => n),
      row(
        "합",
        "6V + 3E − 2L",
        (c, n) => c.builds + 3 * n + c.reads + c.enters + c.pops + n,
      ),
    ];
    const formula = (n: number, e: number, l: number) => 6 * n + 3 * e - 2 * l;
    const total = (c: Counts, n: number) =>
      c.builds + 3 * n + c.reads + c.enters + c.pops + n;
    const fa = formula(WALK_N, WALK_EDGES.length, a.loops);
    const fb = formula(bigN, bigE.length, b.loops);
    return [
      md(
        ["항목", "식", "전개 입력", `사이클 (V = E = ${comma(bigN)})`],
        rows,
        [2, 3],
      ),
      "",
      `두 열의 합은 식 6V + 3E − 2L 에 넣은 값 ${comma(fa)} · ${comma(fb)} 과 ${total(a, WALK_N) === fa && total(b, bigN) === fb ? "같습니다" : "다릅니다"}.`,
    ].join("\n");
  },

  /** 모양이 달라도 두 등식이 그대로인가. */
  perfObserved: () => {
    const cases: [string, number, Edge[]][] = [
      ["사슬 (V = 1,024)", 1024, chain(1024)],
      ["사이클 (V = 1,024)", 1024, ring(1024)],
      ["별 (V = 1,024)", 1024, star(1024)],
      ["삼각형 341 개를 이은 그래프", beads(341, 3).n, beads(341, 3).e],
      ["완전 그래프 (V = 64)", 64, complete(64)],
      ["무작위 (V = 1,024, E = 2,048)", 1024, scatter(1024, 2048, 20260906)],
    ];
    let readsOk = 0;
    let touchOk = 0;
    const rows = cases.map(([label, n, e]) => {
      const c = counted(n, e, false);
      const r2 = 2 * (e.length - c.loops);
      if (c.reads === r2) readsOk++;
      if (c.enters + c.pops === 2 * n) touchOk++;
      return [
        label,
        comma(n),
        comma(e.length),
        comma(c.loops),
        comma(c.reads),
        comma(r2),
        comma(c.enters + c.pops),
        comma(2 * n),
        comma(c.peakCall),
        comma(c.cut.length),
      ];
    });
    return [
      md(
        [
          "입력",
          "V",
          "E",
          "L",
          "이웃 자리 읽기",
          "2(E − L)",
          "정점 만짐",
          "2V",
          "호출 스택 최대",
          "단절점 개수",
        ],
        rows,
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
      ),
      "",
      `${ko(cases.length)} 줄 중 읽기가 2(E − L) 과 같은 줄이 ${readsOk} 줄, 정점 만짐이 2V 와 같은 줄이 ${touchOk} 줄입니다.`,
    ].join("\n");
  },

  /** 무엇이 최악을 만드는가. 정점 수를 512 로 고정하고 모양만 바꾼다. */
  worstShape: () => {
    const V = 512;
    const cases: [string, Edge[]][] = [
      ["간선 없음", []],
      ["사슬", chain(V)],
      ["사슬을 간선 목록에 거꾸로 적은 것", chain(V).slice().reverse()],
      ["사이클", ring(V)],
      ["별 — 정점 하나에서 나머지 전부로", star(V)],
      ["삼각형 170 개를 이은 것 + 홀로 있는 정점 둘", beads(170, 3).e],
      ["완전 그래프", complete(V)],
    ];
    const rows = cases.map(([label, e]) => {
      const c = counted(V, e, false);
      return [
        label,
        comma(e.length),
        comma(c.reads),
        comma(c.enters + c.pops),
        comma(c.peakCall),
        comma(c.cut.length),
      ];
    });
    const touch = new Set(rows.map((r) => r[3]));
    return [
      md(
        [
          "모양 (V = 512)",
          "간선 E",
          "이웃 자리 읽기",
          "정점 만짐",
          "호출 스택 최대",
          "단절점 개수",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${ko(cases.length)} 모양의 정점 만짐은 ${touch.size === 1 ? `모두 ${[...touch][0]} 입니다` : `${touch.size} 가지로 갈립니다`}.`,
    ].join("\n");
  },

  /** 규모를 네 배로 늘리면 무엇이 몇 배가 되는가. */
  worstGrowth: () => {
    let prevSum = 0;
    let prevPeak = 0;
    let sumEq = 0;
    const sizes = [64, 256, 1024, 4096];
    const rows = sizes.map((v) => {
      const e = chain(v);
      const c = counted(v, e, false);
      const sum = c.reads + c.enters + c.pops;
      if (sum === 4 * v - 2) sumEq++;
      const row = [
        comma(v),
        comma(sum),
        prevSum === 0 ? "-" : (sum / prevSum).toFixed(2),
        comma(c.peakCall),
        prevPeak === 0 ? "-" : (c.peakCall / prevPeak).toFixed(2),
        comma(c.cut.length),
      ];
      prevSum = sum;
      prevPeak = c.peakCall;
      return row;
    });
    return [
      md(
        [
          "사슬의 정점 V",
          "읽기 + 만짐",
          "직전 줄의 몇 배",
          "호출 스택 최대",
          "직전 줄의 몇 배",
          "단절점 개수",
        ],
        rows,
        [0, 1, 2, 3, 4, 5],
      ),
      "",
      `${ko(sizes.length)} 줄 중 읽기 + 만짐이 4V − 2 와 같은 줄은 ${sumEq} 줄입니다.`,
    ].join("\n");
  },

  /* ─────────────── selfcheck ─────────────── */

  /** 같은 줄을 실행한 두 걸음이 왜 갈리는가. */
  selfcheckT16: () => {
    const { steps } = walkSteps();
    const rows = [15, 16].map((t) => {
      const s = stepAt(steps, t);
      const j = s.judge as Judge;
      return [
        `T${t}`,
        String(s.v),
        String(s.parent),
        yes(j.rooted),
        `low[${s.v}] = ${j.lowC} · disc[${s.parent}] = ${j.discP}`,
        j.hit ? `cut[${s.parent}]` : "-",
      ];
    });
    return md(
      ["걸음", "뺀 정점", "부모", "부모가 뿌리", "맞대는 두 값", "적은 것"],
      rows,
    );
  },
};

/** 걸음 재생 패널과 그림이 함께 쓰는 값 — 실행에서 받는다. */
export const WALK_RUN = walkSteps();
