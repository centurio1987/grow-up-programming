/**
 * `check-v2.ts` 자기시험 — 통과 표본 1벌 + 각 P 를 어기는 결함 표본 10벌.
 *
 * **판정기는 자기가 못 잡는 것을 스스로 말하지 않는다.** 규칙 하나가 조용히 꺼져도 화면에는
 * "통과" 로 뜨고, 그 상태가 곧 "검사하지 않는 검사" 다. 그래서 각 규칙마다 **그 규칙만
 * 어기는 표본**을 두고, 통과 표본이 계속 통과하는지도 함께 본다.
 */
import { expect, test } from "bun:test";
import { scan } from "./check-metaphor.ts";
import {
  check,
  displayWidth,
  finalCodeMatchesRef,
  generatedBlockAlignment,
  hasFigure,
  normalizeCode,
  parseSim,
} from "./check-v2.ts";
import { parseSections } from "./section.ts";

/** P1~P15 를 전부 만족하는 표본. 각 결함 표본은 여기서 한 곳만 어긋뜨린다. */
const PASSING = `# 시험용 — 전체를 보는 부제

## 파트 1 — 아이디어에서 동작하는 코드까지

전체 그림을 먼저 보고, 아이디어가 성립하는 경로를 따라간 다음 코드까지 갑니다.

### 전체 컨셉

두 포인터를 양 끝에서 좁혀 오면 한 번의 순회로 답이 나온다.

\`\`\`text
[1 2 3 4]
 ^     ^
 l     r
\`\`\`

### 시작하기 전에 — 이미 알고 있어야 하는 것

- 배열의 인덱스가 0부터라는 것
- 부분합이 무엇인지

### 아이디어 상세 — 두 포인터를 떠올리는 과정

**① 문제를 고정한다.** 정렬된 배열에서 합이 target 인 두 수를 찾는다. n 은 최대 10만이다.

**② 가장 단순한 방법을 세우고 수치로 반박한다.** 모든 쌍을 세면 입력이 10만일 때 50억 번이다.

\`\`\`text
쌍의 수 = n(n-1)/2
\`\`\`

정렬돼 있으면 양 끝에서 좁혀도 답을 안 놓친다.

**④ 비용이 무엇에 달렸는지 두 경우를 재서 보인다.** 모든 쌍은 6번, 양 끝에서 좁히면 3번이다.

\`\`\`text
[1 2 3 4]  모든 쌍 6번   양 끝 3번
\`\`\`

**⑤ 두 포인터를 개념으로 정의한다.** l 은 0, r 은 n-1 에서 출발해 합을 보고 한쪽만 당긴다.

\`\`\`text
l=0 r=3  합 5 > 4 → r--
l=0 r=2  합 4 = 4 → 찾았다
\`\`\`

**⑥ 그 개념의 결론을 값으로 낸다.** n = 4 에서 비교가 3번, n = 8 에서 7번이다.

### 수행으로 알아보는 알고리즘 — 양 끝에서 좁혀 답을 찾는다

절차 전체를 한 장으로 먼저 본다.

\`\`\`text
l ← 0, r ← n-1
while l < r: 합을 보고 한쪽을 당긴다
\`\`\`

#### 1. 양 끝에서 좁히기

한쪽만 당겨야 답을 안 놓친다.

\`\`\`text
l→   ←r
\`\`\`

#### 2. 합을 보고 한쪽을 당긴다

목표보다 작으면 왼쪽을, 크면 오른쪽을 당긴다.

\`\`\`text
합 < 목표 → l++        합 > 목표 → r--
\`\`\`

#### 3. 만나면 멈춘다

l 과 r 이 만나면 더 볼 쌍이 없다.

\`\`\`text
[1 2 3 4]  l=1 r=2 → 여기서 끝
\`\`\`

#### 멈춤 — 정렬을 건너뛰고 싶어지는 자리

정렬이 없으면 버리는 쪽에 답이 남는다.

\`\`\`text
[3 1 2] 에서 오해는 4 를, 옳은 답은 3 을 낸다
\`\`\`

#### 4. 네 원소를 실제로 좁혀 본다

<!--viz:demo-->
\`\`\`text
T1 [1 2 3 4]  l=0 r=3
\`\`\`

<!--result:demo=3-->

- T1 l=0, r=3 이라 l < r 이 참 — ① 을 실행한다
- T2 합이 3 이라 목표보다 작다
- T3 l=1 로 옮긴다
- T4 합이 5 라 목표보다 크다 — ② 를 실행한다
- T5 r=2 로 옮긴다
- T6 l=1, r=2 에서 답을 찾는다

#### 5. 전체 코드

\`\`\`ts
export function pair(xs: number[], t: number) {
  if (sum < t) l++; // ①
  else r--; //        ②
  return xs.length;
}
\`\`\`

## 파트 2 — 적용 조건 · 보장 · 비용

만든 것을 따져 봅니다.

### 이 알고리즘이 최적의 솔루션인 경우

#### 최적인 문제의 모양

정렬된 수열에서 조건을 만족하는 쌍을 찾는 문제.

#### 문제에서 이것을 떠올리게 하는 단서

- 입력이 이미 정렬돼 있다
- 답이 쌍이다

#### 실제로 쓰이는 곳

Go 표준 라이브러리의 sort 패키지 (https://pkg.go.dev/sort, 조회 2026-08-19).

#### 경쟁 설계와의 대조

이진 탐색으로 짝을 찾는 방법이 있다. 같은 입력에서 비교 172 회 대 34 회다.

### 불변식 — l 왼쪽과 r 오른쪽에는 답이 될 수 있는 쌍이 남지 않는다

버리는 쪽에 답이 있을 수 없습니다. 빈 입력과 크기 1 은 즉시 반환합니다.

\`\`\`text
[1 2 3 4]   l=1 r=2      버린 구간 [0,0] 과 [3,3] 에 답이 없다
\`\`\`

\`l++\` 를 \`l--\` 로 바꾸면 이 불변식이 깨지고 무한히 반복됩니다.

\`\`\`text
[1 2 3 4] → 반환 없음(정지하지 않음)
\`\`\`

### 비용 계산

#### 비용을 세는 과정

T1 부터 T6 까지 각 걸음이 포인터를 하나씩 당긴다.

\`\`\`text
걸음 수 ≤ n
\`\`\`

#### 케이스별 비용과 그 경계

최악에서도 타이트하게 Θ(n) 이고, 정렬 비용을 더하면 Θ(n log n) 이다.

#### 최악을 만드는 입력

답이 맨 끝에 있는 입력.

\`\`\`text
[1 2 3 100]  목표 101
\`\`\`

### 스스로 점검하기

양 끝에서 좁히면 한 번의 순회로 끝납니다. l 이 r 을 넘으면 어떻게 될까요?

\`\`\`text
[1 2 3 4]  l=1 r=2 → 여기가 마지막
\`\`\`

<!--check:c1-->
넘지 않는다. 좁히는 폭이 매번 1이라 만나는 순간 멈춘다.
<!--/check-->

- T3 에서 왜 l 을 옮겼는가?
- 정렬이 없으면 어디가 깨지는가?
`;

