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
 * | `trials` | 통계 판정 러너 자기시험(`runTrials.*`) | 결함 fixture 가 통계 판정에서 떨어지고 몰리는 올바른 구현은 통과 | 포함 |
 * | `reference` | `_reference/` 정본 | 녹색 | 포함 |
 * | `practice` | 학습자 스텁 | 미구현 실패가 정상 | **제외**(따로 보고) |
 *
 * **`trials` 를 `self` 에서 가른 까닭(KAN-026 `S24`).** 통계 판정은 시행마다 워커를 새로 띄운다 — 비용이 벽시계가 아니라 **워커 수**로
 * 잡힌다. 자기시험의 fixture 판정만 스위트 한 번에 워커 약 3,000 개(정본 판정 800 개는 `reference` 몫)라, 결정적 자기시험만 빨리 돌리는
 * 자리(`self`)와 섞지 않았다. `all` 은 둘 다 돈다. 수치는 `docs/ORD-006-conventions.md` 의 `S24` 절.
 */

interface Step {
  label: string;
  argv: string[];
  /** 실패해도 CI 판정에 넣지 않는다. */
  advisory?: boolean;
}

/** 통계 판정 러너의 자기시험 파일 이름 머리. `self` 는 이것을 빼고 `trials` 는 이것만 돈다. */
const TRIALS_PREFIX = "runTrials.";
const CONTRACT_DIR = "src/data-structures/_contract";

/** `_contract/` 바로 아래의 자기시험 중 통계 판정 러너 것을 뺀 경로들. 새 자기시험이 늘어도 이 목록을 손대지 않는다. */
function selfTestFiles(): string[] {
  const found = [...new Bun.Glob("*.test.ts").scanSync({ cwd: CONTRACT_DIR })]
    .filter((name) => !name.startsWith(TRIALS_PREFIX))
    .sort();
  if (found.length === 0)
    throw new Error(`${CONTRACT_DIR} 에서 자기시험을 찾지 못했다`);
  return found.map((name) => `./${CONTRACT_DIR}/${name}`);
}

const SELF: Step[] = [
  {
    label: "① 스위트 자기검증 — 결함 fixture 가 축3에서 걸리는가",
    argv: ["bun", "test", ...selfTestFiles()],
  },
  {
    label: "① 추출기·판정기 자기시험",
    argv: ["bun", "test", "tools"],
  },
  {
    // 이 파일은 살아 있는 가이드 182편이 함께 쓴다(`#guide-sim`). 그런데 그 소비자들이
    // `.mdx` 라 `tsc` 대상이 아니고, 여기가 SELF 에 없으면 파손이 **편별 런타임에서만**
    // 드러난다 — 되돌리기 전까지 알 수 없는 유일한 자리였다(KAN-033).
    label: "① 시뮬레이션 모듈 회귀",
    argv: ["bun", "test", "src/_guide-sim"],
  },
];

const TRIALS: Step[] = [
  {
    label:
      "④ 통계 판정 자기시험 — 결함 fixture 는 떨어지고 몰리는 올바른 구현은 통과하는가(시행마다 새 워커)",
    argv: ["bun", "test", `${CONTRACT_DIR}/${TRIALS_PREFIX}`],
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
  // ── v2 골격(알고리즘 트랙) — KAN-034 S2 승격 ──
  //
  // `comprehension.sh` 는 **편입하지 않는다.** 2026-08-29 유저 지시로 외부 모델을 쓰지
  // 않기로 했고, 그것이 재던 값 판정은 `check-proof` 로 내려왔다(`SPEC.md` §0).
  //
  // 셋 다 `--all` 이다 — 대상 글롭을 여기 적으면 새 편이 늘 때 아무도 이 자리를 안 고친다.
  {
    label: "v2 스캐너 P1~P13",
    argv: ["bun", "run", "tools/check-v2.ts", "--all"],
  },
  {
    label: "v2 자기증명 대조(본문 값 ↔ 실행)",
    argv: ["bun", "run", "tools/check-proof.ts", "--all"],
  },
  {
    label: "v2 은유 — 문서 전체",
    argv: ["bun", "run", "tools/check-metaphor.ts", "--all"],
  },
  {
    // **원고를 빌드해야만 드러나는 것**을 이 단계가 잡는다. 지금 둘이다.
    //
    // ① 마커 규약 — 이 단계가 없던 동안 하이픈 `check` id 를 쓴 9 편에서 접기가 통째로
    //    안 일어나 `selfcheck` 의 답이 웹에서 그대로 보였고, 스캐너 셋은 전부 초록이었다
    //    (2026-08-31 실측). `FEEDBACK` `L19` 가 적어 둔 구멍이다.
    // ② 표 칸 — GFM 은 칸 구분자를 인라인 코드 안에서도 먼저 가르므로 칸 안의 `|` 가
    //    그 칸을 잘라 낸다. 원고를 읽는 사람에게만 보이고 HTML 에는 없다
    //    (2026-09-10 `KAN-034.9` `S7`, 전수에서 2편 2줄).
    //
    // **라벨이 잡는 것을 다 말해야 한다** — ②를 더하고도 라벨이 「마커 규약」이면 그 검사가
    // 이름 아래 숨어, 다음 사람이 CI 화면에서 무엇이 도는지 못 읽는다.
    // `--all` 은 파일을 쓰지 않는다 — 여기서 필요한 것은 산출이 아니라 종료코드다.
    label: "v2 빌드 규약(마커 · 표 칸) — 빌드해야 드러나는 것",
    argv: ["bun", "run", "tools/build-html.ts", "--all"],
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
  trials: TRIALS,
  reference: REFERENCE,
  practice: PRACTICE,
  gates: GATES,
  all: [...SELF, ...TRIALS, ...REFERENCE, ...GATES, ...PRACTICE],
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
