/**
 * 챕터 조각 — **버전 갈아끼우기가 사는 자리**다.
 *
 * 가이드 한 편이 고쳐지면 그 편의 조각만 다시 만들고 나머지 110편은 캐시에서 꺼낸다.
 * 판정은 원문 해시로 한다 — 수정 시각(mtime)은 `git checkout` 만으로도 바뀌어서, 내용이
 * 같은데 111편을 다시 빌드하게 만든다.
 *
 * 조각이 한 장짜리 산출과 다른 점 셋.
 *
 * 1. **앵커에 챕터 접두를 붙인다.** 절 id 는 편마다 `concept`·`part1` 로 같아서, 그냥
 *    이으면 111벌이 겹치고 목차 링크가 전부 첫 편으로 간다.
 * 2. **상대 링크를 책 안쪽 링크로 바꾼다.** 종이에서 상대 경로는 죽은 `file:///` 링크가
 *    된다 — 게다가 합본 HTML 이 `build/book/` 에 있어서 원문 자리와 다른 곳으로 풀린다.
 *
 *    맞추는 기준을 **디렉터리**로 잡는다. 파일 이름이 아니라 폴더가 한 편을 뜻하기 때문이다.
 *    그래서 `../kadane/kadane-problem.md` 도 `../kadane/kadane-guide.md` 도 같은 챕터를
 *    가리킨다 — 처음에 가이드 파일만 보다가 문제 문서 링크 149건을 죽은 채로 인쇄했다.
 *    책에 실린 편이면 `#챕터id`, 안 실린 편이면 링크를 풀어 「(미수록)」을 붙인다.
 *    **자료구조 40건이 지금 후자**이고, 편입되면 같은 코드가 살아 있는 링크로 바꾼다.
 * 3. **장 번호를 박지 않는다.** 번호는 권이 정해져야 나오는 값이라 자리(`NO_SLOT`)만 남기고
 *    `volume.ts` 의 `place` 가 채운다. 다른 권을 가리키는 링크를 푸는 것도 거기서 한다.
 * 4. **뷰어 번들을 싣지 않는다.** 종이에서 React 는 아무 일도 못 한다. 마운트 지점 안의
 *    `<pre class="gs-ascii">` 폴백이 그대로 인쇄된다(JS 를 끄고 인쇄한 결과가 켠 것과
 *    바이트까지 같음을 실측했다). 편당 205KB 짜리 번들 111벌이 여기서 사라진다.
 * 5. **디자인 템플릿의 틀을 씌운다.** CSS 만으로 못 만드는 구조 셋을 여기서 세운다 —
 *    챕터 간지(장 제목이 본문 흐름에서 빠져 한 쪽을 차지한다), 코드 머리 줄(언어 표기),
 *    멈춤 상자(「멈춤 —」 제목부터 다음 제목 전까지를 한 상자로 묶는다).
 */

import { dirname, relative, resolve } from "node:path";
import { build, railFrom } from "../build-html.ts";
import type { Chapter } from "./chapters.ts";
import { REPO } from "./config.ts";
import { FOLIO_SLOT, NO_SLOT, PAGES_SLOT } from "./volume.ts";

/**
 * 조각 모양이 바뀌면 올린다. **올리는 순간 캐시 전체가 무효가 된다** — 낡은 모양의 조각과
 * 새 모양의 조각이 한 권에 섞이는 것이 조용한 실패다.
 */
export const BUILDER_VERSION = 4;

