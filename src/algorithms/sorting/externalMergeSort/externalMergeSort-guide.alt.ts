/**
 * `purpose.alt`(경쟁 설계와의 대조)가 내미는 계수의 출처, 그리고 이 편이 쓰는 **세는 사본**.
 *
 * 이 편의 비용 축은 견주기가 아니라 **입출력**이다. 그런데 정본은 실제로 파일을 읽고 적으므로
 * 계수를 내보내지 않고, `bench-alt.ts` 의 계약(`cases`)은 **동기 함수**라 파일 입출력을 넣을
 * 수 없다. 그래서 여기 있는 것은 정본과 **같은 절차를 메모리 위에서 흉내 내며 세는 사본**이다.
 *
 * **사본이 정본과 같은 절차인지는 답으로 확인한다.** `계수` 를 내는 함수는 매번 정렬 결과를
 * 만들고, 그것이 `[...values].sort((a, b) => a - b)` 와 다르면 던진다. 답이 다른 구현으로 잰
 * 계수는 저울질이 아니라 다른 문제의 값이다(`FEEDBACK.md` §5, 2026-09-03 `S34`).
 * 사본과 정본이 파일 위에서도 같은 개수를 내는지는 `-guide.test.ts` 의 케이스 ②③ 이 진다.
 *
 * 경쟁 설계는 **두 조각씩 여러 바퀴 합치는 판**이다. 정본은 조각 전부를 한 번에 합쳐 합치기가
 * 한 바퀴로 끝나고, 경쟁 설계는 한 바퀴에 두 조각씩만 합쳐 바퀴 수가 늘어난다. 두 판은
 * 조각을 만드는 단계가 글자 그대로 같아서 그 단계의 계수는 갈리지 않는다.
 */

/* ────────────────────────── 입력 ────────────────────────── */

/**
 * 대조와 스윕이 함께 쓰는 결정론적 입력. 난수도 시드도 없고 `N` 하나로 정해진다 —
 * `48,271` 은 `10^9+7` 에 대해 원시근이라 값이 한 자리에 몰리지 않는다.
 */
export function 생성식(N: number): number[] {
  const out: number[] = new Array(N);
  for (let i = 0; i < N; i++) out[i] = ((i * 48_271) % 1_000_003) - 500_000;
  return out;
}

/** 대조가 쓰는 규모. 전개 입력(정수 아홉·조각 크기 3)으로는 조각이 셋뿐이라 바퀴가 안 갈린다. */
export const 대조_N = 100_000;
export const 대조_M = 100;
/** 경쟁 설계가 한 바퀴에 합치는 조각 수. */
export const 대조_k = 2;

/* ────────────────────────── 계수 ────────────────────────── */

export interface 계수 {
  /** 디스크에서 읽은 정수 개수. */
  읽은: number;
  /** 디스크로 적은 정수 개수. */
  적은: number;
  /** 조각을 정렬하며 든 견주기. */
  정렬_견주기: number;
  /** 조각을 합치며 힙이 든 견주기. */
  합치기_견주기: number;
  /** 한 번에 메모리에 든 정수의 최대 개수. */
  최대_정수_칸: number;
  /** 한 번에 동시에 연 조각 파일의 최대 개수. */
  연_조각_파일: number;
  /** 조각 개수. */
  조각: number;
  /** 조각을 하나로 줄일 때까지 합치기를 되풀이한 횟수. */
  합치기_바퀴: number;
}

interface 항목 {
  value: number;
  run: number;
}

/** 정본의 `MinHeap` 과 같은 절차에 견주기 횟수만 덧붙인 사본. */
class 세는힙 {
  private items: 항목[] = [];
  견주기 = 0;

  get size(): number {
    return this.items.length;
  }

  push(entry: 항목): void {
    const items = this.items;
    items.push(entry);
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      this.견주기++;
      if ((items[parent] as 항목).value <= (items[i] as 항목).value) break;
      [items[i], items[parent]] = [items[parent] as 항목, items[i] as 항목];
      i = parent;
    }
  }

  pop(): 항목 {
    const items = this.items;
    const top = items[0] as 항목;
    const last = items.pop() as 항목;
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        let small = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;
        if (left < items.length) {
          this.견주기++;
          if ((items[left] as 항목).value < (items[small] as 항목).value)
            small = left;
        }
        if (right < items.length) {
          this.견주기++;
          if ((items[right] as 항목).value < (items[small] as 항목).value)
            small = right;
        }
        if (small === i) break;
        [items[i], items[small]] = [items[small] as 항목, items[i] as 항목];
        i = small;
      }
    }
    return top;
  }
}

