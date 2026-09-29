/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 * 바퀴 안의 걸음 하나하나는 그림 사이드카의 `run`(정본 소스에서 기계로 만든 계측 사본과 걸음마다
 * 대조한 기록)에서 받는다 — 그림과 표가 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/sorting/insertionSort/insertionSort-guide.md
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { josa, 을를, 이가 } from "../../../../tools/josa.ts";
import { cases as altCases } from "./insertionSort-guide.alt.ts";
import {
  BIG,
  COMPARE_LINE,
  INSERT_LINE,
  type InsEvent,
  inversions,
  leftScan,
  measure,
  naiveCompares,
  naiveRounds,
  num,
  pairs,
  permutations,
  type Round,
  range,
  reversed,
  run,
  SHIFT_LINE,
  SIX,
  type Sorter,
  same,
  scale,
  secondsOf,
  show,
  swapEvery,
  type Trace,
  trace,
  tuples,
  walkSteps,
  withSwaps,
} from "./insertionSort-guide.fig.tsx";
import { insertionSort } from "./insertionSort-guide.ref.ts";

const REF = new URL("./insertionSort-guide.ref.ts", import.meta.url).pathname;

type Cmp = Extract<InsEvent, { kind: "cmp" }>;
type Place = Extract<InsEvent, { kind: "place" }>;

/* ───────────────────────── 변이 ───────────────────────── */

/** 두 조건의 순서를 바꾼 사본. `j >= 0` 이 뒤로 갔다. */
const reordered = await loadMutant<Sorter>(REF, {
  swap: [COMPARE_LINE, "$1while ((B[j] as number) > key && j >= 0) {"],
});

/** 옮기는 방향을 반대로 적은 사본 — 왼쪽 값을 오른쪽 값으로 덮어쓴다. */
const backwards = await loadMutant<Sorter>(REF, {
  swap: [SHIFT_LINE, "$1B[j] = B[j + 1] as number;"],
});

/** 멈춘 자리에 키를 넣는 줄을 지운 사본 — 불변식을 지키던 줄이 사라진 것이다. */
const noInsert = await loadMutant<Sorter>(REF, { drop: INSERT_LINE });

/** 한 번도 안 옮긴 바퀴에서 넣기를 건너뛰는 사본 — 「스스로 점검하기」의 물음. */
const skipSelf = await loadMutant<Sorter>(REF, {
  swap: [INSERT_LINE, "$1if (j + 1 !== i) B[j + 1] = key;"],
});

/**
 * 변이가 중화됐는가 — `check-proof` 가 변이를 끄고 사이드카를 한 번 더 부를 때, 변이 모듈은 정본
 * 모듈 그 자체다. 그때는 「변이가 답을 바꿨다」는 자기검사를 건너뛴다(SPEC §0 증명 블록 규격).
 */
const neutral = (m: Sorter): boolean => m.insertionSort === insertionSort;

/* ───────────────────────── 표 그리기 ───────────────────────── */

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

/** 증명 표 — 표 아래 문장까지 사이드카가 낸다. 원고는 그 뒤를 `<!--/proof-->` 로 닫는다(SPEC §12). */
const proofTable = (table: string, sentence?: string): string =>
  [table, ...(sentence === undefined ? [] : ["", sentence])].join("\n");

/**
 * 펜스 블록의 속 — 펜스 줄(`` ```text ``)은 원고가 쓰고, 사이드카는 그 안의 줄만 낸다(`check-proof`
 * 가 펜스 안을 대조한다). `lang` 은 원고가 어느 펜스로 감싸는지 적어 두는 자리다.
 */
const fence = (_lang: "text" | "ts", body: string): string => body;

/** 한글은 고정폭 화면에서 두 칸을 먹는다. 글자 폭으로 칸을 맞춘다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);
const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/** 칸을 맞춘 줄들. 열 사이는 세 칸이다. 칸이 하나뿐인 줄은 폭 계산에서 뺀다. */
function columns(rows: string[][]): string {
  const cols = Math.max(...rows.map((r) => r.length));
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(
      Math.max(
        0,
        ...rows.map((r) =>
          r.length > 1 && c < r.length - 1 ? width(r[c] ?? "") : 0,
        ),
      ),
    );
  }
  return rows
    .map((r) =>
      r
        .map((cell, c) =>
          c === r.length - 1 ? cell : pad(cell, w[c] as number),
        )
        .join("   ")
        .replace(/\s+$/, ""),
    )
    .join("\n");
}

/** 「세 벌」 처럼 세는 말. 열까지만 쓰고 그 위는 숫자로 둔다. */
const countWord = (n: number): string =>
  ["영", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열"][
    n
  ] ?? String(n);

/** 호출 꼴 — `[5, 2, 4, 6, 1, 3]`. */
const call = (xs: readonly number[]): string => `[${xs.join(", ")}]`;

const cmpsOf = (t: Trace): Cmp[] =>
  t.events.filter((e): e is Cmp => e.kind === "cmp");
const placesOf = (t: Trace): Place[] =>
  t.events.filter((e): e is Place => e.kind === "place");
const roundOf = (t: Trace, i: number): Round =>
  t.rounds.find((r) => r.i === i) as Round;

/** 입력 하나를 세는 가벼운 절차 — 비교 · 이동 · `z`(구역의 왼쪽 끝을 지난 바퀴 수). 큰 입력에 쓴다. */
function light(A: readonly number[]): {
  compares: number;
  shifts: number;
  z: number;
} {
  const B = [...A];
  let compares = 0;
  let shifts = 0;
  let z = 0;
  for (let i = 1; i < B.length; i++) {
    const key = B[i] as number;
    let j = i - 1;
    while (j >= 0) {
      compares++;
      if ((B[j] as number) <= key) break;
      B[j + 1] = B[j] as number;
      shifts++;
      j--;
    }
    if (j < 0) z++;
    B[j + 1] = key;
  }
  if (!same(B, insertionSort([...A]))) {
    throw new Error("가벼운 절차가 정본과 다른 답을 냈다");
  }
  return { compares, shifts, z };
}

// 가벼운 절차가 기록하는 절차와 같은 값을 내는가 — 칸 7 개까지의 모든 순열.
for (let n = 0; n <= 7; n++) {
  for (const p of permutations(n)) {
    const a = light(p);
    const t = run(p);
    const z = t.rounds.filter((r) => r.edge).length;
    if (a.compares !== t.compares || a.shifts !== t.shifts || a.z !== z) {
      throw new Error("가벼운 절차가 기록하는 절차와 다르다");
    }
  }
}

const bag = (xs: readonly number[]): string =>
  [...xs].sort((a, b) => a - b).join(",");

/** 걸음 번호 — 본문 전개의 `T#` 를 바퀴마다 찾는다. */
function walkIds(): { lift: Map<number, string>; place: Map<number, string> } {
  const t = run(SIX);
  const steps = walkSteps();
  const lift = new Map<number, string>();
  const place = new Map<number, string>();
  t.events.forEach((e, k) => {
    const id = (steps[k] as { id: string }).id;
    if (e.kind === "lift") lift.set(e.i, id);
    if (e.kind === "place") place.set(e.i, id);
  });
  return { lift, place };
}
const span = (i: number): string => {
  const w = walkIds();
  return `${w.lift.get(i)}~${w.place.get(i)}`;
};

