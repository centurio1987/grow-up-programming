// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 추출한 것.
// 가이드 자체의 정확성/실측 검증이 목적이며, sibling topKFrequent.ts(학습자 스텁)와 무관하다.

// ---------- naive ----------
function topKFrequentNaive(A: number[], k: number): number[] {
  const freq = new Map<number, number>();
  for (const v of A) freq.set(v, (freq.get(v) ?? 0) + 1);
  const entries = [...freq.entries()];
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, k).map(([v]) => v);
}

// ---------- min-heap (중간 개선) ----------
type Entry = [freq: number, value: number];

function siftUp(heap: Entry[], i: number): void {
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (heap[parent]![0] <= heap[i]![0]) break;
    [heap[parent]!, heap[i]!] = [heap[i]!, heap[parent]!];
    i = parent;
  }
}

function siftDown(heap: Entry[], i: number): void {
  const n = heap.length;
  while (true) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    let smallest = i;
    if (l < n && heap[l]![0] < heap[smallest]![0]) smallest = l;
    if (r < n && heap[r]![0] < heap[smallest]![0]) smallest = r;
    if (smallest === i) break;
    [heap[i]!, heap[smallest]!] = [heap[smallest]!, heap[i]!];
    i = smallest;
  }
}

function heapPush(heap: Entry[], entry: Entry): void {
  heap.push(entry);
  siftUp(heap, heap.length - 1);
}

function heapPop(heap: Entry[]): Entry {
  const top = heap[0]!;
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    siftDown(heap, 0);
  }
  return top;
}

function topKFrequentHeap(A: number[], k: number): number[] {
  const freq = new Map<number, number>();
  for (const v of A) freq.set(v, (freq.get(v) ?? 0) + 1);

  const heap: Entry[] = []; // (빈도, 값) 최소 힙, 크기 <= k
  for (const [v, f] of freq) {
    if (heap.length < k) {
      heapPush(heap, [f, v]);
    } else if (f > heap[0]![0]) {
      heapPop(heap);
      heapPush(heap, [f, v]);
    }
  }

  const result: number[] = new Array(heap.length);
  for (let i = heap.length - 1; i >= 0; i--) {
    result[i] = heapPop(heap)[1];
  }
  return result;
}

// ---------- bucket sort (최종) ----------
function topKFrequent(A: number[], k: number): number[] {
  const n = A.length;
  const freq = new Map<number, number>();
  for (const v of A) freq.set(v, (freq.get(v) ?? 0) + 1);

  const buckets: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const [v, f] of freq) buckets[f]!.push(v);

  const result: number[] = [];
  for (let i = n; i >= 1 && result.length < k; i--) {
    for (const v of buckets[i]!) {
      result.push(v);
      if (result.length === k) break;
    }
  }
  return result;
}

// ---------- 검증 ----------
function setEq(a: number[], b: number[]): boolean {
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.length === sb.length && sa.every((v, i) => v === sb[i]);
}

