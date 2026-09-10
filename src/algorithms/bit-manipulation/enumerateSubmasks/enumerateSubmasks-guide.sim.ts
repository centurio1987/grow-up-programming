import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`enumerateSubmasks(0b1011)`)을
 * 쓴다. 프레임 수는 그 절의 T# 단계 수(9)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `bit-manipulation` 카테고리의 `keyValue` 단독 규약 — 이 편이 선례다
 *
 * `keyValue` 단독을 고르는 기준은 `minMaxPair`·`fastPower` 가 세운 둘을 그대로 쓴다 —
 * ① 그릴 배열이 입력에 없고 ② 움직이는 것이 값 몇 개뿐이다. 이 편이 그렇다: 입력이 정수
 * 하나이고 상태는 `sub`·`borrowed`·`next` 셋이다. `array` 를 더하면 담을 배열이 결과
 * 배열뿐이라 자리마다 같은 값이 늘어나기만 한다.
 *
 * 아래 여섯이 **비트 연산 편의 추가 규약**이고, 같은 카테고리의 뒤 편(`singleNumberXor` ·
 * `lowestSetBit` · `matrixPowerFibonacci`)이 이것을 그대로 따른다.
 *
 * 1. **정수 항목은 `십진 (이진)` 한 칸에 함께 적는다.** 비트 연산의 이해 대상은 자리인데
 *    십진값만으로는 자리가 확인되지 않고, 이진만 적으면 본문의 표·판정과 대조가 끊긴다.
 *    `fastPower` 의 `"26 (11010)"` 이 같은 표기다.
 * 2. **이진 표기는 `mask` 의 비트 폭에 맞춘 고정 폭으로 0 을 채운다.** 폭이 프레임마다
 *    바뀌면 독자가 자리 번호를 매번 다시 센다 — `0b1011` 편에서는 네 자리로 고정한다.
 *    `0b` 접두는 붙이지 않는다(본문 표기와 같게 둔다).
 * 3. **한 식이 비트 연산을 둘 이상 이으면 그 사이 값을 항목으로 둔다.** `(sub - 1) & mask`
 *    는 `sub - 1` 의 결과와 AND 의 결과를 각각 적는다. 감추면 두 연산 중 어느 쪽이 무엇을
 *    했는지 프레임에서 확인할 수 없다.
 * 4. **연산이 값을 안 바꾼 프레임에도 「무엇을 안 바꿨는가」를 값으로 적는다.** 비트 연산은
 *    대부분의 걸음에서 아무것도 바꾸지 않는 자리가 흔하고, 그 자리를 비워 두면 독자가 그
 *    연산을 없어도 되는 것으로 읽는다. 이 편의 `AND 가 지운 자리` 항목이 그 자리다.
 * 5. **항목을 프레임마다 같은 것으로 같은 순서로 두고 값만 바꾼다.** 값이 없는 자리도 항목을
 *    빼지 않고 `—` 로 적는다. 순서는 「지금 실행하는 갈래 → 그 갈래가 읽는 값 → 그 갈래가
 *    만든 값 → 누적 결과」이고, 첫 항목이 `갈래`, 마지막 항목이 반환될 값이다.
 * 6. **`label` 은 본문 기호표의 이름과 글자 그대로 같게 쓴다** — 여기서는 `sub`·`borrowed`·
 *    `next`·`subMasks` 다.
 */
