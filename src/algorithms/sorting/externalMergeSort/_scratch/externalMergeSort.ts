// E3 자기검증용 스크래치. 가이드 본문 코드를 그대로 옮겨 실제 실행으로 검증한다.
import { unlink } from "node:fs/promises";

// ── 공통: 스트리밍 줄 읽기 (한 run 파일을 통째로 메모리에 올리지 않는다) ──
class LineReader {
  private stream: ReadableStreamDefaultReader<Uint8Array>;
  private decoder = new TextDecoder();
  private buffer = "";
  private streamDone = false;

  constructor(path: string) {
    this.stream = Bun.file(path).stream().getReader();
  }

  private async fill(): Promise<void> {
    if (this.streamDone) return;
    const { value, done } = await this.stream.read();
    if (done) {
      this.streamDone = true;
      return;
    }
    this.buffer += this.decoder.decode(value, { stream: true });
  }

  async readLine(): Promise<string | null> {
    for (;;) {
      const idx = this.buffer.indexOf("\n");
      if (idx >= 0) {
        const line = this.buffer.slice(0, idx);
        this.buffer = this.buffer.slice(idx + 1);
        return line;
      }
      if (this.streamDone) {
        if (this.buffer.length > 0) {
          const line = this.buffer;
          this.buffer = "";
          return line;
        }
        return null;
      }
      await this.fill();
    }
  }
}

async function writeIntLines(path: string, nums: number[]): Promise<void> {
  const body = nums.length > 0 ? nums.map(String).join("\n") + "\n" : "";
  await Bun.write(path, body);
}

// ── Phase 1: run 생성 (두 버전 공통) ──
async function generateRuns(
  inputPath: string,
  M: number,
  tmpPrefix: string,
): Promise<string[]> {
  const reader = new LineReader(inputPath);
  const runPaths: string[] = [];
  let chunk: number[] = [];
  let runIndex = 0;

  for (;;) {
    const line = await reader.readLine();
    if (line === null) break;
    chunk.push(parseInt(line, 10));
    if (chunk.length === M) {
      chunk.sort((a, b) => a - b);
      const p = `${tmpPrefix}_${runIndex++}.txt`;
      await writeIntLines(p, chunk);
      runPaths.push(p);
      chunk = [];
    }
  }
  if (chunk.length > 0) {
    chunk.sort((a, b) => a - b);
    const p = `${tmpPrefix}_${runIndex++}.txt`;
    await writeIntLines(p, chunk);
    runPaths.push(p);
  }
  return runPaths;
}

// ── 원형: 전부 메모리에 올려 정렬 (아이디어 검증용, N<=M 소규모에서만 동작) ──
async function externalMergeSortInMemoryNaive(
  inputPath: string,
  outputPath: string,
): Promise<string> {
  const reader = new LineReader(inputPath);
  const nums: number[] = [];
  for (;;) {
    const line = await reader.readLine();
    if (line === null) break;
    nums.push(parseInt(line, 10));
  }
  nums.sort((a, b) => a - b);
  await writeIntLines(outputPath, nums);
  return outputPath;
}

// ── 기본 구현: run 생성 + 선형 탐색으로 최솟값 찾기 (O(N·R)) ──
async function externalMergeSortLinearScan(
  inputPath: string,
  outputPath: string,
  memoryLimit: number,
): Promise<string> {
  const tmpPrefix = `${outputPath}.linscan.run`;
  const runPaths = await generateRuns(inputPath, memoryLimit, tmpPrefix);

  if (runPaths.length === 0) {
    await Bun.write(outputPath, "");
    return outputPath;
  }

  const readers = runPaths.map((p) => new LineReader(p));
  const heads: (number | null)[] = new Array(readers.length).fill(null);
  for (let i = 0; i < readers.length; i++) {
    const line = await readers[i]!.readLine();
    heads[i] = line === null ? null : parseInt(line, 10);
  }

  const outLines: string[] = [];
  for (;;) {
    let minIdx = -1;
    for (let i = 0; i < heads.length; i++) {
      const v = heads[i];
      if (v === null) continue;
      if (minIdx === -1 || v < (heads[minIdx] as number)) minIdx = i;
    }
    if (minIdx === -1) break; // 모든 run 소진
    outLines.push(String(heads[minIdx]));
    const nextLine = await readers[minIdx]!.readLine();
    heads[minIdx] = nextLine === null ? null : parseInt(nextLine, 10);
  }

  await Bun.write(outputPath, outLines.length > 0 ? outLines.join("\n") + "\n" : "");
  for (const p of runPaths) await unlink(p);
  return outputPath;
}

