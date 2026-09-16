/**
 * `tools/check-citations.ts` 의 **표류 검사** 자기시험.
 *
 * 이 시험이 있는 이유는 게이트가 **통과하는 것만 확인하는 시험**을 달고 있으면 아무것도
 * 지키지 않기 때문이다. 존재 검사는 이미 그런 상태였다 — 병합이 파일 앞에 줄을 끼워
 * 인용이 남의 줄을 가리키게 돼도 그 줄에 내용이 있으면 통과했고, 그렇게 세 번 샜다.
 *
 * 그래서 재는 것은 「정상 트리에서 통과한다」가 아니라 **「변형을 넣으면 실패한다」** 다.
 * 변형은 넷이고(카드 `S2` · 규격 「`S2` 로 넘기는 것」), 하나하나 앞뒤를 같이 잰다 —
 * 변형 전 통과 · 변형 후 실패. 뒤엣것만 재면 늘 실패하는 시험도 초록으로 보인다.
 *
 *   ① 대상 파일 **앞에 줄을 끼워** 인용이 밀린 경우
 *   ② 대상 **줄 내용만** 바뀐 경우
 *   ③ **경로 없는 인용**이 밀린 경우
 *   ④ 경로 없는 인용이 **붙임 · 자기 · 보류 세 코드**로 규격의 표대로 갈리는지
 *
 * **저장소 실물을 건드리지 않는다.** 시험마다 임시 트리를 새로 짓고 끝나면 지운다 —
 * 실물에 `--update` 를 돌리면 대장(`S3` 몫)이 커밋될 자리에 남는다.
 *
 * **그리고 이 파일은 자기가 검사 대상이다.** `tools` 가 검사 집합에 있으므로, fixture 에
 * 인용 꼴을 글자 그대로 적으면 게이트가 그것을 진짜 인용으로 센다 — 대상이 임시 트리라
 * 「가리키는 파일이 없다」로 떨어지고, 경로 없는 인용까지 늘어 **래칫 기준선이 오염된다**
 * (실제로 한 번 그렇게 24 건이 떴다). 규격이 제 예시에 `NN` · `MM` 을 쓴 것과 같은 함정이다.
 * 그래서 인용 문자열은 **전부 아래 두 helper 로 조립한다** — 이 파일 본문에 인용 꼴은 없다.
 */

import { afterAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fingerprintOf,
  LEDGER_PATH,
  type Mode,
  parseLedger,
  run,
  scanTree,
} from "./check-citations.ts";

/** 경로 있는 인용을 조립한다. 글자 그대로 적으면 이 파일이 게이트에 걸린다(위 주석). */
const at = (path: string, line: number | string) => `${path}:${line}`;
/** 경로 없는 백틱 인용을 조립한다. 같은 이유. */
const bare = (line: number | string) => `\`:${line}\``;
/** 대장 키. */
const key = (src: string, target: string, line: number) =>
  [src, target, line].join("\t");

/**
 * 산문 속 맨 줄 번호를 조립한다. 지금 래칫이 보는 자리는 `docs/**` 뿐이라 이 파일은 밖이지만,
 * 자리가 넓어졌을 때 시험 fixture 가 실물 기준선을 오염시키지 않도록 위 둘과 같이 조립한다.
 */
const naked = (line: number) => `${line} 줄`;

const T = "docs/target.md";
const SRC = "docs/source.md";
const RUNBOOK = "docs/runbook.md";
const CARD = "KANBAN.cards/KAN-000-TEST.md";
const PROSE = "docs/prose.md";

/** 카드 문서의 골격. 절 이름 넷은 스킬이 강제하는 것이고 도구가 그 넷만 안다. */
const cardDoc = (strategy: string, log: string, extraSection = ""): string =>
  [
    "---",
    "card: KAN-000-TEST",
    "---",
    "",
    "# KAN-000-TEST — 시험용 카드",
    "",
    "## 전략",
    strategy,
    "",
    "## 실행 계획",
    "- [ ] `S1` 무엇",
    "",
    "## 검증",
    "1. 통과한다.",
    "",
    extraSection,
    "## 수행 내역",
    log,
    "",
  ].join("\n");

