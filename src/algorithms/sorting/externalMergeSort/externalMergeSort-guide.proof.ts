/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/externalMergeSort/externalMergeSort-guide.md
 *
 * **이 편의 정본은 실제로 파일을 읽고 적는다.** 그래서 여기 있는 실행은 전부 임시 디렉터리에
 * 파일을 만들어 정본을 그대로 부른 것이고, 그 결과를 모듈 최상위에서 미리 받아 둔다
 * (`PROOFS` 의 함수는 동기라 안에서 `await` 을 할 수 없다).
 *
 * **세는 사본이 넷 있다.** 정본은 계수를 내보내지 않으므로 ① 읽고 적은 정수 개수와 메모리에
 * 든 칸을 세는 사본(`-guide.alt.ts` 의 `한번에_합치기`) ② 모든 조각의 머리를 견줘 최솟값을
 * 고르는 사본(`모두_견주기`) ③ 조각 전체를 힙에 올리는 변이와 같은 절차의 사본
 * (`전부_올린_메모리`) ④ 문자열 순서로 정렬하는 변이와 같은 조각을 만드는 사본
 * (`문자열_조각`)이 그 몫을 진다. **넷 다 답을 정본이나 변이와 대조한 뒤에만 계수를 쓴다** —
 * 답이 다른 구현으로 잰 계수는 저울질이 아니라 다른 문제의 값이다.
 *
 * **변이가 아무것도 안 바꾸는지 검사하는 자리는 중화 실행을 비켜 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 이 정본을 그대로 돌려주므로(중화), 그 상태에서
 * 「변이가 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이
 * 모듈의 함수가 정본과 **같은 객체인가**로 알아낸다.
 */
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadMutant } from "../../../../tools/check-proof.ts";
import {
  대조_k,
  대조_M,
  대조_N,
  메모리_칸,
  생성식,
  여러바퀴_합치기,
  조각수,
  한번에_합치기,
} from "./externalMergeSort-guide.alt.ts";
import { externalMergeSort } from "./externalMergeSort-guide.ref.ts";

const REF = new URL("./externalMergeSort-guide.ref.ts", import.meta.url)
  .pathname;

type Ref = {
  externalMergeSort: (
    inputPath: string,
    outputPath: string,
    memoryLimit: number,
  ) => Promise<string>;
};

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

const 서수말 = [
  "첫",
  "둘",
  "셋",
  "넷",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
  "열",
];

/** 1 부터 센 자리를 「첫째 · 둘째 …」로. 캡션의 서수를 손으로 적지 않으려고 쓴다. */
const 서수 = (n: number): string => `${서수말[n - 1] ?? String(n)}째`;

/** 머리줄에서 그 열의 자리를 찾아 서수로. 열을 옮겨도 캡션이 따라온다. */
const 열자리 = (rows: string[][], 이름: string): string =>
  서수((rows[0] as string[]).indexOf(이름) + 1);

/** 배수를 소수 둘째 자리까지. 열 폭이 행마다 흔들리지 않게 자릿수를 고정한다. */
const 배수 = (a: number, b: number): string =>
  `${(a / b).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 배`;

/* ────────────────────── 정본을 파일 위에서 부른다 ────────────────────── */

const TMP = mkdtempSync(join(tmpdir(), "ems-proof-"));
let 일련 = 0;

/** 정본이나 변이를 실제 파일에 대고 실행해 출력 파일의 내용을 정수 배열로 돌려준다. */
async function 실행(
  impl: Ref,
  values: number[],
  M: number,
  미리?: string,
): Promise<{ 답: number[]; 안덮인_바이트: number }> {
  const at = 일련++;
  const input = join(TMP, `case${at}.in`);
  const output = join(TMP, `case${at}.out`);
  await Bun.write(input, `${values.join("\n")}\n`);
  const 미리_바이트 = 미리 === undefined ? 0 : 미리.length;
  if (미리 !== undefined) await Bun.write(output, 미리);
  await impl.externalMergeSort(input, output, M);
  const text = await Bun.file(output).text();
  // 새로 적을 내용이 이미 있던 파일보다 짧으면 그 차이만큼이 뒤에 남는다.
  const 새내용 = `${[...values].sort((a, b) => a - b).join("\n")}\n`.length;
  return {
    답: text
      .split("\n")
      .filter((s) => s.length > 0)
      .map(Number),
    안덮인_바이트: Math.max(0, 미리_바이트 - 새내용),
  };
}

const 나열 = (xs: number[]): string => xs.join(" ");

/* ────────────────────────── 세는 사본 ────────────────────────── */

/** 정본과 같은 규칙으로 조각을 만든다. 조각의 내용을 보이는 자리가 쓴다. */
function 조각내기(values: number[], M: number): number[][] {
  const out: number[][] = [];
  let chunk: number[] = [];
  let i = 0;
  for (;;) {
    const value = i < values.length ? (values[i++] as number) : null;
    if (value !== null) chunk.push(value);
    const full = chunk.length === M;
    const tail = value === null && chunk.length > 0;
    if (full || tail) {
      chunk.sort((a, b) => a - b);
      out.push(chunk);
      chunk = [];
    }
    if (value === null) break;
  }
  return out;
}

/** 「문자열 순서로 정렬하는 판」이 만드는 조각. 견주개만 뺀 사본이다. */
function 문자열_조각(values: number[], M: number): number[][] {
  const out: number[][] = [];
  let chunk: number[] = [];
  let i = 0;
  for (;;) {
    const value = i < values.length ? (values[i++] as number) : null;
    if (value !== null) chunk.push(value);
    const full = chunk.length === M;
    const tail = value === null && chunk.length > 0;
    if (full || tail) {
      chunk.sort();
      out.push(chunk);
      chunk = [];
    }
    if (value === null) break;
  }
  return out;
}

/** 힙을 안 쓰고 **모든 조각의 머리를 견줘** 최솟값을 고르는 사본. 견주기만 센다. */
function 모두_견주기(조각들: number[][]): { 견주기: number; 답: number[] } {
  const 자리: number[] = 조각들.map(() => 0);
  let 견주기 = 0;
  const out: number[] = [];
  for (;;) {
    let best = -1;
    for (let r = 0; r < 조각들.length; r++) {
      const 조각 = 조각들[r] as number[];
      if ((자리[r] as number) >= 조각.length) continue;
      if (best === -1) {
        best = r;
        continue;
      }
      견주기++;
      const 이쪽 = 조각[자리[r] as number] as number;
      const 저쪽 = (조각들[best] as number[])[자리[best] as number] as number;
      if (이쪽 < 저쪽) best = r;
    }
    if (best === -1) break;
    const 조각 = 조각들[best] as number[];
    out.push(조각[자리[best] as number] as number);
    자리[best] = (자리[best] as number) + 1;
  }
  return { 견주기, 답: out };
}

