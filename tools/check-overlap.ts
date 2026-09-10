/**
 * 이웃 편 겹침 스캐너 — **어느 편이 어느 편에서 베꼈는가.**
 *
 * `KAN-034.7` 배치10·11 이 손으로 대조하며 찾은 것이다. 모범으로 삼은 편을 옆에 놓고 쓰면
 * 문장이 그대로 딸려 오고, **수치까지 딸려 온다.** 그런데 겹친다는 사실만으로는 아무것도
 * 판정할 수 없다 — 「원소가 `n` 개면 쌍이 `n(n-1)/2` 개입니다」는 111편이 함께 쓰는
 * 관용 표현이고, 같은 문장이 **두 편에만** 있으면 그건 한쪽이 다른 쪽에서 가져온 것이다.
 *
 * **그래서 이 도구가 내는 것은 「위반」이 아니라 「부채 목록」이다.** 겹침이 나쁘다고 규격이
 * 말한 적이 없고, 무엇이 리프트이고 무엇이 관례인지는 사람이 봐야 정해진다. 기본 종료코드는
 * 언제나 0 이다 — `--fail-on-lift` 를 줄 때만 빨개진다.
 *
 * ## 잣대 넷
 *
 * 잣대는 `KAN-034.7` 배치10·11 이 손 대조로 실측한 것을 그대로 쓴다. 새로 정하지 않는다.
 *
 * | 잣대 | 무엇 |
 * | --- | --- |
 * | ① 완전 일치 줄 | 두 편에 글자 그대로 같은 줄 |
 * | ② 18자 창 | `WINDOW` 자 창을 밀며 겹치는 구간 |
 * | ③ 최장 공통 구간 | 겹친 창이 이어붙은 가장 긴 것 |
 * | ④ 편 빈도 | 그 문자열을 쓰는 **편 수**. **2 면 리프트**, **60 이상이면 관례** |
 *
 * **④ 가 핵심이고, 그래서 ④ 를 먼저 건다.** 111편 × 111편은 쌍이 6,105 개이고 겹친 창은
 * 39만 벌이다. 목록부터 내면 사람이 못 읽는 분량이 나오고 리프트가 관례에 묻힌다. 이 도구는
 * **편 빈도로 대역을 먼저 가른 다음** 리프트 대역만 쌍으로 펼친다 — 그리고 관례 대역은
 * 규모와 대표 문구만 따로 보여 준다. **사람이 편 수를 다시 세지 않게 하는 것이 목적이다.**
 *
 * ## 값도 본다
 *
 * 잣대 ②③ 는 `WINDOW` 자 창이라 **맨 수치 하나**를 못 본다 — `287,802` 는 일곱 자다.
 * 모범 편의 수치가 그대로 딸려 온 자리가 실측됐으므로, **잣대 ④ 를 수치 토큰에도 건다**
 * (`digits` · `valueTokens`). 잣대를 새로 만든 것이 아니라 **같은 잣대를 다른 단위에**
 * 건 것이다.
 *
 * ```bash
 * bun run tools/check-overlap.ts                       # 전수 111편
 * bun run tools/check-overlap.ts --top 40              # 쌍을 더 보기
 * bun run tools/check-overlap.ts --min-run 60          # 최장 구간 하한
 * bun run tools/check-overlap.ts --sort windows        # 잣대 ② 로 줄 세우기 (lines 도 된다)
 * bun run tools/check-overlap.ts <A.md> <B.md>         # 두 편만 (빈도는 전수로 잰다)
 * bun run tools/check-overlap.ts --json
 * ```
 *
 * 종료코드: 0 · `--fail-on-lift` 를 주고 리프트 후보가 있으면 1 · 대상이 없으면 2.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, v2Guides } from "./guide-v2-targets.ts";

/** 잣대 ② 의 창 너비. 배치10·11 이 손 대조로 쓴 값이다. */
export const WINDOW = 18;

/** 잣대 ④ — 편 수가 이 값이면 리프트다. 한 편이 다른 편에서 가져온 것. */
export const LIFT_GUIDES = 2;

