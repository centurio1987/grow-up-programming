/**
 * `purpose.alt` 의 수치를 실측하는 하네스 — L13.
 *
 * **결정론적 계수만 낸다.** 비교 횟수 · 포인터 이동 칸 수 · 방문 노드 수처럼 같은 입력에서
 * 항상 같은 값이 나오는 것. 벽시계·처리량은 안 쓴다 — 실행마다 달라서 "본문의 수치가
 * 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 * voice 규칙 10 이 "실측으로 확인된 값만" 을 요구하는데, 손으로 적은 수치는 그 요구를
 * 만족하는 척만 한다. 그래서 경쟁 설계를 **실제로 돌려** 센다.
 *
 * `.alt.ts` 계약:
 *
 * ```ts
 * export const cases = {
 *   "이 알고리즘": () => ({ 비교: 34 }),
 *   "이진 탐색": () => ({ 비교: 172 }),
 * };
 * ```
 *
 * 각 함수는 **같은 입력**을 쓰고 계수만 돌려준다. 키가 곧 본문에 실릴 이름이다.
 *
 * ```bash
 * bun run tools/bench-alt.ts <name>-guide.alt.ts    # <name>-guide.bench.json 을 낸다
 * bun run tools/bench-alt.ts --check <...>          # 이미 있는 json 과 같은지만 본다
 * ```
 *
 * 종료코드: 0 정상 · 1 불일치(--check) · 2 대상 없음/계약 위반
 */

import { resolve } from "node:path";

export type BenchCase = () => Record<string, number>;

/** 실행 결과를 `{ "설계 이름 · 계수 이름": 값 }` 한 층으로 편다. */
export function flatten(
  cases: Record<string, BenchCase>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [design, fn] of Object.entries(cases)) {
    const counts = fn();
    for (const [metric, value] of Object.entries(counts)) {
      if (!Number.isInteger(value)) {
        throw new Error(
          `${design} · ${metric} 가 정수가 아니다(${value}) — 결정론적 계수만 싣는다`,
        );
      }
      out[`${design} · ${metric}`] = value;
    }
  }
  return out;
}

/** 두 번 돌려 같은 값이 나오는지 본다. 다르면 결정론이 아니다. */
export function assertDeterministic(cases: Record<string, BenchCase>): void {
  const a = flatten(cases);
  const b = flatten(cases);
  for (const key of Object.keys(a)) {
    if (a[key] !== b[key]) {
      throw new Error(
        `${key} 가 실행마다 다르다(${a[key]} → ${b[key]}) — 벽시계나 난수를 쓰고 있다`,
      );
    }
  }
}

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const checkOnly = args.includes("--check");
  const target = args.find((a) => !a.startsWith("--"));
  if (target === undefined) {
    console.error(
      "용법: bun run tools/bench-alt.ts [--check] <name>-guide.alt.ts",
    );
    process.exit(2);
  }

  const path = resolve(target);
  if (!(await Bun.file(path).exists())) {
    console.error(`대상이 없다: ${target}`);
    process.exit(2);
  }

  const mod = (await import(path)) as { cases?: Record<string, BenchCase> };
  if (mod.cases === undefined) {
    console.error(`${target} 가 \`cases\` 를 내보내지 않는다`);
    process.exit(2);
  }

  try {
    assertDeterministic(mod.cases);
  } catch (error) {
    console.error(String(error instanceof Error ? error.message : error));
    process.exit(2);
  }

  const counts = flatten(mod.cases);
  const outPath = path.replace(/\.alt\.ts$/, ".bench.json");

  if (checkOnly) {
    const existing = Bun.file(outPath);
    if (!(await existing.exists())) {
      console.error(`${outPath} 가 없다 — 먼저 --check 없이 한 번 돌린다`);
      process.exit(1);
    }
    const before = (await existing.json()) as Record<string, number>;
    const drifted = Object.keys({ ...before, ...counts }).filter(
      (k) => before[k] !== counts[k],
    );
    if (drifted.length > 0) {
      console.error(`실측값이 바뀌었다 — ${drifted.join(", ")}`);
      console.error("본문의 수치도 함께 고쳐야 한다(P10 이 잡는다).");
      process.exit(1);
    }
    console.log(`${outPath} — 실측값 ${Object.keys(counts).length}개 그대로.`);
    process.exit(0);
  }

  await Bun.write(outPath, `${JSON.stringify(counts, null, 2)}\n`);
  console.log(`${outPath} — 실측값 ${Object.keys(counts).length}개.`);
  for (const [key, value] of Object.entries(counts)) {
    console.log(`  ${key} = ${value}`);
  }
}
