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
 */

import { dirname, relative, resolve } from "node:path";
import { build, railFrom } from "../build-html.ts";
import type { Chapter } from "./chapters.ts";
import { REPO } from "./config.ts";
import { NO_SLOT } from "./volume.ts";

/**
 * 조각 모양이 바뀌면 올린다. **올리는 순간 캐시 전체가 무효가 된다** — 낡은 모양의 조각과
 * 새 모양의 조각이 한 권에 섞이는 것이 조용한 실패다.
 */
export const BUILDER_VERSION = 3;

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

  const head =
    `<header class="bk-chapter-head">` +
    `<p class="bk-kicker">${esc(kickerOf(ch))}</p>` +
    `<p class="bk-chapter-no">제 ${NO_SLOT} 장</p>` +
    `</header>`;

  return {
    html: `<section class="bk-chapter" id="${ch.id}" data-track="${ch.trackId}">\n${head}\n${out}\n</section>\n`,
    deadRefs,
  };
}

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