/** 「조각 전체를 힙에 올리는 판」이 메모리에 드는 칸. 그 판의 답도 함께 만든다. */
function 전부_올린_메모리(
  values: number[],
  M: number,
): { 최대_정수_칸: number; 답: number[] } {
  const 조각들 = 조각내기(values, M);
  let 담긴것 = 0;
  for (const 조각 of 조각들) 담긴것 += 조각.length;
  return {
    최대_정수_칸: Math.max(Math.min(values.length, M), 담긴것),
    답: 모두_견주기(조각들).답,
  };
}

/** 생성식이 만드는 입력 파일의 바이트 수. 정수 하나에 줄바꿈 하나가 붙는다. */
function 파일_바이트(N: number): number {
  let bytes = 0;
  for (let i = 0; i < N; i++) {
    bytes += String(((i * 48_271) % 1_000_003) - 500_000).length + 1;
  }
  return bytes;
}

/* ────────────────────────── 공통 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. 정수 여덟에 조각 크기 3 이라 조각이 셋 생기고, 여덟이 셋의
 * 배수가 아니라 **자투리 갈래가 실제로 실행된다.**
 */
const WALK = [5, 1, 8, 3, 7, 2, 9, 4];
const WALK_M = 3;

const 조각들 = 조각내기(WALK, WALK_M);

/* ────────────────────────── 변이 ────────────────────────── */

/** 조각을 정렬할 때 견주개를 빼서 문자열 순서로 정렬하는 판. */
const 문자열정렬판 = await loadMutant<Ref>(REF, {
  swap: [/^ {6}chunk\.sort\(\(a, b\) => a - b\);$/, "      chunk.sort();"],
});

/** 입력이 끝났을 때 남은 자투리를 적지 않는 판. */
const 자투리없는판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}const tail = value === null && chunk\.length > 0;$/,
    "    const tail = false;",
  ],
});

/** 조각마다 첫 값 하나가 아니라 조각 전체를 힙에 올리는 판. */
const 전부올리는판 = await loadMutant<Ref>(REF, {
  swap: [
    /^ {4}if \(value !== null\) heap\.push\(\{ value, run \}\);$/,
    "    for (let v = value; v !== null; v = await (readers[run] as LineReader).next()) heap.push({ value: v, run });",
  ],
});

/** 출력 파일을 미리 비우지 않는 판. */
const 안비우는판 = await loadMutant<Ref>(REF, {
  drop: /^ {2}await Bun\.write\(outputPath, ""\);$/,
});

/** 꺼낸 자리를 그 조각의 다음 값으로 다시 채우지 않는 판. */
const 안채우는판 = await loadMutant<Ref>(REF, {
  drop: /^ {4}if \(next !== null\) heap\.push\(\{ value: next, run \}\);$/,
});

/**
 * 중화 실행인가 — `loadMutant` 이 변이를 적용하지 않고 정본 모듈을 그대로 돌려주면 두 함수가
 * **같은 객체**다. 중화 상태에서 아래 자기검사를 실행하면 언제나 던지게 되고, 그러면
 * `check-proof` 의 중화 대조가 이 편에서는 한 번도 실행되지 않는다.
 */
const 중화됨 = 문자열정렬판.externalMergeSort === externalMergeSort;

/* ────────────────────── 변이 표가 쓰는 입력 묶음 ────────────────────── */

interface 줄 {
  이름: string;
  값: number[];
  M: number;
  미리?: string;
}

/** 문자열 순서 정렬 변이를 걸어 볼 네 입력. 한 자리 수만 든 입력에서는 답이 안 갈린다. */
const 정렬입력: 줄[] = [
  { 이름: "전개가 쓰는 한 자리 수 여덟", 값: WALK, M: WALK_M },
  { 이름: "두 자리 수가 섞인 여덟", 값: [5, 1, 80, 3, 7, 20, 9, 4], M: 3 },
  { 이름: "열 이상만 든 여섯", 값: [30, 7, 25, 9, 100, 8], M: 2 },
  { 이름: "정수 하나뿐인 입력", 값: [42], M: 1 },
];

/** 자투리 변이를 걸어 볼 네 입력. 개수가 조각 크기의 배수면 자투리 갈래를 안 지나간다. */
const 자투리입력: 줄[] = [
  { 이름: "전개가 쓰는 여덟 · 조각 크기 3", 값: WALK, M: WALK_M },
  { 이름: "배수인 아홉 · 조각 크기 3", 값: [5, 1, 8, 3, 7, 2, 9, 4, 6], M: 3 },
  { 이름: "배수인 여섯 · 조각 크기 2", 값: [3, 1, 3, 1, 3, 1], M: 2 },
  { 이름: "배수가 아닌 다섯 · 조각 크기 2", 값: [4, 2, 5, 1, 3], M: 2 },
];

/** 조각 전체를 올리는 변이를 걸어 볼 네 입력. 어느 입력에서도 답이 안 갈린다. */
const 전부올리기입력: 줄[] = [
  { 이름: "전개가 쓰는 여덟 · 조각 크기 3", 값: WALK, M: WALK_M },
  { 이름: "조각이 하나인 여덟 · 조각 크기 100", 값: WALK, M: 100 },
  { 이름: "조각이 여덟인 여덟 · 조각 크기 1", 값: WALK, M: 1 },
  { 이름: "음수가 섞인 여섯 · 조각 크기 2", 값: [-3, 1, -1, 2, 0, -2], M: 2 },
];

