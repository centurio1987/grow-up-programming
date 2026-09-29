/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/countIslands/countIslands-guide.md
 *
 * **정본과 같은 절차에 기록만 덧붙인 사본이 둘 있다**(`traced` · `표시하며세기`). 정본은 걸음도
 * 계수도 내보내지 않으므로, 기록하는 자리만 덧붙인 사본이 아니면 걸음과 계수를 낼 방법이 없다.
 * 두 사본은 부를 때마다 자기 답을 정본과 맞대고, 어긋나면 던진다. `칸마다다시구하기` ·
 * `왼쪽위규칙` · `꺼낼때표시` · `표시안함` · `열경계없음` · `큐로꺼내기` · `재귀로적기` ·
 * `값별영역` · `표시확인없음사본` 은 **다른 절차**라 사본이 아니라 별도 구현이다. **답이 맞는지는
 * 사본이 아니라 정본이 진다** — 아래 표의 「정본」 칸은 전부 `countIslands` 자신이나 그것에서
 * 기계로 만든 변이가 낸 값이다.
 *
 * 걸음 기록(`WALK_RUN`)은 그림 사이드카(`-guide.fig.tsx`)도 쓴다 — 걸음 재생 패널과 정적 그림이
 * 이 기록에서 나온다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 이가 } from "../../../../tools/josa.ts";
import { 전부땅, 체커보드 } from "./countIslands-guide.alt.ts";
import { countIslands } from "./countIslands-guide.ref.ts";

export type Grid = number[][];

/** 상 · 하 · 좌 · 우 — 정본의 `DIRS` 와 같은 차례. */
export const D4: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** `D4` 의 차례대로 붙인 방향 이름. */
export const DIR_NAMES = ["위", "아래", "왼쪽", "오른쪽"] as const;

/** 방향 이름 뒤의 「이/가」 — 위·아래는 받침이 없고 왼쪽·오른쪽은 있다. */
const dirJosa = (name: string): string => (name.endsWith("쪽") ? "이" : "가");

/** 방향 이름 뒤의 「은/는」. */
const dirTopic = (name: string): string => (name.endsWith("쪽") ? "은" : "는");

/** 상하좌우에 대각선 넷을 더한 것. 이 과제가 이웃으로 치지 않는 정의다. */
export const D8: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 3×4 격자. 섬이 셋이고, 세 번째 섬 `(2,2)` 는 두 번째 섬의 `(1,3)` 과
 * **대각선으로만** 닿아 갈린다. 격자 밖 검사·이미 담은 칸 건너뛰기도 여기서 다 실행된다.
 */
export const WALK: Grid = [
  [1, 1, 0, 1],
  [1, 0, 0, 1],
  [0, 0, 1, 0],
];

/** ㄷ 자로 굽은 섬 하나. 왼쪽·위만 보는 규칙이 여기서 갈린다. */
export const U자: Grid = [
  [1, 0, 1],
  [1, 1, 1],
];

/** 대각선으로만 닿은 땅 다섯. 이웃의 정의가 답을 바꾸는 자리다. */
const 체커3: Grid = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
];

/** 모서리에 붙은 L 자 덩어리 하나와 떨어진 낱개 하나. */
const L자: Grid = [
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** 값이 `1` 과 `2` 인 땅이 붙어 있는 격자. 땅이 한 종류라는 전제가 여기서 깨진다. */
const 두종류: Grid = [
  [1, 1, 2],
  [0, 2, 2],
];

/** 칸 `len` 개가 한 줄로 이어진 섬 하나. 재귀 깊이가 곧 이 길이가 된다. */
const 한줄 = (len: number): Grid => [new Array<number>(len).fill(1)];

/** `(0,2)` 자리의 값만 바꾼 격자 — 칸 하나의 값이 답을 바꾸는 자리. */
const 물음칸 = (v: number): Grid => [
  [1, 1, v],
  [0, 0, 1],
];

/* ────────────────────────── 표기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** `39,960.010` 꼴 — 본문 표기와 같다. */
export const comma = (n: number | bigint): string => n.toLocaleString("en-US");

/** `(0,0)` 꼴 — 본문이 칸을 가리키는 표기와 같다. */
export const cell = (id: number, C: number): string =>
  `(${Math.floor(id / C)},${id % C})`;

/** 칸 번호 목록을 `(0,0) (0,1)` 꼴로. */
const cells = (ids: readonly number[], C: number): string =>
  ids.map((x) => cell(x, C)).join(" ");

/** `[(1,0) (0,1)]` 꼴 — 스택을 적는 표기. */
export const stackText = (ids: readonly number[], C: number): string =>
  `[${cells(ids, C)}]`;

/** 등폭 블록 — 열마다 가장 넓은 칸에 맞춰 세 칸씩 띄운다. */
function columns(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) =>
    Math.max(...rows.map((r) => width(r[c] ?? ""))),
  );
  return rows
    .map((r) =>
      r
        .map((c, i) => pad(c, widths[i] ?? 0))
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (row: string[]) => `| ${row.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/** 원문자 갈래 뒤의 「은/는」 — ① 일 · ③ 삼은 받침이 있다. */
const CIRCLED_JOSA: Record<string, string> = {
  "①": "은",
  "②": "는",
  "③": "은",
  "④": "는",
  "⑤": "는",
};

/** 땅 칸의 수. */
const landOf = (g: Grid): number => g.flat().filter((v) => v !== 0).length;

/* ────────────────────── 걸음 기록 — 정본과 같은 절차 ────────────────────── */

/** 꺼낸 칸의 이웃 하나를 볼 때 나온 것 — 격자 밖 · 물 · 이미 표시됨 · 처음 보는 땅. */
export type Look = "out" | "water" | "seen" | "push";

export interface Check {
  readonly dir: number;
  /** 격자 밖이면 `null`. */
  readonly cell: number | null;
  readonly look: Look;
}

export type Event =
  | { readonly kind: "start"; readonly cell: number }
  | {
      readonly kind: "pop";
      readonly cell: number;
      readonly checks: readonly Check[];
    }
  | {
      readonly kind: "skip";
      readonly cells: readonly {
        readonly cell: number;
        readonly why: "water" | "seen";
      }[];
    };

/** 걸음 하나 — 사건과 그 직후의 상태. */
export interface Step {
  readonly event: Event;
  /** 걸음 직후의 스택(바닥부터). */
  readonly stack: readonly number[];
  /** 칸마다 속한 섬 번호. `0` 은 아직 표시가 없다 — `seen` 과 같은 것을 섬 번호로 적었다. */
  readonly label: readonly number[];
  readonly islands: number;
}

export interface Run {
  readonly grid: Grid;
  readonly R: number;
  readonly C: number;
  readonly steps: readonly Step[];
  readonly answer: number;
  /** 스택이 가장 길었을 때의 길이. */
  readonly maxStack: number;
}

/**
 * 정본과 같은 절차를 실행하며 걸음을 적는다. 걸음은 셋이다 — 바깥 반복이 새 섬을 시작한다 ·
 * 스택에서 칸 하나를 꺼내 이웃 넷을 본다 · 바깥 반복이 이어서 건너뛴 칸들(한 걸음으로 묶는다).
 * 답이 정본과 다르면 던진다.
 */
export function traced(grid: Grid): Run {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const label: number[] = Array.from({ length: R * C }, () => 0);
  const stack: number[] = [];
  const steps: Step[] = [];
  let islands = 0;
  let maxStack = 0;
  let skipRun: { cell: number; why: "water" | "seen" }[] | null = null;

  const snap = (event: Event): void => {
    steps.push({ event, stack: [...stack], label: [...label], islands });
  };

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const start = r * C + c;
      const water = (grid[r] as number[])[c] === 0;
      if (water || label[start] !== 0) {
        const item = { cell: start, why: water ? "water" : "seen" } as const;
        if (skipRun === null) {
          skipRun = [item];
          snap({ kind: "skip", cells: skipRun });
        } else {
          skipRun.push(item);
        }
        continue;
      }
      skipRun = null;
      islands++;
      label[start] = islands;
      stack.push(start);
      maxStack = Math.max(maxStack, stack.length);
      snap({ kind: "start", cell: start });

      while (stack.length > 0) {
        const cur = stack.pop() as number;
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        const checks: Check[] = [];
        D4.forEach(([dr, dc], dir) => {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) {
            checks.push({ dir, cell: null, look: "out" });
            return;
          }
          const next = nr * C + nc;
          if ((grid[nr] as number[])[nc] === 0) {
            checks.push({ dir, cell: next, look: "water" });
            return;
          }
          if (label[next] !== 0) {
            checks.push({ dir, cell: next, look: "seen" });
            return;
          }
          label[next] = islands;
          stack.push(next);
          maxStack = Math.max(maxStack, stack.length);
          checks.push({ dir, cell: next, look: "push" });
        });
        snap({ kind: "pop", cell: cur, checks });
      }
    }
  }

  const want = countIslands(grid);
  if (islands !== want) {
    throw new Error(`걸음 기록의 답 ${islands} 이 정본 ${want} 과 다르다`);
  }
  return { grid, R, C, steps, answer: islands, maxStack };
}

/** 본문 전개의 걸음 기록. */
export const WALK_RUN = traced(WALK);

/** 걸음 번호 — `T1` 부터. */
export const stepOf = (i: number): string => `T${i + 1}`;

/** 격자 안에서 변을 공유하는 칸 짝 — 두 끝 칸 번호(작은 쪽이 앞). 오른쪽·아래만 봐 한 번씩 센다. */
export function sidePairs(R: number, C: number): [number, number][] {
  const out: [number, number][] = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (c + 1 < C) out.push([r * C + c, r * C + c + 1]);
      if (r + 1 < R) out.push([r * C + c, (r + 1) * C + c]);
    }
  }
  return out;
}

/** 두 끝이 다 땅인 짝 — 이 과제의 간선. */
export const landPairs = (grid: Grid): [number, number][] => {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const at = (i: number) =>
    (grid[Math.floor(i / C)] as number[])[i % C] as number;
  return sidePairs(R, C).filter(([a, b]) => at(a) !== 0 && at(b) !== 0);
};

/** 걸음 기록에서 섬 하나를 표시한 스택 한 바퀴의 꺼내기들. */
function roundOf(run: Run, startCell: number): Step[] {
  const i = run.steps.findIndex(
    (s) => s.event.kind === "start" && s.event.cell === startCell,
  );
  if (i < 0) throw new Error(`${startCell} 에서 시작한 섬이 없다`);
  const out: Step[] = [];
  for (let j = i + 1; j < run.steps.length; j++) {
    const s = run.steps[j] as Step;
    if (s.event.kind !== "pop") break;
    out.push(s);
  }
  return out;
}

/** 스택 한 바퀴를 표로 — 꺼낸 칸 · 격자 안 이웃 · 담는 칸 · 꺼낸 뒤 스택. */
function roundTable(run: Run, startCell: number): string {
  const { C } = run;
  const word: Record<Exclude<Look, "out">, string> = {
    water: "물",
    seen: "표시됨",
    push: "땅",
  };
  return md(
    ["꺼낸 칸", "격자 안 이웃", "담는 칸", "꺼낸 뒤 스택"],
    roundOf(run, startCell).map((s) => {
      const e = s.event as Extract<Event, { kind: "pop" }>;
      const inside = e.checks.filter((k) => k.look !== "out");
      const pushed = e.checks.filter((k) => k.look === "push");
      return [
        cell(e.cell, C),
        inside
          .map(
            (k) =>
              `${cell(k.cell as number, C)} ${word[k.look as Exclude<Look, "out">]}`,
          )
          .join(" "),
        pushed.length === 0
          ? "없다"
          : pushed.map((k) => cell(k.cell as number, C)).join(" "),
        stackText(s.stack, C),
      ];
    }),
  );
}

/** 걸음 하나에서 갈래가 몇 번 실행됐는가(칸 단위). */
export function branchCounts(e: Event): Record<string, number> {
  const out: Record<string, number> = {
    "①": 0,
    "②": 0,
    "③": 0,
    "④": 0,
    "⑤": 0,
  };
  if (e.kind === "start") out["②"] = 1;
  if (e.kind === "skip") out["①"] = e.cells.length;
  if (e.kind === "pop") {
    for (const k of e.checks) {
      if (k.look === "out") out["③"] = (out["③"] ?? 0) + 1;
      else if (k.look === "push") out["⑤"] = (out["⑤"] ?? 0) + 1;
      else out["④"] = (out["④"] ?? 0) + 1;
    }
  }
  return out;
}

/** 꺼낸 칸의 이웃 넷에서 나온 것을 갈래별로 한 줄에. */
function judgePop(e: Extract<Event, { kind: "pop" }>): string {
  const names = (look: Look) =>
    e.checks
      .filter((k) => k.look === look)
      .map((k) => DIR_NAMES[k.dir] as string);
  const parts: string[] = [];
  const out = names("out");
  if (out.length > 0) {
    parts.push(`${out.join("·")}${dirJosa(out.at(-1) as string)} 격자 밖 → ③`);
  }
  const seen = names("seen");
  const water = names("water");
  if (seen.length + water.length > 0) {
    const bits: string[] = [];
    if (seen.length > 0) bits.push(`${seen.join("·")} \`seen\` 이 **참**`);
    if (water.length > 0)
      bits.push(`${water.join("·")}${dirTopic(water.at(-1) as string)} 물`);
    parts.push(`${bits.join(" · ")} → ④`);
  }
  const push = names("push");
  if (push.length > 0)
    parts.push(
      `${push.join("·")}${dirTopic(push.at(-1) as string)} 처음 보는 땅 → ⑤`,
    );
  return parts.join(", ");
}

