/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/algorithms/array/twoSum/twoSum-guide.md
 *
 * **걸음마다의 상태를 그리는 사본이 하나 있다**(`trace`). 정본은 중간 상태를 내보내지 않으므로
 * 해시 맵의 내용을 걸음마다 보이려면 사본이 필요하다. **답이 맞는지는 사본이 아니라 정본이 진다** —
 * 사본이 정본과 같은 답을 내는지는 `자기대조()` 가 이 파일을 읽을 때 확인한다. 조회·기록 횟수는
 * `.alt.ts` 의 `counted` 가 **정본을 그대로 부르며** 센다.
 *
 * **변이가 아무것도 안 바꾸는지를 검사하는 자리는 중화 실행을 피해 간다.** `check-proof` 가 이
 * 파일을 한 번 더 부를 때는 `loadMutant` 가 정본을 그대로 돌려주므로(중화), 그 상태에서 「변이가
 * 답을 안 바꿨다」로 던지면 중화 대조 자체가 실행되지 않는다. 중화 여부는 변이 모듈의 함수가
 * 정본과 **같은 객체인가**로 알아낸다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 을를 } from "../../../../tools/josa.ts";
import { counted } from "./twoSum-guide.alt.ts";
import { twoSum } from "./twoSum-guide.ref.ts";

/* ────────────────────────── 표기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/** 소수 두 자리. */
const fixed2 = (x: number): string =>
  (Math.round(x * 100) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** 초 단위. 0.01 초보다 작으면 그렇게 적는다. */
const seconds = (x: number): string =>
  x < 0.01 ? "0.01 초 미만" : `${fixed2(x)} 초`;

/** `[5 8 3 8 12 2]` 꼴 — 값 나열은 쉼표 없이 공백으로 적는다(L25). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/** 돌려준 인덱스 쌍 — 코드의 반환값과 같은 모양으로 적는다. */
const pair = ([i, j]: [number, number]): string => `[${i}, ${j}]`;

/** 해시 맵의 내용. 적힌 순서대로 `키→값` 을 늘어놓는다. */
const showMap = (m: Map<number, number>): string =>
  m.size === 0
    ? "비어 있음"
    : [...m.entries()].map(([k, v]) => `${k}→${v}`).join(" · ");

/** 마크다운 표. 수가 든 열은 오른쪽 정렬(`---:`)이다. */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const line = (cells: string[]): string =>
    `| ${cells.map((c) => c.replaceAll("|", "\\|")).join(" | ")} |`;
  const rule = `| ${head.map((_, c) => (align[c] === "r" ? "---:" : "---")).join(" | ")} |`;
  return [line(head), rule, ...rows.map(line)].join("\n");
}

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 배열과 목표 합.
 *
 * 짝이 없는 걸음(②)이 다섯 번, 짝을 찾는 걸음(①)이 한 번 나온다. 8 이 두 번 나와 해시 맵의
 * 인덱스가 덮어써지고, 12 의 보수가 음수라 보수가 배열 밖 값일 때도 나온다. 5 는 보수가 자기
 * 자신이라 조회와 기록의 순서가 갈리는 자리다.
 */
export const WALK: number[] = [5, 8, 3, 8, 12, 2];
export const WALK_T = 10;

/** 흔한 계산의 한계로 잡은 규모. */
const SCALE_N = 100_000;

/** 변이를 거는 작은 입력 열. 뒤쪽은 기존 시험이 쓰던 케이스다. */
const SMALL: [number[], number][] = [
  [WALK, WALK_T],
  [[2, 7, 11, 15], 9],
  [[3, 2, 4], 6],
  [[3, 3], 6],
  [[-1, -2, 3], 1],
  [[-3, 4, -7], -10],
  [[0, 5, 0], 0],
  [[1, 2], 3],
];

/* ────────────────────────── 걸음을 그리는 사본 ────────────────────────── */

