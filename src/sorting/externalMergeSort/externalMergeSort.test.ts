import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { externalMergeSort } from "./externalMergeSort";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";

let tmpDir: string;

beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "external-merge-sort-"));
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

async function writeInput(name: string, data: number[]): Promise<string> {
  const path = join(tmpDir, name);
  await Bun.write(path, data.join("\n") + "\n");
  return path;
}

async function readOutput(path: string): Promise<number[]> {
  const text = await Bun.file(path).text();
  return text
    .split("\n")
    .filter((s) => s.length > 0)
    .map((s) => Number(s));
}

describe("externalMergeSort", () => {
  // 기본 동작
  test("메모리 제한보다 큰 입력을 정렬한다", async () => {
    const input = await writeInput("basic.txt", [5, 3, 8, 1, 9, 2, 7, 4, 6]);
    const output = join(tmpDir, "basic.out");
    const result = await externalMergeSort(input, output, 3);
    expect(result).toBe(output);
    expect(await readOutput(output)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test("이미 정렬된 입력도 정확히 처리한다", async () => {
    const input = await writeInput("sorted.txt", [1, 2, 3, 4, 5, 6]);
    const output = join(tmpDir, "sorted.out");
    await externalMergeSort(input, output, 2);
    expect(await readOutput(output)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  // 엣지 케이스
  test("중복이 많은 입력", async () => {
    const input = await writeInput("dup.txt", [3, 1, 3, 1, 3, 1]);
    const output = join(tmpDir, "dup.out");
    await externalMergeSort(input, output, 2);
    expect(await readOutput(output)).toEqual([1, 1, 1, 3, 3, 3]);
  });

  test("음수가 섞인 입력", async () => {
    const input = await writeInput("neg.txt", [-3, 1, -1, 2, 0, -2]);
    const output = join(tmpDir, "neg.out");
    await externalMergeSort(input, output, 2);
    expect(await readOutput(output)).toEqual([-3, -2, -1, 0, 1, 2]);
  });

  // 바운더리 테스트
  test("입력 길이 = 1", async () => {
    const input = await writeInput("one.txt", [42]);
    const output = join(tmpDir, "one.out");
    await externalMergeSort(input, output, 1);
    expect(await readOutput(output)).toEqual([42]);
  });

  test("메모리 제한이 입력 전체를 담을 수 있는 경우 (run 1개)", async () => {
    const input = await writeInput("small.txt", [4, 2, 5, 1, 3]);
    const output = join(tmpDir, "small.out");
    await externalMergeSort(input, output, 100);
    expect(await readOutput(output)).toEqual([1, 2, 3, 4, 5]);
  });

  test("메모리 제한 = 1 (모든 원소가 자기 자신만의 run)", async () => {
    const input = await writeInput("m1.txt", [3, 1, 4, 1, 5, 9, 2, 6]);
    const output = join(tmpDir, "m1.out");
    await externalMergeSort(input, output, 1);
    expect(await readOutput(output)).toEqual([1, 1, 2, 3, 4, 5, 6, 9]);
  });

  // 성능 테스트 — 외부 정렬은 I/O 비용이 크므로 N=10^4 / 1초로 완화
  test("N=10,000 입력을 1000ms 이내에 처리한다", async () => {
    const N = 10_000;
    const data: number[] = new Array(N);
    for (let i = 0; i < N; i++) data[i] = Math.floor(Math.random() * 1_000_000);

    const input = await writeInput("perf.txt", data);
    const output = join(tmpDir, "perf.out");

    const start = performance.now();
    await externalMergeSort(input, output, 1000);
    const elapsed = performance.now() - start;

    const sorted = await readOutput(output);
    expect(sorted.length).toBe(N);
    for (let i = 1; i < N; i++) expect(sorted[i]!).toBeGreaterThanOrEqual(sorted[i - 1]!);
    expect(elapsed).toBeLessThan(1000);
  });
});
