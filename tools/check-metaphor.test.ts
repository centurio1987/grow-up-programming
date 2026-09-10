/**
 * `check-metaphor.ts` 자기시험 — **사이드카 `.ts` 를 보게 된 뒤**의 몫.
 *
 * `.md` 쪽 규칙(인용 블록 · 인라인 인용 · 낫표 · 펜스)의 시험은 `check-v2.test.ts` 에 이미
 * 서 있다. 여기서는 이 배치가 새로 세운 셋을 잰다.
 *
 * 1. **사이드카를 본다** — 주석 본문과 문자열 리터럴 안쪽.
 * 2. **코드 식별자를 안 본다** — `cost` 도 `돌려보기` 도 은유가 아니다.
 * 3. **`"` 의 뜻이 두 종류에서 뒤집힌다** — `.md` 에서는 인용 표시, `.ts` 에서는 리터럴 경계.
 *
 * **「통과한다」와 「무엇을 잰다」는 다른 말이다.** 아래 시험은 전부 변이(조건을 하나씩
 * 지우거나 뒤집기)로 빨개지는 것을 확인한 것들이다. 변이 표는 배치 보고에 있다.
 */

import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  allTargets,
  isSidecar,
  maskSource,
  scan,
  scanCode,
} from "./check-metaphor.ts";

const root = new URL("..", import.meta.url).pathname;
const SIM = "x-guide.sim.ts";
const PROOF = "x-guide.proof.ts";

// ── 1. 사이드카를 본다 ────────────────────────────────────────────────────────

test("사이드카 — 한 줄 주석의 은유를 잡고 갈래를 comment 로 적는다", () => {
  const hits = scan(PROOF, "const n = 1;\n// 배열을 훑는다.\n");
  expect(hits.length).toBe(1);
  expect(hits[0]?.line).toBe(2);
  expect(hits[0]?.found).toBe("훑");
  expect(hits[0]?.kind).toBe("comment");
});

test("사이드카 — 문자열 리터럴 **안쪽**의 은유를 잡고 갈래를 string 으로 적는다", () => {
  // 생성 블록이 이 문자열을 그대로 원고에 싣는다. 리터럴 안쪽이 독자가 읽는 글이다.
  const hits = scan(SIM, 'const t = "표를 훑는다";');
  expect(hits.length).toBe(1);
  expect(hits[0]?.kind).toBe("string");
  expect(hits[0]?.found).toBe("훑");
});

test("사이드카 — 여러 줄 블록 주석에서 줄 번호가 안 밀린다", () => {
  // 블록 주석은 줄을 넘는다. 넘는 동안 자리를 잘못 세면 보고가 엉뚱한 줄을 가리킨다.
  const src = [
    "/**",
    " * 첫 줄.",
    " * 배열을 훑는다.",
    " */",
    "const n = 1;",
  ].join("\n");
  const hits = scan(PROOF, src);
  expect(hits.map((h) => h.line)).toEqual([3]);
});

test("사이드카 — 리터럴 안의 역슬래시가 줄바꿈을 삼켜 줄 번호를 밀지 않는다", () => {
  // 이스케이프는 두 글자를 함께 건너뛴다. 그 두 글자째가 줄바꿈이면 **건너뛰는 순간
  // `row` 가 안 올라가고 그 뒤 자리가 전부 한 줄씩 밀린다.** 보고가 딴 줄을 가리킨다.
  const src = ['const s = "가나\\', '다라";', "// 배열을 훑는다."].join("\n");
  expect(scan(PROOF, src).map((h) => h.line)).toEqual([3]);
});

test("사이드카 — 템플릿 리터럴 본문은 보고 보간 안의 식별자는 안 본다", () => {
  expect(scan(PROOF, "const s = `표를 훑는다`;")).toHaveLength(1);
  // 보간(`$`+중괄호) 안은 다시 코드다 — 산문으로 두면 한글 이름이 통째로 새 대상이 된다.
  const src = `const 훑기 = 1;\nconst s = \`개수 \${훑기} 개\`;`;
  expect(scan(PROOF, src)).toHaveLength(0);
});