interface Step {
  j: number;
  x: number;
  want: number;
  /** 조회하기 전 해시 맵. */
  before: Map<number, number>;
  /** 조회 결과. 없으면 `undefined`. */
  found: number | undefined;
  /** 걸음이 끝난 뒤 해시 맵. */
  after: Map<number, number>;
  /** 이번 걸음에서 덮어쓴 앞 인덱스. 없으면 `undefined`. */
  overwrote: number | undefined;
}

/** 정본과 같은 절차를 따라가며 걸음마다 상태를 적는다. */
function trace(
  nums: number[],
  target: number,
): { steps: Step[]; answer: [number, number] | null } {
  const seen = new Map<number, number>();
  const steps: Step[] = [];
  for (let j = 0; j < nums.length; j++) {
    const x = nums[j] as number;
    const want = target - x;
    const before = new Map(seen);
    const found = seen.get(want);
    if (found !== undefined) {
      steps.push({
        j,
        x,
        want,
        before,
        found,
        after: new Map(seen),
        overwrote: undefined,
      });
      return { steps, answer: [found, j] };
    }
    const overwrote = seen.get(x);
    seen.set(x, j);
    steps.push({
      j,
      x,
      want,
      before,
      found,
      after: new Map(seen),
      overwrote,
    });
  }
  return { steps, answer: null };
}

/** 정본을 부르되 오류를 값으로 받는다. */
function run(
  f: (nums: number[], target: number) => [number, number],
  nums: number[],
  target: number,
): string {
  try {
    return pair(f([...nums], target));
  } catch {
    return "오류(짝 없음)";
  }
}

/** 이중 반복 — 뒤 원소 `j` 마다 앞 원소 `i` 를 차례로 읽는다. 비교 횟수를 센다. */
function scan(
  nums: number[],
  target: number,
): { answer: [number, number] | null; cmp: number; perJ: number[] } {
  let cmp = 0;
  const perJ: number[] = [];
  for (let j = 0; j < nums.length; j++) {
    let here = 0;
    for (let i = 0; i < j; i++) {
      cmp++;
      here++;
      if ((nums[i] as number) + (nums[j] as number) === target) {
        perJ.push(here);
        return { answer: [i, j], cmp, perJ };
      }
    }
    perJ.push(here);
  }
  return { answer: null, cmp, perJ };
}

/**
 * 짝이 맨 끝 두 자리에만 있는 입력. 앞 `n−2` 칸은 짝수 `0, 2, 4, …`, 끝 두 칸은 `2n+1` 과 `2n`,
 * 목표 합은 `4n+1` 이다. 짝수끼리의 합은 짝수라 목표에 안 맞고, 짝수와 `2n+1` 의 합은 `4n−5`
 * 이하라 모자란다. 그래서 짝은 끝 두 칸 하나뿐이다.
 */
function worstInput(n: number): { nums: number[]; target: number } {
  const nums = Array.from({ length: n - 2 }, (_, k) => 2 * k);
  nums.push(2 * n + 1, 2 * n);
  return { nums, target: 4 * n + 1 };
}

/** 사본이 정본과 같은 답을 내는가. 다르면 이 파일의 표는 아무것도 증명하지 않는다. */
function 자기대조(): void {
  const inputs: [number[], number][] = [...SMALL];
  const base = [4, -1, 9, 4, 0, 7, -6, 3];
  for (let a = 0; a < base.length; a++) {
    for (let b = a + 1; b < base.length; b++) {
      inputs.push([base, (base[a] as number) + (base[b] as number)]);
    }
  }
  for (const [nums, target] of inputs) {
    const t = trace(nums, target).answer;
    if (t === null || pair(t) !== pair(twoSum([...nums], target))) {
      throw new Error(`걸음 사본이 정본과 다른 답을 낸다 — ${show(nums)}`);
    }
  }
  for (const n of [6, 100, 1_000]) {
    const { nums, target } = worstInput(n);
    const got = pair(twoSum(nums, target));
    if (got !== pair([n - 2, n - 1]) || scan(nums, target).answer === null) {
      throw new Error(`끝에만 짝이 있는 입력이 아니다 — n = ${n}`);
    }
  }
}
자기대조();

