/**
 * `check-proof.ts` 회귀 — **거짓말을 실제로 잡는지**를 잰다.
 *
 * 대조 도구의 실패 모드는 조용하다. 값을 손으로 적어 넣은 사이드카는 본문과 언제나 같고,
 * 변이가 아무것도 안 바꾸면 「깨진다」가 거짓인데도 블록은 멀쩡해 보인다. 그 둘을 여기서
 * 고정한다.
 */

import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  codeSkeleton,
  compare,
  divergence,
  extractBlocks,
  importsRef,
  judgeDivergence,
  literalConsts,
  loadMutant,
  MUTATIONS,
  type Mutation,
  mutantSiteFailures,
  normalize,
  run,
  shownCode,
  verdictLines,
  visitedSameRows,
} from "./check-proof.ts";

const WORK = mkdtempSync(join(tmpdir(), "proof-test-"));
afterAll(() => rmSync(WORK, { recursive: true, force: true }));

const REF = `export function twice(n: number): number {
  let out = n;
  out += n;
  return out;
}
`;

function fixture(name: string, md: string, proof: string): string {
  const dir = join(WORK, name);
  writeFileSync(join(mkdirp(dir), `${name}-guide.md`), md, "utf8");
  writeFileSync(join(dir, `${name}-guide.ref.ts`), REF, "utf8");
  writeFileSync(join(dir, `${name}-guide.proof.ts`), proof, "utf8");
  return join(dir, `${name}-guide.md`);
}

function mkdirp(dir: string): string {
  require("node:fs").mkdirSync(dir, { recursive: true });
  return dir;
}

const MD = (body: string) => `# 표본

<!--proof:t1-->

\`\`\`text
${body}
\`\`\`
`;

const PROOF = (extra = "") => `import { twice } from "./p-guide.ref.ts";
${extra}
export const PROOFS: Record<string, () => string> = {
  t1: () => \`twice(21) = \${twice(21)}\`,
};
`;

test("마커와 펜스를 뽑는다", () => {
  const blocks = extractBlocks(MD("값"));
  expect(blocks).toHaveLength(1);
  expect(blocks[0]?.id).toBe("t1");
  expect(blocks[0]?.body).toBe("값");
});

test("마커 아래가 펜스가 아니면 잡는다", () => {
  const blocks = extractBlocks("<!--proof:t1-->\n\n산문입니다.\n");
  expect(blocks[0]?.body).toBeNull();
});

test("줄 끝 공백과 끝의 빈 줄만 무시한다", () => {
  expect(normalize("a  \nb\n\n\n")).toBe("a\nb");
  expect(normalize("a\n b")).not.toBe(normalize("a\nb"));
});

test("본문에만 있는 id 와 사이드카에만 있는 id 를 둘 다 잡는다", () => {
  const onlyDoc = compare(extractBlocks(MD("x")), {});
  expect(onlyDoc[0]?.kind).toBe("사이드카에 없음");

  const onlySide = compare([], { t1: () => "x" });
  expect(onlySide[0]?.kind).toBe("본문에 없음");
});

test("값이 한 글자만 달라도 잡고, 어느 줄인지 짚는다", () => {
  const fails = compare(extractBlocks(MD("a\nbb\nc")), {
    t1: () => "a\nbX\nc",
  });
  expect(fails).toHaveLength(1);
  expect(fails[0]?.kind).toBe("값이 다르다");
  expect(fails[0]?.detail).toContain("2번째 줄");
});

test("사이드카가 정본을 import 하지 않으면 판정력이 없다고 본다", () => {
  expect(
    importsRef(`import { twice } from "./p-guide.ref.ts";`, "p-guide.ref"),
  ).toBe(true);
  expect(importsRef(`const twice = (n) => 42;`, "p-guide.ref")).toBe(false);
});

test("통과 경로 — 실행 결과와 같으면 위반 0", async () => {
  const md = fixture("p", MD("twice(21) = 42"), PROOF());
  const r = await run(md);
  expect(r.failures).toHaveLength(0);
  expect(r.refNotImported).toBe(false);
  expect(r.blocks).toBe(1);
});