/** 잣대 ④ — 편 수가 이 값 이상이면 관례다. 이 저장소의 관용 표현. */
export const CONVENTION_GUIDES = 60;

/** 수치 토큰으로 볼 최소 자릿수. 넷이면 연도(`2026`)가 들어와 전부 잡음이 된다. */
export const VALUE_DIGITS = 5;

/**
 * 한 편을 창에 밀기 좋은 꼴로 편다.
 *
 * 줄마다 공백을 하나로 접고 빈 줄을 버린 뒤 `\n` 으로 잇는다. **공백을 접는 이유**는 ascii
 * 도식이다 — 같은 그림을 옮겨 쓰면서 자리맞춤만 달라진 것이 겹침에서 빠지면 안 되고,
 * 거꾸로 자리맞춤 공백이 그대로 남으면 「공백 18칸」이 창 하나가 되어 전부 겹친다.
 *
 * **줄을 잇는 이유**는 잣대 ③ 이다. 창이 줄을 넘지 못하면 문단째 옮긴 자리가 줄마다 토막
 * 나서 「최장 공통 구간」이 한 줄 길이를 넘지 못한다.
 */
export interface Norm {
  /** 편 자리에 쓸 이름. 보통 저장소 상대 경로다. */
  name: string;
  /** 정규화한 본문. */
  text: string;
  /** `text` 의 글자마다 원본 줄 번호(1부터). */
  lineOf: Int32Array;
}

export function normalize(name: string, source: string): Norm {
  const parts: string[] = [];
  const lines: number[] = [];
  const raw = source.split("\n");
  for (let i = 0; i < raw.length; i++) {
    const folded = (raw[i] ?? "").replace(/\s+/g, " ").trim();
    if (folded === "") continue;
    parts.push(folded);
    lines.push(i + 1);
  }
  const text = parts.join("\n");
  const lineOf = new Int32Array(text.length);
  let at = 0;
  for (let k = 0; k < parts.length; k++) {
    const piece = parts[k] ?? "";
    const line = lines[k] ?? 0;
    lineOf.fill(line, at, at + piece.length);
    at += piece.length;
    if (k < parts.length - 1) {
      lineOf[at] = line;
      at += 1;
    }
  }
  return { name, text, lineOf };
}

/**
 * 창 하나가 **셀 만한 것인가.** 한글 음절이나 숫자가 하나도 없으면 안 센다.
 *
 * 뺀 것은 두 부류다. **괘선**(`─────`)은 접힌 공백을 지나도 18자 창을 채우고 111편에 다
 * 있다. **코드**는 `_reference/` 정본에서 추출한 것이라 편끼리 겹쳐도 그건 리프트가 아니라
 * 추출이다 — 그 대조는 `check-v2.ts` `P16` 몫이다.
 */
export function substantive(window: string): boolean {
  return /[가-힣0-9]/.test(window);
}

/**
 * 창마다 53비트 지문 하나. 32비트 둘을 굴려 이어 붙인다.
 *
 * 지문이 32비트뿐이면 창 387만 벌에서 충돌이 2천 번 넘게 나고, 그 충돌이 **없는 겹침을
 * 만들어 낸다.** 53비트면 기대 충돌이 0.001 회 미만이다. 그래도 화면에 내는 구간은
 * `guideFreq` 가 실제 문자열로 다시 세므로, 지문은 후보를 좁히는 데만 쓰인다.
 */
export function fingerprints(text: string, w: number = WINDOW): Float64Array {
  const n = Math.max(0, text.length - w + 1);
  const out = new Float64Array(n);
  if (n === 0) return out;
  let p1 = 1;
  let p2 = 1;
  for (let i = 0; i < w - 1; i++) {
    p1 = Math.imul(p1, 131);
    p2 = Math.imul(p2, 1000003);
  }
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = (Math.imul(h1, 131) + c) | 0;
    h2 = (Math.imul(h2, 1000003) + c) | 0;
    if (i >= w) {
      const gone = text.charCodeAt(i - w);
      h1 = (h1 - Math.imul(Math.imul(gone, p1), 131)) | 0;
      h2 = (h2 - Math.imul(Math.imul(gone, p2), 1000003)) | 0;
    }
    if (i >= w - 1) {
      out[i - w + 1] = (h1 >>> 0) * 2097152 + (h2 >>> 11);
    }
  }
  return out;
}

