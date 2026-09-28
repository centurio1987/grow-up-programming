/**
 * 인용 줄 번호를 **자동으로 다시 맞춘다** — 대상 파일에 줄이 늘거나 줄어 `경로:줄` 인용이 밀렸을 때.
 *
 * ## 왜 있는가
 *
 * `check-citations.ts` 는 인용이 가리키던 줄의 지문(`tools/_baseline/citations.tsv`)을 대조해 표류를
 * 잡는다. 잡는 것까지만 하고 고치지는 않는다. 그런데 표류의 대부분은 **내용은 그대로이고 줄만 밀린
 * 것**이다 — 검사기(`tools/check-v2.ts`)에 함수를 하나 더하면 그 아래를 가리키던 다른 카드·문서의
 * 인용이 한꺼번에 어긋난다. KAN-057 에서 이것을 세 번 손으로 옮겼다(유저 지시 2026-09-28:
 * *"줄번호 자동으로 맞추는 도구 만들어"*).
 *
 * ## 어떻게 옮기는가 — 내용이 같다는 것을 확인한 것만
 *
 * 1. 대장을 마지막으로 갱신한 커밋을 기준으로 잡는다. 그 커밋에서 대장과 대상 파일은 맞았다.
 * 2. 대장 행마다 지금 그 줄의 지문을 본다. 같으면 둔다.
 * 3. 다르면 `git diff -U0 <기준> -- <대상>` 의 변경 구간으로 옛 줄의 새 자리를 계산한다. 그 자리의
 *    지문이 대장과 같을 때만 옮긴다.
 * 4. 옛 줄이 바뀐 구간 안에 있어 계산이 안 되면, 같은 지문을 가진 줄이 파일에 **하나뿐일 때만**
 *    그 줄로 옮긴다. 여럿이면(`});` 같은 흔한 줄) 옮기지 않는다.
 * 5. 옮긴 번호로 인용한 문서의 `경로:줄` · `경로:시작-끝` 을 고친다. 같은 줄에 그 경로가 앞서 있으면
 *    뒤따르는 백틱 인용(`` `:줄` ``)도 함께 고친다.
 *
 * **못 옮긴 것은 고치지 않고 목록으로 낸다.** 그것은 가리키던 내용이 바뀐 것이라 사람이 인용을 다시
 * 써야 한다 — 기계가 가장 가까운 줄로 옮기면 인용이 조용히 남의 줄을 가리킨다(`check-citations.ts`
 * 머리가 막으려는 바로 그 사고다).
 *
 * ```bash
 * bun run tools/remap-citations.ts            # 옮기고, 남은 표류가 없으면 대장도 갱신한다
 * bun run tools/remap-citations.ts --dry-run  # 무엇을 옮길지만 보인다
 * ```
 *
 * 종료코드: 0 옮길 것이 없거나 다 옮김 · 1 못 옮긴 인용이 남음 · 2 사용법 오류
 */

import { join, resolve } from "node:path";
import {
  fingerprintOf,
  LEDGER_PATH,
  parseLedger,
  run,
} from "./check-citations.ts";

export interface Hunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
}

/** `git diff -U0` 의 `@@ -a,b +c,d @@` 머리들을 읽는다. 개수가 빠지면 1 이다. */
export function parseHunks(diff: string): Hunk[] {
  const out: Hunk[] = [];
  for (const m of diff.matchAll(
    /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm,
  )) {
    out.push({
      oldStart: Number(m[1]),
      oldCount: m[2] === undefined ? 1 : Number(m[2]),
      newStart: Number(m[3]),
      newCount: m[4] === undefined ? 1 : Number(m[4]),
    });
  }
  return out;
}

/**
 * 옛 줄 `x` 의 새 번호. 바뀐 구간 안의 줄이면 `null` — 그 줄은 내용이 바뀌었거나 지워졌다.
 * 순수 삽입(`-a,0`)은 옛 줄 `a` **뒤**에 들어가므로 `a` 보다 큰 줄만 민다.
 */
export function mapLine(hunks: readonly Hunk[], x: number): number | null {
  let shift = 0;
  for (const h of hunks) {
    if (h.oldCount === 0) {
      if (x > h.oldStart) shift += h.newCount;
      continue;
    }
    if (x < h.oldStart) break;
    if (x <= h.oldStart + h.oldCount - 1) return null;
    shift += h.newCount - h.oldCount;
  }
  return x + shift;
}

