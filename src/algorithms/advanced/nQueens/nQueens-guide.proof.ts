/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts nQueens-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { nQueens } from "./nQueens-guide.ref.ts";

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

/** `1302061345` → `1,302,061,345`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
const comma = (n: number): string =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** 열 폭을 내용에서 잰 뒤 표를 만든다. 첫 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
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

/* ────────────────────────── 계측판 ────────────────────────── */

/** 정본과 같은 절차. 방문 노드와 열 후보 검사 횟수만 덧붙여 센다. */
function 가지치기(n: number): { 노드: number; 해: number } {
  let 노드 = 0;
  let 해 = 0;
  const go = (row: number, cols: number, d1m: number, d2m: number): void => {
    노드++;
    if (row === n) {
      해++;
      return;
    }
    for (let c = 0; c < n; c++) {
      const d1 = row - c + (n - 1);
      const d2 = row + c;
      if (
        ((cols >> c) & 1) === 1 ||
        ((d1m >> d1) & 1) === 1 ||
        ((d2m >> d2) & 1) === 1
      ) {
        continue;
      }
      go(row + 1, cols | (1 << c), d1m | (1 << d1), d2m | (1 << d2));
    }
  };
  go(0, 0, 0, 0);
  return { 노드, 해 };
}

/** 대각선 검사를 빼고 열만 검사한다 — 가지치기가 열 하나만 남았을 때의 나무. */
function 열만검사(n: number): number {
  let 노드 = 0;
  const go = (row: number, cols: number): void => {
    노드++;
    if (row === n) return;
    for (let c = 0; c < n; c++) {
      if (((cols >> c) & 1) === 1) continue;
      go(row + 1, cols | (1 << c));
    }
  };
  go(0, 0);
  return 노드;
}

