/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/graph/countIslands/countIslands-guide.md
 *
 * **세는 사본이 둘 있다**(`표시하며세기`·`칸마다다시구하기`). 정본은 칸을 몇 번 읽었는지를
 * 내보내지 않으므로, 세는 자리만 덧붙인 사본이 아니면 계수를 낼 방법이 없다.
 * `꺼낼때표시`·`표시안함`·`왼쪽위규칙`·`열경계없음`·`큐로꺼내기`·`재귀로적기` 는 **다른
 * 절차**라 사본이 아니라 별도 구현이다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 아래 표의 「정본」 칸은 전부 `countIslands` 자신이나 그것에서 기계로 만든 변이가 낸 값이다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 전부땅, 체커보드 } from "./countIslands-guide.alt.ts";
import { countIslands } from "./countIslands-guide.ref.ts";

type Grid = number[][];

/** 상 · 하 · 좌 · 우. */
const D4: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** 상하좌우에 대각선 넷을 더한 것. 문제가 인정하지 않는 이웃 정의다. */
const D8: [number, number][] = [
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
const WALK: Grid = [
  [1, 1, 0, 1],
  [1, 0, 0, 1],
  [0, 0, 1, 0],
];

/** ㄷ 자로 굽은 섬 하나. 왼쪽·위만 보는 규칙이 여기서 갈린다. */
const U자: Grid = [
  [1, 0, 1],
  [1, 1, 1],
];

/** 대각선으로만 닿은 땅 다섯. 이웃의 정의가 답을 바꾸는 자리다. */
const 체커3: Grid = [
  [1, 0, 1],
  [0, 1, 0],
  [1, 0, 1],
];

/** 원본 테스트가 첫 케이스로 쓰는 격자. */
const L자: Grid = [
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
];

/** 칸 `len` 개가 한 줄로 이어진 섬 하나. 재귀 깊이가 곧 이 길이가 된다. */
const 한줄 = (len: number): Grid => [new Array<number>(len).fill(1)];

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

/** `39,960.010` 꼴 — 본문 표기와 같다. */
const comma = (n: number | bigint): string => n.toLocaleString("en-US");

/** `(0,0)` 꼴 — 본문이 칸을 가리키는 표기와 같다. */
const cell = (id: number, C: number): string =>
  `(${Math.floor(id / C)},${id % C})`;

/** 표 한 벌을 칸에 맞춰 찍는다. 첫 행이 머리줄이다. */
function table(rows: string[][], alignRight: number[] = []): string[] {
  const cols = rows[0]?.length ?? 0;
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    widths.push(Math.max(...rows.map((r) => width(r[c] ?? ""))));
  }
  return rows.map((r) =>
    r
      .map((c, i) =>
        alignRight.includes(i)
          ? padLeft(c, widths[i] ?? 0)
          : pad(c, widths[i] ?? 0),
      )
      .join("   ")
      .replace(/\s+$/, ""),
  );
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
  return { 섬, 칸읽기, 담기, 최대, 꺼낸순서 };
}

/**
 * **가장 단순한 방법** — 표시를 남기지 않고, 땅 칸마다 그 칸이 속한 덩어리를 **처음부터 다시
 * 구한다.** 그렇게 얻은 덩어리 중 서로 다른 것의 개수가 답이다.
 */
function 칸마다다시구하기(grid: Grid): {
  섬: number;
  칸읽기: number;
  덩어리: number;
} {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  let 칸읽기 = 0;
  let 덩어리 = 0;
  const 모임: string[] = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      칸읽기++;
      if ((grid[r] as number[])[c] === 0) continue;
      덩어리++;
      const local: boolean[] = Array.from({ length: R * C }, () => false);
      const stack = [r * C + c];
      const cells = [r * C + c];
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
          cells.push(next);
        }
      }
      const key = [...cells].sort((a, b) => a - b).join(",");
      if (!모임.includes(key)) 모임.push(key);
    }
  }
  return { 섬: 모임.length, 칸읽기, 덩어리 };
}

