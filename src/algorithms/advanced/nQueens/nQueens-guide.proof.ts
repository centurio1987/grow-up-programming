/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 재귀 호출 하나하나의 상태는 그림 사이드카의 `trace`(정본 소스에서 기계로 만든 계측 사본)에서
 * 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/nQueens/nQueens-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와 } from "../../../../tools/josa.ts";
import {
  N as ALT_N,
  가이드절차,
  앞을내다보는검사,
} from "./nQueens-guide.alt.ts";
import bench from "./nQueens-guide.bench.json";
import {
  ATTACK_AT,
  type Call,
  cell,
  choose,
  d1Of,
  d2Of,
  duration,
  e계승,
  factorial,
  num,
  on,
  originNumbers,
  queensText,
  set,
  solutions,
  TOP,
  trace,
  traceNoColsUndo,
  VERDICT_TEXT,
  WALK_N,
  가지치기,
  앞행만,
} from "./nQueens-guide.fig.tsx";
import { nQueens } from "./nQueens-guide.ref.ts";

const REF = new URL("./nQueens-guide.ref.ts", import.meta.url).pathname;

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

const comma = (n: number): string => num(n);

/** 열 폭을 내용에서 잰 뒤 글자 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        i === 0 ? pad(c, w[0] as number) : padL(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/** 열을 모두 왼쪽 정렬로 맞춘 글자 줄들. 머리줄이 없는 짧은 실행 결과에 쓴다. */
function lines(rows: string[][], indent = ""): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w = Array.from({ length: cols }, (_, i) =>
    Math.max(...rows.map((r) => width(r[i] ?? ""))),
  );
  return rows
    .map((r) =>
      (indent + r.map((c, i) => pad(c, w[i] as number)).join("   ")).replace(
        /\s+$/,
        "",
      ),
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
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 비교에 쓰는 절차 ────────────────────────── */

/** 대각선 검사를 빼고 열만 검사한다 — 가지치기가 열 하나만 남았을 때의 나무. 깊이별 노드도 센다. */
function 열만검사(n: number): { 노드: number; 깊이: number[] } {
  let 노드 = 0;
  const 깊이 = new Array<number>(n + 1).fill(0);
  const go = (row: number, cols: number): void => {
    노드++;
    깊이[row] = (깊이[row] as number) + 1;
    if (row === n) return;
    for (let c = 0; c < n; c++) {
      if (((cols >> c) & 1) === 1) continue;
      go(row + 1, cols | (1 << c));
    }
  };
  go(0, 0);
  return { 노드, 깊이 };
}

/**
 * (가) 순열을 끝까지 만든 다음 대각선을 검사한다. `prefix` 를 주면 그 부분 배치 **아래**에 만든
 * 부분 배치와 완성 배치를 따로 센다.
 */
function 늦게검사(
  n: number,
  prefix: readonly number[] = [],
): { 노드: number; 비교: number; 아래: number; 아래완성: number } {
  let 노드 = 0;
  let 비교 = 0;
  let 아래 = 0;
  let 아래완성 = 0;
  const p: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const under = (row: number): boolean =>
    prefix.length > 0 &&
    row > prefix.length &&
    prefix.every((c, i) => p[i] === c);
  const go = (row: number): void => {
    노드++;
    if (under(row)) {
      아래++;
      if (row === n) 아래완성++;
    }
    if (row === n) {
      outer: for (let a = 0; a < n; a++) {
        for (let b = a + 1; b < n; b++) {
          비교++;
          if (Math.abs((p[a] as number) - (p[b] as number)) === b - a)
            break outer;
        }
      }
      return;
    }
    for (let c = 0; c < n; c++) {
      if (used[c]) continue;
      used[c] = true;
      p[row] = c;
      go(row + 1);
      used[c] = false;
    }
  };
  go(0);
  return { 노드, 비교, 아래, 아래완성 };
}

/**
 * (나) 한 행을 채울 때마다 그 자리에서 이미 놓은 퀸 전부와 대각선을 대조한다. 대각선 번호를 쓰는
 * 판정이 같은 나무에서 대각선 비트를 몇 번 읽는지(`번호읽기`)도 함께 센다 — 열이 비어 있는 후보마다
 * `diag1` 을 읽고, 거기서 안 막히면 `diag2` 를 읽는다(정본의 `||` 와 같은 순서). 두 판정이 한
 * 후보라도 갈리면 던진다.
 */
function 바로검사(
  n: number,
  prefix: readonly number[] = [],
): { 노드: number; 비교: number; 번호읽기: number; 만듦: boolean } {
  let 노드 = 0;
  let 비교 = 0;
  let 번호읽기 = 0;
  let 만듦 = false;
  const p: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  let d1m = 0;
  let d2m = 0;
  const go = (row: number): void => {
    노드++;
    if (
      prefix.length > 0 &&
      row === prefix.length &&
      prefix.every((c, i) => p[i] === c)
    )
      만듦 = true;
    if (row === n) return;
    for (let c = 0; c < n; c++) {
      if (used[c]) continue;
      let 놓을수있다 = true;
      for (let a = 0; a < row; a++) {
        비교++;
        if (Math.abs((p[a] as number) - c) === row - a) {
          놓을수있다 = false;
          break;
        }
      }
      const d1 = d1Of(n, row, c);
      const d2 = d2Of(row, c);
      번호읽기++;
      let byNumber = ((d1m >> d1) & 1) === 0;
      if (byNumber) {
        번호읽기++;
        byNumber = ((d2m >> d2) & 1) === 0;
      }
      if (byNumber !== 놓을수있다) {
        throw new Error(`번호 판정과 쌍 대조가 어긋난다 — ${cell(row, c)}`);
      }
      if (!놓을수있다) continue;
      used[c] = true;
      p[row] = c;
      d1m |= 1 << d1;
      d2m |= 1 << d2;
      go(row + 1);
      d1m ^= 1 << d1;
      d2m ^= 1 << d2;
      used[c] = false;
    }
  };
  go(0);
  return { 노드, 비교, 번호읽기, 만듦 };
}

/** 대각선을 `k` 행마다 한 번씩만 검사한다. `k=1` 이면 매 행, `k=n` 이면 마지막 행에서 한 번. */
function k행마다(n: number, k: number): { 노드: number; 해: number } {
  let 노드 = 0;
  let 해 = 0;
  const p: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const 충돌 = (마지막행: number): boolean => {
    for (let a = 0; a < 마지막행; a++) {
      for (let b = a + 1; b <= 마지막행; b++) {
        if (Math.abs((p[a] as number) - (p[b] as number)) === b - a)
          return true;
      }
    }
    return false;
  };
  const go = (row: number): void => {
    노드++;
    if (row === n) {
      if (!충돌(n - 1)) 해++;
      return;
    }
    for (let c = 0; c < n; c++) {
      if (used[c]) continue;
      used[c] = true;
      p[row] = c;
      if ((row + 1) % k !== 0 || !충돌(row)) go(row + 1);
      used[c] = false;
    }
  };
  go(0);
  return { 노드, 해 };
}

/**
 * 두 대각선을 정수 **하나**에 합쳐 담는다. `d1` 과 `d2` 의 번호 범위가 같아서 서로 다른
 * 대각선이 같은 비트 자리를 나눠 쓰게 된다.
 */
function 대각선합침(n: number): number {
  let 답 = 0;
  const go = (row: number, cols: number, diag: number): void => {
    if (row === n) {
      답++;
      return;
    }
    for (let c = 0; c < n; c++) {
      const d1 = row - c + (n - 1);
      const d2 = row + c;
      if (
        ((cols >> c) & 1) === 1 ||
        ((diag >> d1) & 1) === 1 ||
        ((diag >> d2) & 1) === 1
      ) {
        continue;
      }
      go(row + 1, cols | (1 << c), diag | (1 << d1) | (1 << d2));
    }
  };
  go(0, 0, 0);
  return 답;
}

/**
 * 「수행으로 알아보는 알고리즘」 1 번 걸음의 조각 — 판정 없이 행마다 열 `n` 개를 다 시도하고 다음
 * 행으로 내려간다. 본문의 조각과 같은 모양이고, 끝까지 간 목록을 차례대로 돌려준다.
 */
function 골격(n: number): number[][] {
  const out: number[][] = [];
  const p: number[] = [];
  function place(row: number): void {
    if (row === n) {
      out.push([...p]);
      return;
    }
    for (let c = 0; c < n; c++) {
      p[row] = c;
      place(row + 1);
    }
  }
  place(0);
  return out;
}

/** 목록 하나가 정의(열이 다르고 행 차이 ≠ 열 차이)를 어기는 첫 쌍. 안 어기면 `null`. */
function firstClash(p: readonly number[]): [number, number] | null {
  for (let a = 0; a < p.length; a++) {
    for (let b = a + 1; b < p.length; b++) {
      const x = p[a] as number;
      const y = p[b] as number;
      if (x === y || Math.abs(x - y) === b - a) return [a, b];
    }
  }
  return null;
}

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식을 지키던 줄(`cols ^= 1 << c;`) 하나를 지운 사본. **정본 소스에서 기계로 만든다** —
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만
 * 바꿨다」가 검사되지 않는다.
 */
const 되돌리기없음 = await loadMutant<{ nQueens(n: number): number }>(REF, {
  drop: /^\s*cols \^= 1 << c;\s*$/,
});

/**
 * 대각선 번호에서 `+ (n - 1)` 오프셋을 뺀 사본. `d1` 이 음수가 되면 자바스크립트의 `<<` 는
 * 자리 수를 32 로 나눈 나머지로 취급해 **다른 비트**를 건드린다 — 실행은 되고 답만 달라진다.
 */
const 오프셋없음 = await loadMutant<{ nQueens(n: number): number }>(REF, {
  swap: [/const d1 = row - c \+ \(n - 1\);/, "const d1 = row - c;"],
});

/**
 * 건너뛰는 줄(`continue;`)을 지운 사본 — 판정은 하지만 무엇도 건너뛰지 않는다. 1단계의 골격(행마다
 * 열을 다 시도하고 행 `n` 에서 센다)만 남긴 것과 같은 답을 낸다.
 */
const 판정없음 = await loadMutant<{ nQueens(n: number): number }>(REF, {
  drop: /^\s*continue;\s*$/,
});

/**
 * 중화 실행(`check-proof` 가 변이를 끈 채 사이드카를 한 번 더 부르는 것)에서는 변이 모듈이 정본
 * 그 자체다. 그때는 「변이가 답을 바꿨다 / 안 바꿨다」 자기검사를 건너뛴다 — 값에서 알아낸다.
 */
const 중화 = 되돌리기없음.nQueens === nQueens;

const 변이표 = [1, 4, 5, 6, 7, 8].map((n) => ({
  n: String(n),
  바른: String(nQueens(n)),
  깨진: String(되돌리기없음.nQueens(n)),
}));

const 오프셋표 = [4, 6, 8, 10, 12].map((n) => ({
  n: String(n),
  바른: comma(nQueens(n)),
  변이: comma(오프셋없음.nQueens(n)),
}));

if (!중화) {
  // 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
  if (변이표.every((r) => r.바른 === r.깨진)) {
    throw new Error(
      "되돌리기 변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
  // **이쪽은 반대다.** 본문이 「이 규모에서는 답이 안 달라진다」고 적으므로, 하나라도
  // 달라지면 그 문장이 거짓이 된다.
  if (오프셋표.some((r) => r.바른 !== r.변이)) {
    throw new Error(
      "오프셋 변이가 규모 안에서 답을 바꿨다 — 「답이 안 달라진다」가 거짓이다",
    );
  }
}

/** `1 << d1` 이 실제로 켜는 비트 자리 — 자바스크립트가 자리 수를 32 로 나눈 나머지로 쓰는 것을 실행으로 잰다. */
const 비트자리 = (d1: number): number => Math.log2((1 << d1) >>> 0);

/* ────────────────────────── 걸음 기록에서 뽑는 것 ────────────────────────── */

type Queens = readonly (readonly [number, number])[];

const walk = () => trace(WALK_N);
const callAt = (t: number): Call => walk().calls[t - 1] as Call;
/** 부분 배치 `(r,c)…` 를 들고 들어온 호출. */
function callWith(queens: Queens): Call {
  const key = queensText(queens);
  const hit = walk().calls.find((c) => queensText(c.queens) === key);
  if (!hit) throw new Error(`${key} 로 들어온 호출이 없다`);
  return hit;
}
const T = (c: Call): string => `T${c.index + 1}`;
const masks = (m: { cols: number; diag1: number; diag2: number }) =>
  `cols ${set(m.cols)} · diag1 ${set(m.diag1)} · diag2 ${set(m.diag2)}`;
const countUpTo = (c: Call): number =>
  walk()
    .calls.slice(0, c.index + 1)
    .filter((x) => x.row === WALK_N).length;

/** 판정 한 칸 — 표와 무대가 같은 말을 쓴다. */
const verdictCell = (v: Call["tries"][number]): string =>
  v.verdict === "place"
    ? `c=${v.c} ③`
    : `c=${v.c} ② \`${VERDICT_TEXT[v.verdict]}\``;

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 두 방식이 만든 부분 배치 수를 결과 한 줄씩. */
  "concept-count": () =>
    md(
      ["n", "순열을 끝까지 만든 뒤 검사", "한 행을 채울 때마다 검사"],
      [4, 6, 8].map((n) => [
        String(n),
        comma(늦게검사(n).노드),
        comma(가지치기(n).노드),
      ]),
      [0, 1, 2],
    ),

  /** `deep.origin` ② — 칸 `n` 개를 고르는 방법. 수가 커서 `bigint` 로 센다. */
  "origin-naive": () =>
    md(
      ["n", "고르는 방법 C(n², n)", "퀸 쌍 대조 횟수", "초당 1 억 번 기준"],
      [4, 6, 8, TOP].map((n) => {
        const pick = choose(n * n, n);
        const ops = pick * choose(n, 2);
        return [String(n), num(pick), num(ops), duration(ops)];
      }),
      [0, 1, 2, 3],
    ),

  /** `deep.origin` ③ — 행마다 하나, 열도 서로 다르게. 세 단계의 수와 실제 배치 수. */
  "origin-shrink": () => {
    const ns = [4, 8, TOP];
    const o = originNumbers();
    return [
      md(
        ["고르는 방법", ...ns.map((n) => `n = ${n}`)],
        [
          ["칸 n 개를 아무렇게나", ...ns.map((n) => num(choose(n * n, n)))],
          ["행마다 하나씩 n^n", ...ns.map((n) => num(BigInt(n) ** BigInt(n)))],
          ["열도 서로 다르게 n!", ...ns.map((n) => num(factorial(n)))],
          ["실제 배치 수", ...ns.map((n) => num(nQueens(n)))],
        ],
        [1, 2, 3],
      ),
      "",
      `n = ${o.n} 에서 순열 ${num(o.perms)} 개를 하나마다 퀸 쌍 ${num(o.pairs)} 번까지 대조하면 ${num(o.permPairs)} 번이고, 초당 1 억 번이면 ${duration(o.permPairs)} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 `n` 에 두 방식을 걸고 계수를 나란히 적는다. */
  "two-ways": () => {
    const n = 6;
    const 가 = 늦게검사(n);
    const 나 = 바로검사(n);
    return table(
      ["", "만든 부분 배치", "대각선 비교"],
      [
        ["끝까지 만들고 검사", comma(가.노드), comma(가.비교)],
        ["한 행마다 검사", comma(나.노드), comma(나.비교)],
      ],
    );
  },

  /** `deep.origin` ④ — 차이가 난 자리 하나. `(0,0)(1,1)` 아래에 두 방식이 만든 것. */
  "origin-prefix": () => {
    const n = 6;
    const prefix = [0, 1];
    const 가 = 늦게검사(n, prefix);
    const 나 = 바로검사(n, prefix);
    if (나.만듦)
      throw new Error("한 행마다 검사하는 쪽이 (0,0)(1,1) 을 만들었다");
    return md(
      ["방식", "(0,0)(1,1)", "그 아래 부분 배치", "그중 완성 배치"],
      [
        ["끝까지 만들고 검사", "만든다", comma(가.아래), comma(가.아래완성)],
        ["한 행마다 검사", "만들지 않는다", "0", "0"],
      ],
      [2, 3],
    );
  },

  /** `deep.origin` ⑤ — 앞 행만 보는 규칙이 받아들인, 답이 아닌 첫 배치. */
  "origin-prev-case": () => {
    const n = 5;
    const good = new Set(
      solutions(n).map((qs) => qs.map(([, c]) => c).join(",")),
    );
    const bad = 앞행만(n).find((p) => !good.has(p.join(",")));
    if (!bad)
      throw new Error("앞 행만 보는 규칙이 틀린 배치를 받아들이지 않았다");
    const q = bad.map((c, r) => cell(r, c)).join("");
    const diffs = bad
      .slice(1)
      .map((c, i) => `|${bad[i]}-${c}| = ${Math.abs((bad[i] as number) - c)}`)
      .join(" · ");
    const far: string[][] = [];
    for (let a = 0; a < n; a++) {
      for (let b = a + 2; b < n; b++) {
        const x = bad[a] as number;
        const y = bad[b] as number;
        if (Math.abs(x - y) === b - a) {
          far.push([
            `${cell(a, x)} · ${cell(b, y)}`,
            `행 차이 ${b - a} · 열 차이 ${Math.abs(x - y)}`,
            `같은 ${y > x ? "\\" : "/"} 대각선`,
          ]);
        }
      }
    }
    return [
      `n = ${n} 에서 앞 행만 보는 규칙이 받아들인 배치 ${q}`,
      lines(
        [["이웃한 행의 열 차이", diffs, "전부 1 이 아니라 통과"], ...far],
        "  ",
      ),
      `  └ 두 행 이상 떨어진 두 퀸 ${far.length} 쌍을 못 보고 이 배치를 답으로 센다`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 대각선을 바로 앞 행과만 검사하면 어디서부터 답이 달라지는가. */
  "prev-row-only": () =>
    table(
      ["n", "바른 답", "앞 행만 검사"],
      [4, 5, 6, 8].map((n) => [
        String(n),
        comma(nQueens(n)),
        comma(앞행만(n).length),
      ]),
    ),

  /** `deep.build` 낯선 개념 (c) — 칸 하나의 번호에서 같은 대각선의 칸까지. */
  "build-diag-read": () => {
    const n = WALK_N;
    const [r, c] = ATTACK_AT;
    const d1 = d1Of(n, r, c);
    const d2 = d2Of(r, c);
    const same = (f: (x: number, y: number) => number, v: number) => {
      const out: string[] = [];
      for (let x = 0; x < n; x++)
        for (let y = 0; y < n; y++) if (f(x, y) === v) out.push(cell(x, y));
      return out.join(" ");
    };
    return md(
      ["방향", `칸 ${cell(r, c)} 의 번호`, "번호가 같은 칸"],
      [
        [
          "`\\` 대각선",
          `d1 = ${r} − ${c} + ${n - 1} = ${d1}`,
          same((x, y) => d1Of(n, x, y), d1),
        ],
        ["`/` 대각선", `d2 = ${r} + ${c} = ${d2}`, same(d2Of, d2)],
      ],
    );
  },

  /** `deep.build` 낯선 개념 (d) — 번호마다 칸 수. */
  "build-diag-lines": () => {
    const n = WALK_N;
    const w = 2 * n - 1;
    const cnt1 = new Array<number>(w).fill(0);
    const cnt2 = new Array<number>(w).fill(0);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const a = d1Of(n, r, c);
        const b = d2Of(r, c);
        cnt1[a] = (cnt1[a] as number) + 1;
        cnt2[b] = (cnt2[b] as number) + 1;
      }
    }
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    return [
      md(
        ["번호", "d1 이 이 번호인 칸", "d2 가 이 번호인 칸"],
        cnt1.map((x, k) => [String(k), String(x), String(cnt2[k])]),
        [0, 1, 2],
      ),
      "",
      `n = ${n} 에서 번호는 방향마다 ${w} 가지이고, 칸 수를 더하면 방향마다 ${sum(cnt1)} 칸입니다.`,
    ].join("\n");
  },

  /** `deep.build` 낯선 개념 (d) — 이웃한 칸으로 옮길 때 번호가 어떻게 바뀌는가. */
  "build-diag-moves": () => {
    const n = WALK_N;
    const moves: [string, number, number][] = [
      ["한 행 아래 (row + 1, c)", 1, 0],
      ["한 열 오른쪽 (row, c + 1)", 0, 1],
    ];
    const rows = moves.map(([name, dr, dc]) => {
      const a = new Set<number>();
      const b = new Set<number>();
      let seen = 0;
      for (let r = 0; r + dr < n; r++) {
        for (let c = 0; c + dc < n; c++) {
          a.add(d1Of(n, r + dr, c + dc) - d1Of(n, r, c));
          b.add(d2Of(r + dr, c + dc) - d2Of(r, c));
          seen++;
        }
      }
      if (a.size !== 1 || b.size !== 1)
        throw new Error("이웃한 칸의 번호 차이가 칸마다 다르다");
      const sign = (x: number) => (x > 0 ? `+${x}` : `−${-x}`);
      return [
        name,
        sign([...a][0] as number),
        sign([...b][0] as number),
        String(seen),
      ];
    });
    return md(
      ["옮기는 방향", "d1 의 변화", "d2 의 변화", "확인한 칸"],
      rows,
      [1, 2, 3],
    );
  },

  /** `deep.build` 낯선 개념 (e) — 퀸끼리 하나씩 대조하는 모양과 번호를 확인하는 모양. */
  "build-diag-vs-pair": () => {
    const n = 6;
    const r = 바로검사(n);
    let pairs = 0;
    let wrong = 0;
    for (let a = 0; a < n * n; a++) {
      for (let b = a + 1; b < n * n; b++) {
        const r1 = Math.floor(a / n);
        const c1 = a % n;
        const r2 = Math.floor(b / n);
        const c2 = b % n;
        pairs++;
        const byDef = Math.abs(r1 - r2) === Math.abs(c1 - c2);
        const byNum =
          d1Of(n, r1, c1) === d1Of(n, r2, c2) || d2Of(r1, c1) === d2Of(r2, c2);
        if (byDef !== byNum) wrong++;
      }
    }
    return [
      md(
        ["대각선을 판정하는 모양", `n = ${n} 에서 대각선을 확인한 횟수`],
        [
          ["놓인 퀸과 하나씩 행 차이 · 열 차이 비교", comma(r.비교)],
          ["대각선 번호 비트 두 개 읽기", comma(r.번호읽기)],
        ],
        [1],
      ),
      "",
      `두 모양은 같은 부분 배치 ${comma(r.노드)} 개를 만들었고 후보마다 판정이 하나도 갈리지 않았습니다. ${n} × ${n} 판의 칸 쌍 ${comma(pairs)} 개에서 「번호가 같다」와 「행 차이 = 열 차이」를 대조했고, 어긋난 쌍은 ${wrong} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 1단계 — 건너뛰기를 뺀 코드가 센 배치의 수. */
  "build-rows": () =>
    md(
      ["n", "건너뛰기를 뺀 코드의 count", "n^n", "바른 답"],
      [1, 2, 3, 4].map((n) => [
        String(n),
        comma(판정없음.nQueens(n)),
        comma(n ** n),
        comma(nQueens(n)),
      ]),
      [0, 1, 2, 3],
    ),

  /** `deep.build` 2단계 — 세 정수의 자리 수와, 실행에서 실제로 켜진 가장 큰 자리. */
  "build-bits": () => {
    const rows = [4, 8, TOP].map((n) => {
      const t = trace(n);
      let top = 0;
      for (const c of t.calls)
        top = Math.max(top, ...on(c.diag1), ...on(c.diag2), ...on(c.cols));
      return [String(n), String(n), String(2 * n - 1), String(top)];
    });
    const last = rows.at(-1) as string[];
    return [
      md(
        [
          "n",
          "cols 의 자리 수",
          "diag1 · diag2 의 자리 수",
          "실행에서 켜진 가장 큰 자리",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `n = ${last[0]} 에서도 가장 큰 자리가 ${last[3]} 번이라 32 비트 정수 하나에 들어갑니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 퀸 하나를 놓기 전과 뒤의 세 정수. */
  "build-set": () => {
    const n = WALK_N;
    const root = callAt(1);
    const first = callWith([[0, 0]]);
    const p = first.placed as NonNullable<Call["placed"]>;
    const deep = walk().calls.find((c) => c.queens.length === 3) as Call;
    const placedCols = deep.queens
      .map(([, c]) => c)
      .sort((a, b) => a - b)
      .join(", ");
    return [
      `${cell(p.r, p.c)} 을 놓는다 (n = ${n})   d1 = ${p.r} - ${p.c} + ${n - 1} = ${p.d1} · d2 = ${p.r} + ${p.c} = ${p.d2}`,
      lines(
        [
          ["놓기 전", masks(root)],
          ["놓은 뒤", masks(first)],
        ],
        "  ",
      ),
      "",
      `퀸 셋 ${queensText(deep.queens)} 을 놓은 뒤의 cols`,
      lines(
        [
          [
            `0b${deep.cols.toString(2).padStart(n, "0")} = ${deep.cols}`,
            `켜진 자리 ${set(deep.cols)} = 놓인 열 {${placedCols}}`,
          ],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** `deep.build` 3단계 — 퀸 하나가 놓인 판에서 다음 행의 열마다 판정. */
  "build-judge": () => {
    const c = callWith([[0, 0]]);
    return md(
      ["열 c", "d1", "d2", "켜져 있던 비트", "판정"],
      c.tries.map((x) => [
        String(x.c),
        String(x.d1),
        String(x.d2),
        x.verdict === "place"
          ? "없음"
          : x.verdict === "cols"
            ? `cols 의 ${x.c} 번`
            : x.verdict === "diag1"
              ? `diag1 의 ${x.d1} 번`
              : `diag2 의 ${x.d2} 번`,
        x.verdict === "place" ? "놓는다" : "건너뛴다",
      ]),
      [0, 1, 2],
    );
  },

  /** `deep.build` 4단계 — 내려갔다 돌아온 자리의 세 정수. */
  "build-undo": () => {
    const t = walk();
    const at1 = callWith([[0, 0]]);
    const down = callWith([
      [0, 0],
      [1, 2],
    ]);
    const next = callWith([
      [0, 0],
      [1, 3],
    ]);
    const u = t.undos.find((x) => x.row === 1 && x.c === 2);
    if (!u) throw new Error("(1,2) 를 되돌린 기록이 없다");
    const same =
      u.cols === at1.cols && u.diag1 === at1.diag1 && u.diag2 === at1.diag2;
    const row = (
      name: string,
      m: { cols: number; diag1: number; diag2: number },
    ) => [name, set(m.cols), set(m.diag1), set(m.diag2)];
    return [
      md(
        ["시점", "cols", "diag1", "diag2"],
        [
          row("행 1 에 들어올 때", at1),
          row("(1,2) 를 놓고 행 2 로 내려갈 때", down),
          row("돌아와 세 비트를 끈 뒤", u),
          row("(1,3) 을 놓고 행 2 로 내려갈 때", next),
        ],
      ),
      "",
      `돌아와 끈 뒤의 세 정수는 행 1 에 들어올 때와 ${same ? "같습니다" : "다릅니다"}. n = ${WALK_N} 에서 되돌린 ${t.undos.length} 번 모두 그 호출에 들어올 때의 세 정수로 돌아갔습니다.`,
    ].join("\n");
  },

  /** `deep.build` 설계 선택 — 검사 시점을 네 가지로 놓고 같은 `n` 에서 부분 배치 수를 센다. */
  "check-timing": () => {
    const n = 8;
    const base = k행마다(n, 1).노드;
    const rows = [1, 2, 4, 8].map((k) => {
      const r = k행마다(n, k);
      return [
        `${k} 행마다`,
        comma(r.해),
        comma(r.노드),
        `${(r.노드 / base).toFixed(1)}배`,
      ];
    });
    return table(["검사 시점", "답", "만든 부분 배치", "1 행마다 대비"], rows);
  },

  /** `deep.build` 설계 선택 — 대각선 가지치기가 나무를 얼마나 깎는지 값으로 낸다. */
  "tree-size": () => {
    const rows = [4, 6, 8, 10].map((n) => {
      const p = 가지치기(n);
      const c = 열만검사(n).노드;
      return [
        String(n),
        comma(p.해),
        comma(p.노드),
        comma(c),
        `${(c / p.노드).toFixed(1)}배`,
      ];
    });
    return table(["n", "해", "가지치기", "열만 검사", "깎인 비율"], rows);
  },

  /** `deep.walk` 도입 — 끝까지 쓸 입력과 기대값. */
  "walk-input": () =>
    [
      `const n = ${WALK_N};`,
      `// 이 절이 끝나면 ${nQueens(WALK_N)} 가 나와야 한다`,
    ].join("\n"),

  /** `deep.walk.step` 1 — 판정 없는 골격만 실행한 결과. */
  "walk-skeleton": () => {
    const n = 2;
    const got = 골격(n);
    const clash = got.filter((p) => firstClash(p) !== null).length;
    return [
      `n = ${n} 에서 판정 없이 끝까지 간 목록`,
      lines(
        got.map((p, i) => [`[${p.join(" ")}]`, `count = ${i + 1}`]),
        "  ",
      ),
      `  └ 바른 답은 ${nQueens(n)} 이다. 목록 ${got.length} 개 중 ${clash} 개가 같은 열이나 대각선을 쓴다`,
    ].join("\n");
  },

  /** `deep.walk.step` 2 — 퀸 하나가 놓인 판에서 행 1 의 열 넷을 판정한다. */
  "walk-judge": () => {
    const call = callWith([[0, 0]]);
    const n = WALK_N;
    return [
      `${masks(call)}   (행 0 의 열 0 이 켜 둔 비트)`,
      "",
      lines(
        call.tries.map((x) => [
          `c=${x.c}`,
          `d1 = ${call.row}-${x.c}+${n - 1} = ${x.d1} · d2 = ${call.row}+${x.c} = ${x.d2}`,
          x.verdict === "place"
            ? "셋 다 0"
            : x.verdict === "cols"
              ? `cols 의 ${x.c} 번 비트가 1`
              : x.verdict === "diag1"
                ? `diag1 의 ${x.d1} 번 비트가 1`
                : `diag2 의 ${x.d2} 번 비트가 1`,
          x.verdict === "place"
            ? "→ 놓을 수 있다"
            : `→ ② ${VERDICT_TEXT[x.verdict]} 충돌`,
        ]),
        "  ",
      ),
    ].join("\n");
  },

  /** `deep.walk.pause` — 두 대각선을 정수 하나에 합치면 없는 충돌이 생겨 답이 0 이 된다. */
  "merged-diag": () =>
    table(
      ["n", "바른 답", "대각선을 합친 코드"],
      [1, 4, 5, 6, 7, 8].map((n) => [
        String(n),
        comma(nQueens(n)),
        comma(대각선합침(n)),
      ]),
    ),

  /** `deep.walk.pause` — 진짜 답 하나를 합친 정수로 판정하면 어디서 막히는가. */
  "merged-case": () => {
    const n = WALK_N;
    const sol = solutions(n)[0] as Queens;
    let diag = 0;
    const who = new Map<number, { at: string; dir: "\\" | "/" }>();
    const out: string[][] = [];
    let stop = "";
    for (const [r, c] of sol) {
      const d1 = d1Of(n, r, c);
      const d2 = d2Of(r, c);
      const hit =
        ((diag >> d1) & 1) === 1 ? d1 : ((diag >> d2) & 1) === 1 ? d2 : -1;
      if (hit >= 0) {
        const mine = hit === d1 ? "\\" : "/";
        out.push([
          cell(r, c),
          hit === d1
            ? `d1 = ${r}-${c}+${n - 1} = ${d1}`
            : `d2 = ${r}+${c} = ${d2}`,
          `${hit} 번 비트가 이미 1 → 충돌로 판정한다`,
        ]);
        const w = who.get(hit) as { at: string; dir: "\\" | "/" };
        stop = `${w.at} 이 켠 ${hit} 번은 「${w.dir} 대각선 ${hit}」이고 ${cell(r, c)} 이 보는 ${hit} 번은 「${mine} 대각선 ${hit}」이다`;
        break;
      }
      out.push([
        cell(r, c),
        `d1 = ${r}-${c}+${n - 1} = ${d1} · d2 = ${r}+${c} = ${d2}`,
        `diag 의 ${d1} 번과 ${d2} 번 비트를 켠다`,
      ]);
      diag |= (1 << d1) | (1 << d2);
      who.set(d1, { at: cell(r, c), dir: "\\" });
      who.set(d2, { at: cell(r, c), dir: "/" });
    }
    return [
      `n = ${n} 의 답 ${queensText(sol)} 를 합친 정수로 판정하면`,
      "",
      lines(out, "  "),
      "",
      `  ${stop}`,
      "       └ 서로 다른 대각선이 같은 비트를 나눠 써서 없는 충돌이 생겼다",
    ].join("\n");
  },

  /** `deep.walk.step` 3 — 되돌린 경우와 되돌리지 않은 경우, 돌아온 직후의 세 정수. */
  "walk-undo": () => {
    const t = walk();
    const n = WALK_N;
    const child = callWith([
      [0, 0],
      [1, 2],
    ]);
    if (child.children.length !== 0)
      throw new Error("(1,2) 아래에 자식이 있다");
    const u = t.undos.find((x) => x.row === 1 && x.c === 2);
    if (!u) throw new Error("(1,2) 를 되돌린 기록이 없다");
    // 끄지 않으면 (1,2) 의 비트가 남은 채로 (1,3) 을 놓고 행 2 로 내려간다.
    const next = callWith([
      [0, 0],
      [1, 3],
    ]);
    const left = {
      row: next.row,
      cols: next.cols | child.cols,
      diag1: next.diag1 | child.diag1,
      diag2: next.diag2 | child.diag2,
    };
    const lost = next.tries
      .filter((x) => x.verdict === "place")
      .filter((x) => {
        const d1 = d1Of(n, left.row, x.c);
        const d2 = d2Of(left.row, x.c);
        return (
          ((left.cols >> x.c) & 1) === 1 ||
          ((left.diag1 >> d1) & 1) === 1 ||
          ((left.diag2 >> d2) & 1) === 1
        );
      });
    return [
      `행 1 에서 (1,2) 를 놓았다가 돌아온 직후 (n = ${n})`,
      lines(
        [
          ["끄는 코드", masks(u)],
          ["끄지 않으면", masks(child)],
        ],
        "  ",
      ),
      "",
      "끄지 않은 채 (1,3) 을 놓고 행 2 로 내려가면",
      lines(
        lost.map((x) => [
          cell(left.row, x.c),
          "끄는 코드에서는 놓을 수 있다",
          "끄지 않으면 (1,2) 가 남긴 비트에 막힌다",
        ]),
        "  ",
      ),
    ].join("\n");
  },

  /** `deep.walk.step` 4 — 호출마다 열 넷의 판정. 걸음 번호가 무대와 같다. */
  "walk-trace": () =>
    md(
      ["단계", "호출", "이미 놓인 것", "열마다 판정"],
      walk().calls.map((c) => [
        T(c),
        `\`place(${c.row})\``,
        queensText(c.queens),
        c.row === WALK_N
          ? `루프에 들어가지 않는다 — ① \`count = ${countUpTo(c)}\``
          : c.tries.map(verdictCell).join(" · "),
      ]),
    ),

  /** `deep.walk.step` 4 — 세 갈래가 몇 번씩 실행됐는가. */
  "walk-branches": () => {
    const t = walk();
    const leaves = t.calls.filter((c) => c.row === t.n);
    const tries = t.calls.flatMap((c) => c.tries);
    const place = tries.filter((x) => x.verdict === "place").length;
    const skip = tries.length - place;
    const placeAt = t.calls
      .filter((c) => c.children.length > 0)
      .map((c) => `${T(c)} ${c.children.length}`)
      .join(" · ");
    return [
      lines([
        ["①", "다 채웠다", leaves.map(T).join(" · "), `${leaves.length} 번`],
        ["③", "놓는다", placeAt, `${place} 번`],
        ["②", "충돌이다", "나머지 열 시도", `${skip} 번`],
      ]),
      "",
      `열 시도 ${tries.length} 번 = ${t.n} × (호출 ${t.calls.length} − 잎 ${leaves.length})`,
      `켠 비트를 다시 끈 횟수 ${t.undos.length} = ③ 의 수 ${place} = 호출 ${t.calls.length} − 1`,
    ].join("\n");
  },

  /** `deep.walk.pause` — `d1` 의 오프셋을 뺀 사본. 이 규모에서는 답이 그대로다. */
  "mutant-offset": () =>
    table(
      ["n", "바른 코드", "오프셋을 뺀 코드"],
      오프셋표.map((r) => [r.n, r.바른, r.변이]),
    ),

  /** `deep.walk.pause` — 오프셋을 빼도 답이 그대로인 이유는 비트 자리가 안 겹쳐서다. */
  "offset-bits": () => {
    const rows = [12, 16, 17].map((n) => {
      const 음수쪽 = 비트자리(-(n - 1));
      const 양수쪽 = 비트자리(n - 1);
      return [
        String(n),
        `-${n - 1} … ${n - 1}`,
        `${음수쪽}…31, 0…${양수쪽}`,
        음수쪽 > 양수쪽 ? "안 겹친다" : `${음수쪽} 번 자리가 겹친다`,
      ];
    });
    return table(["n", "d1 의 범위", "비트 자리", ""], rows);
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": () =>
    [1, 2, 3, 4, 5, 6, 7, 8]
      .map(
        (n) =>
          `nQueens(${padL(String(n), 2)})  →  ${padL(String(nQueens(n)), 2)}`,
      )
      .join("\n"),

  /** `purpose.alt` — 전개 입력 `n = 4` 에서 두 설계를 세면 차이가 몇 개에 그친다. */
  "alt-small": () => {
    const a = 가이드절차(WALK_N);
    const b = 앞을내다보는검사(WALK_N);
    return md(
      ["설계", `n = ${WALK_N} 방문 노드`, `n = ${WALK_N} 상태 연산`],
      [
        ["이 가이드의 절차", comma(a["방문 노드"]), comma(a["상태 연산"])],
        ["앞을 내다보는 검사", comma(b["방문 노드"]), comma(b["상태 연산"])],
      ],
      [1, 2],
    );
  },

  /** `deep.math` ① — `n = 4` 의 깊이별 부분 배치 수를 세고 정의와 맞댄다. */
  "math-depths": () => {
    const n = WALK_N;
    const { 깊이, 노드 } = 열만검사(n);
    const f = (k: number) => Number(factorial(n) / factorial(n - k));
    const rows = 깊이.map((v, k) => {
      if (v !== f(k)) throw new Error(`깊이 ${k} 의 수가 정의와 다르다`);
      return [
        `깊이 ${k}`,
        `${v} 개`,
        `${n}!/${n - k}! = ${f(k)}${k === 0 ? "   (빈 판)" : ""}`,
      ];
    });
    return [
      `n = ${n} 의 깊이별 부분 배치 수 (열만 검사)`,
      "",
      lines(rows, "  "),
      `            └ 합 ${노드}`,
    ].join("\n");
  },

  /** `deep.math` ② — 닫힌 형태가 실제 나무 크기와 같은지 검산한다. */
  "closed-form": () => {
    const rows = [1, 2, 3, 4, 6, 8, 10].map((n) => {
      const 잰값 = 열만검사(n).노드;
      const 식값 = e계승(n);
      return [
        String(n),
        num(factorial(n)),
        comma(잰값),
        comma(식값),
        잰값 === 식값 ? "같다" : "다르다",
      ];
    });
    return table(["n", "n!", "실제 노드", "Σ n!/k!", ""], rows);
  },

  /** `deep.math` ② — 식을 그대로 옮긴 코드와 그 실행값. */
  "math-code": () => {
    const 노드수 = (n: number): number => {
      let 합 = 0;
      let 항 = 1;
      for (let k = n; k >= 0; k--) {
        합 += 항;
        항 *= k === 0 ? 1 : k;
      }
      return 합;
    };
    if (노드수(8) !== 열만검사(8).노드)
      throw new Error("식 코드가 실제 노드 수와 다르다");
    return [
      "const 노드수 = (n: number): number => {",
      "  let 합 = 0;",
      "  let 항 = 1; // n!/n! = 1 에서 시작한다",
      "  for (let k = n; k >= 0; k--) {",
      "    합 += 항;",
      "    항 *= k === 0 ? 1 : k; // n!/k! 에서 n!/(k-1)! 로 간다",
      "  }",
      "  return 합;",
      "};",
      "",
      `노드수(8); // → ${노드수(8)}`,
    ].join("\n");
  },

  /** `deep.math` ③ — 같은 항을 반대 순서로 더한 두 합. */
  "math-reorder": () => {
    const n = WALK_N;
    const ks = Array.from({ length: n + 1 }, (_, k) => k);
    const a = ks.map((k) => Number(factorial(n) / factorial(n - k)));
    const b = ks.map((k) => Number(factorial(n) / factorial(k)));
    const s = (xs: number[]) => xs.reduce((x, y) => x + y, 0);
    return [
      `n = ${n} 로 확인하면 같은 항을 반대 순서로 더한 것이다`,
      lines(
        [
          [`Σ ${n}!/(${n}-k)!`, `k = 0 … ${n}`, `${a.join(" + ")} = ${s(a)}`],
          [`Σ ${n}!/j!`, `j = 0 … ${n}`, `${b.join(" + ")} = ${s(b)}`],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** `deep.math` ③ — 닫힌 형태를 `n = 4` 로 검산한다. */
  "math-e4": () => {
    const n = WALK_N;
    const f = Number(factorial(n));
    const v = Math.E * f;
    return [
      `n = ${n} 로 검산하면`,
      lines(
        [
          [
            `e · ${n}!`,
            `${Math.E.toFixed(5)}… × ${f} = ${v.toFixed(4)}…`,
            `정수 부분 ${Math.floor(v)}`,
          ],
          ["실제 노드 수", "", String(열만검사(n).노드)],
        ],
        "  ",
      ),
    ].join("\n");
  },

  /** `deep.math` ④ — 과제 규모의 상단 `n = 12` 에 두 값을 넣는다. */
  "n12-gap": () => {
    const p = 가지치기(TOP);
    const 상한 = e계승(TOP);
    return table(
      ["", "노드 수"],
      [
        [`대각선 가지치기가 없을 때 (Σ ${TOP}!/k!)`, comma(상한)],
        ["실제 방문 노드", comma(p.노드)],
        ["차이", `${(상한 / p.노드).toFixed(0)}배`],
      ],
    );
  },

  /** `invariant` ② — 한 시점의 세 정수가 놓인 퀸들과 같은지, 그리고 모든 호출에서 같은지. */
  "invariant-state": () => {
    const n = WALK_N;
    const c = callWith([
      [0, 1],
      [1, 3],
    ]);
    const qs = c.queens;
    const d1s = qs.map(
      ([r, x]) => `${cell(r, x)} → ${r}-${x}+${n - 1} = ${d1Of(n, r, x)}`,
    );
    const d2s = qs.map(([r, x]) => `${cell(r, x)} → ${r}+${x} = ${d2Of(r, x)}`);
    const placed = qs
      .map(([, x]) => x)
      .sort((a, b) => a - b)
      .join(", ");
    return [
      `place(${c.row}) 에 들어오는 시점 (n = ${n}, ${queensText(qs)} 을 놓은 상태)`,
      lines(
        [
          ["cols", set(c.cols), `놓인 열 {${placed}}`],
          ["diag1", set(c.diag1), d1s.join(" · ")],
          ["diag2", set(c.diag2), d2s.join(" · ")],
        ],
        "  ",
      ),
      `  두 퀸 — 열 · d1 · d2 가 ${firstClash(qs.map(([, x]) => x)) === null ? "모두 다르다" : "겹친다"}`,
    ].join("\n");
  },

  /** `invariant` ② — 모든 호출에서 세 정수를 놓인 퀸에서 다시 계산해 대조한다. */
  "invariant-all": () =>
    md(
      [
        "n",
        "대조한 호출",
        "세 정수가 어긋난 호출",
        "서로 공격하는 퀸이 있던 호출",
      ],
      [4, 5, 6, 7, 8].map((m) => {
        let checked = 0;
        let bad = 0;
        let clash = 0;
        for (const call of trace(m).calls) {
          checked++;
          const cols = call.queens.reduce((a, [, x]) => a | (1 << x), 0);
          const d1 = call.queens.reduce(
            (a, [r, x]) => a | (1 << d1Of(m, r, x)),
            0,
          );
          const d2 = call.queens.reduce(
            (a, [r, x]) => a | (1 << d2Of(r, x)),
            0,
          );
          if (cols !== call.cols || d1 !== call.diag1 || d2 !== call.diag2)
            bad++;
          if (firstClash(call.queens.map(([, x]) => x)) !== null) clash++;
        }
        return [String(m), comma(checked), String(bad), String(clash)];
      }),
      [0, 1, 2, 3],
    ),

  /** `invariant` ② — 경계의 입력. */
  "invariant-edges": () =>
    md(
      [
        "입력",
        "만든 부분 배치",
        "가장 깊이 채운 행 수",
        "켜진 가장 큰 대각선 자리",
        "결과",
      ],
      [1, 2, 3, TOP].map((n) => {
        const t = trace(n);
        let deepest = 0;
        let top = 0;
        for (const c of t.calls) {
          deepest = Math.max(deepest, c.queens.length);
          top = Math.max(top, ...on(c.diag1), ...on(c.diag2));
        }
        return [
          `n = ${n}`,
          comma(t.calls.length),
          String(deepest),
          String(top),
          comma(t.count),
        ];
      }),
      [1, 2, 3, 4],
    ),

  /**
   * `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 옛 이해 시험 `V5` 가 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만
   * 달라도 잡는다.
   */
  "mutant-restore": () =>
    table(
      ["n", "바른 코드", "되돌리기를 뺀 코드"],
      변이표.map((r) => [r.n, r.바른, r.깨진]),
    ),

  /** `invariant` ③ — `cols` 되돌리기를 뺀 코드가 돌아온 자리에 남긴 것. */
  "invariant-mutant-case": () => {
    const good = walk().undos;
    const bad = traceNoColsUndo(WALK_N).undos;
    const pick = (xs: typeof good, c: number) => {
      const hit = xs.find((x) => x.row === 0 && x.c === c);
      if (!hit) throw new Error(`행 0 의 c=${c} 를 되돌린 기록이 없다`);
      return hit;
    };
    const g0 = pick(good, 0);
    const b0 = pick(bad, 0);
    const pass = callWith([[0, 1]]);
    const b1 = pick(bad, 1);
    return [
      "행 0 에서 c=0 을 시도하고 돌아온 직후의 cols",
      lines(
        [
          ["바른 코드", set(g0.cols)],
          ["cols 되돌리기를 뺀 코드", set(b0.cols)],
        ],
        "  ",
      ),
      "",
      "이어서 c=1 에 놓고 place(1) 에 넘기는 cols",
      lines(
        [
          ["바른 코드", set(pass.cols)],
          ["cols 되돌리기를 뺀 코드", set(b1.cols)],
        ],
        "  ",
      ),
      `  └ 놓인 퀸은 (0,1) 하나인데 뺀 코드의 cols 에는 ${on(b1.cols).length} 자리가 켜져 있다`,
    ].join("\n");
  },

  /** `perf.derive` — 전개의 세 호출이 열을 몇 번 시도했는가. */
  "perf-tries": () => {
    const t = walk();
    const pick = [
      callAt(1),
      callWith([
        [0, 0],
        [1, 2],
      ]),
      t.calls.find((c) => c.row === t.n) as Call,
    ];
    return [
      lines(
        pick.map((c) => {
          const place = c.tries.filter((x) => x.verdict === "place").length;
          return c.row === t.n
            ? [T(c), "열 시도 0 번", "", "잎이다"]
            : [
                T(c),
                `열 시도 ${c.tries.length} 번`,
                `③ ${place} 번 · ② ${c.tries.length - place} 번`,
                `자식 ${c.children.length}`,
              ];
        }),
      ),
      "     └ 잎이 아닌 호출은 예외 없이 정확히 n 번 시도한다",
    ].join("\n");
  },

  /** `perf.derive` — 열 시도의 총합을 세고, `n × (노드 − 해)` 와 맞댄다. */
  "perf-total": () =>
    lines(
      [4, 8, TOP].map((n) => {
        const p = 가지치기(n);
        const f = n * (p.노드 - p.해);
        if (f !== p.시도) throw new Error(`n = ${n} 의 열 시도가 식과 다르다`);
        return [
          `n = ${n}`,
          `${n} × (${comma(p.노드)} - ${comma(p.해)})`,
          `= ${n} × ${comma(p.노드 - p.해)}`,
          `= ${comma(p.시도)}`,
        ];
      }),
    ),

  /** `perf.derive` — 총 연산을 식으로 내고, 경쟁 설계 절의 실측과 맞댄다. */
  "perf-ops": () => {
    const n = ALT_N;
    const p = 가지치기(n);
    const a = 3 * p.시도;
    const b = 3 * (p.노드 - 1);
    const measured = bench["이 가이드의 절차 · 상태 연산"];
    return [
      "총 연산 = 3 × (열 시도) + 3 × (노드 수 - 1)",
      "",
      `n = ${n}    3 × ${comma(p.시도)} + 3 × (${comma(p.노드)} - 1) = ${comma(a)} + ${comma(b)} = ${comma(a + b)}`,
      `         └ 「경쟁 설계와의 대조」 가 실측으로 낸 ${comma(measured)}${과와(comma(measured))} ${a + b === measured ? "같은 값이다" : "다른 값이다"}`,
    ].join("\n");
  },

  /** `perf.bounds` — 실측 노드 수와 그 성장률. 상한 `n!` 의 성장률과 나란히 놓는다. */
  growth: () => {
    let 앞 = 0;
    const rows: string[][] = [];
    for (let n = 4; n <= TOP; n++) {
      const v = 가지치기(n).노드;
      rows.push([
        String(n),
        comma(v),
        앞 === 0 ? "—" : (v / 앞).toFixed(2),
        `${n}.00`,
      ]);
      앞 = v;
    }
    return table(["n", "방문 노드", "직전 대비", "n! 이었다면"], rows);
  },

  /** `perf.worst` — 규모의 상단을 넣고 실제로 센다. */
  "perf-worst": () => {
    const n = TOP;
    const p = 가지치기(n);
    const ops = 3 * p.시도 + 3 * (p.노드 - 1);
    return [
      `n = ${n}`,
      lines(
        [
          ["방문 노드", comma(p.노드)],
          [
            "열 시도",
            `${comma(p.시도)} = ${n} × (${comma(p.노드)} - ${comma(p.해)})`,
          ],
          [
            "총 연산",
            `${comma(ops)} = 3 × ${comma(p.시도)} + 3 × ${comma(p.노드 - 1)}`,
          ],
        ],
        "  ",
      ),
      `       └ 초당 1 억 번 기준으로 ${duration(BigInt(ops))}. 1 초 안이다`,
    ].join("\n");
  },

  /** `perf.worst` — 같은 절차에서 대각선 제약만 없앤 판(룩)과 나란히. */
  "perf-rook": () => {
    const n = TOP;
    const q = 가지치기(n).노드;
    const r = e계승(n);
    return [
      "같은 절차, 판의 규칙만 다르게",
      lines(
        [
          ["퀸 (대각선 제약 있음)", `n = ${n}`, `${comma(q)} 노드`],
          ["룩 (대각선 제약 없음)", `n = ${n}`, `${comma(r)} 노드 = ⌊e·${n}!⌋`],
        ],
        "  ",
      ),
      `       └ 상한은 룩 쪽에서 타이트하고, 퀸 쪽에서는 ${(r / q).toFixed(0)}배 헐겁다`,
    ].join("\n");
  },

  /** `selfcheck` — 전개 T2 의 `c=1` 이 보는 두 대각선 번호. */
  "selfcheck-t2": () => {
    const call = callWith([[0, 0]]);
    const n = WALK_N;
    const x = call.tries[1] as Call["tries"][number];
    const d1on = ((call.diag1 >> x.d1) & 1) === 1;
    const d2on = ((call.diag2 >> x.d2) & 1) === 1;
    return [
      `${T(call)}  행 ${call.row}, c=${x.c} 의 두 대각선 번호 — ${masks(call)}`,
      lines(
        [
          [
            `d1 = ${call.row} - ${x.c} + ${n - 1} = ${x.d1}`,
            `diag1 의 ${x.d1} 번 비트`,
            d1on ? "1 → 충돌" : "0 → 통과",
          ],
          [
            `d2 = ${call.row} + ${x.c} = ${x.d2}`,
            `diag2 의 ${x.d2} 번 비트`,
            d2on ? "1 → 충돌" : "0 → 통과",
          ],
        ],
        "  ",
      ),
    ].join("\n");
  },
};
