/**
 * 축1 동작 계약을 **언어 중립 JSON** 으로 뽑는다.
 *
 * 두 번째 언어가 들어오면 축1이 갈라진다. TS 하네스는 `ContractSpec` 을 읽어 참조 모델과
 * 교차검증하는데, Rust 는 그 `ContractSpec` 을 읽을 수 없다. 같은 계약을 두 번 적으면
 * 그 둘이 갈라지고, 갈라진 자리가 곧 이 프로젝트가 고치려는 결함이다.
 *
 * 그래서 **TS 가 정본이고 JSON 은 그 파생물이다.** 이 도구는 `spec.model()`(자명한 참조
 * 모델)을 실제로 돌려 각 단계의 기대값을 기록한다. 사람이 적지 않으므로 두 언어가
 * 어긋날 자리가 없다.
 *
 * 규격의 정본은 `docs/ORD-006-conventions.md` §규약2 「언어 중립 test vector」다.
 *
 * ```bash
 * bun run tools/emit-vectors.ts          # rust/vectors/*.json 재생성
 * bun run tools/emit-vectors.ts --check  # 재생성 결과가 커밋된 것과 같은지만 본다
 * ```
 */

import { join, resolve } from "node:path";
import { rngFrom } from "../src/data-structures/_contract/judge.ts";
import type { ContractSpec } from "../src/data-structures/_contract/runContract.ts";
import { multisetContract } from "../src/data-structures/hash/multiset/multiset.contract.ts";
import { dequeContract } from "../src/data-structures/linear/deque/deque.contract.ts";
import { stackContract } from "../src/data-structures/linear/stack/stack.contract.ts";
import { xorLinkedListContract } from "../src/data-structures/linear/xorLinkedList/xorLinkedList.contract.ts";
import { intervalTreeContract } from "../src/data-structures/range-query/intervalTree/intervalTree.contract.ts";

const root = resolve(import.meta.dir, "..");
const OUT_DIR = "rust/vectors";

/** 무작위 시퀀스의 길이. 파일 크기와 검출력의 교환점이다. */
const RANDOM_STEPS = 200;
/** 무작위 시퀀스 seed. TS 하네스 축1과 같은 값을 쓴다. */
const RANDOM_SEED = 1;

interface VectorStep {
  op: string;
  /** 인자가 없는 연산은 생략한다. */
  arg?: unknown;
  /**
   * 참조 모델이 돌려준 값. **반환이 없는 연산은 이 열쇠 자체가 없다.**
   * `null` 을 돌려주는 연산(빈 스택의 `pop`)과 구분해야 하므로 `null` 로 뭉뚱그리지 않는다.
   */
  expect?: unknown;
}

interface VectorCase {
  name: string;
  /** `edge` = 계약이 손으로 짚은 경계, `random` = 결정적 난수 시퀀스. */
  kind: "edge" | "random";
  steps: VectorStep[];
}

interface Vector {
  schema: "ord006/contract-vector@1";
  structure: string;
  grade: string;
  /** 스위트가 도는 원소 타입. 지금은 전 구조가 `number` 다(§규약2). */
  element: "number";
  cases: VectorCase[];
}

/** 참조 모델을 돌려 한 단계의 기대값을 만든다. 반환이 없으면 `expect` 를 붙이지 않는다. */
function record(step: VectorStep, observed: unknown): VectorStep {
  if (observed === undefined) return step;
  return { ...step, expect: observed };
}

function buildVector<Impl, Model>(spec: ContractSpec<Impl, Model>): Vector {
  const byName = new Map(spec.ops.map((op) => [op.name, op] as const));
  const cases: VectorCase[] = [];

  for (const edge of spec.edges) {
    const model = spec.model();
    const steps: VectorStep[] = [];
    for (const step of edge.steps) {
      const op = byName.get(step.op);
      if (op === undefined) {
        throw new Error(
          `${spec.name} 의 경계 케이스 "${edge.name}" 가 없는 연산을 부른다: ${step.op}`,
        );
      }
      const base: VectorStep =
        step.arg === undefined
          ? { op: step.op }
          : { op: step.op, arg: step.arg };
      steps.push(record(base, op.onModel(model, step.arg)));
    }
    cases.push({ name: edge.name, kind: "edge", steps });
  }

  const rng = rngFrom(RANDOM_SEED);
  const model = spec.model();
  const steps: VectorStep[] = [];
  for (let index = 0; index < RANDOM_STEPS; index++) {
    const op = spec.ops[Math.floor(rng() * spec.ops.length)];
    if (op === undefined)
      throw new Error(`${spec.name} 의 연산 목록이 비어 있다`);
    const arg = op.arg(rng);
    const base: VectorStep =
      arg === undefined ? { op: op.name } : { op: op.name, arg };
    steps.push(record(base, op.onModel(model, arg)));
  }
  cases.push({
    name: `무작위 시퀀스 seed=${RANDOM_SEED} ${RANDOM_STEPS}회`,
    kind: "random",
    steps,
  });

  return {
    schema: "ord006/contract-vector@1",
    structure: spec.name,
    grade: spec.grade,
    element: "number",
    cases,
  };
}

// biome-ignore lint/suspicious/noExplicitAny: 여러 구조의 spec 을 한 배열에 담는 자리다
const SPECS: ContractSpec<any, any>[] = [
  stackContract,
  multisetContract,
  dequeContract,
  intervalTreeContract,
  xorLinkedListContract,
];

const check = Bun.argv.includes("--check");
const drifted: string[] = [];

for (const spec of SPECS) {
  const vector = buildVector(spec);
  const path = join(OUT_DIR, `${vector.structure}.json`);
  const text = `${JSON.stringify(vector, null, 2)}\n`;

  if (check) {
    const existing = Bun.file(join(root, path));
    const current = (await existing.exists()) ? await existing.text() : "";
    if (current !== text) drifted.push(path);
    continue;
  }
  await Bun.write(join(root, path), text);
  console.log(`${path} — 케이스 ${vector.cases.length}개`);
}

if (check) {
  if (drifted.length > 0) {
    console.error(
      `test vector 가 계약과 어긋난다: ${drifted.join(", ")}\n` +
        "`bun run tools/emit-vectors.ts` 로 다시 뽑고 커밋한다.",
    );
    process.exit(1);
  }
  console.log(`test vector ${SPECS.length}종이 계약과 일치한다.`);
}
