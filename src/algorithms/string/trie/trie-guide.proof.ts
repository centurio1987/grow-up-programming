/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 * 걸음마다의 상태는 정본과 같은 절차에 세는 자리만 덧붙인 사본(`buildTrie` · `trieWalk` ·
 * `walkSteps`)이 낸다. 그 사본이 정본과 같은 트라이를 만드는지는 이 파일이 읽힐 때 정본의 뿌리를
 * 직접 열어 대조한다(아래 「사본 대조」). 그림 사이드카(`.fig.tsx`)도 같은 기록을 쓴다.
 *
 *   bun run tools/check-proof.ts src/algorithms/string/trie/trie-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { 과와, 으로, 은는 } from "../../../../tools/josa.ts";
import { arrayCells, CORPUS, trieCells } from "./trie-guide.alt.ts";
import { Trie } from "./trie-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 천 단위 구분. 본문 표기와 같다. */
export const num = (n: number): string => n.toLocaleString("en-US");

/** 마크다운 표. `right` 에 든 열만 오른쪽 정렬이다. */
function md(
  head: string[],
  rows: string[][],
  right: readonly number[] = [],
): string {
  const rule = head.map((_, c) => (right.includes(c) ? "---:" : "---"));
  const line = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [line(head), line(rule), ...rows.map(line)].join("\n");
}

export const yn = (b: boolean): string => (b ? "참" : "거짓");

/** 노드 이름 — 경로 문자열. 뿌리만 「뿌리」다. */
export const nodeName = (path: string): string => (path === "" ? "뿌리" : path);

/** 표 칸의 코드 표기. */
const code = (s: string): string => `\`${s}\``;

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 셋을 이 순서로 넣으면 삽입의 세 경우가 다 나온다 — 전부 새로 만드는 삽입(`app`),
 * 앞부분을 이어 쓰고 뒤만 만드는 삽입(`apple`), 도중에 다른 글자로 나뉘는 삽입(`ape`).
 * 조회 넷은 답이 참·거짓 둘씩이고, `search` 와 `startsWith` 가 **같은 문자열에서 다른 답을
 * 내는 자리**(`appl`)를 포함한다.
 */
export const WORDS = ["app", "apple", "ape"] as const;

type Op = "search" | "startsWith";

/** 전개가 쓰는 조회 넷. `[연산, 문자열]` 이다. */
export const QUERIES: readonly (readonly [Op, string])[] = [
  ["search", "app"],
  ["search", "appl"],
  ["startsWith", "appl"],
  ["startsWith", "bat"],
];

/** 과제 규모 — 담은 단어의 길이 합의 최댓값. */
export const LIMIT = 100_000;

/** 단순한 방법을 반박할 때 거는 조회 횟수. */
export const Q = 100_000;

/** 단순 연산을 1 초에 몇 번 하는가 — 예산을 대어 보는 기준. */
const OPS_PER_SEC = 1e8;

/** 과제 규모 사전의 단어 수와 단어 길이. 곱이 정확히 `LIMIT` 이다. */
export const DICT_N = 1000;
const DICT_L = 100;

/** 소문자 세 글자로 적은 `i` — 사전의 단어를 서로 다르게 만드는 자리다. */
function base26(i: number): string {
  const a = "abcdefghijklmnopqrstuvwxyz";
  return `${a[Math.floor(i / 676) % 26]}${a[Math.floor(i / 26) % 26]}${a[i % 26]}`;
}

/** 앞 97 글자가 전부 같은 단어 1,000 개. 길이 합이 정확히 100,000 이다. */
export const SHARED_DICT: string[] = Array.from(
  { length: DICT_N },
  (_, i) => "a".repeat(DICT_L - 3) + base26(i),
);

/** 그 사전에 없는 길이 100 짜리 조회. 앞 97 글자까지 맞고 98 번째에서 어긋난다. */
export const SHARED_QUERY = `${"a".repeat(DICT_L - 3)}zzz`;

/* ────────────────────── 계측 사본 — 트라이 쪽 ────────────────────── */

export interface Node {
  children: Map<string, Node>;
  end: boolean;
}
const node = (): Node => ({ children: new Map(), end: false });

/** 정본과 같은 절차의 사본. 계수를 붙일 자리만 있다. */
export function buildTrie(words: readonly string[]): Node {
  const root = node();
  for (const w of words) {
    let cur = root;
    for (const ch of w) {
      let next = cur.children.get(ch);
      if (next === undefined) {
        next = node();
        cur.children.set(ch, next);
      }
      cur = next;
    }
    cur.end = true;
  }
  return root;
}

/**
 * 노드 수를 센다. **재귀로 짜지 않는다** — 길이 100,000 짜리 단어 하나만 담아도 깊이가
 * 100,000 이라 호출 스택이 넘친다. 그 실패는 본문의 짚고 가기 하나가 다루는 자리다.
 */
export function countNodes(root: Node): number {
  const stack: Node[] = [root];
  let sum = 0;
  while (stack.length > 0) {
    const n = stack.pop() as Node;
    sum++;
    for (const c of n.children.values()) stack.push(c);
  }
  return sum;
}

/** 노드마다 `[경로 문자열, 끝 표시]` — 너비 우선, 자식은 만든 차례다. */
export function shapeOf(root: Node): [string, boolean][] {
  const out: [string, boolean][] = [];
  const queue: [string, Node][] = [["", root]];
  for (let i = 0; i < queue.length; i++) {
    const [path, n] = queue[i] as [string, Node];
    out.push([path, n.end]);
    for (const [ch, kid] of n.children) queue.push([path + ch, kid]);
  }
  return out;
}

/** 조회 하나의 답. `search` 만 끝 표시까지 본다. */
function answerOf(n: Node | null, op: Op): boolean {
  if (n === null) return false;
  return op === "search" ? n.end : true;
}

/** 글자를 따라 내려가며 자식 맵 조회 횟수를 센다. */
export function trieWalk(
  root: Node,
  s: string,
): { node: Node | null; read: number } {
  let cur: Node | undefined = root;
  let read = 0;
  for (const ch of s) {
    read++;
    cur = cur.children.get(ch);
    if (cur === undefined) return { node: null, read };
  }
  return { node: cur, read };
}

/** 정본 `Trie` 의 뿌리를 연다 — `private` 는 타입 검사에서만 막힌다. */
const refRoot = (t: Trie): Node => (t as unknown as { root: Node }).root;

/** 세 단어를 담은 정본. */
function refTrie(words: readonly string[] = WORDS): Trie {
  const t = new Trie();
  for (const w of words) t.insert(w);
  return t;
}