/* ───────────────────────── 전체 컨셉 ───────────────────────── */

/** 넣는 값마다 옮긴 횟수 = 그 값의 왼쪽에 있으면서 더 큰 값의 개수. */
function conceptShifts(): string {
  const t = run(SIX);
  const rows = t.rounds.map((r) => {
    const bigger = SIX.slice(0, r.i).filter((v) => v > r.key);
    if (bigger.length !== r.shifts) {
      throw new Error("옮긴 횟수가 왼쪽의 더 큰 값 개수와 다르다");
    }
    return [
      String(r.key),
      bigger.length === 0 ? "없음" : bigger.join(" "),
      String(r.shifts),
    ];
  });
  const sum = t.rounds.reduce((s, r) => s + r.shifts, 0);
  const measured = measure(SIX).shifts;
  return proofTable(
    md(["넣는 값", "왼쪽에 있으면서 그 값보다 큰 값", "옮긴 횟수"], rows, [2]),
    `옮긴 횟수를 모두 더하면 ${sum} 번이고, 정본을 계측해 센 이동 ${measured} 번과 같습니다.`,
  );
}

/** 칸 수 64 에서 두 극단. */
function conceptExtremes(): string {
  const a = measure(range(64));
  const b = measure(reversed(64));
  const ratio = b.compares / a.compares;
  return proofTable(
    md(
      ["칸 64 개의 입력", "비교", "이동"],
      [
        ["이미 오름차순", num(a.compares), num(a.shifts)],
        ["완전한 역순", num(b.compares), num(b.shifts)],
      ],
      [1, 2],
    ),
    `칸 수는 같은데 비교가 ${num(a.compares)} 번과 ${num(b.compares)} 번으로 ${Number.isInteger(ratio) ? ratio : ratio.toFixed(1)} 배 벌어집니다.`,
  );
}

/* ───────────────────────── 아이디어를 떠올리는 과정 ───────────────────────── */

function originCost(): string {
  return proofTable(
    md(
      ["방법", `칸 ${num(BIG)} 개의 비교`, "시간(초당 1 억 번)"],
      [["모든 쌍 비교하기", num(pairs(BIG)), secondsOf(pairs(BIG))]],
      [1, 2],
    ),
    "모든 쌍을 비교하는 방법은 입력과 무관하게 n(n−1)/2 번을 비교하고, 칸 1 개부터 200 개까지 정렬된 입력 · 역순 입력 · 이웃 쌍을 맞바꾼 입력에서 실제로 세어 이 식과 대조했습니다.",
  );
}

function originRounds(): string {
  const rs = naiveRounds(SIX);
  const sum = rs.reduce((s, r) => s + r.compares, 0);
  return proofTable(
    md(
      ["바퀴 p", "비교", "맞바꿈", "바퀴가 끝난 배열"],
      rs.map((r) => [
        String(r.p),
        String(r.compares),
        String(r.swaps),
        show(r.after),
      ]),
      [0, 1, 2],
    ),
    `비교는 ${rs.map((r) => r.compares).join(" + ")} = ${sum} 번입니다.`,
  );
}

/** 같은 두 값을 여러 바퀴가 다시 비교한 자리. */
function originRepeat(): string {
  const rs = naiveRounds(SIX);
  const seen = new Map<string, number[]>();
  for (const r of rs) {
    for (const [a, b] of r.compared) {
      const k = `${a} 와 ${b}`;
      const got = seen.get(k) ?? [];
      got.push(r.p);
      seen.set(k, got);
    }
  }
  const rows = [...seen.entries()]
    .filter(([, ps]) => ps.length > 1)
    .map(([k, ps]) => [
      k,
      ps.map((p) => `p = ${p}`).join(" · "),
      String(ps.length),
    ]);
  const total = rs.reduce((s, r) => s + r.compares, 0);
  const again = total - seen.size;
  return proofTable(
    md(["비교한 두 값", "그 비교를 한 바퀴", "횟수"], rows, [2]),
    `비교 ${total} 번 가운데 ${again} 번은 앞 바퀴가 이미 비교한 두 값을 다시 비교한 것입니다.`,
  );
}

/** 앞부분이 이미 오름차순이면 다음 값 하나를 넣는 데 드는 비교. */
function originReuse(): string {
  const t = run(SIX);
  const r = t.rounds.at(-1) as Round;
  const region = r.start.slice(0, r.i);
  const cs = cmpsOf(t).filter((e) => e.i === r.i);
  return fence(
    "text",
    columns([
      [`오름차순인 ${show(region)} 에 ${r.key}${을를(r.key)} 넣는다`],
      [
        "오른쪽 끝부터 비교",
        cs.map((e) => `${e.a} > ${r.key} ${e.big ? "참" : "거짓"}`).join(" · "),
        `비교 ${cs.length} 번`,
      ],
      [
        `구역 안 ${countWord(region.length)} 값끼리의 짝 ${pairs(region.length)} 개는 다시 비교하지 않는다`,
      ],
    ]),
  );
}

function naiveVsPrefix(): string {
  const inputs: [string, number[]][] = [
    ["전개 입력", SIX],
    ["이미 정렬", range(6).map((t) => t + 1)],
    ["역순", reversed(6).map((t) => t + 1)],
  ];
  const rows = inputs.map(([name, A]) => [
    `${name} ${show(A)}`,
    num(naiveCompares(A)),
    num(measure(A).compares),
  ]);
  const left = inputs.map(([, A]) => naiveCompares(A));
  const right = inputs.map(([, A]) => measure(A).compares);
  if (new Set(left).size !== 1) {
    throw new Error("모든 쌍 비교가 입력에 따라 달랐다");
  }
  return proofTable(
    md(
      ["여섯 칸 입력", "모든 쌍 비교", "정렬된 구역에 넣는 비교"],
      rows,
      [1, 2],
    ),
    `왼쪽 열은 세 입력 모두 ${left[0]} 번이고, 오른쪽 열은 ${Math.min(...right)} 번에서 ${Math.max(...right)} 번 사이를 움직입니다.`,
  );
}

/** 자리를 어느 끝에서부터 찾는가 — 입력 둘에서 한 번씩. */
function originScanOne(): string {
  const rows: string[][] = [];
  for (const A of [SIX, [1, 2, 3, 4, 5, 6, 7]]) {
    const t = run(A);
    const r = t.rounds.at(-1) as Round;
    const leftLog: [number, boolean][] = [];
    leftScan(A, { i: r.i, out: leftLog });
    const right = cmpsOf(t).filter((e) => e.i === r.i);
    rows.push([
      `${show(r.start.slice(0, r.i))} 에 ${r.key}${을를(r.key)} 넣는다`,
    ]);
    rows.push([
      "왼쪽 끝부터",
      `비교 ${leftLog.length} 번`,
      leftLog
        .map(([v, big]) => `${v} > ${r.key} ${big ? "참" : "거짓"}`)
        .join(" · "),
    ]);
    rows.push([
      "오른쪽 끝부터",
      `비교 ${right.length} 번`,
      right
        .map((e) => `${e.a} > ${r.key} ${e.big ? "참" : "거짓"}`)
        .join(" · "),
    ]);
  }
  return fence("text", columns(rows));
}

