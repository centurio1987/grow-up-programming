/**
 * 책 빌더 — 차례를 읽고, 조각을 만들고, 쪽수를 재고, 한 번 인쇄한다.
 *
 * ```bash
 * bun run tools/book/build-book.ts                 # 바뀐 편만 다시 조판
 * bun run tools/book/build-book.ts --refresh       # 전부 다시 조판
 * bun run tools/book/build-book.ts --only algorithms--quicksort
 * bun run tools/book/build-book.ts --limit 3       # 연기 시험(앞 3편만)
 * bun run tools/book/build-book.ts --html-only     # 인쇄 없이 합본 HTML 까지만
 * ```
 *
 * **한 번만 인쇄하는 이유.** 쪽수를 재려고 편마다 낱장 인쇄를 하지만, 그건 목차 숫자를
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
import { FragmentStore } from "./fragment.ts";
import type { BookStats } from "./matter.ts";
import { colophon, cover, esc, toc } from "./matter.ts";
import { printCss } from "./print-css.ts";

/** 인쇄용 한 장. `<details>` 는 종이에서 펼쳐 둔다 — 접힌 채 찍히면 내용이 사라진다. */
function shell(cfg: BookConfig, css: string, body: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>${esc(cfg.title)}</title>
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

  const limit = Number(value("--limit") ?? "0");
  const chapters = limit > 0 ? p.chapters.slice(0, limit) : p.chapters;
  const only = value("--only");
  // 폴더 하나가 한 편이다 — 가이드·문제 문서·구현이 같은 폴더에 산다.
  const byDir = new Map(
    [...p.chapters, ...p.skipped].map((c) => [dirname(c.src), c] as const),
  );

  /* ── ① 조각 ───────────────────────────────────────────── */
  const store = await FragmentStore.open(cfg.outDir);
  let rebuilt = 0;
  const broken: string[] = [];
  for (const ch of chapters) {
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
    `조각 ${chapters.length}편 — 새로 만든 편 ${rebuilt}, 캐시 ${chapters.length - rebuilt}`,
  );

  const bodyOf = async (ch: Chapter) =>
    Bun.file(store.fragmentPath(ch.id)).text();
  /** 목차·마무리가 실제로 실린 편만 싣게 한다 — `--limit` 이 붙어도 111줄을 적지 않는다. */
  const include = new Set(chapters.map((c) => c.id));
  const titleOf = (ch: Chapter) => store.get(ch.id)?.title ?? ch.name;
  const css = `${await katexCss()}\n${PAGE_CSS}\n${printCss(cfg)}`;

  if (flag("--html-only")) {
    const html = shell(
      cfg,
      css,
      [
        cover(cfg, statsOf(cfg, p, chapters, 0)),
        toc(p.parts, include, titleOf, new Map()),
        ...(await Promise.all(chapters.map(bodyOf))),
        colophon(
          cfg,
          p,
          chapters,
          (c) => store.get(c.id),
          statsOf(cfg, p, chapters, 0),
        ),
      ].join("\n"),
    );
    await Bun.write(`${out}/book.html`, html);
    await store.flush();
    console.log(
      `${out}/book.html — ${Math.round(html.length / 1024)}KB (인쇄 안 함)`,
    );
    return process.exit(broken.length === 0 ? 0 : 1);
  }

  /* ── ② 쪽수 ───────────────────────────────────────────── */
  const printer = await Printer.launch(cfg);
  try {
    const measure = `${out}/.measure.html`;
    let measured = 0;
    for (const ch of chapters) {
      const e = store.get(ch.id);
      if (e?.pages !== undefined && e.pages > 0) continue;
      await Bun.write(measure, shell(cfg, css, await bodyOf(ch)));
      store.setPages(
        ch.id,
        pdfPageCount(await printer.print(measure, { footer: false })),
      );
      measured++;
    }
    console.log(
      `쪽수 — 새로 잰 편 ${measured}, 캐시 ${chapters.length - measured}`,
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
        at += store.get(ch.id)?.pages ?? 1;
      }
      frontHtml = `${cover(cfg, statsOf(cfg, p, chapters, at - 1))}\n${toc(p.parts, include, titleOf, pageOf)}`;
      await Bun.write(measure, shell(cfg, css, frontHtml));
      const got = pdfPageCount(await printer.print(measure, { footer: false }));
      if (got === front) break;
      front = got;
    }

    /* ── ④ 마무리 쪽수 · 합본 인쇄 ────────────────────────── */
    // 마무리는 본문 뒤에 오므로 챕터 쪽번호를 흔들지 않는다. 표지의 「분량」만 이걸 기다린다.
    const body =
      front + chapters.reduce((n, c) => n + (store.get(c.id)?.pages ?? 0), 0);
    const backOf = (total: number) =>
      colophon(
        cfg,
        p,
        chapters,
        (c) => store.get(c.id),
        statsOf(cfg, p, chapters, total),
      );
    await Bun.write(measure, shell(cfg, css, backOf(0)));
    const back = pdfPageCount(await printer.print(measure, { footer: false }));

    const total = body + back;
    const stats = statsOf(cfg, p, chapters, total);
    const bookHtml = shell(
      cfg,
      css,
      [
        `${cover(cfg, stats)}\n${toc(p.parts, include, titleOf, pageOf)}`,
        ...(await Promise.all(chapters.map(bodyOf))),
        backOf(total),
      ].join("\n"),
    );
    const htmlPath = `${out}/book.html`;
    await Bun.write(htmlPath, bookHtml);

    const pdf = await printer.print(
      htmlPath,
      { header: esc(cfg.title) },
      Math.min(30_000, 800 + chapters.length * 60),
    );
    const pdfPath = value("--out") ?? `${out}/book.pdf`;
    await Bun.write(pdfPath, pdf);

    await Bun.write(
      `${out}/book.lock.json`,
      `${JSON.stringify(
        {
          builtAt: stats.builtAt.toISOString(),
          config: {
            title: cfg.title,
            edition: cfg.edition,
            index: cfg.index,
            groupBy: cfg.groupBy,
          },
          tracks: cfg.tracks.map((t) => ({ id: t.id, enabled: t.enabled })),
          pages: { front, back, predicted: total, actual: pdfPageCount(pdf) },
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
    await store.flush();

    const actual = pdfPageCount(pdf);
    console.log(
      `${pdfPath} — ${actual}쪽 · ${(pdf.length / 1024 / 1024).toFixed(1)}MB · ` +
        `앞붙이 ${front}쪽 · 본문 ${chapters.length}편 · 마무리 ${back}쪽`,
    );
    // 목차 쪽번호는 낱장 쪽수를 누적해 낸 값이다. 합본 실측과 어긋나면 그 전제가 깨진 것이고,
    // 그때 목차는 **틀린 숫자를 자신 있게 싣는다** — 조용히 지나가면 안 되는 자리다.
    if (actual !== total) {
      console.error(
        `쪽수 예측이 어긋났다 — 예측 ${total}쪽, 실측 ${actual}쪽. 목차의 쪽번호를 믿을 수 없다.`,
      );
      broken.push(`쪽수 예측 ${total} ≠ 실측 ${actual}`);
    }
    if (p.skipped.length > 0) {
      console.log(`미수록 ${p.skipped.length}편 — 사유는 마무리 절에 실렸다`);
    }
  } finally {
    await printer.close();
  }

  if (broken.length > 0) {
    console.error("\n조판 규약 위반(마커 · 표 칸):");
    for (const b of broken) console.error(`  ${b}`);
  }
  return process.exit(broken.length === 0 ? 0 : 1);
}

function statsOf(
  cfg: BookConfig,
  p: Awaited<ReturnType<typeof plan>>,
  taken: Chapter[],
  totalPages: number,
): BookStats {
  return {
    perTrack: cfg.tracks.map((t) => ({
      label: t.label,
      taken: taken.filter((c) => c.trackId === t.id).length,
      skipped: p.skipped.filter((c) => c.trackId === t.id).length,
      note: t.enabled ? "" : (t.note ?? "미편입"),
    })),
    totalPages,
    builtAt: new Date(),
  };
}

if (import.meta.main) await main();