test("본문 값을 손으로 고치면 실패한다", async () => {
  const md = fixture(
    "q",
    MD("twice(21) = 41"),
    PROOF().replace("p-guide.ref", "q-guide.ref"),
  );
  const r = await run(md);
  expect(r.failures[0]?.kind).toBe("값이 다르다");
});

test("변이는 정확히 한 줄에만 맞아야 한다", async () => {
  const refPath = join(WORK, "p", "p-guide.ref.ts");
  await expect(
    loadMutant(refPath, { drop: /^\s*out \+= n;\s*$/ }),
  ).resolves.toBeDefined();
  // 0줄 — 없는 것을 지웠다고 적으면 「한 곳 바꿨다」가 거짓이다.
  await expect(
    loadMutant(refPath, { drop: /^\s*없는줄;\s*$/ }),
  ).rejects.toThrow("0 줄에 맞았다");
  // 2줄 — 한 곳이 아니다.
  await expect(loadMutant(refPath, { drop: /n/ })).rejects.toThrow(
    /[2-9] 줄에 맞았다/,
  );
});

test("변이는 정본 소스에서 만들어져 실제로 동작이 달라진다", async () => {
  const refPath = join(WORK, "p", "p-guide.ref.ts");
  const broken = await loadMutant<{ twice(n: number): number }>(refPath, {
    drop: /^\s*out \+= n;\s*$/,
  });
  expect(broken.twice(21)).toBe(21);
});

test("증명 블록이 없는 편은 통과로 적지 않는다", async () => {
  const md = fixture(
    "r",
    "# 표본\n\n증명 블록이 없다.\n",
    PROOF()
      .replace("p-guide.ref", "r-guide.ref")
      .replace("t1: () =>", "unused: () =>"),
  );
  const r = await run(md);
  expect(r.blocks).toBe(0);
  // 사이드카에만 있는 키는 그 자체로 위반이다 — 0개를 조용히 통과시키지 않는다.
  expect(r.failures[0]?.kind).toBe("본문에 없음");
});

/* ══════════ 변이 자리·갈림 자리 — 「어느 걸음에서 어긋나는가」 ══════════ */

test("loadMutant 은 바꾼 자리를 등록부에 남긴다", async () => {
  const refPath = join(WORK, "p", "p-guide.ref.ts");
  const before = MUTATIONS.length;
  await loadMutant(refPath, { swap: [/out \+= n;/, "out += 2 * n;"] });
  const m = MUTATIONS[before] as Mutation;
  expect(MUTATIONS).toHaveLength(before + 1);
  // 손으로 적은 것이 아니라 실행이 남긴 값이다 — 줄 번호까지 실행이 정한다.
  expect(m.line).toBe(3);
  expect(m.before.trim()).toBe("out += n;");
  expect(m.after?.trim()).toBe("out += 2 * n;");
});

test("캡션 아래 이어지는 줄을 행으로 세지 않는다", () => {
  // `singleNumberXor`·`trie` 에서 실제로 났던 거짓 위반이다. 캡션이 줄바꿈으로 이어지면
  // 들여쓰기만 남아 행처럼 보이고, 거기 든 「다르다」가 행의 판정으로 세어졌다.
  const body = [
    "입력   정본   변이   판정",
    "a      1      2      어긋난다",
    "b      3      3      같다",
    "",
    "└ 두 줄 중 한 줄에서 답이 틀리다. 남은 한 줄은",
    "  사유가 서로 다르다 — 겹칠 값이 하나뿐이다",
  ].join("\n");
  expect(verdictLines(body)).toEqual([
    { line: 2, diverges: true },
    { line: 3, diverges: false },
  ]);
});

test("칸 맞춤만 달라진 줄은 갈림으로 세지 않는다", () => {
  // 표의 열 폭은 값에서 계산된다. 변이를 중화하면 한 칸이 짧아지며 표 전체가 다시 정렬되는데,
  // 그것을 갈림으로 세면 모든 줄이 갈린 것이 된다.
  const d = divergence(
    "x",
    () => "머리   값\n가    1000\n나       2",
    () => "머리  값\n가  1000\n나     2",
  );
  expect(d.breaks).toBe(false);
  expect(d.lines).toEqual([]);
});