/* ───────────────────────── 아이디어 상세 ───────────────────────── */

/** 한 바퀴를 줄마다 — 비교(참이면 옮기기) · 멈춤 · 넣기. */
function roundLines(t: Trace, i: number): string[][] {
  const r = roundOf(t, i);
  const rows: string[][] = [
    [`B = ${show(r.start)} · key = ${r.key} · j = ${i - 1}`],
  ];
  for (const e of cmpsOf(t).filter((x) => x.i === i)) {
    rows.push(
      e.big
        ? [
            `j=${e.j}`,
            `B[${e.j}]=${e.a} > ${r.key} 참`,
            `→ B[${e.j + 1}] ← ${e.a}`,
            `B = ${show(e.arr)}`,
            `j = ${e.j - 1}`,
          ]
        : [`j=${e.j}`, `B[${e.j}]=${e.a} > ${r.key} 거짓`, "→ 멈춘다"],
    );
  }
  if (r.edge) rows.push(["j=-1", "구역의 왼쪽 끝을 지났다", "→ 멈춘다"]);
  rows.push([
    "넣기",
    `B[${r.at}] ← ${r.key}`,
    `→ 구역 ${r.i + 1} 칸`,
    `B = ${show(r.end)}`,
  ]);
  rows.push([`옮긴 값 ${r.shifts} 개 · 비교 ${r.compares} 번`]);
  return rows;
}

function buildShiftEasy(): string {
  const t = run(SIX);
  const r = t.rounds.find((x) => x.shifts === 0) as Round;
  return fence("text", columns(roundLines(t, r.i)));
}

function buildShiftThrough(): string {
  const t = run(SIX);
  const r = t.rounds.find((x) => x.edge && x.shifts > 1) as Round;
  return fence("text", columns(roundLines(t, r.i)));
}

function buildRounds(): string {
  const t = run(SIX);
  let rounds = 0;
  let over = 0;
  for (let n = 0; n <= 7; n++) {
    for (const p of permutations(n)) {
      for (const r of run(p).rounds) {
        rounds++;
        if (r.shifts > r.i) over++;
      }
    }
  }
  return proofTable(
    md(
      ["바퀴 i", "key", "옮긴 값", "비교", "멈춘 이유"],
      t.rounds.map((r) => [
        String(r.i),
        String(r.key),
        String(r.shifts),
        String(r.compares),
        r.edge ? "j = -1" : "B[j] ≤ key",
      ]),
      [0, 1, 2, 3],
    ),
    `옮긴 값은 바퀴마다 i 개 이하입니다. 칸 7 개까지의 모든 순열에서 바퀴 ${num(rounds)} 개를 세었고, 옮긴 값이 i 를 넘은 바퀴는 ${over} 개입니다.`,
  );
}

const DISORDER: [string, number[]][] = [
  ["뒤바뀐 이웃 0 쌍", withSwaps(64, 0)],
  ["뒤바뀐 이웃 4 쌍", withSwaps(64, 4)],
  ["뒤바뀐 이웃 16 쌍", withSwaps(64, 16)],
  ["뒤바뀐 이웃 32 쌍", withSwaps(64, 32)],
  ["완전한 역순", reversed(64)],
];

function disorderScale(): string {
  const rows = DISORDER.map(([name, A]) => {
    const m = measure(A);
    const inv = inversions(A);
    if (m.shifts !== inv) throw new Error("이동이 역순쌍 개수와 다르다");
    return [
      name,
      num(inv),
      num(m.compares),
      num(m.shifts),
      num(naiveCompares(A)),
    ];
  });
  return proofTable(
    md(
      ["칸 64 개의 입력", "역순쌍", "비교", "이동", "모든 쌍 비교"],
      rows,
      [1, 2, 3, 4],
    ),
    `${countWord(rows.length)} 줄 모두 이동 열이 역순쌍 열과 같습니다.`,
  );
}

function disorderFormula(): string {
  const rows: string[][] = [
    ["비교 = 이동 + 넣은 값의 개수 − 구역의 왼쪽 끝을 지난 바퀴 수"],
  ];
  for (const [name, A] of DISORDER) {
    const l = light(A);
    const n = A.length - 1;
    if (l.compares !== l.shifts + n - l.z) {
      throw new Error("비교의 식이 맞지 않는다");
    }
    rows.push([name, `${num(l.compares)} = ${num(l.shifts)} + ${n} − ${l.z}`]);
  }
  return fence("text", columns(rows));
}

function scanDirection(): string {
  const inputs: [string, number[]][] = [
    ["전개 입력 여섯 칸", SIX],
    ["이미 정렬된 64 칸", range(64)],
    ["이웃 4 쌍만 뒤바뀐 64 칸", withSwaps(64, 4)],
    ["역순 64 칸", reversed(64)],
  ];
  const rows = inputs.map(([name, A]) => {
    const l = leftScan(A);
    const r = measure(A);
    if (l.shifts !== r.shifts) throw new Error("두 방향의 이동 횟수가 다르다");
    return [name, num(l.compares), num(r.compares), num(r.shifts)];
  });
  return proofTable(
    md(
      ["입력", "왼쪽 끝부터 비교", "오른쪽 끝부터 비교", "이동"],
      rows,
      [1, 2, 3],
    ),
    `${countWord(rows.length)} 입력 모두 두 방향의 이동 횟수가 서로 같고, 이동 열이 그 값입니다.`,
  );
}

/* ───────────────────────── 수행으로 알아보는 알고리즘 ───────────────────────── */

function walkInput(): string {
  return fence(
    "ts",
    [
      `const A = ${call(SIX)};`,
      `// 이 절이 끝나면 ${call(insertionSort([...SIX]))} 이 나와야 한다`,
    ].join("\n"),
  );
}

function walkCopy(): string {
  const steps = walkSteps();
  const first = steps[0] as { id: string };
  const out: unknown = insertionSort(SIX);
  const rounds = run(SIX).rounds;
  return fence(
    "text",
    columns([
      [
        first.id,
        `B = ${show(SIX)}`,
        `A 와 값이 같은 새 배열 — insertionSort(A) === A 는 ${out === SIX ? "true" : "false"}`,
      ],
      [
        `정렬된 구역의 값 ${SIX.slice(0, 1).join(" ")} · 나머지 값 ${SIX.slice(1).join(" ")}`,
      ],
      [
        `바깥 반복이 실행되는 i 는 ${rounds.map((r) => r.i).join(" ")} → ${countWord(rounds.length)} 바퀴`,
      ],
    ]),
  );
}

