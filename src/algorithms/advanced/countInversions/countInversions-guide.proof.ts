/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/advanced/countInversions/countInversions-guide.md
 *
 * **이 편의 값은 전부 정수다.** 답도 계수도 정수라 「같다」를 글자 대조로 정할 수 있고,
 * 반올림을 걱정할 자리가 없다. 정수 표현의 한계가 어디인지만 `math-limit` 가 따로 낸다.
 *
 * **`viz` 아래 걸음 표는 `.sim.ts` 에서 만든다.** 손으로 그리면 ① 열이 어긋나도 `P15` 가
 * 손 펜스를 안 보고 ② 걸음 수가 프레임 수와 갈려도 `P3` 이 못 본다. 여기서는 프레임의
 * `array` 와 실행이 낸 배열을 **프레임마다 대조하고** 어긋나면 던진다.
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 *
 * **세는 사본이 셋 있다**(`걸음마다`·`정의대로`·`인접교환`). 정본은 걸음마다의 상태도, 정의를
 * 그대로 옮긴 두 겹 반복의 계수도, 인접한 두 칸만 맞바꿔 정렬할 때의 횟수도 내보내지 않는다.
 * **답이 맞는지는 사본이 아니라 정본이 진다** — 사본이 낸 답은 전부 정본과 대조한다.
 *
 * 경쟁 설계 대조 표의 값은 `.alt.ts` 를 **불러서** 얻는다 — 같은 값을 두 파일에 적으면
 * 한쪽만 고쳐질 때 표가 조용히 거짓이 된다.
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  measure,
  N_ALT,
  값범위,
  곱수,
  저장경계,
  합치며_세기,
} from "./countInversions-guide.alt.ts";
import { countInversions } from "./countInversions-guide.ref.ts";
import { invWalk } from "./countInversions-guide.sim.ts";

const REF = new URL("./countInversions-guide.ref.ts", import.meta.url).pathname;

type Ref = { countInversions: (arr: number[]) => number };

/* ────────────────────────── 칸 맞춤 ────────────────────────── */

const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

const comma = (n: number | bigint): string => n.toLocaleString("en-US");

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

/**
 * 받침이 있으면 앞엣것, 없으면 뒤엣것을 돌려준다. **조사만** 돌려주고 값은 부르는 쪽이 적는다.
 * 숫자는 우리말 읽기로 판정한다 — 0 영 · 1 일 · 3 삼 · 6 육 · 7 칠 · 8 팔이 받침을 갖는다.
 */
function 조사(value: string, 받침: string, 무받침: string): string {
  const last = [...value].at(-1) ?? "";
  const code = last.codePointAt(0) ?? 0;
  const digit = "0123456789".indexOf(last);
  if (digit >= 0) return [0, 1, 3, 6, 7, 8].includes(digit) ? 받침 : 무받침;
  if (code < 0xac00 || code > 0xd7a3) return 무받침;
  return (code - 0xac00) % 28 === 0 ? 무받침 : 받침;
}

/** 배열을 값 나열로. 대괄호를 안 쓴다 — 자리 구간과 표기가 갈려야 한다. */
const 값나열 = (arr: number[]): string => arr.join(" ");

/** 개수를 「초당 1억 번을 세면 얼마나 걸리는가」로. 정수 위에서 판정하고 표기만 줄인다. */
const 초당 = 100_000_000n;
function 걸리는_시간(count: bigint): string {
  if (count < 초당 / 1_000n)
    return `${(Number(count) / 1e8).toExponential(2)}초`;
  if (count < 60n * 초당) {
    return `${(Number((count * 1_000n) / 초당) / 1_000).toFixed(3)}초`;
  }
  return `${(Number((count * 100n) / (초당 * 60n)) / 100).toFixed(2)}분`;
}

/* ────────────────────── 공통 입력과 도우미 ────────────────────── */

/** 본문 전개가 쓰는 고정 입력. 답이 6 이고 갈래 다섯을 다 지나간다. */
const WALK = [4, 1, 5, 2, 6, 3];

/** `deep.build` ⑥ 가 쓰는 입력. 난수도 시드도 없다. */
const BUILD_N = 64;
const BUILD = Array.from({ length: BUILD_N }, (_, q) => (q * 37) % 101);

/** 정의를 그대로 옮긴 두 겹 반복. 견주기 횟수를 함께 낸다. */
function 정의대로(arr: number[]): { 답: number; 견주기: number } {
  let 답 = 0;
  let 견주기 = 0;
  for (let p = 0; p < arr.length; p++) {
    for (let q = p + 1; q < arr.length; q++) {
      견주기++;
      if ((arr[p] as number) > (arr[q] as number)) 답++;
    }
  }
  return { 답, 견주기 };
}

/** 인접한 두 칸만 맞바꿔 오름차순으로 만들 때의 맞바꾼 횟수. */
function 인접교환(arr: number[]): number {
  const a = arr.slice();
  let swaps = 0;
  for (let end = a.length - 1; end > 0; end--) {
    for (let x = 0; x < end; x++) {
      if ((a[x] as number) > (a[x + 1] as number)) {
        const t = a[x] as number;
        a[x] = a[x + 1] as number;
        a[x + 1] = t;
        swaps++;
      }
    }
  }
  return swaps;
}

/** 합치기마다의 조각과 그 합치기가 센 개수. 재귀 순서 그대로다. */
interface 자리 {
  lo: number;
  mid: number;
  hi: number;
  센개수: number;
}

