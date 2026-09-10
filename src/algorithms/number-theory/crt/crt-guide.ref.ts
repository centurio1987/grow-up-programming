/**
 * `deep.walk.final`(전체 코드) 이 싣는 코드의 정본.
 *
 * 원본 `src/algorithms/number-theory/crt/crt.ts` 는 학습자 스텁이라 본문에 실을 수 없다.
 * 여기 있는 것이 가이드 본문의 전체 코드와 **글자 그대로** 같은 절차다 — 합동식을 왼쪽부터
 * 둘씩 하나로 합치고, 합칠 수 없는 자리를 만나면 그 자리에서 `null` 을 낸다.
 *
 * **`bigint` 로 받는다.** 계약이 그렇고, 합치는 도중의 곱이 두 법의 곱만큼 커지므로 배정밀도
 * 정수로는 계약을 못 지킨다 — 본문 「수식 정의와 유도」가 그 상한을 닫고 「최악을 만드는
 * 입력」이 배정밀도가 처음 틀리는 자리를 실측으로 낸다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래 세
 * 자리가 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다.
 *
 * - 남은 자유도를 `m / g` 대신 `m` 으로 잡으면 주기가 최소공배수가 아니라 곱이 된다.
 * - 나머지 차를 `g` 로 나누지 않고 곱하면 옮기는 칸 수가 `g` 배가 된다.
 * - `t` 를 `[0, unit)` 로 맞추는 자리를 부호가 남는 나머지로 바꾸면 답이 범위를 벗어난다.
 */

/**
 * `a` 를 `m` 으로 나눈 나머지를 `[0, m)` 안에 둔다. `bigint` 의 `%` 는 피제수의 부호를
 * 그대로 남기므로 음수 나머지가 나올 수 있다.
 */
function mod(a: bigint, m: bigint): bigint {
  const r = a % m;
  return r < 0n ? r + m : r;
}

/**
 * 확장 유클리드 호제법 중 이 절차가 쓰는 둘만 낸다 — 최대공약수 `g` 와 `a·x + b·y = g` 의
 * `a` 쪽 계수 `x`. 두 인자가 모두 1 이상이라 부호를 다루는 자리가 없다.
 */
function gcdWithCoefficient(a: bigint, b: bigint): { g: bigint; x: bigint } {
  let r0 = a;
  let r1 = b;
  let s0 = 1n;
  let s1 = 0n;
  while (r1 !== 0n) {
    const q = r0 / r1;
    [r0, r1] = [r1, r0 - q * r1];
    [s0, s1] = [s1, s0 - q * s1];
  }
  return { g: r0, x: s0 };
}

/**
 * 연립 합동식 `x ≡ remainders[i] (mod moduli[i])` 를 동시에 만족하는 가장 작은 음이 아닌
 * `x` 와 그 주기 `M = lcm(moduli)` 를 낸다. 두 조건이 모순이면 `null` 이다.
 */
export function crt(
  remainders: bigint[],
  moduli: bigint[],
): { x: bigint; M: bigint } | null {
  // ① 첫 합동식을 누적 해로 삼는다. 나머지는 [0, m) 로 맞춰 둔다.
  let curM = moduli[0] as bigint;
  let curR = mod(remainders[0] as bigint, curM);

  for (let i = 1; i < moduli.length; i++) {
    const m = moduli[i] as bigint;
    const r = mod(remainders[i] as bigint, m);
    const diff = r - curR;
    const { g, x: u } = gcdWithCoefficient(curM, m);

    // ② 두 법의 최대공약수가 나머지 차를 나누지 않으면 두 조건은 모순이다.
    if (diff % g !== 0n) return null;

    // ③ curR 을 curM 칸씩 t 번 옮겨 새 조건까지 맞춘다. t 는 [0, m/g) 에서 유일하다.
    const unit = m / g;
    const t = mod((diff / g) * u, unit);
    curR = curR + curM * t;
    curM = curM * unit;
  }

  return { x: curR, M: curM };
}
