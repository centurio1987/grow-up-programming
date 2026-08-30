/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`.ref.ts`)을 부르고, 변이는 그 소스에서 기계로 만든다.**
 * 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도 증명하지 않는다.
 *
 *   bun run ../../../../tools/check-proof.ts trie-guide.md
 */
import { loadMutant } from "../../../../tools/check-proof.ts";
import { arrayCells, CORPUS, trieCells } from "./trie-guide.alt.ts";
import { Trie } from "./trie-guide.ref.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 머리줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const padRight = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padLeft = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 천 단위 구분. 본문 표기와 같다. */
const num = (n: number): string => n.toLocaleString("en-US");

/**
 * 열 폭을 값에서 계산해 표를 그린다. 폭을 리터럴로 박으면 값이 바뀌어도 표가 그대로라
 * 어긋난 자리를 아무도 못 본다.
 */
function table(head: string[], rows: string[][], align: ("l" | "r")[]): string {
  const cols = head.length;
  const w = Array.from({ length: cols }, (_, c) =>
    Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
  );
  const line = (cells: string[]): string =>
    cells
      .map((cell, c) =>
        align[c] === "r" ? padLeft(cell, w[c] ?? 0) : padRight(cell, w[c] ?? 0),
      )
      .join("  ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

const yn = (b: boolean): string => (b ? "참" : "거짓");

/* ────────────────────────── 고정 입력 ────────────────────────── */

/**
 * 본문 전개가 쓰는 고정 입력. `deep.build`·`deep.walk`·`.sim.ts` 가 같은 것을 쓴다.
 *
 * 셋을 이 순서로 넣으면 삽입의 세 경우가 다 나온다 — 전부 새로 만드는 삽입(`app`),
 * 앞부분을 이어 쓰고 뒤만 만드는 삽입(`apple`), 도중에 다른 글자로 나뉘는 삽입(`ape`).
 * 조회 넷은 답이 참·거짓 둘씩이고, `search` 와 `startsWith` 가 **같은 문자열에서 다른 답을
 * 내는 자리**(`appl`)를 포함한다.
 */
const WORDS = ["app", "apple", "ape"] as const;

/** 전개가 쓰는 조회 넷. `[연산, 문자열]` 이다. */
const QUERIES = [
  ["search", "app"],
  ["search", "appl"],
  ["startsWith", "appl"],
  ["startsWith", "bat"],
] as const;

/** 제약이 정한 길이 합의 최댓값. */
const LIMIT = 100_000;

/** 제약 규모 사전의 단어 수와 단어 길이. 곱이 정확히 `LIMIT` 이다. */
const DICT_N = 1000;
const DICT_L = 100;

/** 소문자 세 글자로 적은 `i` — 사전의 단어를 서로 다르게 만드는 자리다. */
function base26(i: number): string {
  const a = "abcdefghijklmnopqrstuvwxyz";
  return `${a[Math.floor(i / 676) % 26]}${a[Math.floor(i / 26) % 26]}${a[i % 26]}`;
}

/** 앞 97 글자가 전부 같은 단어 1,000 개. 길이 합이 정확히 100,000 이다. */
const SHARED_DICT: string[] = Array.from(
  { length: DICT_N },
  (_, i) => "a".repeat(DICT_L - 3) + base26(i),
);

/** 그 사전에 없는 길이 100 짜리 조회. 앞 97 글자까지 맞고 98 번째에서 어긋난다. */
const SHARED_QUERY = `${"a".repeat(DICT_L - 3)}zzz`;

/* ────────────────────── 계측기 — 트라이 쪽 ────────────────────── */

interface Node {
  children: Map<string, Node>;
  end: boolean;
}
const node = (): Node => ({ children: new Map(), end: false });

/** 정본과 같은 절차에 계수만 덧붙인 것. `읽기` 는 자식 맵 조회 횟수다. */
function buildTrie(words: readonly string[]): Node {
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
 * 100,000 이라 호출 스택이 넘친다. 그 실패는 본문의 셋째 멈춤이 다루는 것과 같은 자리다.
 */
function countNodes(root: Node): number {
  const stack: Node[] = [root];
  let sum = 0;
  while (stack.length > 0) {
    const n = stack.pop() as Node;
    sum++;
    for (const c of n.children.values()) stack.push(c);
  }
  return sum;
}

/** 조회 하나의 답. `search` 만 끝 표시까지 본다. */
function answerOf(node: Node | null, op: "search" | "startsWith"): boolean {
  if (node === null) return false;
  return op === "search" ? node.end : true;
}

/** 글자를 따라 내려가며 자식 맵 조회 횟수를 센다. */
function trieWalk(root: Node, s: string): { node: Node | null; read: number } {
  let cur: Node | undefined = root;
  let read = 0;
  for (const ch of s) {
    read++;
    cur = cur.children.get(ch);
    if (cur === undefined) return { node: null, read };
  }
  return { node: cur, read };
}

/* ────────────────────── 계측기 — 목록 쪽 ────────────────────── */

/**
 * 단어를 배열에 담고 매번 앞에서부터 대조하는 방식. 단어 하나마다 **어긋나는 자리까지**
 * 글자를 읽고, 답이 정해지면 거기서 멈춘다.
 */
function listQuery(
  words: readonly string[],
  q: string,
  mode: "search" | "startsWith",
): { answer: boolean; read: number } {
  let read = 0;
  for (const w of words) {
    let k = 0;
    while (k < q.length && k < w.length) {
      read++;
      if (w[k] !== q[k]) break;
      k++;
    }
    if (k < q.length) continue;
    if (mode === "startsWith") return { answer: true, read };
    if (w.length === q.length) return { answer: true, read };
  }
  return { answer: false, read };
}

/** 첫 글자로만 나눠 담는 후보 — 묶음을 고르는 데 1, 그 안에서는 목록 대조와 같다. */
function bucketQuery(
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

/* ────────────────────── 그림 — 트라이를 ascii 로 ────────────────────── */

/**
 * 트라이를 ascii 로 그린다. **박스 드로잉 문자를 쓰지 않는다** — `+`·`|`·`` ` ``·`-` 만 쓴다.
 * 표시폭이 모호한 문자가 열에 끼면 화면에 따라 세로줄이 갈린다.
 *
 * 자식은 **처음 만들어진 순서**로 그린다. 순서는 어떤 답에도 영향을 주지 않지만, 프레임
 * 사이에서 자리가 흔들리면 무엇이 새로 생겼는지 확인할 수 없다.
 */
function drawTrie(root: Node): string {
  const out: string[] = ["(root)"];
  const rec = (n: Node, prefix: string): void => {
    const kids = [...n.children.entries()];
    kids.forEach(([ch, kid], i) => {
      const last = i === kids.length - 1;
      out.push(`${prefix}${last ? "`--" : "+--"} ${ch}${kid.end ? "*" : ""}`);
      rec(kid, prefix + (last ? "    " : "|   "));
    });
  };
  rec(root, "");
  return out.join("\n");
}

/**
 * 트라이의 **노드 경로 집합**을 밖에서 얻는다 — `startsWith(s)` 가 참인 `s` 전부다.
 * 내부를 들여다보지 않고 공개 연산만 쓰므로, 변이본에도 그대로 걸린다.
 */
function pathSet(trie: { startsWith(s: string): boolean }): string {
  const alphabet = [..."aplebt"];
  const found: string[] = [];
  let level = [""];
  for (let depth = 0; depth <= 5 && level.length > 0; depth++) {
    const next: string[] = [];
    for (const s of level) {
      if (!trie.startsWith(s)) continue;
      found.push(s === "" ? '""' : s);
      for (const ch of alphabet) next.push(s + ch);
    }
    level = next;
  }
  return found.join(" ");
}

/* ────────────────────── 전개 걸음 ────────────────────── */

interface Step {
  label: string;
  op: string;
  read: number;
  at: string;
  made: string;
  nodes: number;
  ret: string;
}

/** T1 부터 T11 까지를 실제 실행에서 만든다. */
function walkSteps(): Step[] {
  const root = node();
  const steps: Step[] = [
    {
      label: "T1",
      op: "시작",
      read: 0,
      at: "(root)",
      made: "-",
      nodes: 1,
      ret: "-",
    },
  ];
  let t = 1;
  // 삽입 셋. 글자 묶음마다 한 걸음으로 접는다 — 새로 만든 자리와 이어 쓴 자리를 가른다.
  const inserts: [string, number[]][] = [
    ["app", [1, 1, 1]],
    ["apple", [3, 2]],
    ["ape", [3]],
  ];
  for (const [word, groups] of inserts) {
    let cur = root;
    let done = 0;
    for (const g of groups) {
      let read = 0;
      let made = 0;
      let path = word.slice(0, done);
      for (let k = 0; k < g; k++) {
        const ch = word[done + k] as string;
        read++;
        let next = cur.children.get(ch);
        if (next === undefined) {
          next = node();
          cur.children.set(ch, next);
          made++;
        }
        cur = next;
        path += ch;
      }
      done += g;
      const last = done === word.length;
      if (last) cur.end = true;
      t++;
      steps.push({
        label: `T${t}`,
        op: `insert("${word}") ${word.slice(done - g, done)}`,
        read,
        at: path,
        made: made === 0 ? "0 (이어 씀)" : String(made),
        nodes: countNodes(root),
        ret: last ? "없음" : "-",
      });
    }
  }
  // 조회 넷.
  for (const [op, q] of QUERIES) {
    const hit = trieWalk(root, q);
    const answer = answerOf(hit.node, op);
    t++;
    steps.push({
      label: `T${t}`,
      op: `${op}("${q}")`,
      read: hit.read,
      at: hit.node === null ? "없음" : q,
      made: "0",
      nodes: countNodes(root),
      ret: yn(answer),
    });
  }
  return steps;
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

/* ────────────────────── 증명 블록 ────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** `deep.build` ② — 가장 단순한 방법을 제약 규모에서 수치로 반박한다. */
  costWorstQuery: () => {
    const trie = buildTrie(SHARED_DICT);
    const list = listQuery(SHARED_DICT, SHARED_QUERY, "startsWith");
    const walk = trieWalk(trie, SHARED_QUERY);
    const S = SHARED_DICT.reduce((a, w) => a + w.length, 0);
    return [
      table(
        [
          `사전 ${num(DICT_N)} 단어 · 길이 합 ${num(S)}`,
          "답",
          "읽은 글자",
          "조회 1,000 번이면",
        ],
        [
          [
            "목록에 담고 매번 대조한다",
            yn(list.answer),
            num(list.read),
            num(list.read * 1000),
          ],
          [
            "접두사를 공유하는 트리를 만든다",
            yn(walk.node !== null),
            num(walk.read),
            num(walk.read * 1000),
          ],
        ],
        ["l", "l", "r", "r"],
      ),
      "",
      `조회는 "${"a".repeat(8)}...zzz" (길이 ${DICT_L}) 하나이고 사전에 없다`,
      "└ 목록 방식은 단어 1,000 개를 각각 98 글자까지 대조한다. 트리는 98 글자에서 끝난다",
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 조회 넷을 두 방식으로 처리하고 계수를 나란히 센다. */
  costFourQueries: () => {
    const trie = buildTrie(WORDS);
    const rows = QUERIES.map(([op, q]) => {
      const list = listQuery(WORDS, q, op);
      const hit = trieWalk(trie, q);
      const answer = answerOf(hit.node, op);
      return [`${op}("${q}")`, yn(answer), num(list.read), num(hit.read)];
    });
    const sum = (f: (i: number) => number): number =>
      QUERIES.reduce((a, _, i) => a + f(i), 0);
    rows.push([
      "합계",
      "",
      num(
        sum((i) => {
          const [op, q] = QUERIES[i] as (typeof QUERIES)[number];
          return listQuery(WORDS, q, op).read;
        }),
      ),
      num(
        sum((i) => {
          const [, q] = QUERIES[i] as (typeof QUERIES)[number];
          return trieWalk(trie, q).read;
        }),
      ),
    ]);
    return [
      table(["조회", "답", "목록 대조가 읽은 글자", "트리가 읽은 글자"], rows, [
        "l",
        "l",
        "r",
        "r",
      ]),
      "",
      "└ 목록 대조는 단어가 늘면 함께 늘고, 트리는 조회 문자열의 길이만 따라간다",
    ].join("\n");
  },

  /** `deep.build` ⑤ — 가장 단순한 후보(첫 글자로만 나눈다)를 값으로 반박한다. */
  bucketFirstLetter: () => {
    const trie = buildTrie(WORDS);
    const rows = ["appl", "apz", "bat"].map((q) => {
      const list = listQuery(WORDS, q, "startsWith");
      const bucket = bucketQuery(WORDS, q);
      const hit = trieWalk(trie, q);
      return [
        `startsWith("${q}")`,
        yn(hit.node !== null),
        num(list.read),
        num(bucket.read),
        num(hit.read),
      ];
    });
    return [
      table(
        ["조회", "답", "목록 대조", "첫 글자만 나눔", "글자마다 나눔"],
        rows,
        ["l", "l", "r", "r", "r"],
      ),
      "",
      "└ 세 단어가 전부 a 로 시작해서 첫 글자만 나누면 묶음 하나에 다 들어간다",
      "  첫 줄과 둘째 줄에서 읽은 글자가 오히려 하나 늘었다 — 묶음을 고르는 읽기 한 번이다",
      "  b 로 시작하는 조회에서만 값이 줄고, 그 이득은 첫 글자가 다를 때뿐이다",
    ].join("\n");
  },

  /** `deep.build` ⑥ — 접두사를 공유하면 노드가 몇 개로 줄어드는가. */
  nodeCount: () => {
    const sets: [string, readonly string[]][] = [
      ["{app, apple, ape}", WORDS],
      ["{app, bat, cup}", ["app", "bat", "cup"]],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`앞 3 글자가 갈리는 ${num(DICT_N)} 단어`, CORPUS(DICT_N, 0)],
    ];
    const rows = sets.map(([name, ws]) => {
      const S = ws.reduce((a, w) => a + w.length, 0);
      return [name, num(S), num(S + 1), num(countNodes(buildTrie(ws)))];
    });
    return [
      table(
        ["단어 집합", "길이 합", "단어마다 따로 만들면", "트라이 노드 수"],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 둘째 줄은 공유할 접두사가 없어 두 값이 같다 — 트라이가 이득을 못 내는 입력이다",
      "  셋째 줄과 넷째 줄은 길이 합이 똑같이 100,000 인데 노드 수가 86 배 갈린다",
    ].join("\n");
  },

  /** `deep.walk` 단계 — 삽입 셋을 하나씩 끝낸 뒤의 트라이. */
  shapeAfterInserts: () => {
    const parts: string[] = [];
    const grown: string[] = [];
    for (const w of WORDS) {
      grown.push(w);
      const root = buildTrie(grown);
      parts.push(
        `${grown.map((x) => `insert("${x}")`).join(" ")} 까지 — 노드 ${countNodes(root)} 개`,
        drawTrie(root),
        "",
      );
    }
    parts.push(
      "└ * 는 단어 끝 표시(end = true)다. 간선의 글자를 위에서 아래로 이으면 그 노드의 경로 문자열이 된다",
    );
    return parts.join("\n");
  },

  /** `deep.walk.pause` 1 — 자식이 있는지 보지 않고 매번 새로 만들면. */
  pauseOverwrite: () => {
    const good = new Trie();
    const bad = new alwaysNewNode.Trie();
    for (const w of WORDS) {
      good.insert(w);
      bad.insert(w);
    }
    const rows = [
      ...QUERIES.map(([op, q]) => [
        `${op}("${q}")`,
        yn(good[op](q)),
        yn(bad[op](q)),
        good[op](q) === bad[op](q) ? "같다" : "틀리다",
      ]),
      [
        'search("apple")',
        yn(good.search("apple")),
        yn(bad.search("apple")),
        good.search("apple") === bad.search("apple") ? "같다" : "틀리다",
      ],
    ];
    return [
      table(["조회", "정본이 낸 답", "매번 새로 만든 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      "└ 나중에 넣은 단어가 앞서 넣은 단어의 경로를 덮어써서, 마지막 단어 하나만 남는다",
    ].join("\n");
  },

  /** `deep.walk.pause` 2 — 끝 표시를 보지 않으면 search 가 startsWith 과 같아진다. */
  pauseEndFlag: () => {
    const good = new Trie();
    const bad = new ignoreEndFlag.Trie();
    for (const w of WORDS) {
      good.insert(w);
      bad.insert(w);
    }
    const rows = ["app", "appl", "ap", "a", "apple", "apz"].map((q) => [
      `search("${q}")`,
      yn(good.search(q)),
      yn(bad.search(q)),
      yn(good.startsWith(q)),
      good.search(q) === bad.search(q) ? "같다" : "틀리다",
    ]);
    return [
      table(
        [
          "조회",
          "정본이 낸 답",
          "끝 표시를 안 본 답",
          "startsWith 의 답",
          "판정",
        ],
        rows,
        ["l", "r", "r", "r", "l"],
      ),
      "",
      "└ 셋째 열이 넷째 열과 한 줄도 다르지 않다 — 끝 표시를 빼면 두 연산이 같은 것이 된다",
      "  담긴 단어를 그대로 물은 첫 줄과 다섯째 줄에서는 답이 안 틀린다",
    ].join("\n");
  },

  /** `deep.walk.pause` 3 — 글자마다 한 겹씩 쌓는 재귀는 제약 최댓값에서 실패한다. */
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
        recResult = "끝까지 넣는다";
      } catch (e) {
        recResult = (e as Error).constructor.name;
      }
      iter.insert("a".repeat(len));
      return [
        num(len),
        recResult,
        iter.search("a".repeat(len)) ? "끝까지 넣는다" : "실패",
      ];
    });
    return [
      table(
        ["단어 길이", "글자마다 재귀로 내려가면", "반복문으로 내려가면"],
        rows,
        ["r", "l", "l"],
      ),
      "",
      "└ 제약이 허용하는 길이 100,000 에서 재귀는 호출 스택이 넘친다",
      "  길이 1,000 은 두 방식 다 끝난다 — 짧은 단어만 시험하면 이 실패를 못 만난다",
    ].join("\n");
  },

  /** `deep.walk` — T1 부터 T11 까지의 상태값. */
  walkTrace: () => {
    const steps = walkSteps();
    return [
      table(
        [
          "걸음",
          "무엇을 하는가",
          "읽은 글자",
          "지금 노드의 경로",
          "새 노드",
          "노드 수",
          "반환",
        ],
        steps.map((s) => [
          s.label,
          s.op,
          String(s.read),
          s.at,
          s.made,
          String(s.nodes),
          s.ret,
        ]),
        ["l", "l", "r", "l", "r", "r", "l"],
      ),
      "",
      "└ T5 는 새 노드가 0 개다 — 글자 셋이 이미 있는 경로라 그대로 이어 쓴 걸음이다",
      "  T9 와 T10 은 같은 문자열을 물었는데 답이 갈린다. 끝 표시를 보느냐 마느냐 하나가 그 차이다",
    ].join("\n");
  },

  /** `deep.math` ② — 정의를 전개 입력에 넣어 검산한다. */
  mathPrefixSet: () => {
    const set = new Set<string>([""]);
    for (const w of WORDS) {
      for (let k = 1; k <= w.length; k++) set.add(w.slice(0, k));
    }
    const sorted = [...set].sort();
    const root = buildTrie(WORDS);
    return [
      table(
        ["원소", "어느 단어에서 나왔는가", "길이"],
        sorted.map((p) => [
          p === "" ? '""(빈 문자열)' : p,
          WORDS.filter((w) => w.startsWith(p)).join(" "),
          String(p.length),
        ]),
        ["l", "l", "r"],
      ),
      "",
      `집합의 크기 ${set.size} · 트라이 노드 수 ${countNodes(root)} · 길이 합 ${WORDS.reduce((a, w) => a + w.length, 0)}`,
      "└ 두 수가 같다. 노드 하나가 접두사 하나이고 그 역도 성립한다",
    ].join("\n");
  },

  /** `deep.math` ④ — 상한과 하한에 제약 규모를 넣어 수치를 낸다. */
  mathBounds: () => {
    const cases: [string, readonly string[]][] = [
      ["{app, apple, ape}", WORDS],
      ["{app, bat, cup}", ["app", "bat", "cup"]],
      [`앞 97 글자가 같은 ${num(DICT_N)} 단어`, SHARED_DICT],
      [`길이 ${num(LIMIT)} 짜리 단어 하나`, ["a".repeat(LIMIT)]],
    ];
    const rows = cases.map(([name, ws]) => {
      const S = ws.reduce((a, w) => a + w.length, 0);
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
    return [
      table(
        [
          "단어 집합",
          "S",
          "하한 max|w| + 1",
          "실제 V",
          "상한 S + 1",
          "어디인가",
        ],
        rows,
        ["l", "r", "r", "r", "r", "l"],
      ),
      "",
      `제약 규모 S = ${num(LIMIT)} 에서 노드 수는 많아야 ${num(LIMIT + 1)} 개다`,
      `  자식을 26 칸 배열로 잡으면 ${num(26)} × ${num(LIMIT + 1)} = ${num(26 * (LIMIT + 1))} 칸`,
      `  자식을 맵으로 잡으면 간선 수만큼이라 많아야 ${num(LIMIT)} 항목`,
      "└ 둘째 줄은 공통 접두사가 하나도 없어 상한과 정확히 같아지는 입력이다",
    ].join("\n");
  },

  /** `invariant` ③ — 경로를 잇는 줄을 바꾸면 무엇이 어떻게 나오는가. */
  mutantPathReset: () => {
    const good = new Trie();
    const bad = new resetToRoot.Trie();
    for (const w of WORDS) {
      good.insert(w);
      bad.insert(w);
    }
    const rows = [
      ...QUERIES.map(([op, q]) => [
        `${op}("${q}")`,
        yn(good[op](q)),
        yn(bad[op](q)),
        good[op](q) === bad[op](q) ? "같다" : "틀리다",
      ]),
      [
        'startsWith("e")',
        yn(good.startsWith("e")),
        yn(bad.startsWith("e")),
        good.startsWith("e") === bad.startsWith("e") ? "같다" : "틀리다",
      ],
    ];
    return [
      table(["조회", "정본이 낸 답", "경로를 안 잇는 답", "판정"], rows, [
        "l",
        "r",
        "r",
        "l",
      ]),
      "",
      `정본의 노드 경로 집합   ${pathSet(good)}`,
      `변이의 노드 경로 집합   ${pathSet(bad)}`,
      "└ 글자가 순서를 잃고 전부 뿌리의 자식이 된다. 변이 쪽 마지막 원소는 어떤 단어의 접두사도 아니다",
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
        `insert("${w}")`,
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
        `${op}("${q}")`,
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
    const S = WORDS.reduce((a, w) => a + w.length, 0);
    return [
      table(
        ["연산", "자식 맵 조회", "노드 생성", "끝 표시 읽기·쓰기", "기본 연산"],
        rows,
        ["l", "r", "r", "r", "r"],
      ),
      "",
      `삽입 쪽 총식   S + (V - 1) + N = ${S} + ${countNodes(root) - 1} + ${WORDS.length} = ${S + countNodes(root) - 1 + WORDS.length}`,
      `조회 쪽 총식   읽은 글자 합 + search 횟수 = ${qLookups} + ${endReads} = ${qLookups + endReads}`,
      "└ 어느 항에도 담긴 단어의 개수를 곱하는 자리가 없다",
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
      const hit = trieWalk(trie, q);
      return [
        name,
        num(ws.reduce((a, w) => a + w.length, 0)),
        num(countNodes(trie)),
        num(hit.read),
      ];
    });
    return [
      table(
        [
          "입력의 모양",
          "길이 합",
          "노드 수",
          "그 사전에서 가장 긴 조회가 읽은 글자",
        ],
        rows,
        ["l", "r", "r", "r"],
      ),
      "",
      "└ 위 세 줄은 길이 합이 똑같이 100,000 인데 노드 수가 여든 배 넘게 갈린다 — 정하는 것은 공유의 정도다",
      "  넷째 줄은 단어가 26 개인데 조회가 1 글자에서 끝난다. 조회 비용은 단어 개수를 안 본다",
    ].join("\n");
  },

  /** `deep.walk.final` — 전체 코드를 그대로 실행한 결과. 앞에서 안 나온 경계 셋을 함께 건다. */
  finalRun: () => {
    const trie = new Trie();
    for (const w of WORDS) trie.insert(w);
    const empty = new Trie();
    const rows: string[][] = [
      ...QUERIES.map(([op, q]) => [`trie.${op}("${q}")`, yn(trie[op](q))]),
      ['trie.startsWith("apple")', yn(trie.startsWith("apple"))],
      ['trie.search("applepie")', yn(trie.search("applepie"))],
      ['빈 트라이의 search("app")', yn(empty.search("app"))],
      ['빈 트라이의 startsWith("app")', yn(empty.startsWith("app"))],
    ];
    // 같은 단어를 두 번 담아도 답이 그대로인가.
    const twice = new Trie();
    twice.insert("app");
    twice.insert("app");
    rows.push(['app 을 두 번 담은 뒤 search("app")', yn(twice.search("app"))]);
    return [
      table(["실행", "결과"], rows, ["l", "l"]),
      "",
      "└ 아래 다섯은 전개에서 안 나온 자리다 — 단어와 같은 접두사, 담긴 단어보다 긴 조회, 빈 트라이, 중복 삽입",
    ].join("\n");
  },

  /** `purpose.alt` — 저장 칸이 뒤집히는 공유 길이를 스윕으로 찾는다. */
  altCells: () => {
    const rows: string[][] = [];
    for (const p of [0, 20, 40, 46, 47, 48, 49, 60, 90]) {
      const words = CORPUS(DICT_N, p);
      const t = trieCells(words);
      const a = arrayCells(words);
      rows.push([
        String(p),
        num(t),
        num(a),
        t < a ? "트라이가 적다" : "배열이 적다",
      ]);
    }
    return [
      table(
        [
          "공통 접두사 길이",
          "트라이 저장 칸",
          "정렬 배열 저장 칸",
          "어느 쪽이 적은가",
        ],
        rows,
        ["r", "r", "r", "l"],
      ),
      "",
      "└ 단어 1,000 개 · 길이 100 · 길이 합 100,000 은 아홉 줄이 다 같다. 공통 접두사 길이만 바꿨다",
      "  47 과 48 사이에서 순서가 뒤집힌다",
    ].join("\n");
  },
};
