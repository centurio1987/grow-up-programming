import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`fastPower(3n, 26n, 1000n)`)을
 * 쓴다. 프레임 수는 그 절의 T# 단계 수(7)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` 단독 조합의 여섯 선례를 그대로 따른다
 *
 * 선례는 `minMaxPair-guide.sim.ts` 가 세웠다. 고르는 기준 둘이 여기서도 맞는다 —
 * ① 입력이 값 셋(`base`·`exp`·`mod`)뿐이라 그릴 배열이 없고 ② 움직이는 것이 스칼라
 * 셋(`result`·`b`·`e`)과 누적 곱셈뿐이다. `array` 를 더하면 담을 배열이 없어 빈 칸이 된다.
 *
 * 1. **`keyValue` 단독은 「보이는 것이 값뿐인 절차」의 뷰다.** 이 편이 그렇다 — 자리가 아니라
 *    값 자체가 이해의 대상이고, 지수의 비트는 `e` 의 최하위 자리 하나로만 읽힌다.
 * 2. **항목을 프레임마다 같은 것으로 같은 순서로 두고 값만 바꾼다.** 값이 없는 자리도 항목을
 *    빼지 않고 `—` 로 적는다. 하나가 빠지면 아래가 한 칸씩 올라가 독자가 자리를 다시 센다.
 * 3. **항목 순서는 「지금 실행하는 갈래 → 그 갈래가 보는 값과 결과 → 상태 → 답」이다.**
 *    첫 항목이 `갈래`, 마지막 항목이 반환값이 될 `result` 다.
 * 4. **자리도 값으로 적는다.** 배열 패널이 없으니 「비트 자리 3」처럼 자리와 값을 함께 적어야
 *    독자가 어디를 보고 있는지 안다. 표기는 본문과 글자 그대로 같게 쓴다.
 * 5. **프레임 하나가 바퀴 하나다.** 이 편이 세는 비용이 모듈러 곱셈 횟수라 `누적 곱셈` 을
 *    항목으로 두고, 마지막 프레임의 값이 본문이 유도한 `n + s` 와 같게 맞춘다.
 * 6. **`label` 은 본문 기호표의 이름과 글자 그대로 같게 쓴다** — 여기서는 `b`·`e`·`result` 다.
 */
export const powBits = {
  view: ["keyValue"] as const,
  title: "fastPower(3n, 26n, 1000n) — 바퀴 하나가 비트 하나다",
  result: "329n",
  steps: [
    {
      title: "T1 초기화 — ① 두 값을 법 안으로 옮긴다",
      detail:
        "result 를 1 % 1000 = 1 로, b 를 3 % 1000 = 3 으로, e 를 26 으로 둔다. 아직 바퀴에 들어가지 않았다.",
      entries: [
        { label: "갈래", value: "① 초기화" },
        { label: "이번 비트", value: "—" },
        { label: "비트 자리", value: "—" },
        { label: "b", value: 3 },
        { label: "e", value: "26 (11010)" },
        { label: "누적 곱셈", value: 0 },
        { label: "result", value: 1 },
      ],
    },
    {
      title: "T2 비트 자리 0 — ④ 제곱만",
      detail:
        "e = 26 의 최하위 비트가 0 이라 ③ 을 건너뛴다. b 가 3 에서 9 로 제곱되고 e 가 13 이 된다.",
      entries: [
        { label: "갈래", value: "② 참 · ③ 건너뜀 · ④⑤ 실행" },
        { label: "이번 비트", value: 0 },
        { label: "비트 자리", value: 0 },
        { label: "b", value: 3 },
        { label: "e", value: "26 (11010)" },
        { label: "누적 곱셈", value: 1 },
        { label: "result", value: 1 },
      ],
    },
    {
      title: "T3 비트 자리 1 — ③ 누적 뒤 ④ 제곱",
      detail:
        "e = 13 의 최하위 비트가 1 이라 result 에 b = 9 를 곱한다. 그다음 b 가 81 이 되고 e 가 6 이 된다.",
      entries: [
        { label: "갈래", value: "② 참 · ③④⑤ 실행" },
        { label: "이번 비트", value: 1 },
        { label: "비트 자리", value: 1 },
        { label: "b", value: 9 },
        { label: "e", value: "13 (1101)" },
        { label: "누적 곱셈", value: 3 },
        { label: "result", value: 9 },
      ],
    },
    {
      title: "T4 비트 자리 2 — ④ 제곱만",
      detail:
        "e = 6 의 최하위 비트가 0 이라 result 는 9 그대로다. b 가 81 에서 561 로 제곱되고 e 가 3 이 된다.",
      entries: [
        { label: "갈래", value: "② 참 · ③ 건너뜀 · ④⑤ 실행" },
        { label: "이번 비트", value: 0 },
        { label: "비트 자리", value: 2 },
        { label: "b", value: 81 },
        { label: "e", value: "6 (110)" },
        { label: "누적 곱셈", value: 4 },
        { label: "result", value: 9 },
      ],
    },
    {
      title: "T5 비트 자리 3 — ③ 누적 뒤 ④ 제곱",
      detail:
        "e = 3 의 최하위 비트가 1 이라 result 가 9 · 561 = 5049 를 법 1000 으로 줄인 49 가 된다. b 는 721 이 되고 e 는 1 이 된다.",
      entries: [
        { label: "갈래", value: "② 참 · ③④⑤ 실행" },
        { label: "이번 비트", value: 1 },
        { label: "비트 자리", value: 3 },
        { label: "b", value: 561 },
        { label: "e", value: "3 (11)" },
        { label: "누적 곱셈", value: 6 },
        { label: "result", value: 49 },
      ],
    },
    {
      title: "T6 비트 자리 4 — 마지막 1 비트",
      detail:
        "e = 1 의 최하위 비트가 1 이라 result 가 49 · 721 = 35329 를 법 1000 으로 줄인 329 가 된다. e 가 0 이 되어 다음 검사에서 바퀴가 끝난다.",
      entries: [
        { label: "갈래", value: "② 참 · ③④⑤ 실행" },
        { label: "이번 비트", value: 1 },
        { label: "비트 자리", value: 4 },
        { label: "b", value: 721 },
        { label: "e", value: "1 (1)" },
        { label: "누적 곱셈", value: 8 },
        { label: "result", value: 329 },
      ],
    },
    {
      title: "T7 종료 — ② 거짓",
      detail:
        "e 가 0 이라 ② 가 거짓이 되고 result 를 돌려준다. 누적 곱셈 8 은 비트 수 5 와 1 인 비트 3 의 합이다.",
      entries: [
        { label: "갈래", value: "② 거짓 · 반환" },
        { label: "이번 비트", value: "—" },
        { label: "비트 자리", value: "—" },
        { label: "b", value: 841 },
        { label: "e", value: "0" },
        { label: "누적 곱셈", value: 8 },
        { label: "result", value: 329 },
      ],
    },
  ] satisfies Frame[],
};