/* ────────────────────── 세는 사본과 다른 절차 ────────────────────── */

interface Counts {
  섬: number;
  칸읽기: number;
  담기: number;
  최대: number;
  꺼낸순서: number[];
}

/** 정본과 같은 절차. 칸 읽기·담은 횟수·스택 최대 길이만 덧붙여 센다. */
function 표시하며세기(grid: Grid, dirs: [number, number][] = D4): Counts {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const seen: boolean[] = Array.from({ length: R * C }, () => false);
  const stack: number[] = [];
  const 꺼낸순서: number[] = [];
  let 섬 = 0;
  let 칸읽기 = 0;
  let 담기 = 0;
  let 최대 = 0;

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const start = r * C + c;
      칸읽기++;
      if ((grid[r] as number[])[c] === 0 || seen[start] === true) continue;
      섬++;
      seen[start] = true;
      stack.push(start);
      담기++;
      최대 = Math.max(최대, stack.length);
      while (stack.length > 0) {
        const cur = stack.pop() as number;
        꺼낸순서.push(cur);
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of dirs) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          칸읽기++;
          const next = nr * C + nc;
          if ((grid[nr] as number[])[nc] === 0 || seen[next] === true) continue;
          seen[next] = true;
          stack.push(next);
          담기++;
          최대 = Math.max(최대, stack.length);
        }
      }
    }
  }
  if (dirs === D4 && 섬 !== countIslands(grid)) {
    throw new Error("세는 사본의 답이 정본과 다르다");
  }
  return { 섬, 칸읽기, 담기, 최대, 꺼낸순서 };
}

/**
 * 이웃 정의를 받아 칸마다 섬 번호를 붙인다(`0` 은 물) — 그림 사이드카가 대각선 비교 그림에 쓴다.
 * 섬 수는 세는 사본과 맞대고, 상하좌우 넷이면 정본과도 맞댄다(세는 사본이 그렇게 한다).
 */
export function labelsWith(grid: Grid, dirs: [number, number][]): number[] {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const label: number[] = Array.from({ length: R * C }, () => 0);
  let k = 0;
  for (let i = 0; i < R * C; i++) {
    if ((grid[Math.floor(i / C)] as number[])[i % C] === 0 || label[i] !== 0)
      continue;
    k++;
    label[i] = k;
    const stack = [i];
    while (stack.length > 0) {
      const cur = stack.pop() as number;
      for (const [dr, dc] of dirs) {
        const nr = Math.floor(cur / C) + dr;
        const nc = (cur % C) + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
        const next = nr * C + nc;
        if ((grid[nr] as number[])[nc] === 0 || label[next] !== 0) continue;
        label[next] = k;
        stack.push(next);
      }
    }
  }
  if (k !== 표시하며세기(grid, dirs).섬) {
    throw new Error("섬 번호 붙이기가 세는 사본과 다르다");
  }
  return label;
}

/**
 * **가장 단순한 방법** — 표시를 남기지 않고, 땅 칸마다 그 칸이 속한 덩어리를 **처음부터 다시
 * 구한다.** 그렇게 얻은 덩어리 중 서로 다른 것의 개수가 답이다.
 */
