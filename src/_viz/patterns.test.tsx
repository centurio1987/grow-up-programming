import { describe, expect, test } from "bun:test";
import {
  ArrayStrip,
  CellStage,
  CellStageFilm,
  cellStageSize,
  filmCells,
  LevelTable,
  LogBarChart,
  NodeGraph,
  NodeGraphFilm,
  nodeGraphSize,
  overlapCells,
  type PlayerSpec,
  playerFrames,
  RangeCover,
  renderToSvg,
  StepTrace,
  treeLayout,
} from "./index";

// 파일럿 sparseTableRangeMin 의 전개 입력과 두 질의(「전체 컨셉」·「아이디어 상세」 4단계).
const A = [5, 2, 7, 4, 6, 3];

describe("P1 ArrayStrip", () => {
  test("칸 여섯과 인덱스 여섯이 그려지고 결정론이다", async () => {
    const el = (
      <ArrayStrip
        title="배열 A"
        row={{ label: "A 의 값", values: A }}
        indexLabel="인덱스"
      />
    );
    const a = await renderToSvg(el, "t-strip");
    const b = await renderToSvg(el, "t-strip");
    expect(a).toBe(b);
    expect(a.match(/data-viz-cell="/g)?.length).toBe(6);
    expect(a).toContain("--bbangto-viz-ext-cell-fill");
    expect(a).not.toMatch(/(href|src)="https?:/);
  });

  test("상태가 칸에 실린다", async () => {
    const el = (
      <ArrayStrip
        title="강조"
        row={{ values: A, states: { 1: "focus", 5: "out" } }}
      />
    );
    const svg = await renderToSvg(el, "t-state");
    expect(svg).toContain('data-viz-cell="1" data-viz-state="focus"');
    expect(svg).toContain('data-viz-cell="5" data-viz-state="out"');
  });
});

describe("P2 RangeCover", () => {
  test("겹침은 조각 데이터에서 계산한다 — 질의 괄호는 세지 않는다", () => {
    expect(
      overlapCells([
        { from: 0, to: 5, tone: "query" },
        { from: 0, to: 3, tone: "left" },
        { from: 2, to: 5, tone: "right" },
      ]),
    ).toEqual([2, 3]);
    expect(
      overlapCells([
        { from: 0, to: 3, tone: "left" },
        { from: 1, to: 4, tone: "right" },
      ]),
    ).toEqual([1, 2, 3]);
  });

  test("[0,5] 를 두 조각으로 덮으면 칸 2·3 이 겹침이다", async () => {
    const svg = await renderToSvg(
      <RangeCover
        title="두 조각으로 [0,5] 덮기"
        row={{ label: "A 의 값", values: A }}
        indexLabel="인덱스"
        ranges={[
          { from: 0, to: 3, tone: "left", note: "2 층의 칸 0 · 값 2" },
          { from: 2, to: 5, tone: "right", note: "2 층의 칸 2 · 값 3" },
        ]}
      />,
      "t-cover",
    );
    expect(svg).toContain('data-viz-cell="2" data-viz-state="overlap"');
    expect(svg).toContain('data-viz-cell="3" data-viz-state="overlap"');
    expect(svg).toContain('data-viz-cell="1" data-viz-state="base"');
    expect(svg.match(/data-viz-range="/g)?.length).toBe(2);
  });
});

describe("P3 LevelTable", () => {
  test("층 값이 정본 실행과 같다 — 층 k 칸 i = 구간 [i, i+2^k−1] 의 답", async () => {
    const { sparseTableRangeMin } = await import(
      "../algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.ref.ts"
    );
    // 가이드의 층 세 줄(「전체 컨셉」).
    const levels = [A, [2, 2, 4, 4, 3], [2, 2, 3]];
    levels.forEach((row, k) => {
      row.forEach((v, i) => {
        const [ans] = sparseTableRangeMin(A, [[i, i + 2 ** k - 1]]);
        expect(v).toBe(ans as number);
      });
    });
  });

  test("2 층 칸 1 을 고르면 1 층 칸 1·3 이 이어진다", async () => {
    const svg = await renderToSvg(
      <LevelTable
        title="2 층 칸 1"
        levels={[A, [2, 2, 4, 4, 3], [2, 2, 3]]}
        focus={{ k: 2, i: 1 }}
      />,
      "t-level",
    );
    expect(svg.match(/data-viz-label="[0-9] 층/g)?.length).toBe(3);
    expect(svg.match(/data-viz-source="/g)?.length).toBe(2);
    expect(svg.match(/data-viz-state="focus"/g)?.length).toBe(1);
    expect(svg.match(/data-viz-state="overlap"/g)?.length).toBe(2);
  });
});

describe("P4 StepTrace · 기존 유형", () => {
  test("시뮬 걸음 T3~T15 가 차례로 이어지고, 걸음 제목이 그대로 걸음 줄이 된다", async () => {
    // 걸음 값이 정본 실행과 같은지는 가이드 시험(`sparseTableRangeMin-guide.test.ts`)이 잰다.
    const sim = await import(
      "../algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.sim.ts"
    );
    const all = [...sim.build.steps, ...sim.answer.steps];
    expect(all.map((f) => f.title.split(" ")[0])).toEqual(
      Array.from({ length: 13 }, (_, n) => `T${n + 3}`),
    );
    const svg = await renderToSvg(
      <StepTrace
        title="질의 다섯"
        current="T13"
        steps={sim.answer.steps.map((f) => ({
          id: f.title.split(" ")[0] as string,
          text: f.title.slice(f.title.indexOf(" ") + 1),
        }))}
      />,
      "t-trace",
    );
    expect(svg).toContain('data-viz-step="T13" data-viz-state="current"');
    expect(svg).toContain('data-viz-step="T11" data-viz-state="done"');
    expect(svg).toContain('data-viz-step="T15" data-viz-state="todo"');
  });

  test("로그 막대는 원래 값을 적고, ProcessSteps 도 이 가이드로 칠해진다", async () => {
    const bars = await renderToSvg(
      <LogBarChart
        title="견주기 수"
        bars={[
          { id: "a", label: "n = 6", value: 30 },
          { id: "b", label: "n = 100,000", value: 9_999_900_000 },
        ]}
      />,
      "t-bars",
    );
    expect(bars).toContain("9,999,900,000");
    expect(bars).toContain(">30<");
    const { ProcessSteps } = await import(
      "@centurio1987/bbangto-ui-visualization"
    );
    const steps = await renderToSvg(
      <ProcessSteps
        title="절차"
        data={{ steps: [{ title: "층 번호 표" }, { title: "0 층 복사" }] }}
      />,
      "t-steps",
    );
    expect(steps).toContain("--bbangto-viz-ext-cell-fill");
  });
});

describe("스타일 가이드 가드", () => {
  // S4·S6 에서 같은 부류의 결함이 두 번 났다 — 흑백에서 흰 채움 토큰을 선·막대 색으로 써서 사라졌다.
  test("모든 변형에서 선·막대 토큰은 바탕과 다른 색이다", async () => {
    const { resolveVizFoundationPreset } = await import(
      "@centurio1987/bbangto-ui-visualization"
    );
    const { algoVizStyleGuide } = await import("../../design/viz/algo.viz");
    for (const key of ["light", "dark", "mono"]) {
      const { foundations, extendedFoundations } = resolveVizFoundationPreset(
        algoVizStyleGuide,
        key,
      );
      const bg = foundations.canvas.bg.toLowerCase();
      for (const t of [
        "bracket",
        "cell-border",
        "cell-text",
        "cell-focus-stroke",
        "cell-overlap-stroke",
        "step-current-fill",
        "step-past",
        "step-todo",
        "bar-fill",
        "caret",
        "level-border",
      ]) {
        expect(
          `${key}:${t}=${extendedFoundations[`--bbangto-viz-ext-${t}`]?.toLowerCase()}`,
        ).not.toBe(`${key}:${t}=${bg}`);
      }
    }
  });

  // 의뢰서 7절(KAN-057 S12) — 글자 4.5:1 · 선과 칸 경계 3:1. 채움 위 글자는 그 채움과 잰다.
  test("밝은·어두운·흑백 모두 대비 기준을 넘는다", async () => {
    const { resolveVizFoundationPreset } = await import(
      "@centurio1987/bbangto-ui-visualization"
    );
    const { algoVizStyleGuide } = await import("../../design/viz/algo.viz");
    const lum = (hex: string): number => {
      const n = Number.parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
        .map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        })
        .reduce(
          (s, v, i) => s + v * ([0.2126, 0.7152, 0.0722][i] as number),
          0,
        );
    };
    const ratio = (a: string, b: string): number => {
      const [x, y] = [lum(a), lum(b)];
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    const pairs: [string, string, number][] = [
      ["cell-text", "cell-fill", 4.5],
      ["cell-muted-text", "cell-fill", 4.5],
      ["note-color", "@bg", 4.5],
      ["index-color", "@bg", 4.5],
      ["cell-text", "cell-focus-fill", 4.5],
      ["cell-text", "cell-overlap-fill", 4.5],
      ["step-current-text", "step-current-fill", 4.5],
      ["cell-border", "@bg", 3],
      ["cell-focus-stroke", "@bg", 3],
      ["cell-overlap-stroke", "@bg", 3],
      ["bracket", "@bg", 3],
    ];
    const low: string[] = [];
    for (const key of ["light", "dark", "mono"]) {
      const { foundations, extendedFoundations } = resolveVizFoundationPreset(
        algoVizStyleGuide,
        key,
      );
      const v = (t: string): string =>
        t === "@bg"
          ? foundations.canvas.bg
          : (extendedFoundations[`--bbangto-viz-ext-${t}`] as string);
      for (const [fg, bg, need] of pairs) {
        const r = ratio(v(fg), v(bg));
        if (r < need) low.push(`${key} ${fg}/${bg} ${r.toFixed(2)} < ${need}`);
      }
    }
    expect(low).toEqual([]);
  });
});

describe("P5 LayerBars", () => {
  test("층의 칸마다 맡는 자리에만 값을 놓고, 안 맡는 자리는 점으로 둔다", async () => {
    const { LayerBars } = await import("./patterns/LayerBars");
    const svg = await renderToSvg(
      <LayerBars
        title="1 층"
        values={A}
        groups={[
          [
            { label: "1 층 칸 0", from: 0, to: 1, note: "[0,1] 의 최솟값 2" },
            { label: "1 층 칸 1", from: 1, to: 2, note: "[1,2] 의 최솟값 2" },
          ],
        ]}
      />,
      "t-bars",
    );
    expect(svg.match(/data-viz-bar="/g)?.length).toBe(2);
    expect(svg).toContain(
      'data-viz-bar="1 층 칸 1" data-viz-from="1" data-viz-to="2"',
    );
    // 칸 여섯 중 두 자리를 맡으니 줄마다 점 넷
    expect(svg.match(/>·</g)?.length).toBe(8);
  });
});

describe("P6 ApproachLadder", () => {
  test("시도마다 카드 · 판정 · 기준별 통과와 실패가 그림에 실린다", async () => {
    const { ApproachLadder } = await import("./patterns/ApproachLadder");
    const svg = await renderToSvg(
      <ApproachLadder
        title="시도"
        steps={[
          {
            name: "가",
            idea: "처음",
            verdict: "drop",
            checks: [
              { label: "답", value: "맞다", ok: true },
              { label: "시간", value: "넘는다", ok: false },
            ],
            lesson: "그래서 나",
          },
          {
            name: "나",
            idea: "다음",
            verdict: "keep",
            checks: [{ label: "답", value: "맞다", ok: true }],
          },
        ]}
      />,
      "t-ladder",
    );
    expect(svg.match(/data-viz-approach="/g)?.length).toBe(2);
    expect(svg).toContain('data-viz-verdict="drop"');
    expect(svg).toContain('data-viz-verdict="keep"');
    expect(svg).toContain('data-viz-check="시간" data-viz-ok="false"');
    expect(svg).toContain("↓ 그래서 나");
  });
});

describe("P7 CellStage · 걸음 재생 패널 무대", () => {
  const load = async () => {
    const sim = await import(
      "../algorithms/array/sparseTableRangeMin/sparseTableRangeMin-guide.sim.ts"
    );
    return {
      build: playerFrames(sim.build as unknown as PlayerSpec),
      answer: playerFrames(sim.answer as unknown as PlayerSpec),
    };
  };
  const count = (svg: string, re: RegExp) => svg.match(re)?.length ?? 0;

  test("쌓는 벌 — 무대 높이가 걸음 사이에 같고, 이번 걸음의 읽음 둘과 새로 씀 하나만 강조한다", async () => {
    const { build } = await load();
    const heights = new Set(
      build.map((f) => cellStageSize([f.rows], f.columns).height),
    );
    expect(heights.size).toBe(1);
    const t8 = build.find((f) => f.id === "T8");
    if (!t8) throw new Error("T8 이 없다");
    const svg = await renderToSvg(
      <CellStage title="T8" rows={t8.rows} columns={t8.columns} />,
      "t-stage-build",
    );
    expect(count(svg, /data-viz-state="read"/g)).toBe(2);
    expect(count(svg, /data-viz-state="focus"/g)).toBe(1);
    // 2 층의 남은 두 칸은 아직(점선) — 앞으로 채울 자리가 보인다.
    expect(count(svg, /data-viz-state="empty"/g)).toBe(2);
    expect(svg).toContain(
      'data-viz-range="make" data-viz-from="0" data-viz-to="3"',
    );
    expect(count(svg, /data-viz-focus="true"/g)).toBe(4);
    expect(t8.calc).toEqual({ expr: "min(2, 4) =", result: "2" });
    expect(t8.vars).toBe("채운 칸 6 / 8");
  });

  test("답하는 벌 — 질의 괄호 · 두 조각 · 겹친 칸 · 답 목록이 한 무대에 있다", async () => {
    const { answer } = await load();
    const heights = new Set(
      answer.map((f) => cellStageSize([f.rows], f.columns).height),
    );
    expect(heights.size).toBe(1);
    const t11 = answer.find((f) => f.id === "T11");
    if (!t11) throw new Error("T11 이 없다");
    const svg = await renderToSvg(
      <CellStage title="T11" rows={t11.rows} columns={t11.columns} />,
      "t-stage-answer",
    );
    expect(svg).toContain(
      'data-viz-range="query" data-viz-from="0" data-viz-to="4"',
    );
    expect(svg).toContain(
      'data-viz-range="left" data-viz-from="0" data-viz-to="3"',
    );
    expect(svg).toContain(
      'data-viz-range="right" data-viz-from="1" data-viz-to="4"',
    );
    expect(count(svg, /data-viz-state="overlap"/g)).toBe(3);
    expect(count(svg, /data-viz-state="out"/g)).toBe(1);
    expect(count(svg, /data-viz-state="read"/g)).toBe(2);
    expect(t11.vars).toBeNull();
  });

  test("정적 그림은 같은 무대를 걸음마다 한 장씩 늘어놓는다", async () => {
    const { build } = await load();
    const svg = await renderToSvg(
      <CellStageFilm
        title="쌓기"
        columns={6}
        frames={build.map((f) => ({ id: f.id, text: f.title, rows: f.rows }))}
      />,
      "t-film",
    );
    expect(count(svg, /data-viz-step="T\d+"/g)).toBe(8);
    expect(count(svg, /data-viz-range="make"/g)).toBe(8);
  });

  test("필름 칸 경계는 필름 전체를 빈틈없이 나눈다 — 책이 이 자리에서 가른다", async () => {
    const { build } = await load();
    const svg = await renderToSvg(
      <CellStageFilm
        title="쌓기"
        columns={6}
        frames={build.map((f) => ({ id: f.id, text: f.title, rows: f.rows }))}
      />,
      "t-film",
    );
    const height = Number(/viewBox="0 0 \d+ (\d+)"/.exec(svg)?.[1]);
    const cells = [
      ...svg.matchAll(
        /data-viz-step="T\d+" data-viz-y="(\d+)" data-viz-h="(\d+)"/g,
      ),
    ].map((m) => ({ y: Number(m[1]), h: Number(m[2]) }));
    expect(cells.length).toBe(8);
    expect(cells[0]?.y).toBe(0);
    for (let n = 1; n < cells.length; n++) {
      const prev = cells[n - 1] as { y: number; h: number };
      expect(cells[n]?.y).toBe(prev.y + prev.h);
    }
    const last = cells.at(-1) as { y: number; h: number };
    expect(last.y + last.h).toBe(height);
  });

  test("칸 경계는 앞 칸 무대 끝에 선다 — 구분선이 뒤 칸에 통째로 든다", () => {
    // 두 칸: 배지 윗변이 10, 330. 칸 사이 틈이 20 이면 경계는 310 이다.
    expect(filmCells([10, 330], 640)).toEqual([
      { y: 0, h: 310 },
      { y: 310, h: 330 },
    ]);
  });
});

describe("P8 NodeGraph · 그래프 무대", () => {
  const count = (svg: string, re: RegExp) => svg.match(re)?.length ?? 0;
  // 강한 연결 요소 편(KAN-058 샘플)의 전개 입력과 같은 모양 — 정점 여섯 · 간선 일곱.
  const nodes = [
    { id: 0, x: 0, y: 0, value: "0 / 0" },
    { id: 1, x: 0, y: 2, value: "1 / 0", state: "read" as const },
    { id: 2, x: 1.2, y: 1, value: "2 / 0", state: "focus" as const },
    { id: 3, x: 2.6, y: 1, value: "3 / 3" },
    { id: 4, x: 3.8, y: 1, value: "4 / 3" },
    { id: 5, x: 2.6, y: -0.6, state: "empty" as const },
  ];
  const edges = [
    { from: 0, to: 1, kind: "tree" as const },
    { from: 1, to: 2, kind: "tree" as const },
    { from: 2, to: 0, kind: "back" as const, state: "focus" as const },
    { from: 2, to: 3, kind: "tree" as const },
    { from: 3, to: 4, kind: "tree" as const },
    { from: 4, to: 3, kind: "back" as const },
    { from: 5, to: 3, kind: "cross" as const, state: "out" as const },
  ];

  test("정점 · 간선 · 묶음 · 띠가 데이터 그대로 실리고 결정론이다", async () => {
    const el = (
      <NodeGraph
        title="강한 연결 요소"
        nodes={nodes}
        edges={edges}
        groups={[
          { members: [0, 1, 2], label: "[0, 1, 2]" },
          { members: [3, 4], label: "[3, 4]", state: "focus" },
        ]}
        strips={[{ label: "스택", values: [0, 1, 2], slots: 6 }]}
      />
    );
    const a = await renderToSvg(el, "t-graph");
    const b = await renderToSvg(el, "t-graph");
    expect(a).toBe(b);
    expect(count(a, /data-viz-node="/g)).toBe(6);
    expect(count(a, /data-viz-edge="/g)).toBe(7);
    expect(a).toContain('data-viz-node="2" data-viz-state="focus"');
    expect(a).toContain('data-viz-node="5" data-viz-state="empty"');
    expect(a).toContain(
      'data-viz-edge="2->0" data-viz-kind="back" data-viz-state="focus"',
    );
    expect(a).toContain(
      'data-viz-edge="5->3" data-viz-kind="cross" data-viz-state="out"',
    );
    expect(a).toContain('data-viz-group="3,4" data-viz-state="focus"');
    // 띠는 칸 여섯 — 값 셋 + 빈 칸 셋
    expect(a).toContain('data-viz-strip="스택"');
    expect(count(a, /data-viz-state="empty"/g)).toBe(1 + 3);
    expect(a).toContain("2 / 0");
    expect(a).not.toMatch(/(href|src)="https?:/);
  });

  test("반대 방향 두 간선(3→4 · 4→3)은 휘고, 나머지는 곧다 · 자기 자신으로 가는 간선은 고리다", async () => {
    const svg = await renderToSvg(
      <NodeGraph
        title="휨"
        nodes={nodes}
        edges={[...edges, { from: 1, to: 1 }]}
      />,
      "t-bend",
    );
    const pathOf = (id: string) =>
      new RegExp(`data-viz-edge="${id}"[^>]*><path d="([^"]+)"`).exec(
        svg,
      )?.[1] ?? "";
    expect(pathOf("3->4")).toContain(" Q ");
    expect(pathOf("4->3")).toContain(" Q ");
    expect(pathOf("0->1")).toContain(" L ");
    expect(pathOf("1->1")).toContain(" C ");
  });

  test("나무 배치 — 잎이 왼쪽부터 한 칸씩, 부모는 자식 가운데, y 는 깊이다", () => {
    const children = new Map<number, number[]>([
      [0, [1, 4]],
      [1, [2, 3]],
    ]);
    const at = treeLayout([0, 5], children);
    expect(at.get(2)).toEqual({ x: 0, y: 2 });
    expect(at.get(3)).toEqual({ x: 1, y: 2 });
    expect(at.get(1)).toEqual({ x: 0.5, y: 1 });
    expect(at.get(4)).toEqual({ x: 2, y: 1 });
    expect(at.get(0)).toEqual({ x: 1.25, y: 0 });
    expect(at.get(5)).toEqual({ x: 3, y: 0 });
  });

  test("걸음 재생 패널의 그래프 무대 — 자리는 한 번, 걸음마다 상태만 바뀌고 무대 크기가 같다", () => {
    const spec: PlayerSpec = {
      player: "stage",
      stage: "graph",
      title: "두 걸음",
      layout: {
        nodes: [
          { id: 0, x: 0, y: 0 },
          { id: 1, x: 1, y: 0 },
        ],
        edges: [{ from: 0, to: 1 }],
      },
      steps: [
        {
          title: "T1 정점 0",
          text: "들어간다",
          nodes: [{ value: "0", state: "focus" }, { state: "empty" }],
          edges: [{}],
          strips: [{ label: "스택", values: [0], slots: 2 }],
          vars: "timer = 1",
        },
        {
          title: "T2 간선 0→1",
          text: "내려간다",
          nodes: [
            { value: "0", state: "read" },
            { value: "1", state: "focus" },
          ],
          edges: [{ kind: "tree", state: "focus" }],
          strips: [{ label: "스택", values: [0, 1], slots: 2 }],
          calc: { expr: "disc[1] =", result: "1" },
        },
      ],
    };
    const frames = playerFrames(spec);
    expect(frames.map((f) => f.id)).toEqual(["T1", "T2"]);
    expect(frames[1]?.scene?.edges[0]).toMatchObject({
      from: 0,
      to: 1,
      kind: "tree",
      state: "focus",
    });
    expect(frames[0]?.vars).toBe("timer = 1");
    expect(frames[1]?.calc).toEqual({ expr: "disc[1] =", result: "1" });
    const sizes = frames.map((f) =>
      f.scene ? nodeGraphSize(f.scene).height : -1,
    );
    expect(new Set(sizes).size).toBe(1);
  });

  test("정점 네모는 이름이 기본 폭에 안 들어갈 때만 넓어진다 — 짧은 이름의 그림은 그대로다", async () => {
    const svg = await renderToSvg(
      <NodeGraph
        title="긴 이름"
        nodes={[
          { id: "a", label: "app", x: 0, y: 0 },
          { id: "b", label: "application", x: 1, y: 0 },
        ]}
        edges={[{ from: "a", to: "b" }]}
      />,
      "t-graph-wide",
    );
    const widthOf = (id: string) =>
      Number(
        new RegExp(
          `data-viz-node="${id}"[^>]*><rect [^>]*width="([\\d.]+)"`,
        ).exec(svg)?.[1],
      );
    expect(widthOf("a")).toBe(66);
    // 등폭 15px 글자 11 개(0.58 배로 센다)에 양옆 여백 10 씩
    expect(widthOf("b")).toBe(Math.ceil(11 * 15 * 0.58 + 20));
    // 간선은 넓어진 네모의 테에서 끊긴다 — 네모 안으로 들어가지 않는다
    const d =
      /data-viz-edge="a->b"[^>]*><path d="M ([\d.]+) [\d.]+ L ([\d.]+)/.exec(
        svg,
      );
    const bx = Number(
      /data-viz-node="b"[^>]*><rect x="([\d.]+)"/.exec(svg)?.[1],
    );
    expect(Number(d?.[2])).toBeLessThan(bx);
  });

  test("그래프 무대 — hidden 간선은 그 걸음의 장면에서 빠지고 정점 자리는 그대로다", () => {
    const spec: PlayerSpec = {
      player: "stage",
      stage: "graph",
      title: "부모가 바뀐다",
      layout: {
        nodes: [
          { id: "r", x: 1, y: 0 },
          { id: "m", x: 1, y: 1 },
          { id: "c", x: 1, y: 2 },
        ],
        edges: [
          { from: "r", to: "c", bend: -0.35 },
          { from: "r", to: "m" },
          { from: "m", to: "c" },
        ],
      },
      steps: [
        {
          title: "T1 뿌리 아래 잎 하나",
          text: "가르기 전",
          nodes: [{}, { state: "empty" }, { state: "focus" }],
          edges: [{ label: "apple" }, { state: "out" }, { state: "out" }],
        },
        {
          title: "T2 라벨을 가른다",
          text: "가른 뒤",
          nodes: [{}, { state: "focus" }, {}],
          edges: [
            { hidden: true },
            { label: "appl", state: "focus" },
            { label: "e", state: "focus" },
          ],
        },
      ],
    };
    const [t1, t2] = playerFrames(spec);
    expect(t1?.scene?.edges.map((e) => `${e.from}->${e.to}`)).toEqual([
      "r->c",
      "r->m",
      "m->c",
    ]);
    expect(t2?.scene?.edges.map((e) => `${e.from}->${e.to}`)).toEqual([
      "r->m",
      "m->c",
    ]);
    expect(t2?.scene?.edges[0]).toMatchObject({
      label: "appl",
      state: "focus",
    });
    expect(t1?.scene?.nodes.map((n) => [n.x, n.y])).toEqual(
      t2?.scene?.nodes.map((n) => [n.x, n.y]),
    );
  });

  test("기준선 · 세로 띠 — 정점 뒤에 깔리고, 목록을 주면 비어 있어도 자리를 잡으며, 안 주면 그림이 그대로다", async () => {
    // 가장 가까운 두 점 편(KAN-058)의 평면 그림 — 분할선 x = 5 와 그 양옆 폭 2.83 의 띠.
    const plane = [
      { id: "a", x: 3, y: 7 },
      { id: "b", x: 5, y: 6 },
      { id: "c", x: 9, y: 1 },
    ];
    const bare = await renderToSvg(
      <NodeGraph title="평면" nodes={plane} edges={[]} directed={false} />,
      "t-guide-bare",
    );
    const guided = await renderToSvg(
      <NodeGraph
        title="평면"
        nodes={plane}
        edges={[]}
        directed={false}
        rules={[{ x: 5, label: "x = 5" }]}
        bands={[{ from: 2.17, to: 7.83, label: "띠" }]}
      />,
      "t-guide-bare",
    );
    expect(bare).not.toContain("data-viz-guides");
    expect(guided).toContain('data-viz-rule="5"');
    expect(guided).toContain('data-viz-band="2.17~7.83"');
    expect(guided).toContain("x = 5");
    // 띠와 기준선은 정점보다 먼저 그린다 — 정점이 그 위에 온다.
    expect(guided.indexOf("data-viz-guides")).toBeLessThan(
      guided.indexOf('data-viz-node="a"'),
    );
    // 기준선은 정점 b(x = 5)의 가운데를 지난다.
    const ruleX = Number(
      /data-viz-rule="5"><path d="M ([\d.]+) /.exec(guided)?.[1],
    );
    const b =
      /data-viz-node="b"[^>]*><rect x="([\d.]+)"[^>]*width="([\d.]+)"/.exec(
        guided,
      );
    expect(ruleX).toBeCloseTo(Number(b?.[1]) + Number(b?.[2]) / 2, 1);
    // 빈 목록도 머리말 자리를 잡는다 — 걸음 사이에 분할선이 생겨도 정점 자리가 안 바뀐다.
    const empty = nodeGraphSize({
      nodes: plane,
      edges: [],
      rules: [],
      bands: [],
    });
    const full = nodeGraphSize({
      nodes: plane,
      edges: [],
      rules: [{ x: 5, label: "x = 5" }],
      bands: [{ from: 2.17, to: 7.83 }],
    });
    expect(empty.height).toBe(full.height);
    // 그림 밖으로 나가는 띠 끝은 가장자리에서 자르고 대시를 긋지 않는다.
    const wide = await renderToSvg(
      <NodeGraph
        title="넓은 띠"
        nodes={plane}
        edges={[]}
        bands={[{ from: -20, to: 30 }]}
      />,
      "t-guide-wide",
    );
    expect(count(wide, /data-viz-band="-20~30"><rect [^>]*\/><path/g)).toBe(0);
  });

  test("기울어진 기준선 — 정점 뒤에 깔리고, 지나는 점을 실제로 지나며, 목록을 주면 비어 있어도 자리를 잡고, 안 주면 그림이 그대로다", async () => {
    // 회전하는 캘리퍼스 편(KAN-058)의 평면 그림 — 변 a→b 에 대는 지지선과 그 반대편 c 를 지나는 평행선.
    const plane = [
      { id: "a", x: 0, y: 7 },
      { id: "b", x: 6, y: 7 },
      { id: "c", x: 2, y: 0 },
    ];
    const bare = await renderToSvg(
      <NodeGraph title="평면" nodes={plane} edges={[]} directed={false} />,
      "t-line-bare",
    );
    const lined = await renderToSvg(
      <NodeGraph
        title="평면"
        nodes={plane}
        edges={[]}
        directed={false}
        lines={[
          { x: 0, y: 7, dx: 6, dy: 0, label: "변의 지지선" },
          { x: 2, y: 0, dx: 6, dy: 0 },
          { x: 0, y: 7, dx: 2, dy: -7 },
        ]}
      />,
      "t-line-bare",
    );
    expect(bare).not.toContain("data-viz-lines");
    expect(lined).toContain('data-viz-line="0,7,6,0"');
    expect(lined).toContain('data-viz-line="0,7,2,-7"');
    expect(lined).toContain("변의 지지선");
    // 선은 정점보다 먼저 그린다 — 정점이 그 위에 온다.
    expect(lined.indexOf("data-viz-lines")).toBeLessThan(
      lined.indexOf('data-viz-node="a"'),
    );
    // 가로선은 정점 c 의 가운데 높이를 지난다.
    const box =
      /data-viz-node="c"[^>]*><rect x="[\d.]+" y="([\d.]+)"[^>]*height="([\d.]+)"/.exec(
        lined,
      );
    const cy = Number(box?.[1]) + Number(box?.[2]) / 2;
    const lineY = Number(
      /data-viz-line="2,0,6,0"><path d="M [\d.]+ ([\d.]+) /.exec(lined)?.[1],
    );
    expect(lineY).toBeCloseTo(cy, 1);
    // 빈 목록도 둘레 여백을 잡는다 — 걸음 사이에 선이 생기거나 없어져도 정점 자리가 안 바뀐다.
    expect(
      nodeGraphSize({
        nodes: plane,
        edges: [],
        lines: [{ x: 0, y: 7, dx: 1, dy: 1 }],
      }),
    ).toEqual(nodeGraphSize({ nodes: plane, edges: [], lines: [] }));
    expect(
      nodeGraphSize({ nodes: plane, edges: [], lines: [] }).height,
    ).toBeGreaterThan(nodeGraphSize({ nodes: plane, edges: [] }).height);
    // 그림 안을 지나지 않는 선은 긋지 않는다.
    const outside = await renderToSvg(
      <NodeGraph
        title="밖"
        nodes={plane}
        edges={[]}
        lines={[{ x: 0, y: 60, dx: 1, dy: 0 }]}
      />,
      "t-line-out",
    );
    expect(outside).toContain("data-viz-lines");
    expect(outside).not.toContain("data-viz-line=");
  });

  test("정적 그림은 장면을 걸음마다 한 장씩 늘어놓고 칸 경계가 필름을 빈틈없이 나눈다", async () => {
    const scene = { nodes, edges };
    const svg = await renderToSvg(
      <NodeGraphFilm
        title="필름"
        frames={[
          { id: "T1", text: "하나", scene },
          { id: "T2", text: "둘", scene },
        ]}
      />,
      "t-graph-film",
    );
    const height = Number(/viewBox="0 0 \d+ (\d+)"/.exec(svg)?.[1]);
    const cells = [
      ...svg.matchAll(
        /data-viz-step="T\d+" data-viz-y="(\d+)" data-viz-h="(\d+)"/g,
      ),
    ].map((m) => ({ y: Number(m[1]), h: Number(m[2]) }));
    expect(cells.length).toBe(2);
    expect(cells[0]?.y).toBe(0);
    expect((cells[1]?.y ?? 0) + (cells[1]?.h ?? 0)).toBe(height);
    expect(count(svg, /data-viz-node="/g)).toBe(12);
  });
});

describe("P9 KeyValueTable · 해시 맵", () => {
  const count = (svg: string, re: RegExp) => svg.match(re)?.length ?? 0;
  // 누적합의 개수를 세는 맵 — 키 넷을 넣었고, 자리는 여섯을 미리 잡았다.
  const data = {
    keyLabel: "seen 키",
    valueLabel: "개수",
    entries: [
      [0, 1],
      [3, 1],
      [7, 1],
      [14, 2],
    ] as const,
    slots: 6,
    read: [7],
    write: [14],
    note: "찾는 키 7 · 개수 1",
  };

  test("키 줄과 값 줄이 같은 열에 서고, 찾은 키는 읽음 · 고친 키는 새로 씀 · 남은 자리는 아직이다", async () => {
    const { KeyValueTable } = await import("./patterns/KeyValueTable");
    const el = <KeyValueTable title="개수 맵" {...data} />;
    const svg = await renderToSvg(el, "t-kv");
    expect(svg).toBe(await renderToSvg(el, "t-kv"));
    expect(count(svg, /data-viz-label="seen 키"/g)).toBe(1);
    expect(count(svg, /data-viz-label="개수"/g)).toBe(1);
    // 두 줄 × 자리 여섯
    expect(count(svg, /data-viz-cell="/g)).toBe(12);
    // 키 7 과 그 값 칸이 읽음, 키 14 와 그 값 칸이 새로 씀
    expect(count(svg, /data-viz-state="read"/g)).toBe(2);
    expect(count(svg, /data-viz-state="focus"/g)).toBe(2);
    expect(count(svg, /data-viz-state="empty"/g)).toBe(4);
    expect(svg).toContain('data-viz-role="caret" data-viz-cells="2"');
    expect(svg).toContain("찾는 키 7 · 개수 1");
  });

  test("배열 무대의 map — 쌓은 줄 아래에 키 줄 · 값 줄 · ▲ 줄을 더하고 격자를 자리 수에 맞춘다", async () => {
    const { arrayColumns, arrayStage } = await import("./player/arrayStage");
    const step = {
      array: [3, 4, 7],
      range: [0, 2] as const,
      read: [2],
      map: { ...data, read: [], note: "찾는 키 -4 · 없음" },
    };
    const rows = arrayStage(step, { arrayName: "nums", rangeLabel: "앞부분" });
    const kinds = rows.map((r) => r.kind);
    expect(kinds.slice(-3)).toEqual(["cells", "cells", "caret"]);
    expect(arrayColumns(step)).toBe(6);
    const svg = await renderToSvg(
      <CellStage title="map" rows={rows} columns={arrayColumns(step)} />,
      "t-kv-stage",
    );
    expect(svg).toContain("찾는 키 -4 · 없음");
    // 없던 키는 칸이 없으니 맵 ▲ 줄은 비고, 배열 ▲ 줄만 칸 2 를 가리킨다.
    expect(count(svg, /data-viz-role="caret" data-viz-cells=""/g)).toBe(1);
  });

  test("더하는 줄(extra) — 값 줄 아래에 줄마다 제 읽음 · 새로 씀으로 서고, ▲ 는 읽은 키의 열 전부에 선다", async () => {
    const { keyValueRows } = await import("./patterns/KeyValueTable");
    // 칸 번호 k 하나에 sa[k] 와 lcp[k] 가 함께 딸린다 — sa[4] 를 읽고 lcp[3] 을 새로 썼다.
    const kv = {
      keyLabel: "k",
      valueLabel: "sa[k]",
      entries: [
        [0, 5],
        [1, 3],
        [2, 1],
        [3, 0],
        [4, 4],
        [5, 2],
      ] as const,
      read: [4],
      extra: [
        {
          label: "lcp[k]",
          values: [null, null, null, 0, null, null],
          write: [3],
          side: "적은 칸 1 개",
        },
      ],
    };
    const rows = keyValueRows(kv);
    expect(rows.map((r) => r.kind)).toEqual([
      "cells",
      "cells",
      "cells",
      "caret",
    ]);
    const svg = await renderToSvg(
      <CellStage title="sa 와 lcp" rows={rows} columns={6} />,
      "t-kv-extra",
    );
    expect(count(svg, /data-viz-label="lcp\[k\]"/g)).toBe(1);
    // 세 줄 × 자리 여섯
    expect(count(svg, /data-viz-cell="/g)).toBe(18);
    // 키 4 와 그 sa 칸이 읽음, lcp 줄의 키 3 칸만 새로 씀, 아직 안 쓴 lcp 칸 다섯은 아직
    expect(count(svg, /data-viz-state="read"/g)).toBe(2);
    expect(count(svg, /data-viz-state="focus"/g)).toBe(1);
    expect(count(svg, /data-viz-state="empty"/g)).toBe(5);
    expect(svg).toContain("적은 칸 1 개");
    // extra 가 없으면 줄이 셋 그대로다 — 이 필드를 안 쓰는 편의 그림은 바뀌지 않는다.
    const { extra: _drop, ...plain } = kv;
    expect(keyValueRows(plain).map((r) => r.kind)).toEqual([
      "cells",
      "cells",
      "caret",
    ]);
  });
});

describe("P10 CumulativeCurve · 누적 값 곡선", () => {
  const count = (svg: string, re: RegExp) => svg.match(re)?.length ?? 0;
  // 유량 값마다의 최소 총비용 — 라운드가 끝난 네 자리를 짚었다. 마지막 두 점 사이만 증분이 줄어든다.
  const points = [
    { x: 0, y: 0, mark: "시작" },
    { x: 1, y: 3 },
    { x: 2, y: 6, mark: "라운드 1" },
    { x: 3, y: 11 },
    { x: 4, y: 14, mark: "라운드 2" },
  ];

  test("선분마다 증분을 적고, 짚은 점은 네모 · 나머지는 동그라미, 증분이 줄어든 선분은 대시다", async () => {
    const { CumulativeCurve, increments } = await import(
      "./patterns/CumulativeCurve"
    );
    expect(increments(points)).toEqual([3, 3, 5, 3]);
    const el = (
      <CumulativeCurve
        title="누적 곡선"
        xLabel="유량 값"
        yLabel="최소 총비용"
        points={points}
      />
    );
    const svg = await renderToSvg(el, "t-curve");
    expect(svg).toBe(await renderToSvg(el, "t-curve"));
    expect(count(svg, /data-viz-segment="/g)).toBe(4);
    expect(count(svg, /data-viz-state="mark"/g)).toBe(3);
    expect(count(svg, /data-viz-state="pass"/g)).toBe(2);
    expect(count(svg, /data-viz-state="drop"/g)).toBe(1);
    expect(svg).toContain('data-viz-increment="5"');
    expect(svg).toContain("+5");
    expect(svg).toContain("라운드 2");
  });
});

describe("P11 LineEnvelope · 직선 무리와 아래 껍질", () => {
  const count = (svg: string, re: RegExp) => svg.match(re)?.length ?? 0;
  // 볼록 껍질 트릭 편의 작은 입력 — 다섯 직선 가운데 (-1, 5) 만 어디서도 가장 낮지 않다.
  const lines = [
    { m: -2, b: 0, label: "(-2, 0)" },
    { m: -1, b: 5, label: "(-1, 5) 버림", state: "out" as const, labelX: 2 },
    { m: 0, b: -1, label: "(0, -1)" },
    { m: 1, b: 2, label: "(1, 2)", state: "read" as const },
    { m: 2, b: 8, label: "(2, 8)", state: "focus" as const },
  ];
  const envelope = [
    { x: -8, y: -8 },
    { x: -6, y: -4 },
    { x: -3, y: -1 },
    { x: 0.5, y: -1 },
    { x: 6, y: -12 },
  ];

  test("직선마다 상태를 싣고, 아래 껍질 · 경계 세로선 · 구간 괄호 · 짚은 점을 그리며 결정론이다", async () => {
    const { LineEnvelope } = await import("./patterns/LineEnvelope");
    const el = (
      <LineEnvelope
        title="직선 다섯과 아래 껍질"
        xRange={[-8, 6]}
        yRange={[-12, 14]}
        lines={lines}
        envelope={envelope}
        marks={[
          { x: 0.5, label: "X_0 = 0.5" },
          { x: -3, label: "X_1 = -3" },
        ]}
        spans={[{ from: -8, to: -6, label: "hull[3]" }]}
        points={[{ x: -4, y: -2, label: "x = -4 → -2" }]}
      />
    );
    const svg = await renderToSvg(el, "t-envelope");
    expect(svg).toBe(await renderToSvg(el, "t-envelope"));
    expect(count(svg, /data-viz-line="/g)).toBe(5);
    expect(count(svg, /data-viz-state="out"/g)).toBe(1);
    expect(count(svg, /data-viz-state="read"/g)).toBe(1);
    expect(count(svg, /data-viz-state="focus"/g)).toBe(1);
    expect(count(svg, /data-viz-state="done"/g)).toBe(2);
    expect(svg).toContain('data-viz-envelope="5"');
    expect(count(svg, /data-viz-mark="/g)).toBe(2);
    expect(svg).toContain('data-viz-span="hull[3]"');
    expect(svg).toContain('data-viz-point="-4"');
    expect(svg).toContain("(-1, 5) 버림");
  });

  test("그림 칸을 안 지나는 직선은 긋지 않는다", async () => {
    const { LineEnvelope } = await import("./patterns/LineEnvelope");
    const svg = await renderToSvg(
      <LineEnvelope
        title="칸 밖 직선"
        xRange={[0, 4]}
        yRange={[0, 4]}
        lines={[
          { m: 0, b: 2, label: "안" },
          { m: 0, b: 100, label: "밖" },
        ]}
      />,
      "t-envelope-clip",
    );
    expect(count(svg, /data-viz-line="/g)).toBe(1);
    expect(svg).not.toContain(">밖<");
  });
});

describe("패턴 등록 가드", () => {
  // SPEC §12 「패턴을 더하는 법」 — 새 패턴은 한 벌로 선다. 유저 지시(2026-09-28): 맞는 시각화가 없으면
  // 표로 대신하지 말고 패턴부터 만들어 적용한다. 만들다 만 패턴이 조용히 남지 않게 여기서 잡는다.
  test("패턴 파일마다 메타 · 스타일 가이드 · 공개 표면 · 시험 · SPEC 표가 갖춰져 있다", async () => {
    const { readdir } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { ALGO_VIZ_META } = await import("./patterns/meta");
    const { algoVizStyleGuide } = await import("../../design/viz/algo.viz");
    const dir = join(import.meta.dir, "patterns");
    const names = (await readdir(dir))
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => f.slice(0, -4));
    const index = await Bun.file(join(import.meta.dir, "index.ts")).text();
    const tests = await Bun.file(import.meta.path).text();
    const spec = await Bun.file(
      join(import.meta.dir, "../../sandbox/algo-guide-v2/SPEC.md"),
    ).text();
    const section = spec.slice(spec.indexOf("### 시각화 고르기"));
    const missing: string[] = [];
    for (const name of names) {
      if (!ALGO_VIZ_META.some((m) => m.exportName === name))
        missing.push(`${name}: meta.ts`);
      if (!(name in (algoVizStyleGuide.patterns ?? {})))
        missing.push(`${name}: algo.viz.tsx patterns`);
      if (!index.includes(`  ${name},`)) missing.push(`${name}: index.ts`);
      if (!new RegExp(`describe\\("P\\d+ [^"]*${name}`).test(tests))
        missing.push(`${name}: patterns.test.tsx`);
      if (!section.includes(`\`${name}\``)) missing.push(`${name}: SPEC §12`);
    }
    expect(missing).toEqual([]);
  });

  // 가이드 그림이 시각화 패키지를 직접 부르면 위 가드를 비껴간다 — 패턴 없이 그린 그림이 조용히 남는다
  // (2026-09-30 minCostMaxFlow 가 LineChart 를 직접 불렀다가 CumulativeCurve 로 옮겼다).
  test("가이드 그림 사이드카는 시각화 패키지를 직접 import 하지 않는다", async () => {
    const { join } = await import("node:path");
    const root = join(import.meta.dir, "../..");
    const glob = new Bun.Glob("src/{algorithms,data-structures}/**/*.fig.tsx");
    const direct: string[] = [];
    for await (const f of glob.scan({ cwd: root })) {
      const text = await Bun.file(join(root, f)).text();
      if (/from\s+["']@centurio1987\/bbangto-ui-visualization["']/.test(text))
        direct.push(f);
    }
    expect(direct).toEqual([]);
  });
});
