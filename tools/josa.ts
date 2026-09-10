/**
 * 값에서 조사를 고른다 — 가이드 사이드카가 함께 쓰는 한 벌.
 *
 * ## 왜 공용인가
 *
 * 2026-09-10 실측으로 저장소에 **같은 일을 하는 헬퍼가 14 벌 · 여섯 모양**이 있었다. 규약은
 * 세 배치에 걸쳐 굳었는데(`KAN-034.7` 배치8·9·10) 벌마다 지키는 항이 달라서, 네 편이 원고에
 * `6을` 꼴을 찍고 있었다 — 이 저장소 표기는 `6 을` 이다(가이드 111편에서 띄어 쓴 자리 8,312
 * 대 붙여 쓴 자리 73).
 *
 * ## 계약 넷
 *
 * 1. **앞 공백을 포함해 돌려준다.** `${값}${을를(값)}` 이 `6 을` 이 된다. 부르는 쪽이 공백을
 *    적으면 벌마다 적기도 하고 안 적기도 해서 위 73 자리가 생겼다.
 * 2. **뒤 어미를 붙이지 않는다.** `" 를 낸다"` 를 돌려주지 않는다 — 어미가 붙으면 그 헬퍼는
 *    한 문장에서만 쓰이고 다음 편이 또 한 벌을 짠다.
 * 3. **조사만 돌려주고 값은 부르는 쪽이 적는다.** 값까지 돌려주면 `${값}${헬퍼(값)}` 을 쓴
 *    자리에서 값이 두 번 찍힌다 — `treeIsomorphism` 이 「잎 4 5 6 7 **4** 를」을 냈다.
 * 4. **`과/와` 도 받침 판정을 받는다.** 「4 와」·「6 과」가 갈린다.
 *
 * ## 받침을 어디서 보는가
 *
 * 앞말의 **마지막 글자**다. 숫자면 우리말로 읽었을 때의 받침을 본다 — 0 영 · 1 일 · 3 삼 ·
 * 6 육 · 7 칠 · 8 팔이 받침을 갖고 2 이 · 4 사 · 5 오 · 9 구는 없다. 끝이 0 이면 그 0 이
 * 아니라 **자리 이름**이 마지막 음절이다(100 은 「백」이라 받침이 있다).
 *
 * `로/으로` 만 세 갈래다 — `ㄹ` 받침을 받침 없음과 같이 다루므로 「으로」 쪽은 0 · 3 · 6 셋뿐이다.
 *
 * ```ts
 * import { 을를, 으로 } from "../../../../tools/josa.ts";
 * `답 ${comma(답)}${을를(comma(답))} 낸다`;  // 답 6 을 낸다
 * `칸 수는 ${comma(n)}${으로(comma(n))} 고정한다`;  // 칸 수는 64 로 고정한다
 * ```
 */

/** 앞말을 읽었을 때 마지막 음절의 받침 종류. */
export type Tail = "none" | "rieul" | "other";

/** 한 자리 수의 읽기 — 영(ㅇ) 일(ㄹ) 이 삼(ㅁ) 사 오 육(ㄱ) 칠(ㄹ) 팔(ㄹ) 구. */
const DIGIT_TAIL: readonly Tail[] = [
  "other",
  "rieul",
  "none",
  "other",
  "none",
  "none",
  "other",
  "rieul",
  "rieul",
  "none",
];

/** 자리 이름의 읽기 — 십(ㅂ) 백(ㄱ) 천(ㄴ) 만(ㄴ) 억(ㄱ) 조. 조만 받침이 없다. */
const unitTail = (zeros: number): Tail => (zeros >= 12 ? "none" : "other");

const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;
/** 종성 표에서 `ㄹ` 의 자리. */
const JONG_RIEUL = 8;

/** 끝에 붙은 숫자 덩어리의 읽기. `1,024` 처럼 자리 구분이 섞여도 본다. */
function tailOfDigits(digits: string): Tail {
  const bare = digits.replace(/[,_\s]/g, "");
  if (/^0+$/.test(bare)) return "other"; // 영
  let zeros = 0;
  while (bare[bare.length - 1 - zeros] === "0") zeros++;
  if (zeros > 0) return unitTail(zeros);
  const last = Number(bare[bare.length - 1]);
  return DIGIT_TAIL[last] ?? "other";
}

/**
 * 앞말의 마지막 음절 받침. 숫자·한글이 아닌 글자로 끝나면 **받침 있음**으로 본다 — `∞`
 * 처럼 읽는 소리를 모르는 자리에서 「∞ 를」보다 「∞ 을」이 덜 어긋난다.
 */
export function tailOf(앞: string | number | bigint): Tail {
  const text = typeof 앞 === "string" ? 앞.trimEnd() : String(앞);
  const run = /([0-9][0-9,_]*)$/.exec(text);
  if (run?.[1] !== undefined) return tailOfDigits(run[1]);
  const last = [...text].at(-1) ?? "";
  const code = last.codePointAt(0) ?? 0;
  if (code >= HANGUL_FIRST && code <= HANGUL_LAST) {
    const jong = (code - HANGUL_FIRST) % 28;
    if (jong === 0) return "none";
    return jong === JONG_RIEUL ? "rieul" : "other";
  }
  return "other";
}

/**
 * 받침이 있으면 앞엣것, 없으면 뒤엣것을 **앞 공백과 함께** 돌려준다.
 *
 * 계사가 갈리는 자리(「이다/다」·「이면/면」·「이고/고」)도 이 일반형으로 적는다 — 헬퍼가
 * 어미를 고정으로 달지 않는 것이 계약 2 다.
 */
export function josa(
  앞: string | number | bigint,
  받침있음: string,
  받침없음: string,
): string {
  return tailOf(앞) === "none" ? ` ${받침없음}` : ` ${받침있음}`;
}

/** 「 을」·「 를」. */
export const 을를 = (앞: string | number | bigint): string =>
  josa(앞, "을", "를");

/** 「 이」·「 가」. */
export const 이가 = (앞: string | number | bigint): string =>
  josa(앞, "이", "가");

/** 「 은」·「 는」. */
export const 은는 = (앞: string | number | bigint): string =>
  josa(앞, "은", "는");

/** 「 과」·「 와」. 계약 4 — 이 짝도 받침 판정을 받는다. */
export const 과와 = (앞: string | number | bigint): string =>
  josa(앞, "과", "와");

/** 「 으로」·「 로」. `ㄹ` 받침은 「 로」 쪽이라 세 갈래를 본다. */
export const 으로 = (앞: string | number | bigint): string =>
  tailOf(앞) === "other" ? " 으로" : " 로";