/** 정본과 같은 절차에 합치기별 기록과 걸음별 상태를 덧붙인 사본. */
function 걸음마다(arr: number[]): {
  답: number;
  자리들: 자리[];
  걸음: {
    조각: string;
    견주기: number;
    더한개수: number;
    누적: number;
    a: number[];
  }[];
} {
  const N = arr.length;
  const a = arr.slice();
  const buffer = new Array<number>(N);
  const 자리들: 자리[] = [];
  const 걸음: {
    조각: string;
    견주기: number;
    더한개수: number;
    누적: number;
    a: number[];
  }[] = [];
  let 누적 = 0;
  걸음.push({ 조각: "—", 견주기: 0, 더한개수: 0, 누적: 0, a: a.slice() });

  function merge(lo: number, mid: number, hi: number): number {
    const 마지막 = lo === 0 && hi === N - 1;
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    let 견주기 = 0;
    let 더한개수 = 0;
    while (i <= mid && j <= hi) {
      견주기++;
      if ((a[i] as number) <= (a[j] as number)) {
        buffer[k] = a[i] as number;
        k++;
        i++;
      } else {
        count += mid - i + 1;
        더한개수 += mid - i + 1;
        buffer[k] = a[j] as number;
        k++;
        j++;
      }
      // 마지막 합치기의 앞 세 견주기는 걸음 하나씩으로 남긴다. `a` 는 아직 안 바뀐다.
      if (마지막 && 견주기 <= 3) {
        걸음.push({
          조각: `[${lo}, ${hi}]`,
          견주기,
          더한개수,
          누적: 누적 + count,
          a: a.slice(),
        });
      }
    }
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
    }
    for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
    자리들.push({ lo, mid, hi, 센개수: count });
    누적 += count;
    걸음.push({
      조각: `[${lo}, ${hi}]`,
      견주기,
      더한개수,
      누적,
      a: a.slice(),
    });
    return count;
  }

  function rec(lo: number, hi: number): number {
    if (lo >= hi) return 0;
    const mid = (lo + hi) >> 1;
    let c = rec(lo, mid);
    c += rec(mid + 1, hi);
    c += merge(lo, mid, hi);
    return c;
  }

  const 답 = rec(0, N - 1);
  return { 답, 자리들, 걸음 };
}

/** 걸음별 사본이 정본과 같은 답을 내는가. 어긋나면 아래 표가 전부 거짓이 된다. */
for (const arr of [WALK, BUILD, [2, 2, 2, 2], [1], []]) {
  if (arr.length > 1 && 걸음마다(arr).답 !== countInversions(arr)) {
    throw new Error(`걸음별 사본이 정본과 다른 답을 냈다 — ${값나열(arr)}`);
  }
  if (정의대로(arr).답 !== countInversions(arr)) {
    throw new Error(
      `정의를 옮긴 사본이 정본과 다른 답을 냈다 — ${값나열(arr)}`,
    );
  }
}

/* ─────────────── 걸음 표는 `.sim.ts` 프레임에서 만든다 ─────────────── */

const 전개 = 걸음마다(WALK);

if (전개.걸음.length !== invWalk.steps.length) {
  throw new Error(
    `실행 걸음 ${전개.걸음.length} 과 시뮬 프레임 ${invWalk.steps.length} 이 다르다`,
  );
}
for (const [index, frame] of invWalk.steps.entries()) {
  const 실행 = (전개.걸음[index] as { a: number[] }).a;
  const 그림 = (frame as { array: (number | string)[] }).array;
  if (값나열(실행) !== 그림.join(" ")) {
    throw new Error(
      `프레임 ${index + 1} 의 배열이 실행과 다르다 — 실행 ${값나열(실행)} · 프레임 ${그림.join(" ")}`,
    );
  }
}

/** 프레임 제목에서 `T#` 와 하는 일을 가른다. */
function 제목(index: number): { 라벨: string; 하는일: string } {
  const raw = (invWalk.steps[index] as { title: string }).title;
  const m = /^(T\d+)\s+(.*)$/.exec(raw);
  return { 라벨: m?.[1] ?? "", 하는일: m?.[2] ?? raw };
}

/* ────────────────────────── 변이 ────────────────────────── */

/** 같은 값을 오른쪽으로 보내는 판 — `<=` 를 `<` 로 바꾼다. */
const 동률판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {6}if \(\(a\[i\] as number\) <= \(a\[j\] as number\)\) \{$/,
    "      if ((a[i] as number) < (a[j] as number)) {",
  ],
});

/** 더하는 개수를 하나 줄인 판. */
const 하나적은판 = await loadMutant<Ref>(REF, {
  swap: [/^ {8}count \+= mid - i \+ 1;$/, "        count += mid - i;"],
});