const SIM = `export const demo = {
  view: "array",
  steps: [
    { title: "시작", array: [1, 2, 3, 4] },
    { title: "좁힘", array: [1, 2, 3, 4] },
    { title: "끝", array: [1, 2, 3, 4] },
  ],
  title: "두 포인터",
  result: "3",
};
`;

const codes = (f: ReturnType<typeof check>) => f.map((x) => x.code).sort();

test("통과 표본은 P1~P14 를 전부 통과한다", () => {
  const findings = check({ text: PASSING, sim: SIM, bench: { 비교: 34 } });
  expect(findings).toEqual([]);
});

test("절 식별 — 모르는 헤딩은 에러이고, 나머지 판정은 멈춘다", () => {
  const findings = check({ text: `${PASSING}\n## 정체 불명의 절\n본문.\n` });
  expect(codes(findings)).toEqual(["SEC"]);
  expect(findings[0]?.detail).toContain("정체 불명의 절");
});

test("절 식별 — deep.walk.step 은 잔여로 여럿 잡힌다", () => {
  const { sections, unresolved } = parseSections(PASSING);
  expect(unresolved).toEqual([]);
  expect(
    sections.filter((s) => s.id === "deep.walk.step").map((s) => s.heading),
  ).toEqual([
    "#### 1. 양 끝에서 좁히기",
    "#### 2. 합을 보고 한쪽을 당긴다",
    "#### 3. 만나면 멈춘다",
    "#### 4. 네 원소를 실제로 좁혀 본다",
  ]);
  expect(sections.some((s) => s.id === "deep.walk.pause")).toBe(true);
  expect(sections.some((s) => s.id === "deep.walk.final")).toBe(true);
});

test("P3 — 폐기된 항목 이름이 소절로 되살아나면 걸린다", () => {
  const text = PASSING.replace(
    "### 3. 만나면 멈춘다",
    "### 3. 한 입력으로 끝까지 굴려 보기",
  );
  expect(
    check({ text }).some(
      (f) => f.code === "P3" && f.detail.includes("폐기된 항목 이름"),
    ),
  ).toBe(true);
});

test("P3 — `전체 코드` 는 폐기 이름이 아니다", () => {
  expect(
    check({ text: PASSING }).some((f) => f.detail.includes("폐기된 항목 이름")),
  ).toBe(false);
});

test("P3 — 멈춤 소절이 없으면 걸린다", () => {
  const text = PASSING.replace(
    "### 멈춤 — 정렬을 건너뛰고 싶어지는 자리",
    "### 3b. 정렬을 건너뛰고 싶어지는 자리",
  );
  expect(
    check({ text }).some((f) => f.code === "P3" && f.detail.includes("멈춤")),
  ).toBe(true);
});

test("P1 — 그림 없는 산문이 3문단 연달으면 걸린다", () => {
  const text = PASSING.replace(
    "정렬된 수열에서 조건을 만족하는 쌍을 찾는 문제.",
    "첫째 문단.\n\n둘째 문단.\n\n셋째 문단.",
  );
  expect(codes(check({ text }))).toContain("P1");
});

test("P1 — `<!--check-->` 마커는 그림이 아니다", () => {
  // 구 구현은 `<` 로 시작하는 줄을 그림으로 셌다. 그대로 두면 마커가 연속을 끊는다.
  const text = PASSING.replace(
    "정렬된 수열에서 조건을 만족하는 쌍을 찾는 문제.",
    "첫째 문단.\n\n<!--check:x-->\n\n둘째 문단.\n\n셋째 문단.",
  );
  expect(codes(check({ text }))).toContain("P1");
});

/** `deep.math` 는 조건부 절이라 통과 표본에 없다. 있을 때만 검사되는 것을 확인한다. */
const WITH_MATH = (body: string) =>
  PASSING.replace(
    "### 불변식 — ",
    `### 수식 정의와 유도\n\n${body}\n\n### 불변식 — `,
  );

test("P7 — deep.math 가 없는 것은 위반이 아니다", () => {
  expect(check({ text: PASSING }).some((f) => f.code === "P7")).toBe(false);
});

test("P7 — deep.math 에 코드 펜스가 없으면 걸린다", () => {
  const text = WITH_MATH("합은 $n(n-1)/2$ 이다.\n\n```text\n그림만 있다\n```");
  expect(
    check({ text }).some(
      (f) => f.code === "P7" && f.detail.includes("코드 펜스가 없다"),
    ),
  ).toBe(true);
});

test("P7 — deep.math 에 그림과 코드가 다 있으면 통과한다", () => {
  const text = WITH_MATH(
    "합은 $n(n-1)/2$ 이다.\n\n```text\n그림\n```\n\n```ts\nconst pairs = (n: number) => (n * (n - 1)) / 2;\n```",
  );
  expect(check({ text }).some((f) => f.code === "P7")).toBe(false);
});

test("P2 — 실행을 '돌다' 로 말하면 걸린다", () => {
  for (const bad of [
    "이 코드가 도는 모습을 본다.",
    "한 번 돌리면 값이 나온다.",
    "루프가 세 번 돈다.",
  ]) {
    const text = PASSING.replace("버리는 쪽에 답이 있을 수 없습니다.", bad);
    expect(
      check({ text }).some(
        (f) => f.code === "P2" && f.detail.includes("'돌다' 로 말한 다의어"),
      ),
    ).toBe(true);
  }
});

test("P2 — 반환·커서 이동·명사 뒤 조사는 '돌다' 로 걸리지 않는다", () => {
  const text = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "답을 원래 자리에 넣어 돌려준다. curR 은 구역이 바뀔 때 되돌아간다. 유도는 뒤 절이 맡는다.",
  );
  expect(check({ text }).some((f) => f.detail.includes("'돌다'"))).toBe(false);
});

