/**
 * 책 설정 — **사람이 고치는 자리는 `book.config.json` 하나**다.
 *
 * 트랙을 배열로 둔 이유가 여기 있다. 지금 서 있는 것은 알고리즘 111편뿐이지만 자료구조
 * 69종이 ORD-006 재집필을 마치면 들어온다. 그때 코드를 고쳐야 한다면 그건 설계가 트랙을
 * 하나로 못박은 것이다. 트랙은 **설정 항목**이고, 편입은 `enabled` 한 줄이다.
 *
 * 챕터 순서를 이 파일이 정하지 않는다는 점도 같은 이유다 — 순서의 정본은
 * `문제_가이드_목록.md`(사람이 중요도로 관리하는 인덱스)이고, 그 인덱스에는 자료구조
 * 항목이 **이미 제자리에 적혀 있다**. 책은 그것을 읽을 뿐이다.
 *
 * 권 나눔(`volumes`)도 같은 원리다. 권이 챕터를 이름으로 고르지 않고 인덱스의 **부(★ 등급)**
 * 를 고른다. 인덱스에서 한 편의 등급을 옮기면 그 편은 다음 빌드에서 다른 권으로 간다.
 */

import { resolve } from "node:path";

/** 저장소 뿌리. `tools/book/` 에서 두 칸 위다. */
export const REPO = resolve(import.meta.dir, "..", "..");

/**
 * 한 트랙. `root` 로 경로를 판별하고 `formats` 로 실을 확장자를 가른다.
 *
 * `formats` 를 두는 이유는 `.mdx` 다. 빌더는 MDX 를 컴파일하지 않고 마크다운으로 읽으므로
 * 산문 속 `i<n`·`Array<T>` 가 있는 편이 조용히 망가진다. 확장자를 열어 주는 판단을
 * 코드가 아니라 설정이 지게 둔다.
 */
export interface TrackConfig {
  id: string;
  label: string;
  /** 저장소 상대 경로 접두. 챕터가 어느 트랙인지 이걸로 정한다. */
  root: string;
  enabled: boolean;
  formats: string[];
  note?: string;
}

/**
 * 판형. 여백은 여기 없다 — 머리말 줄과 본문 사이 간격까지 디자인 템플릿이 정한 쪽 틀이라
 * 조판 규칙(`print-css.ts` 의 `GEOMETRY`)에 산다.
 */
export interface PageConfig {
  format: "A4" | "Letter";
}

/**
 * 디자인 템플릿이 **조절값으로 열어 둔 것**과 책마다 다른 문구. 치수 · 서체 · 요소 모양은
 * 조판 규칙(`print-css.ts`)이 템플릿에서 옮겨 온 고정값이다.
 */
export interface DesignConfig {
  /** 템플릿의 출처. 조판 규칙이 무엇을 옮긴 것인지 추적하는 자리. */
  source: string;
  /** 본문 지면색. 템플릿의 「백색」 #ffffff · 「미색」 #f7f7f6. 표지 · 간지 · 뒤표지는 늘 백색이다. */
  paper: string;
  /** 표식색 — 표지 막대 · 짚고 가기 상자. 템플릿 기본 #c0392b. */
  mark: string;
  /** 표지 왼쪽 아래 시리즈 표기. */
  seriesLabel: string;
  /** 뒤표지 큰 문장. */
  backHeadline: string;
  /** 뒤표지 큰 문장 아래 한 줄. */
  backLede: string;
  /** 뒤표지 READER 칸. */
  reader: string;
  /** 비우면 뒤표지에서 ISBN 자리를 뺀다 — 가짜 바코드를 찍지 않는다. */
  isbn: string;
}

export interface BookConfig {
  title: string;
  subtitle: string;
  /** 비우면 표지에서 줄 자체를 뺀다 — 빈 줄을 남기지 않는다. */
  author: string;
  edition: string;
  /** 챕터 순서의 정본. 저장소 상대 경로. */
  index: string;
  outDir: string;
  /**
   * `importance` — 인덱스의 중요도 부(★★★·★★·★)를 그대로 부로 삼는다. 트랙이 한 부
   * 안에 섞인다. 인덱스가 이미 그렇게 관리되고 있으므로 이게 기본값이다.
   * `track` — 트랙을 부로 삼고 그 안에서 중요도 순서를 지킨다.
   */
  groupBy: "importance" | "track";
  page: PageConfig;
  design: DesignConfig;
  tracks: TrackConfig[];
  /** 권 나눔. 인덱스의 부 하나는 정확히 한 권에 들어간다. */
  volumes: VolumeConfig[];
  /** 디자인 의뢰용 샘플. 없으면 `build-sample.ts` 가 멈춘다. */
  sample?: SampleConfig;
}

