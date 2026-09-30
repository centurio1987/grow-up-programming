/**
 * L9 — 가이드가 싣는 코드가 **기존 테스트의 입출력 케이스**를 통과하는가.
 *
 * 원본 `src/algorithms/sorting/externalMergeSort/externalMergeSort.test.ts` 는 학습자 스텁을
 * 가져오므로 그대로 재사용할 수 없다. **케이스만** 옮겨 정본에 다시 건다.
 *
 * 벽시계를 재는 케이스(`N=10,000` 을 1,000ms 안에)는 그대로 옮기지 않았다 — 실행마다 값이
 * 달라 판정이 안 되고, 난수 입력이라 실패해도 재현이 안 된다. 그 케이스가 지키던 것은
 * **규모가 커져도 절차가 끝나고 답이 정렬돼 있다**는 것이라 결정론적 입력으로 다시 걸었다.
 * 같은 규모의 비용은 「최악을 만드는 입력」이 입출력 개수로 진다.
 *
 * **원본에 없던 케이스 넷을 더 걸었다.** ① 메모리 M 을 1 부터 입력 길이 + 1 까지 전부
 * 바꿔도 답이 같은가 ② 메모리에 한 번에 든 정수가 계약이 정한 상한 안인가 ③ 읽고 적은
 * 정수 개수가 닫힌 형태와 같은가 ④ 임시 런 파일이 끝나고 남지 않는가.
 */
import { afterAll, beforeAll, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { 메모리와_입출력 } from "./externalMergeSort-guide.alt.ts";
import { externalMergeSort } from "./externalMergeSort-guide.ref.ts";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "external-merge-sort-guide-"));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

async function 입력(name: string, data: number[]): Promise<string> {
  const path = join(dir, name);
  await Bun.write(path, `${data.join("\n")}\n`);
  return path;
}

async function 출력(path: string): Promise<number[]> {
  const text = await Bun.file(path).text();
  return text
    .split("\n")
    .filter((s) => s.length > 0)
    .map((s) => Number(s));
}

/* ─────────────── 원본 테스트의 입출력 케이스 ─────────────── */

const 기본: [string, number[], number][] = [
  ["메모리 제한보다 큰 입력을 정렬한다", [5, 3, 8, 1, 9, 2, 7, 4, 6], 3],
  ["이미 정렬된 입력도 정확히 처리한다", [1, 2, 3, 4, 5, 6], 2],
  ["중복이 많은 입력", [3, 1, 3, 1, 3, 1], 2],
  ["음수가 섞인 입력", [-3, 1, -1, 2, 0, -2], 2],
  ["입력 길이 = 1", [42], 1],
  ["메모리 제한이 입력 전체를 담는다 — 런 하나", [4, 2, 5, 1, 3], 100],
  ["메모리 제한 = 1 — 원소마다 런 하나", [3, 1, 4, 1, 5, 9, 2, 6], 1],
  ["전개가 쓰는 입력", [5, 1, 8, 3, 7, 2, 9, 4], 3],
];

for (const [name, data, M] of 기본) {
  test(`기본 — ${name}`, async () => {
    const input = await 입력(`${name.replace(/\W+/g, "_")}.txt`, data);
    const output = `${input}.out`;
    const 반환 = await externalMergeSort(input, output, M);
    expect(반환).toBe(output);
    expect(await 출력(output)).toEqual([...data].sort((a, b) => a - b));
  });
}

test("성능 케이스가 지키던 것 — 규모가 커져도 끝나고 답이 정렬돼 있다", async () => {
  const N = 10_000;
  const data: number[] = new Array(N);
  // 난수를 쓰지 않는다. 곱셈 해시로 만든 결정론적 순열이라 실패하면 그대로 재현된다.
  for (let i = 0; i < N; i++) data[i] = ((i * 48_271) % 1_000_003) - 500_000;

  const input = await 입력("perf.txt", data);
  const output = join(dir, "perf.out");
  await externalMergeSort(input, output, 1_000);

  const sorted = await 출력(output);
  expect(sorted.length).toBe(N);
  expect(sorted).toEqual([...data].sort((a, b) => a - b));
});

/* ─────────────── 더 건 케이스 넷 ─────────────── */

test("① 메모리 M 을 1 부터 N+1 까지 전부 바꿔도 답이 같다", async () => {
  const data = [5, 1, 8, 3, 7, 2, 9, 4, 6, -1, 0, 10, 10, -10];
  const 정답 = [...data].sort((a, b) => a - b);
  for (let M = 1; M <= data.length + 1; M++) {
    const input = await 입력(`sweep${M}.txt`, data);
    const output = `${input}.out`;
    await externalMergeSort(input, output, M);
    expect(await 출력(output)).toEqual(정답);
  }
});

test("② 메모리에 한 번에 든 정수가 max(M, R) 을 넘지 않는다", async () => {
  for (const [N, M] of [
    [9, 3],
    [100, 7],
    [1_000, 32],
    [1_000, 1],
  ] as [number, number][]) {
    const 잰것 = 메모리와_입출력(N, M);
    const R = Math.ceil(N / M);
    expect(잰것.최대_정수_칸).toBe(Math.max(M, R));
  }
});

test("③ 읽고 적은 정수 개수가 4N 이다", async () => {
  for (const [N, M] of [
    [9, 3],
    [100, 7],
    [1_000, 32],
    [1_000, 1],
  ] as [number, number][]) {
    expect(메모리와_입출력(N, M).입출력).toBe(4 * N);
  }
});

test("④ 임시 런 파일이 끝나고 남지 않는다", async () => {
  const data = [5, 1, 8, 3, 7, 2, 9, 4, 6];
  const input = await 입력("cleanup.txt", data);
  const output = join(dir, "cleanup.out");
  await externalMergeSort(input, output, 3);
  for (let i = 0; i < 3; i++) {
    expect(existsSync(`${output}.run${i}`)).toBe(false);
  }
});

/**
 * 걸음 재생 패널(`.sim.ts`)의 값이 정본 실행과 같은가(SPEC `L48`). `.sim.ts` 의 `steps` 는 P3 이
 * 정적으로 세도록 인라인 리터럴이다. 그 리터럴이 그림 사이드카의 `simStepsFromRef()` — 정본 소스에 기록
 * 줄만 끼운 사본을 파일 위에서 실행해 걸음을 만드는 함수 — 와 같아야 한다. 다르면 리터럴을 다시 뽑는다.
 */
test("걸음 재생 패널의 걸음이 정본 실행에서 만든 걸음과 같다", async () => {
  const sim = await import("./externalMergeSort-guide.sim.ts");
  const { simStepsFromRef } = await import("./externalMergeSort-guide.fig.tsx");
  const want = simStepsFromRef();
  const plain = (v: unknown) => JSON.parse(JSON.stringify(v));
  expect(plain(sim.runWalk.steps)).toEqual(plain(want.runWalk));
  expect(plain(sim.mergeWalk.steps)).toEqual(plain(want.mergeWalk));
  // 패널이 내미는 반환값이 정본의 답과 같은지 — 정본에 직접 다시 묻는다.
  const input = await 입력("sim.txt", [5, 1, 8, 3, 7, 2, 9, 4]);
  const output = `${input}.out`;
  await externalMergeSort(input, output, 3);
  expect(sim.mergeWalk.result).toBe((await 출력(output)).join(" "));
});
