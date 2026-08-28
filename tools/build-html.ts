/**
 * `<name>-guide.md` → 자립형 HTML 한 장.
 *
 * **MDX 를 거치지 않는다.** MDX 는 산문 안의 홑화살괄호에서 깨진다 — `i<n`·`l<=r`·`Array<T>`
 * 가 전부 컴파일 실패이고, 알고리즘 산문에 `curL < l` 류가 반드시 나온다. 상시 지뢰다.
 *
 * **마커는 커스텀 노드 타입으로 재타이핑한다.** `type:"html"` 을 유지한 채 `data.hName` 만
 * 달면 속성이 아니라 **노드가 통째로 사라진다**(실측) — `mdast-util-to-hast` 의 html 핸들러가
 * `allowDangerousHtml:false` 에서 `undefined` 를 반환하고, 그러면 `applyData` 가 호출되지 않아
 * `hName`·`hProperties`·`hChildren` 이 전부 무시된다. hast element 를 직접 꽂는 것도 안 된다
 * — unknown 핸들러가 `properties` 를 빈 객체로 초기화해 `data-viz` 가 사라진다.
 *
 * ```bash
 * bun run tools/build-html.ts <name>-guide.md [--out <경로>]
 * ```
 *
 * 종료코드: 0 정상 · 1 마커 규약 위반 · 2 대상 없음
 */

import { basename, dirname, join, resolve } from "node:path";
import rehypeShiki from "@shikijs/rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { parseSections } from "./section.ts";

const REPO = resolve(import.meta.dir, "..");

/* ────────────────────────── 항목 레일 ────────────────────────── */

/**
 * 우측 항목 레일 — `SPEC.md` `L37`(2026-08-28 유저 지시).
 *
 * **앵커를 헤딩 문구가 아니라 절 id 에서 딴다.** `fixed:false` 인 절(`deep.build`·`invariant`)
 * 은 부제를 내용에 맞춰 짓게 돼 있어서, 문구로 앵커를 만들면 부제를 고칠 때마다 링크가 죽는다.
 * 절 id 는 `SPEC.md` §2 가 정한 것이라 부제와 무관하게 안정적이다.
 *
 * `####` 하위 절은 담지 않는다 — 전개 단계만 다섯을 넘어 레일이 본문만큼 길어진다.
 */
export interface RailEntry {
  /** 앵커 id. 절 id 의 `.` 을 `-` 로 바꾼 것. 반복 절은 뒤에 `-2`·`-3`. */
  anchor: string;
  /** 레일에 적는 문구. 헤딩의 `—` 앞부분. */
  label: string;
  level: number;
}

/**
 * 헤딩 순서대로 앵커를 만든다. **레일에 담지 않는 절도 앵커는 준다** — 순서가 어긋나면 안 된다.
 *
 * **어느 항목으로도 안 잡히는 헤딩에도 앵커를 준다.** 그것은 골격 위반이지만 판정은
 * `check-v2.ts` 의 일이고(SEC), 빌더가 거기서 멈추면 **링크가 한 칸씩 밀려 다른 절을
 * 가리킨다** — 깨진 링크보다 나쁘다(눌러 보기 전까지 모른다). 모르는 헤딩은 `sec-{n}` 을
 * 주고 레일에는 헤딩 문구를 그대로 적는다.
 */
