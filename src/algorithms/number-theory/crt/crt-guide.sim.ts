import type { Frame } from "#guide-sim";

/**
 * `deep.walk`(수행으로 알아보는 알고리즘) 절과 **같은 입력**을 쓴다. 프레임 수는 그 절의
 * T# 단계 수(8)와 같다 — P3 이 그 관계를 잰다.
 *
 * **`keyValue` 단독 뷰다.** 이 절차의 상태는 수 둘(`curR`·`curM`)과 걸음 안의 임시 값
 * 넷(`diff`·`g`·`u`·`t`)뿐이라 배열도 그래프도 트리도 그릴 것이 없다. 같은 카테고리의
 * `extendedEuclidean`(`S24`)·`fftMultiply`(`S26`)가 쓴 뷰이고, 그 편들이 정한 규약 셋을
 * 이어받고 하나를 더한다.
 *
 * 1. **이어받음 — 항목을 프레임마다 같은 것 같은 순서로 두고 없는 값은 `—` 로 둔다.**
 * 2. **이어받음 — 한 식이 연산을 둘 이상 이으면 사이 값을 항목으로 낸다.**
 *    `t = (diff / g) × u mod unit` 한 줄이 그 자리라 `diff / g` 와 `unit` 을 따로 낸다.
 * 3. **이어받음 — 값을 안 바꾼 프레임에도 무엇을 안 바꿨는지 적는다.** T1 은 첫 조건을
 *    그대로 받는 걸음이라 합칠 것이 없다.
 * 4. **신설 — 검산 항목 셋을 매 프레임 적는다.** 이 편의 불변식이 「지금까지 읽은 조건 전부를
 *    `curR` 하나가 동시에 만족한다」이고, `curR` 하나만 봐서는 그것이 참인지 알 수 없다.
 *    법 셋으로 나눈 나머지를 항목 셋으로 두고, **이미 합쳐진 조건**에는 `✓` 를 붙인다.
 *
 * `steps` 는 **인라인 배열 리터럴**이어야 한다(spread·변수 참조·함수 호출 금지).
 * 정적 계수가 실제보다 적게 세면 얇은 전개가 P3 을 그냥 지나간다.
 */