test("값이 달라진 줄만 갈림으로 내고 첫 줄이 처음 갈리는 자리다", () => {
  const d = divergence(
    "x",
    () => "머리\n가 1\n나 2\n다 3",
    () => "머리\n가 1\n나 9\n다 8",
  );
  expect(d.lines).toEqual([3, 4]);
  expect(d.lines[0]).toBe(3);
});

test("중화가 던지면 잴 것이 없다고 본다", () => {
  const d = divergence(
    "x",
    () => "값",
    () => {
      throw new Error("변이가 어느 입력에서도 답을 바꾸지 못했다");
    },
  );
  expect(d.breaks).toBe(true);
  expect(d.lines).toEqual([]);
});

test("블록이 적은 판정과 실행이 낸 갈림 줄이 어긋나면 잡는다", () => {
  const block = {
    id: "mutant-x",
    line: 10,
    body: "머리\n가 1 1 같다\n나 2 9 어긋난다",
  };
  // 실행은 2번째 줄이 갈린다고 하는데 블록은 그 줄을 「같다」로 적었다.
  const fails = judgeDivergence(block, {
    id: "mutant-x",
    breaks: false,
    brokeOn: null,
    lines: [2],
  });
  expect(fails).toHaveLength(1);
  expect(fails[0]?.kind).toBe("갈림 자리가 다르다");
  expect(fails[0]?.detail).toContain("처음 갈리는 자리는 2 번째 줄");
});

test("판정과 갈림 줄이 맞으면 오탐하지 않는다", () => {
  const block = {
    id: "mutant-x",
    line: 10,
    body: "머리\n가 1 1 같다\n나 2 9 어긋난다",
  };
  expect(
    judgeDivergence(block, {
      id: "mutant-x",
      breaks: false,
      brokeOn: null,
      lines: [3],
    }),
  ).toEqual([]);
  // 변이가 블록의 값을 안 바꾸는 것 자체는 위반이 아니다 — 「답이 안 틀리는 멈춤」이 있다.
  expect(
    judgeDivergence(block, {
      id: "mutant-x",
      breaks: false,
      brokeOn: null,
      lines: [],
    }),
  ).toEqual([]);
});

/* ── 원고가 「이렇게 바꾸면」으로 짚어 보인 줄 ↔ 실행이 바꾼 줄 ── */

const SITE_REF = `const WHITE = 0;
export function walk(color: number[], v: number): boolean {
  // ① 회색인지 본다
  if (color[v] === 1) return true;
  return false;
}
`;

const SITE_MUTATIONS: Mutation[] = [
  {
    refPath: "/x/x-guide.ref.ts",
    line: 4,
    before: "  if (color[v] === 1) return true;",
    after: "  if (color[v] !== WHITE) return true;",
  },
];

const siteMd = (fence: string) => `# 표본

#### 멈춤 — 본 적 있는 정점을 사이클로 읽기 쉽다

그 오해대로 적으면 이렇게 됩니다.

\`\`\`ts
${fence}
\`\`\`

<!--proof:mutant-two-color-->

\`\`\`text
값
\`\`\`
`;

test("원고가 짚은 변이 줄이 실행한 변이가 아니면 잡는다", () => {
  const fails = mutantSiteFailures(
    siteMd("if (color[v] === 2) return true; // ← 검은색이면 사이클"),
    SITE_REF,
    SITE_MUTATIONS,
  );
  expect(fails).toHaveLength(1);
  expect(fails[0]?.kind).toBe("변이 자리가 다르다");
  expect(fails[0]?.detail).toContain("이 편이 실행한 변이");
});

