/**
 * 통계 판정 러너 — 무작위 계약의 확률 문장을 **독립 시행**으로 판정한다(원칙 B 하네스 변경 명세 H1).
 *
 * `./runContract.ts` 의 축1 무작위 시퀀스는 한 실행 안에서 돈다. 구현 무작위를 실행이 함께 쓰는 계약에서는 그 안의 인스턴스 ·
 * 원소의 사건이 독립이 아니라, 모아 센 수로 판정하면 계약을 지키는 구현을 떨어뜨린다. 이 러너는 **시행 하나 = 새 워커 하나(=
 * 새 모듈 그래프 = 새 해시 환경) + 그 안의 인스턴스 묶음**으로 돌리고 시행마다 벗어난 몫 Z_t ∈ [0, 1] 을 받아 합 S 를 한계 k 와
 * 견준다. 한계와 상한은 `./judgeTrials.ts`, 규격의 정본은 `docs/ORD-006-conventions.md` 「원칙 B」 와 그 적용 절(`S24`)이다.
 *
 * | 무엇 | 어디서 | 왜 |
 * |---|---|---|
 * | 입력(넣을 원소 · 물을 원소 · 지우는 차례) | **메인 스레드**, 워커를 띄우기 전 — `shape.input(seed, t, 모양)` | B1 — 구현의 관측값에 기댈 길이 없다 |
 * | 구현 무작위 | 워커 — 구현 모듈을 새로 읽는다 | B3 — 시행끼리 독립 |
 * | 워커를 띄우는 곳 | 자식 프로세스 `./runTrials.host.ts` — 하나가 워커를 `HOST_TRIALS` 개까지 맡는다 | Bun 1.3.12 가 한 프로세스에서 워커를 수백 개 넘게 띄우면 죽는다 |
 * | 시행 함수 | 워커 — 계약 스위트 모듈의 export | 팩토리 함수는 워커 경계를 못 넘는다 — 구현을 **모듈 주소 + export 이름**으로 받는다 |
 * | 합 · 한계 · 판정 | 메인 스레드 | 워커가 판정하지 않는다 |
 *
 * **조용히 통과하지 않는다.** 워커의 예외 · 모듈 적재 실패 · 결과 없이 닫힘 · 알 수 없는 메시지 · 호스트 프로세스의 죽음 · 모양이 틀린 결과(판정 이름
 * 누락, 사건 수 0, 벗어난 수가 사건 수를 넘음) · 생존 감시 시간 초과는 전부 그 자리에서 판정을 떨어뜨린다. 생존 감시는 멈춘 워커를
 * 끊는 장치이지 비용을 재는 값이 아니다 — 비용은 워커 수 · 시행 수 · `__cost` 합으로 보고한다(불변 사실 7).
 *
 * 축은 늘리지 않는다 — 이 러너는 축1(동작)의 확률 문장 판정이다(`docs/ORD-006-conventions.md` 「A군 판정 — 사람 결정 넷」 넷째 행).
 * `./runContract.ts` · `./judge.ts` 는 고치지 않았다.
 */

import { describe, expect, test } from "bun:test";
import {
  type ModuleExport,
  type PlannedJudgment,
  planLimits,
  SUITE_MISJUDGE,
  type TrialPlan,
  type TrialResult,
} from "./judgeTrials";

/** 판정 대상. 스텁 · 정본 · fixture 가 같은 모양으로 넘긴다. */
export interface TrialTarget {
  /** 보고용 라벨. `describe` 이름에 들어가 CI 모드의 `-t 정본` · `-t 스텁` 이 고른다. */
  label: string;
  implementation: ModuleExport;
}

export interface TrialOptions {
  /** 동시에 띄우는 워커 수. 판정 값에는 영향이 없고, 떨어질 때 더 띄운 워커 수만 달라진다. */
  parallel?: number;
  /** 한계를 넘거나 결정적 위반이 나오면 새 시행을 띄우지 않는다. 기본 `true`. */
  stopEarly?: boolean;
  /** 워커 하나의 생존 감시(밀리초). 비용 판정이 아니다. */
  deadlineMs?: number;
  /** 스위트 한 번의 오판 목표 β. 기본 `SUITE_MISJUDGE`. */
  beta?: number;
}