export interface CacheEntry {
  src: string;
  /** 가이드의 `# ` 한 줄. 목차가 이걸 싣는다. */
  title: string;
  srcHash: string;
  builder: number;
  /**
   * 장 머리의 분류 줄. 원문이 아니라 **인덱스**(묶음 이름 · 주석)에서 오므로 원문 해시로는
   * 낡음을 못 잡는다 — 인덱스에서 묶음 이름을 고쳐도 조각이 옛 이름을 싣고 있었다.
   */
  kicker?: string;
  /** 낱장 렌더로 잰 쪽수. 아직 안 쟀으면 `undefined`. */
  pages?: number;
  /**
   * 쪽수를 잴 때 넣은 HTML(권에 앉힌 뒤)의 해시. 조각이 같아도 장 번호나 다른 권 참조
   * 표기가 바뀌면 줄이 넘어갈 수 있으므로, **잰 것과 찍을 것이 같을 때만** 쪽수를 믿는다.
   */
  measuredHash?: string;
  problems: string[];
  /** 책 안으로 못 이은 상호 참조. 자료구조 편입 전에는 여기에 그 40건이 쌓인다. */
  deadRefs: string[];
  builtAt: string;
}

export interface EnsureResult {
  entry: CacheEntry;
  /** 이번 실행에서 다시 만들었는가. 거짓이면 캐시에서 꺼냈다. */
  rebuilt: boolean;
  path: string;
}

export function sha(text: string): string {
  return new Bun.CryptoHasher("sha256").update(text).digest("hex").slice(0, 16);
}

export class FragmentStore {
  private constructor(
    readonly dir: string,
    private readonly entries: Record<string, CacheEntry>,
  ) {}

  static async open(outDir: string): Promise<FragmentStore> {
    const dir = resolve(REPO, outDir);
    const file = Bun.file(`${dir}/cache.json`);
    const entries = (await file.exists())
      ? ((await file.json()) as Record<string, CacheEntry>)
      : {};
    return new FragmentStore(dir, entries);
  }

  get(id: string): CacheEntry | undefined {
    return this.entries[id];
  }

  fragmentPath(id: string): string {
    return `${this.dir}/chapters/${id}.html`;
  }

  /** 쪽수는 조각과 따로 잰다(`chrome.ts`). 잰 값을 같은 항목에 얹는다. */
  setPages(id: string, pages: number, measuredHash?: string): void {
    const e = this.entries[id];
    if (e === undefined) return;
    e.pages = pages;
    if (measuredHash === undefined) delete e.measuredHash;
    else e.measuredHash = measuredHash;
  }

  /** 이 HTML 로 잰 쪽수가 있으면 그 값, 없으면 `undefined`. */
  pagesFor(id: string, html: string): number | undefined {
    const e = this.entries[id];
    if (e?.pages === undefined || e.pages <= 0) return undefined;
    return e.measuredHash === sha(html) ? e.pages : undefined;
  }

  async flush(): Promise<void> {
    await Bun.write(
      `${this.dir}/cache.json`,
      `${JSON.stringify(this.entries, null, 2)}\n`,
    );
  }

  /**
   * 조각이 최신이면 그대로 두고, 아니면 다시 만든다.
   *
   * `force` 는 조각 모양을 고치는 중일 때만 쓴다 — 평소에 켜면 캐시가 하는 일이 없다.
   */
  async ensure(
    ch: Chapter,
    ctx: { byDir: Map<string, Chapter>; force?: boolean },
  ): Promise<EnsureResult> {
    const abs = resolve(REPO, ch.src);
    const md = await Bun.file(abs).text();
    const srcHash = sha(md);
    const path = this.fragmentPath(ch.id);
    const prev = this.entries[ch.id];
    const kicker = kickerOf(ch);

    const fresh =
      prev !== undefined &&
      prev.srcHash === srcHash &&
      prev.builder === BUILDER_VERSION &&
      prev.kicker === kicker &&
      (await Bun.file(path).exists());

    if (fresh && ctx.force !== true) {
      return { entry: prev as CacheEntry, rebuilt: false, path };
    }

    const built = await build(abs);
    const { anchors } = railFrom(md);
    const { html, deadRefs } = wrap(
      ch,
      built.prose,
      new Set(anchors),
      ctx.byDir,
    );
    await Bun.write(path, html);

    const entry: CacheEntry = {
      src: ch.src,
      title: built.title,
      srcHash,
      builder: BUILDER_VERSION,
      kicker,
      problems: built.problems,
      deadRefs,
      builtAt: new Date().toISOString(),
      // 원문이 바뀌었으면 쪽수도 다시 재야 한다 — 낡은 값을 물려주지 않는다.
    };
    this.entries[ch.id] = entry;
    return { entry, rebuilt: true, path };
  }
}