/** 조각 하나를 만드는 단계. 두 판이 글자 그대로 같이 쓴다. */
function 조각_만들기(
  values: number[],
  M: number,
): { 조각들: number[][]; 정렬_견주기: number; 최대_정수_칸: number } {
  const 조각들: number[][] = [];
  let 정렬_견주기 = 0;
  let 최대_정수_칸 = 0;
  let chunk: number[] = [];
  let i = 0;
  for (;;) {
    const value = i < values.length ? (values[i++] as number) : null;
    if (value !== null) {
      chunk.push(value);
      if (chunk.length > 최대_정수_칸) 최대_정수_칸 = chunk.length;
    }
    const full = chunk.length === M;
    const tail = value === null && chunk.length > 0;
    if (full || tail) {
      chunk.sort((a, b) => {
        정렬_견주기++;
        return a - b;
      });
      조각들.push(chunk);
      chunk = [];
    }
    if (value === null) break;
  }
  return { 조각들, 정렬_견주기, 최대_정수_칸 };
}

/** 조각 여럿을 힙 하나로 합쳐 정렬된 배열 하나로 만든다. 읽고 적은 개수도 함께 센다. */
function 합치기(조각들: number[][]): {
  합친것: number[];
  견주기: number;
  읽은: number;
  적은: number;
  최대_정수_칸: number;
} {
  const heap = new 세는힙();
  const 자리 = 조각들.map(() => 0);
  let 읽은 = 0;
  for (let run = 0; run < 조각들.length; run++) {
    const 조각 = 조각들[run] as number[];
    if (조각.length > 0) {
      읽은++;
      heap.push({ value: 조각[자리[run] as number] as number, run });
      (자리 as number[])[run] = (자리[run] as number) + 1;
    }
  }
  let 최대_정수_칸 = heap.size;
  const 합친것: number[] = [];
  while (heap.size > 0) {
    const { value, run } = heap.pop();
    합친것.push(value);
    const 조각 = 조각들[run] as number[];
    if ((자리[run] as number) < 조각.length) {
      읽은++;
      heap.push({ value: 조각[자리[run] as number] as number, run });
      (자리 as number[])[run] = (자리[run] as number) + 1;
    }
    if (heap.size > 최대_정수_칸) 최대_정수_칸 = heap.size;
  }
  return {
    합친것,
    견주기: heap.견주기,
    읽은,
    적은: 합친것.length,
    최대_정수_칸,
  };
}

/** 답이 정렬 결과와 같은지 매번 확인한다. 다르면 그 계수는 다른 문제의 값이다. */
function 답_확인(합친것: number[], values: number[], 이름: string): void {
  const 정답 = [...values].sort((a, b) => a - b);
  if (합친것.length !== 정답.length) {
    throw new Error(
      `${이름} 의 답 길이가 다르다 — ${합친것.length} ≠ ${정답.length}`,
    );
  }
  for (let i = 0; i < 정답.length; i++) {
    if (합친것[i] !== 정답[i]) {
      throw new Error(`${이름} 의 답이 ${i} 번째에서 갈린다`);
    }
  }
}

/** 정본 — 조각을 만든 뒤 **전부 한 번에** 합친다. 합치기가 한 바퀴로 끝난다. */
export function 한번에_합치기(values: number[], M: number): 계수 {
  const 만들기 = 조각_만들기(values, M);
  const 조각들 = 만들기.조각들;
  const 합침 = 합치기(조각들);
  답_확인(합침.합친것, values, "한 번에 합치는 판");
  return {
    읽은: values.length + 합침.읽은,
    적은: values.length + 합침.적은,
    정렬_견주기: 만들기.정렬_견주기,
    합치기_견주기: 합침.견주기,
    최대_정수_칸: Math.max(만들기.최대_정수_칸, 합침.최대_정수_칸),
    연_조각_파일: 조각들.length,
    조각: 조각들.length,
    합치기_바퀴: 1,
  };
}