function 칸마다다시구하기(grid: Grid): {
  섬: number;
  칸읽기: number;
  덩어리: number;
  기록: { 시작: number; 칸: number[] }[];
} {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  let 칸읽기 = 0;
  let 덩어리 = 0;
  const 모임: string[] = [];
  const 기록: { 시작: number; 칸: number[] }[] = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      칸읽기++;
      if ((grid[r] as number[])[c] === 0) continue;
      덩어리++;
      const local: boolean[] = Array.from({ length: R * C }, () => false);
      const stack = [r * C + c];
      const found = [r * C + c];
      local[r * C + c] = true;
      while (stack.length > 0) {
        const cur = stack.pop() as number;
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of D4) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          칸읽기++;
          const next = nr * C + nc;
          if ((grid[nr] as number[])[nc] === 0 || local[next] === true)
            continue;
          local[next] = true;
          stack.push(next);
          found.push(next);
        }
      }
      const sorted = [...found].sort((a, b) => a - b);
      기록.push({ 시작: r * C + c, 칸: sorted });
      const key = sorted.join(",");
      if (!모임.includes(key)) 모임.push(key);
    }
  }
  if (모임.length !== countIslands(grid)) {
    throw new Error("가장 단순한 방법의 답이 정본과 다르다");
  }
  return { 섬: 모임.length, 칸읽기, 덩어리, 기록 };
}

/**
 * **다른 절차** — 「이 칸이 이미 센 섬에 속하는가」를 **왼쪽 칸과 위 칸만 보고** 판정한다.
 * 표시 배열도 탐색도 없다. 땅 칸마다 무엇을 봤는지도 함께 돌려준다.
 */
export function 왼쪽위규칙(grid: Grid): {
  섬: number;
  기록: { 칸: number; 왼쪽: string; 위: string; 새섬: number | null }[];
} {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  let 섬 = 0;
  const 기록: { 칸: number; 왼쪽: string; 위: string; 새섬: number | null }[] =
    [];
  const 값말 = (v: number) => (v === 0 ? "물" : "땅");
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if ((grid[r] as number[])[c] === 0) continue;
      const left = c > 0 ? ((grid[r] as number[])[c - 1] as number) : null;
      const up = r > 0 ? ((grid[r - 1] as number[])[c] as number) : null;
      const 왼쪽 =
        left === null ? "없음" : `${cell(r * C + c - 1, C)} ${값말(left)}`;
      const 위 =
        up === null ? "없음" : `${cell((r - 1) * C + c, C)} ${값말(up)}`;
      if (left === 1 || up === 1) {
        기록.push({ 칸: r * C + c, 왼쪽, 위, 새섬: null });
        continue;
      }
      섬++;
      기록.push({ 칸: r * C + c, 왼쪽, 위, 새섬: 섬 });
    }
  }
  return { 섬, 기록 };
}

/** **다른 절차** — 표시를 담을 때가 아니라 **꺼낼 때** 켠다. */
function 꺼낼때표시(grid: Grid): { 섬: number; 담기: number; 최대: number } {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const seen: boolean[] = Array.from({ length: R * C }, () => false);
  const stack: number[] = [];
  let 섬 = 0;
  let 담기 = 0;
  let 최대 = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const start = r * C + c;
      if ((grid[r] as number[])[c] === 0 || seen[start] === true) continue;
      섬++;
      stack.push(start);
      담기++;
      최대 = Math.max(최대, stack.length);
      while (stack.length > 0) {
        const cur = stack.pop() as number;
        if (seen[cur] === true) continue;
        seen[cur] = true;
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of D4) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          const next = nr * C + nc;
          if ((grid[nr] as number[])[nc] === 0 || seen[next] === true) continue;
          stack.push(next);
          담기++;
          최대 = Math.max(최대, stack.length);
        }
      }
    }
  }
  return { 섬, 담기, 최대 };
}

/**
 * **다른 절차** — 표시를 아예 켜지 않는다. 두 칸이 서로를 되풀이해 담아 끝나지 않으므로
 * **담기 예산**을 두고, 예산을 넘으면 `null` 을 돌려준다.
 */
function 표시안함(grid: Grid, 예산: number): number | null {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const stack: number[] = [];
  let 섬 = 0;
  let 담기 = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if ((grid[r] as number[])[c] === 0) continue;
      섬++;
      stack.push(r * C + c);
      while (stack.length > 0) {
        const cur = stack.pop() as number;
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of D4) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          if ((grid[nr] as number[])[nc] === 0) continue;
          stack.push(nr * C + nc);
          담기++;
          if (담기 > 예산) return null;
        }
      }
    }
  }
  return 섬;
}

/**
 * **다른 절차** — 열이 격자 밖인지는 보지 않고 **번호가 배열 안인지만** 본다.
 * 줄 끝에서 오른쪽으로 한 칸 가면 다음 줄의 첫 칸이 된다.
 */
function 열경계없음(grid: Grid): number {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const seen: boolean[] = Array.from({ length: R * C }, () => false);
  const stack: number[] = [];
  let 섬 = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const start = r * C + c;
      if ((grid[r] as number[])[c] === 0 || seen[start] === true) continue;
      섬++;
      seen[start] = true;
      stack.push(start);
      while (stack.length > 0) {
        const cur = stack.pop() as number;
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of D4) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R) continue;
          const next = nr * C + nc;
          if (next < 0 || next >= R * C) continue;
          const rr = Math.floor(next / C);
          const cc2 = next % C;
          if ((grid[rr] as number[])[cc2] === 0 || seen[next] === true)
            continue;
          seen[next] = true;
          stack.push(next);
        }
      }
    }
  }
  return 섬;
}

/**
 * **다른 절차** — 스택 대신 **큐**로 꺼낸다. 배열 앞에서 빼므로 남은 원소를 전부 앞으로
 * 옮기고, 그 총량을 함께 센다.
 */
function 큐로꺼내기(grid: Grid): {
  섬: number;
  꺼낸순서: number[];
  옮김: number;
} {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const seen: boolean[] = Array.from({ length: R * C }, () => false);
  const queue: number[] = [];
  const 꺼낸순서: number[] = [];
  let 섬 = 0;
  let 옮김 = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const start = r * C + c;
      if ((grid[r] as number[])[c] === 0 || seen[start] === true) continue;
      섬++;
      seen[start] = true;
      queue.push(start);
      while (queue.length > 0) {
        옮김 += queue.length - 1;
        const cur = queue.shift() as number;
        꺼낸순서.push(cur);
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of D4) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          const next = nr * C + nc;
          if ((grid[nr] as number[])[nc] === 0 || seen[next] === true) continue;
          seen[next] = true;
          queue.push(next);
        }
      }
    }
  }
  return { 섬, 꺼낸순서, 옮김 };
}

/** **다른 절차** — 덩어리를 재귀로 표시한다. 호출 깊이가 그 섬의 칸 수까지 자란다. */
function 재귀로적기(grid: Grid): number {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const seen: boolean[] = Array.from({ length: R * C }, () => false);
  let 섬 = 0;
  const fill = (r: number, c: number): void => {
    seen[r * C + c] = true;
    for (const [dr, dc] of D4) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      if ((grid[nr] as number[])[nc] === 0 || seen[nr * C + nc] === true)
        continue;
      fill(nr, nc);
    }
  };
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if ((grid[r] as number[])[c] === 0 || seen[r * C + c] === true) continue;
      섬++;
      fill(r, c);
    }
  }
  return 섬;
}

/** **다른 절차** — 값이 같은 칸끼리만 잇는다. 땅이 여러 종류일 때 세야 하는 것이 이것이다. */
function 값별영역(grid: Grid): number {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const seen: boolean[] = Array.from({ length: R * C }, () => false);
  let 영역 = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const v = (grid[r] as number[])[c] as number;
      if (v === 0 || seen[r * C + c] === true) continue;
      영역++;
      seen[r * C + c] = true;
      const stack = [r * C + c];
      while (stack.length > 0) {
        const cur = stack.pop() as number;
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of D4) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          if ((grid[nr] as number[])[nc] !== v || seen[nr * C + nc] === true)
            continue;
          seen[nr * C + nc] = true;
          stack.push(nr * C + nc);
        }
      }
    }
  }
  return 영역;
}

/* ────────────────────────── 변이 ────────────────────────── */

interface Ref {
  countIslands(grid: Grid): number;
}

const REF_PATH = new URL("./countIslands-guide.ref.ts", import.meta.url)
  .pathname;

/**
 * 바깥 반복이 **이미 센 섬의 칸인지** 확인하던 줄에서 그 확인만 뺀 사본. **정본 소스에서
 * 기계로 만든다** — 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다.
 */
