/**
 * 챕터 목록 — **순서의 정본은 `문제_가이드_목록.md`** 이고 이 파일은 그것을 읽을 뿐이다.
 *
 * 순서를 여기서 새로 정하면 인덱스와 책이 갈리고, 갈린 쪽은 조용히 낡는다. 그 인덱스는
 * 사람이 중요도로 관리하며 **자료구조 항목을 이미 제자리에 담고 있다** — 자료구조 편입이
 * 설정 한 줄로 끝나는 근거가 이것이다.
 *
 * 인덱스의 네 층을 그대로 책의 네 층으로 옮긴다.
 *
 * | 인덱스 | 책 |
 * | --- | --- |
 * | `## ★★★ 상 — 필수` | 부 |
 * | `### 그래프·네트워크 고급` | 편(있을 때만) |
 * | `- **이진 탐색** — …` | 묶음 |
 * | `[binarySearch](./경로)` | 챕터 |
 */

import { basename } from "node:path";
import type { BookConfig, TrackConfig } from "./config.ts";
import { REPO, trackOf } from "./config.ts";

export interface Chapter {
  /** `algorithms--binarySearch`. 트랙을 붙이는 이유는 `trie` 가 두 트랙에 다 있어서다. */
  id: string;
  name: string;
  trackId: string;
  trackLabel: string;
  /** 저장소 상대 경로. */
  src: string;
  /** 인덱스가 이름 뒤에 붙인 주석 — `(변형)`·`(신규 템플릿)`. 없으면 빈 문자열. */
  note: string;
  /** 묶음 이름(`이진 탐색`). 목차의 한 단이 된다. */
  bundle: string;
  partId: string;
  /** 책에 실리는가. 아니면 `skipReason` 이 이유를 든다. */
  ready: boolean;
  skipReason?: string;
  /** 몇 번째 장인가(1부터). 실리는 챕터에만 매긴다. */
  number?: number;
}

export interface Bundle {
  label: string;
  chapters: Chapter[];
}
export interface Volume {
  /** 인덱스의 `###`. 없는 부에서는 빈 문자열 하나만 있는 편이 된다. */
  label: string;
  bundles: Bundle[];
}
export interface Part {
  id: string;
  label: string;
  /** ★ 개수. 없으면 0(미분류). 부 정렬에 쓰지 않는다 — 인덱스 순서를 그대로 지킨다. */
  stars: number;
  volumes: Volume[];
}

export interface ChapterPlan {
  parts: Part[];
  /** 실리는 챕터를 책 순서대로. */
  chapters: Chapter[];
  /** 안 실리는 챕터. 마무리(콜로폰)가 사유와 함께 싣는다. */
  skipped: Chapter[];
  /** 인덱스에 같은 파일이 두 번 이상 나온 자리. */
  duplicates: string[];
}

const LINK = /\[([^\]]+)\]\(\.\/([^)\s]+)\)(?:\s*\(([^)]*)\))?/g;

/** `## ★★★ 상 — 필수 (…)` 에서 ★ 개수. 미분류 부는 0. */
function starsOf(label: string): number {
  return (/^(★+)/.exec(label)?.[1] ?? "").length;
}

function slug(s: string): string {
  return s.replace(/[^A-Za-z0-9가-힣]+/g, "-").replace(/^-|-$/g, "");
}

/**
 * 챕터 하나를 판정한다. **못 싣는 이유를 문자열로 남긴다** — 조용히 빠지면 111편을
 * 기대한 사람이 108편짜리 PDF 를 받고도 모른다.
 */
async function judge(
  cfg: BookConfig,
  src: string,
): Promise<{ track?: TrackConfig; ready: boolean; reason?: string }> {
  const track = trackOf(cfg, src);
  if (track === undefined) return { ready: false, reason: "트랙 밖 경로" };
  if (!track.enabled) {
    return { track, ready: false, reason: `${track.label} 트랙 미편입` };
  }
  const ext = src.slice(src.lastIndexOf("."));
  if (!track.formats.includes(ext)) {
    return { track, ready: false, reason: `${ext} 는 이 트랙의 formats 밖` };
  }
  if (!(await Bun.file(`${REPO}/${src}`).exists())) {
    return { track, ready: false, reason: "파일 없음" };
  }
  return { track, ready: true };
}

