/**
 * `purpose.alt`(경쟁 설계와의 대조)의 수치를 실측하는 하네스 — `L13`.
 *
 *   bun run tools/bench-alt.ts src/algorithms/advanced/countInversions/countInversions-guide.alt.ts
 *
 * 경쟁 설계는 **값 범위를 아는 펜윅 트리 판**이다. 배열을 오른쪽에서 왼쪽으로 지나가며
 * 「지금까지 본 값 중 이 값보다 작은 것이 몇 개인가」를 펜윅 트리에 물어 더한다. 값이
 * `0` 이상 `V` 미만인 정수라는 것을 **미리 알아야** 트리를 `V + 1` 칸으로 잡을 수 있다.
 *
 * **잣대는 배열 칸 접근 하나다.** 읽기 한 번과 쓰기 한 번을 각각 1 로 세고, 두 설계에 같은
 * 규칙을 적용한다. 벽시계는 안 쓴다 — 실행마다 값이 달라 P10 이 대조할 수 없다.
 *
 * **입력은 시드도 난수도 없는 생성식 하나다.** `A[q] = (q × 7,919) mod V` 이고 칸 수는
 * 4,096 으로 고정한다. 전개 입력(칸 여섯)을 안 쓴 이유를 본문에 적었다 — 갈림의 축이 값
 * 범위 `V` 인데 칸이 여섯이면 `V` 를 키워도 두 계수가 안 갈린다.
 *
 * **`measure()` 가 매 실행마다 정본과 답을 대조한다.** 답이 다른 구현으로 잰 계수는 저울질이
 * 아니라 다른 문제의 값이다(2026-09-03 `S34` 실측이 세운 규칙).
 */
import { countInversions } from "./countInversions-guide.ref.ts";

/** 대조에 쓰는 칸 수. 값 범위를 키워도 두 계수가 갈리는 규모다. */
export const N_ALT = 4096;

/** 입력 생성식의 곱수. 난수도 시드도 없다. */
export const 곱수 = 7919;

/** 값 범위 `V` 에서의 입력. `A[q] = (q × 곱수) mod V` 다. */
export function 입력(V: number): number[] {
  return Array.from({ length: N_ALT }, (_, q) => (q * 곱수) % V);
}

/** 본문 대조 표가 쓰는 값 범위 넷. */
export const 값범위 = {
  가장좁게: 2,
  경계앞: 173193,
  경계: 173194,
  가장넓게: 1048576,
} as const;

/** 저장 칸이 갈리는 자리를 보이는 값 범위 둘. */
export const 저장경계 = { 같아지는: 8191, 갈리는: 8192 } as const;

export interface 계수 {
  답: number;
  칸접근: number;
  저장칸: number;
}

/**
 * 정본과 같은 절차에 칸 접근을 덧붙인 사본. 정본은 계수를 안 내보내므로 이 사본이 필요하다 —
 * **답이 정본과 같은지는 `measure()` 가 매번 확인한다.**
 */
export function 합치며_세기(
  arr: number[],
): 계수 & { 견주기: number; 옮긴칸: number } {
  const N = arr.length;
  let 견주기 = 0;
  let 칸접근 = 0;
  let 옮긴칸 = 0;
  if (N <= 1) return { 답: 0, 칸접근, 저장칸: 0, 견주기, 옮긴칸 };
  const a = arr.slice();
  칸접근 += 2 * N;
  const buffer = new Array<number>(N);

  function merge(lo: number, mid: number, hi: number): number {
    옮긴칸 += hi - lo + 1;
    let i = lo;
    let j = mid + 1;
    let k = lo;
    let count = 0;
    while (i <= mid && j <= hi) {
      견주기++;
      칸접근 += 2;
      if ((a[i] as number) <= (a[j] as number)) {
        buffer[k] = a[i] as number;
        k++;
        i++;
      } else {
        count += mid - i + 1;
        buffer[k] = a[j] as number;
        k++;
        j++;
      }
      칸접근 += 2;
    }
    while (i <= mid) {
      buffer[k] = a[i] as number;
      k++;
      i++;
      칸접근 += 2;
    }
    while (j <= hi) {
      buffer[k] = a[j] as number;
      k++;
      j++;
      칸접근 += 2;
    }
    for (let x = lo; x <= hi; x++) {
      a[x] = buffer[x] as number;
      칸접근 += 2;
    }
    return count;
  }

  function rec(lo: number, hi: number): number {
    if (lo >= hi) return 0;
    const mid = (lo + hi) >> 1;
    let c = rec(lo, mid);
    c += rec(mid + 1, hi);
    c += merge(lo, mid, hi);
    return c;
  }

  return { 답: rec(0, N - 1), 칸접근, 저장칸: 2 * N, 견주기, 옮긴칸 };
}

