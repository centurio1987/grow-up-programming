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
 * 종료코드: 0 정상 · 1 빌드 규약 위반(마커 · 표 칸) · 2 대상 없음
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
import { kindOfOr } from "./guide-v2-targets.ts";
import { type GuideKind, parseSections } from "./section.ts";

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
export function railFrom(
  md: string,
  kind: GuideKind = "algo",
): { anchors: string[]; rail: RailEntry[] } {
  const { sections, unresolved } = parseSections(md, kind);
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

/**
 * 마커 id 의 문법. **JS 식별자가 아니라 `check-proof.ts` 와 같은 문법을 쓴다.**
 *
 * 앞판은 `[A-Za-z_$][\w$]*` 였다 — 하이픈을 안 받는다. 그런데 id 가 가는 자리는
 * `data-viz` · `data-check` **속성값**과 `sims[id]` 라는 **문자열 키**뿐이라
 * (`mount.ts:47-49`) 하이픈이 합법이고, 실제로 `check-proof.ts:84` 는 처음부터
 * `[A-Za-z0-9_-]+` 를 받아 하이픈 id 가 303 개 중 다수다.
 *
 * 문법이 도구마다 갈린 대가가 실측으로 나왔다 — 하이픈 `check` id 를 쓴 **9 편**에서
 * 여는 마커가 안 잡혀 닫는 마커만 남았고, 접기가 통째로 안 일어나 `selfcheck` 의 답이
 * 웹에서 그대로 보였다(2026-08-31 브라우저 실측). `ci.ts` 가 이 도구를 안 불러
 * 아무것도 막지 않았다 — 그래서 `--all` 단계를 함께 넣었다(`FEEDBACK` `L19`).
 */
const MARKER_ID = "[A-Za-z][A-Za-z0-9_-]*";
/**
 * `viz` 와 `proof` 가 **같은 펜스 하나**를 가리키는 편이 있다
 * (`subarraySumEqualsK` · `ternarySearch` — 전개 표가 곧 실행 대조 대상이다).
 * `check-proof` 는 원고에서 그 펜스를 읽어 통과하는데 빌더만 「마커 바로 다음이
 * 펜스가 아니다」로 거부했다. 사이에 낀 것이 **주석 마커**뿐이면 건너뛰고 펜스를
 * 찾는다 — 주석은 어차피 산출에 안 남는다.
 */
const PROOF_MARKER = new RegExp(`^<!--proof:${MARKER_ID}-->$`);
const VIZ_OPEN = new RegExp(`^<!--viz:(${MARKER_ID})-->$`);
const CHECK_OPEN = new RegExp(`^<!--check:(${MARKER_ID})-->$`);
const CHECK_CLOSE = /^<!--\/check-->$/;

interface MdNode {
  type: string;
  value?: string;
  lang?: string | null;
  children?: MdNode[];
  data?: Record<string, unknown>;
}

/**
 * 원고 줄 번호. `MdNode` 에 직접 달지 않는다 — 그러면 mdast 의 `Node` 가 `MdNode` 로
 * 안 좁혀져 `unified().use()` 의 오버로드가 통째로 어긋난다(실측).
 */
interface Positioned {
  position?: { start?: { line?: number } };
}

/** `remarkRehype` 뒤의 트리. 헤딩 앵커와 표 칸 대조에 쓴다. */
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
        let fence = i + 1;
        while (
          children[fence]?.type === "html" &&
          PROOF_MARKER.test((children[fence]?.value ?? "").trim())
        ) {
          fence++;
        }
        const next = children[fence];
        if (next?.type !== "code") {
          problems.push(`\`${id}\`: 마커 다음이 펜스가 아니다`);
          continue;
        }
        const ascii = next.value ?? "";
        if (ascii.trim() === "") {
          problems.push(`\`${id}\`: 마커 아래 ascii 펜스가 비어 있다`);
        }
        ids.push(id);
        // `unist-util-visit` 은 노드 단위라 두 노드를 하나로 접을 수 없다.
        // 부모의 children 을 직접 splice 하고 인덱스를 되돌린다.
        children.splice(i, fence - i + 1, {
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

/* ────────────────────────── 표 칸 대조 ────────────────────────── */

/**
 * 원고 표의 한 행. `line` 은 그 행이 선 원고 줄 번호다.
 *
 * `cells` 는 **원고가 그은 칸 수**다 — GFM 이 `|` 를 세로 그은 자리마다 하나씩이라,
 * 칸 안에 쓴 `|` 도 여기서는 칸을 하나 더 만든 것으로 셈된다.
 */
export interface MdTableRow {
  line: number;
  cells: number;
}

/**
 * mdast 에서 표별·행별 **원고 칸 수**를 문서 순서대로 모은다.
 *
 * 표를 만나면 그 아래로는 안 내려간다 — GFM 표 안에 표가 서지 않는다.
 */
export function mdTableRows(tree: MdNode): MdTableRow[][] {
  const out: MdTableRow[][] = [];
  const walk = (node: MdNode): void => {
    if (node.type === "table") {
      out.push(
        (node.children ?? []).map((row) => ({
          line: (row as Positioned).position?.start?.line ?? 0,
          cells: (row.children ?? []).length,
        })),
      );
      return;
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk(tree);
  return out;
}

/** hast 에서 표별·행별 **렌더된 `<td>`·`<th>` 수**를 문서 순서대로 모은다. */
export function hastTableRows(tree: HastNode): number[][] {
  const out: number[][] = [];

  const rowsOf = (node: HastNode, acc: number[]): void => {
    if (node.type === "element" && node.tagName === "tr") {
      acc.push(
        (node.children ?? []).filter(
          (c) =>
            c.type === "element" && (c.tagName === "td" || c.tagName === "th"),
        ).length,
      );
      return;
    }
    for (const child of node.children ?? []) rowsOf(child, acc);
  };

  const walk = (node: HastNode): void => {
    if (node.type === "element" && node.tagName === "table") {
      const acc: number[] = [];
      rowsOf(node, acc);
      out.push(acc);
      return;
    }
    for (const child of node.children ?? []) walk(child);
  };

  walk(tree);
  return out;
}

/**
 * **원고 칸 수와 렌더된 `<td>` 수를 견준다.** 어긋나면 그 행에서 칸이 사라졌거나 늘어난 것이다.
 *
 * 잡는 것은 하나다 — **표 칸 안에 그냥 쓴 `|`**. GFM 은 칸 구분자를 **인라인 코드 안에서도**
 * 먼저 가른다(`\|` 로 써야 내용이 된다). 그래서 `` `gcd(|x − y|, n)` `` 같은 칸은 원고에서
 * 칸 하나인데 파싱은 셋으로 갈라 놓고, `remark-rehype` 가 머리줄 폭에 맞춰 **넘치는 칸을
 * 잘라 버린다**. 잘린 자리는 **원고를 읽는 사람에게만 보이고 HTML 에는 없다.**
 *
 * 2026-09-10 실측 — `ternarySearch`(`|x-2|`) · `pollardRho`(`gcd(|x − y|, n)`) 두 편이
 * 그 상태였고 **스캐너 넷이 전부 초록이었다**. 앞서 `KAN-034.7` 배치6 이
 * `articulationPoints` 기호표에서 같은 것을 손으로 찾아 원고만 고쳤다(강제 지점은 없었다).
 *
 * **렌더러를 고치는 것이 처방이 아니다.** 렌더러가 삼켜 주게 만들면 GFM 명세와 갈라진 방언이
 * 되고, 그 원고는 다른 마크다운 도구에서 다시 깨진다. 고치는 쪽은 원고다 — `\|`.
 *
 * 모자란 칸(`remark-rehype` 가 빈 칸으로 메운다)도 같은 자리에서 잡힌다. 보이는 표와
 * 원고가 다르다는 사실은 같기 때문이다.
 */
export function tableCellProblems(
  md: MdTableRow[][],
  html: number[][],
): string[] {
  const problems: string[] = [];

  if (md.length !== html.length) {
    problems.push(
      `표 개수가 어긋난다 — 원고 ${md.length}개 vs 렌더 ${html.length}개. 표 칸 대조를 못 한다`,
    );
    return problems;
  }

  for (const [t, rows] of md.entries()) {
    const rendered = html[t] ?? [];
    if (rows.length !== rendered.length) {
      problems.push(
        `${rows[0]?.line ?? "?"}줄 표: 행 수가 어긋난다 — 원고 ${rows.length}행 vs 렌더 ${rendered.length}행`,
      );
      continue;
    }
    for (const [r, row] of rows.entries()) {
      const got = rendered[r];
      if (got === row.cells) continue;
      const verb = row.cells > (got ?? 0) ? "사라졌다" : "늘어났다";
      problems.push(
        `${row.line}줄 표 칸: 원고 ${row.cells}칸 vs 렌더 ${got}칸 — 칸이 ${verb}. 칸 안의 \`|\` 는 \`\\|\` 로 쓴다(인라인 코드 안이어도 그렇다)`,
      );
    }
  }

  return problems;
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
  opts: { simPath?: string; kind?: GuideKind } = {},
): Promise<BuildResult> {
  const md = await Bun.file(mdPath).text();
  // 골격은 경로가 정한다. 스모크 표본은 두 트랙 밖이라 `algo` 로 떨어진다 — 그 표본이
  // algo 골격으로 쓰여 있기 때문이고, ds 표본을 들일 때는 `opts.kind` 로 넘긴다.
  const kind = opts.kind ?? kindOfOr(mdPath, "algo");
  const problems: string[] = [];
  let vizIds: string[] = [];

  let mdTables: MdTableRow[][] = [];
  let htmlTables: number[][] = [];

  const markerPlugin = () => (tree: MdNode) => {
    vizIds = collapseMarkers(tree, problems);
    // 마커를 접은 **뒤**에 센다. `check` 블록 안의 표도 그때는 트리에 그대로 있다.
    mdTables = mdTableRows(tree);
  };

  /**
   * 렌더된 쪽의 칸 수. **머리줄 폭을 보고 미루어 짚지 않고 산출을 직접 센다** —
   * 넘치는 칸을 자르는 것은 `remark-rehype` 이고, 그 동작이 바뀌면 미루어 짚은 쪽이
   * 조용히 틀린다. 재는 것은 독자가 실제로 보는 표다.
   */
  const tableHastPlugin = () => (tree: HastNode) => {
    htmlTables = hastTableRows(tree);
  };

  // 레일은 **md 원문**에서 계산한다. 마커를 접은 뒤의 트리에는 절 id 정보가 없다.
  const { anchors, rail } = railFrom(md, kind);

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
    .use(tableHastPlugin)
    .use(rehypeKatex)
    .use(rehypeShiki, {
      themes: { light: "github-light", dark: "github-dark" },
    })
    .use(rehypeStringify)
    .process(md);

  const prose = String(file);
  problems.push(...tableCellProblems(mdTables, htmlTables));
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

  // `--all` 은 v2 가이드 전수를 **메모리에서만** 빌드해 빌드 규약(마커 · 표 칸)을 판정한다.
  // 파일을 안 쓰는 이유는 산출이 편당 700KB 이고 `.gitignore` 대상이라, CI 가 돌 때마다
  // 30MB 를 쓰고 버리게 되기 때문이다. 여기서 필요한 것은 산출이 아니라 종료코드다.
  if (args.includes("--all")) {
    const { v2Guides, ROOT } = await import("./guide-v2-targets.ts");
    const targets = await v2Guides();
    let bad = 0;
    for (const rel of targets) {
      const abs = join(ROOT, rel);
      const stem = basename(abs).replace(/\.md$/, "");
      const r = await build(abs, {
        simPath: join(dirname(abs), `${stem}.sim.ts`),
      });
      if (r.problems.length > 0) {
        bad++;
        console.error(`${rel}`);
        for (const p of r.problems) console.error(`  ${p}`);
      }
    }
    console.log(
      bad === 0
        ? `가이드 ${targets.length}편 전부 빌드 규약(마커 · 표 칸)을 지킨다.`
        : `가이드 ${targets.length}편 중 ${bad}편이 빌드 규약(마커 · 표 칸)을 어긴다.`,
    );
    process.exit(bad === 0 ? 0 : 1);
  }

  const outIdx = args.indexOf("--out");
  // `--out` 이 없으면 `outIdx` 가 -1 이고 `args[outIdx + 1]` 은 **대상 자신**이 된다.
  // 그 자리를 안 가르면 인자를 하나도 못 찾는다.
  const outValue = outIdx >= 0 ? args[outIdx + 1] : undefined;
  const target = args.find((a) => !a.startsWith("--") && a !== outValue);
  if (target === undefined) {
    console.error(
      "용법: bun run tools/build-html.ts <name>-guide.md [--out <경로>]\n      전수 판정: bun run tools/build-html.ts --all (파일을 쓰지 않는다)",
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
    console.error("\n빌드 규약 위반(마커 · 표 칸):");
    for (const p of result.problems) console.error(`  ${p}`);
    process.exit(1);
  }
}
