/**
 * `purpose.alt`(경쟁 설계와의 대조) 의 수치를 내는 하네스 — L13.
 *
 *   bun run ../../../../tools/bench-alt.ts sieveOfEratosthenes-guide.alt.ts
 *
 * **경쟁 설계는 구간 분할 체(segmented sieve)다.** 같은 목표(`n` 이하의 소수를
 * 오름차순으로 전부 내는 것)를 노리되, `n + 1` 칸짜리 표를 한 번에 잡지 않는다. 먼저
 * `√n` 이하의 소수만 표준 방식으로 구해 두고, `2` 부터 `n` 까지를 길이 `SEGMENT` 짜리
 * 조각으로 갈라 조각 하나 분량의 표만 되풀이해 채운다.
 *
 * **입력을 결과에 맞춰 고르지 않는다**(L20). 입력은 상한 `n` 하나이고 난수가 없다. 전개
 * 입력 `n = 30` 을 그대로 넣고, 거기에 규모만 키운 `n` 넷을 더했다 — 조각 길이가 1,024 라
 * `n = 30` 에서는 조각이 하나뿐이라 두 설계의 저장 칸이 갈리는 자리가 안 나온다. 가장 큰 `n` 은
 * 본문 `deep.origin` ① 이 정한 과제 규모의 상한이다.
 *
 * **비용 기준은 본문과 같다** — 기본 연산(체 배열 칸 하나를 읽거나 쓰는 것 한 번)과 저장 칸(답 배열을 뺀,
 * 들고 있는 칸의 개수).
 *
 * **조각 길이를 1,024 로 고정한 것이 이 대조의 유일한 상수다.** 이 값을 `n` 으로 두면
 * 조각이 하나가 되어 두 설계가 같은 절차가 되므로, 조각 길이는 경쟁 설계 쪽의 설계값이지
 * 대조를 유리하게 만드는 손잡이가 아니다.
 */

/** 경쟁 설계가 한 번에 채우는 조각의 길이. */
const SEGMENT = 1024;

/** 대조에 쓰는 상한. 첫째가 전개 입력이다. */
const SMALL = 30;
const MEDIUM = 1_000;
const LARGE = 10_000_000;

/** 저장 칸이 뒤집히는 자리. 아래 `flipPoint()` 가 차례로 재서 확인한다. */
const TIE = 1_067;
const FLIP = 1_068;

interface Counted {
  primes: number[];
  /** 기본 연산 — 체 배열을 만드는 쓰기 + 바깥 읽기 + 지우기 + 수집 읽기. */
  access: number;
  /** 저장 칸 — 답 배열을 뺀, 들고 있는 칸. */
  cells: number;
}

/** 이 가이드가 가르치는 절차에 계수만 덧붙인 것. */
function bySingleTable(n: number): Counted {
  const primes: number[] = [];
  if (n < 2) return { primes, access: 0, cells: 0 };

  let access = 0;
  const isComposite = new Array<boolean>(n + 1).fill(false);
  access += n + 1;

  for (let i = 2; i * i <= n; i++) {
    access++;
    if (isComposite[i]) continue;
    for (let j = i * i; j <= n; j += i) {
      access++;
      isComposite[j] = true;
    }
  }
  for (let k = 2; k <= n; k++) {
    access++;
    if (!isComposite[k]) primes.push(k);
  }
  return { primes, access, cells: n + 1 };
}

/**
 * 조각으로 갈라 채우는 체. `√n` 이하의 소수를 먼저 구해 두고, 조각마다 그 소수들의 배수를
 * 다시 계산해 적는다. 조각 안의 시작 자리는 `max(p², ⌈lo/p⌉·p)` 다.
 */
function bySegments(n: number, segment: number): Counted {
  const primes: number[] = [];
  if (n < 2) return { primes, access: 0, cells: 0 };

  let access = 0;
  const root = Math.floor(Math.sqrt(n));

  const baseComposite = new Array<boolean>(root + 1).fill(false);
  access += root + 1;
  for (let i = 2; i * i <= root; i++) {
    access++;
    if (baseComposite[i]) continue;
    for (let j = i * i; j <= root; j += i) {
      access++;
      baseComposite[j] = true;
    }
  }
  const base: number[] = [];
  for (let k = 2; k <= root; k++) {
    access++;
    if (!baseComposite[k]) base.push(k);
  }

  const block = new Array<boolean>(segment).fill(false);
  for (let lo = 2; lo <= n; lo += segment) {
    const hi = Math.min(lo + segment - 1, n);
    for (let t = 0; t <= hi - lo; t++) {
      access++;
      block[t] = false;
    }
    for (let t = 0; t < base.length; t++) {
      access++;
      const p = base[t] as number;
      if (p * p > hi) break;
      const from = Math.max(p * p, Math.ceil(lo / p) * p);
      for (let j = from; j <= hi; j += p) {
        access++;
        block[j - lo] = true;
      }
    }
    for (let j = lo; j <= hi; j++) {
      access++;
      if (!block[j - lo]) primes.push(j);
    }
  }
  return { primes, access, cells: root + 1 + base.length + segment };
}

/** 두 설계가 같은 답을 내는지 확인한다. 다르면 대조가 아니라 다른 문제를 푼 것이다. */
function measure(n: number): { mine: Counted; theirs: Counted } {
  const mine = bySingleTable(n);
  const theirs = bySegments(n, SEGMENT);
  if (mine.primes.join(",") !== theirs.primes.join(",")) {
    throw new Error(`두 설계의 답이 다르다 — n=${n}`);
  }
  return { mine, theirs };
}

/** 저장 칸의 순서가 처음 뒤집히는 `n`. 상수 `FLIP` 이 실제로 그 자리인지 확인한다. */
function flipPoint(): number {
  for (let n = 2; n <= 4_000; n++) {
    if (bySegments(n, SEGMENT).cells < bySingleTable(n).cells) return n;
  }
  throw new Error("재 본 구간 안에서 저장 칸이 뒤집히지 않았다");
}

if (flipPoint() !== FLIP) {
  throw new Error(
    `저장 칸이 뒤집히는 자리가 ${flipPoint()} 이다 — 상수와 어긋난다`,
  );
}

const S = measure(SMALL);
const M = measure(MEDIUM);
const L = measure(LARGE);
const T = measure(TIE);
const F = measure(FLIP);

export const cases = {
  "에라토스테네스의 체": () => ({
    "n=30 기본 연산": S.mine.access,
    "n=1,000 기본 연산": M.mine.access,
    "n=10,000,000 기본 연산": L.mine.access,
    "n=30 저장 칸": S.mine.cells,
    "n=1,067 저장 칸": T.mine.cells,
    "n=1,068 저장 칸": F.mine.cells,
    "n=10,000,000 저장 칸": L.mine.cells,
  }),
  "구간 분할 체": () => ({
    "n=30 기본 연산": S.theirs.access,
    "n=1,000 기본 연산": M.theirs.access,
    "n=10,000,000 기본 연산": L.theirs.access,
    "n=30 저장 칸": S.theirs.cells,
    "n=1,067 저장 칸": T.theirs.cells,
    "n=1,068 저장 칸": F.theirs.cells,
    "n=10,000,000 저장 칸": L.theirs.cells,
  }),
};