test("P2 — 헤딩에 존댓말 종결이 올라오면 걸린다", () => {
  const text = PASSING.replace(
    "## 파트 1 — 아이디어에서 동작하는 코드까지",
    "## 파트 1 — 아이디어에서 동작하는 코드까지 따라가 봅니다",
  );
  expect(
    check({ text }).some(
      (f) => f.code === "P2" && f.detail.includes("존댓말 종결이 올라왔다"),
    ),
  ).toBe(true);
});

test("P2 — 반말 평서 종결 헤딩은 이 저장소의 관례라 걸리지 않는다", () => {
  // `#### 2. 합을 보고 한쪽을 당긴다` 처럼 이미 쓰고 있는 형태다.
  expect(
    check({ text: PASSING }).some((f) =>
      f.detail.includes("존댓말 종결이 올라왔다"),
    ),
  ).toBe(false);
});

test("P2 — voice 금지 문형", () => {
  const text = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "자명합니다.",
  );
  expect(codes(check({ text }))).toContain("P2");
});

test("P2 — 비용·승부·실패 은유를 잡는다", () => {
  // **활용형까지 잡아야 한다.** `싸다` 만 넣었던 첫 판은 `싼지` 를 놓쳤다.
  const cases = [
    "그 비교가 싸다.",
    "메모리 할당이 비싸다.",
    "왜 이 순서가 싼지가 드러난다.",
    "비교가 싸고 메모리도 적게 쓴다.",
    "일반성에서는 이 절차가 이긴다.",
    "어느 쪽이 이겼는지가 남지 않는다.",
    "조건을 어기면 불변식이 무너진다.",
    "여기서 프로세스가 죽는다.",
    "분기 ① 을 밟았다.",
  ];
  for (const bad of cases) {
    const text = PASSING.replace("버리는 쪽에 답이 있을 수 없습니다.", bad);
    expect(codes(check({ text }))).toContain("P2");
  }
});

test("P2 — 순회·이동·지각·적용 은유도 잡는다", () => {
  const cases = [
    "배열을 한 번 훑는다.",
    "오른쪽 끝이 한 방향으로만 흐른다.",
    "curL 이 폭 안에서만 논다.",
    "왜 이 순서가 적은지가 눈에 보인다.",
    "값으로 드러난다.",
    "조각을 입력에 걸면 값이 나온다.",
    "맵을 들고 다닌다.",
    "표를 되짚어 확인한다.",
  ];
  for (const bad of cases) {
    const text = PASSING.replace("버리는 쪽에 답이 있을 수 없습니다.", bad);
    expect(codes(check({ text }))).toContain("P2");
  }
});

test("P2 — '되짚' 은 어간으로 잡는다 (활용형 누락 재발 방지)", () => {
  // `되짚[어은]` 이던 첫 판이 `되짚으면` 을 놓쳤고, 파일럿 4편의 `selfcheck` 첫 문장에
  // 그대로 남아 있었다(2026-08-28). `싸다`→`싼지`(R7) 와 같은 모양의 세 번째 재발이다.
  const cases = ["되짚어", "되짚은", "되짚으면", "되짚었다", "되짚는다"];
  for (const form of cases) {
    const text = PASSING.replace(
      "버리는 쪽에 답이 있을 수 없습니다.",
      `여기까지 온 것을 ${form} 이렇습니다.`,
    );
    expect(codes(check({ text }))).toContain("P2");
  }
});

test("P2 — 다의어 '닿다' 를 잡는다", () => {
  // `SPEC.md` §6 `L33` 이 이름을 댄 넷 중 원고에서 반복해 나온 것이 `닿다` 다.
  const cases = ["j 가 hi 에 닿는다.", "값이 닿지 않은 자리다.", "끝에 닿으면"];
  for (const bad of cases) {
    const text = PASSING.replace("버리는 쪽에 답이 있을 수 없습니다.", bad);
    expect(codes(check({ text }))).toContain("P2");
  }
});

test("P2 — '맞닿' 은 '닿다' 다의어가 아니다", () => {
  const text = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "두 구역이 맞닿는 자리가 경계다.",
  );
  expect(codes(check({ text }))).not.toContain("P2");
});

test("P2 — 낫표 안은 인용이라 은유를 잡지 않는다", () => {
  // 규칙 정의와 절 제목 인용이 낫표로 들어간다. 이것까지 잡으면 규칙을 적을 수 없고,
  // 원고는 인용을 지우는 쪽으로 움직인다.
  const inside = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "「멈춤 — 표를 되짚어 확인한다」 에서 값으로 확인했습니다.",
  );
  expect(codes(check({ text: inside }))).not.toContain("P2");
  // 낫표 밖은 그대로 본다.
  const outside = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "「멈춤」 에서 표를 되짚어 확인한다.",
  );
  expect(codes(check({ text: outside }))).toContain("P2");
});

test("은유 스캐너 — 낫표 안은 자료라 뺀다", () => {
  expect(scan("SPEC.md", "규칙은 「닿다」 를 다의어로 든다.").length).toBe(0);
  expect(scan("SPEC.md", "그 목표에 닿는가 를 묻는다.").length).toBe(1);
});

test("은유 스캐너 — 인라인 인용 안은 자료라 빼고, 밖은 본다", () => {
  // 한 문단이 인용과 본문을 함께 담는 것이 이 저장소의 서술 형태다.
  expect(scan("SPEC.md", '유저가 *"코드가 도는 것"* 이라 적었다.').length).toBe(
    0,
  );
  expect(
    scan("SPEC.md", '유저가 *"고쳐라"* 라 했고, 코드가 도는 모습을 뺐다.')
      .length,
  ).toBe(1);
});

test("은유 스캐너 — 두 줄에 걸친 인라인 인용도 안쪽으로 본다", () => {
  // `SURVEY.md:50-51` 이 실제로 이 모양이었다 — 줄마다 따로 지우면 뒷줄이 본문으로 보인다.
  const text = ['규칙은 *"후보 중에서,', '테스트가 도는 편 첫째"* 였다.'].join(
    "\n",
  );
  expect(scan("SURVEY.md", text).length).toBe(0);
});