function kickerOf(ch: Chapter): string {
  return [ch.trackLabel, ch.bundle, ch.note]
    .filter((x) => x !== "")
    .join(" · ");
}

/** 챕터 껍데기 + 앵커·링크 재작성. */
function wrap(
  ch: Chapter,
  prose: string,
  anchors: Set<string>,
  byDir: Map<string, Chapter>,
): { html: string; deadRefs: string[] } {
  const deadRefs: string[] = [];
  const here = dirname(ch.src);

  let out = prose.replace(/\bid="([^"]+)"/g, (m, id: string) =>
    anchors.has(id) ? `id="${ch.id}--${id}"` : m,
  );

  out = out.replace(/\bhref="([^"]*)"/g, (m, raw: string) => {
    // ① 같은 편 안의 절 링크
    if (raw.startsWith("#")) {
      const id = raw.slice(1);
      return anchors.has(id) ? `href="#${ch.id}--${id}"` : m;
    }
    // ② 바깥으로 나가는 절대 링크는 그대로 둔다 — 종이에서도 뜻이 있다
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return m;

    // ③ 상대 링크. 폴더로 챕터를 찾는다
    const [pathPart = "", frag] = decodeURIComponent(raw).split("#");
    const dir = relative(REPO, dirname(resolve(REPO, here, pathPart)));
    if (dir === here) return `data-bk-self="1"`; // 제 편을 가리키는 링크는 종이에서 뜻이 없다
    const hit = byDir.get(dir);
    if (hit === undefined || !hit.ready) {
      deadRefs.push(dir === "" ? pathPart : dir);
      return `data-bk-dead="1"`;
    }
    // 절 앵커는 가이드 파일을 가리킬 때만 옮긴다 — 문제 문서의 절은 책에 없다
    const keep = frag !== undefined && /-guide\.mdx?$/.test(pathPart);
    return `href="#${hit.id}${keep ? `--${frag}` : ""}"`;
  });

  // 책에 없는 곳으로 가던 `<a>` 는 링크를 풀어 본문으로 남긴다.
  out = out
    .replace(
      /<a\b[^>]*data-bk-dead="1"[^>]*>([\s\S]*?)<\/a>/g,
      (_m, text: string) => `<span class="bk-xref-dead">${text}</span>`,
    )
    .replace(
      /<a\b[^>]*data-bk-self="1"[^>]*>([\s\S]*?)<\/a>/g,
      (_m, text: string) => text,
    );

  // 장 제목은 간지로 옮긴다 — 본문 흐름에 두면 간지 다음 쪽에 한 번 더 선다.
  const h1 = /<h1\b[^>]*>[\s\S]*?<\/h1>\n?/.exec(out);
  if (h1 !== null) out = out.replace(h1[0], "");
  const opener = openerOf(
    ch,
    h1?.[0].trim() ?? `<h1>${esc(ch.name)}</h1>`,
    out,
  );

  return {
    html: `<section class="bk-chapter" id="${ch.id}" data-track="${ch.trackId}">\n${opener}\n${stops(codeFigures(out))}\n</section>\n`,
    deadRefs,
  };
}

/** 코드 펜스 언어 → 지면 표기. 도식(`text`)은 언어가 아니라 그림이라 여기 없다. */
const LANG: Record<string, string> = {
  ts: "TypeScript",
  typescript: "TypeScript",
  js: "JavaScript",
  javascript: "JavaScript",
  rust: "Rust",
  rs: "Rust",
  python: "Python",
  py: "Python",
  c: "C",
  cpp: "C++",
  java: "Java",
  julia: "Julia",
  go: "Go",
};