test("사이드카 — 판정은 경고다(문서는 위반)", () => {
  // 근거는 전수 실측이다 — 사이드카 526개에서 77편·177자리. 한꺼번에 빨개지면 다른 편을
  // 닫는 세션이 자기 것이 아닌 빨강을 본다. 승격 경로는 `SEVERITY` 주석에 있다.
  expect(scan(PROOF, "// 배열을 훑는다.")[0]?.warn).toBe(true);
  expect(scan("SPEC.md", "배열을 훑는다.")[0]?.warn).toBeUndefined();
});

test("대상 문 — 사이드카 이름만 소스로 본다", () => {
  for (const kind of ["sim", "ref", "proof", "test", "alt"])
    expect(isSidecar(`a/b/x-guide.${kind}.ts`)).toBe(true);
  // 스캐너 자신의 소스에는 이 패턴의 정의가 들어 있다. 대상에 들면 자기를 위반으로 낸다.
  expect(isSidecar("tools/check-v2.ts")).toBe(false);
  expect(isSidecar("tools/check-metaphor.ts")).toBe(false);
  // 알고리즘 트랙의 제 시험(`<이름>.test.ts`)은 사이드카가 아니다 — v2 산출이 아니다.
  expect(isSidecar("src/algorithms/array/x/x.test.ts")).toBe(false);
  expect(isSidecar("x-guide.md")).toBe(false);
});

// ── 2. 코드 식별자를 안 본다 ─────────────────────────────────────────────────

test("오탐 — 한글 식별자는 은유가 아니다", () => {
  // **경계를 글자 종류로 그으면 여기서 샌다.** 이 저장소 사이드카에 한글 이름이 973 개 있다.
  expect(
    scan(PROOF, "const 훑기 = 1;\n돌리기();\nlet 얹은값 = 2;").length,
  ).toBe(0);
  // 같은 글자가 주석에 있으면 잡힌다 — 문이 「글자」가 아니라 「자리」임을 잰다.
  expect(scan(PROOF, "// 훑기\n").length).toBe(1);
});

test("오탐 — 영문 식별자는 마스킹 뒤에 한 글자도 안 남는다", () => {
  // `cost`·`weight`·`cheap` 은 은유가 아니라 이름이다. 지금 `METAPHORS` 가 한글뿐이라
  // **적중 0 만으로는 아무것도 안 재게 된다** — 마스크가 비었는지를 직접 본다.
  const src = "const cost = cheapest(weight) / 2;\nexport { cost };";
  const m = maskSource(src);
  expect(m.comment.join("").trim()).toBe("");
  expect(m.string.join("").trim()).toBe("");
});

test("오탐 — 정규식 리터럴의 몸통은 코드다", () => {
  // `/훑/` 은 패턴이지 글이 아니다.
  expect(scan(PROOF, 'const s = t.replace(/훑/g, "");')).toHaveLength(0);
  // **정규식으로 안 읽으면 그 안의 따옴표가 리터럴을 열어** 뒤따르는 글이 통째로 사라진다.
  // 사이드카에 `.replace(/\s+$/, "")` 가 흔해서 실제로 지나는 자리다.
  expect(scan(PROOF, 'const s = t.replace(/"/g, "훑는다");')).toHaveLength(1);
});

test("오탐 — 나눗셈을 정규식으로 읽지 않는다", () => {
  // 앞 글자가 이름·닫는 괄호면 나눗셈이다. 정규식으로 읽으면 **뒤 문자열 안의 `/` 까지**
  // 몸통으로 삼켜서 그 뒤 글이 코드로 보인다.
  expect(scan(PROOF, 'const p = n / 2 + "a/b 훑는다";')).toHaveLength(1);
  expect(scan(PROOF, 'const q = (n) / 2 + "a/b 훑는다";')).toHaveLength(1);
});

