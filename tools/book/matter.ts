/**
 * 앞붙이와 뒷붙이 — 표지 · 목차 · 마무리 · 뒤표지.
 *
 * 모양은 디자인 템플릿(`book.config.json` 의 `design.source`)의 「01 표지」 · 「02 목차」 ·
 * 「08 뒤표지」를 옮긴 것이다. 템플릿의 예시 글(배낭 문제 문장 · 가짜 바코드)은 옮기지 않고,
 * 같은 자리에 설정과 원고에서 나온 값을 앉힌다.
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

import type { Chapter, Part } from "./chapters.ts";
import type { BookConfig } from "./config.ts";
import type { CacheEntry } from "./fragment.ts";
import type { CrossRef, Split, VolumePlan } from "./volume.ts";
import { placeLabel } from "./volume.ts";

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

/** 표지 — 큰 권 번호, 세로 제목, 권 이름과 범위. 한 쪽을 통째로 쓴다(`bk-full`). */
export function cover(
  cfg: BookConfig,
  v: VolumePlan,
  stats: BookStats,
): string {
  const range = [v.vol.label, v.vol.blurb].filter((x) => x !== "").join(" · ");
  return `<section class="bk-front bk-cover" data-volume="${esc(v.vol.id)}">
<div class="bk-cover-no">${v.ordinal}</div>
<div class="bk-cover-rule"></div>
<p class="bk-cover-title">${esc(cfg.title)}.</p>
<p class="bk-cover-range">${esc(range)}</p>
<p class="bk-cover-vol">VOL. ${v.ordinal} / ${cfg.volumes.length} — ${stats.builtAt.getFullYear()}</p>
<div class="bk-cover-series"><span class="bk-label">${esc(cfg.design.seriesLabel)}</span><span class="bk-mark"></span></div>
</section>
`;
}

/* ────────────────────────── 목차 ────────────────────────── */

/** 목차 머리의 값. 쪽수를 아직 모르면 비워 둔다 — 자리값이 같은 줄 수를 잡는다. */
export interface TocFrame {
  /** 권의 범위 한 줄(`volumes[].blurb`). */
  blurb: string;
  /** 「26 ALGORITHMS」의 단위. 트랙이 섞이면 CHAPTERS. */
  unit: string;
  totalPages?: number;
  /** 마무리가 시작하는 쪽. */
  backPage?: number;
}

