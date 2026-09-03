import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**(`s = "abaab"`)을 쓴다.
 * 프레임 수(13)가 그 절의 T# 단계 수(13)와 같다 — P3 이 그 관계를 잰다.
 * **T# 하나에 프레임 하나를 둔다.** 본문이 특정 걸음을 이름으로 짚는 자리가 있어서
 * (「T9 와 T10 이 같은 칸의 후보 둘」) 프레임을 묶으면 그 걸음을 화면에서 찾을 수 없다.
 *
 * `keyValue` 와 `matrix` 조합은 `matrixChainMultiplication` 이 구간 동적 계획법 쪽에서
 * 이미 세워 뒀다. **다만 그 편은 표가 하나이고 이 편은 둘이다.** 갈라야 했던 자리 셋을
 * 적어 둔다. 표를 둘 쓰는 다음 편이 이것을 이어받는다.
 *
 * 1. **`matrix` 는 앞의 표(회문 판정)를 지고 `keyValue` 가 뒤의 표(컷)를 진다.** 둘 다
 *    `matrix` 로 그리면 화면에 표가 둘 뜨는데, 뒤의 표는 1 차원이라 행이 하나뿐인 표가
 *    되어 앞의 표와 크기가 어긋난다. 뒤의 표는 `entries` 한 줄(`cut = […]`)로 충분하다.
 * 2. **자리 이름을 표마다 갈라 둔다.** 앞의 표는 `i`(시작)·`j`(끝)이고 뒤의 표는
 *    `e`(접두사의 끝)·`b`(마지막 조각의 시작)다. 둘 다 `i`·`j` 로 적으면 컷 표가 조회하는
 *    `pal[b][e]` 가 행·열이 뒤바뀐 것으로 읽힌다 — `entries` 의 라벨도 이 이름을 쓴다.
 * 3. **칸 상태가 셋이라 표기도 셋이다.** `"-"`(`i > j` 라 구간이 아니다) · `null`(아직 안
 *    정했다) · `"T"`/`"F"`(정했다)다. `MatrixView` 가 `null` 을 빈 칸으로 그리므로
 *    (`src/_guide-sim/index.tsx:374`) 아래쪽 삼각형을 `null` 로 두면 두 상태가 화면에서
 *    같아진다.
 *
 * `rowLabels`·`colLabels` 는 본문 ascii 의 머리줄과 글자 그대로 같다 — 그 그림은
 * `.proof.ts` 의 `walkPal` 이 실행해서 만든다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const table = {
  view: ["keyValue", "matrix"] as const,
  title: 'palindromePartitioningMinCut("abaab")',
  result: "1",
  steps: [
    {
      title: "T1 판정표를 깔고 대각선을 참으로 둔다",
      detail:
        "pal[i][j] = s[i…j] 가 회문인가. 길이 1 구간은 글자 하나라 언제나 회문이고, i > j 인 칸은 구간이 아니라 영영 쓰지 않는다.",
      entries: [
        { label: "구간 길이", value: "1" },
        {
          label: "정한 칸",
          value: "pal[0][0] · pal[1][1] · pal[2][2] · pal[3][3] · pal[4][4]",
        },
        { label: "정한 값", value: "전부 T" },
        { label: "갈래", value: "②" },
      ],
      matrix: [
        ["T", null, null, null, null],
        ["-", "T", null, null, null],
        ["-", "-", "T", null, null],
        ["-", "-", "-", "T", null],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
      ] as [number, number][],
    },
    {
      title: "T2 길이 2 — 안쪽이 빈 구간이라 양 끝 비교만으로 정해진다",
      detail:
        "네 칸을 한 줄로 채운다. s[2]=s[3]='a' 인 [2,3] 만 참이고 나머지 셋은 양 끝 글자가 달라 거짓이다.",
      entries: [
        { label: "구간 길이", value: "2" },
        {
          label: "정한 칸",
          value: "pal[0][1]=F · pal[1][2]=F · pal[2][3]=T · pal[3][4]=F",
        },
        { label: "참인 구간", value: '[2,3] "aa"' },
      ],
      matrix: [
        ["T", "F", null, null, null],
        ["-", "T", "F", null, null],
        ["-", "-", "T", "T", null],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
      ] as [number, number][],
    },
    {
      title: "T3 길이 3 — 여기서부터 안쪽 칸을 읽는다",
      detail:
        "pal[0][2] 는 s[0]=s[2]='a' 이고 안쪽 pal[1][1] 이 T 라 참이다. pal[1][3] 은 s[1]='b' 와 s[3]='a' 가 달라 거짓이고, 안쪽을 읽어 볼 것도 없다.",
      entries: [
        { label: "구간 길이", value: "3" },
        { label: "정한 칸", value: "pal[0][2]=T · pal[1][3]=F · pal[2][4]=F" },
        { label: "읽은 안쪽 칸", value: "pal[1][1] · pal[2][2] · pal[3][3]" },
        { label: "참인 구간", value: '[0,2] "aba"' },
      ],
      matrix: [
        ["T", "F", "T", null, null],
        ["-", "T", "F", "F", null],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [
        [0, 2],
        [1, 3],
        [2, 4],
      ] as [number, number][],
    },
    {
      title: "T4 길이 4 — 길이 2 칸을 안쪽으로 읽는다",
      detail:
        "pal[1][4] 는 s[1]=s[4]='b' 이고 안쪽 pal[2][3] 이 T 라 참이다. T2 가 그 칸을 이미 정해 두었다.",
      entries: [
        { label: "구간 길이", value: "4" },
        { label: "정한 칸", value: "pal[0][3]=F · pal[1][4]=T" },
        { label: "읽은 안쪽 칸", value: "pal[1][2]=F · pal[2][3]=T" },
        { label: "참인 구간", value: '[1,4] "baab"' },
      ],
      matrix: [
        ["T", "F", "T", "F", null],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [
        [0, 3],
        [1, 4],
      ] as [number, number][],
    },
    {
      title: "T5 길이 5 — 판정표가 다 찼다",
      detail:
        "pal[0][4] 는 s[0]='a' 와 s[4]='b' 가 달라 거짓이다. 문자열 전체가 회문이 아니므로 컷이 한 번은 필요하다.",
      entries: [
        { label: "구간 길이", value: "5" },
        { label: "정한 칸", value: "pal[0][4]=F" },
        { label: "참인 칸", value: "여덟 개" },
        { label: "판정한 칸", value: "열다섯 개" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [[0, 4]] as [number, number][],
    },
    {
      title: "T6 컷 표를 깔고 첫 칸을 0 으로 둔다",
      detail:
        "cut[e] = s[0…e] 를 회문 조각으로만 자를 때의 최소 컷 수. cut[0] 은 글자 하나짜리 접두사라 자를 자리가 없어 0 이고, 표를 0 으로 깔면 그 칸이 그대로 옳은 값이 된다.",
      entries: [
        { label: "cut", value: "[0, ·, ·, ·, ·]" },
        { label: "정한 칸", value: "cut[0] = 0" },
        { label: "남은 칸", value: "cut[1] · cut[2] · cut[3] · cut[4]" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [[0, 0]] as [number, number][],
    },
    {
      title: 'T7 끝 자리 1 — 접두사 "ab" 는 회문이 아니라 후보를 센다',
      detail:
        'pal[0][1] 이 F 라 갈래 ③ 으로 가지 않는다. 시작 자리 b=1 하나뿐이고 마지막 조각 "b" 가 회문이라 후보가 cut[0] + 1 = 1 이다.',
      entries: [
        { label: "끝 자리 e", value: "1" },
        { label: "접두사", value: '"ab" — pal[0][1] = F' },
        { label: "시작 자리 b", value: "1" },
        { label: "마지막 조각", value: '"b" — pal[1][1] = T' },
        { label: "후보", value: "cut[0] + 1 = 1" },
        { label: "cut", value: "[0, 1, ·, ·, ·]" },
        { label: "갈래", value: "④" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [
        [0, 1],
        [1, 1],
      ] as [number, number][],
    },
    {
      title: 'T8 끝 자리 2 — 접두사 "aba" 가 통째로 회문이다',
      detail:
        "pal[0][2] 가 T 라 갈래 ③ 이다. 후보를 하나도 세지 않고 0 을 적고 넘어간다. cut[2] 가 cut[1] 보다 작다는 것이 이 표가 오르내린다는 것을 값으로 말한다.",
      entries: [
        { label: "끝 자리 e", value: "2" },
        { label: "접두사", value: '"aba" — pal[0][2] = T' },
        { label: "검사한 후보", value: "없다" },
        { label: "cut", value: "[0, 1, 0, ·, ·]" },
        { label: "갈래", value: "③" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [[0, 2]] as [number, number][],
    },
    {
      title: "T9 끝 자리 3 의 첫 후보 — 시작 자리 2",
      detail:
        'b=1 은 마지막 조각이 "baa" 라 pal[1][3] 이 F 이고 후보가 되지 않는다. b=2 는 "aa" 가 회문이라 후보가 cut[1] + 1 = 2 다. 아직 정한 값이 아니라 지금까지의 최소일 뿐이다.',
      entries: [
        { label: "끝 자리 e", value: "3" },
        { label: "접두사", value: '"abaa" — pal[0][3] = F' },
        { label: "건너뛴 시작 자리", value: 'b=1 — "baa" 는 회문이 아니다' },
        { label: "시작 자리 b", value: "2" },
        { label: "마지막 조각", value: '"aa" — pal[2][3] = T' },
        { label: "후보", value: "cut[1] + 1 = 2" },
        { label: "지금까지의 최소", value: "2" },
        { label: "갈래", value: "④" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [
        [1, 3],
        [2, 3],
      ] as [number, number][],
    },
    {
      title: "T10 끝 자리 3 의 둘째 후보 — 시작 자리 3 이 최소를 1 로 낮춘다",
      detail:
        '마지막 조각이 "a" 하나이고 앞부분이 T8 에서 0 이 된 "aba" 다. 1 이 2 보다 적어 이 칸이 1 로 정해진다. 조각을 길게 잡는 쪽이 언제나 유리한 것이 아니라는 것이 여기서 값으로 나온다.',
      entries: [
        { label: "끝 자리 e", value: "3" },
        { label: "시작 자리 b", value: "3" },
        { label: "마지막 조각", value: '"a" — pal[3][3] = T' },
        { label: "앞부분", value: '"aba" — cut[2] = 0' },
        { label: "후보", value: "cut[2] + 1 = 1" },
        { label: "cut", value: "[0, 1, 0, 1, ·]" },
        { label: "갈래", value: "④" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [[3, 3]] as [number, number][],
    },
    {
      title: "T11 끝 자리 4 의 첫 후보 — 시작 자리 1",
      detail:
        '마지막 조각이 "baab" 이고 T4 가 그 칸을 T 로 정해 두었다. 앞부분이 "a" 라 cut[0] = 0 이고 후보가 1 이다.',
      entries: [
        { label: "끝 자리 e", value: "4" },
        { label: "접두사", value: '"abaab" — pal[0][4] = F' },
        { label: "시작 자리 b", value: "1" },
        { label: "마지막 조각", value: '"baab" — pal[1][4] = T' },
        { label: "앞부분", value: '"a" — cut[0] = 0' },
        { label: "후보", value: "cut[0] + 1 = 1" },
        { label: "지금까지의 최소", value: "1" },
        { label: "갈래", value: "④" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [
        [0, 4],
        [1, 4],
      ] as [number, number][],
    },
    {
      title: "T12 끝 자리 4 의 남은 후보 — 최소를 못 바꾼다",
      detail:
        'b=2 와 b=3 은 마지막 조각 "aab"·"ab" 가 회문이 아니라 건너뛴다. b=4 는 "b" 가 회문이지만 후보가 cut[3] + 1 = 2 라 1 보다 적지 않아 갈래 ⑤ 로 넘어간다.',
      entries: [
        { label: "끝 자리 e", value: "4" },
        { label: "건너뛴 시작 자리", value: 'b=2 "aab" · b=3 "ab"' },
        { label: "시작 자리 b", value: "4" },
        { label: "마지막 조각", value: '"b" — pal[4][4] = T' },
        { label: "후보", value: "cut[3] + 1 = 2" },
        { label: "cut", value: "[0, 1, 0, 1, 1]" },
        { label: "갈래", value: "⑤" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [
        [2, 4],
        [3, 4],
        [4, 4],
      ] as [number, number][],
    },
    {
      title: "T13 컷 표의 마지막 칸을 읽어 돌려준다",
      detail:
        '답은 언제나 cut[n−1] 이다 — 문자열 전체를 덮는 접두사가 그 하나뿐이기 때문이다. 고른 시작 자리를 거슬러 확인하면 "a" | "baab" 가 나온다.',
      entries: [
        { label: "읽는 칸", value: "cut[4]" },
        { label: "답", value: "1" },
        { label: "조각", value: '"a" | "baab" — 조각 둘' },
        { label: "고른 시작 자리", value: "e=4 에서 b=1" },
      ],
      matrix: [
        ["T", "F", "T", "F", "F"],
        ["-", "T", "F", "F", "T"],
        ["-", "-", "T", "T", "F"],
        ["-", "-", "-", "T", "F"],
        ["-", "-", "-", "-", "T"],
      ],
      rowLabels: ["i=0  a", "i=1  b", "i=2  a", "i=3  a", "i=4  b"],
      colLabels: ["j=0", "j=1", "j=2", "j=3", "j=4"],
      cells: [[1, 4]] as [number, number][],
    },
  ] satisfies Frame[],
};