/** 합친 결과를 제자리에 옮겨 적는 줄을 지운 판. */
const 안적는판 = await loadMutant<Ref>(REF, {
  drop: /^ {4}for \(let x = lo; x <= hi; x\+\+\) a\[x\] = buffer\[x\] as number;$/,
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가
 * **같은 객체**다. 중화 상태에서 아래 자기검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = 동률판.countInversions === countInversions;

const 갈리는_변이: { label: string; impl: Ref; 입력: number[][] }[] = [
  { label: "같은 값을 오른쪽으로 보내는 판", impl: 동률판, 입력: [[2, 2]] },
  { label: "하나 적게 더하는 판", impl: 하나적은판, 입력: [WALK] },
  { label: "제자리에 안 적는 판", impl: 안적는판, 입력: [WALK] },
];

if (!중화됨) {
  for (const { label, impl, 입력 } of 갈리는_변이) {
    if (
      입력.every((arr) => countInversions(arr) === impl.countInversions(arr))
    ) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 변이를 건 그 줄을 이 입력이 몇 번 지나가는가. 실행으로 센다. */
function 지나간_횟수(arr: number[]): {
  견주기: number;
  더한자리: number;
  옮겨적기: number;
} {
  const c = 합치며_세기(arr);
  return {
    견주기: c.견주기,
    더한자리: 오른쪽_꺼낸_횟수(arr),
    옮겨적기: c.옮긴칸,
  };
}

/** 합치기에서 오른쪽 값을 꺼낸 횟수 — 더하는 줄을 지나간 횟수와 같다. */
function 오른쪽_꺼낸_횟수(arr: number[]): number {
  const N = arr.length;
  if (N <= 1) return 0;
  const a = arr.slice();
  const buffer = new Array<number>(N);
  let 횟수 = 0;
  function merge(lo: number, mid: number, hi: number): void {
    let i = lo;
    let j = mid + 1;
    let k = lo;
    while (i <= mid && j <= hi) {
      if ((a[i] as number) <= (a[j] as number)) {
        buffer[k] = a[i] as number;
        k++;
        i++;
      } else {
        횟수++;
        buffer[k] = a[j] as number;
        k++;
        j++;
      }
    }
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
    }
    for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
  }
  function rec(lo: number, hi: number): void {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    rec(lo, mid);
    rec(mid + 1, hi);
    merge(lo, mid, hi);
  }
  rec(0, N - 1);
  return 횟수;
}

type 자리이름 = "견주기" | "더한자리" | "옮겨적기";

/** 변이 하나를 입력 여럿에 적용해 정본과 나란히 놓는다. */
function 변이표(
  label: string,
  impl: Ref,
  site: 자리이름,
  siteLabel: string,
  입력: [string, number[]][],
): string {
  const rows: string[][] = [["입력", "정본", label, siteLabel, "판정"]];
  for (const [name, arr] of 입력) {
    const ok = countInversions(arr);
    const bad = impl.countInversions(arr);
    rows.push([
      name,
      comma(ok),
      comma(bad),
      comma(지나간_횟수(arr)[site]),
      ok === bad ? "같다" : "어긋난다",
    ]);
  }
  return table(rows, [1, 2, 3]).join("\n");
}

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 정의를 그대로 옮긴 두 겹 반복의 규모. */
  "naive-scale": () => {
    const rows: string[][] = [
      ["칸 수 N", "쌍의 개수 N(N−1)/2", "초당 1 억 번을 세면"],
    ];
    for (const N of [6, 64, 1_000, 100_000]) {
      const pairs = (BigInt(N) * BigInt(N - 1)) / 2n;
      rows.push([comma(N), comma(pairs), 걸리는_시간(pairs)]);
    }
    const 작은것 = 정의대로(WALK);
    const lines = table(rows, [0, 1, 2]);
    lines.push(
      `전개 입력 ${값나열(WALK)} 에서는 견주기 ${comma(작은것.견주기)} 번으로 답 ${comma(작은것.답)}${조사(comma(작은것.답), "을", "를")} 낸다`,
    );
    return lines.join("\n");
  },

  /** 오름차순으로 놓아 버리면 셀 것이 없어진다. */
  "sorted-loses-it": () => {
    const 정렬 = WALK.slice().sort((x, y) => x - y);
    const rows: string[][] = [["배열", "값", "정의대로 센 역순쌍"]];
    rows.push(["입력 그대로", 값나열(WALK), comma(정의대로(WALK).답)]);
    rows.push(["오름차순으로 놓은 것", 값나열(정렬), comma(정의대로(정렬).답)]);
    const lines = table(rows, [2]);
    lines.push(
      "먼저 놓아 버리면 답이 0 이 된다. 자리를 바꾸는 일과 세는 일을 같은 걸음 안에서 해야 한다",
    );
    return lines.join("\n");
  },

  /** 같은 두 조각을 두 방식으로 센다. */
  "cross-two-ways": () => {
    const L = [1, 4, 5];
    const R = [2, 3, 6];
    let 하나씩 = 0;
    let 교차 = 0;
    for (const x of L) {
      for (const y of R) {
        하나씩++;
        if (x > y) 교차++;
      }
    }
    // 합치며 세면 견주기와 더한 횟수가 몇인가 — 정본과 같은 절차를 이 두 조각에만 적용한다.
    let i = 0;
    let j = 0;
    let 견주기 = 0;
    let 더한횟수 = 0;
    let 센것 = 0;
    const 자국: string[][] = [
      ["견주기", "왼쪽 값", "오른쪽 값", "판정", "더한 개수", "누적"],
    ];
    while (i < L.length && j < R.length) {
      견주기++;
      const x = L[i] as number;
      const y = R[j] as number;
      if (x <= y) {
        자국.push([
          comma(견주기),
          comma(x),
          comma(y),
          "왼쪽을 꺼낸다",
          "0",
          comma(센것),
        ]);
        i++;
      } else {
        더한횟수++;
        센것 += L.length - i;
        자국.push([
          comma(견주기),
          comma(x),
          comma(y),
          "오른쪽을 꺼낸다",
          comma(L.length - i),
          comma(센것),
        ]);
        j++;
      }
    }
    const lines = table(자국, [0, 1, 2, 4, 5]);
    lines.push("");
    lines.push(
      ...table(
        [
          ["방식", "견주기", "더한 횟수", "센 교차 역순쌍"],
          ["하나씩 견준다", comma(하나씩), "—", comma(교차)],
          ["합치며 센다", comma(견주기), comma(더한횟수), comma(센것)],
        ],
        [1, 2, 3],
      ),
    );
    lines.push(
      `왼쪽 ${값나열(L)} 과 오른쪽 ${값나열(R)} 은 둘 다 오름차순이다. 답은 같고 견주기가 ${comma(하나씩)} 에서 ${comma(견주기)} 로 준다`,
    );
    return lines.join("\n");
  },

  /** 가르는 자리를 바꿔 가며 계수를 잰다. */
  "split-sweep": () => {
    const 규칙: [string, (lo: number, hi: number) => number][] = [
      ["1 : 1 (반반)", (lo, hi) => (lo + hi) >> 1],
      ["1 : 3", (lo, hi) => lo + ((hi - lo) >> 2)],
      ["3 : 1", (lo, hi) => hi - 1 - ((hi - lo) >> 2)],
      ["1 : 7", (lo, hi) => lo + ((hi - lo) >> 3)],
      ["1 칸 : 나머지", (lo) => lo],
      ["나머지 : 1 칸", (_lo, hi) => hi - 1],
    ];
    const rows: string[][] = [
      ["가르는 자리", "답", "견주기", "옮긴 칸", "칸 접근"],
    ];
    for (const [name, split] of 규칙) {
      const c = 계수_스윕(BUILD, split);
      rows.push([
        name,
        comma(c.답),
        comma(c.견주기),
        comma(c.옮긴칸),
        comma(c.칸접근),
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4]);
    lines.push(
      `칸 ${comma(BUILD_N)} 개짜리 입력 A[q] = (q × 37) mod 101 이다. 여섯 규칙이 다 같은 답을 내고 비용만 갈린다`,
    );
    return lines.join("\n");
  },

  /** 재귀가 만드는 조각과 자리마다 센 개수. */
  "walk-tree": () => {
    const rows: string[][] = [
      ["합치기", "왼쪽 조각", "오른쪽 조각", "이 합치기가 센 개수"],
    ];
    for (const 자리 of 전개.자리들) {
      rows.push([
        `[${자리.lo}, ${자리.hi}]`,
        `[${자리.lo}, ${자리.mid}]`,
        `[${자리.mid + 1}, ${자리.hi}]`,
        comma(자리.센개수),
      ]);
    }
    const 합 = 전개.자리들.reduce((s, v) => s + v.센개수, 0);
    const 답 = countInversions(WALK);
    const lines = table(rows, [3]);
    lines.push(
      `합치기가 ${comma(전개.자리들.length)} 개이고 센 개수를 다 더하면 ${comma(합)}${조사(comma(합), "이다", "다")}. 정본의 답도 ${comma(답)}${조사(comma(답), "이다", "다")}`,
    );
    return lines.join("\n");
  },

  /** 아홉 걸음 표 — `.sim.ts` 프레임에서 만든다. */
  "walk-trace": () => {
    const rows: string[][] = [
      [
        "걸음",
        "이번 걸음이 하는 일",
        "조각",
        "견주기",
        "더한 개수",
        "누적",
        "a",
      ],
    ];
    for (const [index, 걸음] of 전개.걸음.entries()) {
      const { 라벨, 하는일 } = 제목(index);
      rows.push([
        라벨,
        하는일,
        걸음.조각,
        comma(걸음.견주기),
        comma(걸음.더한개수),
        comma(걸음.누적),
        값나열(걸음.a),
      ]);
    }
    const lines = table(rows, [3, 4, 5]);
    lines.push(
      "└ 「a」 는 그 걸음이 끝난 시점의 배열이다. 합치는 도중인 걸음은 buffer 에만 쓰므로 a 가 그대로다",
    );
    lines.push(
      `└ 「견주기」·「더한 개수」 는 그 합치기 안에서만 센 값이고 「누적」 은 처음부터의 합이다. 마지막 누적 ${comma(전개.답)}${조사(comma(전개.답), "이", "가")} 반환값이다`,
    );
    return lines.join("\n");
  },

  /** 같은 값을 어느 쪽으로 보낼 것인가 — 답이 안 틀리는 변이. */
  "pause-tie": () =>
    변이표("같은 값을 오른쪽으로", 동률판, "견주기", "바꾼 줄을 지나간 횟수", [
      ["전개 입력 4 1 5 2 6 3", WALK],
      ["칸 두 개가 같은 2 2", [2, 2]],
      ["전부 같은 2 2 2 2", [2, 2, 2, 2]],
      ["같은 값이 섞인 3 1 2 3 1", [3, 1, 2, 3, 1]],
    ]),

  /** 답이 같은 행을 걸음별로 다시 본다. */
  "pause-tie-steps": () => {
    const 정본걸음 = 전개.걸음;
    const rows: string[][] = [
      ["걸음", "정본의 누적", "같은 값을 오른쪽으로 보낸 판의 누적", "판정"],
    ];
    const 변이걸음 = 동률_걸음마다(WALK);
    for (const [index, 걸음] of 정본걸음.entries()) {
      const 저쪽 = 변이걸음[index] as { 누적: number };
      rows.push([
        제목(index).라벨,
        comma(걸음.누적),
        comma(저쪽.누적),
        걸음.누적 === 저쪽.누적 ? "같다" : "어긋난다",
      ]);
    }
    const lines = table(rows, [1, 2]);
    lines.push(
      `└ 바꾼 줄을 ${comma(지나간_횟수(WALK).견주기)} 번 지나갔는데 아홉 걸음의 누적이 전부 같다. 이 입력에는 같은 값이 없어 그 줄의 판정이 갈릴 자리가 없다`,
    );
    return lines.join("\n");
  },

  /** 더하는 개수를 하나 줄이면. */
  "pause-off-by-one": () =>
    변이표(
      "하나 적게 더하는 판",
      하나적은판,
      "더한자리",
      "바꾼 줄을 지나간 횟수",
      [
        ["전개 입력 4 1 5 2 6 3", WALK],
        ["이미 오름차순 1 2 3 4 5 6", [1, 2, 3, 4, 5, 6]],
        ["내림차순 6 5 4 3 2 1", [6, 5, 4, 3, 2, 1]],
        ["칸 두 개 2 1", [2, 1]],
      ],
    ),

  /** 인접한 두 칸만 맞바꿔 정렬할 때의 횟수. */
  "kendall-swaps": () => {
    const rows: string[][] = [
      ["배열", "역순쌍 개수", "인접 교환으로 정렬한 횟수", "판정"],
    ];
    for (const arr of [
      WALK,
      [1, 2, 3, 4, 5, 6],
      [6, 5, 4, 3, 2, 1],
      [2, 2, 2, 2],
      [3, 1, 2, 3, 1],
      BUILD,
    ]) {
      const a = countInversions(arr);
      const b = 인접교환(arr);
      rows.push([
        arr.length > 8 ? `칸 ${comma(arr.length)} 개짜리 생성식` : 값나열(arr),
        comma(a),
        comma(b),
        a === b ? "같다" : "어긋난다",
      ]);
    }
    const lines = table(rows, [1, 2]);
    lines.push(
      "└ 인접한 두 칸을 한 번 맞바꾸면 역순쌍이 정확히 하나 준다. 그래서 두 열이 언제나 같은 값이다",
    );
    return lines.join("\n");
  },

  /** 역순쌍 전부를 열거하고 갈라지는 합치기와 뒤 자리를 함께 낸다. */
  "math-pairs": () => {
    const rows: string[][] = [["쌍", "값", "갈라지는 합치기", "뒤 자리 q"]];
    const 쌍들: [number, number][] = [];
    for (let p = 0; p < WALK.length; p++) {
      for (let q = p + 1; q < WALK.length; q++) {
        if ((WALK[p] as number) > (WALK[q] as number)) 쌍들.push([p, q]);
      }
    }
    for (const [p, q] of 쌍들) {
      let lo = 0;
      let hi = WALK.length - 1;
      for (;;) {
        const mid = (lo + hi) >> 1;
        if (q <= mid) hi = mid;
        else if (mid < p) lo = mid + 1;
        else break;
      }
      rows.push([
        `(${p}, ${q})`,
        `${WALK[p]} > ${WALK[q]}`,
        `[${lo}, ${hi}]`,
        comma(q),
      ]);
    }
    const lines = table(rows, [3]);
    lines.push(
      `└ 역순쌍이 ${comma(쌍들.length)} 개다. 셋째 열로 묶으면 합치기별 개수가 되고 넷째 열로 묶으면 뒤 자리별 개수가 된다`,
    );
    return lines.join("\n");
  },

  /** 같은 역순쌍 집합을 두 방식으로 가른다. */
  "math-partition": () => {
    const 자리별 = 전개.자리들.map((v) => v.센개수);
    const q별: number[] = [];
    for (let q = 1; q < WALK.length; q++) {
      let c = 0;
      for (let p = 0; p < q; p++) {
        if ((WALK[p] as number) > (WALK[q] as number)) c++;
      }
      q별.push(c);
    }
    const rows: string[][] = [["가르는 방법", "묶음마다의 개수", "합"]];
    rows.push([
      "합치기로 가른다",
      자리별.map((v) => comma(v)).join(" "),
      comma(자리별.reduce((s, v) => s + v, 0)),
    ]);
    rows.push([
      "뒤 자리 q 로 가른다",
      q별.map((v) => comma(v)).join(" "),
      comma(q별.reduce((s, v) => s + v, 0)),
    ]);
    rows.push(["정의대로 센다", "—", comma(정의대로(WALK).답)]);
    const lines = table(rows, [2]);
    lines.push(
      `입력 ${값나열(WALK)} 이다. 묶음마다의 개수는 두 방법이 다르고 합은 셋 다 ${comma(countInversions(WALK))} 이다`,
    );
    return lines.join("\n");
  },

  /** 답이 배정밀도 정수로 표현되는 한계. */
  "math-limit": () => {
    const 한계 = 2n ** 53n;
    const rows: string[][] = [["칸 수 N", "N(N−1)/2", "2^53 안인가"]];
    for (const N of [100_000n, 134_217_727n, 134_217_728n, 134_217_729n]) {
      const v = (N * (N - 1n)) / 2n;
      rows.push([comma(N), comma(v), v <= 한계 ? "안이다" : "넘는다"]);
    }
    const 상한 = (100_000n * 99_999n) / 2n;
    const lines = table(rows, [0, 1]);
    lines.push(`2^53 = ${comma(한계)} 이고 2^27 = ${comma(2n ** 27n)} 이다`);
    lines.push(
      `제약 상한 N = ${comma(100_000)} 의 답 상한 ${comma(상한)} 에 ${comma(한계 / 상한)} 을 곱해야 2^53 에 이른다`,
    );
    return lines.join("\n");
  },

  /** 불변식이 걸음마다 참인가 — 실행이 판정한다. */
  "inv-holds": () => {
    const rows: string[][] = [
      ["입력", "합치기 수", "판정한 합치기", "어긋난 합치기", "답"],
    ];
    for (const [name, arr] of 불변식_입력) {
      const r = 불변식_판정(arr);
      rows.push([
        name,
        comma(r.자리수),
        comma(r.판정한자리),
        comma(r.어긋난자리),
        comma(countInversions(arr)),
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4]);
    lines.push(
      "└ 「판정한 합치기」 는 합치기가 끝난 시점의 조각이 오름차순인지와 그 합치기가 센 개수가 정의대로 센 값과 같은지를 함께 본 횟수다",
    );
    return lines.join("\n");
  },

  /** 옮겨 적는 줄을 지우면. */
  "inv-mutant": () =>
    변이표(
      "제자리에 안 적는 판",
      안적는판,
      "옮겨적기",
      "지운 줄을 지나간 횟수",
      [
        ["전개 입력 4 1 5 2 6 3", WALK],
        ["음수가 섞인 −1 −3 0 −2", [-1, -3, 0, -2]],
        ["칸 두 개 2 1", [2, 1]],
        ["칸 네 개 4 3 2 1", [4, 3, 2, 1]],
      ],
    ),

  /** 답이 같은 두 입력을 합치기 자리마다 다시 본다. */
  "inv-mutant-steps": () => {
    const rows: string[][] = [
      [
        "입력",
        "합치기 수",
        "정본에서 오름차순이 아닌 합치기",
        "지운 판에서 오름차순이 아닌 합치기",
        "답",
      ],
    ];
    for (const [name, arr] of [
      ["칸 두 개 2 1", [2, 1]],
      ["칸 네 개 4 3 2 1", [4, 3, 2, 1]],
    ] as [string, number[]][]) {
      const 원본 = 오름차순_아닌_자리(arr, true);
      const 변이 = 오름차순_아닌_자리(arr, false);
      rows.push([
        name,
        comma(원본.자리수),
        comma(원본.어긋난자리),
        comma(변이.어긋난자리),
        comma(countInversions(arr)),
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4]);
    lines.push(
      "└ 답이 같은 두 입력이다. 그런데 지운 판은 합치기가 끝난 조각이 하나도 오름차순이 아니다 — 답이 맞은 것은 이 두 입력에서 우연히 겹친 것이다",
    );
    return lines.join("\n");
  },

  /** 칸 접근의 닫힌 형태. */
  "perf-closed": () => {
    const rows: string[][] = [
      [
        "입력",
        "칸 수 N",
        "견주기 C",
        "옮긴 칸 M",
        "실측 칸 접근",
        "2N + 2C + 4M",
        "판정",
      ],
    ];
    for (const [name, arr] of 비용_입력) {
      const c = 합치며_세기(arr);
      const 닫힌 = 2 * arr.length + 2 * c.견주기 + 4 * c.옮긴칸;
      rows.push([
        name,
        comma(arr.length),
        comma(c.견주기),
        comma(c.옮긴칸),
        comma(c.칸접근),
        comma(닫힌),
        닫힌 === c.칸접근 ? "같다" : "어긋난다",
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4, 5]);
    lines.push(
      "└ 「옮긴 칸」 은 합치기마다의 조각 길이를 다 더한 값이다. 입력이 달라도 이 값은 안 변한다",
    );
    return lines.join("\n");
  },

  /** 견주기의 하한과 상한. */
  "perf-bounds": () => {
    const rows: string[][] = [
      [
        "칸 수 N",
        "Σ 작은 쪽",
        "Σ 큰 쪽",
        "이미 오름차순",
        "완전한 내림차순",
        "번갈아 꺼내지는 입력",
        "상한 M − (N−1)",
      ],
    ];
    for (const N of [8, 64, 1_024, 100_000]) {
      const b = 비용_경계(N);
      rows.push([
        comma(N),
        comma(b.하한),
        comma(b.큰쪽),
        comma(b.오름),
        comma(b.내림),
        comma(b.최악),
        comma(b.상한),
      ]);
    }
    const lines = table(rows, [0, 1, 2, 3, 4, 5, 6]);
    lines.push(
      "└ 이미 오름차순이 Σ 큰 쪽과 같고 완전한 내림차순이 Σ 작은 쪽과 같다. 상한을 만드는 것은 따로 구성한 입력이다",
    );
    return lines.join("\n");
  },

  /** 최악을 만드는 입력. */
  "perf-worst": () => {
    const N = 64;
    const 최악 = 번갈아_꺼내지는(N);
    const rows: string[][] = [["입력", "값", "답", "견주기", "칸 접근"]];
    for (const [name, arr] of [
      ["이미 오름차순", Array.from({ length: N }, (_, q) => q)],
      ["완전한 내림차순", Array.from({ length: N }, (_, q) => N - 1 - q)],
      ["번갈아 꺼내지게 구성한 것", 최악],
    ] as [string, number[]][]) {
      const c = 합치며_세기(arr);
      rows.push([
        name,
        `${arr.slice(0, 8).join(" ")} …`,
        comma(c.답),
        comma(c.견주기),
        comma(c.칸접근),
      ]);
    }
    const b = 비용_경계(N);
    const lines = table(rows, [2, 3, 4]);
    lines.push(
      `└ 칸 ${comma(N)} 개에서 견주기의 상한이 ${comma(b.상한)} 이고 구성한 입력이 그 값을 낸다. 완전한 내림차순은 ${comma(b.내림)}${조사(comma(b.내림), "으로", "로")} 오히려 하한이다`,
    );
    return lines.join("\n");
  },

  /** 경쟁 설계와의 계수 대조. */
  "alt-counts": () => {
    const rows: string[][] = [
      [
        "값 범위 V",
        "합치며 세는 판",
        "펜윅 트리 판",
        "적은 쪽",
        "정본 저장 칸",
        "펜윅 저장 칸",
      ],
    ];
    for (const V of [
      값범위.가장좁게,
      저장경계.같아지는,
      저장경계.갈리는,
      값범위.가장넓게,
    ]) {
      const { 정본, 펜윅 } = measure(V);
      rows.push([
        comma(V),
        comma(정본.칸접근),
        comma(펜윅.칸접근),
        펜윅.칸접근 < 정본.칸접근 ? "펜윅 트리" : "합치며 세기",
        comma(정본.저장칸),
        comma(펜윅.저장칸),
      ]);
    }
    const lines = table(rows, [0, 1, 2, 4, 5]);
    lines.push(
      `└ 칸 수는 ${comma(N_ALT)}${조사(comma(N_ALT), "으로", "로")} 고정하고 값 범위만 바꾼다. 입력은 A[q] = (q × ${comma(곱수)}) mod V 이고 난수도 시드도 없다`,
    );
    return lines.join("\n");
  },

  /** 뒤집히는 자리를 양쪽에서 다시 잰다. */
  "alt-boundary": () => {
    const rows: string[][] = [
      ["값 범위 V", "합치며 세는 판", "펜윅 트리 판", "차이", "적은 쪽"],
    ];
    for (const V of [값범위.경계앞, 값범위.경계]) {
      const { 정본, 펜윅 } = measure(V);
      rows.push([
        comma(V),
        comma(정본.칸접근),
        comma(펜윅.칸접근),
        comma(펜윅.칸접근 - 정본.칸접근),
        펜윅.칸접근 < 정본.칸접근 ? "펜윅 트리" : "합치며 세기",
      ]);
    }
    const lines = table(rows, [0, 1, 2, 3]);
    lines.push(
      `└ 값 범위 ${comma(값범위.경계)} 에서 순서가 처음 뒤집힌다. 이분으로 좁힌 뒤 두 끝을 다시 잰 값이다`,
    );
    return lines.join("\n");
  },
};

/* ────────────────── 위 블록이 부르는 사본들 ────────────────── */

/** 가르는 자리를 바꿔 가며 계수를 내는 사본. */
function 계수_스윕(
  arr: number[],
  split: (lo: number, hi: number) => number,
): { 답: number; 견주기: number; 옮긴칸: number; 칸접근: number } {
  const N = arr.length;
  const a = arr.slice();
  let 칸접근 = 2 * N;
  const buffer = new Array<number>(N);
  let 견주기 = 0;
  let 옮긴칸 = 0;
  function merge(lo: number, mid: number, hi: number): number {
    옮긴칸 += hi - lo + 1;
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      견주기++;
      칸접근 += 2;
      if ((a[i] as number) <= (a[j] as number)) {
        buffer[k] = a[i] as number;
        k++;
        i++;
      } else {
        count += mid - i + 1;
        buffer[k] = a[j] as number;
        k++;
        j++;
      }
      칸접근 += 2;
    }
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
      칸접근 += 2;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
      칸접근 += 2;
    }
    for (let x = lo; x <= hi; x++) {
      a[x] = buffer[x] as number;
      칸접근 += 2;
    }
    return count;
  }
  function rec(lo: number, hi: number): number {
    if (lo >= hi) return 0;
    const mid = split(lo, hi);
    let c = rec(lo, mid);
    c += rec(mid + 1, hi);
    c += merge(lo, mid, hi);
    return c;
  }
  const 답 = rec(0, N - 1);
  return { 답, 견주기, 옮긴칸, 칸접근 };
}

/** 같은 값을 오른쪽으로 보내는 판의 걸음별 누적. `pause-tie-steps` 가 쓴다. */
function 동률_걸음마다(arr: number[]): { 누적: number }[] {
  const N = arr.length;
  const a = arr.slice();
  const buffer = new Array<number>(N);
  const 걸음: { 누적: number }[] = [{ 누적: 0 }];
  let 누적 = 0;
  function merge(lo: number, mid: number, hi: number): void {
    const 마지막 = lo === 0 && hi === N - 1;
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    let 견주기 = 0;
    while (i <= mid && j <= hi) {
      견주기++;
      if ((a[i] as number) < (a[j] as number)) {
        buffer[k] = a[i] as number;
        k++;
        i++;
      } else {
        count += mid - i + 1;
        buffer[k] = a[j] as number;
        k++;
        j++;
      }
      if (마지막 && 견주기 <= 3) 걸음.push({ 누적: 누적 + count });
    }
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
    }
    for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
    누적 += count;
    걸음.push({ 누적 });
  }
  function rec(lo: number, hi: number): void {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    rec(lo, mid);
    rec(mid + 1, hi);
    merge(lo, mid, hi);
  }
  rec(0, N - 1);
  return 걸음;
}

/** 불변식 판정에 쓰는 입력 목록 — 엣지 케이스를 함께 담는다. */
const 불변식_입력: [string, number[]][] = [
  ["빈 배열", []],
  ["칸 하나 42", [42]],
  ["칸 둘 오름 1 2", [1, 2]],
  ["칸 둘 내림 2 1", [2, 1]],
  ["전부 같은 2 2 2", [2, 2, 2]],
  ["전개 입력 4 1 5 2 6 3", WALK],
  ["음수가 섞인 −1 −3 0 −2", [-1, -3, 0, -2]],
  ["칸 64 개 생성식", BUILD],
];

/**
 * 합치기가 끝날 때마다 둘을 함께 본다 — ① 그 조각이 오름차순인가 ② 그 합치기가 센 개수가
 * 정의대로 센 값과 같은가. **표에 손으로 적지 않고 실행이 판정한다.**
 */
function 불변식_판정(arr: number[]): {
  자리수: number;
  판정한자리: number;
  어긋난자리: number;
} {
  const N = arr.length;
  if (N <= 1) return { 자리수: 0, 판정한자리: 0, 어긋난자리: 0 };
  const a = arr.slice();
  const 원본 = arr.slice();
  const buffer = new Array<number>(N);
  let 자리수 = 0;
  let 판정한자리 = 0;
  let 어긋난자리 = 0;

  function merge(lo: number, mid: number, hi: number): number {
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      if ((a[i] as number) <= (a[j] as number)) {
        buffer[k] = a[i] as number;
        k++;
        i++;
      } else {
        count += mid - i + 1;
        buffer[k] = a[j] as number;
        k++;
        j++;
      }
    }
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
    }
    for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
    return count;
  }

  function rec(lo: number, hi: number): number {
    if (lo >= hi) return 0;
    const mid = (lo + hi) >> 1;
    let c = rec(lo, mid);
    c += rec(mid + 1, hi);
    c += merge(lo, mid, hi);
    자리수++;
    판정한자리++;
    const 조각 = a.slice(lo, hi + 1);
    const 오름 = 조각.every((v, x) => x === 0 || (조각[x - 1] as number) <= v);
    const 정답 = 정의대로(원본.slice(lo, hi + 1)).답;
    if (!오름 || c !== 정답) 어긋난자리++;
    return c;
  }

  rec(0, N - 1);
  return { 자리수, 판정한자리, 어긋난자리 };
}

/**
 * 합치기가 끝날 때마다 그 조각이 오름차순인지 센다. `옮겨적기` 가 거짓이면 결과를 제자리에
 * 안 적는 판과 같은 절차다 — **그 사본이 변이와 같은 답을 내는지는 아래에서 확인한다.**
 */
function 오름차순_아닌_자리(
  arr: number[],
  옮겨적기: boolean,
): { 자리수: number; 어긋난자리: number; 답: number } {
  const N = arr.length;
  if (N <= 1) return { 자리수: 0, 어긋난자리: 0, 답: 0 };
  const a = arr.slice();
  const buffer = new Array<number>(N);
  let 자리수 = 0;
  let 어긋난자리 = 0;

  function merge(lo: number, mid: number, hi: number): number {
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      if ((a[i] as number) <= (a[j] as number)) {
        buffer[k] = a[i] as number;
        k++;
        i++;
      } else {
        count += mid - i + 1;
        buffer[k] = a[j] as number;
        k++;
        j++;
      }
    }
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
    }
    if (옮겨적기) for (let x = lo; x <= hi; x++) a[x] = buffer[x] as number;
    자리수++;
    const 조각 = a.slice(lo, hi + 1);
    if (!조각.every((v, x) => x === 0 || (조각[x - 1] as number) <= v))
      어긋난자리++;
    return count;
  }

  function rec(lo: number, hi: number): number {
    if (lo >= hi) return 0;
    const mid = (lo + hi) >> 1;
    let c = rec(lo, mid);
    c += rec(mid + 1, hi);
    c += merge(lo, mid, hi);
    return c;
  }

  const 답 = rec(0, N - 1);
  return { 자리수, 어긋난자리, 답 };
}

