/**
 * 기존 알고리즘 가이드 111편이 어떤 뷰를 쓰는지 센다 — B0c(S5).
 *
 * **이 결과는 후보 목록이지 정본이 아니다.** 입력이 **구 명세로 쓰인 111편**이고,
 * `keyValue` 는 `src/_guide-sim/index.tsx` 가 *"범용 상태 패널(변수 스냅샷)"* 로 정의한
 * **폴백 뷰**다. 그러니 "keyValue 단독" 은 *그림이 불가능하다* 의 증거가 아니라
 * *앞 집필자가 뷰를 안 만들었다* 의 증거다. 그걸 새 규격의 면제 근거로 쓰면 구 산출물의
 * 결손을 새 규격에 상속시키는 것이고, 이 카드가 세운 독립 원칙과 정면으로 걸린다.
 *
 * **L10 예외의 정본은 S8(B3)이 실제로 써 보고 낸다.** 여기서는 어디를 먼저 시험할지
 * 고르는 데만 쓴다.
 *
 * ```bash
 * bun run tools/survey-views.ts            # 사람이 읽는 표
 * bun run tools/survey-views.ts --json     # 기계 판독
 * ```
 */

import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..");
const TRACK = join(ROOT, "src/algorithms");

export interface Entry {
  category: string;
  name: string;
  views: string[];
}

async function guides(dir: string, category = ""): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const found: string[] = [];
  for (const entry of entries) {
    const child = join(dir, entry.name);
    if (entry.isDirectory()) {
      // `_scratch`·`_deprecated` 는 살아 있는 산출물이 아니다.
      if (entry.name.startsWith("_")) continue;
      found.push(...(await guides(child, category || entry.name)));
    } else if (entry.name.endsWith("-guide.mdx")) {
      found.push(child);
    }
  }
  return found;
}

/** `view="array"` 와 `view={["array","keyValue"]}` 둘 다에서 이름을 뽑는다. */
export function viewsOf(source: string): string[] {
  const out: string[] = [];
  for (const m of source.matchAll(/\bview=(?:"([^"]+)"|\{(\[[^\]]*\])\})/g)) {
    if (m[1] !== undefined) {
      out.push(m[1]);
      continue;
    }
    for (const q of (m[2] ?? "").matchAll(/"([^"]+)"/g)) {
      if (q[1] !== undefined) out.push(q[1]);
    }
  }
  return [...new Set(out)];
}

if (import.meta.main) {
  const files = await guides(TRACK);
  const rows: Entry[] = [];
  for (const file of files) {
    const rel = file.slice(TRACK.length + 1);
    const [category = "?", name = "?"] = rel.split("/");
    rows.push({ category, name, views: viewsOf(await Bun.file(file).text()) });
  }
  rows.sort((a, b) =>
    a.category === b.category
      ? a.name.localeCompare(b.name)
      : a.category.localeCompare(b.category),
  );

  const soloKeyValue = rows.filter(
    (r) => r.views.length === 1 && r.views[0] === "keyValue",
  );
  const byCategory = new Map<string, number>();
  for (const r of soloKeyValue) {
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
  }
  const total = new Map<string, number>();
  for (const r of rows) total.set(r.category, (total.get(r.category) ?? 0) + 1);

  const combos = new Map<string, number>();
  for (const r of rows) {
    const key = r.views.length === 0 ? "(뷰 없음)" : r.views.join("+");
    combos.set(key, (combos.get(key) ?? 0) + 1);
  }

  if (Bun.argv.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          total: rows.length,
          combos: Object.fromEntries(combos),
          soloKeyValue: soloKeyValue.map((r) => `${r.category}/${r.name}`),
          soloKeyValueByCategory: Object.fromEntries(byCategory),
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`가이드 ${rows.length}편\n`);
    console.log("뷰 조합별:");
    for (const [key, n] of [...combos].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(n).padStart(3)}  ${key}`);
    }
    console.log(`\n\`keyValue\` 단독 ${soloKeyValue.length}편 — 카테고리별:`);
    for (const [cat, n] of [...byCategory].sort((a, b) => b[1] - a[1])) {
      console.log(
        `  ${String(n).padStart(3)} / ${String(total.get(cat)).padStart(2)}  ${cat}`,
      );
    }
    console.log(
      "\n  (후보 목록이다. L10 예외의 정본은 S8 이 실제로 써 보고 낸다)",
    );
  }
}
