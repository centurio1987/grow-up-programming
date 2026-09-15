/**
 * 통계 판정의 워커 호스트 프로세스 — `./runTrials.ts` 가 `bun` 자식 프로세스로 띄운다. 시행 하나마다 `./runTrials.worker.ts` 워커를
 * **새로** 띄워 결과를 받아 돌려준다. 이 프로세스는 판정하지 않고 입력도 짓지 않는다.
 *
 * **왜 프로세스를 하나 더 두는가.** Bun 1.3.12 에서 한 프로세스가 워커를 거듭 띄우고 끊으면 수백 개째부터 프로세스가 죽는다(segfault ·
 * 종료 코드 133 · 139 — 탐침에서 가장 이른 것이 634 개째, 동시 8 · 4 개 모두, `close` 청취나 생존 감시 타이머를 빼도 같았다 —
 * `docs/ORD-006-conventions.md` 의 `S24` 절 「Bun 워커 크래시」). 그래서 러너는 이 호스트 하나에 워커를 정해 둔 수(`HOST_TRIALS`)만큼만
 * 맡기고 다음 호스트를 새로 띄운다. 호스트가 죽으면 러너가 종료 코드로 알아채고 판정을 떨어뜨린다.
 *
 * 규약: 표준 입력으로 한 줄에 요청 하나(`{ id, request, deadlineMs }` JSON)를 받고, 표준 출력으로 한 줄에 답 하나(`{ id, reply }`)를
 * 낸다. 표준 입력이 닫히고 맡은 워커가 전부 끝나면 스스로 끝난다.
 */

const WORKER_URL = new URL("./runTrials.worker.ts", import.meta.url).href;

type Reply =
  | { kind: "result"; results: unknown; restarts: number }
  | { kind: "error"; message: string; restarts: number };

type Attempt =
  | { kind: "result"; results: unknown }
  | { kind: "error"; message: string }
  | { kind: "stalled" };

/**
 * 워커가 요청을 받았다는 표지(`received`)를 내기까지 기다리는 생존 감시(밀리초). **이 표지 전에는 구현의 코드가 한 줄도 돌지
 * 않았으므로** 멈춘 워커를 다시 띄워도 판정이 치우치지 않는다. 표지 뒤에 멈추면 다시 띄우지 않고 떨어뜨린다 — 구현이 멈춘 것일 수
 * 있고, 멈춤과 오답이 함께 가는 구현을 다시 띄우면 오답만 걸러져 판정이 치우친다. Bun 1.3.12 에서 워커가 답 없이 멈춘 일이
 * 탐침 워커 약 9 만 개 중 한 번 있었다(`docs/ORD-006-conventions.md` 의 `S24` 절 「Bun 워커 크래시」).
 */
const RECEIVE_MS = 20_000;
/** 표지 전에 멈춘 워커를 다시 띄우는 횟수의 위 끝. */
const MAX_RESTARTS = 2;

/** 워커 하나를 띄워 요청 하나를 보내고 답 하나를 받는다. 어떤 끝이든 `Attempt` 하나로 모은다. */
function attemptWorker(request: unknown, deadlineMs: number): Promise<Attempt> {
  return new Promise((resolve) => {
    const worker = new Worker(WORKER_URL);
    let settled = false;
    let received = false;
    const finish = (attempt: Attempt) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(attempt);
    };
    // 생존 감시 — 멈춘 워커를 끊는 장치이지 비용을 재는 값이 아니다.
    let timer = setTimeout(() => finish({ kind: "stalled" }), RECEIVE_MS);
    worker.addEventListener("message", (event: MessageEvent) => {
      const data = event.data as { kind?: unknown } | null;
      if (
        data !== null &&
        typeof data === "object" &&
        data.kind === "received"
      ) {
        received = true;
        clearTimeout(timer);
        timer = setTimeout(
          () =>
            finish({
              kind: "error",
              message: `워커 무응답 — 요청을 받은 뒤 생존 감시 ${deadlineMs} ms 안에 결과가 오지 않았다`,
            }),
          deadlineMs,
        );
        return;
      }
      if (
        data !== null &&
        typeof data === "object" &&
        (data.kind === "result" || data.kind === "error")
      )
        finish(data as Attempt);
      else
        finish({ kind: "error", message: "워커가 알 수 없는 메시지를 보냈다" });
    });
    worker.addEventListener("error", (event: ErrorEvent) =>
      finish({ kind: "error", message: `워커 오류 — ${event.message}` }),
    );
    worker.addEventListener("messageerror", () =>
      finish({ kind: "error", message: "워커 메시지를 풀지 못했다" }),
    );
    worker.addEventListener("close", () =>
      finish(
        received
          ? { kind: "error", message: "워커가 결과 없이 닫혔다" }
          : { kind: "stalled" },
      ),
    );
    worker.postMessage(request);
  });
}

/** 표지 전에 멈춘 워커만 `MAX_RESTARTS` 번까지 새로 띄운다. 다시 띄운 수를 답에 싣는다. */
async function runWorker(request: unknown, deadlineMs: number): Promise<Reply> {
  for (let restarts = 0; ; restarts++) {
    const attempt = await attemptWorker(request, deadlineMs);
    if (attempt.kind !== "stalled") return { ...attempt, restarts };
    if (restarts === MAX_RESTARTS)
      return {
        kind: "error",
        message: `워커가 요청을 받지 못했다 — ${MAX_RESTARTS + 1} 번 띄워 모두 ${RECEIVE_MS} ms 안에 표지가 없었다`,
        restarts,
      };
  }
}

function emit(line: unknown): void {
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

const decoder = new TextDecoder();
let buffer = "";
const reader = Bun.stdin.stream().getReader();
for (let next = await reader.read(); !next.done; next = await reader.read()) {
  buffer += decoder.decode(next.value, { stream: true });
  for (let end = buffer.indexOf("\n"); end >= 0; end = buffer.indexOf("\n")) {
    const line = buffer.slice(0, end);
    buffer = buffer.slice(end + 1);
    if (line.length === 0) continue;
    const { id, request, deadlineMs } = JSON.parse(line) as {
      id: number;
      request: unknown;
      deadlineMs: number;
    };
    runWorker(request, deadlineMs).then((reply) => emit({ id, reply }));
  }
}
