// 실사용 패턴: enqueue 1회 + dequeue 1회를 번갈아 반복 (큐가 계속 흐르는 스트리밍 상황)
function naiveStream(n: number) {
  const arr: number[] = [];
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    arr.push(i);
    arr.push(i);
    arr.shift();
    arr.shift();
  }
  return performance.now() - t0;
}

function headPtrStream(n: number) {
  const items: number[] = [];
  let head = 0;
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    items.push(i);
    items.push(i);
    head++;
    head++;
  }
  return performance.now() - t0;
}

for (const n of [100000, 300000, 500000]) {
  console.log(`n=${n} naive(push2+shift2 interleaved): ${naiveStream(n).toFixed(1)}ms`);
}

// burst 패턴: 다량 push 후 다량 shift (프린터 대기열이 몰릴 때)
function naiveBurst(n: number, bursts: number) {
  const arr: number[] = [];
  const per = Math.floor(n / bursts);
  const t0 = performance.now();
  for (let b = 0; b < bursts; b++) {
    for (let i = 0; i < per; i++) arr.push(i);
    for (let i = 0; i < per; i++) arr.shift();
  }
  return performance.now() - t0;
}
for (const n of [200000]) {
  for (const bursts of [1, 10, 100, 1000]) {
    console.log(`n=${n} bursts=${bursts} naive burst: ${naiveBurst(n, bursts).toFixed(1)}ms`);
  }
}