/** 출력을 미리 비우지 않는 변이. 이미 있던 파일이 길수록 꼬리가 남는다. */
const 비우기입력: 줄[] = [
  { 이름: "출력 파일이 아직 없다", 값: WALK, M: WALK_M },
  {
    이름: "앞서 정수 스물을 적어 둔 파일",
    값: WALK,
    M: WALK_M,
    미리: `${Array.from({ length: 20 }, (_, i) => 100 + i).join("\n")}\n`,
  },
  { 이름: "앞서 정수 하나를 적어 둔 파일", 값: WALK, M: WALK_M, 미리: "7\n" },
  {
    이름: "앞서 세 자리 수 하나를 적어 둔 파일",
    값: WALK,
    M: WALK_M,
    미리: "123\n",
  },
];

/** 다시 채우지 않는 변이. 조각마다 첫 값 하나씩만 남는다. */
const 되채우기입력: 줄[] = [
  { 이름: "전개가 쓰는 여덟 · 조각 크기 3", 값: WALK, M: WALK_M },
  { 이름: "조각이 하나인 여덟 · 조각 크기 100", 값: WALK, M: 100 },
  { 이름: "정수 하나뿐인 입력 · 조각 크기 1", 값: [42], M: 1 },
  { 이름: "조각이 여덟인 여덟 · 조각 크기 1", 값: WALK, M: 1 },
];

/** 그 줄을 이 입력이 몇 번 지나가는가. 실행으로 센다. */
function 지나간_횟수(
  값: number[],
  M: number,
): { 정렬: number; 자투리: number; 초기올리기: number; 되채우기: number } {
  const rs = 조각내기(값, M);
  return {
    정렬: rs.length,
    자투리: 값.length === 0 || 값.length % M === 0 ? 0 : 1,
    초기올리기: rs.length,
    되채우기: 값.length - rs.length,
  };
}

type 자리이름 = "정렬" | "자투리" | "초기올리기" | "되채우기";

/** 변이 하나를 입력 여럿에 적용해 정본과 나란히 놓는다. */
async function 변이표(
  label: string,
  impl: Ref,
  줄들: 줄[],
  siteLabel: string,
  site: 자리이름 | "안덮인_바이트",
): Promise<string> {
  const rows: string[][] = [["입력", "정본", label, siteLabel, "판정"]];
  for (const 줄 of 줄들) {
    const ok = await 실행({ externalMergeSort }, 줄.값, 줄.M, 줄.미리);
    const bad = await 실행(impl, 줄.값, 줄.M, 줄.미리);
    const 횟수 =
      site === "안덮인_바이트"
        ? bad.안덮인_바이트
        : 지나간_횟수(줄.값, 줄.M)[site];
    rows.push([
      줄.이름,
      나열(ok.답),
      나열(bad.답),
      comma(횟수),
      나열(ok.답) === 나열(bad.답) ? "같다" : "어긋난다",
    ]);
  }
  return table(rows, [3]).join("\n");
}

const 문자열정렬표 = await 변이표(
  "문자열 순서로 정렬하는 판",
  문자열정렬판,
  정렬입력,
  "정렬한 조각 수",
  "정렬",
);
const 자투리표 = await 변이표(
  "자투리를 안 적는 판",
  자투리없는판,
  자투리입력,
  "자투리 갈래를 지나간 횟수",
  "자투리",
);
const 전부올리기표 = await 변이표(
  "조각 전체를 올리는 판",
  전부올리는판,
  전부올리기입력,
  "그 줄을 지나간 횟수",
  "초기올리기",
);
const 비우기표 = await 변이표(
  "출력을 안 비우는 판",
  안비우는판,
  비우기입력,
  "새 내용이 덮지 못한 바이트",
  "안덮인_바이트",
);
const 되채우기표 = await 변이표(
  "다시 안 채우는 판",
  안채우는판,
  되채우기입력,
  "다시 채운 횟수",
  "되채우기",
);

/* ─────────────── 사본과 변이가 같은 절차인지 답으로 확인 ─────────────── */

if (!중화됨) {
  const 갈리는_변이: { label: string; impl: Ref; 줄: 줄 }[] = [
    {
      label: "문자열 순서로 정렬하는 판",
      impl: 문자열정렬판,
      줄: 정렬입력[1] as 줄,
    },
    {
      label: "자투리를 안 적는 판",
      impl: 자투리없는판,
      줄: 자투리입력[0] as 줄,
    },
    { label: "출력을 안 비우는 판", impl: 안비우는판, 줄: 비우기입력[1] as 줄 },
    { label: "다시 안 채우는 판", impl: 안채우는판, 줄: 되채우기입력[0] as 줄 },
  ];
  for (const { label, impl, 줄 } of 갈리는_변이) {
    const ok = await 실행({ externalMergeSort }, 줄.값, 줄.M, 줄.미리);
    const bad = await 실행(impl, 줄.값, 줄.M, 줄.미리);
    if (나열(ok.답) === 나열(bad.답)) {
      throw new Error(`${label} 변이가 그 입력에서 답을 바꾸지 못했다`);
    }
  }
  for (const 줄 of 전부올리기입력) {
    const bad = await 실행(전부올리는판, 줄.값, 줄.M);
    if (나열(전부_올린_메모리(줄.값, 줄.M).답) !== 나열(bad.답)) {
      throw new Error(`전부 올리는 사본이 변이와 다른 답을 냈다 — ${줄.이름}`);
    }
  }
  for (const 줄 of 정렬입력) {
    const bad = await 실행(문자열정렬판, 줄.값, 줄.M);
    if (나열(모두_견주기(문자열_조각(줄.값, 줄.M)).답) !== 나열(bad.답)) {
      throw new Error(`문자열 조각 사본이 변이와 다른 답을 냈다 — ${줄.이름}`);
    }
  }
}

for (const [값, M] of [
  [WALK, WALK_M],
  [[5, 1, 8, 3, 7, 2, 9, 4, 6], 3],
  [[-3, 1, -1, 2, 0, -2], 2],
] as [number[], number][]) {
  const 정답 = 나열([...값].sort((a, b) => a - b));
  if (나열((await 실행({ externalMergeSort }, 값, M)).답) !== 정답) {
    throw new Error("정본이 정렬 결과와 다른 답을 냈다");
  }
  if (나열(모두_견주기(조각내기(값, M)).답) !== 정답) {
    throw new Error("모두 견주는 사본이 정본과 다른 답을 냈다");
  }
  const c = 한번에_합치기(값, M);
  if (c.읽은 + c.적은 !== 4 * 값.length) {
    throw new Error("세는 사본의 입출력이 4N 이 아니다");
  }
}

/* ─────────────── 블록 크기 실측 ─────────────── */