/** 편 하나 안의 자리를 수 하나로 담는 폭. 가장 긴 편이 10만 자를 넘으면 늘려야 한다. */
const SPAN = 1 << 21;

export interface Shingle {
  /** 이 창을 가진 편 번호. 오름차순이고 중복이 없다 — 이 길이가 **잣대 ④** 다. */
  guides: number[];
  /** 본문을 되찾을 자리 하나. `guide * SPAN + offset`. */
  at: number;
}

/** `Shingle.at` 이 가리키는 자리에서 그 창의 본문을 되찾는다. */
export function shingleText(corpus: Corpus, info: Shingle): string {
  const g = Math.floor(info.at / SPAN);
  const i = info.at % SPAN;
  return corpus.norms[g]?.text.slice(i, i + WINDOW) ?? "";
}

export interface Corpus {
  norms: Norm[];
  keys: Float64Array[];
  /** 창 지문 → 편 목록. **편 빈도 색인**이고 이 도구의 모든 판정이 여기서 나온다. */
  shingles: Map<number, Shingle>;
  /** 정규화한 줄 → 편 목록. 잣대 ① 이 여기서 나온다. */
  lines: Map<string, number[]>;
  /** 쉼표를 걷은 수치 토큰 → 편 목록. 잣대 ④ 를 값에 건 것. */
  values: Map<string, number[]>;
}

/**
 * 창 지문을 **두 번 훑어** 색인을 세운다.
 *
 * 한 번에 세우면 창 387만 벌이 전부 `Map` 에 들어가고, 그중 **276만 벌은 그 편에만 있는
 * 창**이라 겹침 판정에 쓰이지 않는다. 첫 훑기는 `Int16Array` 통에 「이 통을 스친 편이
 * 하나뿐인가」만 적고(칸당 2바이트), 둘째 훑기는 **둘 이상이 스친 통**의 창만 `Map` 에
 * 넣는다. 통이 겹쳐서 잘못 들어온 창은 지문이 달라 스스로 편 수 1 로 남는다.
 */
const MAX_BUCKET_BITS = 25;

/** 통 수는 창 수의 여덟 배쯤으로 잡는다 — 통이 빽빽하면 겹치지 않은 창이 둘째 훑기로 새어 든다. */
export function bucketBits(shingles: number): number {
  let bits = 12;
  while (bits < MAX_BUCKET_BITS && 1 << bits < shingles * 8) bits++;
  return bits;
}

