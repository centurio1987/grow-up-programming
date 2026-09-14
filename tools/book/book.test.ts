/**
 * 책 빌더 회귀 시험 — **인쇄 없이 판정되는 것만** 여기서 본다.
 *
 * 크롬을 띄우는 단계(쪽수 계측 · 합본 인쇄)는 CI 에서 빼 놓았다. 대신 그 단계가 기대는
 * 전제 — 「챕터 쪽수는 낱장이든 합본이든 같다」 — 는 빌더가 실행할 때마다 스스로 확인하고
 * 어긋나면 실패한다(`build-book.ts` 의 예측·실측 대조).
 */

import { describe, expect, test } from "bun:test";
import type { Chapter } from "./chapters.ts";
import { plan } from "./chapters.ts";
import { loadConfig } from "./config.ts";
import { colophon, cover, toc } from "./matter.ts";

const cfg = await loadConfig();
const p = await plan(cfg);

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

  test("같은 원문이 인덱스에 두 번 나오면 중복으로 잡는다", () => {
    const srcs = [...p.chapters, ...p.skipped].map((c) => c.src);
    expect(new Set(srcs).size).toBe(srcs.length);
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

  test("표지는 빈 항목의 줄 자체를 뺀다", () => {
    const stats = {
      perTrack: [{ label: "알고리즘", taken: 1, skipped: 0, note: "" }],
      totalPages: 10,
      builtAt: new Date(),
    };
    const html = cover({ ...cfg, author: "" }, stats);
    expect(html).not.toContain("지은이");
    expect(cover({ ...cfg, author: "아무개" }, stats)).toContain("지은이");
  });

  test("마무리는 실린 편의 원문 판을 싣는다", () => {
    const first = p.chapters[0] as Chapter;
    const html = colophon(
      cfg,
      p,
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
