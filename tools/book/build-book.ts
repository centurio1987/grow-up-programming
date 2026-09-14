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
 * **재기와 찍기를 가른 이유.** 뒤표지의 시리즈 표가 세 권의 쪽수를 모두 싣는다. 권마다 재고
 * 곧바로 찍으면 첫 권의 뒤표지가 뒤의 두 권 쪽수를 모른다. 그래서 모든 권을 먼저 재고(`layout`)
 * 그 다음에 찍는다(`printVolume`). 이번에 안 찍는 권은 그 권의 `book.lock.json` 에서 읽는다 —
 * 손에 든 그 권 PDF 의 실제 쪽수다.
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
import { codeLanguages, FragmentStore, sha } from "./fragment.ts";
import type { BookStats, TocFrame, VolumeSize } from "./matter.ts";
import { backCover, colophon, cover, esc, toc } from "./matter.ts";
import { OUTLINE_CSS, outlineChapters, relevel } from "./outline.ts";
import { fontCss, printCss } from "./print-css.ts";
import type { CrossRef, Split, VolumePlan } from "./volume.ts";
import { fill, place, split } from "./volume.ts";

/**
 * 인쇄 직전에 도는 조판 보정. 끝나면 `window.bkReady` 가 풀리고 인쇄기가 그걸 기다린다
 * (`chrome.ts`).
 *
 * 1. `<details>` 를 펼친다 — 접힌 채 찍히면 내용이 사라진다.
 * 2. **도식이 넘치면 글자를 줄여 한 줄에 맞춘다.** 도식은 줄 맞춤이 내용이라 접으면 그림이
 *    깨지고, 자르면 오른쪽이 사라진다. 한글이 섞이면 고정폭이 아니게 되어 글자 수로는 폭을 못
 *    짚으므로, 서체가 다 온 뒤 실제 폭을 재서 비율대로 줄인다. 6.5pt 아래로 가야 하면 줄이지 않고
 *    접는다 — 읽을 수 없는 그림보다 접힌 그림이 낫다.
 *
 * 잴 때(낱장)와 찍을 때(합본)의 본문 폭이 같으므로 보정 결과도 같다. 달라지면 쪽수 예측이
 * 어긋나 빌더가 실패한다.
 */
const FIT_JS = `window.bkReady = (async () => {
  for (const d of document.querySelectorAll("details")) d.open = true;
  await document.fonts.ready;
  const blocks = [...document.querySelectorAll('pre.gs-ascii, pre.shiki[data-language="text"]')];
  const plan = blocks.map((pre) => {
    const cs = getComputedStyle(pre);
    const avail = pre.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const r = document.createRange();
    r.selectNodeContents(pre);
    return { pre, avail, used: r.getBoundingClientRect().width, size: parseFloat(cs.fontSize) * 0.75 };
  });
  for (const { pre, avail, used, size } of plan) {
    if (used <= avail + 0.5) continue;
    const fit = Math.floor(size * (avail / used) * 10) / 10;
    if (fit >= 6.5) pre.style.fontSize = fit + "pt";
    else pre.classList.add("bk-fit-wrap");
  }
  await document.fonts.ready;
})();`;

