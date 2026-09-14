/**
 * 권 나눔 — 한 벌의 차례를 인덱스의 ★ 등급으로 가르고, 조각을 그 권에 앉힌다.
 *
 * 조각(`fragment.ts`)은 **자기가 어느 권에 실리는지 모른다.** 장 번호와 「다른 권을 가리키는
 * 링크」는 권이 정해져야 결정되는 값이라, 조각에 박아 두면 권 설정을 바꿀 때마다 111편
 * 캐시가 조용히 낡는다. 그래서 조각에는 번호 자리만 남기고 여기서 채운다(`place`).
 *
 * 다른 권을 가리키는 링크를 그냥 두면 안 되는 이유: 합본이 권마다 따로 인쇄되므로
 * `#algorithms--kadane` 은 그 권 안에서 **아무 데도 안 가는 링크**가 된다. 눌러 보기 전까지
 * 모르는 깨진 링크보다, 「(초급 제 7 장)」처럼 종이에서 찾아갈 수 있는 자리를 적는 편이 낫다.
 */

import type { Chapter, ChapterPlan, Part } from "./chapters.ts";
import { ordered } from "./chapters.ts";
import type { BookConfig, VolumeConfig } from "./config.ts";

/** 조각이 장 번호 자리에 남기는 표식. `place` 가 채운다. */
export const NO_SLOT = "<!--bk:chapter-no-->";

export interface VolumePlan {
  vol: VolumeConfig;
  /** 몇 번째 권인가(1부터). */
  ordinal: number;
  /** 이 권의 부. 챕터는 권 안 번호가 매겨진 사본이다. */
  parts: Part[];
  /** 실리는 챕터를 책 순서대로. 번호는 권마다 1부터 다시 센다. */
  chapters: Chapter[];
  /** 이 권의 부에 적혔지만 못 싣는 챕터. */
  skipped: Chapter[];
}

export interface Place {
  vol: VolumeConfig;
  number: number;
}

export interface Split {
  volumes: VolumePlan[];
  /** 실릴 수 있는데 어느 권의 `stars` 에도 안 걸린 챕터. 빌더가 실패로 친다. */
  unassigned: Chapter[];
  /** 챕터 id → 실린 권과 그 권 안 번호. */
  where: Map<string, Place>;
}

export function split(cfg: BookConfig, p: ChapterPlan): Split {
  const where = new Map<string, Place>();

  const volumes = cfg.volumes.map((vol, i): VolumePlan => {
    let n = 0;
    const number = (c: Chapter): Chapter => {
      if (!c.ready) return { ...c };
      const made = { ...c, number: ++n };
      where.set(c.id, { vol, number: made.number });
      return made;
    };
    const mine = p.indexParts
      .filter((part) => vol.stars.includes(part.stars))
      .map((part) => ({
        ...part,
        volumes: part.volumes.map((v) => ({
          ...v,
          bundles: v.bundles.map((b) => ({
            ...b,
            chapters: b.chapters.map(number),
          })),
        })),
      }));
    const all = mine.flatMap((part) =>
      part.volumes.flatMap((v) => v.bundles.flatMap((b) => b.chapters)),
    );
    return {
      vol,
      ordinal: i + 1,
      parts: ordered(cfg, mine),
      chapters: all.filter((c) => c.ready),
      skipped: all.filter((c) => !c.ready),
    };
  });

  return {
    volumes,
    unassigned: p.chapters.filter((c) => !where.has(c.id)),
    where,
  };
}

export function placeLabel(at: Place): string {
  return `${at.vol.label} 제 ${at.number} 장`;
}

export interface CrossRef {
  /** 가리키는 챕터 id. */
  target: string;
  at: Place;
}

/**
 * 조각을 권에 앉힌다 — 장 번호를 채우고, 다른 권으로 가는 링크를 풀어 자리를 적는다.
 *
 * 번호 자리가 없으면 멈춘다. 번호가 박힌 낡은 조각이 섞였다는 뜻이고, 그대로 인쇄하면
 * 권마다 다시 센 번호와 한 권짜리 시절 번호가 한 책에 같이 찍힌다.
 */
export function place(
  fragment: string,
  ch: Chapter,
  s: Split,
  here: VolumeConfig,
): { html: string; crossRefs: CrossRef[] } {
  if (!fragment.includes(NO_SLOT)) {
    throw new Error(
      `${ch.id}: 조각에 장 번호 자리가 없다 — 낡은 조각이다. --refresh 로 다시 만든다`,
    );
  }
  const crossRefs: CrossRef[] = [];
  const html = fragment
    .replace(NO_SLOT, String(ch.number ?? 0))
    .replace(
      /<a\b[^>]*?\shref="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
      (m, href: string, text: string) => {
        const [track, name] = href.split("--");
        const at = s.where.get(`${track}--${name}`);
        if (at === undefined || at.vol.id === here.id) return m;
        crossRefs.push({ target: `${track}--${name}`, at });
        return `<span class="bk-xref-other" data-where="${placeLabel(at)}">${text}</span>`;
      },
    );
  return { html, crossRefs };
}