// ── 최적화: min-heap으로 최솟값 찾기 (O(N log R)) ──
type HeapEntry = { value: number; runIndex: number };

class MinHeap {
  private items: HeapEntry[] = [];

  get size(): number {
    return this.items.length;
  }

  private less(a: HeapEntry, b: HeapEntry): boolean {
    if (a.value !== b.value) return a.value < b.value;
    return a.runIndex < b.runIndex; // 값이 같을 때 결정론적 tie-break
  }

  push(e: HeapEntry): void {
    const items = this.items;
    items.push(e);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.less(items[i]!, items[parent]!)) {
        [items[i], items[parent]] = [items[parent]!, items[i]!];
        i = parent;
      } else break;
    }
  }

  pop(): HeapEntry | undefined {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0]!;
    const last = items.pop()!;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = 2 * i + 2;
        let smallest = i;
        if (l < items.length && this.less(items[l]!, items[smallest]!)) smallest = l;
        if (r < items.length && this.less(items[r]!, items[smallest]!)) smallest = r;
        if (smallest === i) break;
        [items[i], items[smallest]] = [items[smallest]!, items[i]!];
        i = smallest;
      }
    }
    return top;
  }
}

export async function externalMergeSort(
  inputPath: string,
  outputPath: string,
  memoryLimit: number,
): Promise<string> {
  const tmpPrefix = `${outputPath}.run`;
  const runPaths = await generateRuns(inputPath, memoryLimit, tmpPrefix);

  if (runPaths.length === 0) {
    await Bun.write(outputPath, "");
    return outputPath;
  }

  const readers = runPaths.map((p) => new LineReader(p));
  const heap = new MinHeap();
  for (let i = 0; i < readers.length; i++) {
    const line = await readers[i]!.readLine();
    if (line !== null) heap.push({ value: parseInt(line, 10), runIndex: i });
  }

  const outLines: string[] = [];
  while (heap.size > 0) {
    const { value, runIndex } = heap.pop()!;
    outLines.push(String(value));
    const nextLine = await readers[runIndex]!.readLine();
    if (nextLine !== null) {
      heap.push({ value: parseInt(nextLine, 10), runIndex });
    }
  }

  await Bun.write(outputPath, outLines.length > 0 ? outLines.join("\n") + "\n" : "");
  for (const p of runPaths) await unlink(p);
  return outputPath;
}

// ────────────────────────── 검증 ──────────────────────────
const dir = "/private/tmp/claude-501/-Users-centurio-code-test/993a0022-7635-4457-8b8a-3525713a1aa6/scratchpad/ems";
await Bun.write(`${dir}/.keep`, "");

async function readOut(path: string): Promise<number[]> {
  const text = await Bun.file(path).text();
  return text.length === 0 ? [] : text.trim().split("\n").map((l) => parseInt(l, 10));
}