/**
 * 값 범위를 아는 펜윅 트리 판. 오른쪽 끝에서 왼쪽으로 가며 「이미 본 값 중 더 작은 것」을 센다.
 * 값이 `0` 이상 `V` 미만이라는 것을 전제로 트리를 `V + 1` 칸으로 잡는다.
 */
export function 펜윅으로_세기(arr: number[], V: number): 계수 {
  const N = arr.length;
  const tree = new Array<number>(V + 1).fill(0);
  let 칸접근 = V + 1;
  let 답 = 0;
  for (let q = N - 1; q >= 0; q--) {
    const v = arr[q] as number;
    칸접근 += 1;
    for (let i = v; i > 0; i -= i & -i) {
      답 += tree[i] as number;
      칸접근 += 1;
    }
    for (let i = v + 1; i <= V; i += i & -i) {
      tree[i] = (tree[i] as number) + 1;
      칸접근 += 2;
    }
  }
  return { 답, 칸접근, 저장칸: V + 1 };
}

/**
 * 값 범위 하나에서 두 설계를 재고 **답을 정본과 대조한다.**
 *
 * 대조가 여기 있는 이유는 `S34` 실측이다 — 답이 다른 구현으로 잰 계수로 생략·채택을 정하면
 * 그 판정은 근거가 없다.
 */
export function measure(V: number): { 정본: 계수; 펜윅: 계수 } {
  const arr = 입력(V);
  const 옳은답 = countInversions(arr);
  const 정본 = 합치며_세기(arr);
  const 펜윅 = 펜윅으로_세기(arr, V);
  if (정본.답 !== 옳은답 || 펜윅.답 !== 옳은답) {
    throw new Error(
      `V=${V} 에서 답이 갈린다 — 정본 ${옳은답} · 사본 ${정본.답} · 펜윅 ${펜윅.답}`,
    );
  }
  return { 정본, 펜윅 };
}

/**
 * 칸 접근의 순서가 뒤집히는 첫 값 범위를 **이분으로 좁힌다.**
 *
 * 한 칸 단위 스윕은 값 범위 17 만까지 4,096 칸짜리 배열을 매번 다시 재는 일이라 대조 한 번에
 * 몇 분이 든다. 대신 이분으로 좁히고 **두 끝을 다시 재서** 확인한다 — `floydWarshall` 이
 * 세운 관례 그대로다. 좁힌 결과가 실제 경계라는 것은 `경계_확인()` 이 값으로 낸다.
 */
export function 첫_뒤집힘(lo = 2, hi = 1 << 21): number {
  let 왼 = lo;
  let 오 = hi;
  while (왼 < 오) {
    const 가운데 = (왼 + 오) >> 1;
    const { 정본, 펜윅 } = measure(가운데);
    if (펜윅.칸접근 > 정본.칸접근) 오 = 가운데;
    else 왼 = 가운데 + 1;
  }
  return 왼;
}

/** 좁힌 경계의 양쪽을 다시 재서 순서가 실제로 뒤집히는지 본다. */
export function 경계_확인(V: number): { 앞: 계수[]; 뒤: 계수[] } {
  const 앞 = measure(V - 1);
  const 뒤 = measure(V);
  return { 앞: [앞.정본, 앞.펜윅], 뒤: [뒤.정본, 뒤.펜윅] };
}

const 정본이름 = "합치며 세는 판";
const 펜윅이름 = "값 범위를 아는 펜윅 트리 판";

function 칸접근_묶음(고르기: (r: { 정본: 계수; 펜윅: 계수 }) => 계수) {
  return (): Record<string, number> => ({
    "값 범위 2 에서의 칸 접근": 고르기(measure(값범위.가장좁게)).칸접근,
    "값 범위 173,193 에서의 칸 접근": 고르기(measure(값범위.경계앞)).칸접근,
    "값 범위 173,194 에서의 칸 접근": 고르기(measure(값범위.경계)).칸접근,
    "값 범위 1,048,576 에서의 칸 접근": 고르기(measure(값범위.가장넓게)).칸접근,
    "값 범위 8,191 에서의 저장 칸": 고르기(measure(저장경계.같아지는)).저장칸,
    "값 범위 8,192 에서의 저장 칸": 고르기(measure(저장경계.갈리는)).저장칸,
  });
}

export const cases: Record<string, () => Record<string, number>> = {
  [정본이름]: 칸접근_묶음((r) => r.정본),
  [펜윅이름]: 칸접근_묶음((r) => r.펜윅),
};
