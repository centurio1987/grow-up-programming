import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`A = [3,1,4,1,5,9,2,6]`)을 쓴다.
 * 프레임 수는 그 절의 T# 단계 수(11)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## `keyValue` 단독 조합의 선례 — 뒤에 오는 편이 이 여섯을 물려받는다
 *
 * `SURVEY.md` 가 센 111편 중 22편이 이 조합이고, 그 22편은 전부 구 명세로 쓰였다.
 * `src/_guide-sim/index.tsx:106` 이 이 뷰를 *"범용 상태 패널(변수 스냅샷)"* 로 정의해서
 * **앞 집필자가 뷰를 안 만든 편의 폴백**으로 쓰였다는 것이 `SURVEY.md` 의 판정이다. 새
 * 명세에서 이 뷰 하나가 무엇을 지는지를 여기서 정한다.
 *
 * 1. **`keyValue` 단독은 「보이는 것이 값뿐인 절차」의 뷰다.** 고르는 기준은 둘이다 —
 *    ① 입력이 읽기 전용이라 프레임마다 같은 배열이 다시 그려지고 ② 움직이는 것이 스칼라
 *    몇 개뿐이다. 이 편이 그렇다: `A` 는 한 번도 안 바뀌고 바뀌는 것은 `i`·`lo`·`hi`·
 *    `min`·`max`·누적 비교뿐이라, `array` 를 더하면 **안 변하는 줄을 열한 번 다시 그린다.**
 *    자리 자체가 이해의 대상이면(창·구간·분할점) 그때는 `array` 를 더한다.
 * 2. **항목을 프레임마다 같은 것으로 같은 순서로 두고 값만 바꾼다. 아직 값이 없어도 항목을
 *    빼지 않고 `—` 로 적는다.** `array` 의 `pointers` 는 값이 없으면 **빼는 것**이 규약인데
 *    (`longestSubarrayAtMostSum-guide.sim.ts` 규칙 3) `keyValue` 는 반대다. 이 패널은 항목을
 *    세로로 늘어놓은 목록이라, 하나가 빠지면 아래가 한 칸씩 올라가고 독자가 프레임마다
 *    자리를 다시 센다.
 * 3. **항목 순서는 「지금 실행하는 갈래 → 그 갈래가 보는 값과 결과 → 상태 → 답」이다.**
 *    첫 항목이 `갈래`, 마지막 두 항목이 반환값의 두 칸(`min`·`max`)이다.
 * 4. **자리(인덱스)도 값으로 적는다.** 배열 패널이 없으니 `A[6]=2` 처럼 **자리와 값을 함께**
 *    적어야 독자가 어디를 보고 있는지 안다. 표기는 본문과 글자 그대로 같게 쓴다.
 * 5. **프레임 하나가 비교 하나다.** 이 편이 세는 비용이 비교 횟수라, 프레임을 쌍 단위로
 *    묶으면 화면에서 비교가 몇 번 일어났는지가 안 보인다. `누적 비교` 를 항목으로 두고
 *    마지막 프레임의 값이 본문이 유도한 `⌈3n/2⌉ − 2` 와 같게 맞춘다.
 * 6. **`label` 은 본문 기호표의 이름과 글자 그대로 같게 쓴다** — 여기서는 `i`·`lo`·`hi`·
 *    `min`·`max` 다. 화면에서 줄여 적으면 독자가 본문과 대조할 때마다 이름을 옮겨야 한다.
 */