/* ────────────────────────── 변이 ────────────────────────── */

const REF = new URL("./twoSum-guide.ref.ts", import.meta.url).pathname;

interface Impl {
  twoSum(nums: number[], target: number): [number, number];
}

/** 조회 결과를 참거짓으로 검사하는 사본 — 인덱스 0 이 거짓으로 읽힌다. */
const truthy = await loadMutant<Impl>(REF, {
  swap: [/i !== undefined/, "i"],
});

/** 같은 값이 다시 나와도 처음 인덱스를 지키는 사본. */
const keepFirst = await loadMutant<Impl>(REF, {
  swap: [/^(\s*)seen\.set\(x, j\);$/, "$1if (!seen.has(x)) seen.set(x, j);"],
});

/** **불변식을 지키던 줄** — 조회하기 전에 지금 원소를 먼저 적는 사본. */
const writeFirst = await loadMutant<Impl>(REF, {
  swap: [/seen\.get\(target - x\)/, "seen.set(x, j).get(target - x)"],
});

/** 중화 실행인가 — 변이를 적용하지 않으면 두 함수가 같은 객체다. */
const 중화됨 = truthy.twoSum === twoSum;

// 하나도 안 갈리면 그 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (!중화됨) {
  for (const [label, impl] of [
    ["참거짓 검사", truthy],
    ["처음 인덱스 지키기", keepFirst],
    ["먼저 적기", writeFirst],
  ] as const) {
    const same = SMALL.every(
      ([nums, target]) =>
        run(twoSum, nums, target) === run(impl.twoSum, nums, target),
    );
    if (same) {
      throw new Error(`${label} 변이가 어느 입력에서도 답을 바꾸지 못했다`);
    }
  }
}

/** 입력을 표의 첫 칸에 적는다. */
const label = (nums: number[], target: number): string =>
  `${nums === WALK ? "전개 입력 " : ""}${show(nums)} · target ${target}`;

/**
 * 변이 하나를 작은 입력 열에 걸어 정본과 나란히 놓는다.
 *
 * **「지나간 횟수」 열이 있어야 「같다」 가 뜻을 갖는다.** 그 값이 0 이면 변이가 바꾼 자리를 그
 * 입력이 한 번도 거치지 않은 것이고, 그때의 「같다」 는 변이가 무해하다는 뜻이 아니다.
 */
function mutantTable(
  head: string,
  impl: Impl,
  passHead: string,
  passes: (nums: number[], target: number) => number,
): string {
  const rows = SMALL.map(([nums, target]) => {
    const bare = run(twoSum, nums, target);
    const mutated = run(impl.twoSum, nums, target);
    return [
      label(nums, target),
      num(passes(nums, target)),
      bare,
      mutated,
      bare === mutated ? "같다" : "어긋난다",
    ];
  });
  return table(["입력", passHead, "정본", head, "판정"], rows, [
    "l",
    "r",
    "l",
    "l",
    "l",
  ]);
}

/** 조회가 인덱스 0 을 돌려준 횟수 — 참거짓 검사가 답을 바꿀 수 있는 자리다. */
const zeroLookups = (nums: number[], target: number): number =>
  trace(nums, target).steps.filter((s) => s.found === 0).length;

/** 덮어쓴 횟수 — 처음 인덱스를 지키는 판이 다르게 적는 자리다. */
const overwrites = (nums: number[], target: number): number =>
  trace(nums, target).steps.filter((s) => s.overwrote !== undefined).length;

/**
 * 보수가 자기 자신인 걸음 수 — 먼저 적는 판이 자기 자신을 찾는 자리다. 정본이 짝을 찾는 걸음까지만
 * 센다(그 뒤는 실행되지 않는다).
 */
