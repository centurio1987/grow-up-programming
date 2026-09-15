/**
 * 판정 도구 fixture — `../runTrials.ts` 러너 자기시험용 시행 모듈. 구조의 계약이 아니라 **러너가 조용히 통과하지 않는지**와
 * **워커마다 모듈을 새로 읽는지**를 보는 자리다(`../runTrials.test.ts`).
 *
 * - `DrawCoin` — 이 모듈이 처음 읽힐 때 뽑은 값을 드는 생성자. `drawTrial` 이 그 값을 설명 칸에 실어 돌려준다 — 워커마다 값이
 *   달라야 새 모듈 그래프다.
 * - `throwingTrial` · `malformedTrial` · `spinningTrial` · `missingJudgmentTrial` · `violatingTrial` — 예외 · 모양이 틀린 결과 · 멈춤 ·
 *   판정 이름 누락 · 결정적 위반.
 * - `killHostTrial` — 워커를 띄운 호스트 프로세스를 죽인다(Bun 이 죽는 경우를 흉내 낸다).
 */

const DRAW = Math.random();

export class DrawCoin {
  readonly draw = DRAW;
  constructor(readonly rate: number) {}
}

export function drawTrial(
  make: (rate: number) => DrawCoin,
  params: readonly [number],
  input: { events: number },
) {
  const coin = make(params[0]);
  const missed = coin.draw < coin.rate;
  return {
    violation: null,
    tallies: {
      coin: {
        events: input.events,
        misses: missed ? input.events : 0,
        first: String(coin.draw),
      },
    },
    cost: 0,
  };
}

export function throwingTrial(): never {
  throw new Error("시행 함수가 던졌다");
}

export function malformedTrial() {
  return {
    violation: null,
    tallies: { coin: { events: 0, misses: 0, first: null } },
    cost: 0,
  };
}

export function missingJudgmentTrial() {
  return { violation: null, tallies: {}, cost: 0 };
}

export function spinningTrial(): never {
  for (;;) {
    // 멈춘 시행 — 생존 감시가 끊어야 한다.
  }
}

export function violatingTrial() {
  return {
    violation: "결정적 문장을 어겼다",
    tallies: { coin: { events: 1, misses: 0, first: null } },
    cost: 0,
  };
}

export function killHostTrial(): never {
  process.kill(process.pid, "SIGKILL");
  throw new Error("호스트가 죽지 않았다");
}
