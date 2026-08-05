// TS/JS 쪽 한계를 실제로 확인한다 — 가이드 escalation 절의 근거.
console.log("SharedArrayBuffer:", typeof SharedArrayBuffer);
console.log("Atomics.compareExchange:", typeof Atomics?.compareExchange);
console.log("Atomics.wait:", typeof Atomics?.wait);

// ① 비교자(함수)를 워커로 보낼 수 있는가
try {
  structuredClone((a: number, b: number) => a - b);
  console.log("함수 전송: 된다");
} catch (error) {
  console.log("함수 전송:", (error as Error).constructor.name, "-", (error as Error).message.slice(0, 60));
}

// ② 객체를 SharedArrayBuffer 에 담을 수 있는가 — 담는 것은 정수뿐이다
const sab = new SharedArrayBuffer(8);
const view = new Int32Array(sab);
Atomics.store(view, 0, 41);
const swapped = Atomics.compareExchange(view, 0, 41, 42);
console.log("CAS 동작:", swapped === 41 && Atomics.load(view, 0) === 42);
try {
  // biome-ignore lint: 일부러 틀린 대입으로 무엇이 담기는지 보인다
  (view as unknown as unknown[])[1] = { key: 1 };
  console.log("객체 저장 결과:", Atomics.load(view, 1));
} catch (error) {
  console.log("객체 저장:", (error as Error).constructor.name);
}