/** 판정 하나의 결과. 계획 값(`PlannedJudgment`)에 실제로 모은 값을 더한다. */
export interface JudgmentOutcome extends PlannedJudgment {
  /** 받은 시행의 Z_t 합. */
  sum: number;
  /** 이 판정의 결과를 받은 시행 수. */
  completed: number;
  /** 합이 한계를 처음 넘긴 시행 번호(0 부터). 넘지 않았으면 `null`. */
  exceededAt: number | null;
  /** 벗어난 사건 중 처음 받은 설명. */
  first: string | null;
}

export interface TrialVerdict {
  ok: boolean;
  /** 떨어졌으면 까닭(한계를 넘은 판정마다 [보장] 표기와 S · T · k), 통과면 빈 문자열. */
  reason: string;
  /** 띄운 워커 수(= 시행을 맡긴 수). */
  workers: number;
  /** 요청을 받기 전에 멈춰 다시 띄운 워커 수(`./runTrials.host.ts` 의 `RECEIVE_MS`). 띄운 워커 수는 `workers + restarts` 다. */
  restarts: number;
  /** 워커를 띄운 호스트 프로세스 수. 호스트 하나가 워커를 `HOST_TRIALS` 개까지 맡는다. */
  hosts: number;
  /** 결과를 받은 시행 수. */
  trials: number;
  /** 계획의 시행 수 — 모양 중 가장 큰 T. 통과하면 `trials` 와 같다. */
  plannedTrials: number;
  /** 받은 시행의 `__cost` 합. 판정에 쓰지 않는다. */
  cost: number;
  judgments: JudgmentOutcome[];
}

const HOST_PATH = new URL("./runTrials.host.ts", import.meta.url).pathname;

/** 생존 감시 기본값. 시행 하나가 이만큼 답하지 않으면 멈춘 것으로 본다. */
const DEFAULT_DEADLINE_MS = 120_000;

/** 합의 부동소수점 누적 오차를 흡수하는 폭. 몫은 유리수라 이 폭 안의 차이는 셈의 흔들림이다. */
const SUM_SLACK = 1e-9;

/**
 * 호스트 프로세스 하나에 맡기는 시행(= 워커) 수. **Bun 1.3.12 에서 한 프로세스가 워커를 거듭 띄우면 수백 개째부터 죽는다** — 탐침에서
 * 가장 이른 것이 634 개째였고, 워커를 500 개 안쪽으로 띄운 프로세스 120 개는 하나도 죽지 않았다(`docs/ORD-006-conventions.md` 의
 * `S24` 절 「Bun 워커 크래시」). 그 아래로 넉넉히 둔다.
 */
export const HOST_TRIALS = 128;

/** 동시에 도는 워커 수의 위 끝. 판정 값에는 영향이 없다. */
const MAX_PARALLEL = 8;

function defaultParallel(): number {
  const cores =
    typeof navigator === "undefined" ? 2 : navigator.hardwareConcurrency;
  return Math.max(1, Math.min(MAX_PARALLEL, (cores || 2) - 1));
}

type Reply =
  | { kind: "result"; results: unknown; restarts?: number }
  | { kind: "error"; message: string; restarts?: number };

/**
 * 워커 호스트 프로세스 하나(`./runTrials.host.ts`). 요청을 한 줄씩 보내고 답을 한 줄씩 받는다. 프로세스가 답을 다 내기 전에 끝나면
 * 남은 요청을 전부 「호스트가 끝났다」로 돌려준다 — 조용히 통과하지 않는다.
 */
class TrialHost {
  readonly #process;
  readonly #pending = new Map<number, (reply: Reply) => void>();
  readonly #reading: Promise<void>;
  #stderr = "";
  #nextId = 0;
  #dead: string | null = null;
  assigned = 0;

