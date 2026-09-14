/**
 * 인쇄기 — 헤드리스 크롬을 **CDP(Chrome DevTools Protocol)로** 몬다.
 *
 * `--print-to-pdf` 플래그를 안 쓰는 이유가 하나 있다. 그 플래그로는 **머리말·꼬리말을 못
 * 넣는다.** 크롬은 CSS `@page` 의 여백 상자(`@bottom-center`)를 구현하지 않으므로 쪽번호를
 * 넣을 자리가 CDP `Page.printToPDF` 의 `headerTemplate`/`footerTemplate` 밖에 없다.
 * 쪽번호가 없으면 목차의 쪽 표시도 가리킬 곳이 없어진다 — 즉 이건 선택이 아니라 전제다.
 *
 * 크롬을 편마다 새로 띄우지 않고 하나로 111편을 인쇄한다. 냉시동이 편당 5.5초 중 3초쯤을
 * 차지해서, 다시 띄우면 그 3초가 111번 붙는다.
 */

import { mkdir, rm } from "node:fs/promises";
import type { BookConfig } from "./config.ts";
import { PAPER } from "./config.ts";

const CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
];

export async function findChrome(): Promise<string> {
  const env = process.env.CHROME_PATH;
  if (env !== undefined && (await Bun.file(env).exists())) return env;
  for (const c of CANDIDATES) if (await Bun.file(c).exists()) return c;
  throw new Error(
    "크롬을 못 찾았다. CHROME_PATH 로 실행 파일 경로를 준다 — 이 저장소는 인쇄에 크롬만 쓴다(gs·qpdf 없음).",
  );
}

export interface PrintOptions {
  /** 꼬리말에 쪽번호를 넣는가. 낱장 쪽수만 잴 때는 꺼서 조판을 그대로 둔다. */
  footer?: boolean;
  /** 머리말 문구. 비우면 머리말 자리를 비운다(여백은 그대로 — 조판이 흔들리지 않는다). */
  header?: string;
}

export class Printer {
  private id = 0;
  private readonly pending = new Map<number, (v: unknown) => void>();
  private readonly waiters = new Map<string, Array<() => void>>();

  /** 붙은 뒤에 채운다. 소켓 하나에 인쇄기 객체가 둘이 되면 응답 id 가 갈린다. */
  private session = "";

  private constructor(
    private readonly proc: Bun.Subprocess,
    private readonly ws: WebSocket,
    private readonly profile: string,
    private readonly cfg: BookConfig,
  ) {}

  static async launch(cfg: BookConfig): Promise<Printer> {
    const bin = await findChrome();
    const profile = `${await tmpRoot()}/chrome-${process.pid}`;
    await mkdir(profile, { recursive: true });

    const proc = Bun.spawn(
      [
        bin,
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--force-color-profile=srgb",
        `--user-data-dir=${profile}`,
        "--remote-debugging-port=0",
      ],
      { stdout: "ignore", stderr: "ignore" },
    );

    const portFile = `${profile}/DevToolsActivePort`;
    let port = "";
    for (let i = 0; i < 80; i++) {
      const f = Bun.file(portFile);
      if (await f.exists()) {
        const line = (await f.text()).split("\n")[0];
        if (line !== undefined && line.trim() !== "") {
          port = line.trim();
          break;
        }
      }
      await Bun.sleep(125);
    }
    if (port === "") {
      proc.kill();
      throw new Error("크롬 디버깅 포트가 안 열렸다 — 10초 기다렸다");
    }

    const ver = (await (
      await fetch(`http://127.0.0.1:${port}/json/version`)
    ).json()) as { webSocketDebuggerUrl: string };

    const ws = new WebSocket(ver.webSocketDebuggerUrl);
    await new Promise<void>((res, rej) => {
      ws.onopen = () => res();
      ws.onerror = () => rej(new Error("CDP 소켓 연결 실패"));
    });

    const printer = new Printer(proc, ws, profile, cfg);
    ws.onmessage = (e) => printer.onMessage(String(e.data));

    const t = (await printer.send("Target.createTarget", {
      url: "about:blank",
    })) as {
      targetId: string;
    };
    const a = (await printer.send("Target.attachToTarget", {
      targetId: t.targetId,
      flatten: true,
    })) as { sessionId: string };
    printer.session = a.sessionId;
    await printer.send("Page.enable");
    return printer;
  }

