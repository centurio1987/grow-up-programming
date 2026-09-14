/**
 * 디자인 샘플 — 세 권 원본에서 **디자인 검토에 필요한 자리만** 뽑아 한 파일로 찍는다.
 *
 * ```bash
 * bun run tools/book/build-book.ts     # 먼저 세 권을 찍는다(쪽수·목차 번호가 거기서 나온다)
 * bun run tools/book/build-sample.ts
 * ```
 *
 * 원본은 세 권 합쳐 2천7백 쪽 · 90MB 대라 디자이너에게 넘길 수 없다. 그렇다고 원고 몇 쪽을
 * 손으로 오려 붙이면 **요소가 빠진다** — 블록 수식은 111편 중 4편에만, 번호 목록은 8편에만
 * 있어서 아무 장이나 고르면 샘플에 없는 요소를 책이 쓰게 된다. 그래서 요소 목록(`SPECS`)을
 * 기준으로 삼고, 책 전체에서 요소마다 등장 횟수를 세고, 실제 원고에서 견본을 하나씩 떠 온다.
 *
 * 샘플은 원본과 **같은 조판 코드**로 찍는다(`shell` · `bookCss` · `place` · 표지 · 목차).
 * 따로 흉내 낸 페이지를 만들면 디자이너가 본 것과 책이 갈린다.
 *
 * 산출: `<sample.outDir>/<책 제목> 디자인 샘플.pdf` 와 같은 이름의 `.html`.
 * 종료코드: 0 정상 · 1 견본을 못 뜬 요소가 있음 · 2 대상·설정 문제
 */

import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type { Element } from "happy-dom";
import { Window } from "happy-dom";
import { bookCss, factsOf, frameOf, shell, statsOf } from "./build-book.ts";
import type { Chapter } from "./chapters.ts";
import { plan } from "./chapters.ts";
import { Printer, pdfPageCount } from "./chrome.ts";
import { loadConfig, REPO } from "./config.ts";
import { FragmentStore } from "./fragment.ts";
import type { VolumeSize } from "./matter.ts";
import { backCover, cover, esc, starLabel, toc } from "./matter.ts";
import { atChapterTop, mark, relevel } from "./outline.ts";
import { GEOMETRY } from "./print-css.ts";
import type { VolumePlan } from "./volume.ts";
import { fill, place, placeLabel, split } from "./volume.ts";

/** 요소 하나. `selector` 는 스타일을 거는 자리라 디자인을 CSS 로 옮길 때 그대로 쓴다. */
interface Spec {
  name: string;
  selector: string;
  role: string;
  /** 이 요소로 치는가. 선택자만으로 갈리지 않는 요소(멈춤 제목 · 두 종류의 코드 블록)에 쓴다. */
  is?: (el: Element) => boolean;
  /** 견본으로 고르기 좋은가(길이 등). 맞는 게 없으면 첫 번째를 쓴다. */
  fits?: (el: Element) => boolean;
  /** 견본으로 뜰 범위. 인라인 요소는 문단째 떠야 앞뒤 글과의 관계가 보인다. */
  scope?: (el: Element) => Element[];
}

const lines = (el: Element) => el.querySelectorAll(".line").length;
const parent = (el: Element) => [el.parentElement ?? el];
/** 제목과 그 뒤 두 블록 — 제목만 떼어 놓으면 본문과의 간격이 안 보인다. */
const withNext =
  (n: number) =>
  (el: Element): Element[] => {
    const out = [el];
    let at = el.nextElementSibling;
    while (at !== null && out.length <= n && !/^H[1-4]$/.test(at.tagName)) {
      out.push(at);
      at = at.nextElementSibling;
    }
    return out;
  };
const text = (el: Element) => el.textContent ?? "";