/** 전개의 한 바퀴를 걸음 번호와 함께. */
function walkRound(i: number): () => string {
  return () => {
    const t = run(SIX);
    const steps = walkSteps();
    const rows: string[][] = [];
    t.events.forEach((e, k) => {
      const id = (steps[k] as { id: string }).id;
      if (e.kind === "lift" && e.i === i) {
        rows.push([
          id,
          `i=${i}`,
          `key ← B[${i}] = ${e.key}`,
          `j = ${i - 1} 에서 시작`,
        ]);
      }
      if (e.kind === "cmp" && e.i === i) {
        rows.push(
          e.big
            ? [
                id,
                `j=${e.j}`,
                `B[${e.j}]=${e.a} > ${e.key} 참`,
                `→ ③  B[${e.j + 1}] ← ${e.a}`,
                `B = ${show(e.arr)}`,
                `j = ${e.j - 1}`,
              ]
            : [id, `j=${e.j}`, `B[${e.j}]=${e.a} > ${e.key} 거짓`, "→ 반복 끝"],
        );
      }
      if (e.kind === "place" && e.i === i) {
        rows.push(
          e.edge
            ? [
                id,
                "j=-1",
                "j >= 0 거짓",
                `→ ④  B[0] ← ${e.key}`,
                `B = ${show(e.arr)}`,
              ]
            : [
                id,
                "넣기",
                `j + 1 = ${e.at}`,
                `→ ④  B[${e.at}] ← ${e.key}`,
                `B = ${show(e.arr)}`,
              ],
        );
      }
    });
    const r = roundOf(t, i);
    rows.push([
      `비교 ${r.compares} 번 · 이동 ${r.shifts} 번 · 정렬된 구역의 값 ${r.end.slice(0, i + 1).join(" ")}`,
    ]);
    return fence("text", columns(rows));
  };
}

/** 경계 입력 — 두 조건의 순서를 바꿔도 답이 갈리는지 본다. */
const EDGE_CASES: number[][] = [
  [5, 2, 4, 6, 1, 3],
  [1, 2, 3, 4, 5],
  [1, 3, 2, 4, 5],
  [5, 4, 3, 2, 1],
  [-1, 3, -1, 2, 0, 2],
  [4, 4, 4, 4],
  [42],
  [2, 1],
  [],
];

function mutantOrder(): string {
  const changed = EDGE_CASES.filter(
    (A) => !same(insertionSort([...A]), reordered.insertionSort([...A])),
  ).length;
  const rows = EDGE_CASES.slice(0, 4).map((A) => [
    show(A),
    show(insertionSort([...A])),
    show(reordered.insertionSort([...A])),
  ]);
  return proofTable(
    md(["입력", "j >= 0 을 먼저", "j >= 0 을 나중에"], rows),
    `빈 배열 · 한 칸 · 두 칸 · 중복 · 음수를 포함한 입력 ${countWord(EDGE_CASES.length)} 벌을 두 코드에 모두 넣었고, 답이 달라진 입력은 ${changed} 벌입니다.`,
  );
}

const BACKWARD_CASES: number[][] = [
  [5, 2, 4, 6, 1, 3],
  [5, 4, 3, 2, 1],
  [-1, 3, -1, 2, 0, 2],
];

function mutantBackwards(): string {
  const rows = BACKWARD_CASES.map((A) => ({
    A,
    correct: insertionSort([...A]),
    broken: backwards.insertionSort([...A]),
  }));
  const lost = rows.filter((r) => bag(r.broken) !== bag(r.A)).length;
  if (!neutral(backwards) && lost === 0) {
    throw new Error("방향을 뒤집은 변이가 어느 입력에서도 값을 잃지 않았다");
  }
  return proofTable(
    md(
      ["입력", "B[j+1] = B[j] 로 적은 코드", "B[j] = B[j+1] 로 적은 코드"],
      rows.map((r) => [show(r.A), show(r.correct), show(r.broken)]),
    ),
    lost === rows.length
      ? `${countWord(lost)} 벌 모두 입력에 있던 값이 사라지고 다른 값이 그 자리를 채웠습니다.`
      : `${countWord(rows.length)} 벌 중 ${lost} 벌에서 입력에 있던 값이 사라졌습니다.`,
  );
}

/** 방향을 뒤집은 줄이 첫 바퀴에서 무엇을 하는가. */
function pauseBackwardsStep(): string {
  const good = run(SIX);
  const bad = trace(SIX, "backwards");
  if (
    !neutral(backwards) &&
    !same(bad.out, backwards.insertionSort([...SIX]))
  ) {
    throw new Error("다시 쓴 뒤집은 절차가 변이와 다른 답을 냈다");
  }
  const g = cmpsOf(good)[0] as Cmp;
  const b = cmpsOf(bad)[0] as Cmp;
  const gp = placesOf(good)[0] as Place;
  const bp = placesOf(bad)[0] as Place;
  const missing = [...new Set(SIX)].filter((v) => !bp.arr.includes(v));
  return fence(
    "text",
    columns([
      [`i=${g.i} · key = ${g.key} · j = ${g.j} 에서 ${g.a} > ${g.key} 참`],
      [
        "바른 줄",
        `B[${g.j + 1}] ← B[${g.j}]`,
        show(g.arr),
        `넣기 B[${gp.at}] ← ${gp.key}`,
        show(gp.arr),
      ],
      [
        "뒤집은 줄",
        `B[${b.j}] ← B[${b.j + 1}]`,
        show(b.arr),
        `넣기 B[${bp.at}] ← ${bp.key}`,
        show(bp.arr),
      ],
      [
        missing.length === 0
          ? "뒤집은 줄의 첫 바퀴 뒤에도 값은 모두 남아 있다"
          : `뒤집은 줄은 첫 바퀴 뒤 B 에 ${missing.join(" · ")}${이가(missing.at(-1) as number)} 없다`,
      ],
    ]),
  );
}

function walkTrace(): string {
  const t = run(SIX);
  const steps = walkSteps();
  const n = SIX.length;
  let compares = 0;
  let shifts = 0;
  const rows = t.events.map((e, k) => {
    const s = steps[k] as { id: string; title: string };
    let cond = "";
    if (e.kind === "copy") cond = "`B` 는 `A` 의 복사본 · 구역 `B[0..0]`";
    if (e.kind === "lift") {
      cond = `\`${e.i} < ${n}\` **참** → \`key = ${e.key}\``;
    }
    if (e.kind === "cmp") {
      compares++;
      if (e.big) shifts++;
      cond = e.big
        ? `\`${e.a} > ${e.key}\` **참** → ③`
        : `\`${e.a} > ${e.key}\` **거짓** → 반복 끝`;
    }
    if (e.kind === "place") {
      cond = e.edge
        ? "`j = -1` 이라 `j >= 0` **거짓** → ④"
        : `멈춘 자리 \`j + 1 = ${e.at}\` → ④`;
    }
    if (e.kind === "done") cond = `\`${n} < ${n}\` **거짓** → 반환`;
    return [
      s.id,
      s.title.replace(/ [③④]$/, ""),
      cond,
      `\`${show(e.arr)}\``,
      String(compares),
      String(shifts),
    ];
  });
  return md(
    ["단계", "무슨 일", "조건 판정", "배열", "비교 누적", "이동 누적"],
    rows,
    [4, 5],
  );
}