test("오탐 실측 — `countIslands` 의 한글 함수 이름 `돌려보기` 가 안 걸린다", () => {
  // 2026-09-10 전수에서 실제로 확인된 자리다. 줄 그대로 보면 「돌려」가 걸린다.
  const f = "src/algorithms/graph/countIslands/countIslands-guide.proof.ts";
  const src = readFileSync(`${root}${f}`, "utf8");
  const raw = src.split("\n")[825] as string;
  expect(raw).toContain("돌려보기");
  expect(scan(f, src).some((h) => h.line === 826)).toBe(false);
});

// ── 3. `"` 의 뜻이 두 종류에서 뒤집힌다 ──────────────────────────────────────

test("경계 — 같은 글자가 `.md` 에서는 인용이라 빠지고 `.ts` 에서는 리터럴이라 잡힌다", () => {
  const line = '유저가 "코드가 도는 것" 이라 적었다';
  // 문서에서 `"…"` 는 인용 표시다 — 안쪽은 글쓴이의 문장이 아니라 자료다.
  expect(scan("SPEC.md", line).length).toBe(0);
  // 소스에서 `"…"` 는 리터럴의 경계다 — 안쪽이 독자가 읽는 글이다.
  expect(scan(PROOF, `const s = "코드가 도는 것";`).length).toBe(1);
});

test("경계 — 주석 안의 인라인 인용과 낫표는 `.md` 와 똑같이 자료로 뺀다", () => {
  expect(scan(PROOF, '// 유저가 *"코드가 도는 것"* 이라 적었다.').length).toBe(
    0,
  );
  expect(scan(PROOF, "/** 규칙은 「닿다」 를 다의어로 든다. */").length).toBe(
    0,
  );
  // 낫표 밖은 그대로 본다.
  expect(scan(PROOF, "/** 그 목표에 닿는가 를 묻는다. */").length).toBe(1);
});

test("경계 — JSDoc 줄머리 `*` 뒤의 인용 블록도 자료로 뺀다", () => {
  const src = ["/**", " * > 비교가 싸다 는 쓰지 않는다.", " */"].join("\n");
  expect(scan(PROOF, src).length).toBe(0);
  // `>` 가 없으면 같은 문장이 잡힌다.
  expect(
    scan(PROOF, ["/**", " * 비교가 싸다 고 적었다.", " */"].join("\n")).length,
  ).toBe(1);
});

test("경계 — 붙어 있는 두 리터럴이 이어 붙어 없던 은유를 만들지 않는다", () => {
  // 자리를 유지한 채 지우지 않으면 「…에 서」 + 「는 …」 이 「에 서는」 이 된다.
  expect(scan(PROOF, 'table(["등호가 서", "는 자리"]);').length).toBe(0);
  // 한 리터럴 안에 이어 적으면 잡힌다 — 문이 「이음매」를 막는 것임을 잰다.
  expect(scan(PROOF, 'table(["등호가 서는 자리"]);').length).toBe(1);
});

// ── 4. 실측 회귀 — `sparseTableRangeMin` 사이드카 ────────────────────────────

const SPARSE =
  "src/algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide";
const SPARSE_KINDS = ["sim", "ref", "proof", "test", "alt"] as const;

/**
 * `KAN-034.7` 배치10 이 손으로 센 14자리를 **기계로 재현한다.**
 *
 * 그 14자리는 「쌓-」 13 + 「에 걸어」 1 이고, **「쌓-」 는 `METAPHORS` 에 없다** — 배치10 이
 * 같은 자리에서 `SPEC.md` §6 `L33`(단의적 표현 우선) 후보로 이름만 올려 두었다. 그래서 이
 * 시험은 **판정이 아니라 표면**을 잰다: 마스킹이 남긴 글에 그 14자리가 다 들어 있는가.
 * 패턴을 넓히는 것은 별건(`KAN-034.9` `S5`)이고, 넓히는 순간 이 14자리가 그대로 적중이 된다.
 */