const trees: string[] = [];

afterAll(async () => {
  for (const dir of trees) await rm(dir, { recursive: true, force: true });
});

async function makeTree(files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "check-citations-"));
  trees.push(dir);
  for (const [path, body] of Object.entries(files))
    await Bun.write(join(dir, path), body);
  return dir;
}

async function write(root: string, path: string, body: string) {
  await Bun.write(join(root, path), body);
}

async function call(root: string, mode: Mode = "check") {
  const result = await run(root, mode);
  return { ...result, text: [...result.out, ...result.err].join("\n") };
}

/** 대장을 만들고 「지금은 통과한다」를 먼저 고정한다. 이게 없으면 뒤의 실패가 무슨 뜻인지 모른다. */
async function baseline(root: string) {
  const made = await call(root, "update");
  expect(made.code).toBe(0);
  const clean = await call(root);
  expect(clean.code).toBe(0);
  return clean;
}

const CITED = "정본은 이 문장이다.";
const TARGET = ["# 대상 문서", "", CITED, "", "끝."].join("\n");

// ── 변형 ① 대상 파일 앞에 줄을 끼워 인용이 밀린 경우 ────────────────────────────

test("① 대상 앞에 줄이 끼면 인용이 밀린 것을 잡는다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `규약의 정본은 \`${at(T, 3)}\` 이다.\n`,
  });
  const clean = await baseline(root);
  expect(clean.text).toContain("대장 1행과 지문이 모두 일치한다");

  // 병합이 문서 앞에 한 문단을 끼워 넣은 상황. 인용 번호는 그대로이고 내용이 밀린다.
  await write(root, T, `# 머리말\n\n${TARGET}`);

  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).toContain("지문이 다르다");
  expect(after.text).toContain(`${SRC} → ${at(T, 3)}`);
  // 밀린 자리가 「내용이 있는 남의 줄」이라 존재 검사는 그대로 통과한다 — 그래서 이 검사가 있다.
  expect(after.text).toContain("인용 1건 전부 실재하는 비어 있지 않은 줄");
});

// ── 변형 ② 대상 줄 내용만 바뀐 경우 ─────────────────────────────────────────

test("② 대상 줄의 내용만 바뀌어도 잡는다 · 서식만 바뀐 것은 통과시킨다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `정본: \`${at(T, 3)}\`\n`,
  });
  await baseline(root);

  // 들여쓰기·공백 접기는 내용이 아니다. biome 재포맷과 표 정렬이 지문을 흔들면
  // 게이트가 서식 변화와 내용 변화를 가르지 못하고, 가르지 못하는 게이트는 꺼진다.
  await write(root, T, TARGET.replace(CITED, "   정본은\t이  문장이다.   "));
  expect((await call(root)).code).toBe(0);

  // 대소문자와 문장부호는 내용이다. 문장을 고치면 걸린다.
  await write(root, T, TARGET.replace(CITED, "정본은 저 문장이다."));
  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).toContain("지문이 다르다");
});

// ── 변형 ③ 경로 없는 인용이 밀린 경우 ───────────────────────────────────────