function walkBranches(): string {
  const t = run(SIX);
  const steps = walkSteps();
  const ids = (pred: (e: InsEvent) => boolean): string =>
    t.events
      .map((e, k) => (pred(e) ? (steps[k] as { id: string }).id : null))
      .filter((x) => x !== null)
      .join(" · ");
  return fence(
    "text",
    columns([
      ["①", "복사", ids((e) => e.kind === "copy")],
      ["②", "바깥 반복 한 바퀴", ids((e) => e.kind === "lift")],
      ["③", "오른쪽으로 옮긴다", ids((e) => e.kind === "cmp" && e.big)],
      ["④", "자리에 넣는다", ids((e) => e.kind === "place")],
      ["", "멈춘 이유 j = -1", ids((e) => e.kind === "place" && e.edge)],
      ["", "멈춘 이유 B[j] ≤ key", ids((e) => e.kind === "cmp" && !e.big)],
      [
        `비교 ${t.compares} 번 · 이동 ${t.shifts} 번 · 반환 ${show(t.out)} · A 는 ${show(SIX)} 그대로`,
      ],
    ]),
  );
}

/** 이동 하나가 지나간 짝 — (옮긴 값, key). 그 짝 전부가 입력의 역순쌍이다. */
function walkPairs(): string {
  const t = run(SIX);
  const steps = walkSteps();
  const rows: string[][] = [];
  const got: string[] = [];
  t.events.forEach((e, k) => {
    if (e.kind === "cmp" && e.big) {
      rows.push([(steps[k] as { id: string }).id, `(${e.a}, ${e.key})`]);
      got.push(`${e.a},${e.key}`);
    }
  });
  const want: string[] = [];
  for (let p = 0; p < SIX.length; p++) {
    for (let q = p + 1; q < SIX.length; q++) {
      if ((SIX[p] as number) > (SIX[q] as number)) {
        want.push(`${SIX[p]},${SIX[q]}`);
      }
    }
  }
  const match =
    got.length === want.length &&
    [...got].sort().join() === [...want].sort().join();
  if (!match) throw new Error("옮긴 짝이 역순쌍과 다르다");
  rows.push([
    `옮긴 값과 key 의 짝 ${got.length} 개가 A 의 역순쌍 ${want.length} 개와 하나도 빠짐없이 일치한다`,
  ]);
  return fence("text", columns(rows));
}

function finalCalls(): string {
  const inputs = [
    SIX,
    [1, 3, 2, 4, 5],
    [-1, 3, -1, 2, 0, 2],
    [4, 4, 4, 4],
    [42],
    [],
  ];
  return fence(
    "text",
    columns(
      inputs.map((A) => [
        `insertionSort(${call(A)})`,
        "→",
        call(insertionSort(A)),
      ]),
    ),
  );
}

/* ───────────────────────── 알아 두면 좋은 개념 ───────────────────────── */

function relatedAdaptive(): string {
  const lo = measure(range(64)).compares;
  const hi = measure(reversed(64)).compares;
  const nlo = naiveCompares(range(64));
  const nhi = naiveCompares(reversed(64));
  const times = (a: number, b: number) =>
    `${Number.isInteger(b / a) ? b / a : (b / a).toFixed(1)} 배`;
  return md(
    [
      "절차",
      "역순쌍 0 개 — 이미 오름차순 64 칸",
      `역순쌍 ${num(inversions(reversed(64)))} 개 — 역순 64 칸`,
      "두 값의 배율",
    ],
    [
      ["삽입 정렬의 비교", num(lo), num(hi), times(lo, hi)],
      ["모든 쌍 비교하기", num(nlo), num(nhi), times(nlo, nhi)],
    ],
    [1, 2, 3],
  );
}

/* ───────────────────────── 경쟁 설계와의 대조 ───────────────────────── */

/** 쓰기 한 번이 비교 `w` 번만큼 비용이 들 때 두 설계의 총합이 어디서 뒤집히는가. */
function altWeight(): string {
  const ins = altCases["삽입 정렬"]();
  const sel = altCases["선택 정렬"]();
  const at = (k: string, from: Record<string, number>): number => {
    const v = from[k];
    if (v === undefined) throw new Error(`bench 키가 없다 — ${k}`);
    return v;
  };
  const cost = (c: number, wr: number, w: number) => c + w * wr;
  const iC = at("이미 정렬된 입력 비교", ins);
  const iW = at("이미 정렬된 입력 쓰기", ins);
  const sC = at("이미 정렬된 입력 비교", sel);
  const sW = at("이미 정렬된 입력 쓰기", sel);
  const mid = Math.floor((sC - iC) / (iW - sW));
  const rows = [1, mid, mid + 1].map((w) => {
    const a = cost(iC, iW, w);
    const b = cost(sC, sW, w);
    return [
      String(w),
      `${num(iC)} + ${num(iW)} × ${w} = ${num(a)}`,
      `${num(sC)} + ${num(sW)} × ${w} = ${num(b)}`,
      a < b ? "삽입 정렬" : a > b ? "선택 정렬" : "둘이 같음",
    ];
  });
  const nC = at("거의 정렬된 입력 비교", ins);
  const nW = at("거의 정렬된 입력 쓰기", ins);
  const mC = at("거의 정렬된 입력 비교", sel);
  const mW = at("거의 정렬된 입력 쓰기", sel);
  const w2 = Math.floor((mC - nC) / (nW - mW));
  const a1 = cost(nC, nW, w2);
  const b1 = cost(mC, mW, w2);
  const a2 = cost(nC, nW, w2 + 1);
  const b2 = cost(mC, mW, w2 + 1);
  if (!(a1 < b1 && a2 > b2)) {
    throw new Error("거의 정렬된 입력의 경계가 그 사이가 아니다");
  }
  return proofTable(
    md(["w", "삽입 정렬 총합", "선택 정렬 총합", "적은 쪽"], rows, [0]),
    `거의 정렬된 입력에서는 w = ${w2}${josa(w2, "이면", "면")} ${num(a1)} 대 ${num(b1)}, w = ${w2 + 1}${josa(w2 + 1, "이면", "면")} ${num(a2)} 대 ${num(b2)}${josa(b2, "이라", "라")} 그 사이에서 적은 쪽이 바뀝니다.`,
  );
}

/* ───────────────────────── 수식 정의와 유도 ───────────────────────── */

function mathCheck(): string {
  const n = SIX.length;
  const rows: string[][] = [];
  const perRow: number[] = [];
  for (let p = 0; p < n - 1; p++) {
    let count = 0;
    const cells: string[] = [String(p)];
    for (let q = 1; q < n; q++) {
      if (q <= p) {
        cells.push("");
        continue;
      }
      const a = SIX[p] as number;
      const b = SIX[q] as number;
      if (a > b) count++;
      cells.push(`${a}>${b} ${a > b ? "참" : "거짓"}`);
    }
    cells.push(String(count));
    perRow.push(count);
    rows.push(cells);
  }
  const total = perRow.reduce((s, x) => s + x, 0);
  if (total !== inversions(SIX)) throw new Error("정의대로 센 역순쌍이 다르다");
  return proofTable(
    md(["p", ...range(n - 1).map((q) => `q = ${q + 1}`), "참인 칸"], rows, [n]),
    `I(A) = ${perRow.join(" + ")} = ${total} 입니다.`,
  );
}