function assertEq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${name}: got ${a}, expected ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${name}: ${a}`);
  }
}

// 1) 시뮬레이션 대표 예시: N=9, M=3, data = 5 1 8 3 7 2 9 4 6
{
  const input = `${dir}/sim_input.txt`;
  const output = `${dir}/sim_output.txt`;
  await Bun.write(input, [5, 1, 8, 3, 7, 2, 9, 4, 6].join("\n") + "\n");
  const ret = await externalMergeSort(input, output, 3);
  assertEq("sim: 반환값", ret, output);
  assertEq("sim: 결과", await readOut(output), [1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // linear-scan 버전도 같은 입력에 대해 동일 결과인지 (기본 구현 vs 최적화 교차검증)
  const output2 = `${dir}/sim_output_linscan.txt`;
  await externalMergeSortLinearScan(input, output2, 3);
  assertEq("sim: linear-scan == heap", await readOut(output2), await readOut(output));

  // naive 원형도 소규모에서 동일 결과인지
  const output3 = `${dir}/sim_output_naive.txt`;
  await externalMergeSortInMemoryNaive(input, output3);
  assertEq("sim: naive == heap", await readOut(output3), await readOut(output));
}

// 2) N = 0 (빈 파일)
{
  const input = `${dir}/empty_input.txt`;
  const output = `${dir}/empty_output.txt`;
  await Bun.write(input, "");
  const ret = await externalMergeSort(input, output, 3);
  assertEq("N=0: 반환값", ret, output);
  assertEq("N=0: 결과", await readOut(output), []);
}

// 3) N <= M (단일 run)
{
  const input = `${dir}/small_input.txt`;
  const output = `${dir}/small_output.txt`;
  await Bun.write(input, [3, 1, 2].join("\n") + "\n");
  await externalMergeSort(input, output, 100);
  assertEq("N<=M: 결과", await readOut(output), [1, 2, 3]);
}

// 4) M = 1 (run이 N개)
{
  const input = `${dir}/m1_input.txt`;
  const output = `${dir}/m1_output.txt`;
  await Bun.write(input, [4, 2, 5, 1, 3].join("\n") + "\n");
  await externalMergeSort(input, output, 1);
  assertEq("M=1: 결과", await readOut(output), [1, 2, 3, 4, 5]);
}

// 5) 중복값
{
  const input = `${dir}/dup_input.txt`;
  const output = `${dir}/dup_output.txt`;
  await Bun.write(input, [2, 2, 1, 1, 2, 3, 1].join("\n") + "\n");
  await externalMergeSort(input, output, 2);
  assertEq("중복: 결과", await readOut(output), [1, 1, 1, 2, 2, 2, 3]);
}

// 6) 음수 포함
{
  const input = `${dir}/neg_input.txt`;
  const output = `${dir}/neg_output.txt`;
  await Bun.write(input, [-3, 1, -1, 2, 0, -2].join("\n") + "\n");
  await externalMergeSort(input, output, 2);
  assertEq("음수: 결과", await readOut(output), [-3, -2, -1, 0, 1, 2]);
}

// 7) N=1 경계
{
  const input = `${dir}/one_input.txt`;
  const output = `${dir}/one_output.txt`;
  await Bun.write(input, "42\n");
  await externalMergeSort(input, output, 1);
  assertEq("N=1: 결과", await readOut(output), [42]);
}

// 8) 랜덤 교차검증 (heap 버전 vs linear-scan 버전 vs Array.sort)
{
  for (let t = 0; t < 20; t++) {
    const N = 1 + Math.floor(Math.random() * 200);
    const M = 1 + Math.floor(Math.random() * 20);
    const nums = Array.from({ length: N }, () => Math.floor(Math.random() * 2000) - 1000);
    const input = `${dir}/rand_input_${t}.txt`;
    const outputHeap = `${dir}/rand_output_heap_${t}.txt`;
    const outputLin = `${dir}/rand_output_lin_${t}.txt`;
    await Bun.write(input, nums.join("\n") + "\n");
    await externalMergeSort(input, outputHeap, M);
    await externalMergeSortLinearScan(input, outputLin, M);
    const expected = [...nums].sort((a, b) => a - b);
    const gotHeap = await readOut(outputHeap);
    const gotLin = await readOut(outputLin);
    assertEq(`랜덤#${t} (N=${N},M=${M}) heap`, gotHeap, expected);
    assertEq(`랜덤#${t} (N=${N},M=${M}) linscan==heap`, gotLin, gotHeap);
  }
}

console.log("모든 검증 완료");
