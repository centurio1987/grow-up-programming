/**
 * 책 빌더 — 차례를 읽고, 권으로 가르고, 조각을 만들고, 쪽수를 재고, 권마다 한 번 인쇄한다.
 *
 * ```bash
 * bun run tools/book/build-book.ts                   # 모든 권, 바뀐 편만 다시 조판
 * bun run tools/book/build-book.ts --volume beginner # 한 권만
 * bun run tools/book/build-book.ts --refresh         # 전부 다시 조판
 * bun run tools/book/build-book.ts --only algorithms--quicksort
 * bun run tools/book/build-book.ts --limit 3         # 연기 시험(권마다 앞 3편만)
 * bun run tools/book/build-book.ts --html-only       # 인쇄 없이 합본 HTML 까지만
 * ```
 *
 * **권마다 한 번만 인쇄하는 이유.** 쪽수를 재려고 편마다 낱장 인쇄를 하지만, 그건 목차 숫자를
 * 얻으려는 것이고 산출물이 아니다. 낱장 PDF 를 이어 붙이면(`pdfunite`) 폰트가 편마다
 * 한 벌씩 실려 150MB 를 넘는다. 합본을 한 번 인쇄하면 폰트가 한 벌만 실린다.
 *
 * 종료코드: 0 정상 · 1 조판 규약 위반이 남음 · 2 대상·설정 문제
 */

import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { katexCss, PAGE_CSS } from "../build-html.ts";
import type { Chapter } from "./chapters.ts";
import { plan } from "./chapters.ts";
import { Printer, pdfPageCount } from "./chrome.ts";
import type { BookConfig } from "./config.ts";
import { loadConfig, REPO } from "./config.ts";
import { FragmentStore, sha } from "./fragment.ts";
import type { BookStats } from "./matter.ts";
import { colophon, cover, esc, toc } from "./matter.ts";
import { printCss } from "./print-css.ts";
import type { CrossRef, Split, VolumePlan } from "./volume.ts";
import { place, split } from "./volume.ts";