if (!중화됨) {
  for (const arr of [WALK, [-1, -3, 0, -2], [2, 1], [4, 3, 2, 1]]) {
    if (오름차순_아닌_자리(arr, false).답 !== 안적는판.countInversions(arr)) {
      throw new Error(
        `제자리에 안 적는 사본이 변이와 다른 답을 냈다 — ${값나열(arr)} 에서 갈린다`,
      );
    }
  }
  for (const arr of [WALK, [2, 2, 2, 2], [3, 1, 2, 3, 1]]) {
    const 걸음 = 동률_걸음마다(arr);
    const 마지막 = (걸음.at(-1) as { 누적: number }).누적;
    if (마지막 !== 동률판.countInversions(arr)) {
      throw new Error(
        `같은 값을 오른쪽으로 보낸 사본이 변이와 다른 답을 냈다 — ${값나열(arr)} 에서 갈린다`,
      );
    }
  }
}

/** 합치기마다 왼쪽과 오른쪽에서 번갈아 꺼내지도록 만든 입력. */
function 번갈아_꺼내지는(N: number): number[] {
  const out = new Array<number>(N).fill(0);
  const build = (lo: number, hi: number, vals: number[]): void => {
    if (lo === hi) {
      out[lo] = vals[0] as number;
      return;
    }
    const mid = (lo + hi) >> 1;
    const left: number[] = [];
    const right: number[] = [];
    for (const [t, v] of vals.entries()) {
      if (t % 2 === 0) left.push(v);
      else right.push(v);
    }
    build(lo, mid, left);
    build(mid + 1, hi, right);
  };
  build(
    0,
    N - 1,
    Array.from({ length: N }, (_, q) => q),
  );
  return out;
}