test("은유 스캐너 — 인용 블록은 검사하지 않는다", () => {
  // "이렇게 쓰면 안 된다" 는 예시가 인용으로 들어간다. 그것까지 잡으면 규칙을 적을 수 없다.
  expect(scan("SPEC.md", "> 비교가 싸다 는 쓰지 않는다.").length).toBe(0);
  expect(scan("SPEC.md", "비교가 싸다 고 적었다.").length).toBe(1);
});

test("P2 — '감싸다' 는 비용 은유가 아니다", () => {
  const text = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "바깥 함수가 내부 상태를 감싸다.",
  );
  expect(codes(check({ text }))).not.toContain("P2");
});

test("P2 — 은유적 '서다' 를 잡는다", () => {
  const text = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "전체 비교 횟수가 이렇게 서고, 남은 것은 하나다.",
  );
  expect(codes(check({ text }))).toContain("P2");
});

test("P2 — '여기서 고르면' 은 은유적 '서다' 가 아니다", () => {
  const text = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "여기서 고르면 답이 갈린다.",
  );
  expect(codes(check({ text }))).not.toContain("P2");
});

test("P3 — T# 단계가 6 미만", () => {
  const text = PASSING.replace("- T6 l=1, r=2 에서 답을 찾는다\n", "");
  expect(
    check({ text }).some((f) => f.code === "P3" && f.detail.includes("< 6")),
  ).toBe(true);
});

test("P3 — steps 에 spread 가 있으면 통과가 아니라 에러다", () => {
  const sim = `const base = [{ a: 1 }, { a: 2 }];
export const demo = { view: "array", steps: [...base, { a: 3 }], title: "t", result: "3" };
`;
  const parsed = parseSim(sim);
  expect(parsed.violations.length).toBe(1);
  expect(parsed.violations[0]).toContain("spread");
  expect(codes(check({ text: PASSING, sim }))).toContain("P3");
});

test("P3 — 인라인 배열은 최상위 원소만 센다", () => {
  const parsed = parseSim(SIM);
  expect(parsed.entries.get("demo")?.frames).toBe(3);
  expect(parsed.violations).toEqual([]);
});

test("P4 — 전체 코드의 분기를 전개가 안 밟으면 걸린다", () => {
  const text = PASSING.replace(
    "- T4 합이 5 라 목표보다 크다 — ② 를 실행한다",
    "- T4 합이 크다",
  );
  expect(
    check({ text }).some((f) => f.code === "P4" && f.detail.includes("②")),
  ).toBe(true);
});

test("P5 — perf.derive 가 T# 를 안 쓰면 걸린다", () => {
  const text = PASSING.replace(
    "T1 부터 T6 까지 각 걸음이 포인터를 하나씩 당긴다.",
    "각 걸음이 포인터를 하나씩 당긴다.",
  );
  expect(codes(check({ text }))).toContain("P5");
});

test("P5 — trace 에 없는 단계를 가리키면 걸린다", () => {
  const text = PASSING.replace(
    "- T3 에서 왜 l 을 옮겼는가?",
    "- T9 에서 왜 l 을 옮겼는가?",
  );
  expect(
    check({ text }).some((f) => f.code === "P5" && f.detail.includes("T9")),
  ).toBe(true);
});

test("P6 — 마커와 sim export 가 어긋나면 걸린다", () => {
  const sim = SIM.replace("export const demo", "export const other");
  expect(codes(check({ text: PASSING, sim }))).toContain("P6");
});

test("P7 — 그림을 져야 하는 절에 그림이 없으면 걸린다", () => {
  const text = PASSING.replace("```text\n[1 2 3 100]  목표 101\n```\n", "");
  expect(
    check({ text }).some(
      (f) => f.code === "P7" && f.where?.startsWith("perf.worst"),
    ),
  ).toBe(true);
});

test("P7 — deep.walk.step 의 코드 스니펫은 그림으로 세지 않는다", () => {
  // 전개는 소절마다 코드를 싣는 절이라, 코드를 그림으로 세면 P7 이 통째로 무력해진다.
  const codeOnly = {
    id: "deep.walk.step",
    heading: "### 1. 한 걸음",
    line: 1,
    level: 4,
    body: ["```ts", "const a = 1;", "```"],
  };
  expect(hasFigure(codeOnly)).toBe(false);
  expect(hasFigure({ ...codeOnly, id: "concept" })).toBe(true);
  expect(hasFigure({ ...codeOnly, body: ["```text", "그림", "```"] })).toBe(
    true,
  );
});

test("P8 — concept 이 뒤 절 헤딩을 참조하면 걸린다", () => {
  const text = PASSING.replace(
    "두 포인터를 양 끝에서 좁혀 오면 한 번의 순회로 답이 나온다.",
    "자세한 것은 최악을 만드는 입력 에서 본다.",
  );
  expect(codes(check({ text }))).toContain("P8");
});

test("P9 — sim 의 result 와 본문 마커가 다르면 걸린다", () => {
  const sim = SIM.replace('result: "3"', 'result: "4"');
  expect(check({ text: PASSING, sim }).some((f) => f.code === "P9")).toBe(true);
});

test("P10 — 실측값이 purpose.alt 에 없으면 걸린다", () => {
  const findings = check({ text: PASSING, sim: SIM, bench: { 비교: 999 } });
  expect(
    findings.some((f) => f.code === "P10" && f.detail.includes("999")),
  ).toBe(true);
});

test("은유 스캐너 — 문서 전체를 보고, 인용 문서와 소스는 뺀다", () => {
  const hits = scan(
    "SPEC.md",
    "이 절차가 이긴다.\n\n```text\n비교가 싸다\n```\n",
  );
  // 그림 안의 설명도 독자가 읽으므로 펜스 안까지 본다. 어간으로 잡으므로 걸린 문자열은
  // 활용형 전체가 아니라 어간이다(2026-09-04) — 보고는 그 줄을 그대로 함께 낸다.
  expect(hits.map((h) => h.found)).toEqual(["이긴", "싸"]);
  expect(scan("x.md", "정렬 비용이 크다.").length).toBe(0);
});

/**
 * **라벨 좌표 정합** — 2026-08-27 유저 지적의 회귀 시험.
 *
 * `Q3(0,3)`(키)과 `Q3[1,3]`(구간)이 200줄 떨어져 나온 것을 라인 단위 `NOTATION` 이 못 잡았다.
 */
