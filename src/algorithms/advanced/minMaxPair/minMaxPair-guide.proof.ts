/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts minMaxPair-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { minMaxPair } from "./minMaxPair-guide.ref.ts";

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

/** `149998` → `149,998`. `toLocaleString` 은 환경에 따라 갈려서 직접 적는다. */
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

/** 열마다 정렬 방향을 따로 주는 표. `"L"` 왼쪽 · `"R"` 오른쪽. */
function tableA(head: string[], rows: string[][], align: string[]): string {
  const w = head.map((h, i) =>
    Math.max(width(h), ...rows.map((r) => width(r[i] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((c, i) =>
        align[i] === "R" ? padL(c, w[i] as number) : pad(c, w[i] as number),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

/* ────────────────────────── 입력 ────────────────────────── */

/** 전개(`deep.walk`)가 끝까지 쓰는 고정 입력. 길이 8 이라 짝수 갈래가 실행된다. */
const A = [3, 1, 4, 1, 5, 9, 2, 6];

/** 아이디어 상세(`deep.build`)가 쓰는 작은 입력. 길이 6 이다. */
const B = [3, 1, 4, 1, 5, 9];

/** 제약의 상단. 값 자체는 비교 횟수에 영향을 주지 않는다 — 길이만 정한다. */
const 큰입력 = Array.from({ length: 100_000 }, (_, i) => (i * 37) % 9973);

/* ────────────────────────── 계측판 ────────────────────────── */

interface 계측 {
  min: number;
  max: number;
  비교: number;
  대입: number;
  읽기: number;
}

/** 정본과 같은 절차. 비교·대입·배열 읽기만 덧붙여 센다. */
function 짝비교(arr: number[]): 계측 {
  const n = arr.length;
  let 비교 = 0;
  let 대입 = 0;
  let 읽기 = 0;
  const 읽 = (i: number): number => {
    읽기++;
    return arr[i] as number;
  };

  let min: number;
  let max: number;
  let i: number;
  if (n % 2 === 1) {
    min = 읽(0);
    max = 읽(0);
    i = 1;
  } else {
    비교++;
    if (읽(0) < 읽(1)) {
      min = arr[0] as number;
      max = arr[1] as number;
    } else {
      min = arr[1] as number;
      max = arr[0] as number;
    }
    i = 2;
  }

  for (; i < n; i += 2) {
    const a = 읽(i);
    const b = 읽(i + 1);
    비교++;
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    비교++;
    if (lo < min) {
      min = lo;
      대입++;
    }
    비교++;
    if (hi > max) {
      max = hi;
      대입++;
    }
  }
  return { min, max, 비교, 대입, 읽기 };
}

/** 최솟값과 최댓값을 각각 한 번씩 **따로** 구한다. 배열을 두 번 읽는다. */
function 따로두번(arr: number[]): 계측 {
  const n = arr.length;
  let 비교 = 0;
  let 대입 = 0;
  let 읽기 = 1;
  let min = arr[0] as number;
  for (let i = 1; i < n; i++) {
    읽기++;
    비교++;
    if ((arr[i] as number) < min) {
      min = arr[i] as number;
      대입++;
    }
  }
  let max = arr[0] as number;
  읽기++;
  for (let i = 1; i < n; i++) {
    읽기++;
    비교++;
    if ((arr[i] as number) > max) {
      max = arr[i] as number;
      대입++;
    }
  }
  return { min, max, 비교, 대입, 읽기 };
}

/** 한 번 읽으면서 원소마다 `min` 과 `max` 를 **각각** 대조한다. */
function 한번에둘(arr: number[]): 계측 {
  const n = arr.length;
  let 비교 = 0;
  let 대입 = 0;
  let 읽기 = 1;
  let min = arr[0] as number;
  let max = arr[0] as number;
  for (let i = 1; i < n; i++) {
    읽기++;
    const v = arr[i] as number;
    비교++;
    if (v < min) {
      min = v;
      대입++;
    }
    비교++;
    if (v > max) {
      max = v;
      대입++;
    }
  }
  return { min, max, 비교, 대입, 읽기 };
}

/**
 * 원소를 `k` 개씩 묶고, **묶음 안에서 먼저** 최솟값·최댓값을 구한 뒤 그 둘만 전역
 * `min`·`max` 와 대조한다. 묶음 안에서도 같은 규칙(둘씩 짝짓기)을 쓴다.
 *
 * `k = 1` 이면 묶음이 원소 하나라 원소마다 두 번 대조하는 단순 방식과 같아진다.
 */
function 묶음방식(
  arr: number[],
  k: number,
): { min: number; max: number; 비교: number } {
  const n = arr.length;
  let 비교 = 0;

  /** 묶음 `[s, e)` 의 최솟값·최댓값. 비교 횟수는 바깥의 `비교` 에 더한다. */
  const 묶음 = (s: number, e: number): [number, number] => {
    let lo: number;
    let hi: number;
    let j: number;
    if ((e - s) % 2 === 1) {
      lo = arr[s] as number;
      hi = arr[s] as number;
      j = s + 1;
    } else {
      비교++;
      if ((arr[s] as number) < (arr[s + 1] as number)) {
        lo = arr[s] as number;
        hi = arr[s + 1] as number;
      } else {
        lo = arr[s + 1] as number;
        hi = arr[s] as number;
      }
      j = s + 2;
    }
    for (; j < e; j += 2) {
      const a = arr[j] as number;
      const b = arr[j + 1] as number;
      비교++;
      const l2 = a < b ? a : b;
      const h2 = a < b ? b : a;
      비교++;
      if (l2 < lo) lo = l2;
      비교++;
      if (h2 > hi) hi = h2;
    }
    return [lo, hi];
  };

  const 첫끝 = Math.min(k, n);
  let [min, max] = 묶음(0, 첫끝);
  for (let s = 첫끝; s < n; s += k) {
    const [lo, hi] = 묶음(s, Math.min(s + k, n));
    비교++;
    if (lo < min) min = lo;
    비교++;
    if (hi > max) max = hi;
  }
  return { min, max, 비교 };
}

/**
 * 멈춤 2 의 오해 — 쌍의 **큰 쪽도** `min` 과, **작은 쪽도** `max` 와 대조한다.
 * 답은 정본과 같고 비교만 는다.
 */
function 양쪽다대조(arr: number[]): { min: number; max: number; 비교: number } {
  const n = arr.length;
  let 비교 = 0;
  let min: number;
  let max: number;
  let i: number;
  if (n % 2 === 1) {
    min = arr[0] as number;
    max = arr[0] as number;
    i = 1;
  } else {
    비교++;
    if ((arr[0] as number) < (arr[1] as number)) {
      min = arr[0] as number;
      max = arr[1] as number;
    } else {
      min = arr[1] as number;
      max = arr[0] as number;
    }
    i = 2;
  }
  for (; i < n; i += 2) {
    const a = arr[i] as number;
    const b = arr[i + 1] as number;
    비교++;
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    비교++;
    if (lo < min) min = lo;
    비교++;
    if (hi < min) min = hi;
    비교++;
    if (lo > max) max = lo;
    비교++;
    if (hi > max) max = hi;
  }
  return { min, max, 비교 };
}

/* ────────────────────────── 전개 계측 ────────────────────────── */

interface 단계 {
  이름: string;
  갈래: string;
  비교식: string;
  결과: string;
  lo: string;
  hi: string;
  min: string;
  max: string;
  누적: number;
}

/**
 * 전개(`deep.walk`)가 싣는 단계 목록. **비교 한 번이 단계 하나**라, 마지막 단계의 누적
 * 비교 횟수가 곧 이 절차의 총 비교 횟수다.
 */
export function 전개(arr: number[]): 단계[] {
  const n = arr.length;
  const out: 단계[] = [];
  let 누적 = 0;
  let min: number;
  let max: number;
  let i: number;

  if (n % 2 === 1) {
    min = arr[0] as number;
    max = arr[0] as number;
    i = 1;
    out.push({
      이름: `T${out.length + 1}`,
      갈래: "①",
      비교식: "비교 없음",
      결과: "—",
      lo: "—",
      hi: "—",
      min: String(min),
      max: String(max),
      누적,
    });
  } else {
    누적++;
    const 참 = (arr[0] as number) < (arr[1] as number);
    if (참) {
      min = arr[0] as number;
      max = arr[1] as number;
    } else {
      min = arr[1] as number;
      max = arr[0] as number;
    }
    i = 2;
    out.push({
      이름: `T${out.length + 1}`,
      갈래: "②",
      비교식: `A[0]=${arr[0]} < A[1]=${arr[1]}`,
      결과: 참 ? "참" : "거짓",
      lo: "—",
      hi: "—",
      min: String(min),
      max: String(max),
      누적,
    });
  }

  for (; i < n; i += 2) {
    const a = arr[i] as number;
    const b = arr[i + 1] as number;
    누적++;
    const 참1 = a < b;
    const lo = 참1 ? a : b;
    const hi = 참1 ? b : a;
    out.push({
      이름: `T${out.length + 1}`,
      갈래: "③",
      비교식: `A[${i}]=${a} < A[${i + 1}]=${b}`,
      결과: 참1 ? "참" : "거짓",
      lo: String(lo),
      hi: String(hi),
      min: String(min),
      max: String(max),
      누적,
    });

    누적++;
    const 참2 = lo < min;
    const 옛min = min;
    if (참2) min = lo;
    out.push({
      이름: `T${out.length + 1}`,
      갈래: "④",
      비교식: `lo=${lo} < min=${옛min}`,
      결과: 참2 ? "참" : "거짓",
      lo: String(lo),
      hi: String(hi),
      min: String(min),
      max: String(max),
      누적,
    });

    누적++;
    const 참3 = hi > max;
    const 옛max = max;
    if (참3) max = hi;
    out.push({
      이름: `T${out.length + 1}`,
      갈래: "④",
      비교식: `hi=${hi} > max=${옛max}`,
      결과: 참3 ? "참" : "거짓",
      lo: String(lo),
      hi: String(hi),
      min: String(min),
      max: String(max),
      누적,
    });
  }

  out.push({
    이름: `T${out.length + 1}`,
    갈래: "종료",
    비교식: `i=${i} 라 반복이 끝난다`,
    결과: "—",
    lo: "—",
    hi: "—",
    min: String(min),
    max: String(max),
    누적,
  });
  return out;
}

/* ────────────────────────── 하한 논증 검산 ────────────────────────── */

/**
 * 비교 한 번마다 두 원소에 표시를 붙인다 — 더 작은 쪽에 `l`, 더 큰(또는 같은) 쪽에 `w`.
 * `deep.math` ③ 의 하한 논증이 세는 것이 이 표시다.
 */
function 표시세기(arr: number[]): {
  총비교: number;
  둘다새것: number;
  나머지: number;
  w: number;
  l: number;
  표시없는쌍: number;
} {
  const n = arr.length;
  const w = new Array<boolean>(n).fill(false);
  const l = new Array<boolean>(n).fill(false);
  let 총비교 = 0;
  let 둘다새것 = 0;
  let 표시없는쌍 = 0;

  /** `x` 자리와 `y` 자리를 비교한다. `작은쪽` 은 `l`, 큰 쪽은 `w` 를 받는다. */
  const 견줌 = (x: number, y: number, x가작다: boolean): void => {
    총비교++;
    const 처음 = !w[x] && !l[x] && !w[y] && !l[y];
    if (처음) 표시없는쌍++;
    const 작은 = x가작다 ? x : y;
    const 큰 = x가작다 ? y : x;
    const 새것 = (l[작은] === false ? 1 : 0) + (w[큰] === false ? 1 : 0);
    if (새것 === 2) 둘다새것++;
    l[작은] = true;
    w[큰] = true;
  };

  let mi: number;
  let xi: number;
  let i: number;
  if (n % 2 === 1) {
    mi = 0;
    xi = 0;
    i = 1;
  } else {
    const 참 = (arr[0] as number) < (arr[1] as number);
    견줌(0, 1, 참);
    mi = 참 ? 0 : 1;
    xi = 참 ? 1 : 0;
    i = 2;
  }

  for (; i < n; i += 2) {
    const a = arr[i] as number;
    const b = arr[i + 1] as number;
    const 참1 = a < b;
    견줌(i, i + 1, 참1);
    const loi = 참1 ? i : i + 1;
    const hii = 참1 ? i + 1 : i;

    const 참2 = (arr[loi] as number) < (arr[mi] as number);
    견줌(loi, mi, 참2);
    if (참2) mi = loi;

    const 참3 = (arr[hii] as number) > (arr[xi] as number);
    견줌(xi, hii, 참3);
    if (참3) xi = hii;
  }

  return {
    총비교,
    둘다새것,
    나머지: 총비교 - 둘다새것,
    w: w.filter(Boolean).length,
    l: l.filter(Boolean).length,
    표시없는쌍,
  };
}

/** 식 `⌈3n/2⌉ − 2`. 본문이 유도하는 닫힌 형태를 그대로 옮긴 것이다. */
const 식 = (n: number): number => Math.ceil((3 * n) / 2) - 2;

/* ────────────────────────── 변이 ────────────────────────── */

/**
 * 길이의 홀짝을 안 가르는 사본. 홀수 길이에서 마지막 원소가 짝을 못 찾아 `arr[n]`,
 * 곧 `undefined` 와 비교된다. **정본 소스에서 기계로 만든다** — 맞는 줄이 정확히 하나가
 * 아니면 `loadMutant` 가 던진다.
 */
const 홀짝없음 = await loadMutant<{
  minMaxPair(arr: number[]): { min: number; max: number };
}>(new URL("./minMaxPair-guide.ref.ts", import.meta.url).pathname, {
  swap: [/if \(n % 2 === 1\) \{/, "if (false) {"],
});

/**
 * 불변식을 지키던 줄(`if (lo < min) min = lo;`)에서 대조 대상만 큰 쪽으로 바꾼 사본.
 * 쌍의 작은 쪽이 지금까지의 최솟값보다 작아도 그 자리에서 잡히지 않는다.
 */
const 작은쪽무시 = await loadMutant<{
  minMaxPair(arr: number[]): { min: number; max: number };
}>(new URL("./minMaxPair-guide.ref.ts", import.meta.url).pathname, {
  swap: [/if \(lo < min\) min = lo;/, "if (hi < min) min = hi;"],
});

/** `invariant` ③ · 멈춤 1 이 쓰는 입력들. 기존 테스트가 걸던 케이스에서 가져왔다. */
const 변이입력: number[][] = [
  [7],
  [7, 3, 1],
  [2, 9, 5],
  [1, 2, 3, 4, 5],
  [5, 4, 3, 2, 1],
  [3, 1, 4, 1, 5, 9, 2, 6],
  [-3, -1, -4, -1, -5],
  [100, 50, 70, -10],
];

const 보기 = (r: { min: number; max: number }): string =>
  `{ min: ${r.min}, max: ${r.max} }`;

const 홀짝표 = 변이입력.map((입력) => ({
  입력: `[${입력.join(", ")}]`,
  바른: 보기(minMaxPair(입력)),
  깨진: 보기(홀짝없음.minMaxPair(입력)),
}));

const 작은쪽표 = 변이입력.map((입력) => ({
  입력: `[${입력.join(", ")}]`,
  바른: 보기(minMaxPair(입력)),
  깨진: 보기(작은쪽무시.minMaxPair(입력)),
}));

// 하나도 안 달라지면 두 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (홀짝표.every((r) => r.바른 === r.깨진)) {
  throw new Error(
    "홀짝 변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「조용히 틀린다」가 거짓이다",
  );
}
if (작은쪽표.every((r) => r.바른 === r.깨진)) {
  throw new Error(
    "작은쪽 변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
  );
}
// **이쪽은 반대다.** 멈춤 2 는 「답이 안 틀리고 비교만 는다」고 적으므로, 답이 하나라도
// 달라지면 그 문장이 거짓이 된다.
for (const 입력 of 변이입력) {
  const 바른 = minMaxPair(입력);
  const 양쪽 = 양쪽다대조(입력);
  if (바른.min !== 양쪽.min || 바른.max !== 양쪽.max) {
    throw new Error("양쪽 대조가 답을 바꿨다 — 「답이 안 틀린다」가 거짓이다");
  }
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 가장 단순한 방법의 비교 횟수를 제약 규모까지 세운다. */
  "naive-count": () => {
    const rows = [B, A, 큰입력].map((입력) => {
      const 따로 = 따로두번(입력);
      const 한번 = 한번에둘(입력);
      return [
        comma(입력.length),
        comma(따로.비교),
        comma(따로.읽기),
        comma(한번.비교),
        comma(한번.읽기),
        comma(2 * 입력.length - 2),
      ];
    });
    return table(
      ["n", "따로 두 번 비교", "읽기", "한 번에 둘 비교", "읽기", "2n-2"],
      rows,
    );
  },

  /** `deep.build` ④ — 같은 입력에 두 방식을 걸고 계수를 나란히 적는다. */
  "two-ways": () =>
    table(
      ["", "n=6 비교", "n=6 배열 읽기", "n=100,000 비교"],
      [
        [
          "원소마다 두 번 대조",
          comma(한번에둘(B).비교),
          comma(한번에둘(B).읽기),
          comma(한번에둘(큰입력).비교),
        ],
        [
          "둘씩 짝지어 대조",
          comma(짝비교(B).비교),
          comma(짝비교(B).읽기),
          comma(짝비교(큰입력).비교),
        ],
      ],
    ),

  /** `deep.build` ⑥ — 묶음 크기 `k` 를 여섯 값으로 놓고 같은 입력에서 비교를 센다. */
  "group-size": () => {
    const rows = [1, 2, 3, 4, 5, 6].map((k) => {
      const 작은 = 묶음방식(A, k);
      const 큰 = 묶음방식(큰입력, k);
      return [
        String(k),
        comma(작은.비교),
        comma(큰.비교),
        (큰.비교 / 큰입력.length).toFixed(3),
      ];
    });
    return table(["묶음 크기 k", "n=8 비교", "n=100,000 비교", "원소당"], rows);
  },

  /** `deep.walk.step` — 고정 입력을 비교 한 번씩 끊어 끝까지 따라간다. */
  trace: () => {
    const rows = 전개(A).map((s) => [
      s.이름,
      s.갈래,
      s.비교식,
      s.결과,
      s.lo,
      s.hi,
      s.min,
      s.max,
      String(s.누적),
    ]);
    return tableA(
      ["단계", "갈래", "이번 비교", "결과", "lo", "hi", "min", "max", "누적"],
      rows,
      ["L", "L", "L", "L", "R", "R", "R", "R", "R"],
    );
  },

  /** `deep.walk.pause` 1 — 홀짝을 안 가르면 홀수 길이에서 답이 조용히 틀린다. */
  "mutant-parity": () =>
    tableA(
      ["입력", "바른 코드", "홀짝을 안 가른 코드"],
      홀짝표.map((r) => [r.입력, r.바른, r.깨진]),
      ["L", "L", "L"],
    ),

  /** `deep.walk.pause` 2 — 양쪽을 다 대조해도 답은 같고 비교만 는다. */
  "both-sides": () => {
    const rows = [B, A, 큰입력].map((입력) => {
      const 바른 = 짝비교(입력);
      const 양쪽 = 양쪽다대조(입력);
      return [
        comma(입력.length),
        comma(바른.비교),
        comma(양쪽.비교),
        `${바른.min} / ${바른.max}`,
        `${양쪽.min} / ${양쪽.max}`,
      ];
    });
    return table(
      ["n", "정본 비교", "양쪽 대조 비교", "정본 min/max", "양쪽 min/max"],
      rows,
    );
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 값. */
  "final-run": () => {
    const 입력들: number[][] = [
      [3, 1, 4, 1, 5, 9, 2, 6],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
      [7],
      [5, 5, 5, 5],
      [-3, -1, -4, -1, -5],
      [-10, 0, 10],
      [100, 50, 70, -10],
    ];
    const w = Math.max(...입력들.map((v) => width(`[${v.join(", ")}]`)));
    return 입력들
      .map(
        (v) =>
          `minMaxPair(${pad(`[${v.join(", ")}]`, w)})  →  ${보기(minMaxPair(v))}`,
      )
      .join("\n");
  },

  /** `deep.math` ② — 홀·짝 두 식과 통합식이 계측값과 같은지 검산한다. */
  "formula-check": () => {
    const rows: string[][] = [];
    for (let n = 1; n <= 10; n++) {
      const 입력 = Array.from({ length: n }, (_, i) => (i * 7) % 13);
      const 잰값 = 짝비교(입력).비교;
      const 홀짝식 = n % 2 === 1 ? (3 * (n - 1)) / 2 : 1 + (3 * (n - 2)) / 2;
      // C++ 표준이 `minmax_element` 의 복잡도로 적는 식. 값이 같은지도 함께 본다.
      const 표준식 = Math.max(Math.floor((3 * (n - 1)) / 2), 0);
      rows.push([
        String(n),
        n % 2 === 1 ? "홀수" : "짝수",
        String(잰값),
        String(홀짝식),
        String(식(n)),
        String(표준식),
        잰값 === 홀짝식 && 잰값 === 식(n) && 잰값 === 표준식
          ? "같다"
          : "다르다",
      ]);
    }
    return table(
      ["n", "길이", "실측 비교", "홀·짝 식", "⌈3n/2⌉-2", "⌊3(n-1)/2⌋", ""],
      rows,
    );
  },

  /** `deep.math` ③ — 하한 논증이 세는 표시를 실제 실행에서 세어 대조한다. */
  "bound-marks": () => {
    const r = 표시세기(A);
    const n = A.length;
    return table(
      ["", "실측", "논증이 말하는 값"],
      [
        ["총 비교", String(r.총비교), `⌈3n/2⌉-2 = ${식(n)}`],
        [
          "표시 없는 원소끼리의 비교",
          String(r.표시없는쌍),
          `⌊n/2⌋ = ${Math.floor(n / 2)} 이하`,
        ],
        ["새 표시가 2 개 붙은 비교", String(r.둘다새것), "위와 같아야 한다"],
        ["새 표시가 1 개 이하 붙은 비교", String(r.나머지), "나머지 전부"],
        ["w 표시를 받은 원소", String(r.w), `n-1 = ${n - 1} 이상`],
        ["l 표시를 받은 원소", String(r.l), `n-1 = ${n - 1} 이상`],
      ],
    );
  },

  /** `deep.math` ④ — 제약 상단 `n = 100,000` 을 식에 넣는다. */
  n1e5: () => {
    const n = 큰입력.length;
    const 단순 = 한번에둘(큰입력).비교;
    const 짝 = 짝비교(큰입력).비교;
    return table(
      ["", "비교 횟수"],
      [
        ["원소마다 두 번 대조 (2n-2)", comma(단순)],
        [`둘씩 짝지어 대조 (⌈3n/2⌉-2)`, comma(짝)],
        ["줄어든 수", comma(단순 - 짝)],
        ["줄어든 비율", `${(((단순 - 짝) / 단순) * 100).toFixed(1)}%`],
        ["하한과의 차이", comma(짝 - 식(n))],
      ],
    );
  },

  /**
   * `invariant` ③ — 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다.
   * 옛 이해 시험 `V5` 가 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만
   * 달라도 잡는다.
   */
  "mutant-min": () =>
    tableA(
      ["입력", "바른 코드", "작은 쪽을 안 보는 코드"],
      작은쪽표.map((r) => [r.입력, r.바른, r.깨진]),
      ["L", "L", "L"],
    ),

  /** `perf.derive` — 비교 횟수를 시작 갈래와 쌍의 수로 갈라 센다. */
  "derive-count": () => {
    const rows = [4, 8, 9, 100_000].map((n) => {
      const 입력 = Array.from({ length: n }, (_, i) => (i * 37) % 9973);
      const 시작 = n % 2 === 1 ? 0 : 1;
      const 쌍 = Math.floor((n - (n % 2 === 1 ? 1 : 2)) / 2);
      return [
        comma(n),
        String(시작),
        comma(쌍),
        comma(쌍 * 3),
        comma(시작 + 쌍 * 3),
        comma(짝비교(입력).비교),
      ];
    });
    return table(
      ["n", "시작 비교", "쌍의 수", "쌍당 3 번", "합계", "실측"],
      rows,
    );
  },

  /**
   * `perf.bounds` — 입력 모양을 바꿔도 비교 횟수는 그대로이고 대입 횟수만 갈린다.
   * 케이스가 갈리지 않는 근거가 이 표다.
   */
  "cost-cases": () => {
    const 오름 = Array.from({ length: 8 }, (_, i) => i + 1);
    const 내림 = Array.from({ length: 8 }, (_, i) => 8 - i);
    const 같음 = new Array<number>(8).fill(5);
    const 바깥으로 = [0, 0, -1, 1, -2, 2, -3, 3];
    const rows = [
      ["오름차순 [1..8]", 오름],
      ["내림차순 [8..1]", 내림],
      ["모두 같은 값 [5×8]", 같음],
      ["바깥으로 벌어짐", 바깥으로],
      ["전개의 입력", A],
    ] as [string, number[]][];
    return tableA(
      ["입력", "비교", "대입", "min", "max"],
      rows.map(([이름, v]) => {
        const r = 짝비교(v);
        return [
          이름,
          String(r.비교),
          String(r.대입),
          String(r.min),
          String(r.max),
        ];
      }),
      ["L", "R", "R", "R", "R"],
    );
  },

  /** `perf.worst` — 대입을 최대로 만드는 입력을 실제로 구성해 잰다. */
  "worst-input": () => {
    const 만들기 = (n: number): number[] => {
      const v: number[] = [0, 0];
      for (let k = 1; v.length < n; k++) {
        v.push(-k, k);
      }
      return v.slice(0, n);
    };
    const rows = [8, 12, 100_000].map((n) => {
      const 나쁨 = 짝비교(만들기(n));
      const 좋음 = 짝비교(new Array<number>(n).fill(5));
      return [
        comma(n),
        comma(나쁨.비교),
        comma(나쁨.대입),
        comma(좋음.대입),
        comma(n - 2),
      ];
    });
    return table(["n", "비교", "최악 대입", "최선 대입", "n-2"], rows);
  },
};