/** 인쇄용 한 장. `<details>` 는 종이에서 펼쳐 둔다 — 접힌 채 찍히면 내용이 사라진다. */
export function shell(title: string, css: string, body: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<style>${css}</style>
</head>
<body>
<main>
${body}
</main>
<script>for (const d of document.querySelectorAll("details")) d.open = true;</script>
</body>
</html>
`;
}

/** 조판 CSS 한 벌 — KaTeX · 화면 CSS · 인쇄 덮어쓰기. */
export async function bookCss(cfg: BookConfig): Promise<string> {
  return `${await katexCss()}\n${PAGE_CSS}\n${printCss(cfg)}`;
}

/** 권의 PDF 머리말. 권이 셋이면 어느 권을 펼쳤는지 쪽마다 보여야 한다. */
export function runningHead(cfg: BookConfig, v: VolumePlan): string {
  return `${cfg.title} · ${v.vol.label}`;
}

interface Ctx {
  cfg: BookConfig;
  s: Split;
  store: FragmentStore;
  css: string;
  out: string;
  pdfOut?: string;
}

/** 권에 앉힌 본문. 목차·쪽수·합본이 모두 이것을 쓴다 — 잰 것과 찍는 것이 같아야 한다. */
async function seat(ctx: Ctx, v: VolumePlan, chapters: Chapter[]) {
  const bodies = new Map<string, string>();
  const crossRefs: CrossRef[] = [];
  for (const ch of chapters) {
    const frag = await Bun.file(ctx.store.fragmentPath(ch.id)).text();
    const r = place(frag, ch, ctx.s, v.vol);
    bodies.set(ch.id, r.html);
    crossRefs.push(...r.crossRefs);
  }
  return { bodies, crossRefs };
}

async function main(): Promise<never> {
  const args = Bun.argv.slice(2);
  const flag = (n: string) => args.includes(n);
  const value = (n: string) => {
    const i = args.indexOf(n);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const cfg = await loadConfig();
  const out = resolve(REPO, cfg.outDir);
  await mkdir(`${out}/chapters`, { recursive: true });

  const p = await plan(cfg);
  if (p.chapters.length === 0) {
    console.error(
      `실을 챕터가 없다. ${cfg.index} 를 읽었고 ${p.skipped.length}편이 걸러졌다 — book.config.json 의 tracks[].enabled 를 본다.`,
    );
    return process.exit(2);
  }
  for (const d of p.duplicates) console.warn(`인덱스 중복: ${d}`);

  const s = split(cfg, p);
  const broken: string[] = [];
  // 실릴 수 있는 편이 어느 권에도 안 들어가면 조용히 사라진다 — 111편을 기대한 사람이
  // 세 권을 다 받고도 모른다. 실패로 친다.
  for (const c of s.unassigned) {
    broken.push(
      `${c.id}: 어느 권에도 배정되지 않았다 — 인덱스의 ★${c.stars} 부를 book.config.json volumes[].stars 에 넣는다`,
    );
  }

  const want = value("--volume");
  const vols =
    want === undefined ? s.volumes : s.volumes.filter((v) => v.vol.id === want);
  if (vols.length === 0) {
    console.error(
      `권 ${want} 이 없다 — ${s.volumes.map((v) => v.vol.id).join(" · ")}`,
    );
    return process.exit(2);
  }
  const pdfOut = value("--out");
  if (pdfOut !== undefined && vols.length > 1) {
    console.error(
      "--out 은 --volume 과 함께 쓴다 — 권이 여럿이면 파일도 여럿이다",
    );
    return process.exit(2);
  }

  const limit = Number(value("--limit") ?? "0");
  const takenOf = (v: VolumePlan) =>
    limit > 0 ? v.chapters.slice(0, limit) : v.chapters;
  const only = value("--only");
  // 폴더 하나가 한 편이다 — 가이드·문제 문서·구현이 같은 폴더에 산다.
  const byDir = new Map(
    [...p.chapters, ...p.skipped].map((c) => [dirname(c.src), c] as const),
  );

  /* ── ① 조각 ───────────────────────────────────────────── */
  const store = await FragmentStore.open(cfg.outDir);
  const all = vols.flatMap(takenOf);
  let rebuilt = 0;
  for (const ch of all) {
    const force = flag("--refresh") || only === ch.id;
    const r = await store.ensure(ch, {
      byDir,
      ...(force ? { force: true } : {}),
    });
    if (r.rebuilt) {
      rebuilt++;
      store.setPages(ch.id, 0); // 원문이 바뀌었으니 쪽수를 다시 잰다
    }
    if (r.entry.problems.length > 0) {
      broken.push(`${ch.id}: ${r.entry.problems.join("; ")}`);
    }
  }
  console.log(
    `조각 ${all.length}편 — 새로 만든 편 ${rebuilt}, 캐시 ${all.length - rebuilt}`,
  );

  const ctx: Ctx = {
    cfg,
    s,
    store,
    css: await bookCss(cfg),
    out,
    ...(pdfOut === undefined ? {} : { pdfOut }),
  };

  if (flag("--html-only")) {
    for (const v of vols) {
      const chapters = takenOf(v);
      const { bodies, crossRefs } = await seat(ctx, v, chapters);
      const stats = statsOf(cfg, v, chapters, 0);
      const html = shell(
        runningHead(cfg, v),
        ctx.css,
        [
          cover(cfg, v, stats),
          toc(v.parts, new Set(bodies.keys()), titleOf(store), new Map()),
          ...chapters.map((c) => bodies.get(c.id) ?? ""),
          colophon(
            cfg,
            s,
            v,
            chapters,
            (c) => store.get(c.id),
            stats,
            crossRefs,
          ),
        ].join("\n"),
      );
      await mkdir(`${out}/${v.vol.id}`, { recursive: true });
      await Bun.write(`${out}/${v.vol.id}/book.html`, html);
      console.log(
        `${out}/${v.vol.id}/book.html — ${Math.round(html.length / 1024)}KB (인쇄 안 함)`,
      );
    }
    await store.flush();
    return finish(broken);
  }

  const printer = await Printer.launch(cfg);
  try {
    for (const v of vols) {
      broken.push(...(await printVolume(ctx, printer, v, takenOf(v))));
      // 권 하나가 끝날 때마다 캐시를 적는다 — 세 번째 권에서 멈춰도 앞 두 권의 계측이 남는다.
      await store.flush();
    }
  } finally {
    await printer.close();
  }
  return finish(broken);
}

function finish(broken: string[]): never {
  if (broken.length > 0) {
    console.error("\n조판 규약 위반:");
    for (const b of broken) console.error(`  ${b}`);
  }
  return process.exit(broken.length === 0 ? 0 : 1);
}

const titleOf = (store: FragmentStore) => (ch: Chapter) =>
  store.get(ch.id)?.title ?? ch.name;

async function printVolume(
  ctx: Ctx,
  printer: Printer,
  v: VolumePlan,
  chapters: Chapter[],
): Promise<string[]> {
  const { cfg, s, store, css, out } = ctx;
  const broken: string[] = [];
  const dir = `${out}/${v.vol.id}`;
  await mkdir(dir, { recursive: true });

  const { bodies, crossRefs } = await seat(ctx, v, chapters);
  const include = new Set(chapters.map((c) => c.id));
  const bodyOf = (ch: Chapter) => bodies.get(ch.id) ?? "";

  /* ── ② 쪽수 ───────────────────────────────────────────── */
  const measure = `${out}/.measure.html`;
  let measured = 0;
  for (const ch of chapters) {
    if (store.pagesFor(ch.id, bodyOf(ch)) !== undefined) continue;
    await Bun.write(measure, shell(cfg.title, css, bodyOf(ch)));
    store.setPages(
      ch.id,
      pdfPageCount(await printer.print(measure, { footer: false })),
      sha(bodyOf(ch)),
    );
    measured++;
  }
  const pagesOf = (ch: Chapter) => store.get(ch.id)?.pages ?? 0;
  console.log(
    `[${v.vol.label}] 쪽수 — 새로 잰 편 ${measured}, 캐시 ${chapters.length - measured}`,
  );

  /* ── ③ 목차 쪽번호 (앞붙이 쪽수에 맞춰 수렴시킨다) ────── */
  let front = 2;
  let pageOf = new Map<string, number>();
  let frontHtml = "";
  for (let round = 0; round < 3; round++) {
    pageOf = new Map();
    let at = front + 1;
    for (const ch of chapters) {
      pageOf.set(ch.id, at);
      at += pagesOf(ch) || 1;
    }
    frontHtml = `${cover(cfg, v, statsOf(cfg, v, chapters, at - 1))}\n${toc(v.parts, include, titleOf(store), pageOf)}`;
    await Bun.write(measure, shell(cfg.title, css, frontHtml));
    const got = pdfPageCount(await printer.print(measure, { footer: false }));
    if (got === front) break;
    front = got;
  }

  /* ── ④ 마무리 쪽수 · 합본 인쇄 ────────────────────────── */
  // 마무리는 본문 뒤에 오므로 챕터 쪽번호를 흔들지 않는다. 표지의 「분량」만 이걸 기다린다.
  const body = front + chapters.reduce((n, c) => n + pagesOf(c), 0);
  const backOf = (total: number) =>
    colophon(
      cfg,
      s,
      v,
      chapters,
      (c) => store.get(c.id),
      statsOf(cfg, v, chapters, total),
      crossRefs,
    );
  await Bun.write(measure, shell(cfg.title, css, backOf(0)));
  const back = pdfPageCount(await printer.print(measure, { footer: false }));

  const total = body + back;
  const stats = statsOf(cfg, v, chapters, total);
  const head = runningHead(cfg, v);
  const bookHtml = shell(
    head,
    css,
    [
      `${cover(cfg, v, stats)}\n${toc(v.parts, include, titleOf(store), pageOf)}`,
      ...chapters.map(bodyOf),
      backOf(total),
    ].join("\n"),
  );
  const htmlPath = `${dir}/book.html`;
  await Bun.write(htmlPath, bookHtml);

  const pdf = await printer.print(
    htmlPath,
    { header: esc(head) },
    Math.min(30_000, 800 + chapters.length * 60),
  );
  const pdfPath = ctx.pdfOut ?? `${dir}/book.pdf`;
  await Bun.write(pdfPath, pdf);
  const actual = pdfPageCount(pdf);

  await Bun.write(
    `${dir}/book.lock.json`,
    `${JSON.stringify(
      {
        builtAt: stats.builtAt.toISOString(),
        config: {
          title: cfg.title,
          edition: cfg.edition,
          index: cfg.index,
          groupBy: cfg.groupBy,
        },
        volume: {
          id: v.vol.id,
          label: v.vol.label,
          ordinal: v.ordinal,
          of: s.volumes.length,
          stars: v.vol.stars,
        },
        tracks: cfg.tracks.map((t) => ({ id: t.id, enabled: t.enabled })),
        pages: { front, back, predicted: total, actual },
        chapters: chapters.map((c) => ({
          n: c.number,
          id: c.id,
          src: c.src,
          srcHash: store.get(c.id)?.srcHash,
          pages: store.get(c.id)?.pages,
          startPage: pageOf.get(c.id),
        })),
      },
      null,
      2,
    )}\n`,
  );

  console.log(
    `[${v.vol.label}] ${pdfPath} — ${actual}쪽 · ${(pdf.length / 1024 / 1024).toFixed(1)}MB · ` +
      `앞붙이 ${front}쪽 · 본문 ${chapters.length}편 · 마무리 ${back}쪽 · 다른 권 참조 ${crossRefs.length}건`,
  );
  // 목차 쪽번호는 낱장 쪽수를 누적해 낸 값이다. 합본 실측과 어긋나면 그 전제가 깨진 것이고,
  // 그때 목차는 **틀린 숫자를 자신 있게 싣는다** — 조용히 지나가면 안 되는 자리다.
  if (actual !== total) {
    console.error(
      `[${v.vol.label}] 쪽수 예측이 어긋났다 — 예측 ${total}쪽, 실측 ${actual}쪽. 목차의 쪽번호를 믿을 수 없다.`,
    );
    broken.push(`${v.vol.id}: 쪽수 예측 ${total} ≠ 실측 ${actual}`);
  }
  if (v.skipped.length > 0) {
    console.log(
      `[${v.vol.label}] 미수록 ${v.skipped.length}편 — 사유는 마무리 절에 실렸다`,
    );
  }
  return broken;
}

export function statsOf(
  cfg: BookConfig,
  v: VolumePlan,
  taken: Chapter[],
  totalPages: number,
): BookStats {
  return {
    perTrack: cfg.tracks.map((t) => ({
      label: t.label,
      taken: taken.filter((c) => c.trackId === t.id).length,
      skipped: v.skipped.filter((c) => c.trackId === t.id).length,
      note: t.enabled ? "" : (t.note ?? "미편입"),
    })),
    totalPages,
    builtAt: new Date(),
  };
}

if (import.meta.main) await main();