test("원고가 짚은 변이 줄이 실행한 변이면 오탐하지 않는다", () => {
  expect(
    mutantSiteFailures(
      siteMd("if (color[v] !== WHITE) return true; // ← 흰색이 아니면 사이클"),
      SITE_REF,
      SITE_MUTATIONS,
    ),
  ).toEqual([]);
  // 정본이 이름 붙인 상수를 원고가 값으로 적어도 **자리는 같다.** 이름이 한 벌인지는
  // `L25`·`P12` 가 보는 몫이라 여기서는 상수를 펼쳐 견준다.
  expect(
    mutantSiteFailures(
      siteMd("if (color[v] !== 0) return true; // ← 흰색이 아니면 사이클"),
      SITE_REF,
      SITE_MUTATIONS,
    ),
  ).toEqual([]);
  // 정본에 그대로 있는 줄에 단 주석은 「바꾼 판」이 아니다.
  expect(
    mutantSiteFailures(
      siteMd("if (color[v] === 1) return true; // ← 이 줄이 핵심이다"),
      SITE_REF,
      SITE_MUTATIONS,
    ),
  ).toEqual([]);
  // 변이 마커가 없는 절은 보지 않는다.
  expect(
    mutantSiteFailures(
      siteMd("if (color[v] === 2) return true; // ← 검은색이면 사이클").replace(
        "<!--proof:mutant-two-color-->",
        "<!--proof:walk-trace-->",
      ),
      SITE_REF,
      SITE_MUTATIONS,
    ),
  ).toEqual([]);
});

/* ── drop 변이 — 지운 줄은 정본에 그대로 있어서 자리 대조를 빠져나갔다 ── */

/** 같은 줄을 **지우는** 변이. `after` 가 `null` 인 것이 drop 이다. */
const DROP_MUTATIONS: Mutation[] = [
  {
    refPath: "/x/x-guide.ref.ts",
    line: 4,
    before: "  if (color[v] === 1) return true;",
    after: null,
  },
];

test("drop — 주석으로 보인 지운 줄이 실제로 지운 줄이면 오탐하지 않는다", () => {
  expect(
    mutantSiteFailures(
      siteMd("// if (color[v] === 1) return true;   ← 이 줄을 통째로 지운 판"),
      SITE_REF,
      DROP_MUTATIONS,
    ),
  ).toEqual([]);
});

test("drop — 주석으로 보인 줄이 지운 줄이 아니면 잡는다", () => {
  // 예전에는 이것이 **한 건도 안 잡혔다.** 주석을 걷으면 빈 줄이라 `s === ""` 로 새 나갔다.
  const fails = mutantSiteFailures(
    siteMd("// if (color[v] === 2) return true;   ← 이 줄을 통째로 지운 판"),
    SITE_REF,
    DROP_MUTATIONS,
  );
  expect(fails).toHaveLength(1);
  expect(fails[0]?.kind).toBe("변이 자리가 다르다");
  expect(fails[0]?.detail).toContain("이 편이 실제로 지운 줄");
});

test("drop — 살아 있는 줄에 「지우면」만 단 꼴도 잡는다", () => {
  // 이쪽은 `inRef.has(s)` 로 새 나가던 갈래다. 지운 줄은 **정본에 그대로 있는 줄**이라
  // 「정본에 있으면 안 본다」가 drop 을 통째로 덮었다.
  expect(
    mutantSiteFailures(
      siteMd("if (color[v] === 1) return true;   // ← 이 줄을 지우면?"),
      SITE_REF,
      DROP_MUTATIONS,
    ),
  ).toEqual([]);
  const fails = mutantSiteFailures(
    siteMd("return false;   // ← 이 줄을 지우면?"),
    SITE_REF,
    DROP_MUTATIONS,
  );
  expect(fails).toHaveLength(1);
  expect(fails[0]?.detail).toContain("return false;");
});

test("drop 이라고 적었는데 이 편은 swap 만 돌렸으면 잡는다", () => {
  const fails = mutantSiteFailures(
    siteMd("// if (color[v] === 1) return true;   ← 이 줄을 통째로 지운 판"),
    SITE_REF,
    SITE_MUTATIONS,
  );
  expect(fails).toHaveLength(1);
  expect(fails[0]?.detail).toContain("drop 변이를 실행한 적이 없다");
});

