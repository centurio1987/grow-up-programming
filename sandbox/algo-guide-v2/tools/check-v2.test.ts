/**
 * `check-v2.ts` 자기시험 — 통과 표본 1벌 + 각 P 를 어기는 결함 표본 10벌.
 *
 * **판정기는 자기가 못 잡는 것을 스스로 말하지 않는다.** 규칙 하나가 조용히 꺼져도 화면에는
 * "통과" 로 뜨고, 그 상태가 곧 "검사하지 않는 검사" 다. 그래서 각 규칙마다 **그 규칙만
 * 어기는 표본**을 두고, 통과 표본이 계속 통과하는지도 함께 본다.
 */
import { expect, test } from "bun:test";
import { check, parseSim } from "./check-v2.ts";
import { parseSections } from "./section.ts";

/** P1~P10 을 전부 만족하는 표본. 각 결함 표본은 여기서 한 곳만 어긋뜨린다. */
const PASSING = `# 시험용 — 한눈에 보는 부제

## 시작하기 전에 — 이미 알고 있어야 하는 것

- 배열의 인덱스가 0부터라는 것
- 부분합이 무엇인지

## 전체 컨셉

두 포인터를 양 끝에서 좁혀 오면 한 번의 훑기로 답이 나온다.

\`\`\`text
[1 2 3 4]
 ^     ^
 l     r
\`\`\`

## 아이디어 상세

### 두 포인터 — 생각이 닿는 경로

모든 쌍을 세면 입력이 10만일 때 50억 번이다.

\`\`\`text
쌍의 수 = n(n-1)/2
\`\`\`

정렬돼 있으면 양 끝에서 좁혀도 답을 안 놓친다.

### 왜 항상 옳은가

버리는 쪽에 답이 있을 수 없다. 빈 입력과 크기 1은 즉시 반환한다.

### 흔한 오해와 그것이 거짓인 이유

정렬하지 않아도 된다고 생각하기 쉽다.

\`\`\`text
[3 1 2] 에서 오해는 4 를, 옳은 답은 3 을 낸다
\`\`\`

### 이해 점검

l 이 r 을 넘으면 어떻게 되는가?

<!--check:c1-->
넘지 않는다. 좁히는 폭이 매번 1이라 만나는 순간 멈춘다.
<!--/check-->

## 이 알고리즘이 최적인 자리

### 최적인 문제의 모양

정렬된 수열에서 조건을 만족하는 쌍을 찾는 문제.

### 문제에서 이것을 떠올리게 하는 단서

- 입력이 이미 정렬돼 있다
- 답이 쌍이다

### 실제로 쓰이는 곳

Go 표준 라이브러리의 sort 패키지 (https://pkg.go.dev/sort, 조회 2026-08-19).

### 경쟁 설계와의 대조

이진 탐색으로 짝을 찾는 방법이 있다. 같은 입력에서 비교 172 회 대 34 회다.

## 코드로 옮기기

### 수도 코드로 본 전체

\`\`\`text
l ← 0, r ← n-1
while l < r: 합을 보고 한쪽을 당긴다
\`\`\`

### 양 끝에서 좁히기

한쪽만 당겨야 답을 안 놓친다.

\`\`\`ts
if (sum < target) l++;   // ①
else r--;                // ②
\`\`\`

\`\`\`text
l→   ←r
\`\`\`

### 완성 코드

\`\`\`ts
export function pair(xs: number[], t: number) { return xs.length; }
\`\`\`

## 한 입력으로 끝까지 굴려 보기

<!--viz:demo-->
\`\`\`text
T1 [1 2 3 4]  l=0 r=3
\`\`\`

<!--result:demo=3-->

- T1 l=0, r=3 이라 l < r 이 참 — ① 을 밟는다
- T2 합이 3 이라 목표보다 작다
- T3 l=1 로 옮긴다
- T4 합이 5 라 목표보다 크다 — ② 를 밟는다
- T5 r=2 로 옮긴다
- T6 l=1, r=2 에서 답을 찾는다

## 비용 계산

### 비용을 세는 과정

T1 부터 T6 까지 각 걸음이 포인터를 하나씩 당긴다.

\`\`\`text
걸음 수 ≤ n
\`\`\`

### 케이스별 비용과 그 경계

최악에서도 타이트하게 Θ(n) 이고, 정렬 비용을 더하면 Θ(n log n) 이다.

### 최악을 만드는 입력

답이 맨 끝에 있는 입력.

\`\`\`text
[1 2 3 100]  목표 101
\`\`\`

## 한 곳을 바꿔 보면

\`l++\` 를 \`l--\` 로 바꾸면 무한히 돈다.

\`\`\`text
[1 2 3 4] → 반환 없음(정지하지 않음)
\`\`\`

## 스스로 점검하기

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

test("통과 표본은 P1~P10 을 전부 통과한다", () => {
  const findings = check({ text: PASSING, sim: SIM, bench: { 비교: 34 } });
  expect(findings).toEqual([]);
});

test("절 식별 — 모르는 헤딩은 에러이고, 나머지 판정은 멈춘다", () => {
  const findings = check({ text: `${PASSING}\n## 정체 불명의 절\n본문.\n` });
  expect(codes(findings)).toEqual(["SEC"]);
  expect(findings[0]?.detail).toContain("정체 불명의 절");
});

test("절 식별 — code.step 은 잔여로 여럿 잡힌다", () => {
  const { sections, unresolved } = parseSections(PASSING);
  expect(unresolved).toEqual([]);
  expect(
    sections.filter((s) => s.id === "code.step").map((s) => s.heading),
  ).toEqual(["### 양 끝에서 좁히기"]);
  expect(sections.some((s) => s.id === "deep.build")).toBe(true);
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

test("P2 — voice 금지 문형", () => {
  const text = PASSING.replace("버리는 쪽에 답이 있을 수 없다.", "자명합니다.");
  expect(codes(check({ text }))).toContain("P2");
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

test("P4 — code.step 의 분기를 trace 가 안 밟으면 걸린다", () => {
  const text = PASSING.replace(
    "- T4 합이 5 라 목표보다 크다 — ② 를 밟는다",
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

test("P7 — code.step 의 코드 스니펫은 그림으로 세지 않는다", () => {
  // repeat 절이라 스니펫이 절마다 있다. 코드를 그림으로 세면 그 절에서 P7 이 무력해진다.
  const text = PASSING.replace("```text\nl→   ←r\n```\n\n", "");
  expect(
    check({ text }).some(
      (f) => f.code === "P7" && f.where?.startsWith("code.step"),
    ),
  ).toBe(true);
});

test("P8 — concept 이 뒤 절 헤딩을 참조하면 걸린다", () => {
  const text = PASSING.replace(
    "두 포인터를 양 끝에서 좁혀 오면 한 번의 훑기로 답이 나온다.",
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