export function buildCorpus(norms: Norm[]): Corpus {
  const keys = norms.map((n) => fingerprints(n.text));
  const bits = bucketBits(keys.reduce((a, k) => a + k.length, 0));
  const mask = (1 << bits) - 1;
  const state = new Int16Array(1 << bits).fill(-1);
  const MULTI = -2;
  for (let g = 0; g < keys.length; g++) {
    const k = keys[g] ?? new Float64Array(0);
    for (let i = 0; i < k.length; i++) {
      const bucket = ((k[i] ?? 0) % 4294967296) & mask;
      const seen = state[bucket] ?? -1;
      if (seen === -1) state[bucket] = g;
      else if (seen !== g && seen !== MULTI) state[bucket] = MULTI;
    }
  }

  const shingles = new Map<number, Shingle>();
  for (let g = 0; g < keys.length; g++) {
    const k = keys[g] ?? new Float64Array(0);
    const text = norms[g]?.text ?? "";
    for (let i = 0; i < k.length; i++) {
      const key = k[i] ?? 0;
      if (state[(key % 4294967296) & mask] !== MULTI) continue;
      if (!substantive(text.slice(i, i + WINDOW))) continue;
      const hit = shingles.get(key);
      if (hit === undefined)
        shingles.set(key, { guides: [g], at: g * SPAN + i });
      else if (hit.guides[hit.guides.length - 1] !== g) hit.guides.push(g);
    }
  }

  // **한 편에만 있는 창은 버린다.** 겹침이 아니라서 이 도구가 쓸 일이 없고, 남겨 두면
  // 그 수가 화면에 「겹치지 않은 창」처럼 보이는데 실제로는 통이 겹쳐 새어 든 것까지 섞인
  // 값이라 **아무것도 뜻하지 않는다**(통 크기를 바꾸면 27만이 296만이 된다).
  for (const [key, info] of shingles)
    if (info.guides.length < LIFT_GUIDES) shingles.delete(key);

  const lines = new Map<string, number[]>();
  const values = new Map<string, number[]>();
  for (let g = 0; g < norms.length; g++) {
    const text = norms[g]?.text ?? "";
    for (const line of new Set(text.split("\n"))) {
      if (line.length < WINDOW || !substantive(line)) continue;
      const hit = lines.get(line);
      if (hit === undefined) lines.set(line, [g]);
      else if (hit[hit.length - 1] !== g) hit.push(g);
    }
    for (const token of new Set(valueTokens(text))) {
      const hit = values.get(token);
      if (hit === undefined) values.set(token, [g]);
      else if (hit[hit.length - 1] !== g) hit.push(g);
    }
  }
  for (const [line, guides] of lines)
    if (guides.length < LIFT_GUIDES) lines.delete(line);
  for (const [value, guides] of values)
    if (guides.length < LIFT_GUIDES) values.delete(value);
  return { norms, keys, shingles, lines, values };
}

/**
 * 본문에서 **자릿수가 큰 수치**만 뽑아 쉼표를 걷는다.
 *
 * `4,999,950,000` 과 `4999950000` 을 같은 값으로 본다 — 옮겨 적으면서 쉼표 규약만 달라진
 * 것을 겹침에서 빠뜨리지 않으려는 것이다. 자릿수 하한(`VALUE_DIGITS`)이 있는 이유는
 * 연도·번호·작은 상수가 전부 편 수 111 로 나와 목록을 덮기 때문이다.
 */
export function valueTokens(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\d[\d,]*/g)) {
    const digits = m[0].replace(/,/g, "");
    if (digits.length >= VALUE_DIGITS) out.push(digits);
  }
  return out;
}

export type Band = "혼자" | "리프트" | "소수" | "다수" | "관례";

/** 잣대 ④ — **편 수 하나가 대역을 정한다.** 화면이 갈리는 자리가 여기다. */
export function band(count: number): Band {
  if (count < LIFT_GUIDES) return "혼자";
  if (count === LIFT_GUIDES) return "리프트";
  if (count >= CONVENTION_GUIDES) return "관례";
  return count < 10 ? "소수" : "다수";
}

export interface RunSpan {
  aStart: number;
  bStart: number;
  /** 이어붙은 창의 개수. */
  windows: number;
  /** 그 구간의 글자 수 — **잣대 ③**. */
  chars: number;
}

/**
 * 두 편에서 **창이 나란히 이어지는 가장 긴 구간들**을 찾는다 — 잣대 ③.
 *
 * `shared` 에 든 창만 이어 준다. 그래서 이 함수를 리프트 대역 창으로만 부르면 **관례 문구가
 * 구간을 이어 주는 일이 없다** — 그 이음을 허용하면 서로 무관한 두 토막이 「200자 겹침」
 * 하나로 붙어 나온다.
 *
 * `maxRepeat` 은 한 창이 상대 편에서 여러 자리에 나올 때의 상한이다. 표처럼 같은 꼴이
 * 반복되는 자리에서 짝이 제곱으로 불어나는 것을 막는다.
 */