export const crtWalk = {
  view: "keyValue" as const,
  title: "crt([2n, 3n, 2n], [3n, 5n, 7n])",
  result: "x=23, M=105",
  steps: [
    {
      title: "T1 첫 조건을 누적 해로 그대로 받는다",
      detail:
        "조건 x ≡ 2 (mod 3) 하나만 읽은 상태다. 나머지 2 는 이미 [0, 3) 안이라 그대로 두고, 누적 해를 (curR, curM) = (2, 3) 으로 둔다. 합칠 상대가 아직 없어 diff 부터 t 까지는 값이 없다.",
      entries: [
        { label: "curR", value: "2" },
        { label: "curM", value: "3" },
        { label: "새 조건 (r, m)", value: "—" },
        { label: "diff = r − curR", value: "—" },
        { label: "g = gcd(curM, m)", value: "—" },
        { label: "u (curM·u ≡ g mod m)", value: "—" },
        { label: "unit = m / g", value: "—" },
        { label: "t", value: "—" },
        { label: "curR mod 3", value: "2 ✓" },
        { label: "curR mod 5", value: "2" },
        { label: "curR mod 7", value: "2" },
        { label: "갈래", value: "① 첫 조건을 누적 해로 삼는다" },
      ],
    },
    {
      title: "T2 둘째 조건과의 나머지 차와 최대공약수를 낸다",
      detail:
        "새 조건은 x ≡ 3 (mod 5) 다. diff = 3 − 2 = 1 이고 gcd(3, 5) = 1 이다. 확장 유클리드가 함께 낸 계수 u = 2 는 3 × 2 = 6 ≡ 1 (mod 5) 를 만족한다. diff 를 g 로 나눈 나머지가 0 이라 두 조건은 모순이 아니다.",
      entries: [
        { label: "curR", value: "2" },
        { label: "curM", value: "3" },
        { label: "새 조건 (r, m)", value: "(3, 5)" },
        { label: "diff = r − curR", value: "1" },
        { label: "g = gcd(curM, m)", value: "1" },
        { label: "u (curM·u ≡ g mod m)", value: "2" },
        { label: "unit = m / g", value: "—" },
        { label: "t", value: "—" },
        { label: "curR mod 3", value: "2 ✓" },
        { label: "curR mod 5", value: "2" },
        { label: "curR mod 7", value: "2" },
        { label: "갈래", value: "② 1 mod 1 = 0 이라 모순이 아니다" },
      ],
    },
    {
      title: "T3 옮길 칸 수 t 를 한 번에 푼다",
      detail:
        "unit = 5 / 1 = 5 이고 diff / g = 1 이다. t = 1 × 2 mod 5 = 2 — curR 을 curM 칸씩 두 번 옮기면 둘째 조건까지 맞는다는 뜻이다. 후보를 하나씩 만들어 보지 않고 곱셈 한 번으로 나왔다.",
      entries: [
        { label: "curR", value: "2" },
        { label: "curM", value: "3" },
        { label: "새 조건 (r, m)", value: "(3, 5)" },
        { label: "diff = r − curR", value: "1" },
        { label: "g = gcd(curM, m)", value: "1" },
        { label: "u (curM·u ≡ g mod m)", value: "2" },
        { label: "unit = m / g", value: "5" },
        { label: "t", value: "2" },
        { label: "curR mod 3", value: "2 ✓" },
        { label: "curR mod 5", value: "2" },
        { label: "curR mod 7", value: "2" },
        { label: "갈래", value: "③ t 를 [0, 5) 에서 푼다" },
      ],
    },
    {
      title: "T4 누적 해를 갱신한다 — 조건 둘이 하나가 됐다",
      detail:
        "curR = 2 + 3 × 2 = 8 이고 curM = 3 × 5 = 15 다. 조건 둘이 x ≡ 8 (mod 15) 하나로 합쳐졌다. 8 은 [0, 15) 안이라 따로 맞출 자리가 없다.",
      entries: [
        { label: "curR", value: "8" },
        { label: "curM", value: "15" },
        { label: "새 조건 (r, m)", value: "(3, 5)" },
        { label: "diff = r − curR", value: "1" },
        { label: "g = gcd(curM, m)", value: "1" },
        { label: "u (curM·u ≡ g mod m)", value: "2" },
        { label: "unit = m / g", value: "5" },
        { label: "t", value: "2" },
        { label: "curR mod 3", value: "2 ✓" },
        { label: "curR mod 5", value: "3 ✓" },
        { label: "curR mod 7", value: "1" },
        { label: "갈래", value: "③ curR 과 curM 을 함께 갱신한다" },
      ],
    },
    {
      title: "T5 셋째 조건과의 나머지 차와 최대공약수를 낸다",
      detail:
        "새 조건은 x ≡ 2 (mod 7) 다. diff = 2 − 8 = −6 으로 음수가 나오는데, 이 값은 옮길 칸 수를 풀 때만 쓰이고 나중에 [0, unit) 로 맞춰진다. gcd(15, 7) = 1 이고 u = 1 은 15 × 1 = 15 ≡ 1 (mod 7) 을 만족한다.",
      entries: [
        { label: "curR", value: "8" },
        { label: "curM", value: "15" },
        { label: "새 조건 (r, m)", value: "(2, 7)" },
        { label: "diff = r − curR", value: "−6" },
        { label: "g = gcd(curM, m)", value: "1" },
        { label: "u (curM·u ≡ g mod m)", value: "1" },
        { label: "unit = m / g", value: "—" },
        { label: "t", value: "—" },
        { label: "curR mod 3", value: "2 ✓" },
        { label: "curR mod 5", value: "3 ✓" },
        { label: "curR mod 7", value: "1" },
        { label: "갈래", value: "② −6 mod 1 = 0 이라 모순이 아니다" },
      ],
    },
    {
      title: "T6 옮길 칸 수 t 를 한 번에 푼다",
      detail:
        "unit = 7 / 1 = 7 이고 diff / g = −6 이다. t = −6 × 1 mod 7 = 1 — 음수였던 값이 [0, 7) 안의 1 로 맞춰졌다. 이 맞춤이 없으면 다음 걸음의 curR 이 음수가 된다.",
      entries: [
        { label: "curR", value: "8" },
        { label: "curM", value: "15" },
        { label: "새 조건 (r, m)", value: "(2, 7)" },
        { label: "diff = r − curR", value: "−6" },
        { label: "g = gcd(curM, m)", value: "1" },
        { label: "u (curM·u ≡ g mod m)", value: "1" },
        { label: "unit = m / g", value: "7" },
        { label: "t", value: "1" },
        { label: "curR mod 3", value: "2 ✓" },
        { label: "curR mod 5", value: "3 ✓" },
        { label: "curR mod 7", value: "1" },
        { label: "갈래", value: "③ t 를 [0, 7) 에서 푼다" },
      ],
    },
    {
      title: "T7 누적 해를 갱신한다 — 조건 셋이 하나가 됐다",
      detail:
        "curR = 8 + 15 × 1 = 23 이고 curM = 15 × 7 = 105 다. 세 조건이 x ≡ 23 (mod 105) 하나로 합쳐졌고, 23 은 [0, 105) 안이다.",
      entries: [
        { label: "curR", value: "23" },
        { label: "curM", value: "105" },
        { label: "새 조건 (r, m)", value: "(2, 7)" },
        { label: "diff = r − curR", value: "−6" },
        { label: "g = gcd(curM, m)", value: "1" },
        { label: "u (curM·u ≡ g mod m)", value: "1" },
        { label: "unit = m / g", value: "7" },
        { label: "t", value: "1" },
        { label: "curR mod 3", value: "2 ✓" },
        { label: "curR mod 5", value: "3 ✓" },
        { label: "curR mod 7", value: "2 ✓" },
        { label: "갈래", value: "③ curR 과 curM 을 함께 갱신한다" },
      ],
    },
    {
      title: "T8 읽을 조건이 없어 그대로 낸다",
      detail:
        "반복이 끝났다. 누적 해 (curR, curM) = (23, 105) 를 { x, M } 으로 그대로 낸다. 세 나머지가 입력과 같고 105 는 3 · 5 · 7 의 최소공배수다.",
      entries: [
        { label: "curR", value: "23" },
        { label: "curM", value: "105" },
        { label: "새 조건 (r, m)", value: "—" },
        { label: "diff = r − curR", value: "—" },
        { label: "g = gcd(curM, m)", value: "—" },
        { label: "u (curM·u ≡ g mod m)", value: "—" },
        { label: "unit = m / g", value: "—" },
        { label: "t", value: "—" },
        { label: "curR mod 3", value: "2 ✓" },
        { label: "curR mod 5", value: "3 ✓" },
        { label: "curR mod 7", value: "2 ✓" },
        { label: "갈래", value: "반복이 끝나 { x: 23n, M: 105n } 을 낸다" },
      ],
    },
  ] satisfies Frame[],
};