export const pairwalk = {
  view: "keyValue" as const,
  title: "minMaxPair([3,1,4,1,5,9,2,6]) — 비교 한 번이 단계 하나다",
  result: "{ min: 1, max: 9 }",
  steps: [
    {
      title: "T1 시작 — ② 짝수 길이",
      detail:
        "n = 8 은 짝수라 첫 두 원소를 한 번 비교해 두 시작값을 함께 정한다.",
      entries: [
        { label: "갈래", value: "② 짝수 길이" },
        { label: "이번 비교", value: "A[0]=3 < A[1]=1" },
        { label: "결과", value: "거짓" },
        { label: "i", value: "—" },
        { label: "lo", value: "—" },
        { label: "hi", value: "—" },
        { label: "누적 비교", value: 1 },
        { label: "min", value: 1 },
        { label: "max", value: 3 },
      ],
    },
    {
      title: "T2 쌍 (4, 1) 을 가른다 — ③",
      detail:
        "4 < 1 이 거짓이라 작은 쪽은 A[3]=1, 큰 쪽은 A[2]=4 다. 이 한 번으로 4 는 min 후보에서, 1 은 max 후보에서 빠진다.",
      entries: [
        { label: "갈래", value: "③ 쌍 안에서 가른다" },
        { label: "이번 비교", value: "A[2]=4 < A[3]=1" },
        { label: "결과", value: "거짓" },
        { label: "i", value: 2 },
        { label: "lo", value: 1 },
        { label: "hi", value: 4 },
        { label: "누적 비교", value: 2 },
        { label: "min", value: 1 },
        { label: "max", value: 3 },
      ],
    },
    {
      title: "T3 작은 쪽을 min 과 대조 — ④",
      detail: "1 < 1 이 거짓이라 min 은 그대로다. 같은 값이면 바꾸지 않는다.",
      entries: [
        { label: "갈래", value: "④ 작은 쪽만 min 과" },
        { label: "이번 비교", value: "lo=1 < min=1" },
        { label: "결과", value: "거짓" },
        { label: "i", value: 2 },
        { label: "lo", value: 1 },
        { label: "hi", value: 4 },
        { label: "누적 비교", value: 3 },
        { label: "min", value: 1 },
        { label: "max", value: 3 },
      ],
    },
    {
      title: "T4 큰 쪽을 max 와 대조 — ④",
      detail: "4 > 3 이 참이라 max 가 4 로 바뀐다.",
      entries: [
        { label: "갈래", value: "④ 큰 쪽만 max 와" },
        { label: "이번 비교", value: "hi=4 > max=3" },
        { label: "결과", value: "참" },
        { label: "i", value: 2 },
        { label: "lo", value: 1 },
        { label: "hi", value: 4 },
        { label: "누적 비교", value: 4 },
        { label: "min", value: 1 },
        { label: "max", value: 4 },
      ],
    },
    {
      title: "T5 쌍 (5, 9) 를 가른다 — ③",
      detail: "5 < 9 가 참이라 작은 쪽은 A[4]=5, 큰 쪽은 A[5]=9 다.",
      entries: [
        { label: "갈래", value: "③ 쌍 안에서 가른다" },
        { label: "이번 비교", value: "A[4]=5 < A[5]=9" },
        { label: "결과", value: "참" },
        { label: "i", value: 4 },
        { label: "lo", value: 5 },
        { label: "hi", value: 9 },
        { label: "누적 비교", value: 5 },
        { label: "min", value: 1 },
        { label: "max", value: 4 },
      ],
    },
    {
      title: "T6 작은 쪽을 min 과 대조 — ④",
      detail: "5 < 1 이 거짓이라 min 은 그대로 1 이다.",
      entries: [
        { label: "갈래", value: "④ 작은 쪽만 min 과" },
        { label: "이번 비교", value: "lo=5 < min=1" },
        { label: "결과", value: "거짓" },
        { label: "i", value: 4 },
        { label: "lo", value: 5 },
        { label: "hi", value: 9 },
        { label: "누적 비교", value: 6 },
        { label: "min", value: 1 },
        { label: "max", value: 4 },
      ],
    },
    {
      title: "T7 큰 쪽을 max 와 대조 — ④",
      detail: "9 > 4 가 참이라 max 가 9 로 바뀐다. 이 값이 끝까지 남는다.",
      entries: [
        { label: "갈래", value: "④ 큰 쪽만 max 와" },
        { label: "이번 비교", value: "hi=9 > max=4" },
        { label: "결과", value: "참" },
        { label: "i", value: 4 },
        { label: "lo", value: 5 },
        { label: "hi", value: 9 },
        { label: "누적 비교", value: 7 },
        { label: "min", value: 1 },
        { label: "max", value: 9 },
      ],
    },
    {
      title: "T8 쌍 (2, 6) 을 가른다 — ③",
      detail: "2 < 6 이 참이라 작은 쪽은 A[6]=2, 큰 쪽은 A[7]=6 이다.",
      entries: [
        { label: "갈래", value: "③ 쌍 안에서 가른다" },
        { label: "이번 비교", value: "A[6]=2 < A[7]=6" },
        { label: "결과", value: "참" },
        { label: "i", value: 6 },
        { label: "lo", value: 2 },
        { label: "hi", value: 6 },
        { label: "누적 비교", value: 8 },
        { label: "min", value: 1 },
        { label: "max", value: 9 },
      ],
    },
    {
      title: "T9 작은 쪽을 min 과 대조 — ④",
      detail: "2 < 1 이 거짓이라 min 은 그대로다.",
      entries: [
        { label: "갈래", value: "④ 작은 쪽만 min 과" },
        { label: "이번 비교", value: "lo=2 < min=1" },
        { label: "결과", value: "거짓" },
        { label: "i", value: 6 },
        { label: "lo", value: 2 },
        { label: "hi", value: 6 },
        { label: "누적 비교", value: 9 },
        { label: "min", value: 1 },
        { label: "max", value: 9 },
      ],
    },
    {
      title: "T10 큰 쪽을 max 와 대조 — ④",
      detail:
        "6 > 9 가 거짓이라 max 도 그대로다. 쌍 하나가 아무것도 바꾸지 않는 자리다.",
      entries: [
        { label: "갈래", value: "④ 큰 쪽만 max 와" },
        { label: "이번 비교", value: "hi=6 > max=9" },
        { label: "결과", value: "거짓" },
        { label: "i", value: 6 },
        { label: "lo", value: 2 },
        { label: "hi", value: 6 },
        { label: "누적 비교", value: 10 },
        { label: "min", value: 1 },
        { label: "max", value: 9 },
      ],
    },
    {
      title: "T11 종료",
      detail:
        "i 가 8 이 되어 반복이 끝난다. 누적 비교 10 은 ⌈3·8/2⌉ − 2 와 같다.",
      entries: [
        { label: "갈래", value: "종료" },
        { label: "이번 비교", value: "i=8 이라 반복이 끝난다" },
        { label: "결과", value: "—" },
        { label: "i", value: 8 },
        { label: "lo", value: "—" },
        { label: "hi", value: "—" },
        { label: "누적 비교", value: 10 },
        { label: "min", value: 1 },
        { label: "max", value: 9 },
      ],
    },
  ] satisfies Frame[],
};