export function commonRuns(
  a: Float64Array,
  b: Float64Array,
  shared: Set<number>,
  maxRepeat = 8,
): RunSpan[] {
  const posB = new Map<number, number[]>();
  for (let j = 0; j < b.length; j++) {
    const key = b[j] ?? 0;
    if (!shared.has(key)) continue;
    const list = posB.get(key);
    if (list === undefined) posB.set(key, [j]);
    else if (list.length < maxRepeat) list.push(j);
  }
  const out: RunSpan[] = [];
  for (let i = 0; i < a.length; i++) {
    const key = a[i] ?? 0;
    const list = posB.get(key);
    if (list === undefined) continue;
    for (const j of list) {
      // 앞 칸이 이미 짝이면 이 자리는 구간의 시작이 아니다 — 같은 구간을 길이만큼 다시
      // 내지 않으려는 것이다.
      if (i > 0 && j > 0) {
        const pa = a[i - 1] ?? 0;
        if (pa === (b[j - 1] ?? -1) && shared.has(pa)) continue;
      }
      let len = 1;
      while (i + len < a.length && j + len < b.length) {
        const na = a[i + len] ?? 0;
        if (na !== (b[j + len] ?? -1) || !shared.has(na)) break;
        len++;
      }
      out.push({ aStart: i, bStart: j, windows: len, chars: len + WINDOW - 1 });
    }
  }
  return out.sort((x, y) => y.chars - x.chars);
}

/**
 * 화면에 낼 때만 구간을 **줄 경계까지 넓힌다.**
 *
 * 잣대 ③ 은 글자 단위라 구간이 줄 한가운데서 시작하고 끝난다 — 실제로 `urn (` 이나
 * `^2 \cdot 2^{-53}` 같은 토막이 나왔다. 그 토막으로는 사람이 어느 자리인지 알 수 없다.
 * **재는 값은 그대로 두고 보이는 것만 넓힌다** — 넓힌 글자를 겹침으로 세면 잣대가 부푼다.
 */
export function snapToLines(
  text: string,
  start: number,
  chars: number,
): { text: string; from: number } {
  const left = text.lastIndexOf("\n", start) + 1;
  const found = text.indexOf("\n", start + chars);
  const right = found < 0 ? text.length : found;
  return { text: text.slice(left, right), from: left };
}

/**
 * 그 문자열을 쓰는 **편 수**를 실제로 센다 — `grep -rlF` 와 같은 뜻이다.
 *
 * 색인의 편 수는 창 하나에 대한 것이라, 창이 이어붙은 긴 구간에서는 **상한**일 뿐이다.
 * 화면에 내는 구간은 여기서 다시 센다 — 사람이 다시 세지 않게 하는 것이 이 도구의 목적인데
 * 상한을 내면 그 자리에서 사람이 세게 된다.
 */
export function guideFreq(needle: string, norms: Norm[]): number {
  let n = 0;
  for (const norm of norms) if (norm.text.includes(needle)) n++;
  return n;
}

export interface PairReport {
  a: string;
  b: string;
  /** 잣대 ① — 두 편에만 있는 완전 일치 줄. */
  exactLines: string[];
  /** 잣대 ② — 두 편에만 있는 창 수. */
  windows: number;
  /** 잣대 ③ — 가장 긴 구간. `text` 가 잰 것이고 `display` 는 줄 경계까지 넓힌 것이다. */
  longest: {
    text: string;
    display: string;
    chars: number;
    aLine: number;
    bLine: number;
  } | null;
  /** 잣대 ④ — 가장 긴 구간을 실제로 쓰는 편 수. */
  freq: number;
}

/** 편 번호 쌍 하나를 수로 담는다. 편이 200 을 넘으면 늘려야 한다. */
const pairId = (a: number, b: number): number => a * 200 + b;

/**
 * 리프트 대역(편 수 = 2)만 쌍으로 펼친다. **관례 대역은 여기 들어오지 않는다.**
 */