export function railFrom(md: string): { anchors: string[]; rail: RailEntry[] } {
  const { sections, unresolved } = parseSections(md);
  const all = [
    ...sections.map((sec) => ({
      line: sec.line,
      level: sec.level,
      heading: sec.heading,
      id: sec.id as string | null,
    })),
    ...unresolved.map((u) => ({
      line: u.line,
      level: /^(#+) /.exec(u.heading)?.[1]?.length ?? 1,
      heading: u.heading,
      id: null as string | null,
    })),
  ].sort((a, b) => a.line - b.line);

  const used = new Map<string, number>();
  const anchors: string[] = [];
  const rail: RailEntry[] = [];

  for (const [index, sec] of all.entries()) {
    const base =
      sec.id === null ? `sec-${index + 1}` : sec.id.replaceAll(".", "-");
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    const anchor = n === 1 ? base : `${base}-${n}`;
    anchors.push(anchor);

    // 레일에는 파트(`##`)와 항목(`###`)만 담는다. 제목(`#`)과 하위 절(`####`)은 뺀다.
    if (sec.level !== 2 && sec.level !== 3) continue;
    const text = sec.heading.replace(/^#+\s*/, "");
    const label = (text.split(" — ")[0] ?? text).trim();
    rail.push({ anchor, label, level: sec.level });
  }

  return { anchors, rail };
}

const esc = (s: string): string =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function railHtml(rail: RailEntry[]): string {
  if (rail.length === 0) return "";
  const items = rail
    .map(
      (e) =>
        `<li class="gs-rail-l${e.level}"><a href="#${e.anchor}">${esc(e.label)}</a></li>`,
    )
    .join("\n");
  return `<nav class="gs-rail" aria-label="항목"><ol>\n${items}\n</ol></nav>`;
}

/**
 * 현재 위치 강조 — **이것만** JS 가 맡는다.
 *
 * 목록과 링크는 정적 산출에 있으므로 JS 를 꺼도 이동은 된다(`L37`). 여기서 하는 일은 지금
 * 읽는 절에 표시를 다는 것 하나뿐이고, 그것이 없어도 문서는 온전하다.
 */
const RAIL_JS = `(function () {
  var rail = document.querySelector(".gs-rail");
  if (!rail) return;
  var links = Array.prototype.slice.call(rail.querySelectorAll("a[href^='#']"));
  var targets = links.map(function (a) {
    return document.getElementById(a.getAttribute("href").slice(1));
  });
  var active = -1;
  function update() {
    var idx = 0;
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      if (el && el.getBoundingClientRect().top <= 120) idx = i;
    }
    if (idx === active) return;
    if (active >= 0 && links[active]) links[active].classList.remove("is-here");
    if (links[idx]) links[idx].classList.add("is-here");
    active = idx;
    var a = links[idx];
    if (!a) return;
    if (a.offsetTop < rail.scrollTop || a.offsetTop > rail.scrollTop + rail.clientHeight - 24) {
      rail.scrollTop = a.offsetTop - rail.clientHeight / 2;
    }
  }
  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; update(); });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
})();`;

/* ────────────────────────── 마커 플러그인 ────────────────────────── */

const VIZ_OPEN = /^<!--viz:([A-Za-z_$][\w$]*)-->$/;
const CHECK_OPEN = /^<!--check:([A-Za-z_$][\w$]*)-->$/;
const CHECK_CLOSE = /^<!--\/check-->$/;

interface MdNode {
  type: string;
  value?: string;
  lang?: string | null;
  children?: MdNode[];
  data?: Record<string, unknown>;
}

/** `remarkRehype` 뒤의 트리. 헤딩에 앵커 id 를 다는 데만 쓴다. */
interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/**
 * `<!--viz:{id}-->` + **바로 다음 펜스 하나**를 한 노드로 접는다.
 *
 * `hChildren` 에 원래 ascii 를 `<pre>` 로 남긴다. 치환만 하면 JS 를 끈 화면에서 **그림이
 * 0개**가 되고, 그건 L10(그림 의무)과 정면으로 어긋난다. JS 가 붙으면 sim 이 이 자리를 덮는다.
 */
function collapseMarkers(tree: MdNode, problems: string[]): string[] {
  const ids: string[] = [];

  const walk = (parent: MdNode): void => {
    const children = parent.children;
    if (!children) return;

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node === undefined) continue;

      if (node.type !== "html") {
        walk(node);
        continue;
      }
      const raw = (node.value ?? "").trim();

      const viz = VIZ_OPEN.exec(raw);
      if (viz) {
        const id = viz[1] as string;
        const next = children[i + 1];
        if (next?.type !== "code") {
          problems.push(`\`${id}\`: 마커 바로 다음이 펜스가 아니다`);
          continue;
        }
        const ascii = next.value ?? "";
        if (ascii.trim() === "") {
          problems.push(`\`${id}\`: 마커 아래 ascii 펜스가 비어 있다`);
        }
        ids.push(id);
        // `unist-util-visit` 은 노드 단위라 두 노드를 하나로 접을 수 없다.
        // 부모의 children 을 직접 splice 하고 인덱스를 되돌린다.
        children.splice(i, 2, {
          type: "vizPanel",
          data: {
            hName: "div",
            hProperties: { className: ["gs-mount"], "data-viz": id },
            hChildren: [
              {
                type: "element",
                tagName: "pre",
                properties: { className: ["gs-ascii"] },
                children: [{ type: "text", value: ascii }],
              },
            ],
          },
        });
        continue;
      }

      const open = CHECK_OPEN.exec(raw);
      if (open) {
        const id = open[1] as string;
        let close = -1;
        for (let j = i + 1; j < children.length; j++) {
          const c = children[j];
          if (c?.type === "html" && CHECK_CLOSE.test((c.value ?? "").trim())) {
            close = j;
            break;
          }
        }
        if (close < 0) {
          problems.push(`\`${id}\`: 닫는 \`<!--/check-->\` 가 없다`);
          continue;
        }
        const inner = children.slice(i + 1, close);
        // `<summary>` 를 안 넣으면 브라우저 기본 라벨("자세히")이 뜬다.
        const summary: MdNode = {
          type: "checkSummary",
          data: { hName: "summary" },
          children: [{ type: "text", value: "답 보기" }],
        };
        children.splice(i, close - i + 1, {
          type: "checkBlock",
          data: {
            hName: "details",
            hProperties: { className: ["gs-check"], "data-check": id },
          },
          children: [summary, ...inner],
        });
        continue;
      }

      if (CHECK_CLOSE.test(raw)) {
        problems.push("짝 없는 `<!--/check-->`");
      }
    }
  };

  walk(tree);
  return ids;
}

