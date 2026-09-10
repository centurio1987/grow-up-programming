/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/algorithms/graph/countIslands/countIslands-guide.alt.ts
 *
 * **전개 입력도 함께 잰다**(L20). 다만 3×4 격자는 칸이 열둘이라 두 설계의 계수가 28 대 30
 * 으로 두 개밖에 안 갈린다 — 그 차이가 설계의 성질에서 온 것인지 격자가 작아서 그런 것인지
 * 구분되지 않는다. 그래서 우열이 뒤집히는 자리를 보이는 데는 **칸 수를 맞춘 100×100 격자
 * 두 장**(전부 땅 · 체커보드)과 **갱신이 붙는 작업 목록**을 더 쓰고, 그 사실을 본문 대조
 * 문단에도 적는다.
 *
 * 한 번 정한 입력은 수치가 마음에 안 든다는 이유로 바꾸지 않는다(L20).
 */

/** 상 · 하 · 좌 · 우. */
const DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/* ────────────────────────── 고정 입력 ────────────────────────── */

/** 본문 전개가 쓰는 3×4 격자. 섬 셋이고 그중 하나는 대각선으로만 닿아 갈린다. */
export const WALK: number[][] = [
  [1, 1, 0, 1],
  [1, 0, 0, 1],
  [0, 0, 1, 0],
];

/** 대조용 격자의 한 변. 두 장 다 칸 수가 `SIDE²` 로 같다. */
export const SIDE = 100;

/** 갱신이 붙는 작업 목록의 길이. 땅 칸을 하나씩 켜고 켤 때마다 섬 수를 묻는다. */
export const UPDATES = 200;

/** 한 변이 `m` 인 전부 땅 격자. 섬이 하나이고 그 하나가 모든 칸을 담는다. */
export function 전부땅(m: number): number[][] {
  return Array.from({ length: m }, () => new Array<number>(m).fill(1));
}

/** 한 변이 `m` 인 체커보드. 땅 칸이 서로 대각선으로만 닿아 섬이 `⌈m²/2⌉` 개다. */
export function 체커보드(m: number): number[][] {
  return Array.from({ length: m }, (_, r) =>
    Array.from({ length: m }, (_, c) => ((r + c) % 2 === 0 ? 1 : 0)),
  );
}

/**
 * 갱신 목록 — 물뿐인 `SIDE × SIDE` 격자에 땅을 하나씩 켜는 좌표를 행 우선으로 늘어놓는다.
 * 붙어서 켜지므로 합쳐지는 자리가 실제로 생긴다.
 */
export function 갱신목록(q: number): [number, number][] {
  return Array.from({ length: q }, (_, i) => [Math.floor(i / 20), i % 20]) as [
    number,
    number,
  ][];
}

/* ────────────────────────── 두 설계 ────────────────────────── */

/**
 * 이 가이드의 절차. 정본(`countIslands-guide.ref.ts`)과 같고 세는 자리만 덧붙였다.
 *
 * `칸읽기` 는 `grid` 에서 값을 하나 읽은 횟수, `보조접근` 은 표시 배열 `seen` 을 읽거나 쓴
 * 횟수다. `새칸` 은 새로 잡는 칸의 수 — 표시 배열 `R·C` 칸과 스택이 자란 최대 길이다.
 */
function 가이드절차(grid: number[][]): {
  섬: number;
  칸읽기: number;
  보조접근: number;
  새칸: number;
} {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const seen: boolean[] = Array.from({ length: R * C }, () => false);
  const stack: number[] = [];
  let islands = 0;
  let 칸읽기 = 0;
  let 보조접근 = 0;
  let 최대 = 0;

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const start = r * C + c;
      칸읽기++;
      if ((grid[r] as number[])[c] === 0) continue;
      보조접근++;
      if (seen[start] === true) continue;

      islands++;
      보조접근++;
      seen[start] = true;
      stack.push(start);
      최대 = Math.max(최대, stack.length);

      while (stack.length > 0) {
        const cur = stack.pop() as number;
        const cr = Math.floor(cur / C);
        const cc = cur % C;
        for (const [dr, dc] of DIRS) {
          const nr = cr + dr;
          const nc = cc + dc;
          if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
          칸읽기++;
          if ((grid[nr] as number[])[nc] === 0) continue;
          const next = nr * C + nc;
          보조접근++;
          if (seen[next] === true) continue;
          보조접근++;
          seen[next] = true;
          stack.push(next);
          최대 = Math.max(최대, stack.length);
        }
      }
    }
  }
  return { 섬: islands, 칸읽기, 보조접근, 새칸: R * C + 최대 };
}

/**
 * 경쟁 설계 — **서로소 집합**(union-find).
 *
 * 격자를 행 우선으로 한 번 통과하면서 땅 칸마다 자기 집합을 만들고 **왼쪽·위의 땅 칸과
 * 합친다.** 섬 수는 「땅 칸 수 − 실제로 합쳐진 횟수」다. 탐색이 없으므로 스택도 없고,
 * 대신 `parent` 와 `size` 두 배열이 격자 크기만큼 든다.
 *
 * 합칠 때 큰 쪽에 붙이고(union by size) 찾을 때 경로를 접는다(path compression) — 둘 다
 * 없으면 사슬이 길어져 접근 횟수가 결정론적이긴 해도 무의미하게 커진다.
 */
