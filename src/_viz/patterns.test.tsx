import { describe, expect, test } from "bun:test";
import {
  ArrayStrip,
  LevelTable,
  overlapCells,
  RangeCover,
  renderToSvg,
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
