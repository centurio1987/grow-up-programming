/**
 * 재작성률 계측기 — **구성 지적을 받은 절이 실제로 다시 쓰였는가.**
 *
 * 2026-08-27 유저 지적으로 생겼다 — *"기존 글에 끼워 넣듯이 성의 없이 피드백 반영을 위한
 * 반영을 해서 내용을 엉망으로 만들지 말고, 핵심 아이디어의 요점이 잘 드러나도록 내용 구성을
 * 다시 짜서 작성해야지"*. 그 전 회차에서 실제로 한 일은 **문단을 옮기고 걸음 번호를 다시
 * 붙인 것**이었다. 절 제목과 순서는 바뀌었는데 문장은 거의 그대로였고, 그것이 유저에게
 * 「끼워 넣기」로 읽혔다.
 *
 * 사람 눈에는 diff 가 커 보여서 구분이 안 된다 — 문단을 옮기기만 해도 `git diff` 는 절 전체를
 * 바뀐 것으로 표시한다. 그래서 **옮긴 줄과 새로 쓴 줄을 갈라서 센다.** 옛 판에 똑같이 있던
 * 줄은 위치가 달라져도 **재사용**이고, 옛 판에 없던 줄만 **새로 쓴 것**이다.
 *
 * ```bash
 * bun run tools/check-rework.ts <파일> '<절 헤딩 접두>' [--base <git ref>] [--min <비율>]
 * ```
 *
 * 종료코드: 0 통과 · 1 재작성률 미달 · 2 대상을 찾지 못함
 *
 * **임계값은 지적의 종류가 정한다.** 문구 하나를 고치는 반영에 이 도구를 대지 않는다.
 * 「구성을 다시 짜라」·「요점이 안 드러난다」·「끼워 넣지 마라」 부류의 지적에만 건다.
 */
const DEFAULT_MIN = 0.6;

export interface Rework {
  /** 새 판에서 그 절의 줄 수(빈 줄 제외). */
  lines: number;
  /** 그중 옛 판의 그 절에 **없던** 줄 수. */
  fresh: number;
  /** `fresh / lines`. */
  rate: number;
  /** 옛 판에 있었고 새 판에도 그대로 남은 줄. 위치가 달라도 재사용으로 센다. */
  reused: string[];
}

/**
 * 헤딩 접두로 절 하나를 잘라 낸다. **같은 레벨 이상의 다음 헤딩 직전까지**다.
 *
 * 경계를 `## ` 로 못박아 두었더니 2026-08-28 개정에서 틀린 값을 냈다. 문서가 파트 둘로
 * 갈리면서 항목이 `###` 로 내려갔는데, 그러면 `### 전체 컨셉` 을 자를 때 다음 `## 파트 2`
 * 까지가 통째로 딸려 와 **파트 전체가 한 절로 측정된다**(재작성률 82%가 나왔지만 그 절은
 * 30줄짜리였다). 접두의 `#` 개수를 세어 경계를 정한다.
 */
export function slice(text: string, headingPrefix: string): string[] | null {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith(headingPrefix));
  if (start < 0) return null;
  const level = /^(#+) /.exec(headingPrefix)?.[1]?.length ?? 2;
  let end = lines.length;
  let fenced = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i] ?? "";
    // 펜스 안의 `#` 는 헤딩이 아니다 — ascii 도식과 셸 주석이 그 모양으로 나온다.
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    if (fenced) continue;
    const hit = /^(#+) /.exec(line);
    if (hit && (hit[1]?.length ?? 99) <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end);
}

/** 공백만 다른 줄을 같은 줄로 본다 — 들여쓰기를 바꿔 새 줄로 위장하지 못하게. */
const norm = (line: string): string => line.replace(/\s+/g, " ").trim();

export function rework(before: string[], after: string[]): Rework {
  const old = new Set(before.map(norm).filter((l) => l !== ""));
  const body = after.map(norm).filter((l) => l !== "");
  const reused = body.filter((l) => old.has(l));
  const fresh = body.length - reused.length;
  return {
    lines: body.length,
    fresh,
    rate: body.length === 0 ? 0 : fresh / body.length,
    reused,
  };
}

if (import.meta.main) {
  const argv = Bun.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i < 0 ? undefined : argv[i + 1];
  };
  const positional = argv.filter(
    (a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"),
  );
  const [file, heading] = positional;
  if (file === undefined || heading === undefined) {
    console.error(
      "쓰임: bun run tools/check-rework.ts <파일> '<절 헤딩 접두>' [--base <ref>] [--min <비율>]",
    );
    process.exit(2);
  }

  const base = flag("--base") ?? "HEAD";
  const min = Number(flag("--min") ?? DEFAULT_MIN);
  const after = slice(await Bun.file(file).text(), heading);
  if (after === null) {
    console.error(`절을 찾지 못했다 — ${heading}`);
    process.exit(2);
  }

  const shown = await Bun.$`git show ${`${base}:./${file}`}`.quiet().nothrow();
  if (shown.exitCode !== 0) {
    console.error(`${base} 에서 ${file} 을 읽지 못했다`);
    process.exit(2);
  }
  const before = slice(shown.stdout.toString(), heading) ?? [];

  const r = rework(before, after);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  console.log(`${file} · ${heading}`);
  console.log(
    `  ${base} 대비 — 전체 ${r.lines}줄 · 새로 쓴 줄 ${r.fresh} · 재작성률 ${pct(r.rate)} (기준 ${pct(min)})`,
  );
  if (r.reused.length > 0) {
    console.log(`  옛 판에서 그대로 가져온 줄 ${r.reused.length}개:`);
    for (const l of r.reused.slice(0, 12)) console.log(`    ${l.slice(0, 88)}`);
    if (r.reused.length > 12)
      console.log(`    … 그 밖 ${r.reused.length - 12}개`);
  }
  if (r.rate < min) {
    console.error(
      "\n재작성이 아니라 재배치다 — 문단을 옮기고 번호를 다시 붙인 것은 구성 지적의 반영이 아니다.",
    );
    process.exit(1);
  }
  console.log("\n통과 — 구성이 다시 짜였다.");
}