test("줄 안의 일부를 뺀 swap 주석은 drop 주장으로 읽지 않는다", () => {
  // 「등호를 뺐다」·「정렬만 뺐다」는 줄을 지운 것이 아니다. 목적어가 「줄」이 아닌 것으로
  // 가른다 — 이것을 drop 으로 읽으면 실제로 도는 swap 편들이 통째로 빨개진다.
  expect(
    mutantSiteFailures(
      siteMd("if (color[v] !== WHITE) return true;   // ← 등호를 뺐다"),
      SITE_REF,
      SITE_MUTATIONS,
    ),
  ).toEqual([]);
  // 멀쩡한 줄에 단 주석도 그대로 안 본다.
  expect(
    mutantSiteFailures(
      siteMd("if (color[v] === 1) return true;   // ← 이 줄이 핵심이다"),
      SITE_REF,
      DROP_MUTATIONS,
    ),
  ).toEqual([]);
  // 코드 없이 화살표만 있는 줄은 맞댈 것이 없다 — 빈 문자열을 위반으로 내면 안 된다.
  expect(
    mutantSiteFailures(
      siteMd("// ← 이 줄을 통째로 지운 판"),
      SITE_REF,
      SITE_MUTATIONS,
    ),
  ).toEqual([]);
});

test("shownCode — 주석형에서 코드만 뽑고 살아 있는 줄은 그대로 둔다", () => {
  expect(shownCode("  // out += n;")).toBe("  out += n;");
  expect(shownCode("  //out += n;")).toBe("  out += n;");
  expect(shownCode("  out += n; // 주석")).toBe("  out += n; // 주석");
});

test("리터럴 상수만 펼친다", () => {
  const consts = literalConsts(SITE_REF);
  expect(consts.get("WHITE")).toBe("0");
  expect(codeSkeleton("if (x !== WHITE) return;", consts)).toBe(
    "ifx!==0return;",
  );
  // 타입 단언과 그 괄호는 뜻이 없다 — 원고가 읽기 좋게 걷어 내고 싣는다.
  expect(codeSkeleton("a[i] = (b[j] as number) + 1;", new Map())).toBe(
    "a[i]=b[j]+1;",
  );
});

/* ── 끝에서 끝까지 — 실제 사이드카를 두 번 불러 대조한다 ── */

const TOOL = join(import.meta.dir, "check-proof.ts");

/** 변이를 실제로 쓰는 사이드카. `verdict` 가 판정 열을 만든다. */
const CONTRAST = (stem: string, verdict: string) =>
  `import { loadMutant } from ${JSON.stringify(TOOL)};
import { twice } from "./${stem}-guide.ref.ts";

const REF = new URL("./${stem}-guide.ref.ts", import.meta.url).pathname;
const BROKEN = await loadMutant<{ twice(n: number): number }>(REF, {
  drop: /^\\s*out \\+= n;\\s*$/,
});

export const PROOFS: Record<string, () => string> = {
  "mutant-drop": () =>
    ["n  정본  변이  판정"]
      .concat(
        [1, 2, 3].map(
          (n) => \`\${n}  \${twice(n)}  \${BROKEN.twice(n)}  \${${verdict}}\`,
        ),
      )
      .join("\\n"),
};
`;

const CONTRAST_MD = (verdicts: string[]) => `# 표본

<!--proof:mutant-drop-->

\`\`\`text
n  정본  변이  판정
1  2  1  ${verdicts[0]}
2  4  2  ${verdicts[1]}
3  6  3  ${verdicts[2]}
\`\`\`
`;

test("변이를 제대로 견준 편은 중화 대조가 오탐하지 않는다", async () => {
  const md = fixture(
    "dv",
    CONTRAST_MD(["어긋난다", "어긋난다", "어긋난다"]),
    CONTRAST("dv", 'twice(n) === BROKEN.twice(n) ? "같다" : "어긋난다"'),
  );
  const r = await run(md);
  expect(r.failures).toEqual([]);
});