const SPECS: Spec[] = [
  {
    name: "챕터 간지",
    selector: ".bk-opener",
    role: "장마다 한 쪽 — 큰 장 번호 · 분류(트랙 · 기법 묶음) · 장 제목 · 파트 요약(원고의 파트 첫 문단) · 언어 · 쪽수",
  },
  {
    name: "파트 제목",
    selector: "h2",
    role: "장마다 두 번 — 파트 1(아이디어에서 코드까지) · 파트 2(적용 조건 · 보장 · 비용)",
    scope: withNext(1),
  },
  {
    name: "절 제목",
    selector: "h3",
    role: "장마다 열 개 안팎 — 전체 컨셉 · 수행으로 알아보기 · 비용 계산 · 스스로 점검하기 등",
    fits: (el) => el.nextElementSibling?.tagName === "P",
    scope: withNext(1),
  },
  {
    name: "단계 제목",
    selector: "h4",
    role: "절 안의 번호 단계(1. 2. 3. …)와 소항목",
    is: (el) => !text(el).startsWith("멈춤"),
    fits: (el) => /^\d+\./.test(text(el)),
    scope: withNext(1),
  },
  {
    name: "멈춤 상자",
    selector: ".bk-stop",
    role: "「멈춤 — …」 흔한 실수를 짚는 자리. 제목부터 다음 제목 전까지를 한 상자로 묶는다",
    fits: (el) => text(el).length < 700,
  },
  {
    name: "본문 문단 · 강조 · 인라인 코드",
    selector: "p, strong, :not(pre) > code",
    role: "본문. 굵은 글씨와 인라인 코드가 한 문단에 섞인다",
    is: (el) =>
      el.tagName === "P" &&
      el.querySelector("strong") !== null &&
      el.querySelector("code") !== null,
    fits: (el) => text(el).length > 120 && text(el).length < 320,
  },
  {
    name: "책 안쪽 상호 참조",
    selector: 'a[href^="#"]',
    role: "같은 권의 다른 장을 가리키는 링크. PDF 에서 누르면 그 장으로 간다",
    is: (el) => /^#algorithms--/.test(el.getAttribute("href") ?? ""),
    scope: parent,
  },
  {
    name: "다른 권 참조",
    selector: ".bk-xref-other",
    role: "다른 권에 실린 장. 링크 대신 「(중급 제 N 장)」처럼 실린 자리를 붙인다",
    scope: parent,
  },
  {
    name: "미수록 참조",
    selector: ".bk-xref-dead",
    role: "아직 책에 없는 글(자료구조 트랙). 「(미수록)」을 붙인다",
    scope: parent,
  },
  {
    name: "글머리표 목록",
    selector: "ul",
    role: "선행 지식 · 쓰이는 곳 등의 나열",
    is: (el) => el.closest("details") === null,
    fits: (el) => el.children.length >= 3 && el.children.length <= 6,
  },
  {
    name: "번호 목록",
    selector: "ol",
    role: "순서가 있는 나열. 책 전체에서 드물다",
  },
  {
    name: "표",
    selector: "table",
    role: "수행 추적 · 비용 비교 · 경쟁 설계 대조. 장마다 여러 개",
    fits: (el) => {
      const rows = el.querySelectorAll("tbody tr").length;
      return rows >= 3 && rows <= 6 && el.querySelectorAll("th").length >= 3;
    },
  },
  {
    name: "소스 코드 블록",
    selector: "figure.bk-code",
    role: "TypeScript 구현. 머리 줄에 언어, 예약어는 굵게 · 주석은 옅게. 쪽을 넘어가면 갈라진다",
    fits: (el) => lines(el) >= 6 && lines(el) <= 16,
  },
  {
    name: "도식 · 계산 블록",
    selector: 'pre.shiki[data-language="text"]',
    role: "고정폭 글꼴로 줄을 맞춘 계산 과정 · 상태 그림. 가장 많이 쓰이는 블록. 넘치면 글자를 줄여 한 줄에 맞춘다",
    fits: (el) => lines(el) >= 3 && lines(el) <= 8,
  },
  {
    name: "시뮬레이션 대체 그림",
    selector: ".gs-mount > pre.gs-ascii",
    role: "화면판의 대화형 시뮬레이션 자리. 종이에는 아스키 그림이 찍힌다. 쪽에서 갈라지지 않는다",
    scope: parent,
  },
  {
    name: "인용 상자",
    selector: "blockquote",
    role: "불변식 · 요점 한 줄. 쪽에서 갈라지지 않는다",
  },
  {
    name: "스스로 점검하기 답",
    selector: "details.gs-check",
    role: "점검 질문의 답. 화면에서는 접혀 있고 종이에서는 펼쳐 찍는다",
    fits: (el) => text(el).length < 500,
  },
  {
    name: "인라인 수식",
    selector: ".katex",
    role: "문장 안의 수식(KaTeX)",
    is: (el) => el.closest(".katex-display") === null,
    fits: (el) => (el.parentElement?.textContent ?? "").length < 260,
    scope: parent,
  },
  {
    name: "블록 수식",
    selector: ".katex-display",
    role: "가운데 줄에 따로 선 수식. 책 전체에서 드물다",
    scope: (el) => {
      const p = el.parentElement;
      return p?.tagName === "P" ? [p] : [el];
    },
  },
];