test("③ 경로 없는 인용(자기)이 밀린 것을 잡는다", async () => {
  const body = [
    "# 런북",
    "",
    "아래 표가 정본이다.",
    "",
    "| 축 | 무엇 |",
    "| --- | --- |",
    "| 축3 | 성장률 |",
    "",
    `위 표 ${bare(7)} 행이 축3 이다.`,
  ].join("\n");
  const root = await makeTree({ [RUNBOOK]: body });

  const clean = await baseline(root);
  // 경로 없는 인용도 대장에 든다 — 지금 정규식만 보면 이 꼴이 통째로 검사 밖이다.
  expect(clean.text).toContain("대장 1행과 지문이 모두 일치한다");

  await write(root, RUNBOOK, `머리말 한 줄.\n${body}`);

  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).toContain("지문이 다르다");
  expect(after.text).toContain(`${RUNBOOK} → ${at(RUNBOOK, 7)}`);
  // 해석 근거를 함께 낸다 — 「자기」라고 적혀 있는데 산문이 남의 파일을 말하면
  // 할 일은 `--update` 가 아니라 경로를 적어 인용을 고치는 것이다.
  expect(after.text).toContain("해석: 자기");
  expect(after.text).toContain("경로를 적어 인용을 고치는 것");
});

// ── 변형 ④ 붙임 · 자기 · 보류 세 코드 ──────────────────────────────────────

test("④ 경로 없는 인용이 규격의 표대로 갈린다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    // 붙임 — 닻과 인용 사이가 잇는 기호(공백·백틱·가운뎃점)뿐이다.
    "docs/attach.md": `정본은 \`${at(T, 3)}\` · ${bare(5)} 다.\n`,
    // 자기 — 같은 줄 앞에 닻이 없고 디렉터리 없는 이름 꼴도 없다.
    "docs/self.md": `# 머리\n\n본문 한 줄.\n\n위 ${bare(3)} 을 보라.\n`,
    // detached — 앞에 닻이 있으나 사이에 말이 끼었다.
    "docs/detached.md": `런북 \`${at(T, 3)}\`(불변 사실 230)을 보라. 위 표 ${bare(5)} 행은 다르다.\n`,
    // naked-name — 디렉터리 없는 `이름.확장자:줄` 꼴이 같은 줄에 있어 닻이 서지 않는다.
    "docs/naked.md": `${at("multiset.ts", 9)} 처럼 적으면 ${bare(3)} 은 풀 수 없다.\n`,
    // unresolved — 고른 해석으로 풀면 파일 밖이다.
    "docs/unresolved.md": `지워진 자리 ${bare(9999)} 를 적어 둔다.\n`,
  });

  const scan = await scanTree(root);
  expect(scan.problems).toEqual([]);
  expect(scan.counts.bare).toBe(5);
  expect(scan.counts.attached).toBe(1);
  expect(scan.counts.self).toBe(1);

  const codes = Object.fromEntries(
    scan.held.map((h) => [h.where.split("/")[1]?.split(".md")[0], h.code]),
  );
  expect(codes).toEqual({
    detached: "detached",
    naked: "naked-name",
    unresolved: "unresolved",
  });

  // 붙임은 닻의 경로로, 자기는 그 파일 자신으로 풀린다.
  const keys = scan.rows.map((r) => `${r.src} → ${at(r.target, r.targetLine)}`);
  expect(keys).toContain(`docs/attach.md → ${at(T, 5)}`);
  expect(keys).toContain(`docs/self.md → ${at("docs/self.md", 3)}`);
  // 보류는 대장에 없다 — detached 쪽 파일은 **닻(경로 인용)만** 행을 세운다.
  expect(keys).toContain(`docs/detached.md → ${at(T, 3)}`);
  expect(keys).not.toContain(`docs/detached.md → ${at(T, 5)}`);
  expect(keys.some((k) => k.startsWith("docs/naked.md"))).toBe(false);
  expect(keys.some((k) => k.startsWith("docs/unresolved.md"))).toBe(false);

  // 보류는 실패가 아니다 — 게이트는 **요약 한 줄**로 내고 통과시킨다.
  const checked = await call(root);
  expect(checked.code).toBe(0);
  expect(checked.text).toContain("보류는 대장 밖이다");
});