/* ────────────────────── 계측 사본 — 목록 쪽 ────────────────────── */

/** 단어 하나를 앞에서부터 대조한다 — 어긋나는 자리까지 읽는다. */
function matchOne(w: string, q: string): { read: number; matched: number } {
  let k = 0;
  let read = 0;
  while (k < q.length && k < w.length) {
    read++;
    if (w[k] !== q[k]) break;
    k++;
  }
  return { read, matched: k };
}

/**
 * 단어를 배열에 담고 매번 앞에서부터 대조하는 방식. 단어 하나마다 **어긋나는 자리까지**
 * 글자를 읽고, 답이 정해지면 거기서 멈춘다.
 */
export function listQuery(
  words: readonly string[],
  q: string,
  mode: Op,
): { answer: boolean; read: number } {
  let read = 0;
  for (const w of words) {
    const m = matchOne(w, q);
    read += m.read;
    if (m.matched < q.length) continue;
    if (mode === "startsWith") return { answer: true, read };
    if (w.length === q.length) return { answer: true, read };
  }
  return { answer: false, read };
}

/** 첫 글자로만 나눠 담는 후보 — 묶음을 고르는 데 1, 그 안에서는 목록 대조와 같다. */
export function bucketQuery(
  words: readonly string[],
  q: string,
): { answer: boolean; read: number } {
  const inner = listQuery(
    words.filter((w) => w[0] === q[0]),
    q,
    "startsWith",
  );
  return { answer: inner.answer, read: inner.read + 1 };
}

/* ────────────────────── 사본 대조 ────────────────────── */

// 사본이 정본과 같은 트라이를 만드는가 — 정본의 뿌리를 직접 열어 모양을 맞댄다.
{
  const want = JSON.stringify(shapeOf(refRoot(refTrie())));
  const got = JSON.stringify(shapeOf(buildTrie(WORDS)));
  if (want !== got) {
    throw new Error(
      `계측 사본이 정본과 다른 트라이를 만든다 — ${got} / ${want}`,
    );
  }
}

/* ────────────────────── 전개 걸음 ────────────────────── */

/** 자식 조회 하나 — 글자와 그 자식이 있었는가. */
export interface Look {
  readonly ch: string;
  readonly found: boolean;
}

/** 걸음 하나의 기록. 무대(그림 사이드카)와 표(`walkTrace`)가 이것 하나를 쓴다. */
export interface WalkStep {
  readonly t: number;
  readonly kind: "start" | "insert" | "query";
  /** `insert("app")` · `search("appl")` 꼴. 시작 걸음은 빈 문자열. */
  readonly op: string;
  readonly queryOp: Op | null;
  /** 이 연산이 읽는 문자열 전체. */
  readonly word: string;
  /** 이 걸음이 읽은 글자 `[from, to)`. */
  readonly from: number;
  readonly to: number;
  readonly looks: readonly Look[];
  /** 이 걸음이 출발한 노드의 경로. */
  readonly startAt: string;
  /** 이 걸음이 만든 노드 · 이어 쓴 노드의 경로. */
  readonly made: readonly string[];
  readonly reused: readonly string[];
  /** 걸음이 끝난 자리. 조회가 도중에 끊기면 `null`. */
  readonly at: string | null;
  /** 이 걸음이 끝 표시를 참으로 두었는가. */
  readonly endSet: boolean;
  readonly answer: boolean | null;
  /** 이 걸음이 지난 갈래 라벨. */
  readonly branches: readonly string[];
  /** 걸음이 끝난 뒤의 트라이 — `[경로, 끝 표시]`. */
  readonly shape: readonly (readonly [string, boolean])[];
}

/**
 * 삽입 셋의 걸음 나누기 — 글자 묶음마다 한 걸음이다. 새로 만든 자리와 이어 쓴 자리가 한 걸음에
 * 섞이지 않게 나눴다(`apple` 의 앞 세 글자는 이어 쓰고 뒤 두 글자는 만든다).
 */
const INSERT_GROUPS: readonly (readonly [string, readonly number[]])[] = [
  ["app", [1, 1, 1]],
  ["apple", [3, 2]],
  ["ape", [3]],
];

/** T1 부터 T11 까지를 실제 실행에서 만든다. */
export function walkSteps(): WalkStep[] {
  const root = node();
  const steps: WalkStep[] = [
    {
      t: 1,
      kind: "start",
      op: "",
      queryOp: null,
      word: "",
      from: 0,
      to: 0,
      looks: [],
      startAt: "",
      made: [],
      reused: [],
      at: "",
      endSet: false,
      answer: null,
      branches: [],
      shape: shapeOf(root),
    },
  ];
  let t = 1;
  for (const [word, groups] of INSERT_GROUPS) {
    let cur = root;
    let done = 0;
    for (const [gi, g] of groups.entries()) {
      const looks: Look[] = [];
      const made: string[] = [];
      const reused: string[] = [];
      const branches: string[] = gi === 0 ? ["①"] : [];
      const startAt = word.slice(0, done);
      for (let k = 0; k < g; k++) {
        const ch = word[done + k] as string;
        const path = word.slice(0, done + k + 1);
        let next = cur.children.get(ch);
        if (next === undefined) {
          next = node();
          cur.children.set(ch, next);
          made.push(path);
          looks.push({ ch, found: false });
          branches.push("② 참");
        } else {
          reused.push(path);
          looks.push({ ch, found: true });
          branches.push("② 거짓");
        }
        cur = next;
      }
      done += g;
      const last = done === word.length;
      if (last) {
        cur.end = true;
        branches.push("③");
      }
      t++;
      steps.push({
        t,
        kind: "insert",
        op: `insert("${word}")`,
        queryOp: null,
        word,
        from: done - g,
        to: done,
        looks,
        startAt,
        made,
        reused,
        at: word.slice(0, done),
        endSet: last,
        answer: null,
        branches: [...new Set(branches)],
        shape: shapeOf(root),
      });
    }
  }
  for (const [op, q] of QUERIES) {
    const looks: Look[] = [];
    const reused: string[] = [];
    let cur: Node = root;
    let at: string | null = "";
    for (const [k, ch] of [...q].entries()) {
      const next = cur.children.get(ch);
      looks.push({ ch, found: next !== undefined });
      if (next === undefined) {
        at = null;
        break;
      }
      reused.push(q.slice(0, k + 1));
      cur = next;
      at = q.slice(0, k + 1);
    }
    const answer = answerOf(at === null ? null : cur, op);
    t++;
    steps.push({
      t,
      kind: "query",
      op: `${op}("${q}")`,
      queryOp: op,
      word: q,
      from: 0,
      to: looks.length,
      looks,
      startAt: "",
      made: [],
      reused,
      at,
      endSet: false,
      answer,
      branches: [...(at === null ? ["⑥"] : []), op === "search" ? "④" : "⑤"],
      shape: shapeOf(root),
    });
  }
  // 조회의 답이 정본과 같은가 — 정본에 같은 조회를 다시 건다.
  const ref = refTrie();
  for (const s of steps) {
    if (s.queryOp === null) continue;
    if (ref[s.queryOp](s.word) !== s.answer) {
      throw new Error(`T${s.t} 의 답이 정본과 다르다`);
    }
  }
  return steps;
}