const selfComplement = (nums: number[], target: number): number =>
  trace(nums, target).steps.filter((s) => s.want === s.x).length;

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 원소마다 보수와 그 직전 해시 맵. */
  "concept-states": () => {
    const t = trace(WALK, WALK_T);
    const rows = t.steps.map((s) => {
      let what: string;
      if (s.found !== undefined)
        what = `있다. 인덱스 ${s.found}${과와(s.found)} 짝이다`;
      else if (s.overwrote !== undefined)
        what = `없다. ${s.x} 의 인덱스를 ${s.j}${으로(s.j)} 바꾼다`;
      else what = `없다. ${s.x}→${s.j}${을를(s.j)} 적는다`;
      return [
        `인덱스 ${s.j} · 값 ${s.x}`,
        String(s.want),
        showMap(s.before),
        what,
      ];
    });
    return table(
      ["지금 원소", "보수", "그 직전 해시 맵", "보수 조회 결과"],
      rows,
      ["l", "r", "l", "l"],
    );
  },

  /** `deep.build` 전제 — 부동소수 키는 같음 비교에 실패한다. */
  "build-float": () => {
    const nums = [0.1, 0.2];
    const target = 0.3;
    const want = target - (nums[1] as number);
    return table(
      [
        "배열",
        "target",
        "0.1 + 0.2",
        "j = 1 의 보수",
        "키 0.1 과의 비교",
        "정본의 답",
      ],
      [
        [
          show(nums),
          String(target),
          String(0.1 + 0.2),
          String(want),
          want === nums[0] ? "같다" : "다르다",
          run(twoSum, nums, target),
        ],
      ],
      ["l", "r", "l", "l", "l", "l"],
    );
  },

  /** `selfcheck` — 원소 하나를 바꾼 배열의 걸음. */
  "check-c1": () => {
    const nums = [5, 8, 3, 2, 12, 2];
    const t = trace(nums, WALK_T);
    const c = counted(nums, WALK_T);
    const rows = t.steps.map((s) => [
      `T${s.j + 1}`,
      String(s.want),
      s.found === undefined ? "없음" : String(s.found),
      s.found === undefined ? "②" : `① ${pair([s.found, s.j])}`,
    ]);
    return [
      table(["걸음", "보수", "조회 결과", "갈래"], rows, ["l", "r", "l", "l"]),
      "",
      `해시 맵 연산은 조회 ${c.gets} 번과 기록 ${c.sets} 번, 합해서 ${c.gets + c.sets} 번입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 이중 반복의 비교 횟수. 짝이 맨 끝에만 있는 입력이다. */
  "cost-scan": () => {
    const rows = [6, 100, 1_000, 10_000, SCALE_N].map((n) => {
      const formula = (n * (n - 1)) / 2;
      const measured =
        n <= 10_000
          ? num(scan(worstInput(n).nums, worstInput(n).target).cmp)
          : "(실행하지 않음)";
      return [num(n), measured, num(formula), seconds(formula / 1e8)];
    });
    return table(
      ["n", "비교 횟수(실측)", "n(n−1)/2", "초당 1억 번 기준"],
      rows,
      ["r", "r", "r", "r"],
    );
  },

  /** `deep.origin` ③ — 이중 반복의 안쪽이 하는 일. 뒤 원소마다 보수 하나를 찾는다. */
  "origin-scan-walk": () => {
    const s = scan(WALK, WALK_T);
    const rows = s.perJ.map((c, j) => {
      const x = WALK[j] as number;
      const found =
        s.answer !== null && s.answer[1] === j ? `i = ${s.answer[0]}` : "없음";
      return [
        String(j),
        String(x),
        String(WALK_T - x),
        j === 0 ? "없음" : show(WALK.slice(0, j)),
        String(c),
        found,
      ];
    });
    return [
      table(
        ["j", "x", "찾는 값 target − x", "앞 원소들의 값", "비교", "찾은 짝"],
        rows,
        ["r", "r", "r", "l", "r", "l"],
      ),
      "",
      `비교는 모두 ${s.cmp} 번이고 돌려준 답은 ${pair(s.answer as [number, number])} 입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 입력을 차례로 읽기와 해시 맵 조회로 처리한 계수. */
  "origin-two-ways": () => {
    const s = scan(WALK, WALK_T);
    const c = counted(WALK, WALK_T);
    const stop = c.answer[1];
    const rows = s.perJ.map((cmp, j) => [
      String(j),
      String(WALK[j] as number),
      String(cmp),
      j <= stop ? "1" : "-",
    ]);
    return [
      table(["j", "x", "방식 A 의 비교", "방식 B 의 조회"], rows, [
        "r",
        "r",
        "r",
        "r",
      ]),
      "",
      `방식 A 는 비교 ${s.cmp} 번으로 ${pair(s.answer as [number, number])}${을를((s.answer as [number, number])[1])}, 방식 B 는 조회 ${c.gets} 번과 기록 ${c.sets} 번으로 ${pair(c.answer)}${을를(c.answer[1])} 냈습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 값을 칸 번호로 쓰는 배열이 몇 칸을 잡는가. */
  "origin-direct-address": () => {
    const walkMin = Math.min(...WALK);
    const walkMax = Math.max(...WALK);
    const rows: string[][] = [
      [
        `전개 입력(${walkMin} 이상 ${walkMax} 이하)`,
        num(walkMax - walkMin + 1),
        `${num((walkMax - walkMin + 1) * 8)} 바이트`,
        num(counted(WALK, WALK_T).size),
      ],
      [
        "0 이상 1,000 이하",
        num(1_001),
        `${num(1_001 * 8)} 바이트`,
        "n − 1 이하",
      ],
      [
        "−10^9 이상 10^9 이하",
        num(2_000_000_001),
        `${fixed2((2_000_000_001 * 8) / 1024 ** 3)} GiB`,
        `n − 1 이하(n = ${num(SCALE_N)} 이면 ${num(SCALE_N - 1)})`,
      ],
    ];
    return table(
      ["값의 범위", "배열의 칸 수", "8 바이트 기준", "해시 맵의 항목 수"],
      rows,
      ["l", "r", "r", "l"],
    );
  },

  /** `deep.build` 1단계 — 짝을 찾은 순간의 해시 맵 전체. 항목마다 어느 걸음이 적었는가. */
  "build-map-final": () => {
    const t = trace(WALK, WALK_T);
    const final = t.steps.at(-1)?.after ?? new Map<number, number>();
    const rows = [...final.entries()].map(([k, v]) => {
      const writers = t.steps
        .filter((s) => s.found === undefined && s.x === k)
        .map((s) => `j = ${s.j}`);
      return [String(k), String(v), writers.join(" · ")];
    });
    return [
      table(["키(원소의 값)", "값(인덱스)", "이 키를 적은 걸음"], rows, [
        "r",
        "r",
        "l",
      ]),
      "",
      `원소 ${WALK.length} 개 가운데 앞의 ${t.answer?.[1]} 개를 적었고, 값이 같은 원소가 둘이라 항목은 ${final.size} 개입니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 걸음마다 보수와 조회 결과. */
  "build-lookup": () => {
    const t = trace(WALK, WALK_T);
    const rows = t.steps.map((s) => [
      String(s.j),
      String(s.x),
      `${WALK_T} − ${s.x} = ${s.want}`,
      s.before.size === 0 ? "없음" : [...s.before.keys()].join(" "),
      s.found === undefined ? "없음" : `있음, 인덱스 ${s.found}`,
    ]);
    return table(["j", "x", "보수", "해시 맵에 있는 키", "조회 결과"], rows, [
      "r",
      "r",
      "l",
      "l",
      "l",
    ]);
  },

  /** `deep.build` 3단계 — j = 0 에서 조회와 기록의 순서를 바꾸면. */
  "build-order": () => {
    const x = WALK[0] as number;
    const want = WALK_T - x;
    const lookFirst = new Map<number, number>().get(want);
    const written = new Map<number, number>([[x, 0]]);
    const writeFirst = written.get(want);
    return table(
      ["순서", "조회할 때의 해시 맵", `보수 ${want} 조회`, "그 걸음의 결과"],
      [
        [
          "조회하고 적는다",
          "비어 있음",
          lookFirst === undefined ? "없음" : String(lookFirst),
          `${x}→0 을 적고 다음 원소로 간다`,
        ],
        [
          "적고 조회한다",
          showMap(written),
          writeFirst === undefined ? "없음" : `인덱스 ${writeFirst}`,
          `[${writeFirst}, 0]${을를(0)} 돌려준다`,
        ],
      ],
      ["l", "l", "l", "l"],
    );
  },

  /** `deep.walk` 2 — 첫 걸음과 마지막 걸음의 조회. */
  "walk-lookup": () => {
    const t = trace(WALK, WALK_T);
    const pick = [t.steps[0], t.steps.at(-1)] as Step[];
    const rows = pick.map((s) => [
      `T${s.j + 1}`,
      String(s.j),
      String(s.x),
      String(s.want),
      showMap(s.before),
      s.found === undefined ? "undefined" : String(s.found),
      s.found !== undefined ? "참" : "거짓",
    ]);
    return table(
      [
        "걸음",
        "j",
        "x",
        "target - x",
        "조회할 때의 해시 맵",
        "i",
        "i !== undefined",
      ],
      rows,
      ["l", "r", "r", "r", "l", "l", "l"],
    );
  },

  /** `deep.walk.pause` — 조회 결과를 참거짓으로 검사하면. */
  "pause-truthy": () =>
    mutantTable(
      "if (i) 로 검사한 판",
      truthy,
      "인덱스 0 이 나온 조회",
      (n, t) => zeroLookups(n, t),
    ),

  /** `deep.walk` 3 — 짝이 없는 걸음마다 해시 맵이 어떻게 자라는가. */
  "walk-map-growth": () => {
    const t = trace(WALK, WALK_T);
    const rows = t.steps
      .filter((s) => s.found === undefined)
      .map((s) => [
        `T${s.j + 1}`,
        String(s.j),
        `seen.set(${s.x}, ${s.j})`,
        s.overwrote === undefined
          ? "새 키"
          : `키 ${s.x} 의 값 ${s.overwrote}${을를(s.overwrote)} ${s.j}${으로(s.j)} 바꾼다`,
        showMap(s.after),
      ]);
    return table(
      ["걸음", "j", "실행한 줄", "해시 맵에 일어난 일", "걸음 뒤 해시 맵"],
      rows,
      ["l", "r", "l", "l", "l"],
    );
  },

  /** `deep.walk.pause` — 같은 값이 다시 나와도 처음 인덱스를 지키면. */
  "pause-overwrite": () =>
    mutantTable("처음 인덱스를 지키는 판", keepFirst, "덮어쓴 횟수", (n, t) =>
      overwrites(n, t),
    ),

  /** `deep.walk.pause` — 두 판이 낸 답이 모두 짝인가, 찾은 걸음 j 가 같은가. */
  "pause-overwrite-valid": () => {
    const rows = SMALL.map(([nums, target]) => {
      const a = twoSum([...nums], target);
      const b = keepFirst.twoSum([...nums], target);
      const sum = ([p, q]: [number, number]): string => {
        const u = nums[p] as number;
        const v = nums[q] as number;
        return `${u} + ${v < 0 ? `(${v})` : v} = ${u + v}`;
      };
      return [label(nums, target), sum(a), sum(b), String(a[1]), String(b[1])];
    });
    return table(
      [
        "입력",
        "정본 답의 합",
        "처음 인덱스를 지킨 답의 합",
        "정본이 찾은 j",
        "처음 인덱스를 지킨 판이 찾은 j",
      ],
      rows,
      ["l", "l", "l", "r", "r"],
    );
  },

  /** `deep.walk` 4 — 고정 입력으로 끝까지. 걸음마다 분기 조건과 해시 맵. */
  "walk-trace": () => {
    const t = trace(WALK, WALK_T);
    const rows = t.steps.map((s) => [
      `T${s.j + 1}`,
      String(s.j),
      String(s.x),
      String(s.want),
      s.found === undefined ? "undefined" : String(s.found),
      s.found !== undefined ? "참" : "거짓",
      s.found !== undefined ? "①" : "②",
      s.found !== undefined
        ? `[${s.found}, ${s.j}]${을를(s.j)} 돌려준다`
        : showMap(s.after),
    ]);
    const one = t.steps.filter((s) => s.found !== undefined).length;
    const two = t.steps.length - one;
    return [
      table(
        [
          "걸음",
          "j",
          "x",
          "target - x",
          "i",
          "i !== undefined",
          "갈래",
          "걸음 뒤 해시 맵 또는 반환",
        ],
        rows,
        ["l", "r", "r", "r", "l", "l", "l", "l"],
      ),
      "",
      `갈래 ② 가 ${two} 번, 갈래 ① 이 ${one} 번 실행됐고, 반환값은 ${pair(t.answer as [number, number])} 입니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 여러 입력에 실행한 결과. */
  "final-examples": () => {
    const inputs: [number[], number][] = [
      [WALK, WALK_T],
      [[2, 7, 11, 15], 9],
      [[3, 3], 6],
      [[-3, 4, -7], -10],
      [[1, 2, 3], 100],
    ];
    const rows = inputs.map(([nums, target]) => [
      `twoSum(${show(nums).replaceAll(" ", ", ")}, ${target})`,
      run(twoSum, nums, target),
    ]);
    return table(["호출", "결과"], rows, ["l", "l"]);
  },

  /** `invariant` ② — 걸음마다 해시 맵의 키가 앞 원소의 값 전부인가, 앞부분에 짝이 없는가. */
  "invariant-states": () => {
    const t = trace(WALK, WALK_T);
    let wrong = 0;
    const rows = t.steps.map((s) => {
      const front = WALK.slice(0, s.j);
      const keys = [...s.before.keys()].sort((a, b) => a - b);
      const want = [...new Set(front)].sort((a, b) => a - b);
      const lastIdx = [...s.before.entries()].every(
        ([k, v]) => front.lastIndexOf(k) === v,
      );
      let pairs = 0;
      for (let a = 0; a < front.length; a++) {
        for (let b = a + 1; b < front.length; b++) {
          if ((front[a] as number) + (front[b] as number) === WALK_T) pairs++;
        }
      }
      const ok = keys.join(" ") === want.join(" ") && lastIdx && pairs === 0;
      if (!ok) wrong++;
      return [
        `T${s.j + 1}`,
        s.j === 0 ? "없음" : show(front),
        showMap(s.before),
        lastIdx ? "마지막 인덱스" : "아니다",
        String(pairs),
      ];
    });
    return [
      table(
        [
          "걸음",
          "앞 원소 nums[0..j−1]",
          "조회 직전 해시 맵",
          "키마다 적힌 인덱스",
          "앞부분의 짝 수",
        ],
        rows,
        ["l", "l", "l", "l", "r"],
      ),
      "",
      `${t.steps.length} 걸음 모두에서 키 목록이 앞 원소의 값 목록과 같았고, 불변식이 깨진 걸음은 ${wrong} 개입니다.`,
    ].join("\n");
  },

  /** `invariant` ② — 경계에 있는 입력. 이중 반복이 찾은 짝과도 합이 같은가. */
  "invariant-edges": () => {
    const endNums = new Array<number>(10_000).fill(0);
    endNums[9_998] = 99;
    endNums[9_999] = 1;
    const cases: [string, number[], number, string][] = [
      ["원소 둘", [1, 2], 3, show([1, 2])],
      ["같은 값 둘", [3, 3], 6, show([3, 3])],
      ["0 이 둘", [0, 5, 0], 0, show([0, 5, 0])],
      ["음수 목표", [-3, 4, -7], -10, show([-3, 4, -7])],
      ["음수가 섞임", [-1, -2, 3], 1, show([-1, -2, 3])],
      ["짝이 맨 끝(n = 10,000)", endNums, 100, "0 이 9,998 개 · 99 · 1"],
      ["원소 하나", [5], 10, show([5])],
    ];
    const rows = cases.map(([name, nums, target, shown]) => {
      const got = run(twoSum, nums, target);
      const s = scan(nums, target);
      let verdict: string;
      if (s.answer === null) {
        verdict = got.startsWith("오류") ? "둘 다 짝이 없다" : "어긋난다";
      } else {
        const r = twoSum([...nums], target);
        const sum = (nums[r[0]] as number) + (nums[r[1]] as number);
        verdict =
          sum === target && r[0] < r[1] && r[1] === s.answer[1]
            ? "같다"
            : "어긋난다";
      }
      return [name, shown, String(target), got, verdict];
    });
    return table(["경계", "배열", "target", "답", "이중 반복과 비교"], rows, [
      "l",
      "l",
      "r",
      "l",
      "l",
    ]);
  },

  /** `invariant` ③ — 불변식을 지키던 줄에서 조회 전에 먼저 적으면. */
  "mutant-write-first": () =>
    mutantTable("먼저 적는 판", writeFirst, "보수가 자기 자신인 걸음", (n, t) =>
      selfComplement(n, t),
    ),

  /** `perf.derive` — 전개 입력에서 정본이 부른 해시 맵 조회·기록 횟수. */
  "perf-walk": () => {
    const c = counted(WALK, WALK_T);
    return table(
      ["하는 일", "걸음", "횟수"],
      [
        ["조회 seen.get", "T1 T2 T3 T4 T5 T6", String(c.gets)],
        ["기록 seen.set", "T1 T2 T3 T4 T5", String(c.sets)],
        ["합", "", String(c.gets + c.sets)],
      ],
      ["l", "l", "r"],
    );
  },

  /** `perf.derive` — 짝이 맨 끝에 있을 때 규모별 조회·기록 횟수. */
  "perf-scale": () => {
    const rows = [6, 1_000, 10_000, SCALE_N].map((n) => {
      const { nums, target } = worstInput(n);
      const c = counted(nums, target);
      return [
        num(n),
        num(c.gets),
        num(c.sets),
        num(c.gets + c.sets),
        num(2 * n - 1),
        num((n * (n - 1)) / 2),
      ];
    });
    return table(
      [
        "n",
        "조회(실측)",
        "기록(실측)",
        "합",
        "2n − 1",
        "이중 반복의 비교 n(n−1)/2",
      ],
      rows,
      ["r", "r", "r", "r", "r", "r"],
    );
  },

  /** `perf.worst` — 같은 n 에서 짝의 자리와 값의 순서를 바꿔 가며 센다. */
  "worst-position": () => {
    const n = 10_000;
    const shaped = (name: string, nums: number[], target: number): string[] => {
      const c = counted(nums, target);
      return [
        name,
        pair(c.answer),
        num(c.gets),
        num(c.sets),
        num(c.gets + c.sets),
      ];
    };
    // 짝수 0, 2, 4, … 사이에 홀수 짝 하나(2n+1 과 2n)를 둔다. 둘째 원소가 놓인 자리가 곧 찾는 걸음이다.
    const withPairAt = (a: number, b: number): number[] => {
      const nums = Array.from({ length: n }, (_, k) => 2 * k + 4 * n);
      nums[a] = 2 * n + 1;
      nums[b] = 2 * n;
      return nums;
    };
    const target = 4 * n + 1;
    const ascending = worstInput(n);
    const descending = [...ascending.nums].reverse();
    return table(
      ["입력의 모양", "답", "조회", "기록", "합"],
      [
        shaped("짝이 맨 앞", withPairAt(0, 1), target),
        shaped("짝이 가운데", withPairAt(4_999, 5_000), target),
        shaped("짝이 맨 끝", withPairAt(n - 2, n - 1), target),
        shaped("짝이 맨 앞과 맨 끝", withPairAt(0, n - 1), target),
        shaped("오름차순 · 짝이 맨 끝", ascending.nums, ascending.target),
        shaped("내림차순 · 짝이 맨 앞", descending, ascending.target),
      ],
      ["l", "l", "r", "r", "r"],
    );
  },
};
