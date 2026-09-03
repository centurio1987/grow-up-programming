import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`binomialModP(34n, 20n, 7n)`)을
 * 쓴다. 프레임 수는 그 절의 T# 단계 수(7)와 같다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` 단독 — 같은 카테고리 세 편의 규약을 이어받고 하나를 더한다
 *
 * 이 절차가 움직이는 것은 수 몇 개(`num`·`den`·`inv`)와 지금 푸는 자리 하나뿐이라 배열도
 * 그래프도 트리도 그릴 것이 없다. `gcd`(`S37`)·`fastPower`(`S35`)·`extendedEuclidean`(`S38`)
 * 이 같은 이유로 이 뷰를 골랐다.
 *
 * 1. **이어받음 — 항목을 프레임마다 같은 것 같은 순서로 두고 없는 값은 `—` 로 둔다.**
 * 2. **이어받음 — 첫 항목이 지금 실행하는 갈래이고 마지막 항목이 그 자리의 답이다.**
 * 3. **이어받음 — 값을 안 바꾼 프레임에도 무엇을 안 바꿨는지 적는다.**
 * 4. **신설 — 「지금 푸는 자리」 항목을 둔다.** 이 편은 한 호출 안에서 끝나지 않고 자릿수마다
 *    작은 문제로 갈라진다. `num` 하나만 보면 그 값이 어느 자리의 것인지 알 수 없어서, 자리를
 *    항목으로 함께 낸다. `extendedEuclidean` 편의 「검산」 항목이 같은 자리를 다른 값으로
 *    채웠다.
 *
 * `label` 은 본문 기호표의 이름과 글자 그대로 같게 쓴다 — `j`·`num`·`den`·`inv` 다.
 */