/* ────────────────────────── KaTeX ────────────────────────── */

/**
 * KaTeX CSS 를 **woff2 만 남기고** base64 로 인라인한다.
 *
 * 전체를 그대로 인라인하면 `url()` 60개가 전부 data URI 가 되어 실측 1.39MB/편이다.
 * woff2 20개는 259,792 B → base64 346,412 B(≈346KB). 그리고 CSS 만 인라인하고 폰트를
 * 안 넣으면 상대 경로 60개가 404 나고 **수식이 대체 글꼴로 조용히 뜬다.**
 */
async function katexCss(): Promise<string> {
  const dir = join(REPO, "node_modules/katex/dist");
  const css = await Bun.file(join(dir, "katex.min.css")).text();
  const cache = new Map<string, string>();

  const out: string[] = [];
  let last = 0;
  for (const m of css.matchAll(/src:([^;}]+)/g)) {
    const woff2 = /url\(([^)]*\.woff2)\)/.exec(m[1] ?? "");
    if (!woff2 || woff2[1] === undefined) continue;
    const rel = woff2[1].replace(/^["']|["']$/g, "");
    let data = cache.get(rel);
    if (data === undefined) {
      const bytes = await Bun.file(join(dir, rel)).arrayBuffer();
      data = Buffer.from(bytes).toString("base64");
      cache.set(rel, data);
    }
    const at = m.index ?? 0;
    out.push(css.slice(last, at));
    out.push(`src:url(data:font/woff2;base64,${data}) format("woff2")`);
    last = at + m[0].length;
  }
  out.push(css.slice(last));
  return out.join("");
}

/* ────────────────────────── 페이지 ────────────────────────── */

