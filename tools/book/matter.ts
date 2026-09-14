/**
 * 앞붙이와 뒷붙이 — 표지 · 목차 · 마무리.
 *
 * 목차의 쪽번호는 **낱장으로 잰 챕터 쪽수를 누적해서** 낸다. 챕터마다 `break-before: page`
 * 를 걸어 두면 한 편의 쪽수는 혼자 인쇄하든 합본 안에 있든 같다 — 두 편으로 실측했다
 * (36 + 47 = 83, 정확히 일치). 그래서 두 번 인쇄할 필요가 없고, 안 바뀐 편은 다시 재지도
 * 않는다.
 *
 * 마무리를 "부록"이 아니라 **판 대조표**로 둔 이유가 있다. 이 책은 한 번 찍고 끝나는 것이
 * 아니라 가이드가 고쳐질 때마다 그 편만 갈아 끼운다. 그러면 **손에 든 PDF 가 어느 판의
 * 원문으로 찍힌 것인지**가 곧 신뢰의 문제가 된다. 챕터별 원문 해시를 싣는 것이 그 답이다.
 */

import type { Chapter, ChapterPlan, Part } from "./chapters.ts";
import type { BookConfig } from "./config.ts";
import type { CacheEntry } from "./fragment.ts";

export function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export interface BookStats {
  /** 트랙별 실린 편수. */
  perTrack: { label: string; taken: number; skipped: number; note: string }[];
  totalPages: number;
  builtAt: Date;
}

/* ────────────────────────── 표지 ────────────────────────── */

export function cover(cfg: BookConfig, stats: BookStats): string {
  const rows: string[] = [];
  const add = (k: string, v: string) => {
    if (v !== "") rows.push(`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`);
  };
  add("지은이", cfg.author);
  add("판", cfg.edition);
  add("찍은 날", stats.builtAt.toISOString().slice(0, 10));
  add(
    "수록",
    stats.perTrack
      .filter((t) => t.taken > 0)
      .map((t) => `${t.label} ${t.taken}편`)
      .join(" · "),
  );
  if (stats.totalPages > 0) add("분량", `${stats.totalPages}쪽`);

  return `<section class="bk-front bk-cover">
<div class="bk-cover-rule"></div>
<h1>${esc(cfg.title)}</h1>
${cfg.subtitle === "" ? "" : `<p class="bk-sub">${esc(cfg.subtitle)}</p>`}
<dl>${rows.join("\n")}</dl>
</section>
`;
}

/* ────────────────────────── 목차 ────────────────────────── */

/**
 * 쪽번호를 아직 모를 때는 `pageOf` 를 비워 부른다 — 자리를 `000` 으로 잡아 **줄 수를 미리
 * 확정**한다. 숫자가 들어가도 줄 수가 안 바뀌므로 목차 쪽수는 한 번에 수렴한다.
 */
export function toc(
  parts: Part[],
  include: Set<string>,
  titleOf: (c: Chapter) => string,
  pageOf: Map<string, number>,
): string {
  const shown = (c: Chapter) => c.ready && include.has(c.id);
  const out: string[] = [`<section class="bk-front bk-toc">`, `<h1>목차</h1>`];

  for (const part of parts) {
    const live = part.volumes
      .flatMap((v) => v.bundles.flatMap((b) => b.chapters))
      .filter(shown);
    if (live.length === 0) continue;
    out.push(`<p class="bk-toc-part">${esc(part.label)}</p>`);

    for (const vol of part.volumes) {
      const volLive = vol.bundles.flatMap((b) => b.chapters).filter(shown);
      if (volLive.length === 0) continue;
      if (vol.label !== "")
        out.push(`<p class="bk-toc-volume">${esc(vol.label)}</p>`);

      for (const bundle of vol.bundles) {
        const chs = bundle.chapters.filter(shown);
        if (chs.length === 0) continue;
        if (bundle.label !== "")
          out.push(`<p class="bk-toc-bundle">${esc(bundle.label)}</p>`);
        out.push(`<ul class="bk-toc-list">`);
        for (const c of chs) {
          const page = pageOf.get(c.id);
          out.push(
            `<li><span class="bk-toc-no">${c.number ?? 0}.</span>` +
              `<a href="#${c.id}">${esc(titleOf(c))}</a>` +
              `<span class="bk-toc-dots"></span>` +
              `<span class="bk-toc-page">${page === undefined ? "000" : page}</span></li>`,
          );
        }
        out.push(`</ul>`);
      }
    }
  }
  out.push(`</section>`);
  return `${out.join("\n")}\n`;
}

/* ────────────────────────── 마무리 ────────────────────────── */