  constructor() {
    this.#process = Bun.spawn([process.execPath, HOST_PATH], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });
    this.#reading = this.#read();
    void this.#drainStderr();
    void this.#watchExit();
  }

  async #read(): Promise<void> {
    const decoder = new TextDecoder();
    let buffer = "";
    const reader = this.#process.stdout.getReader();
    for (
      let next = await reader.read();
      !next.done;
      next = await reader.read()
    ) {
      buffer += decoder.decode(next.value, { stream: true });
      for (
        let end = buffer.indexOf("\n");
        end >= 0;
        end = buffer.indexOf("\n")
      ) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 1);
        if (line.length === 0) continue;
        const { id, reply } = JSON.parse(line) as { id: number; reply: Reply };
        const resolve = this.#pending.get(id);
        this.#pending.delete(id);
        resolve?.(reply);
      }
    }
  }

  async #drainStderr(): Promise<void> {
    const decoder = new TextDecoder();
    const reader = this.#process.stderr.getReader();
    for (let next = await reader.read(); !next.done; next = await reader.read())
      this.#stderr = (this.#stderr + decoder.decode(next.value)).slice(-2_000);
  }

  async #watchExit(): Promise<void> {
    const code = await this.#process.exited;
    await this.#reading;
    this.#dead = `워커 호스트 프로세스가 결과를 다 내기 전에 끝났다(종료 코드 ${code}) — ${this.#stderr.trim().split("\n").slice(-3).join(" / ")}`;
    for (const resolve of this.#pending.values())
      resolve({ kind: "error", message: this.#dead });
    this.#pending.clear();
  }

  send(request: unknown, deadlineMs: number): Promise<Reply> {
    if (this.#dead !== null)
      return Promise.resolve({ kind: "error", message: this.#dead });
    const id = this.#nextId++;
    return new Promise((resolve) => {
      this.#pending.set(id, resolve);
      this.#process.stdin.write(
        `${JSON.stringify({ id, request, deadlineMs })}\n`,
      );
      this.#process.stdin.flush();
    });
  }

  /** 더 맡기지 않는다. 맡은 워커가 끝나면 호스트가 스스로 끝난다. */
  close(): void {
    this.#process.stdin.end();
  }
}

/** 시행 함수의 반환값이 약속한 모양인지 본다. 어긋나면 설명을 돌려준다. */
function malformed(
  result: unknown,
  judgments: readonly { id: string }[],
): string | null {
  if (result === null || typeof result !== "object")
    return "시행 함수가 객체를 돌려주지 않았다";
  const r = result as Partial<TrialResult>;
  if (!(r.violation === null || typeof r.violation === "string"))
    return "violation 이 null 도 문자열도 아니다";
  if (typeof r.cost !== "number" || !Number.isFinite(r.cost))
    return "cost 가 유한한 수가 아니다";
  if (r.tallies === null || typeof r.tallies !== "object")
    return "tallies 가 없다";
  for (const { id } of judgments) {
    const tally = r.tallies[id];
    if (tally === undefined) return `판정 「${id}」 의 값을 돌려주지 않았다`;
    const { events, misses } = tally;
    if (!(Number.isInteger(events) && events > 0))
      return `판정 「${id}」 의 사건 수 ${events} 가 양의 정수가 아니다`;
    if (!(Number.isInteger(misses) && misses >= 0 && misses <= events))
      return `판정 「${id}」 의 벗어난 수 ${misses} 가 0 ~ ${events} 밖이다`;
  }
  return null;
}

function formatBound(value: number): string {
  return value === 0 ? "0" : value.toExponential(2);
}

/**
 * 계획대로 시행을 돌려 판정한다. 값을 돌려주므로 `bun:test` 없이도 부른다 — 자기시험이 fixture 의 판정을 단정하는 자리다.
 */
export async function runTrials<Params, Input>(
  plan: TrialPlan<Params, Input>,
  target: TrialTarget,
  options: TrialOptions = {},
): Promise<TrialVerdict> {
  const planned = planLimits(
    plan as TrialPlan<unknown, unknown>,
    options.beta ?? SUITE_MISJUDGE,
  );
  const outcomes: JudgmentOutcome[] = planned.map((p) => ({
    ...p,
    sum: 0,
    completed: 0,
    exceededAt: null,
    first: null,
  }));
  const byShape = plan.shapes.map((shape) =>
    shape.judgments.map(({ id }) => {
      const found = outcomes.find((o) => o.shape === shape.name && o.id === id);
      if (found === undefined)
        throw new Error(`계획에 없는 판정: ${shape.name} · ${id}`);
      return found;
    }),
  );
  const plannedTrials = Math.max(...plan.shapes.map((shape) => shape.trials));
  const parallel = Math.max(1, options.parallel ?? defaultParallel());
  const stopEarly = options.stopEarly ?? true;
  const deadlineMs = options.deadlineMs ?? DEFAULT_DEADLINE_MS;

  let workers = 0;
  let restarts = 0;
  let trials = 0;
  let cost = 0;
  let next = 0;
  const broken: string[] = [];
  const violations: string[] = [];

  let host: TrialHost | null = null;
  let hosts = 0;
  /** 지금 맡길 호스트. 정해 둔 수를 채우면 닫고 새로 띄운다. */
  const hostFor = (): TrialHost => {
    if (host === null || host.assigned >= HOST_TRIALS) {
      host?.close();
      host = new TrialHost();
      hosts++;
    }
    host.assigned++;
    return host;
  };

  const stopped = () =>
    broken.length > 0 ||
    violations.length > 0 ||
    (stopEarly && outcomes.some((o) => o.exceededAt !== null));

  const lane = async () => {
    while (next < plannedTrials && !stopped()) {
      const t = next++;
      // 입력은 여기서 정해진다 — 워커를 띄우기 전이고, 읽는 것은 seed · t · 모양 번호뿐이다(B1).
      const tasks = plan.shapes.flatMap((shape, index) =>
        t < shape.trials
          ? [
              {
                shape: index,
                params: shape.params,
                input: shape.input(plan.seed, t, index),
              },
            ]
          : [],
      );
      workers++;
      const reply = await hostFor().send(
        { implementation: target.implementation, trial: plan.trial, tasks },
        deadlineMs,
      );
      restarts += reply.restarts ?? 0;
      if (reply.kind === "error") {
        broken.push(
          `시행 ${t} 의 워커가 결과를 내지 못했다 — ${reply.message}`,
        );
        return;
      }
      const results = reply.results;
      if (!Array.isArray(results) || results.length !== tasks.length) {
        broken.push(`시행 ${t} 의 결과 수가 모양 수 ${tasks.length} 와 다르다`);
        return;
      }
      for (const [position, task] of tasks.entries()) {
        const shape = plan.shapes[task.shape];
        const judged = byShape[task.shape];
        if (shape === undefined || judged === undefined)
          throw new Error("모양 번호가 어긋났다");
        const result = results[position] as TrialResult;
        const problem = malformed(result, shape.judgments);
        if (problem !== null) {
          broken.push(`시행 ${t} · ${shape.name} — ${problem}`);
          return;
        }
        cost += result.cost;
        if (result.violation !== null)
          violations.push(
            `시행 ${t} · ${shape.name} — 결정적 문장 위반: ${result.violation}`,
          );
        for (const outcome of judged) {
          const tally = result.tallies[
            outcome.id
          ] as TrialResult["tallies"][string];
          outcome.sum += tally.misses / tally.events;
          outcome.completed += 1;
          if (tally.misses > 0)
            outcome.first ??= `시행 ${t}: ${tally.first ?? "(설명 없음)"}`;
          if (
            outcome.exceededAt === null &&
            outcome.sum > outcome.limit + SUM_SLACK
          )
            outcome.exceededAt = t;
        }
      }
      trials++;
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(parallel, plannedTrials) }, lane),
  );
  (host as TrialHost | null)?.close();

  const exceeded = outcomes.filter((o) => o.sum > o.limit + SUM_SLACK);
  const reasons = [
    ...broken,
    ...violations,
    ...exceeded.map(
      (o) =>
        `${o.shape} · 「${o.id}」 — 벗어난 몫의 합 S = ${o.sum.toFixed(3)} > 한계 k = ${o.limit} (시행 ${o.completed} / T = ${o.trials}, δ = ${o.delta}). ` +
        `[보장] Hoeffding(1963) 정리 1 — 전제: 입력이 구현 무작위와 독립(B1) · 시행마다 새 워커라 시행끼리 독립(B3) · 시행당 E[Z_t] ≤ δ — ` +
        `이면 계약을 지키는 구현이 여기서 떨어질 확률은 exp(−T·D(k/T‖δ)) = ${formatBound(o.bound)} 이하다. 첫 벗어남: ${o.first ?? "없음"}`,
    ),
  ];
  const incomplete =
    reasons.length === 0 && trials < plannedTrials
      ? [`시행 ${trials} / ${plannedTrials} 만 받았다 — 판정을 끝내지 못했다`]
      : [];
  const all = [...reasons, ...incomplete];
  return {
    ok: all.length === 0,
    reason: all.join("\n"),
    workers,
    restarts,
    hosts,
    trials,
    plannedTrials,
    cost,
    judgments: outcomes,
  };
}

/**
 * fixture 를 모듈 주소 + export 이름으로 적는다(원칙 B 하네스 변경 명세 H3). 파일은 `./_fixtures/` 아래 이름(확장자 없이)이다.
 * 팩토리 함수가 워커 경계를 못 넘으므로 자기시험도 fixture 를 이 모양으로만 넘긴다.
 */
export function fixtureTarget(file: string, exportName: string): TrialTarget {
  return {
    label: `fixture ${exportName}`,
    implementation: {
      module: new URL(`./_fixtures/${file}.ts`, import.meta.url).href,
      exportName,
    },
  };
}

/** 한계를 넘긴 판정의 모양 이름(계획 순서). 자기시험이 「어느 모양이 잡았는가」를 단정할 때 쓴다. */
export function exceededShapes(verdict: TrialVerdict): string[] {
  return verdict.judgments
    .filter((judgment) => judgment.exceededAt !== null)
    .map((judgment) => `${judgment.shape} · ${judgment.id}`);
}

/**
 * 통계 판정을 `bun:test` 에 등록한다. 계약 스위트 실행부(`<name>.test.ts`)가 `runContract` 옆에서 부른다.
 * 테스트 시간 한도는 생존 감시에서 따라 나오는 값이고 비용 판정이 아니다.
 */
export function trialContract<Params, Input>(
  plan: TrialPlan<Params, Input>,
  target: TrialTarget,
  options: TrialOptions = {},
): void {
  const plannedTrials = Math.max(...plan.shapes.map((shape) => shape.trials));
  const judgments = plan.shapes.reduce(
    (sum, shape) => sum + shape.judgments.length,
    0,
  );
  const parallel = Math.max(1, options.parallel ?? defaultParallel());
  const deadlineMs = options.deadlineMs ?? DEFAULT_DEADLINE_MS;
  const timeout = (Math.ceil(plannedTrials / parallel) + 1) * deadlineMs;
  describe(`${plan.name} 축1 통계 판정 [${target.label}]`, () => {
    test(
      `독립 시행 ${plannedTrials} 개 · 판정 ${judgments} 개 — 벗어난 몫의 합이 한계 안이다`,
      async () => {
        const verdict = await runTrials(plan, target, {
          ...options,
          parallel,
          deadlineMs,
        });
        expect(verdict.ok ? "" : verdict.reason).toBe("");
      },
      timeout,
    );
  });
}