test("게이트는 보류를 요약 한 줄로만 내고, 전체 목록은 `--tsv` 가 낸다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    "docs/detached.md": `런북 \`${at(T, 3)}\`(불변 사실 230)을 보라. 위 표 ${bare(5)} 행은 다르다.\n`,
    "docs/naked.md": `${at("multiset.ts", 9)} 처럼 적으면 ${bare(3)} 은 풀 수 없다.\n`,
    "docs/unresolved.md": `지워진 자리 ${bare(9999)} 를 적어 둔다.\n`,
  });
  await baseline(root);

  // 게이트: 요약에 세 수가 다 들어가되 **건별 줄은 없다.** 없으면 CI 로그가 한 단계로 덮인다.
  const checked = await call(root);
  expect(checked.code).toBe(0);
  expect(checked.text).toContain(
    "보류 3(detached 1 · unresolved 1 · naked-name 1)",
  );
  expect(checked.text).toContain("전체 목록은");
  expect(checked.out.some((l) => l.includes("docs/detached.md"))).toBe(false);
  expect(checked.out.some((l) => l.includes("docs/naked.md"))).toBe(false);

  // `--tsv`: 건별 줄이 **셋 다** 나온다. stdout 은 대장이므로 목록은 stderr 다.
  const tsv = await call(root, "tsv");
  expect(tsv.code).toBe(0);
  for (const [file, code] of [
    ["docs/detached.md", "detached"],
    ["docs/naked.md", "naked-name"],
    ["docs/unresolved.md", "unresolved"],
  ])
    expect(
      tsv.err.some(
        (l) => l.includes(file as string) && l.endsWith(code as string),
      ),
    ).toBe(true);
  // stdout 은 대장뿐이다 — 보류는 대장 밖이므로 그 파일이 stdout 에 서면 안 된다.
  expect(tsv.out.some((l) => l.includes("docs/naked.md"))).toBe(false);
});

// ── 대장은 지금 인용 집합과 정확히 일치해야 한다 ─────────────────────────────

test("대장에 없는 인용과 고아 행도 실패다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `정본: \`${at(T, 3)}\`\n`,
  });
  await baseline(root);

  await write(root, SRC, `정본: \`${at(T, 3)}\` 과 \`${at(T, 5)}\`\n`);
  const added = await call(root);
  expect(added.code).toBe(1);
  expect(added.text).toContain("대장에 없는 인용");

  await write(root, SRC, "인용을 지웠다.\n");
  const removed = await call(root);
  expect(removed.code).toBe(1);
  expect(removed.text).toContain("인용이 사라진 대장 행");
});

test("범위 인용은 시작과 끝 두 행이고, 범위 안쪽에 줄이 끼면 끝에서 걸린다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `정본: \`${at(T, "3-5")}\`\n`,
  });
  await baseline(root);
  const ledger = parseLedger(await Bun.file(join(root, LEDGER_PATH)).text());
  expect([...ledger.rows.keys()].length).toBe(2);

  // 범위 **안쪽**에 줄이 끼면 시작 지문은 그대로이고 끝 번호만 남의 줄로 간다.
  await write(root, T, TARGET.replace(CITED, `${CITED}\n끼어든 줄.`));
  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).toContain(at(T, 5));
});

test("반쪽만 풀린 범위 인용이 남의 행을 지우지 않는다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    // 앞의 경로 인용이 3 행을 세운다. 뒤의 붙임 범위 인용은 시작 3 · 끝 999 라 보류인데,
    // 그때 3 행을 함께 거둬 가면 대장이 한 줄 비고 그 자리는 병합이 밀어도 조용하다.
    [SRC]: `정본 \`${at(T, 3)}\` · ${bare("3-999")}\n`,
  });
  const scan = await scanTree(root);
  expect(scan.held.map((h) => h.code)).toEqual(["unresolved"]);
  expect(scan.rows.map((r) => r.targetLine)).toEqual([3]);
});

// ── `--update` 의 안전장치 ─────────────────────────────────────────────────