test("판정을 엉뚱한 것으로 낸 사이드카를 중화 대조가 잡는다", async () => {
  // 세 줄 다 변이 때문에 갈리는데 사이드카가 「같다」로 적었다. 값 대조는 초록이다 —
  // 블록과 실행이 글자 그대로 같기 때문이다. 잡는 것은 중화 대조뿐이다.
  const md = fixture(
    "dw",
    CONTRAST_MD(["같다", "같다", "같다"]),
    CONTRAST("dw", '"같다"'),
  );
  const r = await run(md);
  expect(r.failures.filter((f) => f.kind === "값이 다르다")).toEqual([]);
  const bad = r.failures.filter((f) => f.kind === "갈림 자리가 다르다");
  expect(bad).toHaveLength(1);
  expect(bad[0]?.detail).toContain("처음 갈리는 자리는 2 번째 줄");
});

/* ═══ 「같다」 세 부류 — ①안 지나감 ②지나갔고 같음 ③상쇄해 답만 같음 ═══ */

/** `crt` 의 `pause-guard` 를 본뜬 표. 마지막 행만 그 줄을 안 지나간다. */
const VISIT_TABLE = [
  "입력                     정본   모순 판정을 지운 판   바꾼 줄을 지나간 횟수   판정",
  "[2,3,2] mod [3,5,7]      x=23   x=23                                    2   같다",
  "[2,5,2] mod [6,9,4]      x=14   x=14                                    2   같다",
  "[2,5,3] mod [6,9,4]      null   x=32                                    2   어긋난다",
  "[5] mod [7]              x=5    x=5                                     0   같다",
].join("\n");

test("부류① — 그 줄을 안 지나가서 같은 행은 안 짚는다", () => {
  const rows = visitedSameRows(VISIT_TABLE);
  // 5번째 줄이 「같다」이지만 횟수가 0 이다 — 변이가 실행조차 안 됐다.
  expect(rows.map((r) => r.line)).not.toContain(5);
});

test("부류②③ — 지나갔는데 같은 행만 짚고 횟수를 함께 낸다", () => {
  const rows = visitedSameRows(VISIT_TABLE);
  expect(rows).toEqual([
    { line: 2, count: 2, label: "[2,3,2] mod [3,5,7]" },
    { line: 3, count: 2, label: "[2,5,2] mod [6,9,4]" },
  ]);
  // 「어긋난다」 행은 애초에 이 화면의 대상이 아니다.
  expect(rows.map((r) => r.line)).not.toContain(4);
});

test("횟수 열이 없거나 칸이 안 맞으면 아무것도 안 짚는다", () => {
  // 정보 표시가 오탐하면 좁혀 주는 값이 사라진다. 애매하면 침묵한다.
  expect(visitedSameRows("입력  정본  변이  판정\na  1  1  같다")).toEqual([]);
  // 칸 수가 머리줄과 다른 행은 건너뛴다 — **칸이 밀리면 엉뚱한 칸을 횟수로 읽는다.**
  // 아래 셋째 행은 첫 칸 안에 두 칸 공백이 들어가 칸이 하나 더 생긴 꼴이고, 칸 수를
  // 안 보면 `2` 가 횟수 자리에 들어와 짚어 버린다.
  expect(
    visitedSameRows(
      ["입력  값  지나간 횟수  판정", "a  9  2  같다", "b  c  1  2  같다"].join(
        "\n",
      ),
    ).map((r) => r.line),
  ).toEqual([2]);
  // 캡션 아래는 표가 아니다.
  expect(
    visitedSameRows(
      ["입력  지나간 횟수  판정", "a  2  같다", "└ 두 줄  3  같다"].join("\n"),
    ).map((r) => r.line),
  ).toEqual([2]);
  // 그 자리가 숫자가 아니면 횟수가 아니다.
  expect(
    visitedSameRows(["입력  지나간 횟수  판정", "a  여러 번  같다"].join("\n")),
  ).toEqual([]);
});

test("머리줄이 둘이거나 횟수 열이 둘이면 침묵한다", () => {
  // 어느 것을 읽어야 할지 정할 수 없다. 골라서 읽으면 그 순간 오탐이 시작된다.
  expect(
    visitedSameRows(
      ["입력  지나간 횟수  판정", "a  2  같다", "입력  지나간 횟수  판정"].join(
        "\n",
      ),
    ),
  ).toEqual([]);
  expect(
    visitedSameRows(
      [
        "입력  넣은 줄 지나간 횟수  뺀 줄 지나간 횟수  판정",
        "a  2  3  같다",
      ].join("\n"),
    ),
  ).toEqual([]);
});