const 표시확인없음 = await loadMutant<Ref>(REF_PATH, {
  swap: [
    /if \(\(grid\[r\] as number\[\]\)\[c\] === 0 \|\| seen\[start\] === true\) continue;/,
    "if ((grid[r] as number[])[c] === 0) continue;",
  ],
});

/** 중화 실행이면 `loadMutant` 가 정본을 그대로 돌려준다 — 그때는 변이의 자기검사를 건너뛴다. */
const NEUTRAL = 표시확인없음.countIslands === countIslands;

// 변이가 어느 입력에서도 결과를 안 바꾸면 「달라진다」가 거짓이다. 실행이 그것을 판정한다.
if (!NEUTRAL && 표시확인없음.countIslands(WALK) === countIslands(WALK)) {
  throw new Error(
    "변이 「표시 확인을 뺀다」 가 전개 입력에서 결과를 바꾸지 못했다",
  );
}

/**
 * 바깥 반복이 땅 칸을 하나씩 볼 때마다 섬 수가 어떻게 되는지 — 정본의 절차와, 표시 확인을 뺀
 * 절차를 나란히 적는다. 뺀 쪽의 마지막 값은 기계로 만든 변이의 답과 맞대고(중화 실행은 건너뛴다),
 * 정본 쪽은 정본의 답과 맞댄다.
 */
function 표시확인없음사본(grid: Grid): {
  칸: number;
  표시: boolean;
  정본: number;
  뺀쪽: number;
}[] {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const run = traced(grid);
  const 그때섬 = (i: number): number => {
    // 바깥 반복이 칸 i 를 다룬 걸음 직후의 islands.
    const s = run.steps.find(
      (st) =>
        (st.event.kind === "start" && st.event.cell === i) ||
        (st.event.kind === "skip" && st.event.cells.some((x) => x.cell === i)),
    );
    return s?.islands ?? 0;
  };
  const 그때표시 = (i: number): boolean =>
    run.steps.some(
      (st) =>
        st.event.kind === "skip" &&
        st.event.cells.some((x) => x.cell === i && x.why === "seen"),
    );
  const out: { 칸: number; 표시: boolean; 정본: number; 뺀쪽: number }[] = [];
  let 뺀쪽 = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if ((grid[r] as number[])[c] === 0) continue;
      뺀쪽++;
      const i = r * C + c;
      out.push({ 칸: i, 표시: 그때표시(i), 정본: 그때섬(i), 뺀쪽 });
    }
  }
  const last = out.at(-1);
  if (last !== undefined && last.정본 !== countIslands(grid)) {
    throw new Error("정본 쪽 기록이 정본의 답과 다르다");
  }
  if (
    !NEUTRAL &&
    last !== undefined &&
    last.뺀쪽 !== 표시확인없음.countIslands(grid)
  ) {
    throw new Error("표시 확인을 뺀 쪽 기록이 기계로 만든 변이의 답과 다르다");
  }
  return out;
}

/* ────────────────────── 닫힌 형태와 그 대조 ────────────────────── */

/**
 * 표시를 남기지 않는 방법이 **전부 땅인 `m × m` 격자**에서 읽는 칸 수.
 *
 * 바깥 반복이 `m²` 칸을 읽고, 땅 칸 `m²` 개마다 덩어리를 다시 구하면서 격자 안에 있는
 * (칸, 방향) 쌍 `4m² − 4m` 개를 매번 읽는다. 아래 `NAIVE_RUN` 이 작은 격자에서 이 식을
 * 실행과 대조한다 — 큰 규모는 실행할 수 없어서 식으로 내되, 식 자체는 실행이 진다.
 */
const 다시구하기읽기 = (m: number): bigint =>
  BigInt(m) ** 2n + BigInt(m) ** 2n * (4n * BigInt(m) ** 2n - 4n * BigInt(m));

/** 표시를 남기는 절차가 전부 땅인 `m × m` 격자에서 읽는 칸 수. */
const 표시하며읽기 = (m: number): bigint =>
  5n * BigInt(m) ** 2n - 4n * BigInt(m);

/** 실제로 실행해 식과 맞댄 한 변. */
const NAIVE_RUN = [3, 10, 30];
/** 식으로만 낸 한 변. */
const NAIVE_FORMULA = [100, 1000];

for (const m of NAIVE_RUN) {
  const g = 전부땅(m);
  if (BigInt(칸마다다시구하기(g).칸읽기) !== 다시구하기읽기(m)) {
    throw new Error(`다시 구하기 식이 ${m}×${m} 에서 실행과 다르다`);
  }
  if (BigInt(표시하며세기(g).칸읽기) !== 표시하며읽기(m)) {
    throw new Error(`표시하며 세기 식이 ${m}×${m} 에서 실행과 다르다`);
  }
}

/** 초당 1 억 번으로 잰 시간 — 본문 표기와 같다. */
export const seconds = (ops: bigint | number): string =>
  `${(Number(ops) / 1e8).toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} 초`;

/** 한 변 `m` 인 전부 땅 격자에서 스택이 자라는 최대 길이의 닫힌 형태. */
const 스택최대식 = (m: number): number => (m * m - m + 2) / 2;

/** 칸 `R·C` 개짜리 격자에 들어갈 수 있는 섬의 최대 개수. */
const 최대섬수 = (R: number, C: number): number => Math.ceil((R * C) / 2);

/** `R × C` 체커보드 — `(r + c)` 가 짝수인 칸만 땅이다. */
const 체커RC = (R: number, C: number): Grid =>
  Array.from({ length: R }, (_, r) =>
    Array.from({ length: C }, (_, c) => ((r + c) % 2 === 0 ? 1 : 0)),
  );

/** 시도 사다리(그림)가 쓰는 수 — 실행과, 실행으로 확인한 식에서. */
export function ladderNumbers() {
  const big = NAIVE_FORMULA.at(-1) as number;
  const naive = 다시구하기읽기(big);
  return {
    big,
    naiveOps: naive,
    naiveSeconds: seconds(naive),
    markOps: 표시하며읽기(big),
    uLeftUp: 왼쪽위규칙(U자).섬,
    uRef: countIslands(U자),
  };
}

/* ────────────────────────── 블록 ────────────────────────── */

const W = WALK_RUN;
const WC = W.C;