interface Source {
  v: VolumePlan;
  ch: Chapter;
  html: string;
}

interface Tally {
  count: number;
  chapters: number;
}

function matches(doc: ReturnType<typeof parse>, spec: Spec): Element[] {
  return [...doc.querySelectorAll(spec.selector)].filter(
    (el) => spec.is?.(el) ?? true,
  );
}

function parse(win: Window, html: string) {
  return new win.DOMParser().parseFromString(
    `<main>${html}</main>`,
    "text/html",
  );
}

/** 견본으로 뜬 조각. `id` 를 지워 본문 장의 앵커와 겹치지 않게 한다. */
function cut(els: Element[]): string {
  return els
    .map((el) => {
      const c = el.cloneNode(true) as Element;
      c.removeAttribute("id");
      for (const x of c.querySelectorAll("[id]")) x.removeAttribute("id");
      return c.outerHTML;
    })
    .join("\n");
}

const SAMPLE_CSS = `
/* 샘플에만 쓰는 편집 주석 — 책에는 인쇄되지 않는다. 본문 색과 겹치지 않는 색으로 둔다. */
:root { --bk-note: #b0306a; }
.bk-note, .bk-note * { color: var(--bk-note) !important; }
.bk-brief { break-before: page; }
.bk-brief h1 { margin-bottom: .6rem; }
.bk-brief .bk-lede { color: var(--gs-muted); margin: 0 0 1.4rem; }
.bk-brief table { font-size: .8em; }
.bk-brief td:first-child { white-space: nowrap; }
/* 원본에서 표지는 첫 쪽이라 쪽 나눔이 필요 없지만, 샘플에서는 안내 뒤에 세 벌이 이어진다 */
.bk-cover { break-before: page; }
.bk-spec-section { break-before: page; }
.bk-spec { margin: 0 0 1.6rem; break-inside: avoid-page; }
.bk-spec-label {
  margin: 0 0 .5rem; padding: .2rem 0; font-size: .74rem; line-height: 1.5;
  border-bottom: 1px dashed var(--bk-note);
}
.bk-spec-label code { background: transparent !important; padding: 0; }
.bk-spec-body > :first-child { margin-top: 0; }
.bk-spec-body h2 { border-top: none; padding-top: 0; }
.bk-sample-note {
  margin: 0 0 1.2rem; padding: .45rem .7rem; font-size: .8rem;
  border: 1px dashed var(--bk-note);
}
`;

function note(html: string, cls = "bk-note"): string {
  return `<p class="${cls}">${html}</p>`;
}

