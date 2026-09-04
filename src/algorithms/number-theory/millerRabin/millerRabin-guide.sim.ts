import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`millerRabin(49141n)`)을 쓴다.
 * 프레임 수는 그 절의 T# 단계 수(8)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` 단독 조합을 고른 이유
 *
 * 선례는 `minMaxPair-guide.sim.ts` 가 세웠고 같은 카테고리의 `fastPower` 가 이었다. 고르는
 * 기준 둘이 여기서도 맞는다 — ① 입력이 정수 하나(`n`)뿐이라 그릴 배열이 없고 ② 움직이는
 * 것이 스칼라 넷(`a`·`x`·`d`·`s`)과 밑 목록의 진행뿐이다. `array` 를 더하면 담을 배열이
 * 없어 빈 칸이 된다.
 *
 * 1. **항목을 프레임마다 같은 것으로 같은 순서로 둔다.** 값이 없는 자리도 항목을 빼지 않고
 *    `—` 로 적는다. 하나가 빠지면 아래가 한 칸씩 올라가 독자가 자리를 다시 센다.
 * 2. **항목 순서는 「지금 실행하는 갈래 → 그 갈래가 보는 값 → 상태 → 답」이다.** 첫 항목이
 *    `갈래`, 마지막 항목이 반환값이 될 `판정` 이다.
 * 3. **자리도 값으로 적는다.** 밑 목록을 그리는 패널이 없으니 「밑 2 (12 개 중 1 번째)」처럼
 *    자리와 값을 함께 적어야 독자가 어디를 보고 있는지 안다.
 * 4. **`label` 은 본문 기호표의 이름과 글자 그대로 같게 쓴다** — `n`·`a`·`d`·`s`·`x` 다.
 * 5. **`fastPower` 와 갈리는 자리 하나를 적어 둔다.** 그 편은 프레임 하나가 지수의 비트
 *    하나였는데 이 편은 **프레임 하나가 제곱 수열의 한 자리**다. 거듭제곱 자체는 이 편에서
 *    한 걸음(`④`)으로 접히고, 그 안쪽은 `fastPower` 편이 이미 열어 두었다.
 */
export const mrWalk = {
  view: ["keyValue"] as const,
  title: "millerRabin(49141n) — 밑 2 는 통과하고 밑 3 이 증인이 된다",
  result: "false",
  steps: [
    {
      title: "T1 — ① 2 보다 작은가",
      detail:
        "49,141 은 2 이상이라 ① 이 거짓이다. 아직 나눗셈도 곱셈도 한 번 하지 않았다.",
      entries: [
        { label: "갈래", value: "① 2 보다 작은가 — 거짓" },
        { label: "n", value: "49,141" },
        { label: "a", value: "—" },
        { label: "d", value: "—" },
        { label: "s", value: "—" },
        { label: "x", value: "—" },
        { label: "누적 모듈러 곱셈", value: 0 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T2 — ② 밑 열둘로 나눠 본다",
      detail:
        "밑 2 부터 37 까지 나머지가 1 1 1 1 4 1 11 7 13 15 6 5 로 하나도 0 이 아니다. 여기를 지났으므로 49,141 의 소인수는 전부 37 보다 크다.",
      entries: [
        { label: "갈래", value: "② 밑 열둘로 나눠 본다 — 전부 거짓" },
        { label: "n", value: "49,141" },
        { label: "a", value: "2 … 37 (12 개 전부)" },
        { label: "d", value: "—" },
        { label: "s", value: "—" },
        { label: "x", value: "—" },
        { label: "누적 모듈러 곱셈", value: 0 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T3 — ③ n − 1 을 홀수와 2 의 거듭제곱으로 가른다",
      detail:
        "49,140 을 2 로 두 번 나누면 12,285 가 되고 그것이 홀수다. 그래서 d = 12,285 이고 s = 2 다.",
      entries: [
        { label: "갈래", value: "③ n − 1 을 가른다" },
        { label: "n", value: "49,141" },
        { label: "a", value: "—" },
        { label: "d", value: "12,285" },
        { label: "s", value: 2 },
        { label: "x", value: "—" },
        { label: "누적 모듈러 곱셈", value: 0 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T4 — ④⑤ 밑 2 의 첫 값",
      detail:
        "2^12285 mod 49141 = 32,527 이다. 1 도 아니고 49,140 도 아니라 ⑤ 가 거짓이고 제곱 루프로 내려간다. 이 거듭제곱 하나가 모듈러 곱셈 26 번이다.",
      entries: [
        { label: "갈래", value: "④ 첫 값 · ⑤ 거짓" },
        { label: "n", value: "49,141" },
        { label: "a", value: "2 (12 개 중 1 번째)" },
        { label: "d", value: "12,285" },
        { label: "s", value: 2 },
        { label: "x", value: "32,527" },
        { label: "누적 모듈러 곱셈", value: 26 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T5 — ⑥ 밑 2 를 한 번 제곱한다",
      detail:
        "32,527² = 1,058,005,729 이고 이것을 49,141 로 나눈 나머지가 49,140 = n − 1 이다. 밑 2 는 여기서 통과하고 다음 밑으로 넘어간다.",
      entries: [
        { label: "갈래", value: "⑥ 제곱해 n − 1 을 찾았다" },
        { label: "n", value: "49,141" },
        { label: "a", value: "2 (12 개 중 1 번째)" },
        { label: "d", value: "12,285" },
        { label: "s", value: 2 },
        { label: "x", value: "49,140" },
        { label: "누적 모듈러 곱셈", value: 27 },
        { label: "판정", value: "밑 2 통과" },
      ],
    },
    {
      title: "T6 — ④⑤ 밑 3 의 첫 값",
      detail:
        "3^12285 mod 49141 = 627 이다. 1 도 49,140 도 아니라 여기서도 ⑤ 가 거짓이다.",
      entries: [
        { label: "갈래", value: "④ 첫 값 · ⑤ 거짓" },
        { label: "n", value: "49,141" },
        { label: "a", value: "3 (12 개 중 2 번째)" },
        { label: "d", value: "12,285" },
        { label: "s", value: 2 },
        { label: "x", value: "627" },
        { label: "누적 모듈러 곱셈", value: 53 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T7 — ⑥ 밑 3 을 한 번 제곱한다",
      detail:
        "627² = 393,129 = 49,141 × 8 + 1 이라 나머지가 1 이다. 49,140 이 아니고 s = 2 이므로 제곱 루프는 여기서 끝난다.",
      entries: [
        { label: "갈래", value: "⑥ 제곱했는데 1 이 나왔다" },
        { label: "n", value: "49,141" },
        { label: "a", value: "3 (12 개 중 2 번째)" },
        { label: "d", value: "12,285" },
        { label: "s", value: 2 },
        { label: "x", value: 1 },
        { label: "누적 모듈러 곱셈", value: 54 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T8 — ⑦ 밑 3 이 증인이다",
      detail:
        "제곱 수열 627 → 1 이 n − 1 을 한 번도 거치지 않고 1 에 이르렀다. 밑 3 이 증인이므로 남은 밑 열은 보지 않고 false 를 돌려준다.",
      entries: [
        { label: "갈래", value: "⑦ 증인 — 반환" },
        { label: "n", value: "49,141" },
        { label: "a", value: "3 (12 개 중 2 번째)" },
        { label: "d", value: "12,285" },
        { label: "s", value: 2 },
        { label: "x", value: 1 },
        { label: "누적 모듈러 곱셈", value: 54 },
        { label: "판정", value: "합성수 — false" },
      ],
    },
  ] satisfies Frame[],
};