const 블록입력 = join(TMP, "block.in");
await Bun.write(블록입력, `${생성식(대조_N).join("\n")}\n`);
const 블록크기: number[] = [];
{
  const reader = Bun.file(블록입력).stream().getReader();
  for (;;) {
    const 받은것 = await reader.read();
    if (받은것.done) break;
    블록크기.push(받은것.value.length);
  }
}
const 블록_바이트 = 블록크기[0] as number;
const 블록입력_바이트 = 블록크기.reduce((a, b) => a + b, 0);

/* ─────────────── 대조 계수 ─────────────── */

const 대조값 = 생성식(대조_N);
const 한번에 = 한번에_합치기(대조값, 대조_M);
const 여러바퀴 = 여러바퀴_합치기(대조값, 대조_M, 대조_k);
const 한번에_입출력 = 한번에.읽은 + 한번에.적은;
const 여러바퀴_입출력 = 여러바퀴.읽은 + 여러바퀴.적은;

/** 입출력 한 번을 견주기 `c/1000` 번으로 환산했을 때 두 판의 순서가 뒤집히는 첫 `c`. */
function 환산_경계(): number {
  for (let c = 0; c <= 1_000_000; c++) {
    const a = 한번에_입출력 * c + 한번에.합치기_견주기 * 1000;
    const b = 여러바퀴_입출력 * c + 여러바퀴.합치기_견주기 * 1000;
    if (a < b) return c;
  }
  return -1;
}
const 경계c = 환산_경계();

/* ─────────────── 미리 받아 두는 실행 결과 ─────────────── */

const 결과입력: [string, number[], number][] = [
  ["전개가 쓰는 여덟", WALK, WALK_M],
  ["이미 오름차순인 여섯", [1, 2, 3, 4, 5, 6], 2],
  ["중복이 많은 여섯", [3, 1, 3, 1, 3, 1], 2],
  ["음수가 섞인 여섯", [-3, 1, -1, 2, 0, -2], 2],
  ["정수 하나", [42], 1],
  ["조각이 하나인 다섯", [4, 2, 5, 1, 3], 100],
  ["정수마다 조각 하나인 여덟", [3, 1, 4, 1, 5, 9, 2, 6], 1],
];

const 결과답 = new Map<string, number[]>();
for (const [이름, 값, M] of 결과입력) {
  결과답.set(이름, (await 실행({ externalMergeSort }, 값, M)).답);
}

const 경계입력: [string, number[], number, string][] = [
  ["정수가 하나뿐이다", [42], 1, "조각이 하나이고 합치기가 값 하나로 끝난다"],
  [
    "조각 크기가 정수 개수보다 크다",
    [4, 2, 5, 1, 3],
    100,
    "조각이 하나라 힙에 항목이 하나뿐이다",
  ],
  [
    "조각 크기가 1 이다",
    [5, 1, 8, 3],
    1,
    "정수마다 조각이 하나라 힙이 입력 전체만큼 커진다",
  ],
  [
    "값이 전부 같다",
    [7, 7, 7, 7],
    2,
    "꼭대기를 고르는 견주기가 모두 같은 값 사이에서 일어난다",
  ],
  [
    "이미 오름차순이다",
    [1, 2, 3, 4, 5, 6],
    2,
    "조각 하나를 다 낸 뒤에야 다음 조각으로 넘어간다",
  ],
  [
    "음수와 0 이 섞여 있다",
    [-3, 1, -1, 2, 0, -2],
    2,
    "부호가 갈려도 견주개가 그대로 쓰인다",
  ],
];

const 경계답 = new Map<string, number[]>();
for (const [이름, 값, M] of 경계입력) {
  경계답.set(이름, (await 실행({ externalMergeSort }, 값, M)).답);
}

const 불변식입력: [string, number[], number][] = [
  ["전개가 쓰는 여덟 · 조각 크기 3", WALK, WALK_M],
  ["정수 100 · 조각 크기 7", 생성식(100), 7],
  ["정수 1,000 · 조각 크기 1", 생성식(1_000), 1],
  ["정수 1,000 · 조각 크기 1,000", 생성식(1_000), 1_000],
  ["정수 10,000 · 조각 크기 32", 생성식(10_000), 32],
];

/** 걸음마다 세 성질을 실행이 판정한다. 손으로 적지 않는다. */
function 불변식_판정(
  값: number[],
  M: number,
): {
  걸음: number;
  오름차순_깨짐: number;
  합_어긋남: number;
  꼭대기_어긋남: number;
} {
  const 조각목록 = 조각내기(값, M);
  const 자리: number[] = 조각목록.map(() => 0);
  const heap: { value: number; run: number }[] = [];
  for (const [i, 조각] of 조각목록.entries()) {
    if (조각.length > 0) {
      heap.push({ value: 조각[0] as number, run: i });
      자리[i] = 1;
    }
  }
  let 걸음 = 0;
  let 오름차순_깨짐 = 0;
  let 합_어긋남 = 0;
  let 꼭대기_어긋남 = 0;
  let 앞값 = Number.NEGATIVE_INFINITY;
  let 낸개수 = 0;
  while (heap.length > 0) {
    걸음++;
    let at = 0;
    for (let i = 1; i < heap.length; i++) {
      const 이것 = heap[i] as { value: number };
      const 저것 = heap[at] as { value: number };
      if (이것.value < 저것.value) at = i;
    }
    const 꼭대기 = heap[at] as { value: number; run: number };
    let 최소 = 꼭대기.value;
    for (const [i, 조각] of 조각목록.entries()) {
      for (let j = 자리[i] as number; j < 조각.length; j++) {
        if ((조각[j] as number) < 최소) 최소 = 조각[j] as number;
      }
    }
    if (최소 !== 꼭대기.value) 꼭대기_어긋남++;
    if (꼭대기.value < 앞값) 오름차순_깨짐++;
    앞값 = 꼭대기.value;
    heap.splice(at, 1);
    낸개수++;
    const 조각 = 조각목록[꼭대기.run] as number[];
    if ((자리[꼭대기.run] as number) < 조각.length) {
      heap.push({
        value: 조각[자리[꼭대기.run] as number] as number,
        run: 꼭대기.run,
      });
      자리[꼭대기.run] = (자리[꼭대기.run] as number) + 1;
    }
    let 안읽은 = 0;
    for (const [i, r] of 조각목록.entries())
      안읽은 += r.length - (자리[i] as number);
    if (heap.length + 안읽은 + 낸개수 !== 값.length) 합_어긋남++;
  }
  return { 걸음, 오름차순_깨짐, 합_어긋남, 꼭대기_어긋남 };
}