export function liftPairs(corpus: Corpus, minRun: number): PairReport[] {
  const byPair = new Map<number, Set<number>>();
  for (const [key, info] of corpus.shingles) {
    if (info.guides.length !== LIFT_GUIDES) continue;
    const [a, b] = info.guides;
    if (a === undefined || b === undefined) continue;
    const id = pairId(a, b);
    const set = byPair.get(id);
    if (set === undefined) byPair.set(id, new Set([key]));
    else set.add(key);
  }

  const linesByPair = new Map<number, string[]>();
  for (const [line, guides] of corpus.lines) {
    if (guides.length !== LIFT_GUIDES) continue;
    const [a, b] = guides;
    if (a === undefined || b === undefined) continue;
    const id = pairId(a, b);
    const list = linesByPair.get(id);
    if (list === undefined) linesByPair.set(id, [line]);
    else list.push(line);
  }

  const out: PairReport[] = [];
  for (const [id, shared] of byPair) {
    const a = Math.floor(id / 200);
    const b = id % 200;
    const ka = corpus.keys[a];
    const kb = corpus.keys[b];
    const na = corpus.norms[a];
    const nb = corpus.norms[b];
    if (
      ka === undefined ||
      kb === undefined ||
      na === undefined ||
      nb === undefined
    )
      continue;
    const runs = commonRuns(ka, kb, shared);
    const top = runs[0];
    if (top === undefined || top.chars < minRun) continue;
    const text = na.text.slice(top.aStart, top.aStart + top.chars);
    const shownA = snapToLines(na.text, top.aStart, top.chars);
    const shownB = snapToLines(nb.text, top.bStart, top.chars);
    out.push({
      a: na.name,
      b: nb.name,
      exactLines: linesByPair.get(id) ?? [],
      windows: shared.size,
      longest: {
        text,
        display: shownA.text,
        chars: top.chars,
        aLine: na.lineOf[shownA.from] ?? 0,
        bLine: nb.lineOf[shownB.from] ?? 0,
      },
      freq: guideFreq(text, corpus.norms),
    });
  }
  return sortPairs(out, "chars");
}

export type SortKey = "chars" | "windows" | "lines";

/**
 * 잣대 하나로만 줄을 세우면 **다른 잣대에서 큰 부채가 화면 밖으로 밀린다.**
 *
 * `kadane ↔ maximumProductSubarray` 는 최장 구간이 85자라 잣대 ③ 으로 세우면 스물째 밖인데,
 * 두 편에만 있는 창이 2,525 벌이고 완전 일치 줄이 43 개다 — 토막 겹침이 문서 전체에 퍼진
 * 모양이라 한 자리를 고쳐서 끝나지 않는다. 세 잣대를 모두 줄 세울 수 있게 둔다.
 */
export function sortPairs(pairs: PairReport[], by: SortKey): PairReport[] {
  const chars = (p: PairReport) => p.longest?.chars ?? 0;
  const rank: Record<SortKey, (p: PairReport) => number> = {
    chars,
    windows: (p) => p.windows,
    lines: (p) => p.exactLines.length,
  };
  const key = rank[by] ?? chars;
  return [...pairs].sort(
    (x, y) => key(y) - key(x) || y.windows - x.windows || chars(y) - chars(x),
  );
}

/**
 * 관례 대역(편 수 ≥ 60)을 **규모와 대표 문구**로만 낸다.
 *
 * 쌍으로 펼치지 않는다 — 편 60 개짜리 문구 하나가 쌍 1,770 개를 낳고, 그 목록이 리프트를
 * 덮는다. 그것이 이 도구가 대역을 먼저 가르는 이유다.
 */
export interface Convention {
  /** 편 수를 실제로 센 문자열. */
  text: string;
  /** 줄 경계까지 넓힌 것 — 화면용. */
  display: string;
  guides: number;
}