/** 견주기의 하한·상한과 세 입력의 실측. */
function 비용_경계(N: number): {
  하한: number;
  큰쪽: number;
  상한: number;
  오름: number;
  내림: number;
  최악: number;
} {
  let 하한 = 0;
  let 큰쪽 = 0;
  let 옮긴칸 = 0;
  const walk = (lo: number, hi: number): void => {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    walk(lo, mid);
    walk(mid + 1, hi);
    하한 += Math.min(mid - lo + 1, hi - mid);
    큰쪽 += Math.max(mid - lo + 1, hi - mid);
    옮긴칸 += hi - lo + 1;
  };
  walk(0, N - 1);
  const 오름 = 합치며_세기(Array.from({ length: N }, (_, q) => q)).견주기;
  const 내림 = 합치며_세기(
    Array.from({ length: N }, (_, q) => N - 1 - q),
  ).견주기;
  const 최악 = 합치며_세기(번갈아_꺼내지는(N)).견주기;
  return { 하한, 큰쪽, 상한: 옮긴칸 - (N - 1), 오름, 내림, 최악 };
}

/** 닫힌 형태 대조에 쓰는 입력 목록. */
const 비용_입력: [string, number[]][] = [
  ["전개 입력", WALK],
  ["칸 64 개 생성식", BUILD],
  ["칸 1,024 개 오름차순", Array.from({ length: 1024 }, (_, q) => q)],
  ["칸 1,024 개 내림차순", Array.from({ length: 1024 }, (_, q) => 1023 - q)],
  ["칸 1,024 개 번갈아 꺼내지는 입력", 번갈아_꺼내지는(1024)],
  [
    "칸 100,000 개 내림차순",
    Array.from({ length: 100_000 }, (_, q) => 99_999 - q),
  ],
  ["칸 100,000 개 번갈아 꺼내지는 입력", 번갈아_꺼내지는(100_000)],
];