test("P2 — 같은 라벨에 대괄호와 소괄호를 섞으면 걸린다", () => {
  const bad = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "Q3[1,3] 을 먼저 본다.",
  ).replace("답이 맨 끝에 있는 입력.", "정렬하면 Q3(0,3) 이 앞이다.");
  const hit = check({ text: bad }).filter(
    (f) => f.code === "P2" && f.detail.includes("라벨 표기 혼용"),
  );
  expect(hit.length).toBe(1);
  expect(hit[0]?.detail).toContain("Q3");
});

test("P2 — 같은 라벨에 다른 좌표를 붙이면 걸린다", () => {
  const bad = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "Q3[1,3] 을 먼저 본다.",
  ).replace("답이 맨 끝에 있는 입력.", "규모를 키우면 Q3[2,9] 다.");
  expect(
    check({ text: bad }).some(
      (f) => f.code === "P2" && f.detail.includes("라벨 좌표 불일치"),
    ),
  ).toBe(true);
});

test("P2 — 라벨 좌표가 한 벌이거나 좌표가 아니면 걸리지 않는다", () => {
  // 값 나열(`T1 [5 2 3 1]`)과 규칙 참조(`L10(그림 의무)`)는 좌표쌍이 아니다.
  const ok = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "Q3[1,3] 을 본다. T1 [5 2 3 1] 과 L10(그림 의무)는 좌표가 아니다.",
  ).replace("답이 맨 끝에 있는 입력.", "Q3[1,3] 이 그 입력이다.");
  expect(check({ text: ok }).some((f) => f.detail.includes("라벨"))).toBe(
    false,
  );
});

test("P2 — 구간 표기와 값 나열을 섞으면 걸린다", () => {
  const bad = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "창 [1 1 2] 에서 시작한다.",
  );
  expect(
    check({ text: bad }).some(
      (f) => f.code === "P2" && f.detail.includes("표기 혼용"),
    ),
  ).toBe(true);
  const ok = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    "창 [0,2] 의 값 1 1 2 에서 시작한다.",
  );
  expect(check({ text: ok }).some((f) => f.detail.includes("표기 혼용"))).toBe(
    false,
  );
});

/* ────────────── 2026-08-28 유저 지시 3건 — L34·L35·L36 ────────────── */

/** `### 알아 두면 좋은 개념 — …` 한 벌. 그림을 지고 있다. */
const RELATED = `### 알아 두면 좋은 개념 — 마르코프 성질

앞에서 상태를 두 수로 적었습니다. 그 성질에는 이름이 있어요.

\`\`\`text
상태가 같으면 앞으로 할 수 있는 일이 같다 → 마르코프 성질
\`\`\`
`;

/** 표본에서 `#### 경쟁 설계와의 대조` 절만 들어낸다. */
const withoutAlt = (text: string): string =>
  text.replace(
    "#### 경쟁 설계와의 대조\n\n이진 탐색으로 짝을 찾는 방법이 있다. 같은 입력에서 비교 172 회 대 34 회다.\n\n",
    "",
  );

test("related — 파트 1 마지막에 있으면 통과한다", () => {
  const text = PASSING.replace(
    "## 파트 2 — 적용 조건 · 보장 · 비용",
    `${RELATED}\n## 파트 2 — 적용 조건 · 보장 · 비용`,
  );
  const findings = check({ text, sim: SIM, bench: { 비교: 34 } });
  expect(findings).toEqual([]);
});

test("related — 없어도 위반이 아니다(조건부 절이다)", () => {
  const findings = check({ text: PASSING, sim: SIM, bench: { 비교: 34 } });
  expect(findings).toEqual([]);
});

test("P7 — related 에 그림이 없으면 걸린다", () => {
  const text = PASSING.replace(
    "## 파트 2 — 적용 조건 · 보장 · 비용",
    "### 알아 두면 좋은 개념 — 마르코프 성질\n\n상태가 같으면 앞으로 할 수 있는 일이 같습니다.\n\n## 파트 2 — 적용 조건 · 보장 · 비용",
  );
  const findings = check({ text, sim: SIM, bench: { 비교: 34 } });
  expect(codes(findings)).toEqual(["P7"]);
});

test("P8 — related 가 파트 2 뒤에 있으면 걸린다", () => {
  const text = `${PASSING}\n${RELATED}`;
  const findings = check({ text, sim: SIM, bench: { 비교: 34 } });
  expect(codes(findings)).toEqual(["P8"]);
});

test("P8 — related 가 deep.walk 앞에 있으면 걸린다", () => {
  const text = PASSING.replace(
    "### 수행으로 알아보는 알고리즘 — 양 끝에서 좁혀 답을 찾는다",
    `${RELATED}\n### 수행으로 알아보는 알고리즘 — 양 끝에서 좁혀 답을 찾는다`,
  );
  const findings = check({ text, sim: SIM, bench: { 비교: 34 } });
  expect(codes(findings)).toEqual(["P8"]);
});

test("purpose.alt — 생략하고 실측값도 없으면 통과한다(조건부 절이다)", () => {
  const findings = check({ text: withoutAlt(PASSING), sim: SIM });
  expect(findings).toEqual([]);
});

test("P10 — purpose.alt 를 생략했는데 실측값이 남아 있으면 걸린다", () => {
  const findings = check({
    text: withoutAlt(PASSING),
    sim: SIM,
    bench: { 비교: 34 },
  });
  expect(codes(findings)).toEqual(["P10"]);
});

/* ────────────────── P11·P12·P13 기호 규약 (`L38`~`L40`) ────────────────── */

/** 기호표를 `deep.build` ① 자리에 끼운다. 행 수와 선언은 인자로 갈아 끼운다. */
function withSymbols(count: string, rows: string[]): string {
  const table = [
    `이 글이 쓰는 기호는 ${count}이에요. 여기서 정하고 끝까지 같은 뜻으로 씁니다.`,
    "",
    "| 기호 | 무엇인가 | 이 문제에서 |",
    "| --- | --- | --- |",
    ...rows,
  ].join("\n");
  return PASSING.replace(
    "**① 문제를 고정한다.**",
    `${table}\n\n**① 문제를 고정한다.**`,
  );
}

const TWO_ROWS = [
  "| `n` | 배열의 길이 | `n ≤ 10^5` |",
  "| `l` | 왼쪽 끝 | `0 ≤ l` |",
];