export function conventions(corpus: Corpus, limit: number): Convention[] {
  const seeds = new Map<string, string>();
  for (let g = 0; g < corpus.keys.length; g++) {
    const k = corpus.keys[g] ?? new Float64Array(0);
    const text = corpus.norms[g]?.text ?? "";
    let i = 0;
    while (i < k.length) {
      const info = corpus.shingles.get(k[i] ?? 0);
      if (info === undefined || info.guides.length < CONVENTION_GUIDES) {
        i++;
        continue;
      }
      let len = 1;
      while (i + len < k.length) {
        const next = corpus.shingles.get(k[i + len] ?? 0);
        if (next === undefined || next.guides.length < CONVENTION_GUIDES) break;
        len++;
      }
      const chars = len + WINDOW - 1;
      const measured = text.slice(i, i + chars);
      if (!seeds.has(measured))
        seeds.set(measured, snapToLines(text, i, chars).text);
      i += len;
    }
  }
  const scored = [...seeds.entries()]
    .sort((a, b) => b[0].length - a[0].length)
    .slice(0, 80)
    .map(([text, display]) => ({
      text,
      display,
      guides: guideFreq(text, corpus.norms),
    }))
    .filter((s) => s.guides >= CONVENTION_GUIDES)
    .sort((a, b) => b.guides - a.guides || b.text.length - a.text.length);
  // 한 문구가 다른 문구를 품고 있으면 뒤엣것만 남긴다 — 같은 머리글이 앞뒤 한 글자만 달리해
  // 열 줄을 채우던 것을 막는다.
  const out: Convention[] = [];
  for (const s of scored) {
    if (out.some((k) => k.text.includes(s.text) || s.text.includes(k.text)))
      continue;
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * 쉼표를 걷은 수치가 원문 어느 줄에 있는지 찾는다. 쉼표 규약이 편마다 달라서 글자 그대로
 * 찾으면 한쪽을 놓친다 — 자릿수 사이마다 쉼표를 허용해 되찾는다.
 */
export function findValue(norm: Norm, digits: string): number {
  const pattern = new RegExp(
    `(?<![\\d,])${digits.split("").join(",?")}(?![\\d,])`,
  );
  const hit = pattern.exec(norm.text);
  return hit?.index === undefined ? 0 : (norm.lineOf[hit.index] ?? 0);
}

export interface ValueLift {
  value: string;
  a: string;
  b: string;
  aLine: number;
  bLine: number;
}

/** 잣대 ④ 를 수치 토큰에 건 것. 두 편만 쓰는 큰 수치가 리프트 후보다. */
export function valueLifts(corpus: Corpus): ValueLift[] {
  const out: ValueLift[] = [];
  for (const [value, guides] of corpus.values) {
    if (guides.length !== LIFT_GUIDES) continue;
    const [a, b] = guides;
    const na = corpus.norms[a ?? -1];
    const nb = corpus.norms[b ?? -1];
    if (na === undefined || nb === undefined) continue;
    out.push({
      value,
      a: na.name,
      b: nb.name,
      aLine: findValue(na, value),
      bLine: findValue(nb, value),
    });
  }
  return out.sort(
    (x, y) => y.value.length - x.value.length || x.value.localeCompare(y.value),
  );
}

/** 잣대 ④ 의 대역별 규모. **화면의 첫 칸이고, 목록보다 먼저 나온다.** */
export function bandSummary(counts: Iterable<number>): Record<Band, number> {
  const out: Record<Band, number> = {
    혼자: 0,
    리프트: 0,
    소수: 0,
    다수: 0,
    관례: 0,
  };
  for (const c of counts) out[band(c)]++;
  return out;
}

const cut = (s: string, n: number): string =>
  s.length <= n ? s : `${s.slice(0, n)}…`;

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(name);
    return i < 0 ? undefined : argv[i + 1];
  };
  const top = Number(flag("--top") ?? 25);
  const minRun = Number(flag("--min-run") ?? 40);
  const sortBy = (flag("--sort") ?? "chars") as SortKey;
  const targets = argv.filter(
    (a, i) => !a.startsWith("--") && !argv[i - 1]?.startsWith("--"),
  );

  const started = Bun.nanoseconds();
  const files = await v2Guides();
  if (files.length === 0) {
    console.error("대상 가이드가 없다.");
    process.exit(2);
  }
  // 편 빈도는 **언제나 전수로** 잰다. 두 편만 지정해도 그 겹침이 관례인지 리프트인지는
  // 나머지 109편이 정한다 — 두 편만 읽으면 편 수가 늘 2 로 나와 전부 리프트가 된다.
  const norms = files.map((f) =>
    normalize(f, readFileSync(join(ROOT, f), "utf8")),
  );
  const corpus = buildCorpus(norms);

  const summary = bandSummary(
    [...corpus.shingles.values()].map((s) => s.guides.length),
  );
  const lineSummary = bandSummary(
    [...corpus.lines.values()].map((g) => g.length),
  );
  const valueSummary = bandSummary(
    [...corpus.values.values()].map((g) => g.length),
  );

  const pairsAll = sortPairs(liftPairs(corpus, minRun), sortBy);
  const pairs =
    targets.length === 2
      ? pairsAll.filter(
          (p) =>
            (p.a.endsWith(targets[0] ?? " ") &&
              p.b.endsWith(targets[1] ?? " ")) ||
            (p.a.endsWith(targets[1] ?? " ") && p.b.endsWith(targets[0] ?? " ")),
        )
      : pairsAll;

  if (argv.includes("--json")) {
    console.log(
      JSON.stringify(
        {
          guides: files.length,
          summary,
          lineSummary,
          valueSummary,
          pairs: pairs.slice(0, top),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const values = valueLifts(corpus);
  const conv = conventions(corpus, 10);
  const elapsed = (Bun.nanoseconds() - started) / 1e9;

  console.log(
    `가이드 ${files.length}편 · 창 ${WINDOW}자 · 리프트 = 편 수 ${LIFT_GUIDES} · 관례 = 편 수 ${CONVENTION_GUIDES} 이상\n`,
  );

  console.log("── 잣대 ④ 편 빈도 — 대역부터 가른다. 겹친 것만 센다 ──");
  const row = (what: string, s: Record<Band, number>) =>
    console.log(
      `  ${what.padEnd(12)} 리프트 ${String(s.리프트).padStart(7)} · 소수 ${String(s.소수).padStart(6)} · 다수 ${String(s.다수).padStart(5)} · 관례 ${String(s.관례).padStart(5)}`,
    );
  row("① 완전 일치 줄", lineSummary);
  row(`② ${WINDOW}자 창`, summary);
  row("④ 수치 토큰", valueSummary);

  const sortName = {
    chars: "최장 구간",
    windows: "겹친 창",
    lines: "완전 일치 줄",
  };
  console.log(
    `\n── 리프트 후보 — 두 편에만 있는 구간 ${minRun}자 이상인 쌍 ${pairsAll.length} · ${sortName[sortBy] ?? sortName.chars} 순 ──`,
  );
  if (pairs.length === 0) console.log("  없다.");
  for (const [i, p] of pairs.slice(0, top).entries()) {
    const l = p.longest;
    console.log(
      `\n${String(i + 1).padStart(3)}. 최장 ${l?.chars ?? 0}자 · 창 ${p.windows} · 완전 일치 줄 ${p.exactLines.length} · 편 수 ${p.freq}`,
    );
    console.log(`     ${p.a}:${l?.aLine ?? 0}`);
    console.log(`     ${p.b}:${l?.bLine ?? 0}`);
    const shown = (l?.display ?? "").split("\n");
    for (const line of shown.slice(0, 4))
      console.log(`       ${cut(line, 96)}`);
    if (shown.length > 4) console.log(`       … ${shown.length - 4}줄 더`);
  }
  if (pairs.length > top)
    console.log(`\n  … 그 밖 ${pairs.length - top} 쌍(--top 으로 더 본다)`);

  console.log(
    `\n── 값 겹침 — 두 편만 쓰는 ${VALUE_DIGITS}자리 이상 수치 ${values.length} ──`,
  );
  for (const v of values.slice(0, 12)) {
    console.log(
      `  ${v.value.padStart(20)}  ${v.a}:${v.aLine}  ↔  ${v.b}:${v.bLine}`,
    );
  }
  if (values.length > 12) console.log(`  … 그 밖 ${values.length - 12}`);

  console.log(
    `\n── 관례 — 편 ${CONVENTION_GUIDES} 이상이 쓰는 구간. 여기는 부채가 아니다 ──`,
  );
  for (const c of conv) {
    console.log(
      `  ${String(c.guides).padStart(3)}편  ${cut(c.display.split("\n").join(" ⏎ "), 92)}`,
    );
  }

  console.log(
    `\n부채 목록이지 위반이 아니다 — 무엇이 리프트인지는 사람이 정한다. (${elapsed.toFixed(2)}초)`,
  );
  if (argv.includes("--fail-on-lift") && pairs.length > 0) process.exit(1);
}
