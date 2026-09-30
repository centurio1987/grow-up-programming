// KAN-063 S7 탐침 — quicksort 가이드 「칸 50,000 개의 최악이면 호출 스택이 넘친다」 문장의 근거.
// 실행: bun KANBAN.batches/KAN-063-X2JFZA.probes/quicksort-stack.ts [n ...]
// 기본 n 은 10000 20000 50000. 가이드 본문의 결과는 Bun 1.3.12 에서 이 스크립트로 낸 것이다.
import { killer } from "../../src/algorithms/sorting/quicksort/quicksort-guide.fig.tsx";
import { quickSort } from "../../src/algorithms/sorting/quicksort/quicksort-guide.ref.ts";

const sizes = process.argv.length > 2 ? process.argv.slice(2).map(Number) : [10000, 20000, 50000];
for (const n of sizes) {
  const input = killer(n);
  try {
    const out = quickSort(input.slice());
    let sorted = true;
    for (let i = 1; i < out.length; i++) if ((out[i - 1] ?? 0) > (out[i] ?? 0)) sorted = false;
    console.log(`bun ${Bun.version} n=${n}: completed, sorted=${sorted}`);
  } catch (e) {
    const err = e as Error;
    console.log(`bun ${Bun.version} n=${n}: threw ${err.constructor.name}: ${err.message}`);
  }
}
