/**
 * 책 빌더 회귀 시험 — **인쇄 없이 판정되는 것만** 여기서 본다.
 *
 * 크롬을 띄우는 단계(쪽수 계측 · 합본 인쇄)는 CI 에서 빼 놓았다. 대신 그 단계가 기대는
 * 전제 — 「챕터 쪽수는 낱장이든 합본이든 같다」 — 는 빌더가 실행할 때마다 스스로 확인하고
 * 어긋나면 실패한다(`build-book.ts` 의 예측·실측 대조).
 */

import { describe, expect, test } from "bun:test";
import type { Chapter } from "./chapters.ts";
import { plan, unescapeMd } from "./chapters.ts";
import { pdfPageCount } from "./chrome.ts";
import { checkVolumes, loadConfig } from "./config.ts";
import { backCover, colophon, cover, gradeOf, toc } from "./matter.ts";
import { outlineChapters, relevel } from "./outline.ts";
import type { VolumePlan } from "./volume.ts";
import {
  FOLIO_SLOT,
  fill,
  NO_SLOT,
  PAGES_SLOT,
  place,
  split,
} from "./volume.ts";

const cfg = await loadConfig();
const p = await plan(cfg);
const s = split(cfg, p);
const first = s.volumes[0] as VolumePlan;

describe("차례", () => {
  test("인덱스에서 부와 챕터를 읽는다", () => {
    expect(p.parts.length).toBeGreaterThan(0);
    expect(p.chapters.length).toBeGreaterThan(0);
  });

  test("실리는 챕터에 1부터 빈틈없이 번호가 붙는다", () => {
    expect(p.chapters.map((c) => c.number)).toEqual(
      p.chapters.map((_, i) => i + 1),
    );
  });

  test("챕터 id 는 트랙을 담아 겹치지 않는다 — trie 가 두 트랙에 다 있다", () => {
    const ids = [...p.chapters, ...p.skipped].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("미편입 트랙은 사유를 달고 빠진다 — 조용히 사라지지 않는다", () => {
    for (const s of p.skipped) expect(s.skipReason).toBeDefined();
  });

  test("묶음 이름의 마크다운 이스케이프를 푼다 — 「A\\* 탐색」이 찍히지 않는다", () => {
    expect(unescapeMd("A\\* 탐색")).toBe("A* 탐색");
    const labels = p.parts.flatMap((pt) =>
      pt.volumes.flatMap((v) => v.bundles.map((b) => b.label)),
    );
    expect(labels).toContain("A* 탐색");
    expect(labels.filter((l) => l.includes("\\"))).toEqual([]);
  });

  test("같은 원문이 인덱스에 두 번 나오면 중복으로 잡는다", () => {
    const srcs = [...p.chapters, ...p.skipped].map((c) => c.src);
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});

describe("권 나눔", () => {
  test("실리는 편은 정확히 한 권에 들어간다 — 빠지지도 겹치지도 않는다", () => {
    expect(s.unassigned).toEqual([]);
    const ids = s.volumes.flatMap((v) => v.chapters.map((c) => c.id));
    expect(ids.length).toBe(p.chapters.length);
    expect(new Set(ids)).toEqual(new Set(p.chapters.map((c) => c.id)));
  });

  test("권은 인덱스의 ★ 부를 싣는다", () => {
    for (const v of s.volumes) {
      for (const c of v.chapters) expect(v.vol.stars).toContain(c.stars);
    }
  });

  test("장 번호는 권마다 1부터 빈틈없이 다시 센다", () => {
    for (const v of s.volumes) {
      expect(v.chapters.map((c) => c.number)).toEqual(
        v.chapters.map((_, i) => i + 1),
      );
    }
  });

  test("권 나눔이 전체 차례의 번호를 건드리지 않는다 — 사본에 매긴다", () => {
    expect(p.chapters.map((c) => c.number)).toEqual(
      p.chapters.map((_, i) => i + 1),
    );
  });

  test("한 부가 두 권에 걸리면 설정에서 멈춘다", () => {
    const vol = { id: "a", label: "가", stars: [3], blurb: "" };
    expect(() => checkVolumes([vol, { ...vol, id: "b" }])).toThrow("두 권");
    expect(() => checkVolumes([vol, { ...vol }])).toThrow("겹친다");
  });

  test("다른 권으로 가는 링크는 풀리고 실린 자리가 적힌다", () => {
    const [a, b] = s.volumes;
    const here = a?.chapters[0];
    const there = b?.chapters[0];
    if (a === undefined || here === undefined || there === undefined) {
      throw new Error("권이 둘 이상 있어야 하는 시험이다");
    }
    const frag =
      `<p class="bk-chapter-no">제 ${NO_SLOT} 장</p>` +
      `<a href="#${there.id}--concept">저쪽</a>` +
      `<a href="#${here.id}--concept">이쪽</a>`;
    const r = place(frag, here, s, a.vol);
    expect(r.html).toContain("제 1 장");
    expect(r.html).toContain(
      `<span class="bk-xref-other" data-where="${b?.vol.label} 제 1 장">저쪽</span>`,
    );
    expect(r.html).toContain(`<a href="#${here.id}--concept">이쪽</a>`);
    expect(r.crossRefs.map((x) => x.target)).toEqual([there.id]);
  });

  test("장마다 이름 붙은 쪽을 달아 머리말에 EP. N 을 싣는다", () => {
    const ch = first.chapters[1] as Chapter;
    const frag = `<section class="bk-chapter" id="${ch.id}"><p>${NO_SLOT}</p><div>${NO_SLOT}</div></section>`;
    const r = place(frag, ch, s, first.vol);
    expect(r.html).toContain(`style="page: bk-ep-2"`);
    expect(r.html).toContain(
      `@page bk-ep-2 { @top-right { content: "EP. 2"; } }`,
    );
    expect(r.html).not.toContain(NO_SLOT); // 번호 자리는 여러 곳이다 — 전부 채운다
  });

  test("간지의 쪽수 · 쪽번호는 잴 때 자리값, 찍을 때 진짜 값이 들어간다", () => {
    const html = `<span>${PAGES_SLOT}쪽</span><span>${FOLIO_SLOT}</span>`;
    expect(fill(html)).toBe("<span>00쪽</span><span>000</span>");
    expect(fill(html, { pages: 21, folio: 517 })).toBe(
      "<span>21쪽</span><span>517</span>",
    );
  });

  test("번호 자리가 없는 낡은 조각은 앉히지 않는다", () => {
    const ch = first.chapters[0] as Chapter;
    expect(() => place("<p>제 3 장</p>", ch, s, first.vol)).toThrow("낡은");
  });
});

describe("문서 개요", () => {
  test("제목 수준을 다시 매기고, null 은 개요에서 뺀다", () => {
    const html = relevel('<h1>가</h1><h2 id="x">나</h2><h3>다</h3>', {
      1: null,
      2: 4,
    });
    expect(html).toBe(
      '<h1 role="presentation">가</h1><h2 aria-level="4" id="x">나</h2><h3>다</h3>',
    );
  });

  test("묶음 표기는 묶음의 첫 장에만, 장 표기는 번호를 달고 장마다 선다", () => {
    const bundle = first.parts
      .flatMap((pt) => pt.volumes.flatMap((v) => v.bundles))
      .find((b) => b.chapters.filter((c) => c.ready).length >= 2);
    const [a, b] = bundle?.chapters.filter((c) => c.ready) ?? [];
    if (bundle === undefined || a === undefined || b === undefined) {
      throw new Error("장이 둘 이상인 묶음이 있어야 하는 시험이다");
    }
    const body = (c: Chapter) =>
      `<section class="bk-chapter" id="${c.id}"><h1>제목</h1><h2>파트</h2><h3>절</h3><h4>단계</h4></section>`;
    const out = outlineChapters(
      first.parts,
      new Map([a, b].map((c) => [c.id, body(c)] as const)),
      (c) => c.name,
    );
    const ha = out.get(a.id) ?? "";
    const hb = out.get(b.id) ?? "";
    expect(ha).toContain(`aria-level="1">${bundle.label}</div>`);
    expect(hb).not.toContain(`>${bundle.label}</div>`);
    expect(ha).toContain(`aria-level="2">${a.number}. ${a.name}</div>`);
    expect(hb).toContain(`aria-level="2">${b.number}. ${b.name}</div>`);
    expect(ha).toContain('<h1 role="presentation">');
    expect(ha).toContain('<h2 aria-level="3">');
    expect(ha).toContain('<h3 aria-level="4">');
    expect(ha).toContain('<h4 role="presentation">');
  });

  test("쪽수는 쪽 트리에서만 센다 — 개요의 /Count 가 더 커도 속지 않는다", () => {
    const pdf = new TextEncoder().encode(
      "<</Type /Pages\n/Count 6\n/Kids [2 0 R]>>\n<</Type /Outlines\n/First 9 0 R\n/Count 8>>",
    );
    expect(pdfPageCount(pdf)).toBe(6);
  });
});

describe("앞뒤붙이", () => {
  const include = new Set(p.chapters.map((c) => c.id));
  const titleOf = (c: Chapter) => c.name;

  test("목차는 실린 편만 싣는다", () => {
    const two = new Set(p.chapters.slice(0, 2).map((c) => c.id));
    const html = toc(p.parts, two, titleOf, new Map());
    expect([...html.matchAll(/<li>/g)].length).toBe(2);
  });

  test("쪽번호를 모를 때 자리를 000 으로 잡는다 — 줄 수를 미리 확정한다", () => {
    expect(toc(p.parts, include, titleOf, new Map())).toContain(">000<");
  });

  test("목차 항목이 챕터 앵커를 가리킨다", () => {
    const first = p.chapters[0] as Chapter;
    expect(toc(p.parts, include, titleOf, new Map())).toContain(
      `href="#${first.id}"`,
    );
  });

  test("표지는 권 번호 · 권 이름 · 시리즈 표기를 싣는다", () => {
    const stats = {
      perTrack: [{ label: "알고리즘", taken: 1, skipped: 0, note: "" }],
      totalPages: 10,
      builtAt: new Date("2026-09-15T00:00:00Z"),
    };
    const html = cover(cfg, first, stats);
    expect(html).toContain(`<div class="bk-cover-no">1</div>`);
    expect(html).toContain(first.vol.label);
    expect(html).toContain(`VOL. 1 / ${cfg.volumes.length} — 2026`);
    expect(html).toContain(cfg.design.seriesLabel);
  });

  test("목차 머리는 인덱스 부 이름에서 등급만 딴다", () => {
    expect(gradeOf("★★★ 상 — 필수 (코딩 테스트 단골 + 실무 일상)")).toBe(
      "상 — 필수",
    );
    const html = toc(first.parts, include, titleOf, new Map(), {
      blurb: first.vol.blurb,
      unit: "ALGORITHMS",
    });
    expect(html).toContain(`상 — 필수 — ${first.vol.blurb}`);
    expect(html).toContain('<span class="bk-toc-no">01</span>');
  });

  test("뒤표지는 ISBN 이 비면 그 자리를 빼고, 가짜 바코드를 찍지 않는다", () => {
    const sizes = new Map(
      s.volumes.map((v) => [v.vol.id, { chapters: v.chapters.length }]),
    );
    const facts = { code: "TypeScript", structure: "장마다 파트 2개" };
    const blank = backCover(cfg, s, first, sizes, facts);
    expect(blank).not.toContain("ISBN");
    expect(blank).toContain(`VOL.${s.volumes.length}`);
    const withIsbn = backCover(
      { ...cfg, design: { ...cfg.design, isbn: "979-11-0000-000-0" } },
      s,
      first,
      sizes,
      facts,
    );
    expect(withIsbn).toContain("979-11-0000-000-0");
  });

  test("지은이는 마무리의 서지 표에 싣고, 비면 줄 자체를 뺀다", () => {
    const one = [p.chapters[0] as Chapter];
    const stats = { perTrack: [], totalPages: 1, builtAt: new Date() };
    const at = (author: string) =>
      colophon({ ...cfg, author }, s, first, one, () => undefined, stats);
    expect(at("")).not.toContain("지은이");
    expect(at("아무개")).toContain("<td>아무개</td>");
  });

  test("마무리는 실린 편의 원문 판을 싣는다", () => {
    const first = p.chapters[0] as Chapter;
    const html = colophon(
      cfg,
      s,
      s.volumes[0] as VolumePlan,
      [first],
      () => ({
        src: first.src,
        title: "제목",
        srcHash: "0123456789abcdef",
        builder: 1,
        pages: 12,
        problems: [],
        deadRefs: [],
        builtAt: new Date().toISOString(),
      }),
      { perTrack: [], totalPages: 1, builtAt: new Date() },
    );
    expect(html).toContain("0123456789");
    expect(html).toContain("판 대조표");
  });
});

describe("조각", () => {
  // 실제 가이드 한 편을 조판한다 — 재작성 규칙은 산출 문자열에서만 확인된다.
  const first = p.chapters[0] as Chapter;
  const byDir = new Map(
    [...p.chapters, ...p.skipped].map(
      (c) => [c.src.slice(0, c.src.lastIndexOf("/")), c] as const,
    ),
  );

  test("절 앵커에 챕터 접두가 붙는다 — 111벌이 겹치는 자리다", async () => {
    const { FragmentStore } = await import("./fragment.ts");
    const store = await FragmentStore.open(`${cfg.outDir}-test`);
    const r = await store.ensure(first, { byDir, force: true });
    const html = await Bun.file(r.path).text();
    expect(html).toContain(`id="${first.id}--`);
    expect(html).not.toMatch(/\bid="concept"/);
    expect(html).toContain(`<section class="bk-chapter" id="${first.id}"`);
  }, 30_000);

  test("장 제목은 간지로 옮기고, 간지에 파트 요약 둘을 싣는다", async () => {
    const { FragmentStore } = await import("./fragment.ts");
    const store = await FragmentStore.open(`${cfg.outDir}-test`);
    const r = await store.ensure(first, { byDir, force: true });
    const html = await Bun.file(r.path).text();
    const opener =
      /<section class="bk-opener">[\s\S]*?<\/section>/.exec(html)?.[0] ?? "";
    expect(opener).toContain("<h1");
    expect([...html.matchAll(/<h1\b/g)].length).toBe(1);
    expect([...opener.matchAll(/class="bk-opener-part"/g)].length).toBe(2);
    expect(opener).toContain(PAGES_SLOT);
    expect(opener).toContain(FOLIO_SLOT);
    expect(html).toContain('<figure class="bk-code">');
    // 도식(text)은 머리 줄 없이 그대로 선다 — 그림에 언어 표기를 붙이지 않는다
    for (const f of html.matchAll(
      /<figure class="bk-code">[\s\S]*?<\/figure>/g,
    )) {
      expect(f[0]).not.toContain('data-language="text"');
    }
  }, 30_000);

  test("짚고 가기은 제목부터 다음 제목 전까지 한 상자로 묶인다", async () => {
    const { FragmentStore } = await import("./fragment.ts");
    const store = await FragmentStore.open(`${cfg.outDir}-test`);
    const ch = p.chapters.find((c) => c.name === "knapsack01") ?? first;
    const r = await store.ensure(ch, { byDir, force: true });
    const html = await Bun.file(r.path).text();
    const boxes = [
      ...html.matchAll(/<div class="bk-stop">([\s\S]*?)<\/div>\n/g),
    ];
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) {
      expect(b[1]).toMatch(/^\s*<h4[^>]*>짚고 가기/);
      expect(b[1]).not.toMatch(/<h[1-4]\b[\s\S]*<h[1-4]\b/);
    }
  }, 30_000);

  test("책에 없는 가이드로 가던 링크는 풀려서 본문으로 남는다", async () => {
    const { FragmentStore } = await import("./fragment.ts");
    const store = await FragmentStore.open(`${cfg.outDir}-test`);
    // 자료구조를 가리키는 편을 고른다 — 지금은 미편입이라 전부 죽은 참조다.
    const withRef =
      p.chapters.find((c) => c.name === "bfsShortestPath") ?? first;
    const r = await store.ensure(withRef, { byDir, force: true });
    const html = await Bun.file(r.path).text();
    expect(html).not.toContain("-guide.mdx");
    expect(html).not.toMatch(/href="(?!#|https?:)/);
    if (r.entry.deadRefs.length > 0) expect(html).toContain("bk-xref-dead");
  }, 30_000);
});
