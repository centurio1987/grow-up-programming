function timeShift(n: number) {
  const arr: number[] = [];
  for (let i = 0; i < n; i++) arr.push(i);
  const t0 = performance.now();
  for (let i = 0; i < n; i++) arr.shift();
  return performance.now() - t0;
}
for (const n of [50000, 100000, 200000, 400000, 800000]) {
  console.log(n, timeShift(n).toFixed(1) + "ms");
}
