/**
 * `algo-guide-v2` 전개 WBS 상태 계산기 — `KAN-034` `S4`.
 *
 * **상태를 어느 문서에도 적지 않는다.** 병렬 세션이 상태 파일을 함께 고치면 그 파일이 곧
 * 충돌 지점이 되고, 병렬화가 막으려던 것이 상태 관리에서 그대로 돌아온다(`ord006-wbs.ts` 가
 * 자료구조 트랙에서 세운 것과 같은 규약). 진실은 둘뿐이다 — **순서는 `문제_가이드_목록.md`**,
 * **완료는 파일 시스템**(`<name>-guide.md` 가 있으면 그 편은 끝났다). 이 도구는 그 둘을 접어
 * 보여줄 뿐이고 아무것도 쓰지 않는다.
 *
 * ## 무엇이 순서를 정하는가
 *
 * **중요도다**(유저 지시). `문제_가이드_목록.md` 의 등급 절이 웨이브이고, 절 안의 줄 순서가
 * 곧 집필 순서다 — 그 문서의 규약이 "등급 안에서도 위에 있을수록 자주 등장한다" 이기
 * 때문이다. 카테고리로만 가르면 `geometry` 7편(전부 하 등급)이 상 등급보다 먼저 나온다.
 *
 * ## 게이트 셋
 *
 * 1. **웨이브 배리어** — 앞 웨이브가 안 비면 다음 웨이브의 후보를 내지 않는다. 중요도 순이
 *    병렬화에 먹히면 유저 지시를 어기는 것이 된다.
 * 2. **카테고리 선례** — 웨이브 안에서는 카테고리로 병렬한다. 카테고리마다 **가장 앞선 미완
 *    편 하나**만 후보다. 첫 편이 그 카테고리의 선례가 되므로 후속은 그것이 선 뒤에 연다.
 *    **전역 정지가 아니다** — 다른 카테고리는 그동안 진행한다.
 * 3. **뷰 조합 선례** — `matrix` 는 카테고리가 아니라 **뷰**이고, 그것을 쓰는 편이 여러
 *    카테고리에 흩어져 있다. 그래서 축을 하나 더 둔다: 아직 한 편도 안 끝난 뷰 조합은 그
 *    조합의 **첫 편만** 후보이고, 같은 조합의 후속은 그 편이 설 때까지 막힌다.
 *
 * ```bash
 * bun run tools/algo-wbs.ts           # 웨이브별 남은 편 + 카테고리별 claim 후보
 * bun run tools/algo-wbs.ts --json    # 기계용
 * bun run tools/algo-wbs.ts --all     # 전 유닛 표
 * ```
 *
 * 종료코드: 0 정상 · 1 목록과 파일 시스템이 어긋남.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const INDEX = join(ROOT, "문제_가이드_목록.md");
const TRACK = "src/algorithms";

/** 웨이브 = 중요도 등급. 목록의 `## ★…` 절 하나가 웨이브 하나다. */
export interface Wave {
  readonly id: string;
  readonly grade: string;
  readonly heading: string;
}

export interface Unit {
  readonly wave: string;
  /** 목록에서 나온 순서. 등급 안의 순서가 곧 집필 순서다. */
  readonly order: number;
  readonly category: string;
  readonly name: string;
  /** 목록이 가리키는 경로. `.md` 면 그 편은 v2 로 섰다. */
  readonly href: string;
}

const WAVE_OF: Record<string, Wave> = {
  "★★★": { id: "W1", grade: "상", heading: "필수" },
  "★★": { id: "W2", grade: "중", heading: "빈출" },
  "★": { id: "W3", grade: "하", heading: "특정 분야·고급" },
};

/**
 * 목록에서 **알고리즘 트랙 편만** 걷는다.
 *
 * 같은 줄이 자료구조 편을 함께 가리키는 일이 흔하다(「스택·큐·덱」 은 전부
 * `src/data-structures/`). 그쪽은 `ORD-006` 의 일이라 이 도구의 분모가 아니다.
 * **한 편이 여러 줄에 나오는 것도 정상이다** — 세 편이 두 번씩 나온다. 처음 나온 자리가
 * 그 편의 순서다.
 */