function freqOf(A: number[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const v of A) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

// top-k 결과가 "빈도 상위 k" 조건을 만족하는지 검증(동률 허용)
function isValidTopK(A: number[], k: number, result: number[]): boolean {
  if (result.length !== k) return false;
  const freq = freqOf(A);
  const uniq = [...freq.keys()];
  if (new Set(result).size !== result.length) return false;
  const resultFreqs = result.map((v) => freq.get(v)!);
  const minResultFreq = Math.min(...resultFreqs);
  for (const u of uniq) {
    if (!result.includes(u) && freq.get(u)! > minResultFreq) return false;
  }
  return true;
}

console.log("=== 대표 예시: A=[1,1,1,2,2,3], k=2 ===");
const A1 = [1, 1, 1, 2, 2, 3];
console.log("naive :", topKFrequentNaive(A1, 2));
console.log("heap  :", topKFrequentHeap(A1, 2));
console.log("bucket:", topKFrequent(A1, 2));

console.log("\n=== heap 단계별 트레이스 (freq map 순회 순서 확인) ===");
console.log("freq map entries order:", [...freqOf(A1).entries()]);

console.log("\n=== 엣지 케이스 ===");
const edgeCases: Array<[number[], number]> = [
  [[1], 1],
  [[7, 7, 7, 7], 1],
  [[1, 2, 3], 3],
  [[-1, -1, -1, 2, 2, 0], 2],
  [[1_000_000_000, 1_000_000_000, -1_000_000_000], 1],
  [[4, 4, 4, 4, 2, 2, 2, 1, 1, 3], 3],
];
for (const [A, k] of edgeCases) {
  const rn = topKFrequentNaive(A, k);
  const rh = topKFrequentHeap(A, k);
  const rb = topKFrequent(A, k);
  const ok =
    setEq(rn, rh) &&
    setEq(rh, rb) &&
    isValidTopK(A, k, rn) &&
    isValidTopK(A, k, rh) &&
    isValidTopK(A, k, rb);
  console.log(
    `A=${JSON.stringify(A)}, k=${k} -> naive=${JSON.stringify(rn)} heap=${JSON.stringify(rh)} bucket=${JSON.stringify(rb)} ok=${ok}`,
  );
}

console.log("\n=== 랜덤 교차검증 (200회) ===");
let allOk = true;
for (let t = 0; t < 200; t++) {
  const n = 1 + Math.floor(Math.random() * 30);
  const A: number[] = Array.from(
    { length: n },
    () => Math.floor(Math.random() * 6) - 3,
  );
  const uniqCount = new Set(A).size;
  const k = 1 + Math.floor(Math.random() * uniqCount);
  const rn = topKFrequentNaive(A, k);
  const rh = topKFrequentHeap(A, k);
  const rb = topKFrequent(A, k);
  const ok =
    isValidTopK(A, k, rn) && isValidTopK(A, k, rh) && isValidTopK(A, k, rb);
  if (!ok) {
    allOk = false;
    console.log("FAIL", JSON.stringify(A), k, rn, rh, rb);
  }
}
console.log("랜덤 200회 전부 통과:", allOk);

console.log("\n=== 힙 손트레이스용: 값 1(빈도3), 2(빈도2), 3(빈도1), k=2 ===");
{
  const freq = freqOf(A1);
  console.log("freq entries:", [...freq.entries()]);
  const heap: Entry[] = [];
  for (const [v, f] of freq) {
    console.log(`처리: v=${v}, f=${f}, heap 처리 전=`, JSON.stringify(heap));
    if (heap.length < 2) {
      heapPush(heap, [f, v]);
      console.log(`  -> push (${f},${v})  heap=`, JSON.stringify(heap));
    } else if (f > heap[0]![0]) {
      const popped = heapPop(heap);
      console.log(`  -> pop (${popped[0]},${popped[1]})`);
      heapPush(heap, [f, v]);
      console.log(`  -> push (${f},${v})  heap=`, JSON.stringify(heap));
    } else {
      console.log(`  -> skip (f=${f} <= root ${heap[0]![0]})`);
    }
  }
  console.log("최종 heap:", JSON.stringify(heap));
}

console.log("\n=== 버킷 손트레이스: A=[1,1,1,2,2,3], k=2 ===");
{
  const n = A1.length;
  const freq = freqOf(A1);
  const buckets: number[][] = Array.from({ length: n + 1 }, () => []);
  for (const [v, f] of freq) buckets[f]!.push(v);
  console.log(
    "buckets(0..N):",
    buckets.map((b, i) => `B${i}:${JSON.stringify(b)}`).join(" "),
  );
  const result: number[] = [];
  for (let i = n; i >= 1 && result.length < 2; i--) {
    for (const v of buckets[i]!) {
      result.push(v);
      console.log(`i=${i} 수집 -> result=${JSON.stringify(result)}`);
      if (result.length === 2) break;
    }
  }
  console.log("최종 result:", result);
}
