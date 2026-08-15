/**
 * CI 3모드 + 게이트 묶음.
 *
 * 이 저장소의 테스트는 **일부러 실패한다.** 학습자 스텁이 `Not implemented` 를 던지기
 * 때문이다. 그래서 `bun test` 하나로는 CI 판정을 낼 수 없고, 무엇이 실패해야 정상인지를
 * 모드로 갈라야 한다.
 *
 * | 모드 | 대상 | 기대 | CI 판정 |
 * |---|---|---|---|
 * | `self` | 하네스 자기시험 | **결함 fixture 가 축3에서 실패**해야 통과 | 포함 |
 * | `reference` | `_reference/` 정본 | 녹색 | 포함 |
 * | `practice` | 학습자 스텁 | 미구현 실패가 정상 | **제외**(따로 보고) |
 *
 * `self` 가 "무언가 실패"로 만족하지 않는 것이 핵심이다. 결함 fixture 가 컴파일 에러나
 * 예외로 죽어도 "실패"이지만, 그것은 축3이 잡은 것이 아니다. 자기시험은 `judgeScenario`
 * 의 **반환값**을 보므로 어느 축이 어떤 사유로 걸렸는지까지 단언한다.
 *
 * ```bash
 * bun run tools/ci.ts <self|reference|practice|gates|all>
 * ```
 */

interface Step {
  label: string;
  argv: string[];
  /** 실패해도 CI 판정에 넣지 않는다. */
  advisory?: boolean;
}

const SELF: Step[] = [
  {
    label: "① 스위트 자기검증 — 결함 fixture 가 축3에서 걸리는가",
    argv: ["bun", "test", "src/data-structures/_contract"],
  },
  {
    label: "① 추출기·판정기 자기시험",
    argv: ["bun", "test", "tools"],
  },
];

const REFERENCE: Step[] = [
  {
    label: "② 정본 검증 — _reference/ 가 계약을 지키는가",
    argv: ["bun", "test", "src/data-structures", "-t", "정본"],
  },
];

const PRACTICE: Step[] = [
  {
    label: "③ 실습 채점 — 스텁(미구현 실패가 정상, 판정 제외)",
    argv: ["bun", "test", "src/data-structures", "-t", "스텁"],
    advisory: true,
  },
];

const GATES: Step[] = [
  { label: "타입", argv: ["bunx", "tsc", "--noEmit"] },
  {
    label: "계약 정합(명세↔스텁↔정본↔스위트)",
    argv: ["bun", "run", "tools/check-contract.ts"],
  },
  {
    label: "가이드 코드 추출 일치",
    argv: ["bun", "run", "tools/guide-core.ts", "check"],
  },
  {
    label: "언어 중립 vector 가 계약과 같은가",
    argv: ["bun", "run", "tools/emit-vectors.ts", "--check"],
  },
  { label: "인용", argv: ["bun", "run", "tools/check-citations.ts"] },
  { label: "문서 링크", argv: ["bun", "run", "tools/check-links.ts", "check"] },
  {
    label: "가이드 전개 밀도·절 결속(래칫)",
    argv: ["bun", "run", "tools/check-guide-rhythm.ts"],
  },
];

function run(step: Step): boolean {
  console.log(`\n▶ ${step.label}`);
  console.log(`  $ ${step.argv.join(" ")}`);
  const result = Bun.spawnSync(step.argv, {
    stdout: "inherit",
    stderr: "inherit",
  });
  const ok = result.exitCode === 0;
  if (!ok && step.advisory) {
    console.log(`  ↳ 실패했지만 판정에서 제외한다(${step.label}).`);
  }
  return ok;
}

const MODES: Record<string, Step[]> = {
  self: SELF,
  reference: REFERENCE,
  practice: PRACTICE,
  gates: GATES,
  all: [...SELF, ...REFERENCE, ...GATES, ...PRACTICE],
};

const mode = Bun.argv[2] ?? "";
const steps = MODES[mode];
if (steps === undefined) {
  console.error(`용법: bun run tools/ci.ts <${Object.keys(MODES).join("|")}>`);
  process.exit(2);
}

const failed: string[] = [];
const advisory: string[] = [];
for (const step of steps) {
  if (run(step)) continue;
  if (step.advisory) advisory.push(step.label);
  else failed.push(step.label);
}

console.log(`\n${"─".repeat(60)}`);
if (advisory.length > 0) {
  console.log(`판정 제외(정상): ${advisory.join(", ")}`);
}
if (failed.length > 0) {
  console.error(`실패 ${failed.length}건: ${failed.join(", ")}`);
  process.exit(1);
}
console.log(`${mode} 모드 통과 — 단계 ${steps.length}개.`);