/** 경쟁 설계 — 한 바퀴에 `k` 조각씩만 합쳐 조각이 하나가 될 때까지 되풀이한다. */
export function 여러바퀴_합치기(values: number[], M: number, k: number): 계수 {
  const 만들기 = 조각_만들기(values, M);
  let 층: number[][] = 만들기.조각들;
  let 읽은 = values.length;
  let 적은 = values.length;
  let 견주기 = 0;
  let 최대_정수_칸 = 만들기.최대_정수_칸;
  let 바퀴 = 0;
  const 조각 = 층.length;

  if (층.length === 1) {
    // 조각이 하나여도 출력 파일은 따로 있어야 하므로 한 바퀴가 든다.
    바퀴 = 1;
    const 합침 = 합치기(층);
    읽은 += 합침.읽은;
    적은 += 합침.적은;
    견주기 += 합침.견주기;
    최대_정수_칸 = Math.max(최대_정수_칸, 합침.최대_정수_칸);
    답_확인(합침.합친것, values, "여러 바퀴 합치는 판");
    층 = [합침.합친것];
  }

  while (층.length > 1) {
    바퀴++;
    const 다음: number[][] = [];
    for (let at = 0; at < 층.length; at += k) {
      const 묶음 = 층.slice(at, at + k);
      if (묶음.length === 1) {
        // 짝이 없는 조각은 읽지도 적지도 않고 다음 바퀴로 넘긴다.
        다음.push(묶음[0] as number[]);
        continue;
      }
      const 합침 = 합치기(묶음);
      읽은 += 합침.읽은;
      적은 += 합침.적은;
      견주기 += 합침.견주기;
      최대_정수_칸 = Math.max(최대_정수_칸, 합침.최대_정수_칸);
      다음.push(합침.합친것);
    }
    층 = 다음;
  }
  답_확인(층[0] as number[], values, "여러 바퀴 합치는 판");

  return {
    읽은,
    적은,
    정렬_견주기: 만들기.정렬_견주기,
    합치기_견주기: 견주기,
    최대_정수_칸,
    연_조각_파일: Math.min(k, 조각),
    조각,
    합치기_바퀴: 바퀴,
  };
}

/* ─────────────── 규모가 커도 셀 수 있는 닫힌 형태 ─────────────── */

/** 조각 수 `R = ⌈N/M⌉`. */
export const 조각수 = (N: number, M: number): number => Math.ceil(N / M);

/** 한 번에 합칠 때 메모리에 드는 정수 칸 — `max(min(N, M), R)`. */
export function 메모리_칸(N: number, M: number): number {
  return Math.max(Math.min(N, M), 조각수(N, M));
}

/** `k` 조각씩 합칠 때의 합치기 바퀴 수. 조각이 하나여도 출력 한 바퀴가 든다. */
export function 바퀴수(R: number, k: number): number {
  if (R <= 1) return 1;
  let 남은 = R;
  let 바퀴 = 0;
  while (남은 > 1) {
    남은 = Math.ceil(남은 / k);
    바퀴++;
  }
  return 바퀴;
}

/** 읽고 적은 정수 개수 — 조각 만들기 `2N` 에 합치기 바퀴마다 `2N` 이 붙는다. */
export const 입출력 = (N: number, R: number, k: number): number =>
  2 * N + 2 * N * 바퀴수(R, k);

/* ─────────────── 얇은 창구 — 테스트와 증명이 함께 쓴다 ─────────────── */

export function 메모리와_입출력(
  N: number,
  M: number,
): { 최대_정수_칸: number; 입출력: number; 조각: number } {
  const c = 한번에_합치기(생성식(N), M);
  return {
    최대_정수_칸: c.최대_정수_칸,
    입출력: c.읽은 + c.적은,
    조각: c.조각,
  };
}

/* ────────────────────────── bench-alt 계약 ────────────────────────── */

const 값 = 생성식(대조_N);
const 한번에 = 한번에_합치기(값, 대조_M);
const 여러바퀴 = 여러바퀴_합치기(값, 대조_M, 대조_k);

export const cases: Record<string, () => Record<string, number>> = {
  "조각을 한 번에 합치기": () => {
    const c = 한번에_합치기(생성식(대조_N), 대조_M);
    return {
      입출력: c.읽은 + c.적은,
      합치기_견주기: c.합치기_견주기,
      메모리_정수_칸: c.최대_정수_칸,
      연_조각_파일: c.연_조각_파일,
    };
  },
  "두 조각씩 여러 바퀴 합치기": () => {
    const c = 여러바퀴_합치기(생성식(대조_N), 대조_M, 대조_k);
    return {
      입출력: c.읽은 + c.적은,
      합치기_견주기: c.합치기_견주기,
      메모리_정수_칸: c.최대_정수_칸,
      연_조각_파일: c.연_조각_파일,
    };
  },
};

export const 대조_계수 = { 한번에, 여러바퀴 };