export const lucasWalk = {
  view: "keyValue" as const,
  title: "binomialModP(34n, 20n, 7n) — 자리 둘로 갈라 각각 답한다",
  result: "6n",
  steps: [
    {
      title: "T1 경계를 거르고 자릿수 하나를 떼어 낸다",
      detail:
        "k = 20 이 0 과 34 사이라 ① 의 네 경계가 전부 거짓이다. n = 34 가 p = 7 이상이므로 ② 로 간다 — 34 를 7 로 나눈 나머지 6 과 몫 4, 20 을 7 로 나눈 나머지 6 과 몫 2 로 갈라 두 문제를 만든다.",
      entries: [
        { label: "갈래", value: "① 거짓 · ② 자리를 뗀다" },
        { label: "지금 푸는 자리", value: "n = 34, k = 20" },
        { label: "7 진 자릿수", value: "34 = 46, 20 = 26" },
        { label: "j", value: "—" },
        { label: "num", value: "—" },
        { label: "den", value: "—" },
        { label: "inv", value: "—" },
        { label: "이 자리의 답", value: "아직 없다" },
      ],
    },
    {
      title: "T2 낮은 자리 — k 가 n 과 같아 곧바로 1 이다",
      detail:
        "낮은 자리의 문제는 n = 6, k = 6 이다. ① 의 네 경계 중 k === n 이 참이라 반복에 들어가지 않고 1 을 돌려준다.",
      entries: [
        { label: "갈래", value: "① k === n 이 참 · 1 반환" },
        { label: "지금 푸는 자리", value: "n = 6, k = 6" },
        { label: "7 진 자릿수", value: "낮은 자리 하나" },
        { label: "j", value: "—" },
        { label: "num", value: "—" },
        { label: "den", value: "—" },
        { label: "inv", value: "—" },
        { label: "이 자리의 답", value: 1 },
      ],
    },
    {
      title: "T3 높은 자리 — 반복 횟수를 작은 쪽에 맞춘다",
      detail:
        "남은 자리의 문제는 n = 4, k = 2 다. 4 가 7 보다 작으므로 ② 를 건너뛰고 ③ 으로 간다. n - k = 2 와 k = 2 중 작은 쪽이 2 라 반복을 두 번 실행한다.",
      entries: [
        { label: "갈래", value: "② 거짓 · ③ 작은 쪽을 고른다" },
        { label: "지금 푸는 자리", value: "n = 4, k = 2" },
        { label: "7 진 자릿수", value: "높은 자리 하나" },
        { label: "j", value: 2 },
        { label: "num", value: 1 },
        { label: "den", value: 1 },
        { label: "inv", value: "—" },
        { label: "이 자리의 답", value: "아직 없다" },
      ],
    },
    {
      title: "T4 반복 1 — 분자에 4 를, 분모에 1 을 곱한다",
      detail:
        "i = 0 이다. num 에 n - i = 4 를 곱해 4 가 되고, den 에 i + 1 = 1 을 곱해 1 그대로다. 둘 다 7 로 나눈 나머지를 유지한다.",
      entries: [
        { label: "갈래", value: "④ 반복 첫 번째" },
        { label: "지금 푸는 자리", value: "n = 4, k = 2" },
        { label: "7 진 자릿수", value: "높은 자리 하나" },
        { label: "j", value: 2 },
        { label: "num", value: 4 },
        { label: "den", value: 1 },
        { label: "inv", value: "—" },
        { label: "이 자리의 답", value: "아직 없다" },
      ],
    },
    {
      title: "T5 반복 2 — 분자가 12 를 지나 5 가 된다",
      detail:
        "i = 1 이다. num 이 4 × 3 = 12 이고 12 를 7 로 나눈 나머지가 5 다. den 은 1 × 2 = 2 다. 반복이 두 번으로 끝나 다음은 ⑤ 다.",
      entries: [
        { label: "갈래", value: "④ 반복 두 번째" },
        { label: "지금 푸는 자리", value: "n = 4, k = 2" },
        { label: "7 진 자릿수", value: "높은 자리 하나" },
        { label: "j", value: 2 },
        { label: "num", value: 5 },
        { label: "den", value: 2 },
        { label: "inv", value: "—" },
        { label: "이 자리의 답", value: "아직 없다" },
      ],
    },
    {
      title: "T6 분모 2 의 역원 4 를 구해 곱한다",
      detail:
        "페르마의 소정리로 2 의 5 제곱을 법 7 에서 구하면 4 다. 2 × 4 = 8 이고 8 을 7 로 나눈 나머지가 1 이라 4 가 2 의 역원이 맞다. 답은 5 × 4 = 20 을 7 로 나눈 나머지인 6 이다.",
      entries: [
        { label: "갈래", value: "⑤ 역원을 구해 곱한다" },
        { label: "지금 푸는 자리", value: "n = 4, k = 2" },
        { label: "7 진 자릿수", value: "높은 자리 하나" },
        { label: "j", value: 2 },
        { label: "num", value: 5 },
        { label: "den", value: 2 },
        { label: "inv", value: 4 },
        { label: "이 자리의 답", value: 6 },
      ],
    },
    {
      title: "T7 자리 둘의 답을 곱해 끝낸다",
      detail:
        "낮은 자리가 1 이고 높은 자리가 6 이다. ② 가 둘을 곱해 1 × 6 = 6 을 7 로 나눈 나머지 6 을 돌려준다. 정의대로 계산한 C(34, 20) = 1,391,975,640 을 7 로 나눈 나머지와 같다.",
      entries: [
        { label: "갈래", value: "② 두 자리의 답을 곱한다" },
        { label: "지금 푸는 자리", value: "n = 34, k = 20" },
        { label: "7 진 자릿수", value: "34 = 46, 20 = 26" },
        { label: "j", value: "—" },
        { label: "num", value: "—" },
        { label: "den", value: "—" },
        { label: "inv", value: "—" },
        { label: "이 자리의 답", value: 6 },
      ],
    },
  ] satisfies Frame[],
};