export function parseIndex(text: string): Unit[] {
  const units: Unit[] = [];
  const seen = new Set<string>();
  let wave: Wave | undefined;
  let order = 0;

  for (const line of text.split("\n")) {
    const head = /^##\s+(★+)\s/.exec(line);
    if (head !== null) {
      wave = WAVE_OF[head[1] ?? ""];
      continue;
    }
    if (/^##\s/.test(line)) {
      // 등급이 아닌 절(「중요도 미분류」·「자동 추가」)은 웨이브가 없다.
      wave = undefined;
      continue;
    }
    if (wave === undefined) continue;

    for (const m of line.matchAll(/\]\(\.\/([^)]+?-guide\.(?:md|mdx))\)/g)) {
      const href = decodeURIComponent(m[1] ?? "");
      if (!href.startsWith(`${TRACK}/`)) continue;
      const parts = href.split("/");
      const category = parts[2] ?? "?";
      const name = parts[3] ?? "?";
      const key = `${category}/${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      units.push({ wave: wave.id, order: order++, category, name, href });
    }
  }
  return units;
}

/** 편이 섰는가 = `<name>-guide.md` 가 있는가. `.mdx` 는 v1 이라 미완이다. */
export function isDone(unit: Unit): boolean {
  return existsSync(
    join(ROOT, TRACK, unit.category, unit.name, `${unit.name}-guide.md`),
  );
}

/** `view="array"` 와 `view: ["array","keyValue"]` 둘 다에서 이름을 뽑는다. */
export function viewsIn(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(
    /\bview\s*[:=]\s*(?:"([^"]+)"|\{?(\[[^\]]*\])\}?)/g,
  )) {
    if (m[1] !== undefined) {
      out.push(m[1]);
      continue;
    }
    for (const q of (m[2] ?? "").matchAll(/"([^"]+)"/g)) {
      if (q[1] !== undefined) out.push(q[1]);
    }
  }
  return [...new Set(out)].sort();
}

/**
 * 그 편이 쓰는 뷰 조합. 선 편은 `.sim.ts` 에서, 안 선 편은 v1 `.mdx` 본문에서 읽는다.
 *
 * **v1 에서 읽은 조합은 후보값이지 규격이 아니다**(`survey-views.ts` 머리말이 그 한계를
 * 적어 뒀다). 여기서 쓰는 목적도 같다 — 무엇을 먼저 돌릴지 고르는 데만 쓴다.
 */
export function viewsOf(unit: Unit): string[] {
  const dir = join(ROOT, TRACK, unit.category, unit.name);
  for (const file of [`${unit.name}-guide.sim.ts`, `${unit.name}-guide.mdx`]) {
    const path = join(dir, file);
    if (existsSync(path)) {
      const views = viewsIn(readFileSync(path, "utf8"));
      if (views.length > 0) return views;
    }
  }
  return [];
}

const comboKey = (views: readonly string[]): string =>
  views.length === 0 ? "(뷰 없음)" : views.join("+");

export interface Status {
  readonly unit: Unit;
  readonly done: boolean;
  readonly views: string[];
}

export interface Blocked {
  readonly reason: "wave" | "category" | "view";
  readonly detail: string;
}

/**
 * 후보 하나와 막힌 사유를 함께 낸다.
 *
 * **막힌 것을 안 보여주면 「왜 이 편이 안 나오는가」를 물을 자리가 없다.** 그 물음이 곧
 * 다음 사람이 게이트를 우회하는 자리라, 사유를 값으로 낸다.
 */
export function plan(statuses: readonly Status[]): {
  waves: { id: string; total: number; done: number; open: number }[];
  active: string | null;
  claims: { category: string; unit: Unit; views: string[]; solo: boolean }[];
  blocked: { unit: Unit; block: Blocked }[];
} {
  const waveIds = ["W1", "W2", "W3"];
  const waves = waveIds.map((id) => {
    const list = statuses.filter((s) => s.unit.wave === id);
    const done = list.filter((s) => s.done).length;
    return { id, total: list.length, done, open: list.length - done };
  });
  const active = waves.find((w) => w.open > 0)?.id ?? null;

  // 뷰 조합이 이미 한 번 선 적이 있는가. 선 적 없는 조합은 첫 편만 연다.
  const comboDone = new Set(
    statuses.filter((s) => s.done).map((s) => comboKey(s.views)),
  );

  const claims: {
    category: string;
    unit: Unit;
    views: string[];
    solo: boolean;
  }[] = [];
  const blocked: { unit: Unit; block: Blocked }[] = [];
  const claimedCombo = new Set<string>();

  for (const s of statuses) {
    if (s.done) continue;
    if (s.unit.wave !== active) {
      blocked.push({
        unit: s.unit,
        block: { reason: "wave", detail: `${active ?? "-"} 가 안 비었다` },
      });
      continue;
    }
    if (claims.some((c) => c.category === s.unit.category)) {
      const head = claims.find((c) => c.category === s.unit.category);
      blocked.push({
        unit: s.unit,
        block: {
          reason: "category",
          detail: `${s.unit.category} 의 앞 편 ${head?.unit.name} 이 아직이다`,
        },
      });
      continue;
    }
    const combo = comboKey(s.views);
    if (!comboDone.has(combo) && claimedCombo.has(combo)) {
      blocked.push({
        unit: s.unit,
        block: {
          reason: "view",
          detail: `뷰 조합 ${combo} 의 첫 편이 아직이다`,
        },
      });
      continue;
    }
    claimedCombo.add(combo);
    claims.push({
      category: s.unit.category,
      unit: s.unit,
      views: s.views,
      solo: !comboDone.has(combo),
    });
  }
  return { waves, active, claims, blocked };
}

/** 한글은 터미널에서 두 칸을 먹는다. `String.padEnd` 는 한 칸으로 세므로 열이 어긋난다. */
function padDisplay(text: string, width: number): string {
  let cells = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    cells += code >= 0x1100 && code <= 0xffe6 ? 2 : 1;
  }
  return text + " ".repeat(Math.max(0, width - cells));
}

if (import.meta.main) {
  const units = parseIndex(readFileSync(INDEX, "utf8"));

  // 목록이 가리키는 편이 실제로 없으면 조용히 `open` 으로 새지 않도록 여기서 멈춘다.
  const missing = units.filter(
    (u) =>
      !existsSync(
        join(ROOT, TRACK, u.category, u.name, `${u.name}-guide.md`),
      ) &&
      !existsSync(join(ROOT, TRACK, u.category, u.name, `${u.name}-guide.mdx`)),
  );
  if (missing.length > 0) {
    console.error(
      `[algo-wbs] 목록이 가리키는 편이 없다 — 경로가 바뀌었으면 문제_가이드_목록.md 를 함께 고친다:\n  ${missing
        .map((u) => `${u.category}/${u.name}`)
        .join("\n  ")}`,
    );
    process.exit(1);
  }

  const statuses: Status[] = units.map((unit) => ({
    unit,
    done: isDone(unit),
    views: viewsOf(unit),
  }));
  const { waves, active, claims, blocked } = plan(statuses);

  if (process.argv.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          totalUnits: units.length,
          doneUnits: statuses.filter((s) => s.done).length,
          activeWave: active,
          waves,
          claims: claims.map((c) => ({
            category: c.category,
            name: c.unit.name,
            wave: c.unit.wave,
            views: c.views,
            solo: c.solo,
          })),
          blocked: blocked.map((b) => ({
            category: b.unit.category,
            name: b.unit.name,
            reason: b.block.reason,
            detail: b.block.detail,
          })),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const done = statuses.filter((s) => s.done).length;
  console.log(
    `algo-guide-v2 전개 WBS — ${units.length} 편 (완료 ${done} · 남은 ${units.length - done})\n`,
  );

  for (const w of waves) {
    const bar = `${"#".repeat(w.done)}${".".repeat(w.open)}`;
    const mark = w.id === active ? "◀ 지금" : w.open === 0 ? "완료" : "대기";
    console.log(
      `[${w.id}] ${padDisplay(bar, 45)} ${w.done}/${w.total}  ${mark}`,
    );
  }

  if (active === null) {
    console.log("\n전개 완료 — 남은 편이 없다.");
  } else {
    console.log(
      `\n${active} claim 후보 ${claims.length}건 (카테고리별 한 편)\n`,
    );
    for (const c of claims) {
      const solo = c.solo ? "  [단독] 이 뷰 조합의 첫 편이다" : "";
      console.log(
        `  ${padDisplay(c.category, 16)} ${padDisplay(c.unit.name, 30)} ${comboKey(c.views)}${solo}`,
      );
    }
    const byReason = new Map<string, number>();
    for (const b of blocked) {
      byReason.set(b.block.reason, (byReason.get(b.block.reason) ?? 0) + 1);
    }
    console.log(
      `\n막힌 편 ${blocked.length} — ${[...byReason].map(([r, n]) => `${r} ${n}`).join(" · ")}`,
    );
  }

  if (process.argv.includes("--all")) {
    console.log("\n전 유닛");
    for (const w of waves) {
      console.log(`\n[${w.id}] ${w.done}/${w.total}`);
      for (const s of statuses.filter((x) => x.unit.wave === w.id)) {
        const mark = s.done ? "x" : " ";
        console.log(
          `  [${mark}] ${padDisplay(s.unit.category, 16)} ${padDisplay(s.unit.name, 30)} ${comboKey(s.views)}`,
        );
      }
    }
  }

  console.log(
    "\n순서 정본: 문제_가이드_목록.md  |  전략·웨이브: KANBAN.cards/KAN-034-KSD7XR.md  |  골격: sandbox/algo-guide-v2/SPEC.md",
  );
}