async function main(): Promise<never> {
  const cfg = await loadConfig();
  if (cfg.sample === undefined) {
    console.error(
      "book.config.json 에 sample 이 없다 — outDir · chapters 를 적는다",
    );
    return process.exit(2);
  }
  const out = resolve(REPO, cfg.outDir);
  const sampleDir = resolve(REPO, cfg.sample.outDir);
  const p = await plan(cfg);
  const s = split(cfg, p);

  // 권별 원본의 실측값. 샘플의 목차 번호와 분량 표가 여기서 나온다 — 샘플이 따로 세면
  // 원본과 다른 숫자를 싣게 된다.
  const locks = new Map<string, Lock>();
  for (const v of s.volumes) {
    const f = Bun.file(`${out}/${v.vol.id}/book.lock.json`);
    const pdf = Bun.file(`${out}/${v.vol.id}/book.pdf`);
    if (!(await f.exists()) || !(await pdf.exists())) {
      console.error(
        `${v.vol.label} 권 원본이 없다(${out}/${v.vol.id}/) — build-book.ts 로 먼저 찍는다`,
      );
      return process.exit(2);
    }
    const lock = (await f.json()) as Lock;
    if (lock.chapters.length !== v.chapters.length) {
      console.error(
        `${v.vol.label} 권 원본이 ${lock.chapters.length}편인데 지금 차례는 ${v.chapters.length}편이다 — --limit 로 찍은 원본이거나 낡았다. 다시 찍는다`,
      );
      return process.exit(2);
    }
    locks.set(v.vol.id, { ...lock, bytes: pdf.size });
  }

  /* ── 권에 앉힌 본문 — 원본과 같은 것 ──────────────────── */
  const store = await FragmentStore.open(cfg.outDir);
  const byDir = new Map(
    [...p.chapters, ...p.skipped].map(
      (c) => [c.src.slice(0, c.src.lastIndexOf("/")), c] as const,
    ),
  );
  const sources: Source[] = [];
  for (const v of s.volumes) {
    for (const ch of v.chapters) {
      await store.ensure(ch, { byDir });
      const frag = await Bun.file(store.fragmentPath(ch.id)).text();
      sources.push({ v, ch, html: place(frag, ch, s, v.vol).html });
    }
  }
  await store.flush();

  const picked = cfg.sample.chapters.map((id) => {
    const hit = sources.find((x) => x.ch.id === id);
    if (hit === undefined) throw new Error(`샘플 챕터가 차례에 없다: ${id}`);
    return hit;
  });

  /* ── 요소 세기 · 견본 뜨기 ─────────────────────────────── */
  const win = new Window();
  const tallies = SPECS.map((): Tally => ({ count: 0, chapters: 0 }));
  const found: ({ html: string; from: Source } | undefined)[] = SPECS.map(
    () => undefined,
  );
  // 견본은 샘플 장에서 먼저 찾는다 — 디자이너가 뒤에서 그 장 전체를 보므로 맥락이 이어진다.
  const order = [...picked, ...sources.filter((x) => !picked.includes(x))];
  for (const src of order) {
    const doc = parse(win, src.html);
    SPECS.forEach((spec, i) => {
      const els = matches(doc, spec);
      const t = tallies[i] as Tally;
      if (els.length > 0) {
        t.count += els.length;
        t.chapters += 1;
      }
      if (found[i] === undefined && els.length > 0) {
        const el = els.find((e) => spec.fits?.(e) ?? true) ?? els[0];
        if (el !== undefined) {
          found[i] = { html: cut(spec.scope?.(el) ?? [el]), from: src };
        }
      }
    });
  }
  await win.happyDOM.close();

  const missing = SPECS.filter((_, i) => found[i] === undefined);

  /* ── 샘플 한 벌 ───────────────────────────────────────── */
  const totalPages = [...locks.values()].reduce(
    (n, l) => n + l.pages.actual,
    0,
  );
  const totalBytes = [...locks.values()].reduce((n, l) => n + l.bytes, 0);
  const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)}MB`;
  const first = s.volumes[0] as VolumePlan;
  const firstLock = locks.get(first.vol.id) as Lock;

  const brief = `<section class="bk-brief">