test("P11 — 기호 개수 선언과 표 행 수가 어긋나면 걸린다", () => {
  const findings = check({
    text: withSymbols("여섯", TWO_ROWS),
    sim: SIM,
    bench: { 비교: 34 },
  });
  expect(codes(findings)).toEqual(["P11"]);
  expect(findings[0]?.detail).toContain("여섯");
  expect(findings[0]?.detail).toContain("2행");
});

test("P11 — 선언과 표가 맞으면 걸리지 않는다", () => {
  const findings = check({
    text: withSymbols("둘", TWO_ROWS),
    sim: SIM,
    bench: { 비교: 34 },
  });
  expect(findings).toEqual([]);
});

test("P11 — 선언이 없으면 미실행이다(기호표만으로는 안 잰다)", () => {
  const text = withSymbols("둘", TWO_ROWS).replace(
    "이 글이 쓰는 기호는 둘이에요. 여기서 정하고 끝까지 같은 뜻으로 씁니다.\n\n",
    "",
  );
  expect(check({ text, sim: SIM, bench: { 비교: 34 } })).toEqual([]);
});

test("P11 — 표 밖에서 정의한 기호는 위반이 아니다", () => {
  // `SPEC` `L21` 은 「그 자리 또는 앞에서」 정의를 요구한다. 파생 기호를 처음 쓰는 자리에서
  // 정의하는 것이 규격이므로, 표에 없다는 이유로 잡으면 규칙이 원고와 어긋난다.
  const text = withSymbols("둘", TWO_ROWS).replace(
    "**① 문제를 고정한다.**",
    "구역 크기 `B` 를 여기서 정합니다.\n\n```text\nB = 2\n```\n\n**① 문제를 고정한다.**",
  );
  expect(check({ text, sim: SIM, bench: { 비교: 34 } })).toEqual([]);
});

test("P12 — 밝힌 코드 이름이 코드에 없으면 걸린다", () => {
  const text = PASSING.replace(
    "정렬돼 있으면 양 끝에서 좁혀도 답을 안 놓친다.",
    "식의 `B` 를 코드에서는 `block` 이라 씁니다.",
  );
  const findings = check({ text, sim: SIM, bench: { 비교: 34 } });
  expect(codes(findings)).toEqual(["P12"]);
  expect(findings[0]?.detail).toContain("block");
});

test("P12 — 코드 펜스에 실재하면 걸리지 않는다", () => {
  // `xs` 는 통과 표본의 `ts` 펜스에 실제로 있는 이름이다.
  const text = PASSING.replace(
    "정렬돼 있으면 양 끝에서 좁혀도 답을 안 놓친다.",
    "식의 `a` 를 코드에서는 `xs` 라 씁니다.\n\n```text\na → xs\n```",
  );
  expect(check({ text, sim: SIM, bench: { 비교: 34 } })).toEqual([]);
});

test("P12 — `text` 펜스는 식별자의 실재를 증언하지 않는다", () => {
  // 그림 안의 글자는 코드가 아니다. 그림에만 있는 이름을 「코드에서는」 이라 적으면 걸린다.
  const text = PASSING.replace(
    "정렬돼 있으면 양 끝에서 좁혀도 답을 안 놓친다.",
    "식의 `B` 를 코드에서는 `blk` 라 씁니다.\n\n```text\nblk\n```",
  );
  expect(
    check({ text, sim: SIM, bench: { 비교: 34 } }).some(
      (f) => f.code === "P12",
    ),
  ).toBe(true);
});

const DEF = String.raw`$$\operatorname{blk}(l) \;=\; \left\lfloor \frac{l}{B} \right\rfloor$$`;
/** 산문 연속(P1)이 늘지 않게 끼우는 그림 한 장. */
const FIG = ["```text", "구역", "```"].join("\n");

test("P13 — 정의식을 뒤에서 되풀어 쓰면 걸린다", () => {
  const text = PASSING.replace(
    "정렬돼 있으면 양 끝에서 좁혀도 답을 안 놓친다.",
    () =>
      `${DEF}\n\n${FIG}\n\n뒤에서 다시 $\\lfloor \\frac{l}{B} \\rfloor$ 로 적습니다.`,
  );
  const findings = check({ text, sim: SIM, bench: { 비교: 34 } });
  expect(codes(findings)).toEqual(["P13"]);
  expect(findings[0]?.detail).toContain("blk");
});

test("P13 — 이름으로만 쓰면 걸리지 않는다", () => {
  const text = PASSING.replace(
    "정렬돼 있으면 양 끝에서 좁혀도 답을 안 놓친다.",
    () => `${DEF}\n\n${FIG}\n\n뒤에서는 $\\operatorname{blk}(l)$ 로 씁니다.`,
  );
  expect(check({ text, sim: SIM, bench: { 비교: 34 } })).toEqual([]);
});

test("P14 — invariant 절에 원문자 라벨이 있으면 걸린다", () => {
  const text = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    () => "버리는 쪽에 답이 있을 수 없습니다. ③ 이 참이면 그 구간을 버립니다.",
  );
  const findings = check({ text, sim: SIM, bench: { 비교: 34 } });
  expect(codes(findings)).toEqual(["P14"]);
  expect(findings[0]?.detail).toContain("③");
});

test("P14 — 갈래를 하는 일의 이름으로 부르면 걸리지 않는다", () => {
  const text = PASSING.replace(
    "버리는 쪽에 답이 있을 수 없습니다.",
    () =>
      "버리는 쪽에 답이 있을 수 없습니다. 왼쪽 당기기 `l++` 가 실행되면 그 구간을 버립니다.",
  );
  expect(check({ text, sim: SIM, bench: { 비교: 34 } })).toEqual([]);
});

test("P14 — 파트 1 의 원문자는 잡지 않는다 (P4 의 분기 피복이 그것으로 선다)", () => {
  // 통과 표본의 `아이디어 상세`·`전개` 에는 원문자가 이미 있다. 그것을 안 잡는 것이
  // 이 규칙의 범위이고, 넓히면 P4 가 재는 것이 통째로 없어진다.
  expect(PASSING).toContain("**① 문제를 고정한다.**");
  expect(check({ text: PASSING, sim: SIM, bench: { 비교: 34 } })).toEqual([]);
});