/** 인쇄용 한 장. */
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
<script>${FIT_JS}</script>
</body>
</html>
`;
}

let base: Promise<string> | undefined;

/**
 * 조판 CSS 한 벌 — 서체 · KaTeX · 화면 CSS · 인쇄 덮어쓰기. 권마다 머리말 문구가 달라
 * 권마다 부른다. 서체와 KaTeX 는 한 번만 읽는다.
 */
export async function bookCss(cfg: BookConfig, head: string): Promise<string> {
  base ??= Promise.all([fontCss(), katexCss()]).then(
    ([fonts, katex]) => `${fonts}\n${katex}\n${PAGE_CSS}`,
  );
  return `${await base}\n${printCss(cfg, head)}\n${OUTLINE_CSS}`;
}

/** 권의 머리말. 권이 셋이면 어느 권을 펼쳤는지 쪽마다 보여야 한다. */
export function runningHead(cfg: BookConfig, v: VolumePlan): string {
  return `${cfg.title} · ${v.vol.label}`;
}

interface Ctx {
  cfg: BookConfig;
  s: Split;
  store: FragmentStore;
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
    out,
    ...(pdfOut === undefined ? {} : { pdfOut }),
  };

  if (flag("--html-only")) {
    const sizes = await sizesOf(ctx, []);
    for (const v of vols) {
      const chapters = takenOf(v);
      const { bodies, crossRefs } = await seat(ctx, v, chapters);
      const stats = statsOf(cfg, v, chapters, 0);
      const html = shell(
        runningHead(cfg, v),
        await bookCss(cfg, runningHead(cfg, v)),
        [
          cover(cfg, v, stats),
          toc(
            v.parts,
            new Set(bodies.keys()),
            titleOf(store),
            new Map(),
            frameOf(v, chapters),
          ),
          ...chapters.map((c) => fill(bodies.get(c.id) ?? "")),
          colophon(
            cfg,
            s,
            v,
            chapters,
            (c) => store.get(c.id),
            stats,
            crossRefs,
          ),
          backCover(cfg, s, v, sizes, factsOf(chapters, bodies, store)),
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

  const printer = await Printer.launch();
  try {
    const layouts: Layout[] = [];
    for (const v of vols) {
      layouts.push(await layout(ctx, printer, v, takenOf(v)));
      // 권 하나를 잴 때마다 캐시를 적는다 — 세 번째 권에서 멈춰도 앞 두 권의 계측이 남는다.
      await store.flush();
    }
    const sizes = await sizesOf(ctx, layouts);
    for (const l of layouts) {
      broken.push(...(await printVolume(ctx, printer, l, sizes)));
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

/** 목차 머리. 트랙이 하나면 그 이름(ALGORITHMS)을, 섞이면 CHAPTERS 를 단위로 쓴다. */
export function frameOf(
  v: VolumePlan,
  chapters: Chapter[],
  totalPages?: number,
  backPage?: number,
): TocFrame {
  const tracks = new Set(chapters.map((c) => c.trackId));
  const [only] = [...tracks];
  return {
    blurb: v.vol.blurb,
    unit:
      tracks.size === 1 && only !== undefined ? only.toUpperCase() : "CHAPTERS",
    ...(totalPages === undefined ? {} : { totalPages }),
    ...(backPage === undefined ? {} : { backPage }),
  };
}

/** 뒤표지의 CODE · STRUCTURE 칸 — 원고에서 센 값. */
export function factsOf(
  chapters: Chapter[],
  bodies: Map<string, string>,
  store: FragmentStore,
): { code: string; structure: string } {
  const langs = new Map<string, number>();
  const partCounts = new Map<number, number>();
  let pages = 0;
  for (const ch of chapters) {
    const body = bodies.get(ch.id) ?? "";
    for (const l of codeLanguages(body)) langs.set(l, (langs.get(l) ?? 0) + 1);
    const n = [...body.matchAll(/<h2\b/g)].length;
    partCounts.set(n, (partCounts.get(n) ?? 0) + 1);
    pages += store.get(ch.id)?.pages ?? 0;
  }
  // 장의 절반 넘게 쓰는 언어만 적는다 — 한두 편의 비교 조각(Python 등)은 이 책의 언어가 아니다.
  const code = [...langs.entries()]
    .filter(([, n]) => n * 2 > chapters.length)
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l)
    .join(" · ");
  const [parts] = [...partCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [
    0,
  ];
  const avg = chapters.length === 0 ? 0 : Math.round(pages / chapters.length);
  const structure = [
    parts > 0 ? `장마다 파트 ${parts}개` : "",
    avg > 0 ? `평균 ${avg}쪽` : "",
  ]
    .filter((x) => x !== "")
    .join(" · ");
  return { code, structure };
}

/** 뒤표지 시리즈 표의 권별 분량 — 이번에 잰 권은 잰 값, 아닌 권은 그 권 lock 의 실측. */
async function sizesOf(
  ctx: Ctx,
  layouts: Layout[],
): Promise<Map<string, VolumeSize>> {
  const sizes = new Map<string, VolumeSize>();
  for (const v of ctx.s.volumes) {
    const l = layouts.find((x) => x.v.vol.id === v.vol.id);
    if (l !== undefined) {
      sizes.set(v.vol.id, { chapters: l.chapters.length, pages: l.total });
      continue;
    }
    const lock = Bun.file(`${ctx.out}/${v.vol.id}/book.lock.json`);
    if (await lock.exists()) {
      const j = (await lock.json()) as {
        pages: { actual: number };
        chapters: unknown[];
      };
      sizes.set(v.vol.id, {
        chapters: j.chapters.length,
        pages: j.pages.actual,
      });
    } else {
      sizes.set(v.vol.id, { chapters: v.chapters.length });
    }
  }
  return sizes;
}

interface Layout {
  v: VolumePlan;
  chapters: Chapter[];
  css: string;
  bodies: Map<string, string>;
  crossRefs: CrossRef[];
  pageOf: Map<string, number>;
  front: number;
  back: number;
  total: number;
}

/** 뒤표지는 한 쪽으로 고정된 틀이다(`print-css.ts` 의 `.bk-backcover`). */
const BACK_COVER_PAGES = 1;

/** 한 권을 잰다 — 장 쪽수 · 앞붙이 쪽수(목차 수렴) · 마무리 쪽수. 인쇄는 하지 않는다. */
async function layout(
  ctx: Ctx,
  printer: Printer,
  v: VolumePlan,
  chapters: Chapter[],
): Promise<Layout> {
  const { cfg, s, store, out } = ctx;
  const css = await bookCss(cfg, runningHead(cfg, v));
  const { bodies, crossRefs } = await seat(ctx, v, chapters);
  const include = new Set(chapters.map((c) => c.id));
  const bodyOf = (ch: Chapter) => bodies.get(ch.id) ?? "";

  /* ── ② 쪽수 ───────────────────────────────────────────── */
  // 잰 값은 조판 CSS 까지 같을 때만 믿는다 — 디자인을 고치면 모든 편의 쪽수가 바뀐다.
  const measure = `${out}/.measure.html`;
  let measured = 0;
  for (const ch of chapters) {
    if (store.pagesFor(ch.id, css + bodyOf(ch)) !== undefined) continue;
    await Bun.write(measure, shell(cfg.title, css, fill(bodyOf(ch))));
    store.setPages(
      ch.id,
      pdfPageCount(await printer.print(measure)),
      sha(css + bodyOf(ch)),
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
  for (let round = 0; round < 3; round++) {
    pageOf = new Map();
    let at = front + 1;
    for (const ch of chapters) {
      pageOf.set(ch.id, at);
      at += pagesOf(ch) || 1;
    }
    const frontHtml = `${cover(cfg, v, statsOf(cfg, v, chapters, 0))}\n${toc(
      v.parts,
      include,
      titleOf(store),
      pageOf,
      frameOf(v, chapters, undefined, at),
    )}`;
    await Bun.write(measure, shell(cfg.title, css, frontHtml));
    const got = pdfPageCount(await printer.print(measure));
    if (got === front) break;
    front = got;
  }

  /* ── ④ 마무리 쪽수 ────────────────────────────────────── */
  // 마무리는 본문 뒤에 오므로 챕터 쪽번호를 흔들지 않는다.
  const body = front + chapters.reduce((n, c) => n + pagesOf(c), 0);
  await Bun.write(
    measure,
    shell(
      cfg.title,
      css,
      colophon(
        cfg,
        s,
        v,
        chapters,
        (c) => store.get(c.id),
        statsOf(cfg, v, chapters, 0),
        crossRefs,
      ),
    ),
  );
  const back = pdfPageCount(await printer.print(measure));

  return {
    v,
    chapters,
    css,
    bodies,
    crossRefs,
    pageOf,
    front,
    back,
    total: body + back + BACK_COVER_PAGES,
  };
}

async function printVolume(
  ctx: Ctx,
  printer: Printer,
  l: Layout,
  sizes: Map<string, VolumeSize>,
): Promise<string[]> {
  const { cfg, s, store, out } = ctx;
  const { v, chapters, css, bodies, crossRefs, pageOf, front, back, total } = l;
  const broken: string[] = [];
  const dir = `${out}/${v.vol.id}`;
  await mkdir(dir, { recursive: true });

  const include = new Set(chapters.map((c) => c.id));
  const pagesOf = (ch: Chapter) => store.get(ch.id)?.pages ?? 0;
  const body = front + chapters.reduce((n, c) => n + pagesOf(c), 0);
  const stats = statsOf(cfg, v, chapters, total);
  const head = runningHead(cfg, v);
  // 개요 표기는 쪽수를 잰 뒤에 붙인다 — 조판을 밀지 않는다는 전제는 아래 예측·실측 대조가 확인한다.
  const outlined = outlineChapters(v.parts, bodies, titleOf(store));
  const bookHtml = shell(
    head,
    css,
    [
      cover(cfg, v, stats),
      toc(
        v.parts,
        include,
        titleOf(store),
        pageOf,
        frameOf(v, chapters, total, body + 1),
      ),
      ...chapters.map((c) =>
        fill(outlined.get(c.id) ?? bodies.get(c.id) ?? "", {
          pages: pagesOf(c),
          ...(pageOf.has(c.id) ? { folio: pageOf.get(c.id) } : {}),
        }),
      ),
      relevel(
        colophon(cfg, s, v, chapters, (c) => store.get(c.id), stats, crossRefs),
        { 3: null, 4: null },
      ),
      backCover(cfg, s, v, sizes, factsOf(chapters, bodies, store)),
    ].join("\n"),
  );
  const htmlPath = `${dir}/book.html`;
  await Bun.write(htmlPath, bookHtml);

  const pdf = await printer.print(
    htmlPath,
    { outline: true },
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
          design: cfg.design.source,
        },
        volume: {
          id: v.vol.id,
          label: v.vol.label,
          ordinal: v.ordinal,
          of: s.volumes.length,
          stars: v.vol.stars,
        },
        tracks: cfg.tracks.map((t) => ({ id: t.id, enabled: t.enabled })),
        pages: {
          front,
          back,
          backCover: BACK_COVER_PAGES,
          predicted: total,
          actual,
        },
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
      `앞붙이 ${front}쪽 · 본문 ${chapters.length}편 · 마무리 ${back}쪽 · 뒤표지 ${BACK_COVER_PAGES}쪽 · 다른 권 참조 ${crossRefs.length}건`,
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
