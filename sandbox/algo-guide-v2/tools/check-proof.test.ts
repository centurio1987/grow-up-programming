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
  compare,
  extractBlocks,
  importsRef,
  loadMutant,
  normalize,
  run,
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
