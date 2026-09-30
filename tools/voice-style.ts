/**
 * 알고리즘 가이드 voice(`algorithm-guide-writer`)의 문체 규칙을 검사기에 넘긴다.
 *
 * **규칙의 정의는 이 저장소에 없다.** `authoring-kit` 의 voice 설정이 정본이다 —
 * `~/.claude/authoring/voices/algorithm-guide-writer/{voice.json,voice.md,style.json}`.
 * 2026-09-27 유저 지시로 옮겼다 — *"지시가 겹치는 별도 내용이 있을 경우, authoring-kit 쪽을
 * 사용하고, 이 프로젝트의 자체 정의는 지운다"*. 옮기기 전의 정의(`check-v2.ts` 의 `METAPHORS`·
 * `FORBIDDEN` 과 그 갈래마다 붙어 있던 경위 주석)는 커밋 `4e8a5d0` 의 `check-v2.ts` 593~751줄에
 * 있다.
 *
 * 검사기는 저장소 안의 **사본**(`.claude/authoring/voices/algorithm-guide-writer/`)을 읽는다.
 * 원격 CI 에는 `~/.claude` 가 없기 때문이다. 사본이 제2의 정의가 되지 않게, 원본이 있는
 * 자리에서는 둘이 글자 단위로 같은지 `--check` 가 잰다(게이트). 원본을 고쳤으면
 * `--sync` 로 사본을 다시 뜬다.
 *
 * ```bash
 * bun run tools/voice-style.ts --check   # 사본 = 원본 (원본이 없으면 건너뛴다고 알리고 0)
 * bun run tools/voice-style.ts --sync    # 원본 → 사본
 * ```
 */

import { homedir } from "node:os";
import { join } from "node:path";

export const VOICE_ID = "algorithm-guide-writer";
const FILES = ["voice.json", "voice.md", "style.json"] as const;

const REPO_ROOT = join(import.meta.dir, "..");
export const MIRROR_DIR = join(REPO_ROOT, ".claude/authoring/voices", VOICE_ID);
export const SOURCE_DIR = join(
  process.env.AUTHORING_KIT_HOME ?? join(homedir(), ".claude/authoring"),
  "voices",
  VOICE_ID,
);

interface LexiconItem {
  id: string;
  forms?: string[];
  regex?: string;
  label?: string;
  weight: number;
  enabled?: boolean;
  alternatives?: string[];
}

const style = (await Bun.file(join(MIRROR_DIR, "style.json")).json()) as {
  lexicon: { add: LexiconItem[] };
};
const voice = (await Bun.file(join(MIRROR_DIR, "voice.json")).json()) as {
  params?: { max_prose_run?: number };
};

/** 금지(-3)이고 채택된 항목만. 가중치가 풀리면 검사에서도 빠진다. */
const banned = style.lexicon.add.filter(
  (item) => item.weight === -3 && item.enabled !== false,
);

/** 은유·다의어 — 정규식 항목. 인용 구간을 뺀 문장에 건다(부르는 쪽 몫). */
export const METAPHORS: { re: RegExp; label: string }[] = banned
  .filter((item) => item.regex !== undefined)
  .map((item) => ({
    re: new RegExp(item.regex as string),
    label: `${item.label} — ${(item.alternatives ?? []).map((a) => `"${a}"`).join(" 또는 ")} 로`,
  }));

/**
 * 금지(-3)로 정했지만 **아직 켜지 않은** 은유·다의어 항목(`enabled: false`).
 *
 * 전수로 걸리는 편이 많아 전개 카드와 함께 켜기로 미룬 규칙이다 — 지금은 `v.common.gyeonju`
 * (「견주다」, `SPEC.md` `L44`) 하나. `check-v2` 가 알고리즘 골격에서 기본으로 잰다(2026-10-01
 * `KAN-058`). 자료구조 골격에는 아직 걸지 않는다.
 * 켜면(`enabled: true`) `METAPHORS` 로 옮겨 가고 여기서는 빠진다 — 따로 지울 자리가 없다.
 */
export const DEFERRED_METAPHORS: { re: RegExp; label: string }[] =
  style.lexicon.add
    .filter(
      (item) =>
        item.weight === -3 &&
        item.enabled === false &&
        item.regex !== undefined,
    )
    .map((item) => ({
      re: new RegExp(item.regex as string),
      label: `${item.label} — ${(item.alternatives ?? []).map((a) => `"${a}"`).join(" 또는 ")} 로`,
    }));

/** 논증을 결론으로 끝내는 문형 — 낱말 항목. */
export const FORBIDDEN_PHRASES: string[] = banned.flatMap(
  (item) => item.forms ?? [],
);

/** 그림 없이 이어질 수 있는 산문 문단 수 상한(voice `params.max_prose_run`). */
export const MAX_PROSE_RUN: number = voice.params?.max_prose_run ?? 2;

/** 원본과 사본이 다른 파일 이름. 원본이 없으면 `null`. */
export async function mirrorDrift(): Promise<string[] | null> {
  if (!(await Bun.file(join(SOURCE_DIR, "style.json")).exists())) return null;
  const drift: string[] = [];
  for (const name of FILES) {
    const [src, dst] = await Promise.all([
      Bun.file(join(SOURCE_DIR, name)).text(),
      Bun.file(join(MIRROR_DIR, name)).text(),
    ]);
    if (src !== dst) drift.push(name);
  }
  return drift;
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes("--sync")) {
    for (const name of FILES) {
      await Bun.write(join(MIRROR_DIR, name), Bun.file(join(SOURCE_DIR, name)));
    }
    console.log(`사본을 원본으로 다시 떴다 — ${MIRROR_DIR}`);
  } else {
    const drift = await mirrorDrift();
    if (drift === null) {
      console.log(
        `원본이 없어 대조를 건너뛴다 — ${SOURCE_DIR}. 검사기는 저장소 사본을 쓴다.`,
      );
    } else if (drift.length > 0) {
      console.error(
        `voice 사본이 원본과 다르다 — ${drift.join(" · ")}. 규칙은 원본(authoring-kit)에서 고치고 \`bun run tools/voice-style.ts --sync\` 로 사본을 뜬다.`,
      );
      process.exit(1);
    } else {
      console.log(`voice 사본 = 원본 (${FILES.join(" · ")})`);
    }
  }
}