<h1>${esc(cfg.title)} — 디자인 샘플</h1>
<p class="bk-lede">세 권 원본(합계 ${totalPages.toLocaleString()}쪽 · ${mb(totalBytes)})에서 디자인 검토에 필요한 자리만 뽑았습니다.
원본과 같은 조판 코드로 찍었고, 모양은 <strong>디자인 템플릿을 반영한 것</strong>입니다(${esc(cfg.design.source)}).
<span class="bk-note">분홍색 글씨와 점선 상자는 이 샘플의 설명이며 책에는 인쇄되지 않습니다.</span></p>

<h2>시리즈 구성</h2>
<table>
<thead><tr><th>권</th><th>인덱스 등급</th><th>범위</th><th>편수</th><th>쪽수</th></tr></thead>
<tbody>
${s.volumes
  .map((v) => {
    const l = locks.get(v.vol.id) as Lock;
    return `<tr><td>${v.ordinal}권 ${esc(v.vol.label)}</td><td>${esc(v.vol.stars.map(starLabel).join(" · "))}</td><td>${esc(v.vol.blurb)}</td><td>${v.chapters.length}</td><td>${l.pages.actual.toLocaleString()}</td></tr>`;
  })
  .join("\n")}
</tbody>
</table>

<h2>지면과 현재 설정</h2>
<table>
<tbody>
<tr><td>판형</td><td>${esc(cfg.page.format)}${cfg.page.format === "A4" ? " (210 × 297mm)" : ""}</td></tr>
<tr><td>여백</td><td>본문 쪽 위 ${GEOMETRY.margin.top}mm · 아래 ${GEOMETRY.margin.bottom}mm · 좌우 ${GEOMETRY.margin.side}mm — 홀짝 쪽 구분 없음. 표지 · 간지 · 뒤표지는 여백 0</td></tr>
<tr><td>본문</td><td>10.5pt · 행간 1.7 · IBM Plex Sans KR</td></tr>
<tr><td>코드 · 도식</td><td>IBM Plex Mono 9pt · 행간 1.6</td></tr>
<tr><td>수식</td><td>KaTeX 글꼴</td></tr>
<tr><td>머리말 · 꼬리말</td><td>머리말 왼쪽은 책 제목 · 권 이름, 오른쪽은 EP. N(목차 CONTENTS · 마무리 COLOPHON). 꼬리말은 가운데 쪽번호</td></tr>
<tr><td>색</td><td>흑백. 표식색 ${esc(cfg.design.mark)} 은 표지 막대 · 멈춤 상자에만. 지면 ${esc(cfg.design.paper)}</td></tr>
</tbody>
</table>

<h2>한 권의 순서</h2>
<p>표지 → 목차 → 본문 장(장마다 간지 한 쪽으로 시작) → 마무리(시리즈 구성 · 수록 현황 · 판 대조표) → 뒤표지.
한 장은 평균 ${Math.round(sources.reduce((n, x) => n + (store.get(x.ch.id)?.pages ?? 0), 0) / sources.length)}쪽이고
뼈대가 모든 장에서 같습니다 — 장 제목 → 파트 1 → 파트 2, 그 아래 절과 단계.</p>