const PAGE_CSS = `
:root {
  --gs-page: #ffffff; --gs-ink: #202124; --gs-muted: #5f6368;
  --gs-rule: #dadce0; --gs-soft: #f1f3f4;
  --guide-sim-node: #4285f4; --guide-sim-active: #ea4335;
  --guide-sim-frontier: #fbbc04; --guide-sim-visited: #9aa0a6;
  --guide-sim-text: #202124; --guide-sim-bg: #ffffff; --guide-sim-line: #dadce0;
}
@media (prefers-color-scheme: dark) {
  :root {
    --gs-page: #14161a; --gs-ink: #e8eaed; --gs-muted: #9aa0a6;
    --gs-rule: #3c4043; --gs-soft: #1f2226;
    --guide-sim-text: #e8eaed; --guide-sim-bg: #14161a; --guide-sim-line: #3c4043;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--gs-page); color: var(--gs-ink);
  font: 16px/1.85 -apple-system, "Pretendard", "Apple SD Gothic Neo", sans-serif;
}
main { max-width: 46rem; margin: 0 auto; padding: 3rem 1.25rem 6rem; }
h1, h2, h3 { scroll-margin-top: 1.5rem; }

/* 항목 레일 — L37. 좁은 화면에서는 숨긴다(본문 위로 겹치지 않는다).
 *
 * **기준점은 손으로 고른 수가 아니라 겹치지 않는 최소 폭이다.**
 *   본문 오른쪽 끝 = W/2 + 23rem      (max-width 46rem 가운데 정렬)
 *   레일 왼쪽 끝   = W − 1rem − 13rem  (오른쪽 가장자리에서 1rem 띄운 자리)
 *   둘 사이가 가장자리 여백(1rem) 이상이려면  W ≥ 4×1 + 2×13 + 46 = 76rem
 *
 * 앞판은 78rem 이었다 — 간격 2rem 을 요구한 값이다. 그래서 1440x900 화면에서 창을
 * 최대로 켜도 innerWidth 가 1232px 이라 레일이 한 번도 안 떴고, 유저가 그 상태를
 * 지적했다(2026-08-28 실측: 기준점 1248px, 창 1232px, display:none).
 * 기준점을 폭에서 유도하는 것은 build-html.test.ts 가 강제한다.
 *
 * 이 주석은 CSS 안이라 백틱을 쓰지 않는다 — 템플릿 리터럴이 그 자리에서 끊긴다. */
.gs-rail { display: none; }
@media (min-width: 76rem) {
  .gs-rail {
    display: block; position: fixed; top: 3rem;
    right: max(1rem, calc(50vw - 38rem));
    width: 13rem; max-height: calc(100vh - 6rem); overflow-y: auto;
    padding-left: .9rem; border-left: 1px solid var(--gs-rule);
    font-size: .82rem; line-height: 1.5;
  }
}
.gs-rail ol { list-style: none; margin: 0; padding: 0; }
.gs-rail li { margin: .15rem 0; }
.gs-rail a {
  display: block; padding: .2rem .35rem; border-radius: 4px;
  color: var(--gs-muted); text-decoration: none; overflow-wrap: anywhere;
}
.gs-rail a:hover { color: var(--gs-ink); background: var(--gs-soft); }
.gs-rail-l2 { margin-top: .75rem; }
.gs-rail-l2 > a { color: var(--gs-ink); font-weight: 600; }
.gs-rail-l3 > a { padding-left: .8rem; }
.gs-rail a.is-here { color: var(--gs-ink); background: var(--gs-soft); font-weight: 600; }
h1 { font-size: 1.9rem; line-height: 1.35; margin: 0 0 2rem; }
h2 { font-size: 1.35rem; margin: 3rem 0 1rem; padding-top: 1.25rem; border-top: 1px solid var(--gs-rule); }
h3 { font-size: 1.1rem; margin: 2rem 0 .75rem; }
p, li { overflow-wrap: anywhere; }
code { font-family: "SFMono-Regular", Menlo, monospace; font-size: .9em; }
:not(pre) > code { background: var(--gs-soft); padding: .1em .35em; border-radius: 3px; }
pre { overflow-x: auto; padding: 1rem; border-radius: 6px; background: var(--gs-soft); }
pre.gs-ascii { border: 1px dashed var(--gs-rule); background: transparent; }
.gs-mount { margin: 1.5rem 0; }
table { border-collapse: collapse; width: 100%; display: block; overflow-x: auto; }
th, td { border: 1px solid var(--gs-rule); padding: .5rem .75rem; text-align: left; }
blockquote { margin: 1.5rem 0; padding-left: 1rem; border-left: 3px solid var(--gs-rule); color: var(--gs-muted); }
details.gs-check { margin: 1rem 0; padding: .75rem 1rem; border: 1px solid var(--gs-rule); border-radius: 6px; }
details.gs-check > summary { cursor: pointer; color: var(--gs-muted); }
.shiki, .shiki span { background: var(--gs-soft) !important; }
@media (prefers-color-scheme: dark) {
  .shiki, .shiki span { color: var(--shiki-dark) !important; background: var(--gs-soft) !important; }
}
`;

/** 번들 안의 `</script` 가 태그를 조기에 닫는다. **산문 쪽은 건드리지 않는다** — */
/** `rehype-stringify` 가 이미 엔티티로 바꾸므로 손대면 독자에게 그 문자열이 보인다. */
function escapeForInline(js: string): string {
  return js.replaceAll("</script", "<\\/script");
}

export interface BuildResult {
  html: string;
  vizIds: string[];
  mounted: boolean;
  problems: string[];
  /** 레일에 실린 항목. 파트(`##`)와 항목(`###`)만이다. */
  rail: RailEntry[];
}

