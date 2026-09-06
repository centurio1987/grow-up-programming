/**
 * `deep.walk.final`(전체 코드)의 정본 — L9.
 *
 * 원본 `fftMultiply.ts` 는 학습자 스텁이라 `Not implemented` 를 던진다. 가이드가 싣는 코드와
 * 사이드카(`.proof.ts` · `.test.ts` · `.alt.ts`)가 함께 부르는 구현은 이 파일 하나다.
 *
 * 원문자 라벨 ①~⑦ 은 본문 전개가 그대로 인용한다(P4).
 *
 * **재귀를 쓰지 않는다.** 짝수 자리와 홀수 자리를 나누는 재귀를 그대로 옮기면 단계마다 새
 * 배열 세 벌이 생긴다. 비트 역순으로 한 번 재배치해 두면 그 재귀가 만들었을 순서가 배열 한
 * 벌 안에 이미 서 있어서, 뒤로는 블록 길이를 2 배씩 늘리며 같은 배열을 고쳐 쓰기만 하면 된다.
 *
 * **회전 인자를 누적 곱으로 만들지 않는다.** `Math.cos`·`Math.sin` 을 자리마다 다시 부르는
 * 것이 삼각함수 호출을 늘리지만, 누적 곱은 오차를 자리마다 이어받아 반올림 앞에서 정답과
 * 갈리는 자리를 앞당긴다. 그 두 값의 차이는 `-guide.proof.ts` 의 `pause-drift` 가 잰다.
 *
 * 변이는 이 파일 원문에서 기계로 만든다(`tools/check-proof.ts` 의 `loadMutant`) — 아래
 * 여섯이 각각 정확히 한 줄이라 「한 곳만 바꿨다」가 검사된다. **여기에 그 줄을 그대로 옮겨
 * 적지 않는다** — 변이 정규식이 주석 줄에도 맞아 「두 줄에 맞았다」로 실패한다.
 *
 * - 빈 입력을 먼저 거르는 줄을 빼면 빈 배열 대신 0 이 늘어선 배열이 나온다.
 * - 비트 역순 재배치의 조건을 「두 자리가 다르면」으로 넓히면 같은 짝을 두 번 맞바꿔 재배치가
 *   통째로 없던 일이 된다.
 * - 나비 연산의 아래쪽 칸을 지역 변수가 아니라 방금 덮어쓴 위쪽 칸에서 읽으면 값이 갈린다.
 * - 각도에 붙는 부호를 정방향으로 고정하면 역변환이 정방향 변환을 한 번 더 한 것이 된다.
 * - 역변환 끝에서 실수부를 길이로 나누는 줄을 빼면 계수가 그 길이배로 나온다.
 * - 반올림 결과를 그대로 담으면 계수 0 자리에 부호가 붙은 0 이 남는다.
 */

/** `want` 이상인 가장 작은 2 의 거듭제곱. */
function padLength(want: number): number {
  let size = 1;
  while (size < want) size <<= 1;
  return size;
}

/**
 * 길이가 2 의 거듭제곱인 복소수 배열을 제자리에서 변환한다.
 *
 * `invert` 가 거짓이면 이산 푸리에 변환이고, 참이면 그 역변환이다. 두 방향이 쓰는 식은 같고
 * 각도에 붙는 부호와 마지막 나눗셈만 갈린다.
 */
function transform(re: Float64Array, im: Float64Array, invert: boolean): void {
  const size = re.length;

  // ③ 비트 역순 재배치 — 자리 `i` 의 이진 표기를 뒤집은 자리가 `j` 다. 두 자리를 한 번만
  // 맞바꾸려고 `i < j` 일 때만 손댄다.
  for (let i = 1, j = 0; i < size; i++) {
    let bit = size >> 1;
    for (; (j & bit) !== 0; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const swapRe = re[i] as number;
      re[i] = re[j] as number;
      re[j] = swapRe;
      const swapIm = im[i] as number;
      im[i] = im[j] as number;
      im[j] = swapIm;
    }
  }

  // ④ 블록 길이 `len` 을 2 배씩 늘리며 나비 연산을 반복한다. 위쪽 칸은 그대로 두고 아래쪽
  // 칸에 회전 인자를 곱한 값을 더하고 뺀다.
  for (let len = 2; len <= size; len <<= 1) {
    const half = len >> 1;
    const ang = ((2 * Math.PI) / len) * (invert ? -1 : 1);
    for (let start = 0; start < size; start += len) {
      for (let j = 0; j < half; j++) {
        const wRe = Math.cos(ang * j);
        const wIm = Math.sin(ang * j);
        const top = start + j;
        const bot = top + half;
        const uRe = re[top] as number;
        const uIm = im[top] as number;
        const vRe = (re[bot] as number) * wRe - (im[bot] as number) * wIm;
        const vIm = (re[bot] as number) * wIm + (im[bot] as number) * wRe;
        re[top] = uRe + vRe;
        im[top] = uIm + vIm;
        re[bot] = uRe - vRe;
        im[bot] = uIm - vIm;
      }
    }
  }

  // ⑥ 역변환이면 배열 전체를 길이로 한 번 나눈다. 나눗셈은 여기 한 자리뿐이다.
  if (invert) {
    for (let i = 0; i < size; i++) {
      re[i] = (re[i] as number) / size;
      im[i] = (im[i] as number) / size;
    }
  }
}

export function fftMultiply(a: number[], b: number[]): number[] {
  // ① 한쪽이 비어 있으면 곱도 비어 있다. 아래 계산은 길이가 1 이상인 것을 전제한다.
  if (a.length === 0 || b.length === 0) return [];

  const resultLen = a.length + b.length - 1;
  const size = padLength(resultLen);

  // ② 두 계수 배열을 실수부에 옮기고 남는 칸과 허수부는 0 으로 둔다.
  const aRe = new Float64Array(size);
  const aIm = new Float64Array(size);
  const bRe = new Float64Array(size);
  const bIm = new Float64Array(size);
  for (let i = 0; i < a.length; i++) aRe[i] = a[i] as number;
  for (let i = 0; i < b.length; i++) bRe[i] = b[i] as number;

  transform(aRe, aIm, false);
  transform(bRe, bIm, false);

  // ⑤ 같은 자리끼리 복소수 곱 한 번. 여기서 곱 다항식의 값 표현이 나온다.
  for (let i = 0; i < size; i++) {
    const mulRe =
      (aRe[i] as number) * (bRe[i] as number) -
      (aIm[i] as number) * (bIm[i] as number);
    const mulIm =
      (aRe[i] as number) * (bIm[i] as number) +
      (aIm[i] as number) * (bRe[i] as number);
    aRe[i] = mulRe;
    aIm[i] = mulIm;
  }

  transform(aRe, aIm, true);

  // ⑦ 앞 `resultLen` 칸의 실수부를 정수로 반올림한 것이 답이다. 아주 작은 음수를 반올림하면
  // 부호가 붙은 0 이 나오므로 그 자리만 부호 없는 0 으로 맞춘다.
  const out = new Array<number>(resultLen);
  for (let i = 0; i < resultLen; i++) {
    const rounded = Math.round(aRe[i] as number);
    out[i] = rounded === 0 ? 0 : rounded;
  }
  return out;
}