<h2>이 샘플에 든 것</h2>
<table>
<thead><tr><th>순서</th><th>내용</th></tr></thead>
<tbody>
<tr><td>1</td><td>표지 ${s.volumes.length}종 — 권마다 하나 · 뒤표지 — ${esc(first.vol.label)} 권</td></tr>
<tr><td>2</td><td>목차 — ${esc(first.vol.label)} 권 전체(원본 쪽번호 그대로)</td></tr>
<tr><td>3</td><td>요소 견본 ${SPECS.length - missing.length}종 — 실제 원고에서 하나씩 떠 옴. 각 견본 위에 선택자와 책 전체 등장 횟수</td></tr>
${picked
  .map(
    (x, i) =>
      `<tr><td>${4 + i}</td><td>본문 샘플 — ${esc(placeLabel({ vol: x.v.vol, number: x.ch.number ?? 0 }))} ${esc(store.get(x.ch.id)?.title ?? x.ch.name)} (${store.get(x.ch.id)?.pages ?? "?"}쪽)</td></tr>`,
  )
  .join("\n")}
</tbody>
</table>

<h2>요소 목록</h2>
<p>책에 나오는 요소 전부입니다. 「등장」은 세 권 합계, 「장」은 그 요소가 한 번이라도 나오는 장의 수(전 ${sources.length}장)입니다.</p>
<table>
<thead><tr><th>#</th><th>요소</th><th>선택자</th><th>등장</th><th>장</th></tr></thead>
<tbody>
${SPECS.map((spec, i) => {
  const t = tallies[i] as Tally;
  return `<tr><td>${i + 1}</td><td>${esc(spec.name)}</td><td><code>${esc(spec.selector)}</code></td><td>${t.count.toLocaleString()}</td><td>${t.chapters}</td></tr>`;
}).join("\n")}
</tbody>
</table>

<h2>만드는 방식에서 오는 조건</h2>
<ul>
<li>원고(마크다운)를 HTML 로 바꾸고 크롬으로 PDF 를 찍습니다. 디자인은 <strong>CSS 로 옮겨져</strong> 모든 장에 똑같이 적용됩니다 — 쪽마다 손으로 배치를 고치는 작업은 다음 빌드에서 사라집니다.</li>
<li>원고가 고쳐지면 그 장만 다시 찍어 끼웁니다. 장의 쪽수가 바뀌므로 특정 쪽번호에 기대는 배치는 유지되지 않습니다.</li>
<li>코드 블록과 표는 쪽 끝에서 갈라질 수 있습니다. 시뮬레이션 대체 그림 · 인용 상자 · 점검 답 상자는 갈라지지 않게 다음 쪽으로 넘깁니다.</li>
<li>표지 · 챕터 간지 · 뒤표지는 한 쪽으로 고정된 틀이라, 글이 길면 넘치지 않고 잘립니다.</li>
</ul>
</section>`;

  const locked = (src: Source) =>
    locks.get(src.v.vol.id)?.chapters.find((c) => c.id === src.ch.id);
  /** 간지의 쪽수 · 쪽번호 자리를 원본 실측으로 채운다. */
  const filled = (src: Source, html: string) => {
    const e = locked(src);
    return fill(
      html,
      e === undefined ? {} : { pages: e.pages, folio: e.startPage },
    );
  };

  const sizes = new Map<string, VolumeSize>(
    s.volumes.map((v) => [
      v.vol.id,
      {
        chapters: v.chapters.length,
        pages: (locks.get(v.vol.id) as Lock).pages.actual,
      },
    ]),
  );
  const firstBodies = new Map(
    sources.filter((x) => x.v === first).map((x) => [x.ch.id, x.html] as const),
  );

  const covers = s.volumes
    .map((v) => {
      const l = locks.get(v.vol.id) as Lock;
      return relevel(
        cover(cfg, v, statsOf(cfg, v, v.chapters, l.pages.actual)),
        { 1: null },
      );
    })
    .join("\n")
    .concat(
      "\n",
      backCover(
        cfg,
        s,
        first,
        sizes,
        factsOf(first.chapters, firstBodies, store),
      ),
    );

  const firstPages = new Map(
    firstLock.chapters.map((c) => [c.id, c.startPage] as const),
  );
  const tocHtml = toc(
    first.parts,
    new Set(first.chapters.map((c) => c.id)),
    (c) => store.get(c.id)?.title ?? c.name,
    firstPages,
    frameOf(
      first,
      first.chapters,
      firstLock.pages.actual,
      firstLock.pages.front +
        firstLock.chapters.reduce((n, c) => n + c.pages, 0) +
        1,
    ),
  );

  const specimen = `<section class="bk-spec-section">