test("존재 검사가 실패하면 `--update` 는 아무것도 쓰지 않고 1 로 끝낸다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `없는 줄: \`${at(T, 999)}\`\n`,
  });
  const updated = await call(root, "update");
  expect(updated.code).toBe(1);
  expect(updated.text).toContain("대장을 쓰지 않았다");
  // 가리킬 곳이 없는 인용을 대장에 굳히면 게이트가 그것을 정상으로 학습한다.
  expect(await Bun.file(join(root, LEDGER_PATH)).exists()).toBe(false);
});

test("래칫이 오르면 `--update` 도 아무것도 쓰지 않고 1 로 끝낸다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    "docs/held.md": `런북 \`${at(T, 3)}\` 을 보라. 표 ${bare(5)} 행은 다르다.\n`,
  });
  await baseline(root);
  const before = await Bun.file(join(root, LEDGER_PATH)).text();

  // 보류를 하나 늘린다. `check` 가 1 로 우는 자리이고, 그때 사람이 곧바로 누르는 것이
  // `--update` 다 — 새 인용마다 갱신이 의무이므로 이것은 예외가 아니라 일상 경로다.
  await write(
    root,
    "docs/held2.md",
    `${at("multiset.ts", 9)} 처럼 적으면 ${bare(3)} 은 풀 수 없다.\n`,
  );
  expect((await call(root)).code).toBe(1);

  const updated = await call(root, "update");
  expect(updated.code).toBe(1);
  expect(updated.text).toContain("대장을 쓰지 않았다");
  expect(updated.text).toContain("naked-name 이 0 → 1 로 늘었다");
  expect(updated.text).toContain(
    "bare(경로 없는 인용 전체) 이 1 → 2 로 늘었다",
  );
  expect(updated.text).toContain("경로를 적는 것");
  // 한 바이트도 움직이지 않는다 — 머리 주석의 래칫 수치가 올라가면 다음 검사가 통과한다.
  expect(await Bun.file(join(root, LEDGER_PATH)).text()).toBe(before);
  // 그래서 굳히기가 되지 않는다 — 갱신 뒤에도 게이트는 그대로 붉다.
  expect((await call(root)).code).toBe(1);

  // **내려가는 것은 막지 않는다.** 경로를 적어 고치면 보류가 줄고 갱신이 통과한다.
  await write(root, "docs/held2.md", `정본은 \`${at(T, 5)}\` 이다.\n`);
  const fixed = await call(root, "update");
  expect(fixed.code).toBe(0);
  const now = parseLedger(await Bun.file(join(root, LEDGER_PATH)).text());
  expect(now.ratchet?.nakedName).toBe(0);
  expect((await call(root)).code).toBe(0);
});

test("`--update` 는 키가 같은 행의 flag 를 보존하고, 키가 바뀐 행은 `-` 로 선다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `정본: \`${at(T, 3)}\`\n`,
  });
  await baseline(root);

  const text = await Bun.file(join(root, LEDGER_PATH)).text();
  await write(root, LEDGER_PATH, text.replace(/\t-\n/, "\tdrift\n"));

  // 대상 줄의 내용이 바뀌어도 키(src·target·target_line)가 같으면 표시가 남는다.
  await write(root, T, TARGET.replace(CITED, "정본은 고친 문장이다."));
  await call(root, "update");
  const kept = parseLedger(await Bun.file(join(root, LEDGER_PATH)).text());
  expect(kept.rows.get(key(SRC, T, 3))?.flag).toBe("drift");

  // 인용을 고치면 새 키다 — 고쳤으니 표시가 사라지는 것이 맞다.
  await write(root, SRC, `정본: \`${at(T, 5)}\`\n`);
  await call(root, "update");
  const fresh = parseLedger(await Bun.file(join(root, LEDGER_PATH)).text());
  expect(fresh.rows.get(key(SRC, T, 5))?.flag).toBe("-");
  expect(fresh.rows.has(key(SRC, T, 3))).toBe(false);
});

