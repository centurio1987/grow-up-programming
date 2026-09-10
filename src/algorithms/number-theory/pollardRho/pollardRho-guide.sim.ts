import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`pollardRho(8051n)`)을 쓴다.
 * 프레임 수는 그 절의 T# 단계 수를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` 단독 조합을 고른 이유
 *
 * 선례는 같은 카테고리의 `millerRabin`·`fastPower` 가 세웠고 고르는 기준 둘이 여기서도
 * 맞는다 — ① 입력이 정수 하나(`n`)뿐이라 그릴 배열이 없고 ② 움직이는 것이 스칼라 넷
 * (`c`·`x`·`y`·`d`)뿐이다. `array` 를 더하면 담을 배열이 없어 빈 칸이 된다.
 *
 * 1. **항목을 프레임마다 같은 것으로 같은 순서로 둔다.** 값이 없는 자리도 항목을 빼지 않고
 *    `—` 로 적는다. 하나가 빠지면 아래가 한 칸씩 올라가 독자가 자리를 다시 센다.
 * 2. **항목 순서는 「지금 실행하는 갈래 → 그 갈래가 보는 값 → 상태 → 답」이다.** 첫 항목이
 *    `갈래`, 마지막 항목이 반환값이 될 `판정` 이다.
 * 3. **`label` 은 본문 기호표의 이름과 글자 그대로 같게 쓴다** — `n`·`c`·`x`·`y`·`d` 다.
 * 4. **`millerRabin` 과 갈리는 자리 하나를 적어 둔다.** 그 편은 프레임 하나가 밑 하나의
 *    제곱 수열 한 자리였는데 이 편은 **프레임 하나가 두 자리를 한 번씩 나아가게 한 결과**다.
 *    소수 판정 자체는 이 편에서 한 걸음(`②`)으로 접히고, 그 안쪽은 그 편이 이미 열어 두었다.
 */
export const rhoWalk = {
  view: ["keyValue"] as const,
  title: "pollardRho(8051n) — 법 97 에서 먼저 겹치는 자리를 gcd 가 잡아낸다",
  result: "97n",
  steps: [
    {
      title: "T1 — ① 짝수인가",
      detail:
        "8,051 은 홀수라 ① 이 거짓이다. 짝수였다면 여기서 2 를 돌려주고 끝났다.",
      entries: [
        { label: "갈래", value: "① 짝수인가 — 거짓" },
        { label: "n", value: "8,051" },
        { label: "c", value: "—" },
        { label: "x", value: "—" },
        { label: "y", value: "—" },
        { label: "|x − y|", value: "—" },
        { label: "d", value: "—" },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T2 — ② 소수인가",
      detail:
        "8,051 = 83 × 97 이라 밑 열둘을 고정한 판정이 합성수라고 답한다. 소수였다면 여기서 n 자신을 돌려주고 끝났다.",
      entries: [
        { label: "갈래", value: "② 소수인가 — 거짓" },
        { label: "n", value: "8,051" },
        { label: "c", value: "—" },
        { label: "x", value: "—" },
        { label: "y", value: "—" },
        { label: "|x − y|", value: "—" },
        { label: "d", value: "—" },
        { label: "판정", value: "합성수 — 아래로" },
      ],
    },
    {
      title: "T3 — ③④ 수열 하나를 정하고 두 자리를 같은 곳에 둔다",
      detail:
        "c = 1 이므로 f(t) = (t² + 1) mod 8051 이다. x 와 y 를 둘 다 2 에 두고, d 는 계산하지 않고 1 로 둔다.",
      entries: [
        { label: "갈래", value: "③ 수열을 시작한다 · ④ d 를 1 로 둔다" },
        { label: "n", value: "8,051" },
        { label: "c", value: 1 },
        { label: "x", value: 2 },
        { label: "y", value: 2 },
        { label: "|x − y|", value: 0 },
        { label: "d", value: 1 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T4 — ⑤⑥ 한 걸음",
      detail:
        "x 는 f 를 한 번 거쳐 5 가 되고 y 는 두 번 거쳐 26 이 된다. |x − y| = 21 이고 gcd(21, 8051) = 1 이라 더 진행한다.",
      entries: [
        { label: "갈래", value: "⑤ 두 자리를 나아가게 한다 · ⑥ 최대공약수" },
        { label: "n", value: "8,051" },
        { label: "c", value: 1 },
        { label: "x", value: 5 },
        { label: "y", value: 26 },
        { label: "|x − y|", value: 21 },
        { label: "d", value: 1 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T5 — ⑤⑥ 두 걸음",
      detail:
        "x = 26, y = 7,474 이다. 법 97 에서는 26 과 5 라 아직 다르고, gcd(7448, 8051) = 1 이다.",
      entries: [
        { label: "갈래", value: "⑤ 두 자리를 나아가게 한다 · ⑥ 최대공약수" },
        { label: "n", value: "8,051" },
        { label: "c", value: 1 },
        { label: "x", value: 26 },
        { label: "y", value: "7,474" },
        { label: "|x − y|", value: "7,448" },
        { label: "d", value: 1 },
        { label: "판정", value: "미정" },
      ],
    },
    {
      title: "T6 — ⑤⑥ 세 걸음",
      detail:
        "x = 677, y = 871 이고 둘 다 법 97 에서 95 다. 차 194 = 2 × 97 이므로 gcd(194, 8051) = 97 이 되어 루프가 끝난다.",
      entries: [
        { label: "갈래", value: "⑤ 두 자리를 나아가게 한다 · ⑥ 최대공약수" },
        { label: "n", value: "8,051" },
        { label: "c", value: 1 },
        { label: "x", value: 677 },
        { label: "y", value: 871 },
        { label: "|x − y|", value: 194 },
        { label: "d", value: 97 },
        { label: "판정", value: "루프 종료" },
      ],
    },
    {
      title: "T7 — ⑦ 비자명한 약수를 반환한다",
      detail:
        "d = 97 이고 8,051 이 아니므로 그대로 돌려준다. 8,051 / 97 = 83 이고 둘 다 소수라 이 값은 실제로 소인수이지만, 계약이 요구하는 것은 「비자명한 약수」까지다.",
      entries: [
        { label: "갈래", value: "⑦ 비자명한 약수를 반환" },
        { label: "n", value: "8,051" },
        { label: "c", value: 1 },
        { label: "x", value: 677 },
        { label: "y", value: 871 },
        { label: "|x − y|", value: 194 },
        { label: "d", value: 97 },
        { label: "판정", value: "97 을 반환" },
      ],
    },
  ] satisfies Frame[],
};