export const submaskWalk = {
  view: ["keyValue"] as const,
  title: "enumerateSubmasks(0b1011) — 걸음 하나가 서브마스크 하나다",
  result: "[11, 10, 9, 8, 3, 2, 1, 0]",
  steps: [
    {
      title: "T1 초기화 — ① mask 자신을 첫 칸에 담는다",
      detail:
        "subMasks 에 mask 11 을 담고 sub 를 11 로 둔다. 아직 바퀴에 들어가지 않았다.",
      entries: [
        { label: "갈래", value: "① 초기화" },
        { label: "sub", value: "11 (1011)" },
        { label: "borrowed", value: "—" },
        { label: "next", value: "—" },
        { label: "AND 가 지운 자리", value: "—" },
        { label: "subMasks 길이", value: 1 },
        { label: "subMasks", value: "[11]" },
      ],
    },
    {
      title: "T2 — ③ 자리내림이 자리 0 에서 끝난다",
      detail:
        "sub = 11 의 최하위 1 비트가 자리 0 이라 1 을 빼면 그 자리만 0 이 된다. 1010 은 이미 mask 안이라 ④ 가 아무 자리도 지우지 않는다.",
      entries: [
        { label: "갈래", value: "②③④⑤ 실행" },
        { label: "sub", value: "11 (1011)" },
        { label: "borrowed", value: "10 (1010)" },
        { label: "next", value: "10 (1010)" },
        { label: "AND 가 지운 자리", value: "없다" },
        { label: "subMasks 길이", value: 2 },
        { label: "subMasks", value: "[11, 10]" },
      ],
    },
    {
      title: "T3 — ③ 자리내림이 자리 1 에서 자리 0 으로 번진다",
      detail:
        "sub = 10 의 최하위 1 비트가 자리 1 이라 그 자리가 0 이 되고 자리 0 이 1 이 된다. 자리 0 은 mask 에도 1 이라 ④ 가 그대로 둔다.",
      entries: [
        { label: "갈래", value: "②③④⑤ 실행" },
        { label: "sub", value: "10 (1010)" },
        { label: "borrowed", value: "9 (1001)" },
        { label: "next", value: "9 (1001)" },
        { label: "AND 가 지운 자리", value: "없다" },
        { label: "subMasks 길이", value: 3 },
        { label: "subMasks", value: "[11, 10, 9]" },
      ],
    },
    {
      title: "T4 — ③ 다시 자리 0 하나로 끝난다",
      detail:
        "sub = 9 의 최하위 1 비트가 자리 0 이다. borrowed 가 1000 이고 mask 에 자리 3 이 있어 ④ 가 그대로 둔다.",
      entries: [
        { label: "갈래", value: "②③④⑤ 실행" },
        { label: "sub", value: "9 (1001)" },
        { label: "borrowed", value: "8 (1000)" },
        { label: "next", value: "8 (1000)" },
        { label: "AND 가 지운 자리", value: "없다" },
        { label: "subMasks 길이", value: 4 },
        { label: "subMasks", value: "[11, 10, 9, 8]" },
      ],
    },
    {
      title: "T5 — ④ 가 자리 2 를 지우는 유일한 걸음",
      detail:
        "sub = 8 의 최하위 1 비트가 자리 3 이라 자리내림이 자리 0·1·2 를 전부 1 로 만든다. mask 에 자리 2 가 없어 ④ 가 그 자리를 지우고 3 이 남는다.",
      entries: [
        { label: "갈래", value: "②③④⑤ 실행" },
        { label: "sub", value: "8 (1000)" },
        { label: "borrowed", value: "7 (0111)" },
        { label: "next", value: "3 (0011)" },
        { label: "AND 가 지운 자리", value: "자리 2" },
        { label: "subMasks 길이", value: 5 },
        { label: "subMasks", value: "[11, 10, 9, 8, 3]" },
      ],
    },
    {
      title: "T6 — ③ 자리 0 이 켜져 있어 한 자리로 끝난다",
      detail:
        "sub = 3 에서 1 을 빼면 2 다. 0010 은 mask 안이라 ④ 가 지울 자리가 없다.",
      entries: [
        { label: "갈래", value: "②③④⑤ 실행" },
        { label: "sub", value: "3 (0011)" },
        { label: "borrowed", value: "2 (0010)" },
        { label: "next", value: "2 (0010)" },
        { label: "AND 가 지운 자리", value: "없다" },
        { label: "subMasks 길이", value: 6 },
        { label: "subMasks", value: "[11, 10, 9, 8, 3, 2]" },
      ],
    },
    {
      title: "T7 — ③ 자리 1 에서 자리 0 으로 번진다",
      detail:
        "sub = 2 의 최하위 1 비트가 자리 1 이다. 자리 0 이 1 이 되고 mask 에도 자리 0 이 있어 ④ 가 그대로 둔다.",
      entries: [
        { label: "갈래", value: "②③④⑤ 실행" },
        { label: "sub", value: "2 (0010)" },
        { label: "borrowed", value: "1 (0001)" },
        { label: "next", value: "1 (0001)" },
        { label: "AND 가 지운 자리", value: "없다" },
        { label: "subMasks 길이", value: 7 },
        { label: "subMasks", value: "[11, 10, 9, 8, 3, 2, 1]" },
      ],
    },
    {
      title: "T8 — 마지막 1 비트가 내려가 0 이 된다",
      detail:
        "sub = 1 에서 1 을 빼면 0 이고 AND 도 0 이다. 빈 집합이 결과의 마지막 칸에 담긴다.",
      entries: [
        { label: "갈래", value: "②③④⑤ 실행" },
        { label: "sub", value: "1 (0001)" },
        { label: "borrowed", value: "0 (0000)" },
        { label: "next", value: "0 (0000)" },
        { label: "AND 가 지운 자리", value: "없다" },
        { label: "subMasks 길이", value: 8 },
        { label: "subMasks", value: "[11, 10, 9, 8, 3, 2, 1, 0]" },
      ],
    },
    {
      title: "T9 종료 — ② 거짓",
      detail:
        "sub 가 0 이라 ② 가 거짓이 되고 subMasks 를 돌려준다. 바퀴는 7 번이었고 담은 값은 8 개다.",
      entries: [
        { label: "갈래", value: "② 거짓 · 반환" },
        { label: "sub", value: "0 (0000)" },
        { label: "borrowed", value: "—" },
        { label: "next", value: "—" },
        { label: "AND 가 지운 자리", value: "—" },
        { label: "subMasks 길이", value: 8 },
        { label: "subMasks", value: "[11, 10, 9, 8, 3, 2, 1, 0]" },
      ],
    },
  ] satisfies Frame[],
};