const 비용입력: [string, number[], number][] = [
  ["전개가 쓰는 여덟", WALK, WALK_M],
  ["정수 1,000", 생성식(1_000), 32],
  ["정수 10,000", 생성식(10_000), 100],
  ["정수 100,000", 생성식(100_000), 100],
];

const 최악후보: [string, number[], number][] = [
  ["뒤섞인 입력 · 조각 크기 100", 생성식(10_000), 100],
  [
    "이미 오름차순인 입력 · 조각 크기 100",
    [...생성식(10_000)].sort((a, b) => a - b),
    100,
  ],
  [
    "내림차순인 입력 · 조각 크기 100",
    [...생성식(10_000)].sort((a, b) => b - a),
    100,
  ],
  ["값이 전부 같은 입력 · 조각 크기 100", new Array(10_000).fill(7), 100],
  ["뒤섞인 입력 · 조각 크기 10,000", 생성식(10_000), 10_000],
  ["뒤섞인 입력 · 조각 크기 1", 생성식(10_000), 1],
];

/* ────────────────────────── 증명 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 제약 상한에서 전부 메모리에 올리는 판과 이 절차가 드는 칸. */
  "concept-scale": () => {
    const N = 10_000_000;
    const 파일 = 파일_바이트(N);
    const rows: string[][] = [
      ["무엇", "정수 칸", "바이트"],
      ["입력 파일에 든 정수", comma(N), comma(파일)],
      ["전부 메모리에 올리는 판의 배열", comma(N), comma(8 * N)],
      [
        "이 절차 — 조각 크기 1,000",
        comma(메모리_칸(N, 1_000)),
        comma(8 * 메모리_칸(N, 1_000)),
      ],
      [
        "이 절차 — 조각 크기 3,162",
        comma(메모리_칸(N, 3_162)),
        comma(8 * 메모리_칸(N, 3_162)),
      ],
    ];
    const lines = table(rows, [1, 2]);
    lines.push(
      `정수 하나가 배정밀도로 8 바이트다. 전부 올리는 판이 조각 크기 1,000 짜리 절차보다 칸을 ${배수(N, 메모리_칸(N, 1_000))} 더 든다`,
    );
    return lines.join("\n");
  },

  /** 전부 올리는 판이 드는 칸과 이 절차가 드는 칸을 규모별로. */
  "build-naive": () => {
    const rows: string[][] = [
      ["정수 개수 N", "전부 올리는 판", "조각 수 R", "이 절차", "몇 배"],
    ];
    for (const N of [1_000, 10_000, 100_000, 1_000_000, 10_000_000]) {
      rows.push([
        comma(N),
        comma(N),
        comma(조각수(N, 1_000)),
        comma(메모리_칸(N, 1_000)),
        배수(N, 메모리_칸(N, 1_000)),
      ]);
    }
    const lines = table(rows, [0, 1, 2, 3, 4]);
    lines.push(
      "조각 크기를 1,000 으로 고정하고 잰 값이다. 전부 올리는 판은 정수 개수를 그대로 들고, 이 절차는 조각 크기와 조각 수 중 큰 쪽만 든다",
    );
    return lines.join("\n");
  },

  /** 전개 입력을 조각으로 끊어 정렬한 결과. */
  "build-chunk": () => {
    const rows: string[][] = [["조각", "읽은 값", "정렬한 뒤", "값 개수"]];
    let at = 0;
    for (const [i, 조각] of 조각들.entries()) {
      const 원본 = WALK.slice(at, at + 조각.length);
      at += 조각.length;
      rows.push([String(i), 나열(원본), 나열(조각), String(조각.length)]);
    }
    const lines = table(rows, [3]);
    const 최대 = Math.max(...조각들.map((r) => r.length));
    lines.push(
      `정수 ${comma(WALK.length)} 개가 조각 ${조각들.length} 개가 됐고, 한 번에 메모리에 든 값은 많아야 ${최대} 개다`,
    );
    return lines.join("\n");
  },

  /** 모든 조각의 머리를 견주는 판과 힙을 쓰는 판. */
  "build-two-ways": () => {
    const rows: string[][] = [
      [
        "정수 개수",
        "조각 크기",
        "조각 수",
        "모두 견주는 판",
        "힙을 쓰는 판",
        "몇 배",
      ],
    ];
    const 케이스: [number[], number][] = [
      [WALK, WALK_M],
      [생성식(1_000), 100],
      [생성식(10_000), 100],
      [생성식(100_000), 100],
    ];
    for (const [값, M] of 케이스) {
      const 선형 = 모두_견주기(조각내기(값, M));
      const 힙 = 한번에_합치기(값, M);
      rows.push([
        comma(값.length),
        comma(M),
        comma(조각수(값.length, M)),
        comma(선형.견주기),
        comma(힙.합치기_견주기),
        배수(선형.견주기, 힙.합치기_견주기),
      ]);
    }
    const lines = table(rows, [0, 1, 2, 3, 4, 5]);
    lines.push(
      `조각이 ${조각들.length} 개뿐인 전개 입력에서는 두 판의 견주기가 나란하다. 조각 수가 늘면서 갈리기 시작한다`,
    );
    return lines.join("\n");
  },

  /** 조각 크기를 바꿔 가며 메모리에 든 칸과 입출력을 실측한다. */
  "build-memory-sweep": () => {
    const N = 10_000;
    const 값 = 생성식(N);
    const rows: string[][] = [
      ["조각 크기 M", "조각 수 R", "메모리에 든 칸", "입출력"],
    ];
    for (const M of [1, 5, 25, 50, 100, 125, 200, 500, 2_000, 10_000]) {
      const c = 한번에_합치기(값, M);
      rows.push([
        comma(M),
        comma(c.조각),
        comma(c.최대_정수_칸),
        comma(c.읽은 + c.적은),
      ]);
    }
    let 가장작은 = Number.POSITIVE_INFINITY;
    let 가장작은M = 0;
    for (let M = 1; M <= N; M++) {
      const m = 메모리_칸(N, M);
      if (m < 가장작은) {
        가장작은 = m;
        가장작은M = M;
      }
    }
    const lines = table(rows, [0, 1, 2, 3]);
    lines.push(
      `조각 크기 1 부터 ${comma(N)} 까지 전부 재면 칸이 가장 적은 조각 크기는 ${comma(가장작은M)}${조사(comma(가장작은M), "이", "가")} 되고 그때 ${comma(가장작은)} 칸이다. 입출력은 어느 조각 크기에서도 ${comma(4 * N)} 으로 나란하다`,
    );
    return lines.join("\n");
  },

  /** 조각 파일 셋의 바이트와 내용. */
  "walk-runs": () => {
    const 입력_바이트 = `${WALK.join("\n")}\n`.length;
    const rows: string[][] = [["파일", "내용", "바이트"]];
    rows.push(["입력 파일", 나열(WALK), comma(입력_바이트)]);
    let 합 = 0;
    for (const [i, 조각] of 조각들.entries()) {
      const bytes = `${조각.join("\n")}\n`.length;
      합 += bytes;
      rows.push([`조각 out.run${i}`, 나열(조각), comma(bytes)]);
    }
    const lines = table(rows, [2]);
    lines.push(
      `조각 ${조각들.length} 개의 바이트를 더하면 ${comma(합)} 이라 입력 파일과 나란하다. 정수 ${WALK.length} 개와 줄바꿈 ${WALK.length} 개다`,
    );
    return lines.join("\n");
  },

  /** 힙을 처음 채우는 동안 메모리에 든 정수. */
  "walk-heap-init": () => {
    const rows: string[][] = [
      ["올린 순서", "조각", "그 조각의 첫 값", "힙 배열", "메모리에 든 정수"],
    ];
    const heap: number[] = [];
    for (const [i, 조각] of 조각들.entries()) {
      heap.push(조각[0] as number);
      rows.push([
        String(i + 1),
        String(i),
        String(조각[0]),
        나열(heap),
        String(heap.length),
      ]);
    }
    const lines = table(rows, [0, 1, 2, 4]);
    lines.push(
      `조각 셋에 든 정수 ${WALK.length} 개 가운데 메모리에 올라온 것은 ${조각들.length} 개이고, 나머지 ${WALK.length - 조각들.length} 개는 아직 디스크에 있다`,
    );
    return lines.join("\n");
  },

  /** 걸음마다 값이 어디에 있는가 — 힙 · 조각 · 출력. */
  "walk-three-places": () => {
    const rows: string[][] = [
      [
        "걸음",
        "출력에 낸 값",
        "힙에 든 개수",
        "조각에 안 읽은 개수",
        "출력에 낸 개수",
        "셋의 합",
      ],
    ];
    const 자리: number[] = 조각들.map(() => 0);
    const heap: { value: number; run: number }[] = [];
    for (const [i, 조각] of 조각들.entries()) {
      heap.push({ value: 조각[0] as number, run: i });
      자리[i] = 1;
    }
    let 낸개수 = 0;
    let 걸음 = 조각들.length + 2;
    while (heap.length > 0) {
      걸음++;
      let at = 0;
      for (let i = 1; i < heap.length; i++) {
        const 이것 = heap[i] as { value: number };
        const 저것 = heap[at] as { value: number };
        if (이것.value < 저것.value) at = i;
      }
      const { value, run } = heap.splice(at, 1)[0] as {
        value: number;
        run: number;
      };
      낸개수++;
      const 조각 = 조각들[run] as number[];
      if ((자리[run] as number) < 조각.length) {
        heap.push({ value: 조각[자리[run] as number] as number, run });
        자리[run] = (자리[run] as number) + 1;
      }
      let 안읽은 = 0;
      for (const [i, r] of 조각들.entries())
        안읽은 += r.length - (자리[i] as number);
      rows.push([
        `T${걸음}`,
        String(value),
        String(heap.length),
        String(안읽은),
        String(낸개수),
        String(heap.length + 안읽은 + 낸개수),
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4, 5]);
    lines.push(
      `${열자리(rows, "셋의 합")} 열이 어느 걸음에서도 ${WALK.length} 이다 — 값 하나는 힙에 있거나 조각에 남아 있거나 출력에 나가 있고, 그 셋이 겹치지 않는다`,
    );
    return lines.join("\n");
  },

  /** 멈춤 — 문자열 순서로 정렬하는 판. */
  "pause-string-order": () => 문자열정렬표,

  /** 멈춤 — 그 판이 만든 조각을 정본의 조각과 나란히. */
  "pause-string-order-runs": () => {
    const rows: string[][] = [
      ["입력", "조각", "정본이 만든 조각", "문자열 순서로 만든 조각"],
    ];
    let 갈린조각 = 0;
    for (const 줄 of 정렬입력) {
      const 바른것 = 조각내기(줄.값, 줄.M);
      const 문자열것 = 문자열_조각(줄.값, 줄.M);
      for (const [i, r] of 바른것.entries()) {
        const s = 문자열것[i] as number[];
        if (나열(r) !== 나열(s)) 갈린조각++;
        rows.push([i === 0 ? 줄.이름 : "", String(i), 나열(r), 나열(s)]);
      }
    }
    const lines = table(rows, [1]);
    lines.push(
      `└ 조각 ${rows.length - 1} 개 가운데 ${갈린조각} 개에서 두 열이 갈린다. 한 자리 수만 든 조각은 문자열 순서와 값 순서가 나란하고, 자릿수가 섞이는 순간 갈린다`,
    );
    return lines.join("\n");
  },

  /** 멈춤 — 자투리를 안 적는 판. */
  "pause-tail": () => 자투리표,

  /** 멈춤 — 조각 전체를 힙에 올리는 판. */
  "pause-heap-all": () => 전부올리기표,

  /** 멈춤 — 그 판이 메모리에 드는 칸. */
  "pause-heap-all-memory": () => {
    const rows: string[][] = [
      [
        "입력",
        "조각 수",
        "정본이 든 칸",
        "조각 전체를 올린 판이 든 칸",
        "몇 배",
      ],
    ];
    let 최대배수 = 0;
    let 최대이름 = "";
    for (const 줄 of 전부올리기입력) {
      const 바른것 = 한번에_합치기(줄.값, 줄.M);
      const 전부 = 전부_올린_메모리(줄.값, 줄.M);
      const r = 전부.최대_정수_칸 / 바른것.최대_정수_칸;
      if (r > 최대배수) {
        최대배수 = r;
        최대이름 = 줄.이름;
      }
      rows.push([
        줄.이름,
        comma(바른것.조각),
        comma(바른것.최대_정수_칸),
        comma(전부.최대_정수_칸),
        배수(전부.최대_정수_칸, 바른것.최대_정수_칸),
      ]);
    }
    const N = 10_000_000;
    const lines = table(rows, [1, 2, 3, 4]);
    lines.push(
      `└ 가장 크게 갈리는 줄은 「${최대이름}」이고 ${최대배수.toFixed(2)} 배다. 조각이 하나이거나 조각 크기가 1 이면 정본도 입력 전체를 들게 되어 두 칸이 나란해진다. 제약 상한 ${comma(N)} 개에 조각 크기 1,000 이면 정본 ${comma(메모리_칸(N, 1_000))} 칸 대 이 판 ${comma(N)} 칸이다`,
    );
    return lines.join("\n");
  },

  /** 멈춤 — 출력 파일을 미리 비우지 않는 판. */
  "pause-truncate": () => 비우기표,

  /** 전체 코드를 여러 입력에 실행한 결과. */
  "walk-result": () => {
    const rows: string[][] = [
      ["입력", "조각 크기", "조각 수", "출력 파일의 내용"],
    ];
    for (const [이름, 값, M] of 결과입력) {
      rows.push([
        이름,
        comma(M),
        comma(조각수(값.length, M)),
        나열(결과답.get(이름) ?? []),
      ]);
    }
    return table(rows, [1, 2]).join("\n");
  },

  /** 스트림이 한 번에 주는 바이트 — 블록 크기 실측. */
  "related-block": () => {
    const 정수당 = 블록입력_바이트 / 대조_N;
    const rows: string[][] = [
      ["무엇", "값"],
      ["파일 바이트", comma(블록입력_바이트)],
      ["스트림이 준 블록 수", comma(블록크기.length)],
      ["첫 블록 바이트", comma(블록_바이트)],
      ["마지막 블록 바이트", comma(블록크기.at(-1) as number)],
      ["블록 하나에 든 정수", comma(Math.floor(블록_바이트 / 정수당))],
    ];
    const lines = table(rows, [1]);
    lines.push(
      `정수 ${comma(대조_N)} 개짜리 파일 하나를 읽는 데 블록 ${블록크기.length} 개가 왔다. 정수 하나를 읽을 때마다 디스크에 가는 것이 아니라 블록 하나가 통째로 온다`,
    );
    return lines.join("\n");
  },

  /** 경쟁 설계와 나란히 — 여섯 축. */
  "alt-counts": () => {
    const rows: string[][] = [
      [
        "계수",
        "조각을 한 번에 합치기",
        "두 조각씩 여러 바퀴 합치기",
        "적은 쪽",
        "몇 배",
      ],
    ];
    const 줄들: [string, number, number][] = [
      ["읽고 적은 정수 개수", 한번에_입출력, 여러바퀴_입출력],
      ["합치기 견주기", 한번에.합치기_견주기, 여러바퀴.합치기_견주기],
      ["메모리에 든 정수 칸", 한번에.최대_정수_칸, 여러바퀴.최대_정수_칸],
      ["동시에 연 조각 파일", 한번에.연_조각_파일, 여러바퀴.연_조각_파일],
      ["합치기 바퀴 수", 한번에.합치기_바퀴, 여러바퀴.합치기_바퀴],
      ["조각 정렬 견주기", 한번에.정렬_견주기, 여러바퀴.정렬_견주기],
    ];
    for (const [이름, a, b] of 줄들) {
      rows.push([
        이름,
        comma(a),
        comma(b),
        a === b ? "나란하다" : a < b ? "한 번에" : "여러 바퀴",
        배수(Math.max(a, b), Math.min(a, b)),
      ]);
    }
    const lines = table(rows, [1, 2, 4]);
    lines.push(
      `정수 ${comma(대조_N)} 개 · 조각 크기 ${comma(대조_M)} · 조각 수 ${comma(한번에.조각)} 에서 잰 값이다. 경쟁 설계가 한 바퀴에 합치는 조각 수는 ${대조_k} 개다`,
    );
    return lines.join("\n");
  },

  /** 두 축을 하나로 환산했을 때 뒤집히는 자리. */
  "alt-exchange": () => {
    const rows: string[][] = [
      [
        "입출력 한 번 = 견주기 몇 번",
        "조각을 한 번에 합치기",
        "두 조각씩 여러 바퀴 합치기",
        "적은 쪽",
      ],
    ];
    for (const c of [0, 100, 250, 경계c - 1, 경계c, 1_000, 10_000]) {
      const a = 한번에_입출력 * c + 한번에.합치기_견주기 * 1000;
      const b = 여러바퀴_입출력 * c + 여러바퀴.합치기_견주기 * 1000;
      rows.push([
        `${comma(c)}/1000`,
        comma(a),
        comma(b),
        a < b ? "한 번에" : "여러 바퀴",
      ]);
    }
    const lines = table(rows, [0, 1, 2]);
    lines.push(
      `└ 가운데 두 열은 견주기를 1000 배 한 정수라 나눗셈이 한 번도 없다. 순서가 뒤집히는 첫 자리는 ${comma(경계c)}/1000 이고 그 앞 ${comma(경계c - 1)}/1000 까지는 여러 바퀴 쪽이 적다`,
    );
    return lines.join("\n");
  },

  /** 닫힌 형태와 실측 대조. */
  "math-check": () => {
    const rows: string[][] = [
      [
        "정수 개수 N",
        "조각 크기 M",
        "실측 R",
        "식 ⌈N/M⌉",
        "실측 칸",
        "식 max(M, R)",
        "실측 입출력",
        "식 4N",
      ],
    ];
    for (const [N, M] of [
      [8, 3],
      [9, 3],
      [1_000, 32],
      [10_000, 100],
      [10_000, 1],
    ] as [number, number][]) {
      const 값 = N === 8 ? WALK : 생성식(N);
      const c = 한번에_합치기(값, M);
      rows.push([
        comma(N),
        comma(M),
        comma(c.조각),
        comma(조각수(N, M)),
        comma(c.최대_정수_칸),
        comma(메모리_칸(N, M)),
        comma(c.읽은 + c.적은),
        comma(4 * N),
      ]);
    }
    return table(rows, [0, 1, 2, 3, 4, 5, 6, 7]).join("\n");
  },

  /** 최적 조각 크기가 √N 인가 — 실측과 식. */
  "math-sqrt": () => {
    const rows: string[][] = [
      ["정수 개수 N", "칸이 가장 적은 M", "그때의 칸", "⌈√N⌉", "√N"],
    ];
    for (const N of [100, 10_000, 1_000_000, 10_000_000]) {
      let 가장작은 = Number.POSITIVE_INFINITY;
      let 가장작은M = 0;
      for (let M = 1; M <= N; M++) {
        const m = 메모리_칸(N, M);
        if (m < 가장작은) {
          가장작은 = m;
          가장작은M = M;
        }
      }
      rows.push([
        comma(N),
        comma(가장작은M),
        comma(가장작은),
        comma(Math.ceil(Math.sqrt(N))),
        Math.sqrt(N).toFixed(4),
      ]);
    }
    const lines = table(rows, [0, 1, 2, 3, 4]);
    const 바닥과_같은_줄 = rows
      .slice(1)
      .filter(
        (r) =>
          (r[1] as string) ===
          comma(
            Math.floor(Math.sqrt(Number((r[0] as string).replaceAll(",", "")))),
          ),
      ).length;
    lines.push(
      `${열자리(rows, "칸이 가장 적은 M")} 열이 ${rows.length - 1} 규모 가운데 ${바닥과_같은_줄} 규모에서 ⌊√N⌋ 과 같고, ${열자리(rows, "그때의 칸")} 열은 ⌈√N⌉ 과 나란하다`,
    );
    return lines.join("\n");
  },

  /** 경계 입력들. */
  "invariant-values": () => {
    const rows: string[][] = [
      ["입력", "조각 크기", "출력 파일의 내용", "왜 경계인가"],
    ];
    for (const [이름, , M, 사유] of 경계입력) {
      rows.push([이름, comma(M), 나열(경계답.get(이름) ?? []), 사유]);
    }
    return table(rows, [1]).join("\n");
  },

  /** 걸음마다 세 성질을 실행이 판정한 결과. */
  "invariant-steps": () => {
    const rows: string[][] = [
      [
        "입력 묶음",
        "확인한 걸음",
        "오름차순이 깨진 걸음",
        "셋의 합이 N 이 아닌 걸음",
        "꼭대기가 최솟값이 아닌 걸음",
      ],
    ];
    let 총걸음 = 0;
    for (const [이름, 값, M] of 불변식입력) {
      const r = 불변식_판정(값, M);
      총걸음 += r.걸음;
      rows.push([
        이름,
        comma(r.걸음),
        comma(r.오름차순_깨짐),
        comma(r.합_어긋남),
        comma(r.꼭대기_어긋남),
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4]);
    lines.push(
      `걸음 ${comma(총걸음)} 개 전부에서 셋이 유지됐다. 손으로 세지 않고 걸음마다 실행이 판정한 값이다`,
    );
    return lines.join("\n");
  },

  /** 불변식을 지키던 줄을 바꾸면. */
  "mutant-refill": () => 되채우기표,

  /** 총식과 실측. */
  "perf-ops": () => {
    const rows: string[][] = [
      [
        "입력",
        "조각 크기 M",
        "조각 수 R",
        "읽은",
        "적은",
        "입출력",
        "식 4N",
        "정렬 견주기",
        "합치기 견주기",
      ],
    ];
    for (const [이름, 값, M] of 비용입력) {
      const c = 한번에_합치기(값, M);
      rows.push([
        이름,
        comma(M),
        comma(c.조각),
        comma(c.읽은),
        comma(c.적은),
        comma(c.읽은 + c.적은),
        comma(4 * 값.length),
        comma(c.정렬_견주기),
        comma(c.합치기_견주기),
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4, 5, 6, 7, 8]);
    lines.push(
      `${열자리(rows, "입출력")} 열과 ${열자리(rows, "식 4N")} 열이 ${rows.length - 1} 줄 모두에서 나란하다. 읽은 개수와 적은 개수가 각각 2N 이라 합이 4N 이다`,
    );
    return lines.join("\n");
  },

  /** 최악을 만드는 입력. */
  "perf-worst": () => {
    const rows: string[][] = [
      [
        "후보",
        "조각 크기 M",
        "조각 수 R",
        "입출력",
        "합치기 견주기",
        "메모리에 든 칸",
      ],
    ];
    for (const [이름, 값, M] of 최악후보) {
      const c = 한번에_합치기(값, M);
      rows.push([
        이름,
        comma(M),
        comma(c.조각),
        comma(c.읽은 + c.적은),
        comma(c.합치기_견주기),
        comma(c.최대_정수_칸),
      ]);
    }
    const lines = table(rows, [1, 2, 3, 4, 5]);
    lines.push(
      `${열자리(rows, "입출력")} 열이 ${rows.length - 1} 줄 모두에서 나란하다. 갈리는 것은 입력의 모양이 아니라 조각 크기이고, 조각 크기 1 이 견주기와 칸을 함께 가장 크게 만든다`,
    );
    return lines.join("\n");
  },

  /** 스스로 점검하기의 답. */
  "check-answer": () => {
    const rows: string[][] = [
      ["조각 크기 M", "조각 수 R", "메모리에 든 칸", "입출력", "합치기 견주기"],
    ];
    for (const M of [2, 3, 4]) {
      const c = 한번에_합치기(WALK, M);
      rows.push([
        comma(M),
        comma(c.조각),
        comma(c.최대_정수_칸),
        comma(c.읽은 + c.적은),
        comma(c.합치기_견주기),
      ]);
    }
    const lines = table(rows, [0, 1, 2, 3, 4]);
    const 뿌리 = Math.ceil(Math.sqrt(WALK.length));
    lines.push(
      `정수 ${WALK.length} 개짜리 전개 입력에서 잰 값이다. 칸이 가장 적은 조각 크기는 ${뿌리}${조사(String(뿌리), "이", "가")} 되고, 그 값이 ⌈√${WALK.length}⌉ 과 같다`,
    );
    return lines.join("\n");
  },
};