function 서로소집합(grid: number[][]): {
  섬: number;
  칸읽기: number;
  보조접근: number;
  새칸: number;
} {
  const R = grid.length;
  const C = R === 0 ? 0 : (grid[0] as number[]).length;
  const parent: number[] = Array.from({ length: R * C }, () => -1);
  const size: number[] = Array.from({ length: R * C }, () => 0);
  let 칸읽기 = 0;
  let 보조접근 = 0;
  let 땅 = 0;
  let 합침 = 0;

  const find = (x: number): number => {
    let root = x;
    보조접근++;
    while ((parent[root] as number) !== root) {
      root = parent[root] as number;
      보조접근++;
    }
    let cur = x;
    while ((parent[cur] as number) !== cur) {
      const next = parent[cur] as number;
      parent[cur] = root;
      보조접근 += 2;
      cur = next;
    }
    return root;
  };

  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    보조접근 += 2;
    const [big, small] =
      (size[ra] as number) >= (size[rb] as number) ? [ra, rb] : [rb, ra];
    parent[small] = big;
    size[big] = (size[big] as number) + (size[small] as number);
    보조접근 += 3;
    합침++;
  };

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      칸읽기++;
      if ((grid[r] as number[])[c] === 0) continue;
      const id = r * C + c;
      parent[id] = id;
      size[id] = 1;
      보조접근 += 2;
      땅++;
      if (c > 0) {
        칸읽기++;
        if ((grid[r] as number[])[c - 1] === 1) union(id, id - 1);
      }
      if (r > 0) {
        칸읽기++;
        if ((grid[r - 1] as number[])[c] === 1) union(id, id - C);
      }
    }
  }
  return { 섬: 땅 - 합침, 칸읽기, 보조접근, 새칸: 2 * (R * C) };
}

/* ─────────────────── 갱신이 붙는 작업 목록 ─────────────────── */

/**
 * 물뿐인 격자에 땅을 하나씩 켜고 **켤 때마다** 섬 수를 묻는다.
 *
 * 이 가이드의 절차는 상태를 남기지 않으므로 갱신마다 격자를 처음부터 다시 통과한다.
 * 서로소 집합은 켠 칸 하나를 집합에 넣고 네 이웃과 합치는 것으로 끝난다.
 */
function 온라인_가이드(q: number): { 칸읽기: number; 답: number[] } {
  const grid = Array.from({ length: SIDE }, () =>
    new Array<number>(SIDE).fill(0),
  );
  let 칸읽기 = 0;
  const 답: number[] = [];
  for (const [r, c] of 갱신목록(q)) {
    (grid[r] as number[])[c] = 1;
    const got = 가이드절차(grid);
    칸읽기 += got.칸읽기;
    답.push(got.섬);
  }
  return { 칸읽기, 답 };
}

function 온라인_서로소집합(q: number): { 칸읽기: number; 답: number[] } {
  const grid = Array.from({ length: SIDE }, () =>
    new Array<number>(SIDE).fill(0),
  );
  const parent: number[] = Array.from({ length: SIDE * SIDE }, () => -1);
  let 칸읽기 = 0;
  let 섬 = 0;
  const 답: number[] = [];
  const find = (x: number): number => {
    let root = x;
    while ((parent[root] as number) !== root) root = parent[root] as number;
    let cur = x;
    while ((parent[cur] as number) !== cur) {
      const next = parent[cur] as number;
      parent[cur] = root;
      cur = next;
    }
    return root;
  };
  for (const [r, c] of 갱신목록(q)) {
    (grid[r] as number[])[c] = 1;
    const id = r * SIDE + c;
    parent[id] = id;
    섬++;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= SIDE || nc < 0 || nc >= SIDE) continue;
      칸읽기++;
      if ((grid[nr] as number[])[nc] === 0) continue;
      const ra = find(id);
      const rb = find(nr * SIDE + nc);
      if (ra === rb) continue;
      parent[rb] = ra;
      섬--;
    }
    답.push(섬);
  }
  return { 칸읽기, 답 };
}

/* ────────────────────────── 계수 ────────────────────────── */

const 전부땅격자 = 전부땅(SIDE);
const 체커보드격자 = 체커보드(SIDE);

function 재기(
  run: (grid: number[][]) => {
    섬: number;
    칸읽기: number;
    보조접근: number;
    새칸: number;
  },
  online: (q: number) => { 칸읽기: number; 답: number[] },
): Record<string, number> {
  const w = run(WALK);
  const f = run(전부땅격자);
  const k = run(체커보드격자);
  const o = online(UPDATES);
  // 두 설계가 **같은 답**을 내는지부터 확인한다. 다르면 대조가 성립하지 않는다.
  if (w.섬 !== 3 || f.섬 !== 1 || k.섬 !== (SIDE * SIDE) / 2) {
    throw new Error(
      `섬 수가 어긋난다 — 전개 ${w.섬} · 전부 땅 ${f.섬} · 체커보드 ${k.섬}`,
    );
  }
  if (o.답.length !== UPDATES || o.답[UPDATES - 1] !== 1) {
    throw new Error(`갱신 결과가 어긋난다 — 마지막 섬 수 ${o.답[UPDATES - 1]}`);
  }
  return {
    "전개 입력 · 칸 읽기": w.칸읽기,
    "전부 땅 · 칸 읽기": f.칸읽기,
    "전부 땅 · 보조 배열 접근": f.보조접근,
    "체커보드 · 보조 배열 접근": k.보조접근,
    "추가로 잡는 칸": f.새칸,
    "갱신 200회 · 칸 읽기": o.칸읽기,
  };
}

export const cases = {
  "이 가이드의 절차": () => 재기(가이드절차, 온라인_가이드),
  "서로소 집합": () => 재기(서로소집합, 온라인_서로소집합),
};