/**
 * 한 권. **어느 부를 싣는지를 ★ 개수로 정한다** — 인덱스의 부가 곧 중요도 등급이므로
 * 권 나눔도 인덱스를 따라간다. 챕터 이름을 권마다 늘어놓으면 인덱스와 두 벌이 된다.
 */
export interface VolumeConfig {
  /** 산출 폴더 이름. `build/book/<id>/`. */
  id: string;
  /** 표지와 머리말에 찍히는 이름(`초급`). */
  label: string;
  /** 인덱스 부의 ★ 개수. 미분류 부는 0 이다. */
  stars: number[];
  /** 표지의 한 줄 — 이 권이 다루는 범위. */
  blurb: string;
}

export interface SampleConfig {
  outDir: string;
  /** 본문으로 실을 챕터 id. 권마다 하나씩 두면 권별 밀도 차이가 샘플에 드러난다. */
  chapters: string[];
}

/**
 * 설정을 읽는다. **빠진 항목을 기본값으로 메우지 않는다** — 표지에 빈 제목이 찍힌 PDF 가
 * 나오는 것보다 여기서 멈추는 편이 싸다.
 */
export async function loadConfig(
  path = resolve(REPO, "book.config.json"),
): Promise<BookConfig> {
  const file = Bun.file(path);
  if (!(await file.exists())) throw new Error(`설정이 없다: ${path}`);
  const raw = (await file.json()) as Partial<BookConfig>;

  const need = [
    "title",
    "index",
    "outDir",
    "page",
    "design",
    "tracks",
    "volumes",
  ] as const;
  for (const k of need) {
    if (raw[k] === undefined) throw new Error(`설정에 ${k} 가 없다: ${path}`);
  }
  if (!Array.isArray(raw.tracks) || raw.tracks.length === 0) {
    throw new Error("설정의 tracks 가 비었다 — 실을 트랙이 하나도 없다");
  }
  const groupBy = raw.groupBy ?? "importance";
  if (groupBy !== "importance" && groupBy !== "track") {
    throw new Error(`groupBy 는 importance 또는 track 이다: ${groupBy}`);
  }
  const volumes = checkVolumes(raw.volumes);
  const design = raw.design as DesignConfig;
  for (const k of [
    "source",
    "paper",
    "mark",
    "seriesLabel",
    "backHeadline",
    "backLede",
    "reader",
    "isbn",
  ] as const) {
    if (typeof design[k] !== "string") {
      throw new Error(`설정의 design.${k} 가 없다: ${path}`);
    }
  }

  return {
    title: raw.title as string,
    subtitle: raw.subtitle ?? "",
    author: raw.author ?? "",
    edition: raw.edition ?? "",
    index: raw.index as string,
    outDir: raw.outDir as string,
    groupBy,
    page: raw.page as PageConfig,
    design,
    tracks: raw.tracks as TrackConfig[],
    volumes,
    ...(raw.sample === undefined ? {} : { sample: raw.sample }),
  };
}

/**
 * 권 설정을 검사한다. **한 부가 두 권에 걸리면 멈춘다** — 같은 장이 두 권에 실리고,
 * 권마다 번호가 달라 상호 참조가 어느 쪽을 가리키는지 정할 수 없게 된다.
 */
export function checkVolumes(raw: unknown): VolumeConfig[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("설정의 volumes 가 비었다 — 찍을 권이 하나도 없다");
  }
  const ids = new Set<string>();
  const owner = new Map<number, string>();
  for (const v of raw as VolumeConfig[]) {
    if (!/^[a-z0-9-]+$/.test(v.id ?? "")) {
      throw new Error(`권 id 는 영소문자·숫자·하이픈이다(폴더 이름): ${v.id}`);
    }
    if (ids.has(v.id)) throw new Error(`권 id 가 겹친다: ${v.id}`);
    ids.add(v.id);
    if (!Array.isArray(v.stars) || v.stars.length === 0) {
      throw new Error(`권 ${v.id} 의 stars 가 비었다 — 실을 부가 없다`);
    }
    for (const s of v.stars) {
      const prev = owner.get(s);
      if (prev !== undefined) {
        throw new Error(`★${s} 부가 ${prev} 와 ${v.id} 두 권에 걸려 있다`);
      }
      owner.set(s, v.id);
    }
  }
  return raw as VolumeConfig[];
}

/** 경로가 어느 트랙인가. 어느 `root` 에도 안 걸리면 `undefined`. */
export function trackOf(
  cfg: BookConfig,
  repoRelPath: string,
): TrackConfig | undefined {
  return cfg.tracks.find((t) => repoRelPath.startsWith(`${t.root}/`));
}