/**
 * **다른 절차** — 「이 칸이 이미 센 섬에 속하는가」를 **왼쪽 칸과 위 칸만 보고** 판정한다.
 * 표시 배열도 탐색도 없다.
 */
function 왼쪽위규칙(grid: Grid): number {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  let 섬 = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if ((grid[r] as number[])[c] === 0) continue;
      if (c > 0 && (grid[r] as number[])[c - 1] === 1) continue;
      if (r > 0 && (grid[r - 1] as number[])[c] === 1) continue;
      섬++;
    }
  }
  return 섬;
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
 * **다른 절차** — 열이 격자 밖인지는 보지 않고 **눌러 담은 번호가 배열 안인지만** 본다.
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

// 변이가 어느 입력에서도 결과를 안 바꾸면 「달라진다」가 거짓이다. 실행이 그것을 판정한다.
if (표시확인없음.countIslands(WALK) === countIslands(WALK)) {
  throw new Error(
    "변이 「표시 확인을 뺀다」 가 전개 입력에서 결과를 바꾸지 못했다",
  );
}

/* ────────────────────── 닫힌 형태와 그 대조 ────────────────────── */

/**
 * 표시를 남기지 않는 방법이 **전부 땅인 `m × m` 격자**에서 읽는 칸 수.
 *
 * 바깥 반복이 `m²` 칸을 읽고, 땅 칸 `m²` 개마다 덩어리를 다시 구하면서 격자 안에 있는
 * (칸, 방향) 쌍 `4m² − 4m` 개를 매번 읽는다. 아래 `NAIVE_CHECK` 가 작은 격자에서 이 식을
 * 실행과 대조한다 — 제약 규모는 실행할 수 없어서 식으로 내되, 식 자체는 실행이 진다.
 */
const 다시구하기읽기 = (m: number): bigint =>
  BigInt(m) ** 2n + BigInt(m) ** 2n * (4n * BigInt(m) ** 2n - 4n * BigInt(m));

/** 표시를 남기는 절차가 전부 땅인 `m × m` 격자에서 읽는 칸 수. */
const 표시하며읽기 = (m: number): bigint =>
  5n * BigInt(m) ** 2n - 4n * BigInt(m);

const NAIVE_CHECK = [3, 10, 30];
for (const m of NAIVE_CHECK) {
  const g = 전부땅(m);
  if (BigInt(칸마다다시구하기(g).칸읽기) !== 다시구하기읽기(m)) {
    throw new Error(`다시 구하기 식이 ${m}×${m} 에서 실행과 다르다`);
  }
  if (BigInt(표시하며세기(g).칸읽기) !== 표시하며읽기(m)) {
    throw new Error(`표시하며 세기 식이 ${m}×${m} 에서 실행과 다르다`);
  }
}

/** 한 변 `m` 인 전부 땅 격자에서 스택이 자라는 최대 길이의 닫힌 형태. */
const 스택최대식 = (m: number): number => (m * m - m + 2) / 2;