test("`--tsv` 는 파일에 쓰지 않고 stdout 으로만 낸다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `정본: \`${at(T, 3)}\`\n`,
  });
  const tsv = await call(root, "tsv");
  expect(tsv.code).toBe(0);
  expect(tsv.out[0]).toBe(
    ["# src", "target", "target_line", "fingerprint", "flag"].join("\t"),
  );
  // 지문은 SHA-256 앞 12 자리다. 정규화(공백 접기)를 거친 줄에 건다.
  expect(tsv.out.at(-1)).toBe(
    [SRC, T, 3, fingerprintOf(CITED), "-"].join("\t"),
  );
  expect(fingerprintOf(CITED)).toMatch(/^[0-9a-f]{12}$/);
  expect(await Bun.file(join(root, LEDGER_PATH)).exists()).toBe(false);
});

// ── 보류 래칫 ─────────────────────────────────────────────────────────────

test("보류가 늘면 실패한다(래칫)", async () => {
  const root = await makeTree({
    [T]: TARGET,
    "docs/held.md": `런북 \`${at(T, 3)}\` 을 보라. 표 ${bare(5)} 행은 다르다.\n`,
  });
  await baseline(root);

  // 보류를 하나 늘린다. 이 꼴은 대장 행을 세우지 않으므로 **래칫만** 걸린다 —
  // 표류와 섞이지 않아야 「래칫이 실제로 무는지」가 보인다.
  await write(
    root,
    "docs/held2.md",
    `${at("multiset.ts", 9)} 처럼 적으면 ${bare(3)} 은 풀 수 없다.\n`,
  );
  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).not.toContain("대장과 어긋나는 자리");
  expect(after.text).toContain("보류 래칫이 깨졌다");
  expect(after.text).toContain("naked-name 이 0 → 1 로 늘었다");
  expect(after.text).toContain("bare(경로 없는 인용 전체) 이 1 → 2 로 늘었다");
});

// ── 대장이 없을 때 ────────────────────────────────────────────────────────

test("대장이 없으면 표류 검사를 건너뛰고 그 사실을 알린다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `정본: \`${at(T, 3)}\`\n`,
  });
  const result = await call(root);
  expect(result.code).toBe(0);
  expect(result.text).toContain(
    `대장 ${LEDGER_PATH} 가 없어 표류 검사를 건너뛴다`,
  );
});

// ── 예외 ─────────────────────────────────────────────────────────────────

test("E2 — 대상이 KANBAN.reviews 인 인용은 대장에 넣지 않는다(존재 검사는 그대로)", async () => {
  const review = "KANBAN.reviews/r1.md";
  const root = await makeTree({
    [review]: TARGET,
    [T]: TARGET,
    [SRC]: `검토서 \`${at(review, 3)}\` 과 정본 \`${at(T, 3)}\`\n`,
  });
  const scan = await scanTree(root);
  expect(scan.checked).toBe(2); // 존재 검사는 둘 다 돈다
  expect(scan.problems).toEqual([]);
  expect(scan.rows.map((r) => r.target)).toEqual([T]);
});

test("E1 — 출처가 KANBAN 문서인 파일은 인용을 세지 않는다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    "KANBAN.batches/b1.md": `그때는 \`${at(T, 999)}\` 였다.\n`,
  });
  const scan = await scanTree(root);
  expect(scan.checked).toBe(0);
  expect(scan.rows).toEqual([]);
});

// ── KAN-047 — 예외 E1 의 새 경계 · 범위 끝 줄 · 맨 줄 번호 ─────────────────────
//
//    셋 다 「게이트가 조용했던 자리」다. 그래서 여기서도 재는 것은 통과가 아니라 **변형을
//    넣으면 실패한다** 이고, ⓑ 만 반대다 — 예외가 **좁게** 남아 있는지를 잰다.