export const PROOFS: Record<string, () => string> = {
  /** 전체 컨셉 — 땅 칸마다 바깥 반복이 한 일. */
  "concept-starts": () => {
    const rows: [number, string[]][] = [];
    let 시작 = 0;
    let 건너뜀 = 0;
    for (const s of W.steps) {
      const e = s.event;
      if (e.kind === "start") {
        시작++;
        rows.push([
          e.cell,
          [cell(e.cell, WC), "없음", "새 섬을 시작한다", String(s.islands)],
        ]);
      }
      if (e.kind === "skip") {
        for (const x of e.cells) {
          if (x.why !== "seen") continue;
          건너뜀++;
          rows.push([
            x.cell,
            [
              cell(x.cell, WC),
              "있음",
              "건너뛴다 — 이미 센 섬의 칸",
              String(s.islands),
            ],
          ]);
        }
      }
    }
    rows.sort((a, b) => a[0] - b[0]);
    return [
      md(
        ["땅 칸", "그때 표시", "한 일", "islands"],
        rows.map((r) => r[1]),
        [3],
      ),
      "",
      `땅 칸 ${시작 + 건너뜀} 개 가운데 새 섬을 시작한 것은 ${시작} 개이고, 나머지 ${건너뜀} 개는 앞선 탐색이 이미 표시해 두어 건너뛰었습니다.`,
    ].join("\n");
  },

  /** 표시를 남기지 않는 방법이 전부 땅 격자에서 몇 칸을 읽는가. */
  "naive-scale": () =>
    [
      md(
        ["전부 땅 격자", "땅 칸", "칸 읽기", "초당 1 억 번 기준", "센 방법"],
        [
          ...NAIVE_RUN.map((m) => [m, "실행"] as const),
          ...NAIVE_FORMULA.map((m) => [m, "식"] as const),
        ].map(([m, how]) => {
          const 읽기 =
            how === "실행"
              ? BigInt(칸마다다시구하기(전부땅(m)).칸읽기)
              : 다시구하기읽기(m);
          return [
            `${comma(m)} × ${comma(m)}`,
            comma(m * m),
            comma(읽기),
            seconds(읽기),
            how,
          ];
        }),
        [1, 2, 3],
      ),
      "",
      `실행한 ${NAIVE_RUN.length} 줄이 모두 식 m² + m²(4m² − 4m) 과 일치했고, 나머지 ${NAIVE_FORMULA.length} 줄은 그 식으로 낸 값입니다.`,
    ].join("\n"),

  /** 가장 단순한 방법이 3×4 격자에서 땅 칸마다 구한 덩어리. */
  "naive-trace": () => {
    const got = 칸마다다시구하기(WALK);
    const 처음: Map<string, number> = new Map();
    const rows = got.기록.map((x) => {
      const key = x.칸.join(",");
      const first = 처음.get(key);
      if (first === undefined) 처음.set(key, x.시작);
      return [
        cell(x.시작, WC),
        `{${cells(x.칸, WC)}}`,
        first === undefined ? "새 섬" : `없다 — ${cell(first, WC)} 에서 구했다`,
      ];
    });
    return [
      md(["시작한 땅 칸", "구한 덩어리", "새로 알아낸 것"], rows),
      "",
      `덩어리를 ${got.덩어리} 번 구했고, 그중 서로 다른 것은 ${got.섬} 개입니다.`,
    ].join("\n");
  },

  /** 같은 격자를 두 방식으로 처리해 칸 읽기를 나란히 놓는다. */
  "mark-vs-remark": () => {
    const 재기 = (g: Grid) => ({
      다시: 칸마다다시구하기(g),
      표시: 표시하며세기(g),
    });
    const w = 재기(WALK);
    const f = 재기(전부땅(10));
    return md(
      [
        "방법",
        "3×4 · 구한 덩어리",
        "3×4 · 칸 읽기",
        "10×10 전부 땅 · 구한 덩어리",
        "10×10 전부 땅 · 칸 읽기",
      ],
      [
        [
          "땅 칸마다 덩어리를 다시 구한다",
          comma(w.다시.덩어리),
          comma(w.다시.칸읽기),
          comma(f.다시.덩어리),
          comma(f.다시.칸읽기),
        ],
        [
          "표시를 남기며 한 번만 구한다",
          comma(w.표시.섬),
          comma(w.표시.칸읽기),
          comma(f.표시.섬),
          comma(f.표시.칸읽기),
        ],
      ],
      [1, 2, 3, 4],
    );
  },

  /** 왼쪽·위만 보는 규칙은 굽은 섬에서 갈린다. */
  "left-up-rule": () =>
    md(
      ["격자", "왼쪽·위 규칙", "정본"],
      [
        [
          "전개가 쓰는 3×4 격자",
          String(왼쪽위규칙(WALK).섬),
          String(countIslands(WALK)),
        ],
        [
          "ㄷ 자 [[1,0,1],[1,1,1]]",
          String(왼쪽위규칙(U자).섬),
          String(countIslands(U자)),
        ],
      ],
      [1, 2],
    ),

  /** ㄷ 자 격자에서 왼쪽·위 규칙이 땅 칸마다 본 것. */
  "left-up-trace": () => {
    const C = (U자[0] as number[]).length;
    const got = 왼쪽위규칙(U자);
    return [
      md(
        ["땅 칸", "왼쪽 칸", "위 칸", "판정"],
        got.기록.map((x) => [
          cell(x.칸, C),
          x.왼쪽,
          x.위,
          x.새섬 === null ? "건너뛴다" : `새 섬 ${x.새섬}`,
        ]),
      ),
      "",
      `규칙은 섬 ${got.섬} 개를 세고, 정본의 답은 ${countIslands(U자)} 입니다.`,
    ].join("\n");
  },

  /** 격자 그래프 — 칸 (0,1) 하나를 읽는다. */
  "graph-read-cell": () => {
    const target = 1;
    const r = Math.floor(target / WC);
    const c = target % WC;
    let 간선 = 0;
    const 이어진: number[] = [];
    const rows = D4.map(([dr, dc], d) => {
      const nr = r + dr;
      const nc = c + dc;
      const inside = nr >= 0 && nr < W.R && nc >= 0 && nc < WC;
      if (!inside) {
        return [DIR_NAMES[d] as string, `(${nr},${nc})`, "—", "격자 밖"];
      }
      const id = nr * WC + nc;
      const v = (WALK[nr] as number[])[nc] as number;
      if (v !== 0) {
        간선++;
        이어진.push(id);
      }
      return [
        DIR_NAMES[d] as string,
        cell(id, WC),
        String(id),
        v === 0 ? "물 — 간선 없음" : "땅 — 간선",
      ];
    });
    return [
      md(["방향", "이웃 칸", "번호", "판정"], rows, [2]),
      "",
      `${cell(target, WC)} 의 번호는 ${target} 이고, 붙은 간선은 ${간선} 개이며 그 간선이 잇는 칸은 ${cells(이어진, WC)} 입니다.`,
    ].join("\n");
  },

  /** 격자 그래프 — 땅 칸마다 네 이웃의 번호와 값. */
  "graph-relations": () => {
    const at = (i: number) =>
      (WALK[Math.floor(i / WC)] as number[])[i % WC] as number;
    let 규칙일치 = 0;
    let 격자안 = 0;
    let 땅이웃합 = 0;
    const 차이 = [-WC, WC, -1, 1];
    const rows: string[][] = [];
    for (let i = 0; i < W.R * WC; i++) {
      if (at(i) === 0) continue;
      const r = Math.floor(i / WC);
      const c = i % WC;
      let 땅이웃 = 0;
      const dirs = D4.map(([dr, dc], d) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= W.R || nc < 0 || nc >= WC) return "밖";
        const id = nr * WC + nc;
        격자안++;
        if (id - i === 차이[d]) 규칙일치++;
        if (at(id) !== 0) 땅이웃++;
        return `${id} ${at(id) === 0 ? "물" : "땅"}`;
      });
      땅이웃합 += 땅이웃;
      rows.push([cell(i, WC), String(i), ...dirs, String(땅이웃)]);
    }
    const 짝 = sidePairs(W.R, WC).length;
    const 땅짝 = landPairs(WALK).length;
    return [
      md(
        ["땅 칸", "번호", "위", "아래", "왼쪽", "오른쪽", "땅 이웃"],
        rows,
        [1, 6],
      ),
      "",
      `격자 안에 있는 이웃 ${격자안} 개 가운데 번호가 위 −${WC} · 아래 +${WC} · 왼쪽 −1 · 오른쪽 +1 규칙과 맞은 것은 ${규칙일치} 개입니다. 칸 ${W.R * WC} 개 사이에 변을 공유하는 짝은 ${짝} 개이고 그중 두 칸이 다 땅인 짝은 ${땅짝} 개이며, 땅 이웃 수를 모두 더한 ${땅이웃합}${이가(땅이웃합)} 그 ${땅짝} 개의 두 배입니다.`,
    ].join("\n");
  },

  /** 이웃의 정의 하나가 답을 바꾼다. */
  "diagonal-rule": () =>
    md(
      ["격자", "상하좌우 넷", "대각선까지 여덟"],
      [
        [
          "체커보드 [[1,0,1],[0,1,0],[1,0,1]]",
          String(표시하며세기(체커3, D4).섬),
          String(표시하며세기(체커3, D8).섬),
        ],
        [
          "전개가 쓰는 3×4 격자",
          String(표시하며세기(WALK, D4).섬),
          String(표시하며세기(WALK, D8).섬),
        ],
      ],
      [1, 2],
    ),

  /** 2단계 — 섬이 바뀌어도 표시를 지우지 않는다. */
  "build-persist": () => {
    const rows: string[][] = [];
    let off = 0;
    W.steps.forEach((s, i) => {
      const prev = W.steps[i - 1];
      if (prev) {
        prev.label.forEach((v, x) => {
          if (v !== 0 && s.label[x] !== v) off++;
        });
      }
      if (s.event.kind !== "start") return;
      let j = i + 1;
      while (j < W.steps.length && W.steps[j]?.event.kind === "pop") j++;
      const end = W.steps[j - 1] as Step;
      const marked = end.label.flatMap((v, x) => (v !== 0 ? [x] : []));
      rows.push([
        `섬 ${s.islands}`,
        stepOf(i),
        stepOf(j - 1),
        cells(marked, WC),
      ]);
    });
    const skipped = W.steps.flatMap((s, i) =>
      s.event.kind === "skip"
        ? s.event.cells
            .filter((x) => x.why === "seen")
            .map((x) => `${cell(x.cell, WC)}(${stepOf(i)})`)
        : [],
    );
    return [
      md(["섬", "시작한 걸음", "스택이 빈 걸음", "그때 표시된 칸"], rows),
      "",
      `${W.steps.length} 걸음 동안 한 번 켜진 표시가 꺼진 것은 ${off} 번이고, 바깥 반복이 표시를 보고 건너뛴 땅 칸은 ${skipped.join(" · ")} 입니다.`,
    ].join("\n");
  },

  /** 3단계의 쉬운 경우 — 이웃이 전부 물이거나 격자 밖인 섬. */
  "build-lone": () => roundTable(W, 2 * WC + 2),

  /** 3단계의 불안한 경우 — 한 칸을 두 이웃이 함께 보는 2×2 전부 땅. */
  "shared-neighbour": () => roundTable(traced(전부땅(2)), 0),

  /** 1단계 — 상태마다 범위와, 전개 입력에서 잰 값. */
  "build-sizes": () => {
    const last = W.steps.at(-1) as Step;
    const L = landOf(WALK);
    const 표시 = last.label.filter((v) => v !== 0).length;
    const 담기 = W.steps.reduce(
      (n, s) =>
        n +
        (s.event.kind === "start"
          ? 1
          : s.event.kind === "pop"
            ? s.event.checks.filter((k) => k.look === "push").length
            : 0),
      0,
    );
    return md(
      ["상태", "범위", "전개 입력에서 잰 값"],
      [
        [
          "`seen` 이 참인 칸 수",
          "지금까지 센 섬들의 땅 칸 수 · `L` 이하",
          `끝났을 때 ${표시} (L = ${L})`,
        ],
        ["`stack` 의 길이", "`L` 이하", `가장 길 때 ${W.maxStack}`],
        ["담은 총 횟수", "`L` 과 같다", String(담기)],
        ["`islands`", "새 섬을 시작할 때만 는다", String(W.answer)],
      ],
    );
  },

  /** 전제 — 땅이 한 종류라야 한다. */
  "premise-kinds": () =>
    md(
      ["격자", "땅·물만 가르기(이 절차)", "같은 값끼리만 잇기"],
      [
        [
          "전개가 쓰는 3×4 격자",
          String(countIslands(WALK)),
          String(값별영역(WALK)),
        ],
        [
          "두 종류 [[1,1,2],[0,2,2]]",
          String(countIslands(두종류)),
          String(값별영역(두종류)),
        ],
      ],
      [1, 2],
    ),

  /** 표시를 켜는 자리 셋을 같은 두 격자에 실제로 걸어 본다. */
  "mark-placement": () => {
    const 예산 = 100_000;
    const 안켬 = (g: Grid): string => {
      const got = 표시안함(g, 예산);
      return got === null
        ? `담기 ${comma(예산)} 번에도 안 끝난다`
        : String(got);
    };
    return md(
      ["표시를 켜는 자리", "3×4 전개 입력", "4×4 전부 땅"],
      [
        [
          "담을 때(정본)",
          String(countIslands(WALK)),
          String(countIslands(전부땅(4))),
        ],
        [
          "꺼낼 때",
          String(꺼낼때표시(WALK).섬),
          String(꺼낼때표시(전부땅(4)).섬),
        ],
        ["켜지 않음", 안켬(WALK), 안켬(전부땅(4))],
      ],
    );
  },

  /** 답이 같은 두 자리를 계수로 가른다. */
  "mark-placement-cost": () => {
    const 줄 = (label: string, g: Grid): string[] => {
      const a = 표시하며세기(g);
      const b = 꺼낼때표시(g);
      return [
        label,
        comma(landOf(g)),
        comma(a.담기),
        comma(a.최대),
        comma(b.담기),
        comma(b.최대),
      ];
    };
    return md(
      [
        "격자",
        "땅 칸",
        "담을 때 · 담기",
        "담을 때 · 스택 최대",
        "꺼낼 때 · 담기",
        "꺼낼 때 · 스택 최대",
      ],
      [
        줄("3×4 전개 입력", WALK),
        줄("4×4 전부 땅", 전부땅(4)),
        줄("30×30 전부 땅", 전부땅(30)),
      ],
      [1, 2, 3, 4, 5],
    );
  },

  /** 전개의 고정 입력과 기대하는 답. */
  "walk-input": () =>
    [
      "const grid = [",
      ...WALK.map((row) => `  [${row.join(", ")}],`),
      "];",
      `// 이 절이 끝나면 ${countIslands(WALK)}${이가(countIslands(WALK))} 나와야 한다`,
    ].join("\n"),

  /** 1. 격자 크기를 재고 표시 배열을 만든 직후. */
  "walk-init": () => {
    const init = (grid: Grid) => {
      const R = grid.length;
      const C = R === 0 ? 0 : (grid[0] as number[]).length;
      const seen: boolean[] = Array.from({ length: R * C }, () => false);
      return { R, C, seen };
    };
    const a = init(WALK);
    const b = init([]);
    return columns([
      ["R", `= ${a.R}`],
      ["C", `= ${a.C}`],
      [
        "seen",
        `= [false × ${a.seen.length}]`,
        `칸 번호 0 부터 ${a.seen.length - 1} 까지`,
      ],
      ["stack", "= []"],
      ["islands", "= 0"],
      [
        "",
        "",
        `빈 격자 [] 라면 R = ${b.R} · C = ${b.C} 이고 seen 의 길이도 ${b.seen.length}`,
      ],
    ]);
  },

  /** 2. 바깥 반복이 열두 칸에서 각각 한 일. */
  "outer-scan": () => {
    const rows: string[][] = [];
    W.steps.forEach((s, i) => {
      const e = s.event;
      if (e.kind === "start") {
        rows.push([
          cell(e.cell, WC),
          "1",
          "없음",
          `② 새 섬을 시작한다 — 섬 ${s.islands}`,
          stepOf(i),
        ]);
      }
      if (e.kind === "skip") {
        for (const x of e.cells) {
          rows.push([
            cell(x.cell, WC),
            x.why === "water" ? "0" : "1",
            x.why === "seen" ? "있음" : "없음",
            x.why === "water"
              ? "① 물이다 — 건너뛴다"
              : "① 이미 센 섬의 칸이다 — 건너뛴다",
            stepOf(i),
          ]);
        }
      }
    });
    const 둘 = rows.filter((r) => (r[3] as string).startsWith("②")).length;
    const 하나 = rows.length - 둘;
    return [
      md(["보는 칸", "값", "표시", "한 일", "걸음"], rows, [1]),
      "",
      `갈래 ② 가 ${둘} 번, 갈래 ① 이 ${하나} 번 실행됐고, 반환값은 ${W.answer} 입니다.`,
    ].join("\n");
  },

  /** 3. 칸 번호와 (행, 열) 사이를 오가는 두 줄. */
  "walk-index": () => {
    const id = 1 * WC + 3;
    const r = Math.floor(id / WC);
    const c = id % WC;
    return columns([
      [`(${r},${c})`, `→ ${r}·${WC} + ${c} = ${r * WC + c}`, "담을 때"],
      [
        String(id),
        `→ ⌊${id}/${WC}⌋ = ${Math.floor(id / WC)} · ${id} % ${WC} = ${id % WC} → ${cell(id, WC)}`,
        "꺼낼 때",
      ],
    ]);
  },

  /** 3. 첫 덩어리를 표시하는 스택 한 바퀴. */
  "first-round": () => roundTable(W, 0),

  /** 스택을 큐로 바꾸면 섬 수는 같고 꺼내는 순서와 옮기는 양이 갈린다. */
  "queue-order": () => {
    const s = 표시하며세기(WALK);
    const q = 큐로꺼내기(WALK);
    const big = 전부땅(30);
    return md(
      ["잰 것", "스택", "큐"],
      [
        ["3×4 · 꺼낸 순서", cells(s.꺼낸순서, WC), cells(q.꺼낸순서, WC)],
        ["3×4 · 섬 수", String(s.섬), String(q.섬)],
        [
          "30×30 전부 땅 · 섬 수",
          String(표시하며세기(big).섬),
          String(큐로꺼내기(big).섬),
        ],
        ["30×30 전부 땅 · 앞으로 옮긴 원소", "0", comma(큐로꺼내기(big).옮김)],
      ],
    );
  },

  /** 열이 격자 밖인지 안 보면 줄 끝과 앞 줄 끝이 이어진다. */
  "column-guard": () =>
    md(
      ["격자", "열 검사 있음(정본)", "번호 범위만 검사"],
      [
        [
          "전개가 쓰는 3×4 격자",
          String(countIslands(WALK)),
          String(열경계없음(WALK)),
        ],
        [
          "한 행 [[1,0,1,1]]",
          String(countIslands([[1, 0, 1, 1]])),
          String(열경계없음([[1, 0, 1, 1]])),
        ],
        [
          "2×2 전부 땅",
          String(countIslands(전부땅(2))),
          String(열경계없음(전부땅(2))),
        ],
      ],
      [1, 2],
    ),

  /** 줄 끝이 이어지는 자리 — 칸 (1,0) 의 왼쪽. */
  "column-wrap": () => {
    const id = 1 * WC + 0;
    const left = id - 1;
    return columns([
      [`${cell(id, WC)} 의 번호`, `1·${WC} + 0 = ${id}`],
      ["왼쪽 칸을 좌표로 보면", "(1,-1) — 열이 -1 이라 격자 밖"],
      [
        "왼쪽 칸을 번호로만 보면",
        `${id} − 1 = ${left} — 0 이상 ${W.R * WC} 미만이라 격자 안`,
      ],
      [`번호 ${left} 을 다시 펴면`, `${cell(left, WC)} — 앞 줄의 마지막 칸`],
    ]);
  },

  /** 4. 걸음마다 조건 판정 — 모든 갈래가 실제 값으로 나온다. */
  "walk-trace": () => {
    const rows = W.steps.map((s, i) => {
      const e = s.event;
      let 칸: string;
      let 판정: string;
      if (e.kind === "start") {
        칸 = cell(e.cell, WC);
        판정 = "땅이고 `seen` 이 **거짓** → ②";
      } else if (e.kind === "pop") {
        칸 = `${cell(e.cell, WC)} 꺼내기`;
        판정 = judgePop(e);
      } else {
        칸 = cells(
          e.cells.map((x) => x.cell),
          WC,
        );
        const bits: string[] = [];
        if (e.cells.some((x) => x.why === "water")) bits.push("물");
        if (e.cells.some((x) => x.why === "seen"))
          bits.push("`seen` 이 **참**");
        판정 = `${bits.join(" · ")} → ①`;
      }
      return [stepOf(i), 칸, 판정, stackText(s.stack, WC), String(s.islands)];
    });
    const where: Record<string, string[]> = {};
    const total: Record<string, number> = {};
    W.steps.forEach((s, i) => {
      for (const [b, n] of Object.entries(branchCounts(s.event))) {
        if (n === 0) continue;
        where[b] = [...(where[b] ?? []), stepOf(i)];
        total[b] = (total[b] ?? 0) + n;
      }
    });
    const summary = ["①", "②", "③", "④", "⑤"]
      .map(
        (b) =>
          `${b} ${CIRCLED_JOSA[b]} ${(where[b] ?? []).join(" · ")} 에서 ${total[b] ?? 0} 번`,
      )
      .join(", ");
    const pops = W.steps.filter((s) => s.event.kind === "pop").length;
    return [
      md(["걸음", "다루는 칸", "조건 판정", "stack", "islands"], rows, [4]),
      "",
      `${summary} 실행됐습니다(칸 하나를 한 번으로 셉니다). 꺼내기는 ${pops} 번이고 땅 칸도 ${landOf(WALK)} 개이며, 반환값은 ${W.answer} 입니다.`,
    ].join("\n");
  },

  /** 한 줄로 이어진 섬에서 재귀 깊이가 곧 그 섬의 칸 수가 된다. */
  "recursion-depth": () => {
    const 돌려보기 = (run: (g: Grid) => number, g: Grid): string => {
      try {
        return `섬 ${run(g)} 개`;
      } catch (e) {
        return (e as Error).constructor.name;
      }
    };
    return md(
      ["한 줄로 이어진 섬", "칸 수", "재귀", "반복문과 스택 배열(정본)"],
      [1_000, 100_000].map((len) => [
        `1 × ${comma(len)}`,
        comma(len),
        돌려보기(재귀로적기, 한줄(len)),
        돌려보기(countIslands, 한줄(len)),
      ]),
      [1],
    );
  },

  /** 전체 코드를 여러 격자에 실행한 결과. */
  "walk-result": () => {
    const cases: [string, Grid][] = [
      ["countIslands([[1,1,0,1],[1,0,0,1],[0,0,1,0]])", WALK],
      ["countIslands([[1,1,0],[0,1,0],[0,0,1]])", L자],
      ["countIslands([[1,0,1],[0,1,0],[1,0,1]])", 체커3],
      ["countIslands([[1,1],[1,1]])", 전부땅(2)],
      ["countIslands([[1,0,1,1]])", [[1, 0, 1, 1]]],
      ["countIslands([[1],[1],[0],[1]])", [[1], [1], [0], [1]]],
      [
        "countIslands([[0,0],[0,0]])",
        [
          [0, 0],
          [0, 0],
        ],
      ],
      ["countIslands([[1]])", [[1]]],
      ["countIslands([])", []],
      ["countIslands([[]])", [[]]],
    ];
    return columns(
      cases.map(([call, g]) => [call, "→", String(countIslands(g))]),
    );
  },

  /** 알아 두면 좋은 개념 — 간선을 적어 두면 드는 칸. */
  "related-implicit": () => {
    const 전부 = sidePairs(W.R, WC).length;
    const 땅 = landPairs(WALK).length;
    return [
      md(
        ["정점으로 둔 것", "정점", "간선", "이웃 목록으로 적을 때 칸"],
        [
          ["칸 전부", String(W.R * WC), String(전부), String(2 * 전부)],
          ["땅 칸만", String(landOf(WALK)), String(땅), String(2 * 땅)],
        ],
        [1, 2, 3],
      ),
      "",
      `이 편의 코드는 두 줄 어느 쪽도 적어 두지 않고, 이웃을 \`DIRS\` ${D4.length} 짝으로 그때그때 계산합니다.`,
    ].join("\n");
  },

  /** 정의를 작은 격자에 넣어 검산한다. */
  "math-verify": () =>
    md(
      ["격자", "칸 수 R·C", "도미노 수", "체커보드의 섬 수", "⌈R·C/2⌉"],
      (
        [
          [1, 1],
          [2, 2],
          [3, 3],
          [3, 4],
        ] as [number, number][]
      ).map(([R, C]) => [
        `${R} × ${C}`,
        comma(R * C),
        comma(Math.floor((R * C) / 2)),
        comma(countIslands(체커RC(R, C))),
        comma(최대섬수(R, C)),
      ]),
      [1, 2, 3, 4],
    ),

  /** 3×4 격자를 가로 도미노로 덮는 한 가지 방법. */
  "math-domino": () => {
    const R = 3;
    const C = 4;
    const letters = "ABCDEFGHIJKL";
    const rows: string[] = [];
    let k = 0;
    for (let r = 0; r < R; r++) {
      const row: string[] = [];
      for (let c = 0; c < C; c += 2) {
        const ch = letters[k] as string;
        row.push(ch, ch);
        k++;
      }
      rows.push(row.join(" "));
    }
    if (k * 2 !== R * C) throw new Error("도미노가 칸을 남김없이 덮지 못했다");
    return rows.join("\n");
  },

  /** 닫힌 형태에 제약 규모를 넣는다. */
  "math-scale": () =>
    md(
      ["격자", "칸 수 R·C", "⌈R·C/2⌉", "체커보드로 실제로 센 섬 수"],
      (
        [
          [3, 4],
          [10, 10],
          [1, 1000],
          [100, 100],
          [1000, 1000],
        ] as [number, number][]
      ).map(([R, C]) => [
        `${comma(R)} × ${comma(C)}`,
        comma(R * C),
        comma(최대섬수(R, C)),
        comma(countIslands(체커RC(R, C))),
      ]),
      [1, 2, 3],
    ),

  /** 불변식 — 걸음마다 표시된 칸 수와 센 섬들의 칸 수. */
  "invariant-trace": () => {
    const last = W.steps.at(-1) as Step;
    const size = (k: number) => last.label.filter((v) => v === k).length;
    const 같음: string[] = [];
    const 다름: string[] = [];
    let 빈걸음 = 0;
    const rows = W.steps.map((s, i) => {
      const 표시 = s.label.filter((v) => v !== 0).length;
      let 센 = 0;
      for (let k = 1; k <= s.islands; k++) 센 += size(k);
      const same = 표시 === 센;
      if (s.stack.length === 0) {
        빈걸음++;
        if (same) 같음.push(stepOf(i));
      }
      if (!same) 다름.push(stepOf(i));
      return [
        stepOf(i),
        String(s.islands),
        String(표시),
        String(센),
        stackText(s.stack, WC),
        same ? "같다" : "다르다",
      ];
    });
    const 다른데빈 = 다름.filter(
      (t) => (W.steps[Number(t.slice(1)) - 1]?.stack.length ?? 0) === 0,
    ).length;
    return [
      md(
        [
          "걸음",
          "islands",
          "표시된 칸 수",
          "센 섬들의 칸 수",
          "stack",
          "두 수",
        ],
        rows,
        [1, 2, 3],
      ),
      "",
      `스택이 빈 걸음 ${빈걸음} 개 가운데 두 수가 같은 것은 ${같음.length} 개입니다. 두 수가 다른 걸음은 ${다름.join(" · ")} 이고, 그중 스택이 빈 걸음은 ${다른데빈} 개입니다.`,
    ].join("\n");
  },

  /** 불변식 — 경계 입력에서 각 갈래가 몇 번 실행되는가. */
  "invariant-edges": () => {
    const cases: [string, Grid][] = [
      ["빈 격자 `[]`", []],
      ["열이 없다 `[[]]`", [[]]],
      ["한 칸 `[[1]]`", [[1]]],
      ["한 칸 `[[0]]`", [[0]]],
      [
        "전부 물 `[[0,0],[0,0]]`",
        [
          [0, 0],
          [0, 0],
        ],
      ],
      ["전부 땅 `[[1,1],[1,1]]`", 전부땅(2)],
      ["한 행 `[[1,0,1,1]]`", [[1, 0, 1, 1]]],
      ["한 열 `[[1],[1],[0],[1]]`", [[1], [1], [0], [1]]],
    ];
    return md(
      [
        "입력",
        "바깥 반복이 본 칸",
        "새 섬 시작",
        "격자 밖 건너뛰기",
        "새 땅 칸 담기",
        "결과",
      ],
      cases.map(([name, g]) => {
        const run = traced(g);
        const n: Record<string, number> = {
          "①": 0,
          "②": 0,
          "③": 0,
          "④": 0,
          "⑤": 0,
        };
        for (const s of run.steps) {
          for (const [b, k] of Object.entries(branchCounts(s.event))) {
            n[b] = (n[b] ?? 0) + k;
          }
        }
        return [
          name,
          String((n["①"] ?? 0) + (n["②"] ?? 0)),
          String(n["②"]),
          String(n["③"]),
          String(n["⑤"]),
          String(countIslands(g)),
        ];
      }),
      [1, 2, 3, 4, 5],
    );
  },

  /** 불변식을 쓰던 줄 하나를 지우면 어떤 값이 나오는가. */
  "mutant-no-seen-check": () =>
    md(
      ["격자", "땅 칸", "표시 확인 있음(정본)", "표시 확인 없음"],
      (
        [
          ["전개가 쓰는 3×4 격자", WALK],
          ["L 자 [[1,1,0],[0,1,0],[0,0,1]]", L자],
          ["체커보드 [[1,0,1],[0,1,0],[1,0,1]]", 체커3],
        ] as [string, Grid][]
      ).map(([name, g]) => [
        name,
        String(landOf(g)),
        String(countIslands(g)),
        String(표시확인없음.countIslands(g)),
      ]),
      [1, 2, 3],
    ),

  /** 3×4 격자에서 변이가 섬 수를 언제 늘리는가. */
  "mutant-trace": () =>
    md(
      ["땅 칸", "그때 표시", "정본의 islands", "표시 확인 없음의 islands"],
      표시확인없음사본(WALK).map((x) => [
        cell(x.칸, WC),
        x.표시 ? "있음" : "없음",
        String(x.정본),
        String(x.뺀쪽),
      ]),
      [2, 3],
    ),

  /** 전개의 꺼내기 걸음마다 격자에서 몇 칸을 읽었는가. */
  "perf-count": () => {
    const rows: string[][] = [];
    let 이웃합 = 0;
    let 오담기 = 0;
    let 꺼내기 = 0;
    W.steps.forEach((s, i) => {
      const e = s.event;
      if (e.kind !== "pop") return;
      꺼내기++;
      const 이웃 = e.checks.filter((k) => k.look !== "out").length;
      const 담김 = e.checks.filter((k) => k.look === "push").length;
      이웃합 += 이웃;
      오담기 += 담김;
      rows.push([stepOf(i), cell(e.cell, WC), String(이웃), String(담김)]);
    });
    const 바깥 = W.R * WC;
    const L = landOf(WALK);
    rows.push(["꺼내기 합", `${꺼내기} 번`, comma(이웃합), comma(오담기)]);
    return [
      md(
        ["걸음", "꺼낸 칸", "격자 안 이웃 수", "⑤ 로 담은 칸 수"],
        rows,
        [2, 3],
      ),
      "",
      `바깥 반복이 칸 ${바깥} 개를 한 번씩 읽고 꺼내기 ${꺼내기} 번이 이웃 ${이웃합} 칸을 읽어, 칸 읽기의 합은 ${바깥 + 이웃합} 입니다. 땅 칸은 L = ${L} 이고 이웃 읽기 ${이웃합}${이가(이웃합)} 4L = ${4 * L} 이하입니다. 담은 칸은 ② 가 ${W.answer} 개, ⑤ 가 ${오담기} 개로 모두 ${W.answer + 오담기} 개이며 땅 칸 수와 같습니다.`,
    ].join("\n");
  },

  /** 케이스가 무엇을 바꾸고 무엇을 안 바꾸는가 — 칸 수를 맞춘 100×100 격자 셋. */
  "case-costs": () => {
    const 물뿐: Grid = Array.from({ length: 100 }, () =>
      new Array<number>(100).fill(0),
    );
    const 줄 = (label: string, g: Grid): string[] => {
      const got = 표시하며세기(g);
      return [
        label,
        comma(got.섬),
        comma(got.칸읽기),
        comma(got.담기),
        comma(got.최대),
      ];
    };
    return md(
      ["100×100 격자", "섬 수", "칸 읽기", "담은 총 횟수", "스택 최대"],
      [
        줄("전부 물", 물뿐),
        줄("체커보드", 체커보드(100)),
        줄("전부 땅", 전부땅(100)),
      ],
      [1, 2, 3, 4],
    );
  },

  /** 칸 하나를 안 읽으면 답을 낼 수 없다 — 그 칸의 값이 답을 바꾼다. */
  "lower-bound": () =>
    md(
      ["격자", "(0,2) 의 값", "섬 수"],
      [0, 1].map((v) => [
        `[[1,1,${v}],[0,0,1]]`,
        v === 0 ? "물" : "땅",
        String(countIslands(물음칸(v))),
      ]),
      [2],
    ),

  /** 스택을 가장 크게 만드는 입력 — 전부 땅인 정사각 격자. */
  "worst-stack": () => {
    const sides = [4, 8, 16, 32, 1000];
    let 맞음 = 0;
    let 칸같음 = 0;
    const rows = sides.map((m) => {
      const got = 표시하며세기(전부땅(m));
      if (got.최대 === 스택최대식(m)) 맞음++;
      if (got.담기 === m * m) 칸같음++;
      return [
        `${comma(m)} × ${comma(m)}`,
        comma(m * m),
        comma(got.섬),
        comma(got.담기),
        comma(got.최대),
        comma(스택최대식(m)),
      ];
    });
    return [
      md(
        [
          "전부 땅 격자",
          "칸 수",
          "섬 수",
          "담은 총 횟수",
          "스택 최대",
          "(m²−m+2)/2",
        ],
        rows,
        [1, 2, 3, 4, 5],
      ),
      "",
      `${sides.length} 줄 가운데 스택 최대가 (m²−m+2)/2 와 같은 줄은 ${맞음} 줄이고, 담은 총 횟수가 칸 수와 같은 줄도 ${칸같음} 줄입니다.`,
    ].join("\n");
  },

  /** 스스로 점검하기 — 꺼낼 때 켜면 3×4 에서 담기 총합이 바뀌는가. */
  "check-mark-on-pop": () => {
    const a = 표시하며세기(WALK);
    const b = 꺼낼때표시(WALK);
    return md(
      ["3×4 전개 입력", "담기 총합", "스택 최대"],
      [
        ["담을 때 켠다", String(a.담기), String(a.최대)],
        ["꺼낼 때 켠다", String(b.담기), String(b.최대)],
      ],
      [1, 2],
    );
  },
};