/** 자식 조회를 한 칸에 — `a · p · p 있음` 꼴. 있음과 없음이 섞이면 둘로 나눠 적는다. */
export function looksText(looks: readonly Look[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < looks.length) {
    const found = (looks[i] as Look).found;
    const run: string[] = [];
    while (i < looks.length && (looks[i] as Look).found === found) {
      run.push((looks[i] as Look).ch);
      i++;
    }
    parts.push(`${run.join(" · ")} ${found ? "있음" : "없음"}`);
  }
  return parts.join(", ");
}

/** 갈래 라벨을 뜻과 함께 — 표의 「갈래」 칸. */
export function branchText(s: WalkStep): string {
  const say: Record<string, string> = {
    "①": "① 뿌리에서 출발",
    "② 참": "② 참 → 만든다",
    "② 거짓": "② 거짓 → 이어 쓴다",
    "③": "③ end = 참",
    "⑥": "⑥ null",
  };
  return s.branches
    .map((b) => {
      if (b === "④") return `④ end = ${yn(s.answer ?? false)}`;
      if (b === "⑤") return `⑤ ${s.at === null ? "거짓" : "도착 → 참"}`;
      return say[b] ?? b;
    })
    .join(" · ");
}

/* ────────────────────── 변이 — 정본 소스에서 기계로 만든다 ────────────────────── */

/**
 * `PROOFS` 의 함수는 **동기**여야 한다(`check-proof.ts` 가 `make()` 를 그대로 부른다).
 * 그래서 변이는 여기서 최상위 `await` 로 한 번만 만들어 둔다.
 */
const REF = new URL("./trie-guide.ref.ts", import.meta.url).pathname;
type Impl = { Trie: typeof Trie };

/** 자식이 있는지 보지 않고 글자마다 새 노드를 만든다. */
const alwaysNewNode = await loadMutant<Impl>(REF, {
  swap: [/let next = node\.children\.get\(ch\);/, "let next = undefined;"],
});

/** 끝 표시를 보지 않는다 — `search` 가 경로의 존재만 본다. */
const ignoreEndFlag = await loadMutant<Impl>(REF, {
  swap: [/return node !== null \? node\.end : false;/, "return node !== null;"],
});

/** 한 글자를 지날 때마다 뿌리로 되돌아간다 — 경로가 이어지지 않는다. */
const resetToRoot = await loadMutant<Impl>(REF, {
  swap: [/node = next;/, "node = this.root;"],
});

/**
 * 트라이의 **노드 경로 집합**을 밖에서 얻는다 — `startsWith(s)` 가 참인 `s` 전부다.
 * 내부를 들여다보지 않고 공개 연산만 쓰므로, 변이본에도 그대로 걸린다.
 */
function pathSet(trie: { startsWith(s: string): boolean }): string[] {
  const alphabet = [..."aplebt"];
  const found: string[] = [];
  let level = [""];
  for (let depth = 0; depth <= 5 && level.length > 0; depth++) {
    const next: string[] = [];
    for (const s of level) {
      if (!trie.startsWith(s)) continue;
      found.push(s);
      for (const ch of alphabet) next.push(s + ch);
    }
    level = next;
  }
  return found;
}

/** 경로마다 끝 표시 — 변이본도 공개 연산(`search`)으로 읽는다. */
function shapeByOps(trie: Trie): [string, boolean][] {
  return pathSet(trie).map((p) => [p, trie.search(p)]);
}

/** 불변식 ③ 의 그림 — 정본과 경로를 안 잇는 변이가 같은 세 단어로 만든 모양. */
export function mutantShapes(): {
  good: [string, boolean][];
  bad: [string, boolean][];
} {
  const bad = new resetToRoot.Trie();
  for (const w of WORDS) bad.insert(w);
  return { good: shapeByOps(refTrie()), bad: shapeByOps(bad) };
}

/* ────────────────────── 증명 블록 ────────────────────── */

const lengthSum = (ws: readonly string[]): number =>
  ws.reduce((a, w) => a + w.length, 0);

/** 초당 1 억 번으로 잰 시간. */
export const secondsOf = (ops: number): string =>
  `${(ops / OPS_PER_SEC).toFixed(2)} 초`;

/** 앞 97 글자 사전에서 없는 조회 하나를 세 방식으로 읽은 글자 수. */
export function worstQueryReads(): {
  list: number;
  bucket: number;
  trie: number;
} {
  return {
    list: listQuery(SHARED_DICT, SHARED_QUERY, "startsWith").read,
    bucket: bucketQuery(SHARED_DICT, SHARED_QUERY).read,
    trie: trieWalk(buildTrie(SHARED_DICT), SHARED_QUERY).read,
  };
}

/** 두 조회의 답을 판정 열과 함께 — 변이 표 셋이 같은 모양을 쓴다. */
function verdictRows(
  good: Trie,
  bad: Trie,
  qs: readonly (readonly [Op, string])[],
): { rows: string[][]; wrong: number } {
  let wrong = 0;
  const rows = qs.map(([op, q]) => {
    const a = good[op](q);
    const b = bad[op](q);
    if (a !== b) wrong++;
    return [code(`${op}("${q}")`), yn(a), yn(b), a === b ? "같다" : "틀리다"];
  });
  return { rows, wrong };
}