/** 파일에서 지문이 같은 줄 번호 전부. */
export function linesWithFingerprint(
  lines: readonly string[],
  fp: string,
): number[] {
  const out: number[] = [];
  for (const [i, line] of lines.entries())
    if (fingerprintOf(line) === fp) out.push(i + 1);
  return out;
}

const escapeRe = (s: string): string =>
  s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * 문서 한 편에서 `target` 을 가리키는 인용의 줄 번호를 `moves`(옛 → 새)대로 고친다.
 * 범위의 두 끝은 따로 옮긴다. 경로 인용과 같은 줄에서 그 뒤에 붙은 백틱 인용(`` `:줄` ``)도 고친다.
 */
export function rewriteCitations(
  text: string,
  target: string,
  moves: ReadonlyMap<number, number>,
  /**
   * 쉼표로 이은 뒷번호(`경로:10,20` 의 20)의 새 번호. 인용 검사가 추적하지 않는 꼴이라 지문이 없으므로
   * 변경 구간 계산만 쓴다 — 바뀐 줄이면 `null` 을 돌려 그대로 둔다.
   */
  follow: (n: number) => number | null = () => null,
): { text: string; changed: number } {
  let changed = 0;
  const mv = (n: string): string => {
    const to = moves.get(Number(n));
    if (to === undefined || to === Number(n)) return n;
    changed++;
    return String(to);
  };
  const path = new RegExp(
    `(?<![A-Za-z0-9_./-])(${escapeRe(target)}):(\\d+)(?:-(\\d+))?((?:,\\d+)*)(?!:\\d)`,
    "g",
  );
  const tailNumbers = (list: string): string =>
    list.replace(/\d+/g, (n) => {
      const to = moves.get(Number(n)) ?? follow(Number(n));
      if (to === null || to === Number(n)) return n;
      changed++;
      return String(to);
    });
  const otherPath =
    /(?<![A-Za-z0-9_./-])[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+\.(?:md|mdx|ts|tsx|rs|json|tsv)(?=:\d)/g;
  const lines = text.split("\n").map((line) => {
    if (!line.includes(target)) return line;
    const at = line.indexOf(target);
    const head = line.slice(0, at);
    let tail = line
      .slice(at)
      .replace(
        path,
        (_, p: string, a: string, b: string | undefined, list: string) =>
          (b === undefined ? `${p}:${mv(a)}` : `${p}:${mv(a)}-${mv(b)}`) +
          tailNumbers(list),
      );
    // 같은 줄에서 경로 뒤에 붙은 백틱 인용 — `check-citations` 의 「붙임」과 같은 자리다.
    // **다른 파일 경로가 나오기 전까지만** 본다. 그 뒤의 백틱 인용은 그 파일에 붙는다.
    otherPath.lastIndex = target.length;
    let stop = tail.length;
    for (const m of tail.matchAll(otherPath)) {
      if (m.index > 0 && m[0] !== target) {
        stop = m.index;
        break;
      }
    }
    const own = tail
      .slice(0, stop)
      .replace(/`:(\d+)(?:-(\d+))?`/g, (_, a: string, b: string | undefined) =>
        b === undefined ? `\`:${mv(a)}\`` : `\`:${mv(a)}-${mv(b)}\``,
      );
    tail = own + tail.slice(stop);
    return head + tail;
  });
  return { text: lines.join("\n"), changed };
}

export interface Move {
  src: string;
  target: string;
  from: number;
  to: number;
  how: "diff" | "unique";
}

export interface Stuck {
  src: string;
  target: string;
  line: number;
  why: string;
}

async function git(root: string, args: string[]): Promise<string> {
  const p = Bun.spawnSync(["git", ...args], { cwd: root });
  if (p.exitCode !== 0)
    throw new Error(`git ${args.join(" ")} 실패: ${p.stderr}`);
  return p.stdout.toString();
}

export async function plan(
  root: string,
): Promise<{
  moves: Move[];
  stuck: Stuck[];
  base: string;
  hunksOf: Map<string, Hunk[]>;
}> {
  const ledger = parseLedger(await Bun.file(join(root, LEDGER_PATH)).text());
  const base = (
    await git(root, ["log", "-1", "--format=%H", "--", LEDGER_PATH])
  ).trim();
  const moves: Move[] = [];
  const stuck: Stuck[] = [];
  const hunksOf = new Map<string, Hunk[]>();
  const linesOf = new Map<string, string[]>();
  for (const row of ledger.rows.values()) {
    const file = Bun.file(join(root, row.target));
    if (!(await file.exists())) {
      stuck.push({
        src: row.src,
        target: row.target,
        line: row.targetLine,
        why: "대상 파일이 없다",
      });
      continue;
    }
    if (!linesOf.has(row.target))
      linesOf.set(row.target, (await file.text()).split("\n"));
    const lines = linesOf.get(row.target) as string[];
    if (fingerprintOf(lines[row.targetLine - 1] ?? "") === row.fingerprint)
      continue;
    if (!hunksOf.has(row.target))
      hunksOf.set(
        row.target,
        parseHunks(await git(root, ["diff", "-U0", base, "--", row.target])),
      );
    const mapped = mapLine(hunksOf.get(row.target) as Hunk[], row.targetLine);
    if (
      mapped !== null &&
      fingerprintOf(lines[mapped - 1] ?? "") === row.fingerprint
    ) {
      moves.push({
        src: row.src,
        target: row.target,
        from: row.targetLine,
        to: mapped,
        how: "diff",
      });
      continue;
    }
    const same = linesWithFingerprint(lines, row.fingerprint);
    if (same.length === 1) {
      moves.push({
        src: row.src,
        target: row.target,
        from: row.targetLine,
        to: same[0] as number,
        how: "unique",
      });
      continue;
    }
    stuck.push({
      src: row.src,
      target: row.target,
      line: row.targetLine,
      why:
        same.length === 0
          ? "가리키던 내용이 파일에서 없어졌다 — 인용을 다시 써야 한다"
          : `같은 내용의 줄이 ${same.length} 개라 어느 쪽인지 정할 수 없다(${same.slice(0, 5).join("·")})`,
    });
  }
  return { moves, stuck, base, hunksOf };
}

async function main(argv: string[]): Promise<number> {
  const flags = argv.filter((a) => a.startsWith("--"));
  if (flags.some((f) => f !== "--dry-run")) {
    console.error("사용법: bun run tools/remap-citations.ts [--dry-run]");
    return 2;
  }
  const dry = flags.includes("--dry-run");
  const root = resolve(import.meta.dir, "..");
  const { moves, stuck, base, hunksOf } = await plan(root);
  if (moves.length === 0 && stuck.length === 0) {
    console.log("옮길 인용이 없다 — 대장과 지문이 모두 맞는다.");
    return 0;
  }
  console.log(`기준: 대장을 마지막으로 갱신한 커밋 ${base.slice(0, 7)}`);
  for (const m of moves)
    console.log(
      `  옮김  ${m.src} → ${m.target}:${m.from} → :${m.to}  (${m.how === "diff" ? "변경 구간 계산" : "같은 내용의 줄이 하나"})`,
    );
  for (const s of stuck)
    console.error(`  못 옮김  ${s.src} → ${s.target}:${s.line} — ${s.why}`);

  if (!dry && moves.length > 0) {
    // 문서마다, 대상마다 옛 → 새 표를 모아 한 번에 고친다.
    const bySrc = new Map<string, Map<string, Map<number, number>>>();
    for (const m of moves) {
      const t = bySrc.get(m.src) ?? new Map<string, Map<number, number>>();
      const mv = t.get(m.target) ?? new Map<number, number>();
      mv.set(m.from, m.to);
      t.set(m.target, mv);
      bySrc.set(m.src, t);
    }
    for (const [src, targets] of bySrc) {
      let text = await Bun.file(join(root, src)).text();
      let n = 0;
      for (const [target, mv] of targets) {
        const hunks = hunksOf.get(target) ?? [];
        const r = rewriteCitations(text, target, mv, (n) => mapLine(hunks, n));
        text = r.text;
        n += r.changed;
      }
      await Bun.write(join(root, src), text);
      console.log(`  고침  ${src} — 번호 ${n} 곳`);
    }
    if (stuck.length === 0) {
      const r = await run(root, "update");
      for (const line of r.out) console.log(line);
      for (const line of r.err) console.error(line);
      if (r.code !== 0) return 1;
    } else {
      console.error(
        "\n못 옮긴 인용이 있어 대장은 갱신하지 않았다. 그 인용을 고친 뒤 `bun run tools/check-citations.ts --update`.",
      );
    }
  }
  return stuck.length === 0 ? 0 : 1;
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