/** `★★★ 상 — 필수 (코딩 테스트 단골 + 실무 일상)` → `상 — 필수`. */
export function gradeOf(partLabel: string): string {
  return partLabel
    .replace(/^★+\s*/, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

/**
 * 쪽번호를 아직 모를 때는 `pageOf` 를 비워 부른다 — 자리를 `000` 으로 잡아 **줄 수를 미리
 * 확정**한다. 숫자가 들어가도 줄 수가 안 바뀌므로 목차 쪽수는 한 번에 수렴한다.
 */
export function toc(
  parts: Part[],
  include: Set<string>,
  titleOf: (c: Chapter) => string,
  pageOf: Map<string, number>,
  frame: TocFrame = { blurb: "", unit: "CHAPTERS" },
): string {
  const shown = (c: Chapter) => c.ready && include.has(c.id);
  const liveParts = parts.filter((part) =>
    part.volumes.some((v) => v.bundles.some((b) => b.chapters.some(shown))),
  );
  const count = liveParts
    .flatMap((pt) =>
      pt.volumes.flatMap((v) => v.bundles.flatMap((b) => b.chapters)),
    )
    .filter(shown).length;
  const onePart = liveParts.length === 1 ? liveParts[0] : undefined;
  const lede = [
    onePart === undefined ? "" : gradeOf(onePart.label),
    frame.blurb,
  ]
    .filter((x) => x !== "")
    .join(" — ");
  const num = (n: number | undefined, blank: string) =>
    n === undefined ? blank : n.toLocaleString("en-US");

  const out: string[] = [
    `<section class="bk-front bk-toc">`,
    `<div class="bk-toc-head"><h1>목차</h1><span class="bk-toc-meta">${count} ${esc(frame.unit)} · ${num(frame.totalPages, "000")} PAGES</span></div>`,
    lede === "" ? "" : `<p class="bk-toc-lede">${esc(lede)}</p>`,
  ];

  for (const part of liveParts) {
    if (onePart === undefined) {
      out.push(`<p class="bk-toc-part">${esc(part.label)}</p>`);
    }
    for (const vol of part.volumes) {
      const volLive = vol.bundles.flatMap((b) => b.chapters).filter(shown);
      if (volLive.length === 0) continue;
      if (vol.label !== "")
        out.push(`<p class="bk-toc-volume">${esc(vol.label)}</p>`);

      for (const bundle of vol.bundles) {
        const chs = bundle.chapters.filter(shown);
        if (chs.length === 0) continue;
        out.push(`<div class="bk-toc-group">`);
        out.push(
          `<p class="bk-toc-bundle"><span>${esc(bundle.label)}</span><span class="bk-toc-count">${chs.length}편</span></p>`,
        );
        out.push(`<ul class="bk-toc-list">`);
        for (const c of chs) {
          const page = pageOf.get(c.id);
          out.push(
            `<li><span class="bk-toc-no">${String(c.number ?? 0).padStart(2, "0")}</span>` +
              `<a href="#${c.id}">${esc(titleOf(c))}</a>` +
              `<span class="bk-toc-dots"></span>` +
              `<span class="bk-toc-page">${page === undefined ? "000" : page}</span></li>`,
          );
        }
        out.push(`</ul>`, `</div>`);
      }
    }
  }
  out.push(
    `<p class="bk-toc-end"><span>마무리 — 시리즈 구성 · 수록 현황 · 판 대조표</span><span class="bk-toc-page">${num(frame.backPage, "000")}</span></p>`,
    `</section>`,
  );
  return `${out.filter((x) => x !== "").join("\n")}\n`;
}

/* ────────────────────────── 뒤표지 ────────────────────────── */

/** 뒤표지의 시리즈 표 한 줄. 쪽수를 모르는 권(아직 안 찍은 권)은 편수만 적는다. */
export interface VolumeSize {
  chapters: number;
  pages?: number;
}

/** 뒤표지 — 시리즈 구성 · 이 책의 뼈대 · 권 표식. 한 쪽을 통째로 쓴다(`bk-full`). */
export function backCover(
  cfg: BookConfig,
  s: Split,
  v: VolumePlan,
  sizes: Map<string, VolumeSize>,
  facts: { code: string; structure: string },
): string {
  const d = cfg.design;
  const rows = s.volumes
    .map((x) => {
      const size = sizes.get(x.vol.id);
      const amount = [
        `${size?.chapters ?? x.chapters.length}편`,
        size?.pages === undefined
          ? ""
          : `${size.pages.toLocaleString("en-US")}쪽`,
      ]
        .filter((y) => y !== "")
        .join(" · ");
      return (
        `<div><span class="bk-bc-vol">VOL.${x.ordinal}</span><span class="bk-bc-label">${esc(x.vol.label)}</span>` +
        `<span class="bk-bc-blurb">${esc(x.vol.blurb)}</span><span class="bk-bc-size">${esc(amount)}</span></div>`
      );
    })
    .join("\n");
  const fact = (label: string, value: string) =>
    value === ""
      ? ""
      : `<div><div class="bk-label">${label}</div><div>${esc(value)}</div></div>`;

  return `<section class="bk-backcover">
<div class="bk-bc">
<p class="bk-bc-headline">${esc(d.backHeadline)}</p>
${d.backLede === "" ? "" : `<p class="bk-bc-lede">${esc(d.backLede)}</p>`}
<div class="bk-bc-series">
${rows}
</div>
<div class="bk-bc-facts">${fact("CODE", facts.code)}${fact("STRUCTURE", facts.structure)}${fact("READER", d.reader)}</div>
<div class="bk-bc-ghost">${v.ordinal}</div>
<div class="bk-bc-foot">
<div><div class="bk-bc-title">${esc(cfg.title)}</div>
<div class="bk-bc-mark"><span class="bk-label">VOL. ${v.ordinal} / ${s.volumes.length} · ${esc(v.vol.label)}</span><span class="bk-mark"></span></div></div>
${d.isbn === "" ? "" : `<div class="bk-bc-isbn"><div class="bk-label">ISBN</div><div>${esc(d.isbn)}</div></div>`}
</div>
</div>
</section>
`;
}

/* ────────────────────────── 마무리 ────────────────────────── */

export function colophon(
  cfg: BookConfig,
  s: Split,
  v: VolumePlan,
  taken: Chapter[],
  entryOf: (c: Chapter) => CacheEntry | undefined,
  stats: BookStats,
  crossRefs: CrossRef[] = [],
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
  for (const c of v.skipped) {
    // 사유 문구가 이미 트랙 이름을 담고 있다 — 앞에 또 붙이면 「자료구조 — 자료구조 …」가 된다.
    const key = c.skipReason ?? `${c.trackLabel} — 사유 없음`;
    missing.set(key, [...(missing.get(key) ?? []), c.name]);
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

  const seriesRows = s.volumes
    .map(
      (x) =>
        `<tr><td>${x.ordinal}권 ${esc(x.vol.label)}${x.vol.id === v.vol.id ? " (이 권)" : ""}</td>` +
        `<td>${esc(x.vol.stars.map(starLabel).join(" · "))}</td>` +
        `<td>${esc(x.vol.blurb)}</td><td>${x.chapters.length}</td></tr>`,
    )
    .join("\n");

  const nameOf = new Map(
    s.volumes.flatMap((x) => x.chapters.map((c) => [c.id, c.name] as const)),
  );
  const crossCount = new Map<string, { ref: CrossRef; n: number }>();
  for (const r of crossRefs) {
    const hit = crossCount.get(r.target);
    crossCount.set(r.target, { ref: r, n: (hit?.n ?? 0) + 1 });
  }
  const crossRows = [...crossCount.values()]
    .sort((a, b) => b.n - a.n)
    .map(
      ({ ref, n }) =>
        `<tr><td>${esc(nameOf.get(ref.target) ?? ref.target)}</td><td>${esc(placeLabel(ref.at))}</td><td>${n}</td></tr>`,
    )
    .join("\n");

  const biblio = [
    ["지은이", cfg.author],
    ["판", cfg.edition],
    ["권", `전 ${s.volumes.length}권 중 ${v.ordinal}권 · ${v.vol.label}`],
    ["찍은 날", stats.builtAt.toISOString().slice(0, 10)],
    [
      "수록",
      stats.perTrack
        .filter((t) => t.taken > 0)
        .map((t) => `${t.label} ${t.taken}편`)
        .join(" · "),
    ],
    // 분량은 싣지 않는다 — 마무리를 잴 때는 전체 쪽수를 아직 몰라, 줄이 있고 없음에 따라 잰
    // 쪽수와 찍은 쪽수가 갈릴 수 있다. 분량은 목차 머리와 뒤표지가 싣는다.
  ]
    .filter(([, val]) => val !== "")
    .map(
      ([k, val]) =>
        `<tr><td>${esc(k ?? "")}</td><td>${esc(val ?? "")}</td></tr>`,
    )
    .join("\n");

  return `<section class="bk-back bk-colophon">
<h1>마무리</h1>

<h2>이 책</h2>
<table class="bk-biblio">
<tbody>
${biblio}
</tbody>
</table>

<h2>이 책은 어떻게 만들어졌는가</h2>
<p>본문은 저장소의 가이드 원문(<code>*-guide.md</code>)에서 곧바로 조판했습니다. 사람이 옮겨
적은 자리가 없으므로 원문이 고쳐지면 책도 같은 내용이 됩니다. 조판은 다섯 단계입니다 —
인덱스에서 차례를 읽고, 편마다 조각을 만들고, 낱장으로 쪽수를 재고, 그 쪽수로 목차를 채우고,
합본을 한 번 인쇄합니다.</p>
<p>이 시리즈는 ${s.volumes.length}권입니다. 권은 가이드 인덱스의 중요도 등급으로 나뉩니다 —
${esc(s.volumes.map((x) => `${x.vol.stars.map(starLabel).join("·")} 는 ${x.vol.label}`).join(", "))}.
장 번호는 권마다 1부터 다시 셉니다. 다른 권에 실린 장을 가리키는 자리에는 링크 대신 그 장이
실린 권과 번호를 괄호로 적었습니다${crossRefs[0] === undefined ? "" : `(예: 「${esc(placeLabel(crossRefs[0].at))}」)`}.</p>
<p>화면판에 있는 대화형 시뮬레이션은 종이에서 동작하지 않으므로, 같은 자리에 원문이 함께
지니고 있던 아스키 그림이 인쇄됩니다. 내용이 빠진 것이 아니라 표현이 바뀐 것입니다.</p>

<h2>시리즈 구성</h2>
<table>
<thead><tr><th>권</th><th>인덱스 등급</th><th>범위</th><th>편수</th></tr></thead>
<tbody>
${seriesRows}
</tbody>
</table>

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

${
  crossRows === ""
    ? ""
    : `<h3>다른 권을 가리키는 참조</h3>
<p>본문이 가리키는 장이 다른 권에 실려 있어, 링크 대신 그 장이 실린 자리를 적은 곳입니다.</p>
<table>
<thead><tr><th>가리키는 장</th><th>실린 자리</th><th>횟수</th></tr></thead>
<tbody>
${crossRows}
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
<pre class="gs-ascii"><code>bun run tools/book/build-book.ts                       # 세 권 모두, 바뀐 편만 다시 조판한다
bun run tools/book/build-book.ts --volume ${esc(v.vol.id)}  # 이 권만
bun run tools/book/build-book.ts --refresh             # 전부 다시 조판한다</code></pre>
<p>설정은 <code>book.config.json</code>, 차례의 정본은 <code>${esc(cfg.index)}</code>입니다.</p>
<p class="bk-kicker">찍은 시각 ${esc(stats.builtAt.toISOString())}</p>
</section>
`;
}

/** `3` → `★★★`. 미분류 부(0)는 이름으로 적는다. */
export function starLabel(stars: number): string {
  return stars === 0 ? "미분류" : "★".repeat(stars);
}