test("ⓐ 카드 문서의 「전략」 절 인용이 밀리면 실패한다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [CARD]: cardDoc(
      `정본은 \`${at(T, 3)}\` 이다.`,
      `- 2026-09-16 · 그때는 \`${at(T, 5)}\` 였다.`,
    ),
  });
  // 대장에 서는 것은 「전략」 절 하나다 — 「수행 내역」 절은 예외라 세지도 않는다.
  const clean = await baseline(root);
  expect(clean.text).toContain("대장 1행과 지문이 모두 일치한다");
  expect((await scanTree(root)).checked).toBe(1);

  await write(root, T, `# 머리말\n\n${TARGET}`);

  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).toContain("지문이 다르다");
  expect(after.text).toContain(`${CARD} → ${at(T, 3)}`);
});

test("ⓑ 「수행 내역」 절 인용은 밀려도 통과한다 — 예외는 그 절 하나다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [CARD]: cardDoc(
      `정본은 \`${at(T, 3)}\` 이다.`,
      `- 2026-09-16 · 그때는 \`${at(T, 5)}\` 였다.`,
    ),
  });
  await baseline(root);

  // 기록이 가리키던 줄의 내용이 바뀌었다. 고치면 기록이 거짓이 되므로 게이트는 조용하다.
  await write(root, T, TARGET.replace("끝.", "고친 끝."));
  expect((await call(root)).code).toBe(0);

  // 같은 변형을 「전략」 절이 가리키면 잡힌다 — 예외가 절 하나로 좁다는 증거다.
  const live = await makeTree({
    [T]: TARGET,
    [CARD]: cardDoc(`정본은 \`${at(T, 5)}\` 이다.`, "- 기록 없음"),
  });
  await baseline(live);
  await write(live, T, TARGET.replace("끝.", "고친 끝."));
  const after = await call(live);
  expect(after.code).toBe(1);
  expect(after.text).toContain("지문이 다르다");
});

test("ⓒ 카드 문서에 모르는 `## ` 제목이 생기면 실패한다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [CARD]: cardDoc(
      `정본은 \`${at(T, 3)}\` 이다.`,
      "- 기록 없음",
      `## 메모\n\n딴 절의 인용 \`${at(T, 5)}\`.\n`,
    ),
  });

  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).toContain("모르는 절은 검사 밖으로 빠지지 않는다");

  // **새는 방향이 뒤집혔다는 것이 이 설계의 전부다** — 모르는 절은 검사 밖으로 빠지는 것이
  // 아니라 검사 대상으로 남고, 게이트는 그 위에서 붉어진다.
  const scan = await scanTree(root);
  const keys = scan.rows.map((r) => `${r.src} → ${at(r.target, r.targetLine)}`);
  expect(keys).toContain(`${CARD} → ${at(T, 5)}`);
});

test("ⓓ 범위 인용의 끝이 빈 줄이면 존재 검사가 잡는다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `정본: \`${at(T, "3-4")}\`\n`,
  });

  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).toContain("범위의 끝");
  expect(after.text).toContain(`${at(T, 4)} 이 빈 줄이다`);

  // 대장에 행이 서지 않는 구조는 그대로 둔다(빈 줄은 지문이 없다) — 존재 검사가 먼저 잡는다.
  const scan = await scanTree(root);
  expect(scan.rows.map((r) => r.targetLine)).toEqual([3]);

  // 내용이 있는 줄까지로 줄이면 통과한다.
  await write(root, SRC, `정본: \`${at(T, "3-5")}\`\n`);
  expect((await call(root)).code).toBe(0);
});

