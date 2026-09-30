import { describe, expect, test } from "bun:test";
import type { StageRow } from "../patterns/CellStage";
import { type ArrayStep, arrayColumns, arrayStage } from "./arrayStage";

const opts = { arrayName: "A", rangeLabel: "후보" };
const cellsOf = (rows: StageRow[], label: string) => {
  const r = rows.find((x) => x.kind === "cells" && x.label === label);
  if (r?.kind !== "cells") throw new Error(`칸 줄 ${label} 이 없다`);
  return r;
};

describe("배열 무대 · arrayStage", () => {
  test("값이 없는 칸(null)은 구간 밖이어도 이번 걸음 밖이 아니다 — 아직(점선)은 CellStage 가 채운다", () => {
    const step: ArrayStep = { array: [1, 2, null, null], range: [0, 0] };
    const { states } = cellsOf(arrayStage(step, opts), "A");
    expect(states).toEqual({ 1: "out" });
    // 구간이 비어도 같다 — 값 있는 칸만 대시다.
    const empty = cellsOf(arrayStage({ ...step, range: null }, opts), "A");
    expect(empty.states).toEqual({ 0: "out", 1: "out" });
    // 명시한 out 은 null 칸에도 그대로 선다.
    const forced = cellsOf(arrayStage({ ...step, out: [3] }, opts), "A");
    expect(forced.states).toEqual({ 1: "out", 3: "out" });
  });

  test("indexLabel — 인덱스 줄 머리를 바꾸고, 주지 않으면 「인덱스」다", () => {
    const step: ArrayStep = { array: [1, 2], range: [0, 1] };
    const head = (o: typeof opts & { indexLabel?: string }) =>
      arrayStage(step, o).find((r) => r.kind === "index")?.label;
    expect(head(opts)).toBe("인덱스");
    expect(head({ ...opts, indexLabel: "d" })).toBe("d");
  });

  test("later — 값이 있어도 아직 읽지 않은 칸은 아직(empty)이고, 구간 밖 대시보다 앞서며 out · 읽음이 그보다 앞선다", () => {
    const step: ArrayStep = {
      array: [5, 6, 7, 8],
      range: [0, 1],
      later: [1, 2, 3],
      out: [3],
      read: [1],
    };
    const { states } = cellsOf(arrayStage(step, opts), "A");
    expect(states).toEqual({ 1: "read", 2: "empty", 3: "out" });
  });

  test("layers 의 out — 줄의 칸을 이번 걸음 밖으로 그리고 읽음 · 새로 씀이 그보다 앞선다", () => {
    const step: ArrayStep = {
      array: [1],
      range: [0, 0],
      layers: [{ name: "후보", values: [2, 3, 4], out: [0, 1], read: [1] }],
    };
    const { states } = cellsOf(arrayStage(step, opts), "후보");
    expect(states).toEqual({ 0: "out", 1: "read" });
  });

  test("layers 의 range — 그 줄의 칸 · ▲ 줄 바로 아래에 괄호 하나를 달고, 없으면 줄 구성이 그대로다", () => {
    const layer = { name: "tails", values: [1, 3, null, null] };
    const base: ArrayStep = { array: [1, 3], range: [0, 1], layers: [layer] };
    const kinds = (s: ArrayStep) => arrayStage(s, opts).map((r) => r.kind);
    expect(kinds(base)).toEqual([
      "index",
      "cells",
      "caret",
      "bracket",
      "cells",
      "caret",
    ]);
    const withRange: ArrayStep = {
      ...base,
      layers: [{ ...layer, range: { label: "찾는 범위", from: 0, to: 1 } }],
    };
    const rows = arrayStage(withRange, opts);
    expect(rows.map((r) => r.kind)).toEqual([...kinds(base), "bracket"]);
    expect(rows.at(-1)).toEqual({
      kind: "bracket",
      label: "찾는 범위",
      from: 0,
      to: 1,
      tone: "query",
      text: "[0,1]",
    });
  });

  test("strips — 인덱스와 짝짓지 않는 띠가 왼쪽 끝부터 서고, 남는 자리는 null · 격자는 slots 까지 넓힌다", () => {
    const step: ArrayStep = {
      array: [2, 1, 5],
      range: [0, 2],
      strips: [
        { label: "스택", values: [5, 1], slots: 5, read: [1], write: [0] },
      ],
    };
    const strip = cellsOf(arrayStage(step, opts), "스택");
    expect(strip.values).toEqual([5, 1, null, null, null]);
    expect(strip.states).toEqual({ 0: "focus", 1: "read" });
    expect(strip.side).toBe("크기 2");
    expect(arrayColumns(step)).toBe(5);
    // ▲ 줄을 두지 않는다 — 띠는 맨 끝 칸 줄 하나다.
    expect(arrayStage(step, opts).at(-1)?.kind).toBe("cells");
  });
});