<h1>요소 견본</h1>
${note(`실제 원고에서 요소마다 하나씩 떠 왔습니다. 점선 위 분홍 글씨가 요소 이름 · 스타일을 거는 선택자 · 세 권 합계 등장 횟수 · 출처입니다.`)}
${SPECS.map((spec, i) => {
  const f = found[i];
  const t = tallies[i] as Tally;
  if (f === undefined) return "";
  const from = `${placeLabel({ vol: f.from.v.vol, number: f.from.ch.number ?? 0 })} ${f.from.ch.name}`;
  return `<div class="bk-spec">
${mark(2, `${i + 1}. ${spec.name}`)}
<p class="bk-spec-label bk-note"><strong>${i + 1}. ${esc(spec.name)}</strong> · <code>${esc(spec.selector)}</code> · ${t.count.toLocaleString()}곳(${t.chapters}장) · 출처 ${esc(from)}<br>${esc(spec.role)}</p>
<div class="bk-spec-body">
${relevel(filled(f.from, f.html), { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null })}
</div>
</div>`;
}).join("\n")}
</section>`;

  const bodies = picked
    .map((x) => {
      const l = locks.get(x.v.vol.id) as Lock;
      const entry = l.chapters.find((c) => c.id === x.ch.id);
      const where =
        entry === undefined
          ? ""
          : ` 원본 ${entry.startPage}–${entry.startPage + entry.pages - 1}쪽.`;
      const label = placeLabel({ vol: x.v.vol, number: x.ch.number ?? 0 });
      const title = store.get(x.ch.id)?.title ?? x.ch.name;
      const leveled = relevel(x.html, {
        1: null,
        2: 2,
        3: 3,
        4: null,
        5: null,
        6: null,
      });
      return filled(
        x,
        atChapterTop(
          leveled,
          [mark(1, `본문 샘플 — ${label} ${title}`)],
          x.ch.id,
        ).replace(
          /(<section class="bk-opener"[\s\S]*?<\/section>)/,
          `$1\n${note(`본문 샘플 — ${esc(label)} 전체입니다.${where}`, "bk-sample-note bk-note")}`,
        ),
      );
    })
    .join("\n");

  const title = `${cfg.title} 디자인 샘플`;
  const css = `${await bookCss(cfg, `${cfg.title} · 디자인 샘플`)}\n${SAMPLE_CSS}`;
  const html = shell(
    title,
    css,
    [brief, covers, tocHtml, specimen, bodies].join("\n"),
  );

  await mkdir(sampleDir, { recursive: true });
  const htmlPath = `${sampleDir}/${title}.html`;
  await Bun.write(htmlPath, html);

  const printer = await Printer.launch();
  try {
    const pdf = await printer.print(htmlPath, { outline: true });
    const pdfPath = `${sampleDir}/${title}.pdf`;
    await Bun.write(pdfPath, pdf);
    console.log(
      `${pdfPath} — ${pdfPageCount(pdf)}쪽 · ${mb(pdf.length)} (원본 세 권 ${totalPages}쪽 · ${mb(totalBytes)})`,
    );
    console.log(`${htmlPath} — ${mb(html.length)}`);
  } finally {
    await printer.close();
  }

  if (missing.length > 0) {
    console.error(
      `견본을 못 뜬 요소: ${missing.map((m) => m.name).join(" · ")} — 책에 그 요소가 없거나 선택자가 낡았다`,
    );
    return process.exit(1);
  }
  return process.exit(0);
}

interface Lock {
  pages: { actual: number; front: number };
  chapters: { id: string; startPage: number; pages: number }[];
  bytes: number;
}

if (import.meta.main) await main();
