// Array.prototype.shift / unshift 가 이 런타임에서 실제로 얼마나 드는지 확인한다.
// "O(n)이다"라고 본문에 쓰기 전에, 진짜로 크기에 비례해 느려지는지를 재 본다.
//
// 실행: bun src/data-structures/linear/deque/_scratch/deque-ord005-shiftcost.ts

function best(fn: () => number, repeats = 3): number {
  let m = Number.POSITIVE_INFINITY;
  for (let i = 0; i < repeats; i++) m = Math.min(m, fn());
  return m;
}

function timeShiftAll(n: number): number {
  const arr: number[] = [];
  for (let i = 0; i < n; i++) arr.push(i);
  const t0 = performance.now();
  let sum = 0;
  while (arr.length > 0) sum += arr.shift()!;
  const t1 = performance.now();
  if (sum !== (n * (n - 1)) / 2) throw new Error("sum mismatch");
  return t1 - t0;
}

function timeUnshiftAll(n: number): number {
  const arr: number[] = [];
  const t0 = performance.now();
  for (let i = 0; i < n; i++) arr.unshift(i);
  const t1 = performance.now();
  if (arr.length !== n) throw new Error("len mismatch");
  return t1 - t0;
}

function timePushAll(n: number): number {
  const arr: number[] = [];
  const t0 = performance.now();
  for (let i = 0; i < n; i++) arr.push(i);
  const t1 = performance.now();
  if (arr.length !== n) throw new Error("len mismatch");
  return t1 - t0;
}

console.log("== 총 소요 시간(ms) — n을 2배로 키우면? (연산이 O(1)이면 총합 ×2, O(n)이면 총합 ×4)");
console.log("       n     shift×n  (배율)     unshift×n  (배율)      push×n  (배율)");
let ps = 0;
let pu = 0;
let pp = 0;
for (const n of [20_000, 40_000, 80_000, 160_000, 320_000]) {
  const s = best(() => timeShiftAll(n));
  const u = best(() => timeUnshiftAll(n));
  const p = best(() => timePushAll(n));
  const r = (cur: number, prev: number) => (prev > 0 ? `×${(cur / prev).toFixed(2)}` : "  -  ");
  console.log(
    `${String(n).padStart(8)}  ${s.toFixed(1).padStart(10)} ${r(s, ps).padStart(7)}  ${u.toFixed(1).padStart(12)} ${r(u, pu).padStart(7)}  ${p.toFixed(1).padStart(10)} ${r(p, pp).padStart(7)}`,
  );
  ps = s;
  pu = u;
  pp = p;
}

console.log("\n== 큐 패턴(push n번 → shift n번) vs 앞쪽 삽입 패턴(unshift n번 → pop n번)");
for (const n of [50_000, 100_000, 200_000]) {
  const q = best(() => {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) arr.push(i);
    const t0 = performance.now();
    let s = 0;
    for (let i = 0; i < n; i++) s += arr.shift()!;
    const t1 = performance.now();
    if (s !== (n * (n - 1)) / 2) throw new Error("mismatch");
    return t1 - t0;
  });
  const f = best(() => {
    const arr: number[] = [];
    const t0 = performance.now();
    for (let i = 0; i < n; i++) arr.unshift(i);
    const t1 = performance.now();
    return t1 - t0;
  });
  console.log(`   n=${String(n).padStart(7)}   shift 루프 ${q.toFixed(1).padStart(8)} ms      unshift 루프 ${f.toFixed(1).padStart(9)} ms   (${(f / q).toFixed(0)}배)`);
}

console.log("\n== 원소 이동 횟수 모델(명세대로 셌을 때)과 실측 시간의 괴리");
{
  const n = 200_000;
  const modelMoves = (n * (n - 1)) / 2;
  const t = best(() => {
    const arr: number[] = [];
    for (let i = 0; i < n; i++) arr.push(i);
    const t0 = performance.now();
    while (arr.length > 0) arr.shift();
    return performance.now() - t0;
  });
  console.log(`   n=${n}: 명세대로 세면 원소 이동 ${modelMoves.toLocaleString()}회인데, 실제로는 ${t.toFixed(1)}ms에 끝난다.`);
  console.log("   → 이 런타임의 shift는 원소를 실제로 옮기지 않는다(앞쪽 시작 위치를 옮기는 최적화).");
  console.log("   → 반대로 unshift에는 같은 최적화가 걸려 있지 않다(위 표의 ×4 배율).");
}