export function colophon(
  cfg: BookConfig,
  plan: ChapterPlan,
  taken: Chapter[],
  entryOf: (c: Chapter) => CacheEntry | undefined,
  stats: BookStats,
): string {
  const trackRows = stats.perTrack
    .map(
      (t) =>
        `<tr><td>${esc(t.label)}</td><td>${t.taken}</td><td>${t.skipped}</td><td>${esc(t.note)}</td></tr>`,
    )
    .join("\n");

  const editionRows = taken
    .map((c) => {
      const e = entryOf(c);
      return (
        `<tr><td>${c.number}</td><td>${esc(c.name)}</td>` +
        `<td><code>${esc(e?.srcHash.slice(0, 10) ?? "—")}</code></td>` +
        `<td>${e?.pages ?? "—"}</td></tr>`
      );
    })
    .join("\n");

  const missing = new Map<string, string[]>();
  for (const s of plan.skipped) {
    // 사유 문구가 이미 트랙 이름을 담고 있다 — 앞에 또 붙이면 「자료구조 — 자료구조 …」가 된다.
    const key = s.skipReason ?? `${s.trackLabel} — 사유 없음`;
    missing.set(key, [...(missing.get(key) ?? []), s.name]);
  }
  const missingBlocks = [...missing.entries()]
    .map(
      ([key, names]) =>
        `<p><strong>${esc(key)}</strong> — ${names.length}편</p><p class="bk-missing">${esc(names.join(" · "))}</p>`,
    )
    .join("\n");

  const dead = taken
    .flatMap((c) => (entryOf(c)?.deadRefs ?? []).map((r) => r))
    .reduce((m, r) => m.set(r, (m.get(r) ?? 0) + 1), new Map<string, number>());
  const deadRows = [...dead.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(
      ([path, n]) => `<tr><td><code>${esc(path)}</code></td><td>${n}</td></tr>`,
    )
    .join("\n");

  return `<section class="bk-back bk-colophon">
<h1>마무리</h1>

<h2>이 책은 어떻게 만들어졌는가</h2>
<p>본문은 저장소의 가이드 원문(<code>*-guide.md</code>)에서 곧바로 조판했습니다. 사람이 옮겨
적은 자리가 없으므로 원문이 고쳐지면 책도 같은 내용이 됩니다. 조판은 다섯 단계입니다 —
인덱스에서 차례를 읽고, 편마다 조각을 만들고, 낱장으로 쪽수를 재고, 그 쪽수로 목차를 채우고,
합본을 한 번 인쇄합니다.</p>
<p>화면판에 있는 대화형 시뮬레이션은 종이에서 동작하지 않으므로, 같은 자리에 원문이 함께
지니고 있던 아스키 그림이 인쇄됩니다. 내용이 빠진 것이 아니라 표현이 바뀐 것입니다.</p>

<h2>수록 현황</h2>
<table>
<thead><tr><th>트랙</th><th>실림</th><th>미수록</th><th>비고</th></tr></thead>
<tbody>
${trackRows}
</tbody>
</table>
${missingBlocks === "" ? "" : `<h3>미수록 목록</h3>\n${missingBlocks}`}
${
  deadRows === ""
    ? ""
    : `<h3>책 안에서 잇지 못한 상호 참조</h3>
<p>본문이 가리키는 가이드가 아직 이 책에 없어 「(미수록)」으로 표시된 자리입니다. 해당 트랙이
편입되면 같은 자리가 책 안쪽 링크가 됩니다.</p>
<table>
<thead><tr><th>가리키는 원문</th><th>횟수</th></tr></thead>
<tbody>
${deadRows}
</tbody>
</table>`
}

<h2>판 대조표</h2>
<p>편마다 어느 판의 원문으로 찍혔는지를 적었습니다. 해시는 원문 내용에서 뽑은 것이라, 같은
해시면 같은 글입니다. 가이드가 고쳐지면 그 편의 해시만 바뀝니다.</p>
<table>
<thead><tr><th>장</th><th>이름</th><th>원문 판</th><th>쪽</th></tr></thead>
<tbody>
${editionRows}
</tbody>
</table>

<h2>다시 만들려면</h2>
<pre class="gs-ascii"><code>bun run tools/book/build-book.ts            # 바뀐 편만 다시 조판한다
bun run tools/book/build-book.ts --refresh  # 전부 다시 조판한다
bun run tools/book/build-book.ts --only &lt;장 id&gt;</code></pre>
<p>설정은 <code>book.config.json</code>, 차례의 정본은 <code>${esc(cfg.index)}</code>입니다.</p>
<p class="bk-kicker">찍은 시각 ${esc(stats.builtAt.toISOString())}</p>
</section>
`;
}