export const PROOFS: Record<string, () => string> = {
  /** `concept` — 같은 문자열에서 두 조회의 답이 갈리는 자리. */
  "concept-answers": () => {
    const trie = refTrie();
    const root = buildTrie(WORDS);
    const qs = ["app", "appl", "apple", "apz", "bat"];
    const rows = qs.map((s) => {
      const hit = trieWalk(root, s).node;
      return [
        code(s),
        hit === null ? "없다" : "있다",
        hit === null ? "-" : hit.end ? "있다" : "없다",
        yn(trie.search(s)),
        yn(trie.startsWith(s)),
      ];
    });
    const split = qs.filter((s) => trie.search(s) !== trie.startsWith(s));
    return [
      md(["문자열", "그 경로의 노드", "끝 표시", "search", "startsWith"], rows),
      "",
      `두 연산의 답이 갈리는 문자열은 ${split.map(code).join(" · ")} ${split.length} 개이고, 그 자리에는 노드가 있지만 끝 표시가 없습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ② — 가장 단순한 방법을 과제 규모에서 수치로 반박한다. */
  "origin-cost": () => {
    const r = worstQueryReads();
    const rows = [1000, Q].map((q) => [
      num(q),
      num(r.list * q),
      num(r.trie * q),
      secondsOf(r.list * q),
    ]);
    return [
      md(
        [
          "조회 횟수",
          "목록 대조가 읽은 글자",
          "트라이가 읽은 글자",
          "목록 대조 시간(초당 1 억 번)",
        ],
        rows,
        [0, 1, 2, 3],
      ),
      "",
      `사전은 앞 ${num(DICT_L - 3)} 글자가 같은 길이 ${num(DICT_L)} 짜리 단어 ${num(DICT_N)} 개(길이 합 ${num(lengthSum(SHARED_DICT))})이고, 조회는 앞 ${num(DICT_L - 3)} 글자까지 맞고 그다음에서 어긋나는 없는 문자열 하나입니다. 조회 하나에 목록 대조는 ${num(r.list)} 글자, 트라이는 ${num(r.trie)} 글자를 읽었고, 여러 번은 그 값에 조회 횟수를 곱했습니다.`,
    ].join("\n");
  },

  /** `deep.origin` ③ — 목록 대조가 같은 앞부분을 단어마다 다시 읽는다. */
  "origin-apz": () => {
    const q = "apz";
    const rows = WORDS.map((w) => {
      const m = matchOne(w, q);
      return [
        code(w),
        m.matched === 0 ? "없음" : [...q.slice(0, m.matched)].join(" · "),
        `${m.matched + 1} 번째`,
        String(m.read),
      ];
    });
    const total = WORDS.reduce((a, w) => a + matchOne(w, q).read, 0);
    const repeated = WORDS.reduce((a, w) => a + matchOne(w, q).matched, 0);
    const trie = trieWalk(buildTrie(WORDS), q).read;
    return [
      md(["담긴 단어", "맞은 글자", "어긋난 자리", "읽은 글자"], rows, [3]),
      "",
      `목록 대조는 모두 ${num(total)} 글자를 읽었고, 그중 ${num(repeated)} 글자는 세 단어가 함께 가진 앞부분을 단어마다 다시 읽은 것입니다. 앞부분을 한 번만 읽으면 ${num(trie)} 글자로 끝납니다.`,
    ].join("\n");
  },

  /** `deep.origin` ④ — 같은 조회 넷을 두 방식으로 처리하고 계수를 나란히 센다. */
  "origin-four": () => {
    const trie = buildTrie(WORDS);
    let listSum = 0;
    let trieSum = 0;
    const rows = QUERIES.map(([op, q]) => {
      const list = listQuery(WORDS, q, op);
      const hit = trieWalk(trie, q);
      listSum += list.read;
      trieSum += hit.read;
      return [
        code(`${op}("${q}")`),
        yn(answerOf(hit.node, op)),
        num(list.read),
        num(hit.read),
        num(q.length),
      ];
    });
    return [
      md(
        [
          "조회",
          "답",
          "목록 대조가 읽은 글자",
          "트라이가 읽은 글자",
          "조회 길이",
        ],
        rows,
        [2, 3, 4],
      ),
      "",
      `읽은 글자의 합은 목록 대조가 ${num(listSum)}, 트라이가 ${num(trieSum)} 입니다. 트라이 쪽은 네 줄 모두 조회 길이 이하입니다.`,
    ].join("\n");
  },

  /** `deep.origin` ⑤ — 가장 단순한 후보(첫 글자로만 나눈다)를 값으로 반박한다. */
  "origin-bucket": () => {
    const trie = buildTrie(WORDS);
    const qs = ["appl", "apz", "bat"];
    const rows = qs.map((q) => {
      const list = listQuery(WORDS, q, "startsWith");
      const bucket = bucketQuery(WORDS, q);
      const hit = trieWalk(trie, q);
      return [
        code(`startsWith("${q}")`),
        yn(hit.node !== null),
        num(list.read),
        num(bucket.read),
        num(hit.read),
      ];
    });
    const worse = qs.filter(
      (q) =>
        bucketQuery(WORDS, q).read > listQuery(WORDS, q, "startsWith").read,
    );
    const inBucket = WORDS.filter((w) => w[0] === "a").length;
    return [
      md(
        [
          "조회",
          "답",
          "목록 대조",
          "첫 글자로 나눈 묶음",
          "글자마다 나눈 트라이",
        ],
        rows,
        [2, 3, 4],
      ),
      "",
      `담긴 단어가 모두 a 로 시작해 a 묶음 하나에 ${inBucket} 개가 다 들어갑니다. a 로 시작하는 조회 ${worse.length} 개에서는 첫 글자로 나눈 쪽이 목록 대조보다 1 글자씩 더 읽었습니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (c) — 노드 `appl` 하나를 뿌리에서부터 읽는다. */
  "build-read-one": () => {
    const target = "appl";
    const root = buildTrie(WORDS);
    const rows: string[][] = [["0", "-", "뿌리", "빈 문자열", yn(root.end)]];
    let cur = root;
    for (const [k, ch] of [...target].entries()) {
      cur = cur.children.get(ch) as Node;
      const path = target.slice(0, k + 1);
      rows.push([String(k + 1), ch, path, code(path), yn(cur.end)]);
    }
    const trie = refTrie();
    return [
      md(
        ["깊이", "지나온 간선의 글자", "도착한 노드", "경로 문자열", "끝 표시"],
        rows,
        [0],
      ),
      "",
      `노드 ${target} 의 끝 표시는 ${yn(cur.end)}이라 search("${target}") 는 ${yn(trie.search(target))}입니다. 노드가 있으니 startsWith("${target}") 는 ${yn(trie.startsWith(target))}입니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (d) — 노드 일곱의 부모 · 간선 글자 · 자식 · 끝 표시. */
  "build-relations": () => {
    const shape = shapeOf(buildTrie(WORDS));
    const paths = shape.map(([p]) => p);
    let agree = 0;
    const rows = shape.map(([p, end]) => {
      const parent = p === "" ? null : p.slice(0, -1);
      const kids = paths.filter(
        (c) => c.length === p.length + 1 && c.startsWith(p),
      );
      if (parent !== null && parent + p.at(-1) === p) agree++;
      return [
        nodeName(p),
        String(p.length),
        parent === null ? "없음" : nodeName(parent),
        p === "" ? "-" : (p.at(-1) as string),
        kids.length === 0 ? "없음" : kids.map(nodeName).join(" · "),
        yn(end),
      ];
    });
    const words = shape.filter(([, e]) => e).map(([p]) => p);
    return [
      md(
        ["노드", "깊이", "부모", "들어오는 간선의 글자", "자식", "끝 표시"],
        rows,
        [1],
      ),
      "",
      `뿌리를 뺀 노드 ${shape.length - 1} 개 가운데 ${agree} 개에서 부모의 경로 문자열 뒤에 들어오는 간선의 글자를 붙이면 자기 경로 문자열이 됩니다. 끝 표시가 참인 노드는 ${words.join(" · ")} ${words.length} 개로 담은 단어와 같습니다.`,
    ].join("\n");
  },

  /** `deep.build` 개념 (e) — 접두사를 공유하면 노드가 몇 개로 줄어드는가. */
  "build-node-count": () => {
    const sets: [string, readonly string[]][] = [
      ["{app, apple, ape}", WORDS],
      ["{app, bat, cup}", ["app", "bat", "cup"]],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`앞 3 글자가 갈리는 ${num(DICT_N)} 단어`, CORPUS(DICT_N, 0)],
    ];
    const vs = sets.map(([, ws]) => countNodes(buildTrie(ws)));
    const rows = sets.map(([name, ws], i) => {
      const S = lengthSum(ws);
      return [name, num(S), num(S + 1), num(vs[i] as number)];
    });
    const same = num(vs[1] as number);
    const ratio = Math.floor((vs[3] as number) / (vs[2] as number));
    return [
      md(
        [
          "단어 집합",
          "길이 합",
          "단어마다 따로 적은 사슬의 노드",
          "트라이의 노드",
        ],
        rows,
        [1, 2, 3],
      ),
      "",
      `둘째 줄은 공유할 앞부분이 없어 두 값이 ${same}${으로(same)} 같습니다. 셋째 줄과 넷째 줄은 길이 합이 같은데 트라이의 노드 수가 ${ratio} 배 넘게 갈립니다.`,
    ].join("\n");
  },

  /** `deep.build` 2단계 — 삽입의 세 경우. */
  "build-insert-cases": () => {
    const rows: string[][] = [];
    const grown: string[] = [];
    for (const w of WORDS) {
      const before = buildTrie(grown);
      const beforeN = countNodes(before);
      const reused: string[] = [];
      const made: string[] = [];
      let cur: Node | undefined = before;
      for (const [k, ch] of [...w].entries()) {
        const next: Node | undefined = cur?.children.get(ch);
        (next === undefined ? made : reused).push(w.slice(0, k + 1));
        cur = next;
      }
      grown.push(w);
      rows.push([
        code(w),
        reused.length === 0 ? "없음" : reused.join(" · "),
        made.join(" · "),
        `${beforeN} → ${countNodes(buildTrie(grown))}`,
      ]);
    }
    return md(["담는 단어", "이어 쓴 노드", "새로 만든 노드", "노드 수"], rows);
  },

  /** `deep.build` 2단계 — `insert("apple")` 의 글자별 판단. */
  "build-apple-letters": () => {
    const word = "apple";
    const root = buildTrie(["app"]);
    let cur = root;
    const rows: string[][] = [];
    for (const [k, ch] of [...word].entries()) {
      const from = word.slice(0, k);
      let next = cur.children.get(ch);
      const had = next !== undefined;
      if (next === undefined) {
        next = node();
        cur.children.set(ch, next);
      }
      cur = next;
      rows.push([
        String(k + 1),
        ch,
        nodeName(from),
        had ? "있다" : "없다",
        had ? "이어 쓴다" : "만든다",
        String(countNodes(root)),
      ]);
    }
    return md(
      ["차례", "글자", "서 있던 노드", "그 글자의 자식", "한 일", "노드 수"],
      rows,
      [0, 5],
    );
  },

  /** `deep.build` 3단계 — 이미 있는 노드에서 문자열이 끝날 때. 정본의 뿌리를 연다. */
  "build-end-only": () => {
    const trie = refTrie(["apple"]);
    const beforeN = countNodes(refRoot(trie));
    const beforeEnd = (trieWalk(refRoot(trie), "app").node as Node).end;
    const beforeSearch = trie.search("app");
    trie.insert("app");
    const afterN = countNodes(refRoot(trie));
    const afterEnd = (trieWalk(refRoot(trie), "app").node as Node).end;
    return [
      md(
        ["상태", "apple 만 담았을 때", "app 을 더 담은 뒤"],
        [
          ["노드 수", String(beforeN), String(afterN)],
          ["노드 app 의 끝 표시", yn(beforeEnd), yn(afterEnd)],
          ['search("app")', yn(beforeSearch), yn(trie.search("app"))],
        ],
        [1, 2],
      ),
      "",
      `새로 만든 노드는 ${afterN - beforeN} 개이고, 바뀐 것은 끝 표시 한 칸뿐입니다.`,
    ].join("\n");
  },

  /** `deep.build` 4단계 — 같은 내려가기로 두 조회를 답한다. 경계 경우를 섞었다. */
  "build-queries": () => {
    const trie = refTrie();
    const root = buildTrie(WORDS);
    const rows = ["ap", "appl", "apple", "apz", "bat", "applepie"].map((s) => {
      const hit = trieWalk(root, s);
      return [
        code(s),
        String(hit.read),
        hit.node === null
          ? `없음 — ${hit.read} 번째 글자 ${s[hit.read - 1]} 에서 끊김`
          : s,
        hit.node === null ? "-" : yn(hit.node.end),
        yn(trie.search(s)),
        yn(trie.startsWith(s)),
      ];
    });
    return md(
      [
        "조회 문자열",
        "읽은 글자",
        "도착한 노드",
        "끝 표시",
        "search",
        "startsWith",
      ],
      rows,
      [1],
    );
  },

  /** `deep.build` 설계 선택 — 자식을 26 칸 배열로 둘 때와 맵으로 둘 때. */
  "build-child-cells": () => {
    const sets: [string, readonly string[]][] = [
      ["{app, apple, ape}", WORDS],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`앞 3 글자가 갈리는 ${num(DICT_N)} 단어`, CORPUS(DICT_N, 0)],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, ["a".repeat(LIMIT)]],
    ];
    const rows = sets.map(([name, ws]) => {
      const V = countNodes(buildTrie(ws));
      return [
        name,
        num(V),
        num(26 * V),
        num(V - 1),
        ((26 * V) / (V - 1)).toFixed(1),
      ];
    });
    return [
      md(
        [
          "단어 집합",
          "노드 수 V",
          "26 칸 배열의 칸 26V",
          "맵의 항목 V − 1",
          "배열 칸 ÷ 맵 항목",
        ],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `배열 쪽은 노드마다 26 칸을 잡아 넷째 줄에서 ${num(26 * (LIMIT + 1))} 칸이 되고, 맵 쪽은 실제로 있는 간선만 담아 같은 입력에서 ${num(LIMIT)} 항목입니다.`,
    ].join("\n");
  },

  /** `deep.walk` 1 — 빈 트라이는 뿌리 하나다. 정본의 뿌리를 열어 본다. */
  "walk-node": () => {
    const trie = new Trie();
    const root = refRoot(trie);
    return [
      `new Trie()        →  노드 ${countNodes(root)} 개(뿌리) · 뿌리의 children ${root.children.size} 개 · end = ${root.end}`,
      `search("a")       →  ${trie.search("a")}`,
      `startsWith("a")   →  ${trie.startsWith("a")}`,
    ].join("\n");
  },

  /** `deep.walk` 3 — 조회 넷에서 `nodeAt` 이 돌려준 것과 마지막 한 줄의 값. */
  "walk-queries": () => {
    const trie = refTrie();
    const root = buildTrie(WORDS);
    const rows = QUERIES.map(([op, q]) => {
      const hit = trieWalk(root, q).node;
      return [
        code(`${op}("${q}")`),
        hit === null ? "`null`" : `노드 ${q}`,
        op === "search" ? (hit === null ? "-" : yn(hit.end)) : "안 본다",
        op === "search" ? yn(trie.search(q)) : "-",
        op === "startsWith" ? yn(trie.startsWith(q)) : "-",
      ];
    });
    return md(
      ["조회", "nodeAt 이 돌려준 것", "끝 표시", "④ 의 값", "⑤ 의 값"],
      rows,
    );
  },

  /** `deep.walk.pause` 1 — 자식이 있는지 보지 않고 매번 새로 만들면. */
  pauseOverwrite: () => {
    const bad = new alwaysNewNode.Trie();
    for (const w of WORDS) bad.insert(w);
    const { rows, wrong } = verdictRows(refTrie(), bad, [
      ...QUERIES,
      ["search", "apple"],
      ["search", "ape"],
    ]);
    return [
      md(["조회", "정본이 낸 답", "매번 새로 만든 답", "판정"], rows),
      "",
      `여섯 조회 가운데 ${wrong} 개가 틀립니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` 2 — 끝 표시를 보지 않으면 search 가 startsWith 와 같아진다. */
  pauseEndFlag: () => {
    const good = refTrie();
    const bad = new ignoreEndFlag.Trie();
    for (const w of WORDS) bad.insert(w);
    const qs = ["app", "appl", "ap", "a", "apple", "apz"];
    const same = qs.filter((q) => bad.search(q) === good.startsWith(q)).length;
    const rows = qs.map((q) => [
      code(`search("${q}")`),
      yn(good.search(q)),
      yn(bad.search(q)),
      yn(good.startsWith(q)),
      good.search(q) === bad.search(q) ? "같다" : "틀리다",
    ]);
    const kept = qs.filter((q) => good.search(q) === bad.search(q));
    return [
      md(
        [
          "조회",
          "정본이 낸 답",
          "끝 표시를 안 본 답",
          "startsWith 의 답",
          "판정",
        ],
        rows,
      ),
      "",
      `끝 표시를 안 본 답은 여섯 줄 가운데 ${same} 줄에서 startsWith 의 답과 같습니다. 답이 안 틀린 줄은 ${kept.map(code).join(" · ")} ${kept.length} 개입니다.`,
    ].join("\n");
  },

  /** `deep.walk.pause` 3 — 글자마다 한 겹씩 쌓는 재귀는 과제 규모에서 실패한다. */
  pauseRecursion: () => {
    interface RecNode {
      children: Map<string, RecNode>;
      end: boolean;
    }
    const mk = (): RecNode => ({ children: new Map(), end: false });
    const insertRec = (n: RecNode, w: string, k: number): void => {
      if (k === w.length) {
        n.end = true;
        return;
      }
      const ch = w[k] as string;
      let next = n.children.get(ch);
      if (next === undefined) {
        next = mk();
        n.children.set(ch, next);
      }
      insertRec(next, w, k + 1);
    };
    const rows = [1000, LIMIT].map((len) => {
      const root = mk();
      const iter = new Trie();
      let recResult: string;
      try {
        insertRec(root, "a".repeat(len), 0);
        recResult = "끝까지 담는다";
      } catch (e) {
        recResult = (e as Error).constructor.name;
      }
      iter.insert("a".repeat(len));
      return [
        num(len),
        recResult,
        iter.search("a".repeat(len)) ? "끝까지 담는다" : "실패",
      ];
    });
    return md(["단어 길이", "글자마다 재귀", "반복문"], rows, [0]);
  },

  /** `deep.walk` — T1 부터 T11 까지의 상태값과 갈래 판정. */
  walkTrace: () => {
    const steps = walkSteps();
    const rows = steps.map((s) => [
      `T${s.t}`,
      s.kind === "start"
        ? "빈 트라이"
        : s.kind === "insert"
          ? `${s.op} 의 ${s.word.slice(s.from, s.to)}`
          : s.op,
      s.looks.length === 0 ? "-" : looksText(s.looks),
      s.branches.length === 0 ? "-" : branchText(s),
      String(s.made.length),
      String(s.shape.length),
      s.at === null ? "없음" : nodeName(s.at),
      s.answer === null ? "-" : yn(s.answer),
    ]);
    const reused = steps.filter(
      (s) => s.kind === "insert" && s.made.length === 0,
    );
    const split = steps.filter((s) => s.kind === "query" && s.word === "appl");
    const lastT = `T${(split.at(-1) as WalkStep).t}`;
    const answers = split
      .map((s) => `T${s.t} 에서 ${yn(s.answer ?? false)}`)
      .join(" · ");
    return [
      md(
        [
          "걸음",
          "하는 일",
          "자식 조회",
          "갈래",
          "새 노드",
          "노드 수",
          "도착한 노드",
          "반환",
        ],
        rows,
        [4, 5],
      ),
      "",
      `새 노드가 0 개인 삽입 걸음은 ${reused.map((s) => `T${s.t}`).join(" · ")} 이고, 같은 문자열 appl 을 물은 ${split.map((s) => `T${s.t}`).join(" · ")}${은는(lastT)} 같은 노드에 도착했고, 답은 ${answers}입니다.`,
    ].join("\n");
  },

  /** `deep.walk` — 여섯 갈래가 어느 걸음에서 실행됐는가. */
  branchCoverage: () => {
    const steps = walkSteps();
    const labels: [string, string][] = [
      ["①", "뿌리에서 출발한다"],
      ["② 참", "자식이 없어 만든다"],
      ["② 거짓", "자식이 있어 이어 쓴다"],
      ["③", "끝 표시를 참으로 둔다"],
      ["④", "search 의 마지막 한 줄"],
      ["⑤", "startsWith 의 마지막 한 줄"],
      ["⑥", "자식이 없어 null 을 낸다"],
    ];
    const inserts = steps.filter((s) => s.kind === "insert");
    let covered = 0;
    const rows = labels.map(([label, say]) => {
      const at = steps.filter((s) => s.branches.includes(label));
      if (at.length > 0) covered++;
      const times =
        label === "② 참"
          ? inserts.reduce((a, s) => a + s.made.length, 0)
          : label === "② 거짓"
            ? inserts.reduce((a, s) => a + s.reused.length, 0)
            : at.length;
      return [label, say, at.map((s) => `T${s.t}`).join(" · "), String(times)];
    });
    return [
      md(["라벨", "하는 일", "실행된 걸음", "횟수"], rows, [3]),
      "",
      `${labels.length} 줄 가운데 ${covered} 줄이 한 번 이상 실행됐습니다. ② 의 횟수는 글자 수로 셌습니다.`,
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 결과. 앞에서 안 나온 경계를 함께 건다. */
  finalRun: () => {
    const trie = refTrie();
    const empty = new Trie();
    const twice = refTrie(["app", "app"]);
    const lines: [string, boolean][] = [
      ...QUERIES.map(
        ([op, q]) => [`trie.${op}("${q}")`, trie[op](q)] as [string, boolean],
      ),
      ['trie.startsWith("apple")', trie.startsWith("apple")],
      ['trie.search("applepie")', trie.search("applepie")],
      ['new Trie().search("app")', empty.search("app")],
      ['new Trie().startsWith("app")', empty.startsWith("app")],
      ['app 을 두 번 담은 뒤 search("app")', twice.search("app")],
    ];
    const width = (s: string) =>
      [...s].reduce((n, c) => n + (/[가-힯]/.test(c) ? 2 : 1), 0);
    const w = Math.max(...lines.map(([s]) => width(s)));
    return [
      ...lines.map(([s, v]) => `${s}${" ".repeat(w + 2 - width(s))}→  ${v}`),
    ].join("\n");
  },

  /** `related` — 글자를 하나씩 읽을 때마다 남는 후보 단어. */
  "related-narrow": () => {
    const trie = refTrie();
    const rows = ["", "a", "ap", "app", "appl", "apple"].map((p) => {
      const left = WORDS.filter((w) => w.startsWith(p));
      if (left.length > 0 !== trie.startsWith(p)) {
        throw new Error(`후보와 정본의 startsWith("${p}") 가 다르다`);
      }
      return [
        p === "" ? "빈 문자열" : code(p),
        left.map(code).join(" · "),
        String(left.length),
      ];
    });
    return md(["읽은 접두사", "남은 후보 단어", "후보 수"], rows, [2]);
  },

  /** `purpose.alt` — 저장 칸이 뒤집히는 공유 길이를 스윕으로 찾는다. */
  altCells: () => {
    const shares = [0, 20, 40, 46, 47, 48, 49, 60, 90];
    let flip = -1;
    let before = -1;
    let prevTrie: boolean | null = null;
    const rows = shares.map((p) => {
      const words = CORPUS(DICT_N, p);
      const t = trieCells(words);
      const a = arrayCells(words);
      if (prevTrie === false && t < a && flip < 0) {
        flip = p;
        before = shares[shares.indexOf(p) - 1] as number;
      }
      prevTrie = t < a;
      return [String(p), num(t), num(a), t < a ? "트라이" : "정렬 배열"];
    });
    return [
      md(
        ["공통 접두사 길이", "트라이 저장 칸", "정렬 배열 저장 칸", "적은 쪽"],
        rows,
        [0, 1, 2],
      ),
      "",
      `아홉 줄 모두 단어 ${num(DICT_N)} 개 · 길이 ${num(DICT_L)} · 길이 합 ${num(LIMIT)} 이고 공통 접두사 길이만 바꿨습니다. ${before}${과와(before)} ${flip} 사이에서 적은 쪽이 정렬 배열에서 트라이로 바뀝니다.`,
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣어 검산한다. */
  mathPrefixSet: () => {
    const set = new Set<string>([""]);
    for (const w of WORDS) {
      for (let k = 1; k <= w.length; k++) set.add(w.slice(0, k));
    }
    const sorted = [...set].sort(
      (a, b) => a.length - b.length || (a < b ? -1 : 1),
    );
    const root = buildTrie(WORDS);
    return [
      md(
        ["원소", "길이", "그 원소를 내놓은 단어"],
        sorted.map((p) => [
          p === "" ? "빈 문자열" : code(p),
          String(p.length),
          WORDS.filter((w) => w.startsWith(p)).join(" · "),
        ]),
        [1],
      ),
      "",
      `집합의 크기는 ${set.size}, 트라이의 노드 수는 ${countNodes(root)}, 길이 합은 ${lengthSum(WORDS)} 입니다.`,
    ].join("\n");
  },

  /** `deep.math` ④ — 상한과 하한에 과제 규모를 넣어 수치를 낸다. */
  mathBounds: () => {
    const cases: [string, readonly string[]][] = [
      ["{app, apple, ape}", WORDS],
      ["{app, bat, cup}", ["app", "bat", "cup"]],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, ["a".repeat(LIMIT)]],
    ];
    const rows = cases.map(([name, ws]) => {
      const S = lengthSum(ws);
      const maxLen = Math.max(...ws.map((w) => w.length));
      const V = countNodes(buildTrie(ws));
      return [
        name,
        num(S),
        num(maxLen + 1),
        num(V),
        num(S + 1),
        V === S + 1 && V === maxLen + 1
          ? "상한이자 하한"
          : V === S + 1
            ? "상한과 같다"
            : V === maxLen + 1
              ? "하한과 같다"
              : "그 사이",
      ];
    });
    return md(
      ["단어 집합", "S", "하한 max\\|w\\| + 1", "실제 V", "상한 S + 1", "자리"],
      rows,
      [1, 2, 3, 4],
    );
  },

  /** `invariant` ② — 경계에 있는 입력. 정본에 걸고, 노드 수는 정본의 뿌리를 열어 센다. */
  "invariant-edges": () => {
    const cases: [string, readonly string[], string, string][] = [
      ["빈 트라이", [], "없음", "app"],
      ["담긴 단어보다 긴 조회", ["ab"], "ab", "abc"],
      ["같은 단어를 두 번", ["app", "app"], "app · app", "app"],
      ["짧은 단어를 나중에", ["apple", "app"], "apple · app", "app"],
      [
        "긴 단어 하나",
        ["a".repeat(LIMIT)],
        `a × ${num(LIMIT)}`,
        "a".repeat(LIMIT),
      ],
    ];
    const rows = cases.map(([name, ws, shown, q]) => {
      const trie = refTrie(ws);
      return [
        name,
        shown,
        q.length > 10 ? `a × ${num(q.length)}` : q,
        yn(trie.search(q)),
        yn(trie.startsWith(q)),
        num(countNodes(refRoot(trie))),
      ];
    });
    return md(
      ["경우", "담은 단어", "조회", "search", "startsWith", "노드 수"],
      rows,
      [5],
    );
  },

  /** `invariant` ③ — 경로를 잇는 줄을 바꾸면 무엇이 어떻게 나오는가. */
  mutantPathReset: () => {
    const good = refTrie();
    const bad = new resetToRoot.Trie();
    for (const w of WORDS) bad.insert(w);
    const { rows } = verdictRows(good, bad, [
      ...QUERIES,
      ["startsWith", "e"],
      ["startsWith", "pa"],
    ]);
    const gp = pathSet(good).map(nodeName);
    const bp = pathSet(bad).map(nodeName);
    return [
      md(["조회", "정본이 낸 답", "경로를 안 잇는 답", "판정"], rows),
      "",
      `노드의 경로 문자열을 모으면 정본은 ${gp.join(" · ")} ${gp.length} 개이고, 바꾼 코드는 ${bp.join(" · ")} ${bp.length} 개입니다.`,
    ].join("\n");
  },

  /** `perf.derive` — 전개의 걸음으로 기본 연산을 센다. */
  perfCount: () => {
    const root = node();
    let lookups = 0;
    let creates = 0;
    let endWrites = 0;
    const rows: string[][] = [];
    for (const w of WORDS) {
      let cur = root;
      let l = 0;
      let c = 0;
      for (const ch of w) {
        l++;
        let next = cur.children.get(ch);
        if (next === undefined) {
          next = node();
          cur.children.set(ch, next);
          c++;
        }
        cur = next;
      }
      cur.end = true;
      lookups += l;
      creates += c;
      endWrites += 1;
      rows.push([
        code(`insert("${w}")`),
        String(l),
        String(c),
        "1",
        String(l + c + 1),
      ]);
    }
    let endReads = 0;
    let qLookups = 0;
    for (const [op, q] of QUERIES) {
      const hit = trieWalk(root, q);
      const r = op === "search" && hit.node !== null ? 1 : 0;
      qLookups += hit.read;
      endReads += r;
      rows.push([
        code(`${op}("${q}")`),
        String(hit.read),
        "0",
        String(r),
        String(hit.read + r),
      ]);
    }
    const total = lookups + creates + endWrites + qLookups + endReads;
    rows.push([
      "합계",
      String(lookups + qLookups),
      String(creates),
      String(endWrites + endReads),
      String(total),
    ]);
    const S = lengthSum(WORDS);
    const V = countNodes(root);
    return [
      md(
        ["연산", "자식 맵 조회", "노드 생성", "끝 표시 읽기·쓰기", "기본 연산"],
        rows,
        [1, 2, 3, 4],
      ),
      "",
      `담는 쪽은 S + (V − 1) + N = ${S} + ${V - 1} + ${WORDS.length} = ${S + V - 1 + WORDS.length} 이고, 묻는 쪽은 읽은 글자 합 + 끝 표시 읽기 = ${qLookups} + ${endReads} = ${qLookups + endReads} 입니다.`,
    ].join("\n");
  },

  /** `perf.worst` — 무엇을 최악으로 만들 것인가에 따라 입력이 갈린다. */
  worstShape: () => {
    const shapes: [string, readonly string[], string][] = [
      [
        `길이 ${num(LIMIT)} 짜리 단어 하나`,
        ["a".repeat(LIMIT)],
        "a".repeat(LIMIT),
      ],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT, SHARED_QUERY],
      [
        `앞 3 글자가 갈리는 ${num(DICT_N)} 단어`,
        CORPUS(DICT_N, 0),
        CORPUS(DICT_N, 0)[0] as string,
      ],
      [
        `길이 1 짜리 단어 ${num(26)} 개`,
        "abcdefghijklmnopqrstuvwxyz".split(""),
        "a",
      ],
    ];
    const rows = shapes.map(([name, ws, q]) => {
      const trie = buildTrie(ws);
      const V = countNodes(trie);
      return [
        name,
        num(ws.length),
        num(lengthSum(ws)),
        num(V),
        num(2 * V - 1),
        num(trieWalk(trie, q).read),
      ];
    });
    return md(
      [
        "입력의 모양",
        "단어 수",
        "길이 합",
        "노드 수",
        "잡는 칸 2V − 1",
        "가장 긴 조회가 읽은 글자",
      ],
      rows,
      [1, 2, 3, 4, 5],
    );
  },

  /** `selfcheck` — T5 의 상태. */
  "selfcheck-t5": () => {
    const s = walkSteps().find((x) => x.t === 5) as WalkStep;
    return [
      `T${s.t}   ${s.op} 의 ${s.word.slice(s.from, s.to)}   자식 조회 ${s.looks.length} 번(${looksText(s.looks)})   새 노드 ${s.made.length} 개   노드 수 ${s.shape.length} 그대로`,
    ].join("\n");
  },
};