export function langLabel(lang: string): string {
  return LANG[lang] ?? lang.toUpperCase();
}

/** 이 조각의 코드 언어를 많이 쓴 순서로. 도식 블록은 세지 않는다. */
export function codeLanguages(html: string): string[] {
  const n = new Map<string, number>();
  for (const m of html.matchAll(
    /<pre class="shiki[^>]*data-language="([^"]+)"/g,
  )) {
    const lang = m[1] as string;
    if (lang === "text" || lang === "txt" || lang === "plaintext") continue;
    const label = langLabel(lang);
    n.set(label, (n.get(label) ?? 0) + 1);
  }
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l);
}

/**
 * 챕터 간지 — 템플릿 「03 챕터 간지」. 파트 요약은 **원고의 파트 제목과 그 첫 문단**이다
 * (111편 모두 파트 둘에 첫 문단이 있음을 실측). 요약을 새로 쓰지 않는다.
 */
function openerOf(ch: Chapter, h1: string, body: string): string {
  const parts = [
    ...body.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>\s*<p>([\s\S]*?)<\/p>/g),
  ].map(
    (m) =>
      `<div><p class="bk-opener-part">${text(m[1] ?? "")}</p>` +
      `<p class="bk-opener-lede">${text(m[2] ?? "")}</p></div>`,
  );
  const kicker = [kickerOf(ch), `제 ${NO_SLOT} 장`]
    .filter((x) => x !== "")
    .join(" · ");
  const langs = codeLanguages(body).map((l) => l.toUpperCase());
  return [
    `<section class="bk-opener">`,
    `<div class="bk-opener-run"><span>EP. ${NO_SLOT}</span></div>`,
    `<div class="bk-opener-no">${NO_SLOT}</div>`,
    `<div class="bk-opener-col">`,
    `<p class="bk-kicker">${esc(kicker).replaceAll(esc(NO_SLOT), NO_SLOT)}</p>`,
    h1,
    `<div class="bk-opener-rule"></div>`,
    parts.length === 0
      ? ""
      : `<div class="bk-opener-parts">${parts.join("")}</div>`,
    `</div>`,
    `<div class="bk-opener-foot"><span>${[...langs, `${PAGES_SLOT}쪽`].join(" · ")}</span>` +
      `<span class="bk-folio">${FOLIO_SLOT}</span></div>`,
    `</section>`,
  ].join("\n");
}

/** 태그를 벗긴 글자. 엔티티는 그대로 두어 HTML 에 다시 넣어도 안전하다. */
function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** 코드 블록에 머리 줄을 씌운다 — 템플릿 「05 본문 코드」. 도식 블록은 그대로 둔다. */
function codeFigures(html: string): string {
  return html.replace(
    /<pre class="shiki[^>]*data-language="([^"]+)"[^>]*>[\s\S]*?<\/pre>/g,
    (m, lang: string) =>
      lang === "text"
        ? m
        : `<figure class="bk-code"><figcaption class="bk-code-head">` +
          `<span class="bk-code-lang">${esc(langLabel(lang))}</span></figcaption>${m}</figure>`,
  );
}

/**
 * 「멈춤 —」 제목부터 다음 제목 전까지를 한 상자로 묶는다 — 템플릿 「07 본문 요약·연습」의
 * STOP. 원고에서 멈춤은 제목 하나에 문단 · 도식이 따라오는 절이라, 제목만 칠하면 어디서
 * 끝나는지가 지면에 안 보인다.
 */
function stops(html: string): string {
  return html.replace(
    /<h4\b[^>]*>멈춤[\s\S]*?(?=<h[1-4][\s>]|$)/g,
    (m) => `<div class="bk-stop">\n${m.trimEnd()}\n</div>\n`,
  );
}

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