function mathSi(): string {
  const t = run(SIX);
  const r = t.rounds.at(-1) as Round;
  const region = r.start.slice(0, r.i);
  const bigger = region.filter((v) => v > r.key);
  const tail = region.slice(region.length - bigger.length);
  if (!same(bigger, tail)) {
    throw new Error("더 큰 값이 오른쪽 끝에 몰려 있지 않다");
  }
  const cs = cmpsOf(t).filter((e) => e.i === r.i);
  const moved = cs.filter((e) => e.big).map((e) => e.a);
  const stop = cs.find((e) => !e.big);
  return fence(
    "text",
    columns([
      [
        `i = ${r.i} 바퀴 · 구역의 값 ${region.join(" ")} · A[${r.i}] = ${r.key}`,
      ],
      [
        `${r.key} 보다 큰 값 ${bigger.join(" ")}${josa(bigger.at(-1) as number, "은", "는")} 구역의 오른쪽 끝 ${countWord(bigger.length)} 칸에 붙어 있다`,
      ],
      [
        `안쪽 반복이 ${moved.join(" → ")}${을를(moved.at(-1) as number)} 옮기고 ${stop === undefined ? "왼쪽 끝을 지나" : `${stop.a} 에서`} 멈춘다 · s_${r.i} = ${r.shifts}`,
      ],
    ]),
  );
}

function mathSum(): string {
  const t = run(SIX);
  const s = t.rounds.map((r) => r.shifts);
  return fence(
    "text",
    columns([
      [
        t.rounds.map((r) => `s_${r.i}`).join(" "),
        `= ${s.join(" ")}`,
        `합 ${s.reduce((a, b) => a + b, 0)}`,
      ],
      ["I(A)", `= ${inversions(SIX)}`, "정의대로 센 값"],
    ]),
  );
}

function mathRounds(): string {
  const t = run(SIX);
  const rs = t.rounds;
  const z = rs.filter((r) => r.shifts === r.i).length;
  const c = rs.reduce((s, r) => s + r.compares, 0);
  const inv = inversions(SIX);
  const n1 = SIX.length - 1;
  if (c !== inv + n1 - z) throw new Error("비교의 식이 맞지 않는다");
  for (const r of rs) {
    if (r.compares !== (r.shifts === r.i ? r.shifts : r.shifts + 1)) {
      throw new Error("c_i 의 식이 맞지 않는다");
    }
  }
  return fence(
    "text",
    columns([
      ["i", ...rs.map((r) => String(r.i)), ""],
      ["s_i", ...rs.map((r) => String(r.shifts)), ""],
      [
        "s_i = i",
        ...rs.map((r) => (r.shifts === r.i ? "참" : "거짓")),
        `→ z = ${z}`,
      ],
      ["c_i", ...rs.map((r) => String(r.compares)), `합 ${c}`],
      [`${c} = ${inv} + ${n1} − ${z}`],
    ]),
  );
}

/** 본문에 싣는 역순쌍 세기 — 아래 코드 글자와 같은 함수다. */
const inversionsShown = (A: number[]): number => {
  let count = 0;
  for (let p = 0; p < A.length; p++)
    for (let q = p + 1; q < A.length; q++)
      if ((A[p] as number) > (A[q] as number)) count++;
  return count;
};

function mathCode(): string {
  const inputs = [SIX, range(6), reversed(6)];
  const lines = inputs.map((A) => {
    const I = inversionsShown([...A]);
    const l = light(A);
    const n1 = A.length - 1;
    if (I !== inversions(A) || l.compares !== I + n1 - l.z) {
      throw new Error("식과 정본이 센 비교가 다르다");
    }
    return [
      `inversions(${call(A)}); // → ${I}`,
      `비교 ${I} + ${n1} − ${l.z} = ${l.compares} 번`,
    ] as const;
  });
  const w = Math.max(...lines.map((l) => l[0].length));
  return fence(
    "ts",
    [
      "const inversions = (A: number[]): number => {",
      "  let count = 0;",
      "  for (let p = 0; p < A.length; p++)",
      "    for (let q = p + 1; q < A.length; q++)",
      "      if ((A[p] as number) > (A[q] as number)) count++;",
      "  return count;",
      "};",
      "",
      ...lines.map(([a, b]) => `${a.padEnd(w)}   ${b}`),
    ].join("\n"),
  );
}

function mathAverage(): string {
  const n = 6;
  const perms = permutations(n);
  let sumI = 0;
  let sumZ = 0;
  let sumC = 0;
  for (const p of perms) {
    const l = light(p);
    sumI += inversions(p);
    sumZ += l.z;
    sumC += l.compares;
  }
  const mI = sumI / perms.length;
  const mZ = sumZ / perms.length;
  const mC = sumC / perms.length;
  const fI = (n * (n - 1)) / 4;
  let fZ = 0;
  for (let i = 1; i <= n - 1; i++) fZ += 1 / (i + 1);
  const fC = fI + (n - 1) - fZ;
  const f2 = (x: number) => x.toFixed(2);
  if (f2(mI) !== f2(fI) || f2(mZ) !== f2(fZ) || f2(mC) !== f2(fC)) {
    throw new Error("평균의 식이 순열 전수와 다르다");
  }
  const P = num(perms.length);
  return fence(
    "text",
    columns([
      [
        `E[I] = ${n} × ${n - 1} / 4 = ${fI}`,
        `순열 ${P} 개의 역순쌍 평균 ${mI}`,
      ],
      [
        `E[z] = ${range(n - 1)
          .map((i) => `1/${i + 2}`)
          .join(" + ")} = ${f2(fZ)}`,
        `순열 ${P} 개의 z 평균 ${f2(mZ)}`,
      ],
      [
        `E[C] = ${fI} + ${n - 1} − ${f2(fZ)} = ${f2(fC)}`,
        `순열 ${P} 개를 정본 절차로 센 비교 평균 ${f2(mC)}`,
      ],
    ]),
  );
}

function mathClosed(): string {
  const N = BIG;
  const sorted = light(range(N));
  const nearly = light(swapEvery(N, 100));
  const s = scale();
  if (
    sorted.compares !== s.sorted.compares ||
    nearly.compares !== s.nearly.compares
  ) {
    throw new Error("가벼운 절차와 계측 사본이 다르다");
  }
  const nearlyI = s.nearlyInv;
  const C = (I: number, z: number) => I + (N - 1) - z;
  if (
    C(0, sorted.z) !== sorted.compares ||
    C(nearlyI, nearly.z) !== nearly.compares
  ) {
    throw new Error("닫힌 식이 정본 계수와 다르다");
  }
  let hz = 0;
  for (let i = 1; i <= N - 1; i++) hz += 1 / (i + 1);
  const eI = (N * (N - 1)) / 4;
  const eC = eI + (N - 1) - hz;
  return proofTable(
    md(
      ["입력", "I(A)", "z", "C"],
      [
        ["이미 오름차순", "0", num(sorted.z), num(sorted.compares)],
        [
          `이웃 ${num(s.nearlySwaps)} 쌍만 뒤바뀜`,
          num(nearlyI),
          num(nearly.z),
          num(nearly.compares),
        ],
        [
          "무작위 순열의 평균",
          num(eI),
          `약 ${hz.toFixed(2)}`,
          `약 ${num(Math.round(eC))}`,
        ],
        ["완전한 역순", num(pairs(N)), num(N - 1), num(C(pairs(N), N - 1))],
      ],
      [1, 2, 3],
    ),
    `N = ${num(N)} 입니다. 위 두 줄은 정본으로 센 비교가 식과 일치했고, 완전한 역순의 식은 칸 2,000 개까지 정본으로 센 값과 일치합니다. 평균 줄은 식으로 낸 값입니다.`,
  );
}