/** 칸 `R·C` 개짜리 격자에 들어갈 수 있는 섬의 최대 개수. */
const 최대섬수 = (R: number, C: number): number => Math.ceil((R * C) / 2);

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 이웃의 정의 하나가 답을 바꾼다. */
  "diagonal-rule": () =>
    table(
      [
        ["격자", "상하좌우 넷", "대각선까지 여덟"],
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
    ).join("\n"),

  /** 표시를 남기지 않는 방법이 제약 규모에서 몇 칸을 읽는가. */
  "naive-scale": () =>
    table(
      [
        ["전부 땅 격자", "땅 칸", "칸 읽기", "초당 1억 번 기준"],
        ...[3, 10, 30, 100, 1000].map((m) => {
          const 읽기 = 다시구하기읽기(m);
          return [
            `${comma(m)} × ${comma(m)}`,
            comma(m * m),
            comma(읽기),
            `${(Number(읽기) / 1e8).toLocaleString("en-US", {
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })}초`,
          ];
        }),
      ],
      [0, 1, 2, 3],
    ).join("\n"),

  /** 같은 격자를 두 방식으로 처리해 칸 읽기를 나란히 놓는다. */
  "mark-vs-remark": () => {
    const 재기 = (g: Grid) => ({
      다시: 칸마다다시구하기(g),
      표시: 표시하며세기(g),
    });
    const w = 재기(WALK);
    const f = 재기(전부땅(10));
    return table(
      [
        [
          "",
          "3×4 · 만든 덩어리",
          "3×4 · 칸 읽기",
          "10×10 · 만든 덩어리",
          "10×10 · 칸 읽기",
        ],
        [
          "칸마다 덩어리를 다시 구한다",
          comma(w.다시.덩어리),
          comma(w.다시.칸읽기),
          comma(f.다시.덩어리),
          comma(f.다시.칸읽기),
        ],
        [
          "표시를 남긴다",
          comma(w.표시.섬),
          comma(w.표시.칸읽기),
          comma(f.표시.섬),
          comma(f.표시.칸읽기),
        ],
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** 왼쪽·위만 보는 규칙은 굽은 섬에서 갈린다. */
  "left-up-rule": () =>
    table(
      [
        ["격자", "왼쪽·위만 본다", "정본"],
        [
          "전개가 쓰는 3×4 격자",
          String(왼쪽위규칙(WALK)),
          String(countIslands(WALK)),
        ],
        [
          "ㄷ 자 [[1,0,1],[1,1,1]]",
          String(왼쪽위규칙(U자)),
          String(countIslands(U자)),
        ],
      ],
      [1, 2],
    ).join("\n"),

  /** 표시를 켜는 자리 셋을 같은 두 격자에 실제로 걸어 본다. */
  "mark-placement": () => {
    const 예산 = 100_000;
    const 안켬 = (g: Grid): string => {
      const got = 표시안함(g, 예산);
      return got === null
        ? `담기 ${comma(예산)} 회에서도 안 끝난다`
        : String(got);
    };
    return table(
      [
        ["표시를 켜는 자리", "3×4 전개 입력", "4×4 전부 땅"],
        [
          "담을 때 켠다(정본)",
          String(countIslands(WALK)),
          String(countIslands(전부땅(4))),
        ],
        [
          "꺼낼 때 켠다",
          String(꺼낼때표시(WALK).섬),
          String(꺼낼때표시(전부땅(4)).섬),
        ],
        ["아예 켜지 않는다", 안켬(WALK), 안켬(전부땅(4))],
      ],
      [],
    ).join("\n");
  },

  /** 답이 같은 두 자리를 계수로 가른다. */
  "mark-placement-cost": () => {
    const 줄 = (label: string, g: Grid): string[] => {
      const a = 표시하며세기(g);
      const b = 꺼낼때표시(g);
      return [
        label,
        comma(a.담기),
        comma(a.최대),
        comma(b.담기),
        comma(b.최대),
      ];
    };
    return table(
      [
        [
          "격자",
          "담을 때 · 담기",
          "담을 때 · 스택 최대",
          "꺼낼 때 · 담기",
          "꺼낼 때 · 스택 최대",
        ],
        줄("3 × 4 전개 입력", WALK),
        줄("4 × 4 전부 땅", 전부땅(4)),
        줄("30 × 30 전부 땅", 전부땅(30)),
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** 바깥 반복이 열두 칸에서 각각 무엇을 하는가. */
  "outer-scan": () => {
    const R = WALK.length;
    const C = (WALK[0] as number[]).length;
    const seen: boolean[] = Array.from({ length: R * C }, () => false);
    const rows: string[][] = [["보는 칸", "값", "표시", "무엇을 하는가"]];
    let 섬 = 0;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const id = r * C + c;
        const 값 = (WALK[r] as number[])[c] as number;
        const 표시 = seen[id] === true;
        let 무엇: string;
        if (값 === 0) {
          무엇 = "① 물이다 — 건너뛴다";
        } else if (표시) {
          무엇 = "① 이미 센 섬의 칸이다 — 건너뛴다";
        } else {
          섬++;
          무엇 = `② 새 섬을 시작한다 — 섬 ${섬}`;
          // 그 덩어리를 표시한다 — 정본과 같은 절차다.
          const stack = [id];
          seen[id] = true;
          while (stack.length > 0) {
            const cur = stack.pop() as number;
            const cr = Math.floor(cur / C);
            const cc = cur % C;
            for (const [dr, dc] of D4) {
              const nr = cr + dr;
              const nc = cc + dc;
              if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
              const next = nr * C + nc;
              if ((WALK[nr] as number[])[nc] === 0 || seen[next] === true)
                continue;
              seen[next] = true;
              stack.push(next);
            }
          }
        }
        rows.push([cell(id, C), String(값), 표시 ? "있음" : "없음", 무엇]);
      }
    }
    rows.push(["", "", "", `섬 ${섬} 개`]);
    return table(rows, []).join("\n");
  },

  /** 한 칸을 두 이웃이 함께 보는 가장 작은 자리 — 2×2 전부 땅. */
  "shared-neighbour": () => {
    const g = 전부땅(2);
    const C = 2;
    const R = 2;
    const seen: boolean[] = Array.from({ length: R * C }, () => false);
    const stack = [0];
    seen[0] = true;
    const rows: string[][] = [
      ["꺼낸 칸", "격자 안 이웃", "담는 칸", "꺼낸 뒤 스택"],
    ];
    while (stack.length > 0) {
      const cur = stack.pop() as number;
      const cr = Math.floor(cur / C);
      const cc = cur % C;
      const 이웃: string[] = [];
      const 담김: string[] = [];
      for (const [dr, dc] of D4) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
        const next = nr * C + nc;
        if ((g[nr] as number[])[nc] === 0) {
          이웃.push(`${cell(next, C)} 물`);
          continue;
        }
        if (seen[next] === true) {
          이웃.push(`${cell(next, C)} 표시됨`);
          continue;
        }
        이웃.push(`${cell(next, C)} 땅`);
        seen[next] = true;
        stack.push(next);
        담김.push(cell(next, C));
      }
      rows.push([
        cell(cur, C),
        이웃.join(" "),
        담김.length === 0 ? "없다" : 담김.join(" "),
        `[${[...stack].map((x) => cell(x, C)).join(" ")}]`,
      ]);
    }
    return table(rows, []).join("\n");
  },

  /** 첫 덩어리를 표시하는 스택 한 바퀴. */
  "first-round": () => {
    const C = (WALK[0] as number[]).length;
    const R = WALK.length;
    const seen: boolean[] = Array.from({ length: R * C }, () => false);
    const stack = [0];
    seen[0] = true;
    const rows: string[][] = [
      ["꺼낸 칸", "격자 안 이웃", "담는 칸", "꺼낸 뒤 스택"],
    ];
    while (stack.length > 0) {
      const cur = stack.pop() as number;
      const cr = Math.floor(cur / C);
      const cc = cur % C;
      const 이웃: string[] = [];
      const 담김: string[] = [];
      for (const [dr, dc] of D4) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
        const next = nr * C + nc;
        const 값 = (WALK[nr] as number[])[nc] as number;
        if (값 === 0) {
          이웃.push(`${cell(next, C)} 물`);
          continue;
        }
        if (seen[next] === true) {
          이웃.push(`${cell(next, C)} 표시됨`);
          continue;
        }
        이웃.push(`${cell(next, C)} 땅`);
        seen[next] = true;
        stack.push(next);
        담김.push(cell(next, C));
      }
      rows.push([
        cell(cur, C),
        이웃.join(" "),
        담김.length === 0 ? "없다" : 담김.join(" "),
        `[${[...stack].map((x) => cell(x, C)).join(" ")}]`,
      ]);
    }
    return table(rows, []).join("\n");
  },

  /** 스택을 큐로 바꾸면 섬 수는 같고 꺼내는 순서와 옮기는 양이 갈린다. */
  "queue-order": () => {
    const C = (WALK[0] as number[]).length;
    const s = 표시하며세기(WALK);
    const q = 큐로꺼내기(WALK);
    const big = 전부땅(30);
    return table(
      [
        ["", "스택으로 꺼낸다", "큐로 꺼낸다"],
        [
          "3×4 · 꺼낸 순서",
          s.꺼낸순서.map((x) => cell(x, C)).join(" "),
          q.꺼낸순서.map((x) => cell(x, C)).join(" "),
        ],
        ["3×4 · 섬 수", String(s.섬), String(q.섬)],
        [
          "30×30 전부 땅 · 섬 수",
          String(표시하며세기(big).섬),
          String(큐로꺼내기(big).섬),
        ],
        ["30×30 · 앞으로 옮긴 원소", "0", comma(큐로꺼내기(big).옮김)],
      ],
      [],
    ).join("\n");
  },

  /** 열이 격자 밖인지 안 보면 줄 끝과 앞 줄 끝이 이어진다. */
  "column-guard": () =>
    table(
      [
        ["격자", "열도 본다(정본)", "번호가 배열 안인지만 본다"],
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
    ).join("\n"),

  /** 한 줄로 이어진 섬에서 재귀 깊이가 곧 그 섬의 칸 수가 된다. */
  "recursion-depth": () => {
    const 돌려보기 = (run: (g: Grid) => number, g: Grid): string => {
      try {
        return `섬 ${run(g)} 개`;
      } catch (e) {
        return (e as Error).constructor.name;
      }
    };
    return table(
      [
        ["한 줄로 이어진 섬", "칸 수", "재귀로 적으면", "반복문으로 적으면"],
        ...[1_000, 100_000].map((len) => [
          `1 × ${comma(len)}`,
          comma(len),
          돌려보기(재귀로적기, 한줄(len)),
          돌려보기(countIslands, 한줄(len)),
        ]),
      ],
      [1],
    ).join("\n");
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
    return table(
      cases.map(([call, g]) => [call, "→", String(countIslands(g))]),
      [2],
    ).join("\n");
  },

  /** 정의를 작은 격자에 넣어 검산한다. */
  "math-verify": () =>
    table(
      [
        ["격자", "칸 수 R·C", "도미노 수", "체커보드의 섬 수", "⌈R·C/2⌉"],
        ...(
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
          comma(
            countIslands(
              Array.from({ length: R }, (_, r) =>
                Array.from({ length: C }, (_, c) =>
                  (r + c) % 2 === 0 ? 1 : 0,
                ),
              ),
            ),
          ),
          comma(최대섬수(R, C)),
        ]),
      ],
      [1, 2, 3, 4],
    ).join("\n"),

  /** 닫힌 형태에 제약 규모를 넣는다. */
  "math-scale": () =>
    table(
      [
        ["격자", "칸 수 R·C", "⌈R·C/2⌉", "체커보드로 실제로 센 섬 수"],
        ...(
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
          comma(
            countIslands(
              Array.from({ length: R }, (_, r) =>
                Array.from({ length: C }, (_, c) =>
                  (r + c) % 2 === 0 ? 1 : 0,
                ),
              ),
            ),
          ),
        ]),
      ],
      [0, 1, 2, 3],
    ).join("\n"),

  /** 불변식을 쓰던 줄 하나를 지우면 어떤 값이 나오는가. */
  "mutant-no-seen-check": () =>
    table(
      [
        ["격자", "확인을 둔다(정본)", "확인을 뺀다"],
        [
          "전개가 쓰는 3×4 격자",
          String(countIslands(WALK)),
          String(표시확인없음.countIslands(WALK)),
        ],
        [
          "L 자 [[1,1,0],[0,1,0],[0,0,1]]",
          String(countIslands(L자)),
          String(표시확인없음.countIslands(L자)),
        ],
        [
          "체커보드 [[1,0,1],[0,1,0],[1,0,1]]",
          String(countIslands(체커3)),
          String(표시확인없음.countIslands(체커3)),
        ],
      ],
      [1, 2],
    ).join("\n"),

  /** 전개의 각 단계가 격자에서 몇 칸을 읽었는가. */
  "perf-count": () => {
    const C = (WALK[0] as number[]).length;
    const R = WALK.length;
    const seen: boolean[] = Array.from({ length: R * C }, () => false);
    const stack: number[] = [];
    // 본문 전개가 꺼내기 하나마다 붙인 단계 이름. 꺼내는 순서는 실행이 낸다.
    const 단계 = ["T2", "T3", "T4", "T7", "T8", "T11"];
    const rows: string[][] = [
      ["단계", "꺼낸 칸", "격자 안 이웃 수", "담은 칸 수"],
    ];
    let 이웃합 = 0;
    let 담기합 = 0;
    let 바깥 = 0;
    let i = 0;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        const start = r * C + c;
        바깥++;
        if ((WALK[r] as number[])[c] === 0 || seen[start] === true) continue;
        seen[start] = true;
        stack.push(start);
        담기합++;
        while (stack.length > 0) {
          const cur = stack.pop() as number;
          const cr = Math.floor(cur / C);
          const cc = cur % C;
          let 이웃 = 0;
          let 담김 = 0;
          for (const [dr, dc] of D4) {
            const nr = cr + dr;
            const nc = cc + dc;
            if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
            이웃++;
            const next = nr * C + nc;
            if ((WALK[nr] as number[])[nc] === 0 || seen[next] === true)
              continue;
            seen[next] = true;
            stack.push(next);
            담김++;
            담기합++;
          }
          이웃합 += 이웃;
          rows.push([단계[i] ?? "?", cell(cur, C), String(이웃), String(담김)]);
          i++;
        }
      }
    }
    if (i !== 단계.length) {
      throw new Error(`단계 이름 ${단계.length} 개 ≠ 실제 꺼내기 ${i} 회`);
    }
    rows.push(["이웃 합", `꺼내기 ${i}`, comma(이웃합), comma(담기합)]);
    rows.push(["바깥 반복", "칸 12 개", comma(바깥), "—"]);
    rows.push(["칸 읽기 합", "", comma(이웃합 + 바깥), "—"]);
    return table(rows, [2, 3]).join("\n");
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
    return table(
      [
        ["100×100 격자", "섬 수", "칸 읽기", "담은 총 횟수", "스택 최대"],
        줄("전부 물", 물뿐),
        줄("체커보드", 체커보드(100)),
        줄("전부 땅", 전부땅(100)),
      ],
      [1, 2, 3, 4],
    ).join("\n");
  },

  /** 스택을 가장 크게 만드는 입력 — 전부 땅인 정사각 격자. */
  "worst-stack": () => {
    const rows: string[][] = [
      [
        "전부 땅 격자",
        "칸 수",
        "섬 수",
        "담은 총 횟수",
        "스택 최대",
        "(m²−m+2)/2",
      ],
    ];
    for (const m of [4, 8, 16, 32, 1000]) {
      const got = 표시하며세기(전부땅(m));
      rows.push([
        `${comma(m)} × ${comma(m)}`,
        comma(m * m),
        comma(got.섬),
        comma(got.담기),
        comma(got.최대),
        comma(스택최대식(m)),
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4, 5]).join("\n");
  },
};
