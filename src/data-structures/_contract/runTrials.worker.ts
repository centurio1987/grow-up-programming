/**
 * 통계 판정의 시행 하나 — `./runTrials.ts` 가 시행마다 이 워커를 **새로** 띄운다.
 *
 * 워커는 모듈 그래프 전체를 새로 읽는다. 그래서 구현이 무작위를 어느 모듈의 어느 자리에서 뽑든 시행마다 새로 뽑힌다 — 공유
 * 범위가 「실행」인 계약의 시행 하나가 워커 하나다(`docs/ORD-006-conventions.md` 「원칙 B」 B2 · B3, 탐침은 그 절의 「새 실행
 * 영역을 만드는 길 — 실측」).
 *
 * 받는 것: 구현 모듈 주소 · 시행 함수 모듈 주소 · 모양마다 매개변수와 **이미 정해진 입력**. 이 워커는 입력을 짓지 않는다.
 * 돌려주는 것: 요청을 받았다는 표지(`received`) 하나, 그다음 모양마다 시행 함수의 반환값 또는 예외의 설명. 예외를 삼키지
 * 않는다 — 판정은 `./runTrials.ts` 가 떨어뜨린다.
 */

declare var self: Worker;

interface Task {
  shape: number;
  params: readonly unknown[];
  input: unknown;
}

interface Request {
  implementation: { module: string; exportName: string };
  trial: { module: string; exportName: string };
  tasks: readonly Task[];
}

self.onmessage = async (event: MessageEvent<Request>) => {
  // 요청을 받았다는 표지 — 이 뒤부터 구현의 코드가 돈다. 호스트는 이 표지 전에 멈춘 워커만 다시 띄운다(`./runTrials.host.ts`).
  self.postMessage({ kind: "received" });
  const { implementation, trial, tasks } = event.data;
  try {
    const implModule = (await import(implementation.module)) as Record<
      string,
      unknown
    >;
    const Impl = implModule[implementation.exportName];
    if (typeof Impl !== "function")
      throw new Error(
        `구현 모듈 ${implementation.module} 에 생성자 ${implementation.exportName} 이 없다`,
      );
    const trialModule = (await import(trial.module)) as Record<string, unknown>;
    const run = trialModule[trial.exportName];
    if (typeof run !== "function")
      throw new Error(
        `시행 모듈 ${trial.module} 에 함수 ${trial.exportName} 이 없다`,
      );
    const Ctor = Impl as new (...args: unknown[]) => unknown;
    const make = (...args: unknown[]) => new Ctor(...args);
    const results = tasks.map((task) =>
      (run as (m: typeof make, p: readonly unknown[], i: unknown) => unknown)(
        make,
        task.params,
        task.input,
      ),
    );
    self.postMessage({ kind: "result", results });
  } catch (error) {
    const message =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    self.postMessage({ kind: "error", message });
  }
};