/* ───────────────────────── 불변식 ───────────────────────── */

function invariantRound(): string {
  const t = run(SIX);
  const steps = walkSteps();
  const i = 4;
  const rows: string[][] = [];
  t.events.forEach((e, k) => {
    const id = (steps[k] as { id: string }).id;
    if (e.kind === "lift" && e.i === i) {
      rows.push([
        id,
        `B = ${show(e.arr)}`,
        `구역의 값 ${e.arr.slice(0, i).join(" ")} · key ${e.key}`,
      ]);
    }
    if (e.kind === "cmp" && e.i === i && e.big) {
      rows.push([id, `B = ${show(e.arr)}`, `${e.a}${이가(e.a)} 두 칸에 있다`]);
    }
    if (e.kind === "place" && e.i === i) {
      const region = e.arr.slice(0, i + 1);
      if (bag(region) !== bag(SIX.slice(0, i + 1))) {
        throw new Error("구역의 값 모음이 입력 앞부분과 다르다");
      }
      rows.push([
        id,
        `B = ${show(e.arr)}`,
        `구역의 값 ${region.join(" ")} · A[0..${i}] 의 값 모음과 일치`,
      ]);
    }
  });
  return fence("text", columns(rows));
}

/** 바퀴가 시작할 때마다 두 문장이 참인가. */
function holds(A: readonly number[], B: readonly number[], i: number): boolean {
  for (let k = 0; k + 1 < i; k++) {
    if ((B[k] as number) > (B[k + 1] as number)) return false;
  }
  if (bag(B.slice(0, i)) !== bag(A.slice(0, i))) return false;
  return same(B.slice(i), A.slice(i));
}

function invariantCheck(): string {
  const rows: string[][] = [];
  const sets: [string, number[][]][] = [
    [
      "칸 0 개부터 7 개까지의 모든 순열",
      range(8).flatMap((n) => permutations(n)),
    ],
    [
      "값 세 가지로 만든 칸 1 개부터 6 개까지의 모든 배열",
      range(6).flatMap((n) => tuples(n + 1, 3)),
    ],
  ];
  for (const [name, inputs] of sets) {
    let points = 0;
    let bad = 0;
    for (const A of inputs) {
      const t = run(A);
      for (const r of t.rounds) {
        points++;
        if (!holds(A, r.start, r.i)) bad++;
      }
      points++;
      if (!holds(A, t.out, A.length)) bad++;
    }
    rows.push([name, num(inputs.length), num(points), String(bad)]);
  }
  return md(
    [
      "확인한 입력",
      "입력 수",
      "바퀴를 시작한 시점과 끝난 시점",
      "두 문장이 거짓인 시점",
    ],
    rows,
    [1, 2, 3],
  );
}

const big = (v: number): string =>
  v === 1e9 ? "10^9" : v === -1e9 ? "-10^9" : String(v);
const showBig = (xs: readonly number[]): string => `[${xs.map(big).join(" ")}]`;

function invariantEdges(): string {
  const inputs: number[][] = [
    [],
    [42],
    [2, 1],
    [4, 4, 4, 4],
    [-1, 3, -1, 2, 0, 2],
    [1e9, -1e9, 0],
  ];
  const rows = inputs.map((A) => {
    const out = insertionSort(A);
    if (out === A) throw new Error("입력과 같은 배열을 돌려줬다");
    const l = light(A);
    const n = A.length;
    let where: string;
    if (n <= 1) {
      where = `\`1 < ${n}\`${이가(n)} 거짓이라 바깥 반복이 한 바퀴도 실행되지 않는다`;
    } else if (n === 2) {
      const r = run(A).rounds[0] as Round;
      where = `\`key = ${r.key}\` · \`${A[0]} > ${r.key}\` 참이라 옮기고 \`j = -1\` 에서 멈춘다`;
    } else if (l.shifts === 0) {
      where = `비교 ${l.compares} 번이 모두 거짓이라 옮긴 값이 없다`;
    } else {
      where = `비교 ${l.compares} 번 · 이동 ${l.shifts} 번 — 값에 쓰는 연산은 \`>\` 하나뿐이다`;
    }
    return [
      n === 0 ? "빈 배열 `[]`" : `\`${showBig(A)}\``,
      where,
      `\`${showBig(out)}\``,
    ];
  });
  return proofTable(
    md(["입력", "처리되는 곳", "결과"], rows),
    `${countWord(inputs.length)} 입력 모두 결과 배열이 입력과 다른 새 배열입니다.`,
  );
}

function mutantDropInsert(): string {
  const rows = EDGE_CASES.slice(0, 5).map((A) => ({
    A,
    correct: insertionSort([...A]),
    broken: noInsert.insertionSort([...A]),
  }));
  const wrong = rows.filter((r) => !same(r.correct, r.broken)).length;
  if (!neutral(noInsert) && wrong === 0) {
    throw new Error(
      "키를 넣는 줄을 지운 변이가 어느 입력에서도 답을 바꾸지 못했다",
    );
  }
  return proofTable(
    md(
      ["입력", "바른 코드", "B[j+1] = key 를 지운 코드"],
      rows.map((r) => [show(r.A), show(r.correct), show(r.broken)]),
    ),
    `${countWord(rows.length)} 벌 중 ${countWord(wrong)} 벌에서 답이 바뀌었습니다.`,
  );
}

function invariantMutantStep(): string {
  const bad = trace(SIX, "noInsert");
  if (!neutral(noInsert) && !same(bad.out, noInsert.insertionSort([...SIX]))) {
    throw new Error("다시 쓴 절차가 넣기를 지운 변이와 다른 답을 냈다");
  }
  const rows: string[][] = [];
  for (const i of [1, 2]) {
    const cs = cmpsOf(bad).filter((e) => e.i === i);
    cs.forEach((e, k) => {
      rows.push([
        k === 0 ? `i=${i}  key=${e.key}` : "",
        `${e.a} > ${e.key} ${e.big ? "참" : "거짓"}`,
        e.big ? `→ B[${e.j + 1}] ← ${e.a}` : "→ 멈춘다",
        `B = ${show(e.arr)}`,
      ]);
    });
  }
  const after = roundOf(bad, 2).end;
  const gone = SIX.slice(0, 3).filter((v) => !after.includes(v));
  rows.push([
    `두 바퀴 뒤 B = ${show(after)} — 넣기가 없어 ${gone.join(" 와 ")}${이가(gone.at(-1) as number)} 사라졌다`,
  ]);
  return fence("text", columns(rows));
}

