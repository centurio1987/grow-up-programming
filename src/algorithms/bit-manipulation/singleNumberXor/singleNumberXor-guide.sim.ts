import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`singleNumberXor([4, 1, 2, 1, 2])`)을
 * 쓴다. 프레임 수는 그 절의 T# 단계 수(7)와 같다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` 단독 뷰
 *
 * 기준은 `minMaxPair`·`fastPower` 가 세우고 `enumerateSubmasks` 가 이 카테고리에 들여온
 * 둘을 그대로 쓴다 — ① 그릴 배열이 상태에 없고 ② 움직이는 것이 값 몇 개뿐이다. 이 편이
 * 그렇다: 입력 배열은 처음부터 끝까지 안 바뀌고 움직이는 것은 `acc` 와 `i` 둘이다.
 * `array` 를 더하면 매 프레임 같은 배열이 그대로 다시 그려질 뿐이다.
 *
 * ## 이어받은 규약 — `enumerateSubmasks-guide.sim.ts` 의 여섯 중 다섯
 *
 * 1. **정수 항목은 `십진 (이진)` 한 칸에 함께 적는다.** 비트 연산의 이해 대상은 자리인데
 *    십진값만으로는 자리가 확인되지 않는다.
 * 2. **이진 표기는 고정 폭으로 0 을 채운다.** 이 편의 폭은 3 이다 — 전개 입력의 최댓값 4 가
 *    자리 2 를 쓴다. `0b` 접두는 붙이지 않는다(본문 표기와 같게 둔다).
 * 3. **연산이 값을 안 바꾼 프레임에도 「무엇을 안 바꿨는가」를 값으로 적는다.** 이 편의
 *    「바뀐 자리」 항목이 그 자리이고, T1 과 T7 은 겹치는 값이 없어 `—` 다.
 * 4. **항목을 프레임마다 같은 것으로 같은 순서로 두고 값만 바꾼다.** 순서는 「지금 실행하는
 *    갈래 → 그 갈래가 읽는 값 → 그 갈래가 만든 값 → 누적 결과」이고, 마지막 항목이 반환될 값이다.
 * 5. **`label` 은 본문 기호표의 이름과 글자 그대로 같게 쓴다** — `i` · `nums[i]` · `acc` 다.
 *
 * 여섯째(「한 식이 비트 연산을 둘 이상 이으면 사이 값을 항목으로 둔다」)는 이 편에 해당
 * 사항이 없다. 바퀴 하나가 실행하는 비트 연산이 `acc ^ nums[i]` 하나뿐이라 사이 값이 없다.
 * 그 자리를 「바뀐 자리」가 대신한다 — 자리 하나가 켜졌는지 꺼졌는지가 이 편에서 독자가
 * 프레임마다 확인해야 하는 것이다.
 */
export const xorWalk = {
  view: "keyValue" as const,
  title: "singleNumberXor([4, 1, 2, 1, 2]) — 자리마다 켜졌다 꺼진다",
  result: "4",
  steps: [
    {
      title: "T1 초기화 — ① 항등원 0 에서 출발한다",
      detail:
        "acc 를 0 으로 둔다. 아직 아무 칸도 안 읽었고, 0 은 XOR 의 항등원이라 첫 값이 그대로 들어온다.",
      entries: [
        { label: "갈래", value: "① 초기화" },
        { label: "i", value: "—" },
        { label: "nums[i]", value: "—" },
        { label: "acc (2진)", value: "000" },
        { label: "acc (10진)", value: 0 },
        { label: "바뀐 자리", value: "—" },
      ],
    },
    {
      title: "T2 — 4 를 겹쳐 자리 2 가 켜진다",
      detail:
        "acc 000 에 4(100) 를 겹치면 자리 2 만 0 과 다르므로 그 자리가 1 이 된다. 4 는 이 배열에서 한 번만 나오는 값이고, 이 자리는 끝까지 다시 안 바뀐다.",
      entries: [
        { label: "갈래", value: "②③ 실행" },
        { label: "i", value: 0 },
        { label: "nums[i]", value: "4 (100)" },
        { label: "acc (2진)", value: "100" },
        { label: "acc (10진)", value: 4 },
        { label: "바뀐 자리", value: "자리 2 가 켜졌다" },
      ],
    },
    {
      title: "T3 — 1 을 겹쳐 자리 0 이 켜진다",
      detail:
        "1(001) 이 처음 나왔다. 자리 0 이 켜지고 자리 2 는 겹치는 값의 그 자리가 0 이라 그대로다. acc 5 는 배열에 없는 값인데, acc 는 원소가 아니라 지금까지 읽은 값을 전부 겹친 것이다.",
      entries: [
        { label: "갈래", value: "②③ 실행" },
        { label: "i", value: 1 },
        { label: "nums[i]", value: "1 (001)" },
        { label: "acc (2진)", value: "101" },
        { label: "acc (10진)", value: 5 },
        { label: "바뀐 자리", value: "자리 0 이 켜졌다" },
      ],
    },
    {
      title: "T4 — 2 를 겹쳐 세 자리가 다 켜진다",
      detail:
        "2(010) 가 처음 나와 자리 1 이 켜진다. 여기까지 읽은 세 값이 각각 한 번씩이라 세 자리가 다 서 있는 상태다.",
      entries: [
        { label: "갈래", value: "②③ 실행" },
        { label: "i", value: 2 },
        { label: "nums[i]", value: "2 (010)" },
        { label: "acc (2진)", value: "111" },
        { label: "acc (10진)", value: 7 },
        { label: "바뀐 자리", value: "자리 1 이 켜졌다" },
      ],
    },
    {
      title: "T5 — 1 이 두 번째로 나와 자리 0 이 꺼진다",
      detail:
        "T3 에서 1 이 켠 자리 0 을 같은 값 1 이 다시 끈다. 두 1 이 배열에서 붙어 있지 않은데도 상쇄된다 — 지워지는 조건은 자리가 아니라 등장 횟수다.",
      entries: [
        { label: "갈래", value: "②③ 실행" },
        { label: "i", value: 3 },
        { label: "nums[i]", value: "1 (001)" },
        { label: "acc (2진)", value: "110" },
        { label: "acc (10진)", value: 6 },
        { label: "바뀐 자리", value: "자리 0 이 꺼졌다" },
      ],
    },
    {
      title: "T6 — 2 가 두 번째로 나와 자리 1 이 꺼진다",
      detail:
        "T4 에서 2 가 켠 자리 1 을 같은 값 2 가 다시 끈다. 남은 것은 T2 에서 켜진 자리 2 하나다.",
      entries: [
        { label: "갈래", value: "②③ 실행" },
        { label: "i", value: 4 },
        { label: "nums[i]", value: "2 (010)" },
        { label: "acc (2진)", value: "100" },
        { label: "acc (10진)", value: 4 },
        { label: "바뀐 자리", value: "자리 1 이 꺼졌다" },
      ],
    },
    {
      title: "T7 종료 — ② 거짓 · ④ acc 를 돌려준다",
      entries: [
        { label: "갈래", value: "② 거짓 · ④ 반환" },
        { label: "i", value: 5 },
        { label: "nums[i]", value: "—" },
        { label: "acc (2진)", value: "100" },
        { label: "acc (10진)", value: 4 },
        { label: "바뀐 자리", value: "—" },
      ],
      detail:
        "i 가 5 가 되어 조건이 거짓이다. 짝수 번 등장한 1 과 2 는 자리가 꺼졌고 홀수 번 등장한 4 만 남아 있다.",
    },
  ] satisfies Frame[],
};
