// 대용량 n에서 naive(shift) 방식의 실제 확장성 확인
function naiveFull(n: number) {
  const arr: number[] = [];
  for (let i = 0; i < n; i++) arr.push(i);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) arr.shift();
  return performance.now() - t0;
}
function finalFull(n: number) {
  const items: number[] = [];
  let head = 0;
  for (let i = 0; i < n; i++) items.push(i);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    head++;
  }
  return performance.now() - t0;
}
for (const n of [1000000]) {
  console.log(`n=${n} naive: ${naiveFull(n).toFixed(1)}ms, final(head++): ${finalFull(n).toFixed(2)}ms`);
}
