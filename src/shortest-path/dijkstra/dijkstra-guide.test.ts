/**
 * 정합성 밸리데이터 — 해설서 MDX의 시뮬레이션 마지막 프레임이
 * 원본 dijkstra() 의 실제 실행 결과와 일치하는지 검증한다.
 * (steps가 머릿속 추정이 아니라 실제 알고리즘 전개를 반영하는지 보장)
 */
import { test, expect } from "bun:test";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { dijkstra } from "./dijkstra";

// MDX 시뮬레이션이 사용하는 고정 입력 (문서 본문에 명시된 것과 동일해야 함)
const N = 4;
const EDGES: [number, number, number][] = [
  [0, 1, 4],
  [0, 2, 1],
  [2, 1, 2],
  [1, 3, 1],
  [2, 3, 5],
];
const SRC = 0;

test("마지막 프레임의 거리 라벨이 dijkstra() 실제 결과와 일치", async () => {
  const src = await Bun.file(
    new URL("./dijkstra-guide.mdx", import.meta.url),
  ).text();

  const mod = (await evaluate(src, {
    ...runtime,
    baseUrl: import.meta.url,
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  })) as unknown as { steps: Array<{ nodeValue?: Record<string, number | string> }> };

  const steps = mod.steps;
  expect(Array.isArray(steps)).toBe(true);
  expect(steps.length).toBeGreaterThan(0);

  const expected = dijkstra(N, EDGES, SRC); // [0, 3, 1, 4]
  const lastValue = steps[steps.length - 1]!.nodeValue ?? {};

  for (let v = 0; v < N; v++) {
    expect(lastValue[v]).toBe(expected[v]!);
  }
});