/* ───────────────────────── 비용 계산 ───────────────────────── */

function perfDerive(): string {
  const t = run(SIX);
  const rows = t.rounds.map((r) => [
    span(r.i),
    `key = ${r.key}`,
    `비교 ${r.compares} 번`,
    `이동 ${r.shifts} 번`,
    `멈춘 이유 ${r.edge ? "j = -1" : "B[j] ≤ key"}`,
  ]);
  rows.push(["", "", `비교 합 ${t.compares}`, `이동 합 ${t.shifts}`]);
  return fence("text", columns(rows));
}

function perfDeriveSum(): string {
  const t = run(SIX);
  const edge = t.rounds.filter((r) => r.edge);
  const le = t.rounds.filter((r) => !r.edge);
  if (t.compares !== t.shifts + t.rounds.length - edge.length) {
    throw new Error("비교의 식이 맞지 않는다");
  }
  return fence(
    "text",
    columns([
      [
        `비교 ${t.compares} = 이동 ${t.shifts} + 바퀴 ${t.rounds.length} − (j = -1 로 멈춘 바퀴 ${edge.length})`,
      ],
      [
        "j = -1 로 멈춘 바퀴",
        edge.map((r) => span(r.i)).join(" · "),
        "마지막 비교가 없다",
      ],
      [
        "B[j] ≤ key 로 멈춘 바퀴",
        le.map((r) => span(r.i)).join(" · "),
        "이동 없는 비교가 하나 붙는다",
      ],
    ]),
  );
}

function worstInput(): string {
  const n = 6;
  const perms = permutations(n);
  const ms = perms.map((p) => light(p));
  const maxC = Math.max(...ms.map((m) => m.compares));
  const maxS = Math.max(...ms.map((m) => m.shifts));
  const byC = ms.filter((m) => m.compares === maxC).length;
  const byS = ms.filter((m) => m.shifts === maxS).length;
  const order = [...SIX].sort((a, b) => a - b);
  const rank = SIX.map((v) => order.indexOf(v));
  const rows: [string, number[]][] = [
    ["이미 정렬", range(n)],
    ["전개 입력을 순위로 바꾼 것", rank],
    ["역순", reversed(n)],
  ];
  const body = rows.map(([name, A]) => {
    const l = light(A);
    return [`${name} ${show(A)}`, String(l.compares), String(l.shifts)];
  });
  body.push(["N(N−1)/2 이 내는 값", String(pairs(n)), String(pairs(n))]);
  return proofTable(
    md(["여섯 칸 입력", "비교", "이동"], body, [1, 2]),
    `순열 ${num(perms.length)} 개 중 비교 ${maxC} 번은 ${byC} 개가 내고, 이동 ${maxS} 번은 ${byS} 개만 냅니다.`,
  );
}

function worstTwo(): string {
  const a = reversed(6);
  const b = [5, 4, 3, 2, 0, 1];
  return fence(
    "text",
    columns(
      [a, b].map((A) => {
        const l = light(A);
        return [
          `I = ${inversions(A)} · z = ${l.z}`,
          show(A),
          `비교 ${l.compares} · 이동 ${l.shifts}`,
        ];
      }),
    ),
  );
}

function worstBig(): string {
  const N = BIG;
  const I = pairs(N);
  const z = N - 1;
  const C = I + (N - 1) - z;
  return fence(
    "text",
    columns([
      [`N = ${num(N)} 의 완전한 역순`],
      ["I(A)", `= ${num(N)} × ${num(N - 1)} / 2 = ${num(I)}`],
      ["z", `= ${num(z)}`],
      [
        "비교",
        `= ${num(I)} + ${num(N - 1)} − ${num(z)} = ${num(C)}`,
        `시간 ${secondsOf(C)}`,
      ],
      ["이동", `= ${num(I)}`],
    ]),
  );
}

/* ───────────────────────── 스스로 점검하기 ───────────────────────── */

function selfcheckSkip(): string {
  const alt = altCases["삽입 정렬"]();
  const t = run(SIX);
  const six = {
    plain: t.shifts + t.rounds.length,
    skipped: t.shifts + t.rounds.filter((r) => r.shifts > 0).length,
  };
  const l = light(range(64));
  const sorted64 = { plain: l.shifts + 63, skipped: l.shifts };
  if (
    six.plain !== alt["여섯 칸 입력 쓰기"] ||
    sorted64.plain !== alt["이미 정렬된 입력 쓰기"]
  ) {
    throw new Error("쓰기 횟수가 bench 와 다르다");
  }
  for (const A of [SIX, range(64), reversed(64), ...EDGE_CASES]) {
    if (!same(skipSelf.insertionSort([...A]), insertionSort([...A]))) {
      throw new Error("넣기를 건너뛴 사본이 다른 답을 냈다");
    }
  }
  return fence(
    "text",
    columns([
      [
        `전개 입력 ${show(SIX)}`,
        `쓰기 ${six.plain} 번 → ${six.skipped} 번`,
        `답 ${show(skipSelf.insertionSort([...SIX]))}`,
      ],
      [
        "이미 정렬된 64 칸",
        `쓰기 ${sorted64.plain} 번 → ${sorted64.skipped} 번`,
        `비교 ${l.compares} 번 그대로`,
      ],
    ]),
  );
}

export const PROOFS: Record<string, () => string> = {
  "concept-shifts": conceptShifts,
  "concept-extremes": conceptExtremes,
  "origin-cost": originCost,
  "origin-rounds": originRounds,
  "origin-repeat": originRepeat,
  "origin-reuse": originReuse,
  "naive-vs-prefix": naiveVsPrefix,
  "origin-scan-one": originScanOne,
  "build-shift-easy": buildShiftEasy,
  "build-shift-through": buildShiftThrough,
  "build-rounds": buildRounds,
  "disorder-scale": disorderScale,
  "disorder-formula": disorderFormula,
  "scan-direction": scanDirection,
  "walk-input": walkInput,
  "walk-copy": walkCopy,
  "walk-round-1": walkRound(1),
  "walk-round-2": walkRound(2),
  "walk-round-3": walkRound(3),
  "mutant-order": mutantOrder,
  "mutant-backwards": mutantBackwards,
  "pause-backwards-step": pauseBackwardsStep,
  "walk-trace": walkTrace,
  "walk-branches": walkBranches,
  "walk-pairs": walkPairs,
  "final-calls": finalCalls,
  "related-adaptive": relatedAdaptive,
  "alt-weight": altWeight,
  "math-check": mathCheck,
  "math-si": mathSi,
  "math-sum": mathSum,
  "math-rounds": mathRounds,
  "math-code": mathCode,
  "math-average": mathAverage,
  "math-closed": mathClosed,
  "invariant-round": invariantRound,
  "invariant-check": invariantCheck,
  "invariant-edges": invariantEdges,
  "mutant-drop-insert": mutantDropInsert,
  "invariant-mutant-step": invariantMutantStep,
  "perf-derive": perfDerive,
  "perf-derive-sum": perfDeriveSum,
  "worst-input": worstInput,
  "worst-two": worstTwo,
  "worst-big": worstBig,
  "selfcheck-skip": selfcheckSkip,
};
