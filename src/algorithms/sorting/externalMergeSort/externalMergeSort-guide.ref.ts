/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/sorting/externalMergeSort/externalMergeSort.ts` 는 학습자 스텁이라
 * 본문에 실을 수 없다. 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다.
 *
 * **이 절차의 비용 축은 견주기가 아니라 입출력이다.** 파일을 한 번에 `memoryLimit` 개씩만
 * 메모리에 올려 정렬하고 조각 파일로 적은 다음, 조각마다 값 하나씩만 힙에 올려 합친다.
 * 입력 전체를 배열에 담는 자리가 한 곳도 없다 — 읽기는 `LineReader`, 쓰기는 `FileSink` 가
 * 각각 스트림으로 하고, 메모리에 드는 정수는 조각 하나(`memoryLimit` 개)와 힙(조각 수만큼)
 * 뿐이다. 그 개수를 실제로 세는 사본은 `-guide.proof.ts` 에 있다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 다섯
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 조각을 정렬하는 견주개를 빼면 문자열 순서가 된다. 한 자리 수만 든 입력에서는 답이 같다.
 * - 자투리 조각을 적는 조건을 지우면 마지막 조각이 없어진다. 개수가 배수면 답이 같다.
 * - 조각의 첫 값 하나 대신 조각 전체를 힙에 올리면 답은 같고 메모리가 입력 전체가 된다.
 * - 출력 파일을 미리 비우는 줄을 지우면 앞서 있던 내용의 꼬리가 남는다. 새 파일이면 답이 같다.
 * - 꺼낸 자리를 다시 채우는 줄을 지우면 조각마다 첫 값 하나씩만 남는다.
 */

import { unlink } from "node:fs/promises";

/**
 * 파일 하나를 줄 단위로 읽는다. 파일을 통째로 메모리에 올리지 않고, 스트림이 주는 블록을
 * 받아 줄이 완성되는 대로 하나씩 내준다.
 */
class LineReader {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private decoder = new TextDecoder();
  private rest = "";
  private drained = false;

  constructor(path: string) {
    this.reader = Bun.file(path).stream().getReader();
  }

  /** 다음 정수 하나. 파일이 끝났으면 `null`. */
  async next(): Promise<number | null> {
    for (;;) {
      const at = this.rest.indexOf("\n");
      if (at >= 0) {
        const line = this.rest.slice(0, at);
        this.rest = this.rest.slice(at + 1);
        return Number.parseInt(line, 10);
      }
      if (this.drained) {
        if (this.rest.length === 0) return null;
        const line = this.rest;
        this.rest = "";
        return Number.parseInt(line, 10);
      }
      const block = await this.reader.read();
      if (block.done) this.drained = true;
      else this.rest += this.decoder.decode(block.value, { stream: true });
    }
  }
}

/** 힙에 담는 항목 — 값 하나와 그 값이 나온 조각의 번호. */
interface Entry {
  value: number;
  run: number;
}

/** 꼭대기가 최솟값인 이진 힙. 배열 하나로 완전 이진 트리를 담는다. */
class MinHeap {
  private items: Entry[] = [];

  get size(): number {
    return this.items.length;
  }

  push(entry: Entry): void {
    const items = this.items;
    items.push(entry);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if ((items[parent] as Entry).value <= (items[i] as Entry).value) break;
      [items[i], items[parent]] = [items[parent] as Entry, items[i] as Entry];
      i = parent;
    }
  }

  pop(): Entry {
    const items = this.items;
    const top = items[0] as Entry;
    const last = items.pop() as Entry;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        let small = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (
          left < items.length &&
          (items[left] as Entry).value < (items[small] as Entry).value
        )
          small = left;
        if (
          right < items.length &&
          (items[right] as Entry).value < (items[small] as Entry).value
        )
          small = right;
        if (small === i) break;
        [items[i], items[small]] = [items[small] as Entry, items[i] as Entry];
        i = small;
      }
    }
    return top;
  }
}

/**
 * `inputPath` 의 정수를 오름차순으로 정렬해 `outputPath` 에 적고 그 경로를 낸다.
 * 메모리에 한 번에 올리는 정수는 `memoryLimit` 개와 조각 수만큼의 힙 항목뿐이다.
 */
export async function externalMergeSort(
  inputPath: string,
  outputPath: string,
  memoryLimit: number,
): Promise<string> {
  const source = new LineReader(inputPath);
  const runPaths: string[] = [];
  let chunk: number[] = [];

  for (;;) {
    const value = await source.next();
    if (value !== null) chunk.push(value);
    // ① 조각이 가득 찼거나 ② 입력이 끝나 자투리가 남았으면 정렬해서 파일 하나로 적는다.
    const full = chunk.length === memoryLimit;
    const tail = value === null && chunk.length > 0;
    if (full || tail) {
      chunk.sort((a, b) => a - b);
      const path = `${outputPath}.run${runPaths.length}`;
      await Bun.write(path, `${chunk.join("\n")}\n`);
      runPaths.push(path);
      chunk = [];
    }
    if (value === null) break;
  }

  // ③ 조각마다 첫 값 하나씩만 힙에 올린다. 메모리에 드는 것은 조각 수만큼이다.
  const readers = runPaths.map((path) => new LineReader(path));
  const heap = new MinHeap();
  for (let run = 0; run < readers.length; run++) {
    const value = await (readers[run] as LineReader).next();
    if (value !== null) heap.push({ value, run });
  }

  // ④ 꼭대기를 꺼내 출력에 적고, 그 값이 나온 조각에서 다음 값 하나를 올린다.
  // 이어 적는 스트림은 이미 있는 파일을 자르지 않으므로 먼저 빈 파일로 만들어 둔다.
  await Bun.write(outputPath, "");
  const sink = Bun.file(outputPath).writer();
  while (heap.size > 0) {
    const { value, run } = heap.pop();
    sink.write(`${value}\n`);
    const next = await (readers[run] as LineReader).next();
    if (next !== null) heap.push({ value: next, run });
  }
  await sink.end();

  for (const path of runPaths) await unlink(path);
  return outputPath;
}