test("P2 — 어간 음절이 바뀌는 활용형 (2026-09-05 여섯째 재발)", () => {
  // **어간화로도 안 닫힌 부류다.** 모음·ㄹ 어간에 관형 `-ㄴ` 이나 미래 `-ㄹ` 이 붙으면
  // 음절이 합쳐져 어간 글자가 사라진다 — `싸-`+`-ㄴ` = 「싼」. `S4` 는 어미를 어간으로
  // 바꾼 것이고, 여기서 막는 것은 **어간 자체가 변하는 꼴**이다.
  const cases = [
    "가장 싼 짝을 고릅니다.", // 싸- + 관형 ㄴ
    "그중 쌀 것을 먼저 봅니다.", // 싸- + 미래 ㄹ
    "무효한 것을 죽은 후보라 부릅니다.", // 죽- + 관형 은
    "규칙이 샐 자리가 남아 있습니다.", // 새- + 미래 ㄹ
    "표를 전수로 돌고 답을 견줍니다.", // 돌- + 고
    "루프가 돌지 않으면 값이 그대로입니다.", // 돌- + 지
    "표를 다시 돌릴 필요가 없습니다.", // 돌리- + 미래 ㄹ
    "값이 흐를 자리를 먼저 정합니다.", // 흐르- + 미래 ㄹ
    "뒤의 자리를 미는 연산입니다.", // 밀- + 관형 는
    "그 값이 드러날 자리가 없습니다.", // 드러나- + 미래 ㄹ
  ];
  for (const bad of cases) {
    const text = PASSING.replace("버리는 쪽에 답이 있을 수 없습니다.", bad);
    expect(codes(check({ text }))).toContain("P2");
  }
});

test("P2 — 어간을 넓혀도 살아남아야 하는 것 (오탐이 누락보다 위험하다)", () => {
  // 넓힐 때마다 `--all` 을 돌려 확인한 자리들이다. 「돌아가다」는 자리 이동이라 규칙이
  // 처음부터 대상에서 뺐고, 「선수」·「선택」은 한자어 접두라 「서다」의 관형형을 넓히지
  // 않은 근거다 — 그 부류는 `SPEC.md` §6 `L33` 으로 남겨 사람이 본다.
  const ok = [
    "실패하면 돌아와 다음 간선을 고릅니다.",
    "반시계로 돌아간 것입니다.",
    "`u` 가 선수 과목이고 `v` 는 그 뒤에 옵니다.",
    "선택한 값을 그대로 씁니다.",
    "그 값을 그대로 돌려주면 됩니다.",
    "구간을 감싸는 다른 구간이 있습니다.",
    "경계에 맞닿은 자리를 봅니다.",
    "되돌리는 연산이 따로 있습니다.",
    "거리가 가까워지는 쪽 정점을 고릅니다.",
    "값이 작아지는 쪽으로 옮깁니다.",
  ];
  for (const good of ok) {
    const text = PASSING.replace("버리는 쪽에 답이 있을 수 없습니다.", good);
    expect(codes(check({ text }))).not.toContain("P2");
  }
});

test("P2 — 어간화가 잡아내는 활용형 (2026-09-04 전수 감사가 낸 여덟 부류)", () => {
  // 어미를 하나씩 적던 여덟 규칙이 지나가게 두던 표현들이다. 부류마다 대표 하나씩 둔다 —
  // 목록이 아니라 **어간**이 방어이므로, 여기 없는 활용형도 같은 어간이면 함께 잡힌다.
  const cases = [
    "라운드 하나가 싸게 끝난다.",
    "설정을 이기되 경고를 낸다.",
    "등호가 서는 입력이 있다.",
    "배치3 에서 둘이 터졌다.",
    "표를 전수로 돌려 답을 견준다.",
    "답이 뒤로 물러서지 않는다.",
    "뒤의 자리를 한 칸씩 밀어낸다.",
    "이 실수가 드러나지 않는다.",
    "다섯 입력에 걸어 봅니다.",
    "맵을 들고 다니는 자료구조다.",
    "그 위에 얹히는 자료구조다.",
    "배열을 한 번 훑었습니다.",
  ];
  for (const bad of cases) {
    const text = PASSING.replace("버리는 쪽에 답이 있을 수 없습니다.", bad);
    expect(codes(check({ text }))).toContain("P2");
  }
});

test("P2 — 어간화의 오탐 — 살아남아야 하는 표현", () => {
  // **어간화의 위험은 누락이 아니라 오탐이다.** `싸다`→「감싸다」·`도는`→「유도는」에서 두 번
  // 겪었고, 어간을 넓힌 2026-09-04 에 세 부류가 더 나왔다 — 계사 「…이기도」·「머물러」·
  // 「서른」. 여기 있는 것이 하나라도 걸리면 규칙을 되돌린다.
  const fine = [
    "값을 그대로 돌려준다.", // 반환은 표준 번역어다
    "그 절차가 창 방식의 본체이기도 하다.", // 계사 「…이기」
    "비교가 한 번이기 때문이다.", // 계사 + 때문
    "바깥 함수가 내부 상태를 감싸다.", // 어간 `싸` 의 오탐
    "유도는 여기서 끝난다.", // 어간 `도는` 의 오탐
    "텍스트 자리를 되돌리지 않는다.", // 이 문서가 정의해 쓰는 이동 서술
    "커서를 되돌려 읽지 않아도 된다.", // 같은 부류
    "그 값에 머물러 더 줄지 않는다.", // 어간 `물러` 의 오탐
    "두 값이 서로 다르다.", // 어간 `서` 의 오탐
    "경로 위 정점이 서른셋뿐이다.", // 같은 오탐
    "두 구역이 맞닿는 자리가 경계다.", // 어간 `닿` 의 오탐
    "구간이 두 노드에 걸쳐 있다.", // `에 걸` 을 통째로 두면 걸리는 자리
  ];
  for (const good of fine) {
    const text = PASSING.replace("버리는 쪽에 답이 있을 수 없습니다.", good);
    expect(codes(check({ text }))).not.toContain("P2");
  }
});

/* ────────────────── P15 생성 블록 열 정렬 ────────────────── */

/** 마커와 펜스로 감싼다 — 생성 블록이 아니면 P15 는 아무것도 안 본다. */
const block = (body: string): string =>
  `<!--proof:sample-->\n\n\`\`\`text\n${body}\n\`\`\`\n`;

test("P15 — 앞 칸이 길어진 만큼 뒤 칸이 밀리면 걸린다", () => {
  // 구분 공백을 3 칸으로 고정해 그린 자리. 실제로 `sieveOfEratosthenes` 가 이 모양이었다.
  const findings = generatedBlockAlignment(
    block(
      [
        "  1,000 → 10,000   22.2 배",
        "  10,000 → 100,000   23.4 배",
        "  100,000 → 1,000,000   24.7 배",
      ].join("\n"),
    ),
  );
  expect(findings.map((f) => f.code)).toEqual(["P15"]);
  expect(findings[0]?.detail).toContain("2 번째 열");
});

