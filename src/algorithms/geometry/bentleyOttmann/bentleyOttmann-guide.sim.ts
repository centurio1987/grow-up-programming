import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(12)를 넘지 않는다 — P3 이 그 관계를 잰다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 *
 * ## 왜 `keyValue` 하나로 그리는가
 *
 * 이 절차가 걸음마다 바꾸는 것은 **이름 붙은 값 다섯**이다 — 지금 처리하는 사건 자리 `now`,
 * 상태 배열 `status`, 열린 세로 목록 `upright`, 이 걸음에서 큐에 새로 넣은 교차 자리, 누적
 * 교차 쌍 `pairs`. 선분이 평면 어디에 놓였는지는 걸음이 지나도 안 바뀌므로 프레임에 실을
 * 것이 아니고, 본문의 ascii 그림이 그 몫을 진다. 배열도 격자도 그래프도 이 다섯을 담을
 * 자리가 아니고, 상태 패널이 그대로 그 모양이다.
 *
 * 규약 셋을 그대로 따른다.
 *
 * 1. **`entries` 의 라벨은 본문 기호표의 이름과 글자 그대로 같다** — `now`·`status`·
 *    `upright`·`pairs`, 그리고 「예약」.
 * 2. **아직 정해지지 않은 값은 `—` 로 둔다.** `0` 으로 두면 「값이 0 으로 정해졌다」와 겹친다.
 * 3. **마지막 프레임이 반환값을 담는다**. `result` 가 그 값을 적는다.
 */
export const sweepWalk = {
  view: "keyValue" as const,
  title: "선분 다섯 개에서 교차 쌍 넷을 센다",
  result: "4",
  steps: [
    {
      title: "T1 (0,0) — s0 이 시작한다",
      detail:
        "상태 배열이 비어 있으므로 s0 이 그대로 첫 자리에 들어간다. 이웃이 없어 예약할 짝도 없다.",
      entries: [
        { label: "now", value: "(0,0)" },
        { label: "status", value: "s0" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 0 },
      ],
    },
    {
      title: "T2 (0,6) — s1 이 시작하고 첫 예약이 붙는다",
      detail:
        "x = 0 에서 s0 은 y = 0, s1 은 y = 6 이라 s1 이 위다. 새로 이웃이 된 s0·s1 의 교차 자리 (3,3) 을 큐에 넣는다.",
      entries: [
        { label: "now", value: "(0,6)" },
        { label: "status", value: "s0 s1" },
        { label: "upright", value: "—" },
        { label: "예약", value: "(3,3)" },
        { label: "pairs", value: 0 },
      ],
    },
    {
      title: "T3 (0,8) — s3 이 맨 위에 들어간다",
      detail:
        "x = 0 에서 s3 은 y = 8 이라 s1 보다 위다. 새 이웃은 s1·s3 인데 두 직선은 x = −4 에서 만나 두 선분 밖이라 예약이 없다.",
      entries: [
        { label: "now", value: "(0,8)" },
        { label: "status", value: "s0 s1 s3" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 0 },
      ],
    },
    {
      title: "T4 (2,1) — 세로 선분 s2 가 열리고 두 쌍이 잡힌다",
      detail:
        "s2 는 x = 2 에서 y 가 1 부터 5 까지다. 상태 배열에서 x = 2 일 때의 y 가 그 구간에 드는 선분은 s0(y = 2)과 s1(y = 4)이라 두 쌍을 바로 센다. s3 은 y = 7 이라 구간 밖이다.",
      entries: [
        { label: "now", value: "(2,1)" },
        { label: "status", value: "s0 s1 s3" },
        { label: "upright", value: "s2" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 2 },
      ],
    },
    {
      title: "T5 (2,5) — 세로 선분 s2 를 닫는다",
      detail:
        "s2 의 위 끝점이다. 열린 세로 목록에서 빼고 나면 이 열에서 세로 선분이 관여할 일이 없다. 상태 배열은 그대로다.",
      entries: [
        { label: "now", value: "(2,5)" },
        { label: "status", value: "s0 s1 s3" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 2 },
      ],
    },
    {
      title: "T6 (3,3) — 예약해 둔 교차 자리에서 순서가 뒤집힌다",
      detail:
        "방향 판정이 0 인 토막이 s0·s1 둘이라 한 쌍을 센다. 이 자리 뒤의 순서는 기울기가 큰 쪽이 위이므로 s1(기울기 −1)이 아래, s0(기울기 1)이 위다. 위로 올라온 s0 은 s3 과 새 이웃이 되고, 그 교차 자리 (16/3,16/3) 이 예약된다.",
      entries: [
        { label: "now", value: "(3,3)" },
        { label: "status", value: "s1 s0 s3" },
        { label: "upright", value: "—" },
        { label: "예약", value: "(16/3,16/3)" },
        { label: "pairs", value: 3 },
      ],
    },
    {
      title: "T7 (16/3,16/3) — 좌표가 분수인 사건 자리",
      detail:
        "s0 과 s3 이 여기서 만나 네 번째 쌍이 된다. 자리의 좌표가 정수가 아니라 분자 16 과 분모 3 으로 적어 둔 값이고, 큐의 앞뒤도 그 세 정수의 곱셈으로 정했다.",
      entries: [
        { label: "now", value: "(16/3,16/3)" },
        { label: "status", value: "s1 s3 s0" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 4 },
      ],
    },
    {
      title: "T8 (6,0) — s1 이 끝난다",
      detail:
        "s1 은 상태 배열의 맨 아래에 있어서, 빼도 새로 맞닿는 짝이 생기지 않는다. 예약할 것이 없다.",
      entries: [
        { label: "now", value: "(6,0)" },
        { label: "status", value: "s3 s0" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 4 },
      ],
    },
    {
      title: "T9 (8,4) — s3 이 끝난다",
      detail: "s3 을 빼면 s0 하나만 남는다. 남은 것이 하나라 이웃 짝이 없다.",
      entries: [
        { label: "now", value: "(8,4)" },
        { label: "status", value: "s0" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 4 },
      ],
    },
    {
      title: "T10 (8,8) — s0 이 끝나 상태 배열이 빈다",
      detail:
        "여기서 상태 배열이 한 번 비지만 큐에는 아직 s4 의 두 끝점이 남아 있다. 큐가 빌 때까지 계속한다.",
      entries: [
        { label: "now", value: "(8,8)" },
        { label: "status", value: "(비어 있음)" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 4 },
      ],
    },
    {
      title: "T11 (9,0) — 멀리 떨어진 s4 가 시작한다",
      detail:
        "s4 는 x 가 9 부터 11 까지라 앞의 넷과 겹치는 구간이 없다. 상태 배열에 혼자 들어가고, 앞의 네 선분과는 한 번도 견주지 않는다.",
      entries: [
        { label: "now", value: "(9,0)" },
        { label: "status", value: "s4" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 4 },
      ],
    },
    {
      title: "T12 (11,2) — 큐가 비고 4 를 반환한다",
      detail:
        "마지막 끝점을 처리하면 큐가 빈다. 센 쌍은 s0·s2, s1·s2, s0·s1, s0·s3 넷이다.",
      entries: [
        { label: "now", value: "(11,2)" },
        { label: "status", value: "(비어 있음)" },
        { label: "upright", value: "—" },
        { label: "예약", value: "—" },
        { label: "pairs", value: 4 },
      ],
    },
  ] satisfies Frame[],
};
