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
});