test("P15 — 한글 칸의 폭을 1 로 세고 그리면 걸린다", () => {
  // `.length` 로 맞추면 눈에는 어긋나는데 검사는 통과한다 — CJK 를 2 로 세는 것이 요건이다.
  expect(displayWidth("소수")).toBe(4);
  const findings = generatedBlockAlignment(
    block(
      ["  소수     19 번", "  합성수    26 번", "  전체     45 번"].join("\n"),
    ),
  );
  expect(findings.map((f) => f.code)).toEqual(["P15"]);
});

test("P15 — 왼쪽으로 맞춘 표는 안 걸린다", () => {
  expect(
    generatedBlockAlignment(
      block(
        ["  소수      19 번", "  합성수    26 번", "  전체      45 번"].join(
          "\n",
        ),
      ),
    ),
  ).toEqual([]);
});

test("P15 — 오른쪽으로 맞춘 표도 안 걸린다 (수를 오른쪽에 맞추는 표가 있다)", () => {
  expect(
    generatedBlockAlignment(
      block(
        [
          "       30          45",
          "    1,000       5,288",
          "1,000,000  67,740,404",
        ].join("\n"),
      ),
    ),
  ).toEqual([]);
});

test("P15 — 열 이름이 데이터보다 길어 머리줄만 삐져나온 것은 안 걸린다", () => {
  expect(
    generatedBlockAlignment(
      block(
        [
          "k  sa[k]  접미사가 s 위에 놓인 자리",
          "0      5       a",
          "1      3     ana",
          "2      1   anana",
          "3      0  banana",
        ].join("\n"),
      ),
    ),
  ).toEqual([]);
});

test("P15 — `^` 눈금 줄은 줄마다 다른 자리를 가리키는 것이 그 일이라 안 걸린다", () => {
  expect(
    generatedBlockAlignment(
      block(
        [
          "      ^  ^  ^  ^                       자리 0 에서 맞는다",
          "                     ^  ^  ^  ^        자리 5 에서 맞는다",
          "                           ^  ^  ^  ^  자리 7 에서 맞는다",
        ].join("\n"),
      ),
    ),
  ).toEqual([]);
});

test("P15 — 생성 블록 밖의 어긋난 표는 안 본다 (손그림은 이 규칙의 자리가 아니다)", () => {
  const text = `\`\`\`text\n  가     1\n  나나    22\n  다다다   333\n\`\`\`\n`;
  expect(generatedBlockAlignment(text)).toEqual([]);
});

test("P15 — 두 줄짜리는 표로 안 본다 (산문이 우연히 그 모양일 수 있다)", () => {
  expect(generatedBlockAlignment(block("  가  1\n  나나나  22"))).toEqual([]);
});

/* ────────────────── P16 원고 ↔ 정본 대조 ────────────────── */

const REF = `/**
 * 파일 설명. 원고는 이것을 안 싣는다.
 */
export function twoSum(A: number[], t: number): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo < hi) {
    // ① 합이 작으면 왼쪽을 당긴다.
    if ((A[lo] as number) + (A[hi] as number) < t) lo++;
    else hi--;
  }
  return lo;
}
`;

/** 원고에 그 코드를 실은 최소 골격. `deep.walk.final` 절만 있으면 이 검사가 돈다. */
const guideWith = (code: string): string =>
  `#### 4. 전체 코드\n\n\`\`\`ts\n${code}\n\`\`\`\n`;

const refFindings = (code: string) =>
  finalCodeMatchesRef(parseSections(guideWith(code)).sections, REF);

test("P16 — 정본을 그대로 옮겼으면 안 걸린다", () => {
  expect(
    refFindings(`export function twoSum(A: number[], t: number): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo < hi) {
    // ① 합이 작으면 왼쪽을 당긴다.
    if ((A[lo] as number) + (A[hi] as number) < t) lo++;
    else hi--;
  }
  return lo;
}`),
  ).toEqual([]);
});

test("P16 — 주석과 빈 줄이 달라도 안 걸린다 (원고는 JSDoc 을 인라인 주석으로 바꾼 사본이다)", () => {
  expect(
    refFindings(`export function twoSum(A: number[], t: number): number {
  let lo = 0;

  let hi = A.length - 1;
  while (lo < hi) {
    // 여기서 왼쪽을 당긴다 — 원고는 다른 말로 적는다.
    if ((A[lo] as number) + (A[hi] as number) < t) lo++;
    else hi--;
  }
  return lo;
}`),
  ).toEqual([]);
});

test("P16 — 린터가 바꾼 줄 모양을 원고에 안 옮기면 걸린다", () => {
  // `pointInPolygon`(W3 배치3)에서 다섯 자리가 이 상태였다 — 스캐너 넷이 전부 초록이었다.
  const findings =
    refFindings(`export function twoSum(A: number[], t: number): number {
  let lo = 0;
  let hi = A.length - 1;
  while (lo < hi) {
    if (A[lo] + A[hi] < t) lo++;
    else hi--;
  }
  return lo;
}`);
  expect(findings.map((f) => f.code)).toEqual(["P16"]);
  expect(findings[0]?.detail).toContain("5 번째 줄부터 갈린다");
});

test("P16 — 정본에 있는 최상위 선언을 원고가 빠뜨리면 걸린다", () => {
  const findings = finalCodeMatchesRef(
    parseSections(
      guideWith("export function twoSum(): number {\n  return 0;\n}"),
    ).sections,
    "export type Op = { t: string };\nexport function twoSum(): number {\n  return 0;\n}\n",
  );
  expect(findings.map((f) => f.code)).toEqual(["P16"]);
});

test("P16 — 문자열 안의 `//` 를 주석으로 보지 않는다", () => {
  expect(normalizeCode('const u = "https://a.b"; // 설명')).toBe(
    'const u = "https://a.b";',
  );
});

test("P16 — 정본이 없으면 미실행이다 (값을 지어내 판정을 흉내내지 않는다)", () => {
  const text = PASSING;
  const before = check({ text, sim: SIM, bench: { 비교: 34 } });
  expect(before.filter((f) => f.code === "P16")).toEqual([]);
});