test("실측 — `sparseTableRangeMin` 사이드카의 14자리에 표면이 닿는다", () => {
  const probe = /쌓|에\s*걸어/g;
  let sites = 0;
  for (const kind of SPARSE_KINDS) {
    const src = readFileSync(`${root}${SPARSE}.${kind}.ts`, "utf8");
    const m = maskSource(src);
    for (const seg of ["comment", "string"] as const)
      for (const line of m[seg]) sites += (line.match(probe) ?? []).length;
  }
  expect(sites).toBe(14);
});

test("실측 — 그 14자리 중 지금 `METAPHORS` 가 잡는 것은 `proof.ts:478` 하나다", () => {
  const hits = SPARSE_KINDS.flatMap((kind) =>
    scanCode(
      `${SPARSE}.${kind}.ts`,
      readFileSync(`${root}${SPARSE}.${kind}.ts`, "utf8"),
    ),
  );
  expect(
    hits.map((h) => `${h.file.replace(SPARSE, "")}:${h.line} ${h.found}`),
  ).toEqual([".proof.ts:478 에 걸어"]);
});

test("실측 — `--all` 의 대상에 사이드카 다섯 갈래가 다 들고 문서도 그대로 든다", async () => {
  const targets = await allTargets();
  // 111편 × 다섯 갈래에서 없는 것을 뺀 수다(2026-09-10 실측 526). 편이 늘면 이 수도 는다.
  expect(targets.filter(isSidecar).length).toBeGreaterThanOrEqual(500);
  for (const kind of SPARSE_KINDS)
    expect(targets).toContain(`${SPARSE}.${kind}.ts`);
  expect(targets).toContain("sandbox/algo-guide-v2/SPEC.md");
});

// ── 5. CLI ───────────────────────────────────────────────────────────────────

async function runCli(
  args: string[],
): Promise<{ code: number; out: string; err: string }> {
  const proc = Bun.spawn(["bun", "run", "tools/check-metaphor.ts", ...args], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { code, out, err };
}

/** 임시 자리에 파일을 놓고 CLI 를 돌린다. 이름은 `s8-` 로 시작해 워커끼리 안 섞인다. */
async function cliOn(
  files: Record<string, string>,
  extra: string[] = [],
): Promise<{ code: number; out: string }> {
  const dir = `${root}tools/_scratch/s8-cli-${crypto.randomUUID()}`;
  await Bun.$`mkdir -p ${dir}`.quiet();
  try {
    const paths: string[] = [];
    for (const [name, body] of Object.entries(files)) {
      await Bun.write(`${dir}/${name}`, body);
      paths.push(`${dir}/${name}`);
    }
    const r = await runCli([...extra, ...paths]);
    return { code: r.code, out: `${r.out}\n${r.err}` };
  } finally {
    await Bun.$`rm -rf ${dir}`.quiet();
  }
}

test("CLI — 사이드카만 걸리면 종료코드 0 이고 화면이 경고와 승격 경로를 적는다", async () => {
  const r = await cliOn({ "x-guide.proof.ts": "// 배열을 훑는다.\n" });
  expect(r.code).toBe(0);
  expect(r.out).toContain("경고");
  expect(r.out).toContain("위반으로 올린다");
});

test("CLI — 문서의 은유는 그대로 위반이라 종료코드 1 이다", async () => {
  const r = await cliOn({ "x-guide.md": "배열을 훑는다.\n" });
  expect(r.code).toBe(1);
});

test("CLI — 스캐너 자신의 소스를 넘겨도 대상이 되지 않는다", async () => {
  // 넣으면 `METAPHORS` 의 정의가 자기 위반으로 보고된다. 종료코드 2 는 「대상 없음」이다.
  const r = await runCli(["tools/check-v2.ts"]);
  expect(r.code).toBe(2);
});