test("캡션이 「지나간 횟수」를 말해도 머리줄로 세지 않는다", () => {
  // `bridgesInGraph` 의 캡션이 실제로 이 낱말을 쓴다. 캡션을 둘째 머리줄로 세면 표 전체가
  // 「애매하다」로 떨어져 짚어 주던 값이 통째로 사라진다.
  expect(
    visitedSameRows(
      [
        "입력  지나간 횟수  판정",
        "a  2  같다",
        "",
        "└ 다섯 입력 모두 그 줄을 지나간 횟수가 1 이상이다",
      ].join("\n"),
    ).map((r) => r.line),
  ).toEqual([2]);
});

/**
 * 부류③ 을 가르는 것은 **걸음별 대조 블록**이다 — 답 표는 답만 실어서 ②와 ③을 못 가른다.
 *
 * 정본은 정렬한 뒤 더하고, 변이는 정렬을 지운다. **중간 목록은 갈리는데 합은 같다.**
 * 답 표에서는 「지나갔는데 같다」로만 보이고, 갈리는 자리는 걸음 블록에서만 나온다.
 */
const CANCEL_REF = `export function tally(xs: number[]): { order: number[]; sum: number } {
  const order = [...xs];
  order.sort((a, b) => a - b);
  let sum = 0;
  for (const v of order) sum += v;
  return { order, sum };
}
`;

const CANCEL_PROOF = (stem: string, verdict: string) =>
  `import { loadMutant } from ${JSON.stringify(TOOL)};
import { tally } from "./${stem}-guide.ref.ts";

const REF = new URL("./${stem}-guide.ref.ts", import.meta.url).pathname;
const BROKEN = await loadMutant<typeof import("./${stem}-guide.ref.ts")>(REF, {
  drop: /^\\s*order\\.sort\\(/,
});
const CASES = [[3, 1, 2], [5, 4]];

export const PROOFS: Record<string, () => string> = {
  "mutant-answer": () =>
    ["입력  그 줄을 지나간 횟수  정본 합  정렬을 뺀 판  판정"]
      .concat(
        CASES.map(
          (xs) =>
            \`[\${xs}]  1  \${tally(xs).sum}  \${BROKEN.tally(xs).sum}  \` +
            (tally(xs).sum === BROKEN.tally(xs).sum ? "같다" : "어긋난다"),
        ),
      )
      .join("\\n"),
  "mutant-step": () =>
    ["입력  정본 차례  정렬을 뺀 판 차례  판정"]
      .concat(
        CASES.map(
          (xs) =>
            \`[\${xs}]  [\${tally(xs).order}]  [\${BROKEN.tally(xs).order}]  \${${verdict}}\`,
        ),
      )
      .join("\\n"),
};
`;

const CANCEL_MD = (stepVerdicts: string[]) => `# 표본

#### 멈춤 — 정렬을 지워도 합은 안 틀린다

\`\`\`ts
// order.sort((a, b) => a - b);   ← 이 줄을 통째로 지운 판
\`\`\`

<!--proof:mutant-answer-->

\`\`\`text
입력  그 줄을 지나간 횟수  정본 합  정렬을 뺀 판  판정
[3,1,2]  1  6  6  같다
[5,4]  1  9  9  같다
\`\`\`

<!--proof:mutant-step-->

\`\`\`text
입력  정본 차례  정렬을 뺀 판 차례  판정
[3,1,2]  [1,2,3]  [3,1,2]  ${stepVerdicts[0]}
[5,4]  [4,5]  [5,4]  ${stepVerdicts[1]}
\`\`\`
`;

