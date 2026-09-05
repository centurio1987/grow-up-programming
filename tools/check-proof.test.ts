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
  verdictLines,
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