  private onMessage(data: string): void {
    const m = JSON.parse(data) as {
      id?: number;
      method?: string;
      result?: unknown;
      error?: { message: string };
    };
    if (typeof m.id === "number") {
      const res = this.pending.get(m.id);
      if (res !== undefined) {
        this.pending.delete(m.id);
        if (m.error !== undefined) throw new Error(`CDP ${m.error.message}`);
        res(m.result);
      }
      return;
    }
    if (typeof m.method === "string") {
      for (const f of this.waiters.get(m.method) ?? []) f();
      this.waiters.delete(m.method);
    }
  }

  private send(method: string, params: unknown = {}): Promise<unknown> {
    const n = ++this.id;
    return new Promise((res) => {
      this.pending.set(n, res);
      this.ws.send(
        JSON.stringify(
          this.session === ""
            ? { id: n, method, params }
            : { id: n, method, params, sessionId: this.session },
        ),
      );
    });
  }

  private once(event: string, ms: number): Promise<void> {
    return new Promise((res) => {
      const t = setTimeout(res, ms);
      const list = this.waiters.get(event) ?? [];
      list.push(() => {
        clearTimeout(t);
        res();
      });
      this.waiters.set(event, list);
    });
  }

  /**
   * 파일 하나를 PDF 로 인쇄한다. `settle` 은 적재 이벤트 뒤 조판이 가라앉기를 기다리는 시간 —
   * 4천 쪽짜리 합본에서는 이 값을 늘려야 한다.
   */
  async print(
    file: string,
    opts: PrintOptions = {},
    settleMs = 400,
  ): Promise<Uint8Array> {
    const loaded = this.once("Page.loadEventFired", 120_000);
    await this.send("Page.navigate", { url: `file://${file}` });
    await loaded;
    await Bun.sleep(settleMs);

    const { w, h } = PAPER[this.cfg.page.format];
    const m = this.cfg.page.marginIn;
    const header = opts.header ?? "";
    const res = (await this.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: false,
      paperWidth: w,
      paperHeight: h,
      marginTop: m.top,
      marginBottom: m.bottom,
      marginLeft: m.left,
      marginRight: m.right,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:7.5pt;width:100%;padding:0 12mm;color:#8a8f94;font-family:-apple-system,sans-serif">${header}</div>`,
      footerTemplate:
        opts.footer === false
          ? '<div style="display:none"></div>'
          : `<div style="font-size:8pt;width:100%;text-align:center;color:#5f6368;font-family:-apple-system,sans-serif"><span class="pageNumber"></span></div>`,
    })) as { data?: string };

    if (res.data === undefined) throw new Error(`인쇄 실패: ${file}`);
    return Buffer.from(res.data, "base64");
  }

  async close(): Promise<void> {
    try {
      this.ws.close();
    } catch {
      /* 이미 닫혔으면 그만이다 */
    }
    this.proc.kill();
    await rm(this.profile, { recursive: true, force: true });
  }
}

/**
 * PDF 의 쪽수. 쪽 트리 뿌리의 `/Count` 가 가장 큰 값이다.
 *
 * 외부 도구를 안 쓰는 이유는 없어서다 — 이 기계에 `qpdf` 도 `gs` 도 없다(실측). 쪽수 하나
 * 때문에 의존성을 늘리지 않는다.
 */
export function pdfPageCount(bytes: Uint8Array): number {
  const text = Buffer.from(bytes).toString("latin1");
  let max = 0;
  for (const m of text.matchAll(/\/Count\s+(\d+)/g)) {
    const n = Number(m[1]);
    if (n > max) max = n;
  }
  if (max === 0)
    throw new Error("PDF 에서 쪽수를 못 읽었다 — 산출이 깨졌을 수 있다");
  return max;
}

async function tmpRoot(): Promise<string> {
  const base = process.env.TMPDIR ?? "/tmp";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}