export async function plan(cfg: BookConfig): Promise<ChapterPlan> {
  const md = await Bun.file(`${REPO}/${cfg.index}`).text();
  const parts: Part[] = [];
  const seen = new Map<string, string>();
  const duplicates: string[] = [];

  let part: Part | undefined;
  let volume: Volume | undefined;

  const openPart = (label: string) => {
    part = {
      id: slug(label).slice(0, 40),
      label,
      stars: starsOf(label),
      volumes: [],
    };
    parts.push(part);
    volume = undefined;
  };
  const openVolume = (label: string) => {
    if (part === undefined) openPart("미분류");
    volume = { label, bundles: [] };
    (part as Part).volumes.push(volume);
  };

  for (const line of md.split("\n")) {
    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    if (h2?.[1] !== undefined) {
      openPart(h2[1]);
      continue;
    }
    const h3 = /^###\s+(.+?)\s*$/.exec(line);
    if (h3?.[1] !== undefined) {
      openVolume(h3[1]);
      continue;
    }
    if (!line.startsWith("- ")) continue;

    const links = [...line.matchAll(LINK)];
    if (links.length === 0) continue;
    if (part === undefined) openPart("미분류");
    if (volume === undefined) openVolume("");

    const label = /^-\s+\*\*(.+?)\*\*/.exec(line)?.[1] ?? links[0]?.[1] ?? "";
    const bundle: Bundle = { label, chapters: [] };
    (volume as Volume).bundles.push(bundle);

    for (const m of links) {
      const src = decodeURIComponent(m[2] as string);
      if (!/-guide\.mdx?$/.test(src)) continue;
      const prev = seen.get(src);
      if (prev !== undefined) {
        duplicates.push(`${src} — ${prev} 와 ${label} 에 겹쳐 있다`);
        continue;
      }
      seen.set(src, label);

      const name = basename(src).replace(/-guide\.mdx?$/, "");
      const { track, ready, reason } = await judge(cfg, src);
      bundle.chapters.push({
        id: `${track?.id ?? "unknown"}--${name}`,
        name,
        trackId: track?.id ?? "unknown",
        trackLabel: track?.label ?? "미상",
        src,
        note: (m[3] ?? "").trim(),
        bundle: label,
        partId: (part as Part).id,
        ready,
        ...(reason === undefined ? {} : { skipReason: reason }),
      });
    }
  }

  const all = parts.flatMap((p) =>
    p.volumes.flatMap((v) => v.bundles.flatMap((b) => b.chapters)),
  );
  const chapters = all.filter((c) => c.ready);
  chapters.forEach((c, i) => {
    c.number = i + 1;
  });

  return {
    parts: ordered(cfg, parts),
    chapters,
    skipped: all.filter((c) => !c.ready),
    duplicates,
  };
}

/** 이름으로 찾고 없으면 만들어 넣는다. 쉼표 연산자로 줄이면 부작용이 숨는다. */
function pick<T extends { label: string }>(
  list: T[],
  label: string,
  make: () => T,
): T {
  const hit = list.find((x) => x.label === label);
  if (hit !== undefined) return hit;
  const made = make();
  list.push(made);
  return made;
}

/**
 * `groupBy: "track"` 이면 부를 트랙으로 다시 묶는다. 중요도 순서는 그 안에서 유지된다 —
 * 인덱스를 훑는 순서가 곧 중요도 순서이므로 **다시 정렬하지 않는다**.
 */
function ordered(cfg: BookConfig, parts: Part[]): Part[] {
  if (cfg.groupBy === "importance") return parts;

  const byTrack = new Map<string, Part>();
  for (const t of cfg.tracks) {
    byTrack.set(t.id, { id: t.id, label: t.label, stars: 0, volumes: [] });
  }
  for (const part of parts) {
    for (const vol of part.volumes) {
      for (const bundle of vol.bundles) {
        for (const c of bundle.chapters) {
          const host = byTrack.get(c.trackId);
          if (host === undefined) continue;
          const v = pick(host.volumes, part.label, () => ({
            label: part.label,
            bundles: [],
          }));
          pick(v.bundles, bundle.label, () => ({
            label: bundle.label,
            chapters: [],
          })).chapters.push(c);
        }
      }
    }
  }
  return [...byTrack.values()].filter((x) => x.volumes.length > 0);
}