export async function build(
  mdPath: string,
  opts: { simPath?: string } = {},
): Promise<BuildResult> {
  const md = await Bun.file(mdPath).text();
  const problems: string[] = [];
  let vizIds: string[] = [];

  const markerPlugin = () => (tree: MdNode) => {
    vizIds = collapseMarkers(tree, problems);
  };

  // 레일은 **md 원문**에서 계산한다. 마커를 접은 뒤의 트리에는 절 id 정보가 없다.
  const { anchors, rail } = railFrom(md);

  /**
   * hast 의 `h1`~`h6` 에 순서대로 앵커 id 를 단다.
   *
   * `parseSections` 와 hast 의 헤딩 순서가 어긋나면 링크가 **다른 절을 가리킨다** — 그건
   * 깨진 링크보다 나쁘다(눌러 보기 전까지 모른다). 개수가 다르면 위반으로 남긴다.
   */
  const headingIdPlugin = () => (tree: HastNode) => {
    let i = 0;
    const walk = (node: HastNode): void => {
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName ?? "")) {
        const id = anchors[i++];
        if (id !== undefined) {
          node.properties = { ...(node.properties ?? {}), id };
        }
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
    if (i !== anchors.length) {
      problems.push(
        `헤딩 수가 어긋난다 — 절 식별 ${anchors.length}개 vs 문서 ${i}개. 레일 링크가 다른 절을 가리킬 수 있다`,
      );
    }
  };

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(markerPlugin)
    .use(remarkRehype)
    .use(headingIdPlugin)
    .use(rehypeKatex)
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
    })
    .use(rehypeStringify)
    .process(md);

  const prose = String(file);
  const title = /^#\s+(.+)$/m.exec(md)?.[1]?.trim() ?? basename(mdPath);

  let script = "";
  if (opts.simPath && (await Bun.file(opts.simPath).exists())) {
    const entry = join(
      dirname(opts.simPath),
      `.build-entry-${basename(mdPath)}.tsx`,
    );
    await Bun.write(
      entry,
      `import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { AlgorithmSimulation } from "#guide-sim";
import { mountAll } from ${JSON.stringify(join(import.meta.dir, "mount.ts"))};
import * as sims from ${JSON.stringify(resolve(opts.simPath))};

mountAll(document, sims as never, {
  createRoot,
  createElement,
  Component: AlgorithmSimulation,
});
`,
    );
    const built = await Bun.build({
      entrypoints: [entry],
      target: "browser",
      minify: true,
      define: { "process.env.NODE_ENV": '"production"' },
    });
    await Bun.file(entry).delete();
    if (!built.success) {
      problems.push(`번들 실패 — ${built.logs.map(String).join("; ")}`);
    } else {
      script = await (built.outputs[0] as { text(): Promise<string> }).text();
    }
  }

  const css = await katexCss();
  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${css}</style>
<style>${PAGE_CSS}</style>
</head>
<body>
${railHtml(rail)}
<main>
${prose}
</main>
<script>${escapeForInline(RAIL_JS)}</script>
${script === "" ? "" : `<script type="module">${escapeForInline(script)}</script>`}
</body>
</html>
`;

  return { html, vizIds, mounted: script !== "", problems, rail };
}

/* ────────────────────────── CLI ────────────────────────── */

if (import.meta.main) {
  const args = Bun.argv.slice(2);
  const outIdx = args.indexOf("--out");
  // `--out` 이 없으면 `outIdx` 가 -1 이고 `args[outIdx + 1]` 은 **대상 자신**이 된다.
  // 그 자리를 안 가르면 인자를 하나도 못 찾는다.
  const outValue = outIdx >= 0 ? args[outIdx + 1] : undefined;
  const target = args.find((a) => !a.startsWith("--") && a !== outValue);
  if (target === undefined) {
    console.error(
      "용법: bun run tools/build-html.ts <name>-guide.md [--out <경로>]",
    );
    process.exit(2);
  }
  if (!(await Bun.file(target).exists())) {
    console.error(`대상이 없다: ${target}`);
    process.exit(2);
  }

  const stem = basename(target).replace(/\.md$/, "");
  const simPath = join(dirname(target), `${stem}.sim.ts`);
  const out = outValue ?? join(dirname(target), `${stem}.html`);

  const result = await build(target, { simPath });
  await Bun.write(out, result.html);

  const kb = Math.round(result.html.length / 1024);
  console.log(
    `${out} — ${kb}KB · viz ${result.vizIds.length}개 · 레일 ${result.rail.length}항목 · 번들 ${result.mounted ? "포함" : "없음"}`,
  );
  if (result.problems.length > 0) {
    console.error("\n마커 규약 위반:");
    for (const p of result.problems) console.error(`  ${p}`);
    process.exit(1);
  }
}