/** (가) 순열을 끝까지 만든 다음 대각선을 검사한다. */
function 늦게검사(n: number): { 노드: number; 비교: number } {
  let 노드 = 0;
  let 비교 = 0;
  const p: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const go = (row: number): void => {
    노드++;
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
  return { 노드, 비교 };
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

/** 대각선을 **바로 앞 행**의 퀸과만 검사한다. 열은 그대로 전부 검사한다. */
function 앞행만(n: number): { 답: number } {
  let 답 = 0;
  const p: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const go = (row: number): void => {
    if (row === n) {
      답++;
      return;
    }
    for (let c = 0; c < n; c++) {
      if (used[c]) continue;
      if (row > 0 && Math.abs((p[row - 1] as number) - c) === 1) continue;
      used[c] = true;
      p[row] = c;
      go(row + 1);
      used[c] = false;
    }
  };
  go(0);
  return { 답 };
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

/** (나) 한 행을 채울 때마다 그 자리에서 대각선을 검사한다. */
function 바로검사(n: number): { 노드: number; 비교: number } {
  let 노드 = 0;
  let 비교 = 0;
  const p: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  const go = (row: number): void => {
    노드++;
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
      if (!놓을수있다) continue;
      used[c] = true;
      p[row] = c;
      go(row + 1);
      used[c] = false;
    }
  };
  go(0);
  return { 노드, 비교 };
}

/** `n!` 과 `⌊e·n!⌋ = Σ_{k=0}^{n} n!/k!`. 정수 산술로만 낸다. */
const 계승 = (n: number): number => {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};
const e계승 = (n: number): number => {
  let s = 0;
  let 항 = 1; // n!/n! = 1 부터 거꾸로 올라간다
  for (let k = n; k >= 0; k--) {
    s += 항;
    항 *= k === 0 ? 1 : k;
  }
  return s;
};

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 불변식을 지키던 줄(`cols ^= 1 << c;`) 하나를 지운 사본. **정본 소스에서 기계로 만든다** —
 * 맞는 줄이 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만
 * 바꿨다」가 검사되지 않는다.
 */
const 되돌리기없음 = await loadMutant<{ nQueens(n: number): number }>(
  new URL("./nQueens-guide.ref.ts", import.meta.url).pathname,
  { drop: /^\s*cols \^= 1 << c;\s*$/ },
);

/**
 * 대각선 번호에서 `+ (n - 1)` 오프셋을 뺀 사본. `d1` 이 음수가 되면 자바스크립트의 `<<` 는
 * 자리 수를 32 로 나눈 나머지로 취급해 **다른 비트**를 건드린다 — 실행은 되고 답만 달라진다.
 */
const 오프셋없음 = await loadMutant<{ nQueens(n: number): number }>(
  new URL("./nQueens-guide.ref.ts", import.meta.url).pathname,
  { swap: [/const d1 = row - c \+ \(n - 1\);/, "const d1 = row - c;"] },
);

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

// 하나도 안 달라지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (변이표.every((r) => r.바른 === r.깨진)) {
  throw new Error(
    "되돌리기 변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
  );
}
// **이쪽은 반대다.** 본문이 「이 제약 안에서는 답이 안 달라진다」고 적으므로, 하나라도
// 달라지면 그 문장이 거짓이 된다.
if (오프셋표.some((r) => r.바른 !== r.변이)) {
  throw new Error(
    "오프셋 변이가 제약 안에서 답을 바꿨다 — 「답이 안 달라진다」가 거짓이다",
  );
}

/** `d1` 을 담는 비트 자리. 음수 자리 수는 32 로 나눈 나머지가 된다. */
const 비트자리 = (d1: number): number => ((d1 % 32) + 32) % 32;

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ④ — 같은 `n` 에 두 방식을 걸고 계수를 나란히 적는다. */
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

  /** `deep.build` ⑥ — 검사 시점을 네 가지로 놓고 같은 `n` 에서 부분 배치 수를 센다. */
  "check-timing": () => {
    const n = 8;
    const rows = [1, 2, 4, 8].map((k) => {
      const r = k행마다(n, k);
      return [
        `${k} 행마다`,
        comma(r.해),
        comma(r.노드),
        `${(r.노드 / k행마다(n, 1).노드).toFixed(1)}배`,
      ];
    });
    return table(["검사 시점", "답", "만든 부분 배치", "1 행마다 대비"], rows);
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

  /** `deep.build` ⑤ — 대각선을 바로 앞 행과만 검사하면 어디서부터 답이 달라지는가. */
  "prev-row-only": () =>
    table(
      ["n", "바른 답", "앞 행만 검사"],
      [4, 5, 6, 8].map((n) => [
        String(n),
        comma(nQueens(n)),
        comma(앞행만(n).답),
      ]),
    ),

  /** `deep.walk.pause` — `d1` 의 오프셋을 뺀 사본. 제약 안에서는 답이 그대로다. */
  "mutant-offset": () =>
    table(
      ["n", "바른 코드", "오프셋을 뺀 코드"],
      오프셋표.map((r) => [r.n, r.바른, r.변이]),
    ),

  /** `deep.walk.pause` — 오프셋을 빼도 답이 그대로인 이유는 비트 자리가 안 겹쳐서다. */
  "offset-bits": () => {
    const rows = [12, 16, 17].map((n) => {
      const 음수쪽 = 비트자리(-(n - 1));
      const 양수쪽 = n - 1;
      return [
        String(n),
        `-${n - 1} … ${n - 1}`,
        `${음수쪽}…31, 0…${양수쪽}`,
        음수쪽 > 양수쪽 ? "안 겹친다" : `${음수쪽} 번 자리가 겹친다`,
      ];
    });
    return table(["n", "d1 의 범위", "비트 자리", ""], rows);
  },

  /** `perf.bounds` — 실측 노드 수와 그 성장률. 상한 `n!` 의 성장률과 나란히 놓는다. */
  growth: () => {
    let 앞 = 0;
    const rows: string[][] = [];
    for (let n = 4; n <= 12; n++) {
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

  /** `deep.build` ⑥ — 대각선 가지치기가 나무를 얼마나 깎는지 값으로 낸다. */
  "tree-size": () => {
    const rows = [4, 6, 8, 10].map((n) => {
      const p = 가지치기(n);
      const c = 열만검사(n);
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

  /** `deep.math` ② — 닫힌 형태가 실제 나무 크기와 같은지 검산한다. */
  "closed-form": () => {
    const rows = [1, 2, 3, 4, 6, 8, 10].map((n) => {
      const 잰값 = 열만검사(n);
      const 식값 = e계승(n);
      return [
        String(n),
        comma(계승(n)),
        comma(잰값),
        comma(식값),
        잰값 === 식값 ? "같다" : "다르다",
      ];
    });
    return table(["n", "n!", "실제 노드", "Σ n!/k!", ""], rows);
  },

  /** `deep.math` ④ — 제약 상단 `n = 12` 에 두 값을 넣는다. */
  "n12-gap": () => {
    const p = 가지치기(12);
    const 상한 = e계승(12);
    return table(
      ["", "노드 수"],
      [
        ["대각선 가지치기가 없을 때 (Σ 12!/k!)", comma(상한)],
        ["실제 방문 노드", comma(p.노드)],
        ["차이", `${(상한 / p.노드).toFixed(0)}배`],
      ],
    );
  },

  /** `deep.walk.final` — 전체 코드를 그대로 돌린 값. */
  "final-run": () =>
    [1, 2, 3, 4, 5, 6, 7, 8]
      .map(
        (n) =>
          `nQueens(${padL(String(n), 2)})  →  ${padL(String(nQueens(n)), 2)}`,
      )
      .join("\n"),

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
};