test("ⓔ 산문 속 맨 줄 번호가 늘면 실패한다(래칫)", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [PROSE]: `정본은 ${naked(120)} 근처다.\n`,
  });
  await baseline(root);
  const ledger = parseLedger(await Bun.file(join(root, LEDGER_PATH)).text());
  expect(ledger.nakedLine).toBe(1);

  await write(
    root,
    PROSE,
    `정본은 ${naked(120)} 근처다.\n표는 ${naked(340)} 부터다.\n`,
  );
  const after = await call(root);
  expect(after.code).toBe(1);
  expect(after.text).toContain("맨 줄 번호 래칫이 깨졌다");
  expect(after.text).toContain("1 → 2");
  expect(after.text).toContain("`경로:줄` 또는 백틱 인용으로 적는다");

  // 굳히기가 되지 않는다 — 래칫이 오른 채로 갱신하면 아무것도 쓰지 않는다.
  const before = await Bun.file(join(root, LEDGER_PATH)).text();
  const updated = await call(root, "update");
  expect(updated.code).toBe(1);
  expect(await Bun.file(join(root, LEDGER_PATH)).text()).toBe(before);

  // **코드펜스 안은 세지 않는다** — 예시와 로그 사본이다(세는 규칙 ③).
  await write(
    root,
    PROSE,
    [
      `정본은 ${naked(120)} 근처다.`,
      "```",
      `예시: ${naked(340)}`,
      "```",
      "",
    ].join("\n"),
  );
  expect((await call(root)).code).toBe(0);
});

test("머리 주석에 없는 래칫 칸은 「올랐다」가 아니다 — 다음 갱신이 기준선으로 앉힌다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [PROSE]: `정본은 ${naked(120)} 근처다.\n`,
    [CARD]: cardDoc(`정본 \`${at(T, 3)}\` · ${bare(5)} 다.`, "- 기록 없음"),
  });
  await baseline(root);

  // 검사 집합이 넓어지기 전의 대장을 흉내 낸다 — 새 칸 둘이 아직 없는 머리 주석이다.
  const text = await Bun.file(join(root, LEDGER_PATH)).text();
  const old = text
    .split("\n")
    .filter((l) => !l.startsWith("# cards") && !l.startsWith("# naked-line"))
    .join("\n");
  await write(root, LEDGER_PATH, old);
  const parsed = parseLedger(old);
  expect(parsed.ratchet).not.toBeNull();
  expect(parsed.cardRatchet).toBeNull();
  expect(parsed.nakedLine).toBeNull();

  // 없는 칸은 오른 것이 아니다. 그래서 규격이 검사 집합을 넓힌 카드가 **한 번** 갱신할 수 있다.
  expect((await call(root)).code).toBe(0);
  expect((await call(root, "update")).code).toBe(0);
  const now = parseLedger(await Bun.file(join(root, LEDGER_PATH)).text());
  expect(now.nakedLine).toBe(1);
  expect(now.cardRatchet?.bare).toBe(1);

  // 앉은 뒤에는 다른 칸과 같다 — 오르면 실패다.
  await write(root, PROSE, `정본은 ${naked(120)} · ${naked(340)} 근처다.\n`);
  expect((await call(root)).code).toBe(1);
});

test("E4 — `경로:줄:열` 꼴은 인용이 아니다", async () => {
  const root = await makeTree({
    [T]: TARGET,
    [SRC]: `at f (${at(T, "3:11")}) 은 실행 로그의 사본이다.\n`,
  });
  const scan = await scanTree(root);
  expect(scan.checked).toBe(0);
  expect(scan.rows).toEqual([]);
});

// ── 이 시험 파일 자신이 게이트를 오염시키지 않는가 ────────────────────────────

test("이 시험 파일에는 인용 꼴이 하나도 없다(래칫 오염 방지)", async () => {
  // 규격이 제 예시에 `NN`·`MM` 을 쓴 것과 같은 자리다. helper 를 우회해 fixture 를 글자
  // 그대로 적으면 이 단정이 먼저 깨진다 — 실물 게이트가 24 건으로 우는 것보다 낫다.
  const source = await Bun.file(import.meta.path).text();
  const pathCitation =
    /(?<![A-Za-z0-9_./-])(?!\.{3})[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+\.(?:md|mdx|ts|tsx|rs|json|tsv):\d+/g;
  expect(source.match(pathCitation)).toBeNull();
  expect(source.match(/`:\d+(?:-\d+)?`/g)).toBeNull();
});
