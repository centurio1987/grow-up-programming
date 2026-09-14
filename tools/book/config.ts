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

export interface PageConfig {
  format: "A4" | "Letter";
  /** 인치. CDP `Page.printToPDF` 가 인치를 받는다. */
  marginIn: { top: number; bottom: number; left: number; right: number };
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
  tracks: TrackConfig[];
}

/** 실린 차원(A4 = 8.27×11.69in). CDP 는 종이 이름이 아니라 치수를 받는다. */
export const PAPER: Record<PageConfig["format"], { w: number; h: number }> = {
  A4: { w: 8.27, h: 11.69 },
  Letter: { w: 8.5, h: 11 },
};

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

  const need = ["title", "index", "outDir", "page", "tracks"] as const;
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

  return {
    title: raw.title as string,
    subtitle: raw.subtitle ?? "",
    author: raw.author ?? "",
    edition: raw.edition ?? "",
    index: raw.index as string,
    outDir: raw.outDir as string,
    groupBy,
    page: raw.page as PageConfig,
    tracks: raw.tracks as TrackConfig[],
  };
}

/** 경로가 어느 트랙인가. 어느 `root` 에도 안 걸리면 `undefined`. */
export function trackOf(
  cfg: BookConfig,
  repoRelPath: string,
): TrackConfig | undefined {
  return cfg.tracks.find((t) => repoRelPath.startsWith(`${t.root}/`));
}
