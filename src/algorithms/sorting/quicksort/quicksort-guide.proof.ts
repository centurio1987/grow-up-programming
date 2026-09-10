/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../tools/check-proof.ts quicksort-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { quickSort } from "./quicksort-guide.ref.ts";

/** 대조에 쓰는 입력. 본문 불변식 절이 드는 것과 같다. */
const INPUTS: number[][] = [
  [5, 2, 3, 1],
  [5, 1, 1, 2, 0, 0],
  [-10, 5, -3, 0, 8, -1],
];

/** `[5 2 3 1]` 꼴 — 본문 표기와 같다(쉼표 없이 공백). */
const show = (xs: number[]): string => `[${xs.join(" ")}]`;

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

/**
 * 불변식을 지키던 줄(`i++`) 하나를 지운 사본. **정본 소스에서 기계로 만든다** — 맞는 줄이
 * 정확히 하나가 아니면 `loadMutant` 가 던진다. 손으로 베낀 사본이면 「한 곳만 바꿨다」가
 * 검사되지 않는다.
 */
const broken = await loadMutant<{ quickSort(nums: number[]): number[] }>(
  new URL("./quicksort-guide.ref.ts", import.meta.url).pathname,
  { drop: /^\s*i\+\+;\s*$/ },
);

const rows = INPUTS.map((input) => ({
  input: show(input),
  correct: show(quickSort([...input])),
  broken: show(broken.quickSort([...input])),
}));

// 하나도 안 깨지면 이 절의 주장이 성립하지 않는다. 실행이 그것을 판정한다.
if (rows.every((r) => r.correct === r.broken)) {
  throw new Error(
    "변이가 어느 입력에서도 결과를 바꾸지 못했다 — 「깨진다」가 거짓이다",
  );
}

const c1 = Math.max(...rows.map((r) => width(r.input)));
const c2 = Math.max(width("바른 코드"), ...rows.map((r) => width(r.correct)));

export const PROOFS: Record<string, () => string> = {
  /**
   * 「틀린다」가 아니라 **실제 값**을 내미는 것이 이 블록의 일이다 — 옛 이해 시험 `V5` 가
   * 묻던 것이고, 모델은 값이 그럴듯하면 통과시켰지만 실행은 한 글자만 달라도 잡는다.
   */
  "mutant-i-inc": () =>
    [
      `${pad("", c1)}   ${pad("바른 코드", c2)}   i++ 를 지운 코드`,
      ...rows.map(
        (r) => `${pad(r.input, c1)} → ${pad(r.correct, c2)} → ${r.broken}`,
      ),
      `${pad("", c1 + 3 + c2 + 3)}└ 셋 다 정렬돼 있지 않다`,
    ].join("\n"),
};
