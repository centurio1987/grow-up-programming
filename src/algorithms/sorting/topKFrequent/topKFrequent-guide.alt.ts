/**
 * `purpose.alt`(경쟁 설계와의 대조) 가 인용하는 수치의 출처.
 *
 * **같은 입력·같은 `k`** 에 두 설계를 걸고 **결정론적 계수**만 센다. 세는 것은 **기본
 * 연산 수**다 — 맵 연산(읽기·쓰기) + 배열 칸 접근(읽기·쓰기) + 두 수를 견준 횟수.
 * 벽시계·처리량은 실행마다 달라 "본문의 수치가 실측과 같은가" 를 정의할 수 없다.
 *
 *   bun run ../../../../tools/bench-alt.ts topKFrequent-guide.alt.ts
 *
 * **전개 입력을 그대로 못 쓰는 이유.** 전개는 아홉 칸짜리 `[4 4 4 2 2 1 1 3 5]` 에
 * `k = 3` 을 건다. 서로 다른 값이 다섯뿐이라 `k` 를 1 부터 5 까지밖에 못 늘리고, 두 설계의
 * 계수가 스무 몇 번짜리 상수에 묻힌다. 그래서 같은 규칙으로 만든 10 만 칸 입력을 쓰고,
 * 그 생성식을 본문에도 적는다. **난수를 쓰지 않으므로 시드가 없다.**
 */

/** 입력 배열의 칸 수. 문제 제약의 상한이다. */
export const N = 100_000;

/**
 * 입력 배열. 값 `j` 의 등장 횟수를 `1 + (j mod 3)` 으로 두고 앞에서부터 이어 붙인 뒤,
 * 자리를 `A[i] = 이어 붙인 목록[(7919 i) mod N]` 으로 옮긴다. `7919` 가 소수이고
 * `N` 을 나누지 않아 이 대응은 자리의 순열이다.
 *
 * 등장 횟수를 1·2·3 으로 흩는 이유는 두 설계의 갈림이 **등장 횟수의 폭**에 걸려 있기
 * 때문이다. 전부 같은 횟수로 두면 최소 힙이 꼭대기를 한 번도 갈아 끼우지 않아, 힙 쪽에
 * 유리한 입력을 고른 것이 된다.
 */
export const A: number[] = ((): number[] => {
  const flat: number[] = [];
  for (let j = 0; flat.length < N; j++) {
    const f = 1 + (j % 3);
    for (let t = 0; t < f && flat.length < N; t++) flat.push(j);
  }
  const out = new Array<number>(N);
  for (let i = 0; i < N; i++) out[i] = flat[(i * 7919) % N] as number;
  return out;
})();

/** 두 설계가 똑같이 먼저 하는 일 — 등장 횟수를 맵에 센다. */
function countFreq(): { freq: Map<number, number>; ops: number } {
  const freq = new Map<number, number>();
  let ops = 0;
  for (const v of A) {
    ops += 2; // 맵 읽기 + 맵 쓰기
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  return { freq, ops };
}

/**
 * 이 가이드가 가르치는 절차 — **자리 나누기**. `topKFrequent-guide.ref.ts` 와 같은 절차이고
 * 기본 연산 계수만 덧붙였다.
 */
function slotOps(k: number): number {
  const { freq, ops: base } = countFreq();
  let ops = base;
  const slot: number[][] = Array.from({ length: N + 1 }, () => []);
  ops += N + 1; // 자리 N+1 개를 만든다
  for (const [v, f] of freq) {
    ops += 2; // slot[f] 읽기 + 값 담기
    slot[f]?.push(v);
  }
  let got = 0;
  for (let f = N; f >= 1 && got < k; f--) {
    ops += 2; // slot[f] 읽기 + 바깥 조건 견주기
    for (const _v of slot[f] ?? []) {
      ops += 2; // 답에 담기 + 개수 견주기
      got++;
      if (got === k) break;
    }
  }
  return ops;
}

type Entry = [freq: number, value: number];

/**
 * 경쟁 설계 — **크기 `k` 최소 힙**. 고유값을 하나씩 받으며 「지금까지의 상위 `k` 개」만
 * 들고 있는다. 새 값의 등장 횟수가 꼭대기(후보 중 가장 적은 것)보다 크면 꼭대기를 갈아
 * 끼우고, 아니면 버린다. 자리를 `N + 1` 개 잡지 않는 대신 견주기를 남긴다.
 */
function heapOps(k: number): number {
  const { freq, ops: base } = countFreq();
  let ops = base;
  const h: Entry[] = [];

  const up = (start: number): void => {
    let i = start;
    while (i > 0) {
      const p = (i - 1) >> 1;
      ops += 3; // 두 칸 읽기 + 견주기
      if ((h[p] as Entry)[0] <= (h[i] as Entry)[0]) break;
      ops += 2; // 두 칸 쓰기
      const t = h[p] as Entry;
      h[p] = h[i] as Entry;
      h[i] = t;
      i = p;
    }
  };

  const down = (start: number): void => {
    let i = start;
    const m = h.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let s = i;
      if (l < m) {
        ops += 3;
        if ((h[l] as Entry)[0] < (h[s] as Entry)[0]) s = l;
      }
      if (r < m) {
        ops += 3;
        if ((h[r] as Entry)[0] < (h[s] as Entry)[0]) s = r;
      }
      if (s === i) break;
      ops += 2;
      const t = h[i] as Entry;
      h[i] = h[s] as Entry;
      h[s] = t;
      i = s;
    }
  };

  for (const [v, f] of freq) {
    ops += 1; // 후보가 아직 k 개 미만인지 견주기
    if (h.length < k) {
      ops += 1; // 새 후보를 넣는다
      h.push([f, v]);
      up(h.length - 1);
      continue;
    }
    ops += 2; // 꼭대기 읽기 + 견주기
    if (f > (h[0] as Entry)[0]) {
      ops += 2; // 꼭대기 덮어쓰기 + 마지막 칸 읽기
      h[0] = [f, v];
      down(0);
    }
  }
  for (let i = h.length - 1; i >= 0; i--) {
    ops += 3; // 꼭대기 읽기 + 마지막 칸 옮기기 + 답에 담기
    const last = h.pop() as Entry;
    if (h.length > 0) {
      h[0] = last;
      down(0);
    }
  }
  return ops;
}

/** 뒤집히는 자리를 사이에 두고 고른 `k` 다섯 개. 마지막 둘이 경계의 양쪽이다. */
const POINTS = [1, 100, 1_000, 4_299, 4_300, 50_000] as const;

function counts(
  run: (k: number) => number,
  cells: (k: number) => number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of POINTS) {
    out[`k=${k.toLocaleString("en-US")} 기본 연산`] = run(k);
  }
  out["k=50,000 일 때 저장 칸"] = cells(50_000);
  return out;
}

export const cases = {
  "자리 나누기": () => counts(slotOps, () => N + 1),
  "크기 k 최소 힙": () => counts(heapOps, (k) => k),
};