test("부류③ — 답 표는 「지나갔는데 같다」로만 보이고 갈림은 걸음 블록이 낸다", async () => {
  const dir = join(WORK, "cx");
  require("node:fs").mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "cx-guide.md"),
    CANCEL_MD(["어긋난다", "어긋난다"]),
    "utf8",
  );
  writeFileSync(join(dir, "cx-guide.ref.ts"), CANCEL_REF, "utf8");
  writeFileSync(
    join(dir, "cx-guide.proof.ts"),
    CANCEL_PROOF(
      "cx",
      'tally(xs).order.join() === BROKEN.tally(xs).order.join() ? "같다" : "어긋난다"',
    ),
    "utf8",
  );
  const r = await run(join(dir, "cx-guide.md"));
  expect(r.failures).toEqual([]);
  // 답 표는 두 행 다 「지나갔는데 같다」로 짚힌다 — 여기서는 ②인지 ③인지 안 갈린다.
  const answer = r.visitedSame.find((b) => b.id === "mutant-answer");
  expect(answer?.rows.map((x) => x.line)).toEqual([2, 3]);
  // 걸음 블록은 판정이 「어긋난다」라 이 화면에 안 올라온다 — 그것이 ③의 증거다.
  expect(r.visitedSame.map((b) => b.id)).not.toContain("mutant-step");
});

test("부류③ — 걸음 블록이 「같다」로 거짓말하면 중화 대조가 잡는다", async () => {
  // ②와 ③을 가르는 자리가 여기다. 답만 보면 둘이 똑같이 「같다」인데, 걸음 블록을 두면
  // 중화 대조가 그 줄들이 **실제로 갈린다**고 실행에서 내고 거짓 판정을 잡는다.
  const dir = join(WORK, "cy");
  require("node:fs").mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "cy-guide.md"), CANCEL_MD(["같다", "같다"]), "utf8");
  writeFileSync(join(dir, "cy-guide.ref.ts"), CANCEL_REF, "utf8");
  writeFileSync(
    join(dir, "cy-guide.proof.ts"),
    CANCEL_PROOF("cy", '"같다"'),
    "utf8",
  );
  const r = await run(join(dir, "cy-guide.md"));
  // 값 대조는 초록이다 — 블록과 실행이 글자 그대로 같기 때문이다.
  expect(r.failures.filter((f) => f.kind === "값이 다르다")).toEqual([]);
  const bad = r.failures.filter((f) => f.kind === "갈림 자리가 다르다");
  expect(bad).toHaveLength(1);
  expect(bad[0]?.id).toBe("mutant-step");
  // 거짓 판정 때문에 걸음 블록까지 「지나갔는데 같다」로 올라온다 — 화면이 둘을 함께 낸다.
  expect(r.visitedSame.map((b) => b.id)).toContain("mutant-answer");
});

/* ──────── S11 중화 대조가 안 돈 자리를 경고로 낸다 (2026-09-05) ──────── */

test("divergence — 중화 쪽이 던지면 `brokeOn` 이 그 사실을 남긴다", () => {
  // **이것이 「검사하지 않는 검사」의 씨앗이다.** 사이드카가 「변이가 아무것도 안 바꿨다」
  // 자기검사를 하면 중화 실행에서 무조건 터지고, 그 블록의 갈림 대조는 한 번도 안 돈다.
  // 예전에는 `breaks: true` 하나로 뭉쳐 「변이에 매여 있다」는 정상 사유와 구별되지 않았다.
  const d = divergence(
    "m",
    () => "a\nb",
    () => {
      throw new Error("변이가 답을 못 바꿨다");
    },
  );
  expect(d.brokeOn).toBe("neutral");
  expect(d.breaks).toBe(true);
  expect(d.lines).toEqual([]);
});

test("divergence — 정상 쪽이 던진 것은 중화 문제가 아니다", () => {
  const d = divergence(
    "m",
    () => {
      throw new Error("블록 자체가 깨졌다");
    },
    () => "a",
  );
  expect(d.brokeOn).toBe("normal");
});

test("divergence — 둘 다 돌면 `brokeOn` 은 null 이고 갈림 줄만 남는다", () => {
  const d = divergence(
    "m",
    () => "a\nX\nc",
    () => "a\nb\nc",
  );
  expect(d.brokeOn).toBeNull();
  expect(d.lines).toEqual([2]);
});
