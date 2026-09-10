import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다 — 직선 여섯 개를 기울기
 * 비감소 순서로 등록하고 `query(0)`·`query(-4)`·`query(4)` 를 답한다. 프레임 수(12)가 그
 * 절의 T# 단계 수(12)와 같다 — P3 이 그 관계를 잰다. **T# 하나에 프레임 하나를 둔다.**
 * 본문이 특정 걸음을 이름으로 짚는 자리가 있어서(「T3 이 버린 직선을 T5 가 다시 버린다」)
 * 프레임을 묶으면 그 걸음을 화면에서 찾을 수 없다.
 *
 * `keyValue` 와 `matrix` 조합을 고른 이유를 적어 둔다.
 *
 * 1. **`matrix` 가 껍질을, `keyValue` 가 지금 하는 일을 진다.** 껍질은 「직선의 목록」이라
 *    행이 자리이고 열이 계수다. 지금 무엇을 등록하는지 · `isCovered` 가 무엇을 냈는지 ·
 *    이진 탐색의 `lo`·`hi`·`mid` 가 얼마인지는 껍질의 칸이 아니라 그 옆의 상태라
 *    `entries` 한 줄씩으로 둔다.
 * 2. **열이 셋이다.** `기울기 m` · `절편 b` · `질의 x 에서의 값`이고, 세 번째 열은 질의
 *    프레임에서만 값이 있다. 등록 프레임에서 그 열을 채우면 아직 정해지지 않은 `x` 의 값을
 *    화면에 적는 것이 된다.
 * 3. **버리는 직선은 지우기 전 프레임에서 강조한다.** 버린 뒤의 껍질만 보이면 무엇이
 *    없어졌는지 화면에서 확인할 수 없다. T3 과 T5 가 그 자리다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const hull = {
  view: ["keyValue", "matrix"] as const,
  title: "직선 여섯 개를 등록하고 세 자리를 질의한다",
  result: "-8",
  steps: [
    {
      title: "T1 빈 껍질에 첫 직선을 넣는다",
      detail:
        "껍질이 비어 있으므로 견줄 이웃이 없다. 기울기가 같은 꼭대기도 없고 길이가 2 미만이라 담당 구간 검사도 하지 않는다. 그대로 뒤에 붙인다.",
      entries: [
        { label: "동작", value: "addLine(-2, 0)" },
        { label: "껍질 길이", value: "0 → 1" },
        { label: "isCovered 검사", value: "하지 않는다 — 길이가 2 미만" },
      ],
      matrix: [[-2, 0, null]],
      rowLabels: ["hull[0]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [0, 0],
        [0, 1],
      ] as [number, number][],
    },
    {
      title: "T2 둘째 직선도 검사 없이 들어간다",
      detail:
        "기울기 -1 은 꼭대기의 -2 와 다르므로 같은 기울기 처리는 실행되지 않는다. 껍질 길이가 1 이라 담당 구간 검사도 아직 할 수 없다 — 가운데 직선이 있어야 그 직선이 필요한지 물을 수 있다.",
      entries: [
        { label: "동작", value: "addLine(-1, 5)" },
        { label: "껍질 길이", value: "1 → 2" },
        { label: "isCovered 검사", value: "하지 않는다 — 길이가 2 미만" },
      ],
      matrix: [
        [-2, 0, null],
        [-1, 5, null],
      ],
      rowLabels: ["hull[0]", "hull[1]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [1, 0],
        [1, 1],
      ] as [number, number][],
    },
    {
      title: "T3 셋째 직선이 오자 꼭대기의 담당 구간이 없어진다",
      detail:
        "isCovered((-2,0), (-1,5), (0,-1)) 을 계산하면 왼쪽이 6, 오른쪽이 -5 라 6 >= -5 가 참이다. 꼭대기 (-1, 5) 는 어떤 x 에서도 최솟값이 아니므로 버린다.",
      entries: [
        { label: "동작", value: "addLine(0, -1)" },
        { label: "isCovered 왼쪽", value: "(-1-5)(-2-(-1)) = 6" },
        { label: "isCovered 오른쪽", value: "(5-0)(-1-0) = -5" },
        { label: "판정", value: "6 >= -5 — 참이라 꼭대기를 버린다" },
      ],
      matrix: [
        [-2, 0, null],
        [-1, 5, null],
      ],
      rowLabels: ["hull[0]", "hull[1]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [1, 0],
        [1, 1],
      ] as [number, number][],
    },
    {
      title: "T4 하나를 버리고 셋째 직선을 넣는다",
      detail:
        "(-1, 5) 를 버리면 껍질 길이가 1 이 되어 담당 구간 검사가 끝난다. (0, -1) 을 뒤에 붙인다. 버린 직선은 다시 들어오지 않는다.",
      entries: [
        { label: "동작", value: "addLine(0, -1) — 넣기" },
        { label: "버린 직선", value: "(-1, 5)" },
        { label: "껍질 길이", value: "2 → 1 → 2" },
      ],
      matrix: [
        [-2, 0, null],
        [0, -1, null],
      ],
      rowLabels: ["hull[0]", "hull[1]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [1, 0],
        [1, 1],
      ] as [number, number][],
    },
    {
      title: "T5 기울기가 같은 직선이 오면 절편만 견준다",
      detail:
        "새 직선 (0, -3) 의 기울기가 꼭대기 (0, -1) 과 같다. 두 직선은 만나지 않으므로 담당 구간을 물을 수 없고, 모든 x 에서 절편이 작은 쪽이 작다. -1 <= -3 이 거짓이라 꼭대기를 버린다.",
      entries: [
        { label: "동작", value: "addLine(0, -3)" },
        { label: "꼭대기 기울기", value: "0 — 새 직선과 같다" },
        { label: "절편 견주기", value: "-1 <= -3 은 거짓" },
        { label: "판정", value: "꼭대기 (0, -1) 을 버린다" },
      ],
      matrix: [
        [-2, 0, null],
        [0, -1, null],
      ],
      rowLabels: ["hull[0]", "hull[1]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [1, 0],
        [1, 1],
      ] as [number, number][],
    },
    {
      title: "T6 절편이 작은 쪽을 남긴다",
      detail:
        "껍질 길이가 1 이 되었으므로 담당 구간 검사 없이 (0, -3) 을 넣는다. 껍질에 기울기가 같은 직선이 둘 남는 일은 없다 — 그것이 이 처리를 담당 구간 검사보다 먼저 두는 이유다.",
      entries: [
        { label: "동작", value: "addLine(0, -3) — 넣기" },
        { label: "버린 직선", value: "(0, -1)" },
        { label: "껍질 길이", value: "2 → 1 → 2" },
      ],
      matrix: [
        [-2, 0, null],
        [0, -3, null],
      ],
      rowLabels: ["hull[0]", "hull[1]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [1, 0],
        [1, 1],
      ] as [number, number][],
    },
    {
      title: "T7 담당 구간이 남아 있으면 아무것도 안 버린다",
      detail:
        "isCovered((-2,0), (0,-3), (2,0)) 은 왼쪽이 -6, 오른쪽이 6 이라 -6 >= 6 이 거짓이다. (0, -3) 은 여전히 자기만 최솟값을 내는 구간을 가지므로 그대로 두고 새 직선을 뒤에 붙인다.",
      entries: [
        { label: "동작", value: "addLine(2, 0)" },
        { label: "isCovered 왼쪽", value: "(0-(-3))(-2-0) = -6" },
        { label: "isCovered 오른쪽", value: "(-3-0)(0-2) = 6" },
        { label: "판정", value: "-6 >= 6 — 거짓이라 그대로 둔다" },
      ],
      matrix: [
        [-2, 0, null],
        [0, -3, null],
        [2, 0, null],
      ],
      rowLabels: ["hull[0]", "hull[1]", "hull[2]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [2, 0],
        [2, 1],
      ] as [number, number][],
    },
    {
      title: "T8 절편이 더 큰 평행선은 껍질에 들어오지 못한다",
      detail:
        "(2, 7) 은 꼭대기 (2, 0) 과 기울기가 같고 절편이 크다. 0 <= 7 이 참이라 새 직선을 그 자리에서 버린다. 껍질은 그대로다.",
      entries: [
        { label: "동작", value: "addLine(2, 7)" },
        { label: "꼭대기 기울기", value: "2 — 새 직선과 같다" },
        { label: "절편 견주기", value: "0 <= 7 은 참" },
        { label: "판정", value: "새 직선을 버린다. 껍질 길이 3 그대로" },
      ],
      matrix: [
        [-2, 0, null],
        [0, -3, null],
        [2, 0, null],
      ],
      rowLabels: ["hull[0]", "hull[1]", "hull[2]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [2, 0],
        [2, 1],
      ] as [number, number][],
    },
    {
      title: "T9 query(0) 의 첫 반복 — 오른쪽 절반을 뺀다",
      detail:
        "lo = 0, hi = 2 로 시작해 mid = 1 을 본다. hull[1] 의 값이 -3, hull[2] 의 값이 0 이라 -3 <= 0 이 참이다. 가장 작은 자리는 1 이거나 그 왼쪽이므로 hi 를 1 로 줄인다.",
      entries: [
        { label: "동작", value: "query(0)" },
        { label: "lo · hi", value: "0 · 2" },
        { label: "mid", value: "1" },
        { label: "견주기", value: "-3 <= 0 은 참" },
        { label: "다음 범위", value: "lo = 0 · hi = 1" },
      ],
      matrix: [
        [-2, 0, 0],
        [0, -3, -3],
        [2, 0, 0],
      ],
      rowLabels: ["hull[0]", "hull[1]", "hull[2]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [1, 2],
        [2, 2],
      ] as [number, number][],
    },
    {
      title: "T10 query(0) 의 둘째 반복 — 답은 -3 이다",
      detail:
        "mid = 0 을 본다. hull[0] 의 값이 0, hull[1] 의 값이 -3 이라 0 <= -3 이 거짓이다. 0 자리를 후보에서 빼고 lo 를 1 로 올리면 lo 와 hi 가 만나 반복이 끝난다. hull[1] 의 값 -3 이 답이다.",
      entries: [
        { label: "lo · hi", value: "0 · 1" },
        { label: "mid", value: "0" },
        { label: "견주기", value: "0 <= -3 은 거짓" },
        { label: "만난 자리", value: "1" },
        { label: "답", value: "-3" },
      ],
      matrix: [
        [-2, 0, 0],
        [0, -3, -3],
        [2, 0, 0],
      ],
      rowLabels: ["hull[0]", "hull[1]", "hull[2]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [1, 0],
        [1, 1],
        [1, 2],
      ] as [number, number][],
    },
    {
      title: "T11 query(-4) — 반복 한 번에 마지막 자리로 간다",
      detail:
        "값이 8 · -3 · -8 이다. mid = 1 에서 -3 <= -8 이 거짓이라 lo 를 2 로 올리고, 그 순간 lo 와 hi 가 2 에서 만난다. 왼쪽으로 갈수록 기울기가 큰 직선이 작아지는 자리라 마지막 직선이 답이다.",
      entries: [
        { label: "동작", value: "query(-4)" },
        { label: "lo · hi", value: "0 · 2" },
        { label: "mid", value: "1" },
        { label: "견주기", value: "-3 <= -8 은 거짓" },
        { label: "만난 자리", value: "2" },
        { label: "답", value: "-8" },
      ],
      matrix: [
        [-2, 0, 8],
        [0, -3, -3],
        [2, 0, -8],
      ],
      rowLabels: ["hull[0]", "hull[1]", "hull[2]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [2, 0],
        [2, 1],
        [2, 2],
      ] as [number, number][],
    },
    {
      title: "T12 query(4) — 두 번 왼쪽으로 좁혀 첫 자리로 간다",
      detail:
        "값이 -8 · -3 · 8 이다. mid = 1 에서 -3 <= 8 이 참이라 hi 가 1 이 되고, mid = 0 에서 -8 <= -3 이 참이라 hi 가 0 이 된다. 오른쪽으로 갈수록 기울기가 작은 직선이 작아지는 자리라 첫 직선이 답이다.",
      entries: [
        { label: "동작", value: "query(4)" },
        { label: "첫 반복", value: "mid = 1 · -3 <= 8 은 참 → hi = 1" },
        { label: "둘째 반복", value: "mid = 0 · -8 <= -3 은 참 → hi = 0" },
        { label: "만난 자리", value: "0" },
        { label: "답", value: "-8" },
      ],
      matrix: [
        [-2, 0, -8],
        [0, -3, -3],
        [2, 0, 8],
      ],
      rowLabels: ["hull[0]", "hull[1]", "hull[2]"],
      colLabels: ["기울기 m", "절편 b", "질의 x 에서의 값"],
      cells: [
        [0, 0],
        [0, 1],
        [0, 2],
      ] as [number, number][],
    },
  ] satisfies Frame[],
};
