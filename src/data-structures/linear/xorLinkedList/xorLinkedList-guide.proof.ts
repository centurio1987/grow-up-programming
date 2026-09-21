/**
 * 원고가 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — 원고의 구현 코드와 정본(`_reference/xorLinkedList.ts`)을 실행하고,
 * 변이는 정본 소스에서 기계로 만든다.
 *
 *   bun run tools/check-proof.ts src/data-structures/linear/xorLinkedList/xorLinkedList-guide.md
 *
 * - `implementations` — 원고에 실린 세 구현 코드(배열 · 이중 연결 리스트 · XOR 추출본)를 그대로
 *   꺼내 트랜스파일하고, 정본과 함께 배열 모델과 무작위 연산 · 경계 입력으로 대조한다.
 * - 상태를 보이는 블록은 정본과 같은 절차의 사본 `XorCopy` 를 쓰되, 호출마다 정본과 반환값 ·
 *   `__cost` 증가분이 같은지 확인한다(`agree`).
 * - `rust-nodes` · `rust-walk` — Rust 구현 소절의 예시 주소로 `xor_addr` 와 두 방향 읽기를
 *   계산한다. Rust 코드 자체는 `cargo test`(`rust/structures/tests/xor_linked_list.rs`)가 검증한다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { XorLinkedList } from "./_reference/xorLinkedList.ts";
import {
  type XorLinkedListContract,
  xorLinkedListContract,
} from "./xorLinkedList.contract.ts";
import { walk } from "./xorLinkedList-guide.sim.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/**
 * 한글은 고정폭 화면에서 두 칸을 먹는다. 칸 맞춤을 글자 수로 하면 한글이 섞인 줄만
 * 어긋난다. 한글·가나·한자 구간을 두 칸으로 센다.
 */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/**
 * 머리줄 하나와 본문 여러 줄을 열 폭에 맞춰 그린다. `left` 에 든 열은 왼쪽, 나머지는 오른쪽
 * 정렬이다. 첫 열은 언제나 왼쪽이다.
 */
function table(head: string[], body: string[][], left: number[] = []): string {
  // 빈 칸은 「—」로 채운다. 칸이 비면 열 판정(P15)이 그 줄의 다음 칸을 이 열로 읽는다.
  const rows = body.map((r) => r.map((v) => (v === "" ? "—" : v)));
  const cols = head.length;
  const w: number[] = [];
  for (let c = 0; c < cols; c++) {
    w.push(
      Math.max(width(head[c] ?? ""), ...rows.map((r) => width(r[c] ?? ""))),
    );
  }
  const line = (cells: string[]): string =>
    cells
      .map((v, c) =>
        c === 0 || left.includes(c) ? pad(v, w[c] ?? 0) : padL(v, w[c] ?? 0),
      )
      .join("   ")
      .replace(/\s+$/, "");
  return [line(head), ...rows.map(line)].join("\n");
}

const num = (n: number): string => n.toLocaleString("en-US");

/** 수열을 본문 표기로 — `[10 0 30]`. 쉼표를 안 쓰는 것은 걸음 표의 다른 칸과 맞추려는 것이다. */
const seq = (values: readonly number[]): string => `[${values.join(" ")}]`;

/** 반환값을 본문 표기로. 던진 오류는 그 메시지를 적는다. */
const show = (v: unknown): string => {
  if (Array.isArray(v)) return seq(v as number[]);
  if (v === undefined) return "—";
  return String(v);
};

/** 호출을 실행해 반환값을 얻는다. 던지면 「오류: 메시지」 문자열이 반환값 자리에 온다. */
function attempt(fn: () => unknown): unknown {
  try {
    return fn();
  } catch (e) {
    return `오류: ${(e as Error).message}`;
  }
}

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const verdict = (a: unknown, b: unknown): string =>
  same(a, b) ? "같다" : "어긋난다";

/* ────────────────────────── 호출 열 ────────────────────────── */

type OpName = keyof XorLinkedListContract;

interface Call {
  op: OpName;
  arg?: number;
}

const label = (c: Call): string =>
  c.arg === undefined ? `${c.op}()` : `${c.op}(${c.arg})`;

/** 호출 하나를 어느 구현에든 건다. */
function apply(d: XorLinkedListContract, c: Call): unknown {
  switch (c.op) {
    case "append":
      return d.append(c.arg ?? 0);
    case "toArray":
      return d.toArray();
    case "toArrayReverse":
      return d.toArrayReverse();
  }
}

/**
 * 「수행으로 알아보는 자료구조」가 끝까지 쓰는 연산 열. 여섯 번이다.
 *
 * 세 연산이 모두 한 번 이상 나오고, 빈 수열의 순회 · 빈 수열에 붙이기 · 옛 꼬리에 잇기 ·
 * **빈자리 표시 `NIL` 과 같은 수인 값 0** · 두 방향 순회가 전부 들어 있다.
 */
export const WALK: Call[] = [
  { op: "toArray" },
  { op: "append", arg: 10 },
  { op: "append", arg: 0 },
  { op: "append", arg: 30 },
  { op: "toArray" },
  { op: "toArrayReverse" },
];

const appends = (values: readonly number[]): Call[] =>
  values.map((v): Call => ({ op: "append", arg: v }));

/* ────────────────────────── 상태를 보이는 사본 ────────────────────────── */

const NIL = 0;

interface CopyNode {
  id: number;
  value: number;
  x: number;
}

/** 순회 한 걸음. 표의 「prev · curr · 다음」 칸이 이것을 읽는다. */
interface Iter {
  prev: number;
  curr: number;
  x: number;
  next: number;
  /** 이 걸음까지 담은 값. */
  values: number[];
}

/** 붙이기 한 번. */
interface Joined {
  id: number;
  /** 빈 수열에 붙였는가(① 갈래). */
  empty: boolean;
  /** 옛 꼬리 id 와 그 x 의 전·후. 빈 수열이면 없다. */
  oldTail: { id: number; before: number; after: number } | null;
}

/**
 * 정본과 같은 절차. 상태를 읽을 수 있게 열어 두었고, 비용을 정본과 같은 자리에서 센다 — 노드를
 * 표에서 찾을 때 1, 새 노드를 만들 때 1.
 *
 * 생성자 인자 둘을 바꿔 끼우면 **한 줄만 다른 사본**이 된다 — 멈춤 절이 그 사본으로 상태를
 * 보이고, 그 사본의 반환값이 기계로 만든 변이와 같은지를 따로 확인한다.
 *
 * - `firstId` — 처음 나눠 줄 id. 정본은 1 이다.
 * - `carry` — 한 걸음을 옮길 때 `prev` 에 넣는 것. 정본은 방금 읽은 노드(`curr`)다.
 */
class XorCopy {
  nodes = new Map<number, CopyNode>();
  head = NIL;
  tail = NIL;
  nextId: number;
  cost = 0;

  constructor(
    readonly firstId = 1,
    readonly carry: "curr" | "next" = "curr",
  ) {
    this.nextId = firstId;
  }

  at(id: number): CopyNode {
    this.cost += 1;
    const node = this.nodes.get(id);
    if (node === undefined) {
      throw new Error(`표에 없는 id 를 따라갔다: ${id}`);
    }
    return node;
  }

  append(value: number): Joined {
    const id = this.nextId++;
    this.nodes.set(id, { id, value, x: this.tail });
    this.cost += 1;
    let oldTail: Joined["oldTail"] = null;
    const empty = this.tail === NIL;
    if (empty) {
      this.head = id;
    } else {
      const tail = this.at(this.tail);
      const before = tail.x;
      tail.x ^= id;
      oldTail = { id: tail.id, before, after: tail.x };
    }
    this.tail = id;
    return { id, empty, oldTail };
  }

  /** 순회. 걸음마다 기록을 남긴다. 사본이라 무한히 반복하지 않게 걸음 수를 막아 둔다. */
  walk(start: number): Iter[] {
    const iters: Iter[] = [];
    const values: number[] = [];
    let prev = NIL;
    let curr = start;
    while (curr !== NIL) {
      if (iters.length > 64) throw new Error("사본의 순회가 끝나지 않는다");
      const node = this.at(curr);
      values.push(node.value);
      const next = node.x ^ prev;
      iters.push({ prev, curr, x: node.x, next, values: [...values] });
      prev = this.carry === "curr" ? curr : next;
      curr = next;
    }
    return iters;
  }

  /** 노드 표를 id 순서로. 칸은 `값/x저장값`, 빈 칸은 `·`. */
  cells(slots: number): string[] {
    const out: string[] = [];
    for (let id = this.firstId; id < this.firstId + slots; id++) {
      const n = this.nodes.get(id);
      out.push(n === undefined ? "·" : `${n.value}/x${n.x}`);
    }
    return out;
  }
}

/* ────────────────────────── 정본과 나란히 ────────────────────────── */

type Kind = "append" | "walk";

/** 걸음 표의 한 줄. 순회는 노드 하나를 읽을 때마다 한 줄이다. */
export interface Row {
  t: number;
  call: Call;
  kind: Kind;
  /** 붙이기면 무엇을 했는가. */
  joined: Joined | null;
  /** 순회면 이 걸음. 빈 수열의 순회는 걸음이 없어 `null` 이다. */
  iter: Iter | null;
  /** 이 호출의 마지막 줄인가. 반환값은 마지막 줄에만 적는다. */
  last: boolean;
  out: unknown;
  cost: number;
  head: number;
  tail: number;
  cells: string[];
}

/** 표의 칸 수. 전개가 붙이는 원소가 셋이라 셋으로 고정한다. */
const SLOTS = 3;

/**
 * 사본과 정본을 나란히 실행한다. 반환값이나 호출 하나의 비용 증가분이 하나라도 다르면 던진다.
 * 순회는 걸음마다 한 줄로 펼친다.
 */
function agree(calls: Call[]): Row[] {
  const ref = new XorLinkedList();
  const mine = new XorCopy();
  const rows: Row[] = [];
  let t = 0;
  for (const [index, c] of calls.entries()) {
    const refBefore = ref.__cost;
    const mineBefore = mine.cost;
    const refOut = apply(ref, c);
    const snap = (): Pick<Row, "head" | "tail" | "cells"> => ({
      head: mine.head,
      tail: mine.tail,
      cells: mine.cells(SLOTS),
    });
    if (c.op === "append") {
      const joined = mine.append(c.arg ?? 0);
      rows.push({
        t: ++t,
        call: c,
        kind: "append",
        joined,
        iter: null,
        last: true,
        out: undefined,
        cost: mine.cost - mineBefore,
        ...snap(),
      });
    } else {
      const start = c.op === "toArray" ? mine.head : mine.tail;
      const iters = mine.walk(start);
      const out = iters.at(-1)?.values ?? [];
      if (!same(out, refOut)) {
        throw new Error(
          `사본 ${label(c)} ${show(out)} · 정본 ${show(refOut)} — ${index + 1} 번째 호출`,
        );
      }
      if (iters.length === 0) {
        rows.push({
          t: ++t,
          call: c,
          kind: "walk",
          joined: null,
          iter: null,
          last: true,
          out,
          cost: 0,
          ...snap(),
        });
      }
      for (const [k, iter] of iters.entries()) {
        rows.push({
          t: ++t,
          call: c,
          kind: "walk",
          joined: null,
          iter,
          last: k === iters.length - 1,
          out: k === iters.length - 1 ? out : undefined,
          cost: 1,
          ...snap(),
        });
      }
    }
    const refCost = ref.__cost - refBefore;
    const mineCost = mine.cost - mineBefore;
    if (refCost !== mineCost) {
      throw new Error(
        `사본이 정본과 비용이 다르다 — ${index + 1} 번째 ${label(c)}: 정본 ${refCost}, 사본 ${mineCost}`,
      );
    }
  }
  return rows;
}

export const WALK_ROWS = agree(WALK);

/* ────────────────────────── 원고의 구현 코드 ────────────────────────── */

type Constructor = new () => XorLinkedListContract;
type GuideClasses = Record<
  "ArrayList" | "DoublyLinkedList" | "XorLinkedList",
  Constructor
>;

/** 원고의 구현 코드 세 블록을 꺼내 트랜스파일한다. 블록을 실행할 때 부른다. */
async function guideClasses(): Promise<GuideClasses> {
  const md = await Bun.file(
    new URL("./xorLinkedList-guide.md", import.meta.url),
  ).text();
  const blocks = [...md.matchAll(/```ts[^\n]*\n([\s\S]*?)```/g)]
    .map((match) => match[1] ?? "")
    .filter((code) =>
      /export class (ArrayList|DoublyLinkedList|XorLinkedList)\b/.test(code),
    );
  if (blocks.length !== 3) {
    throw new Error(`구현 코드 세 개가 필요한데 ${blocks.length} 개다`);
  }
  const js = new Bun.Transpiler({ loader: "ts" }).transformSync(
    blocks.join("\n"),
  );
  return new Function(
    `${js.replaceAll("export class", "class")}\nreturn { ArrayList, DoublyLinkedList, XorLinkedList };`,
  )() as GuideClasses;
}

const fromGuide = await guideClasses().catch(() => null);

/** 구현 하나를 배열 모델과 나란히 실행한다. 두 순회의 반환값이 하나라도 다르면 던진다. */
function againstModel(name: string, Ctor: Constructor): void {
  const d = new Ctor();
  const model: number[] = [];
  const agreeNow = (where: string): void => {
    const checks: [string, unknown, unknown][] = [
      ["toArray()", d.toArray(), model],
      ["toArrayReverse()", d.toArrayReverse(), [...model].reverse()],
    ];
    for (const [what, got, want] of checks) {
      if (!same(got, want)) {
        throw new Error(
          `${name} — ${where} 뒤 ${what}: ${show(got)} · 모델 ${show(want)}`,
        );
      }
    }
  };
  agreeNow("빈 수열");
  for (const v of [0, 0, -1, 7, 7]) {
    d.append(v);
    model.push(v);
    agreeNow(`append(${v})`);
  }
  let seed = 731;
  for (let i = 0; i < 20000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    if (seed % 5 < 3) {
      const v = (seed % 201) - 100;
      d.append(v);
      model.push(v);
    }
    if (i % 997 === 0) agreeNow(`${i + 1} 번째 연산`);
  }
  agreeNow("무작위 연산 20,000회");
}

const REF_PATH = new URL("./_reference/xorLinkedList.ts", import.meta.url)
  .pathname;

type XorModule = { XorLinkedList: typeof XorLinkedList };

/** id 를 0 부터 나눠 주는 사본. 첫 id 가 빈자리 표시 `NIL` 과 같은 수가 된다. */
const idFromZero = await loadMutant<XorModule>(REF_PATH, {
  swap: [/#nextId = 1;/, "#nextId = 0;"],
});

/** 순회 한 걸음을 옮길 때 `prevId` 에 방금 읽은 노드가 아니라 다음 노드를 넣는 사본. */
const carryNext = await loadMutant<XorModule>(REF_PATH, {
  swap: [/prevId = currId;/, "prevId = nextId;"],
});

/** 옛 꼬리의 x 에 새 id 를 XOR 로 섞지 않고 덮어쓰는 사본. */
const overwrite = await loadMutant<XorModule>(REF_PATH, {
  swap: [/tail\.xorId \^= id;/, "tail.xorId = id;"],
});

/**
 * 중화 실행인가. `loadMutant` 가 변이를 적용하지 않으면 정본 모듈을 그대로 돌려주므로, 클래스가
 * 정본과 **같은 객체**다. 그때는 「변이가 답을 바꿨다」 자기검사를 건너뛴다(`algo SPEC` §0).
 */
const neutral = (m: XorModule): boolean => m.XorLinkedList === XorLinkedList;

/**
 * 붙이기 열 여러 벌을 정본과 변이로 실행하고, 붙인 뒤 부르는 호출마다 한 줄씩 낸다. 변이가 어느
 * 줄에서도 값을 안 바꾸면 던진다 — 「깨진다」가 거짓이다.
 */
function mutantTable(
  mutant: XorModule,
  inputs: number[][],
  reads: OpName[],
  wrongHead: string,
): string {
  const rows: string[][] = [];
  let changed = false;
  for (const values of inputs) {
    const a = new XorLinkedList();
    const b = new mutant.XorLinkedList();
    for (const v of values) {
      a.append(v);
      b.append(v);
    }
    for (const op of reads) {
      const right = attempt(() => apply(a, { op }));
      const wrong = attempt(() => apply(b, { op }));
      if (!same(right, wrong)) changed = true;
      rows.push([
        `append ${values.join(" · ")}`,
        `${op}()`,
        show(right),
        show(wrong),
        verdict(right, wrong),
      ]);
    }
  }
  if (!neutral(mutant) && !changed) {
    throw new Error(
      "변이가 어느 호출에서도 값을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
  return table(
    ["붙인 값", "호출", "바른 코드", wrongHead, "판정"],
    rows,
    [1, 2, 3],
  );
}

/* ────────────────────────── Rust 예시 주소 ────────────────────────── */

/**
 * Rust 구현 소절의 예시 주소. 할당기가 실제로 주는 값이 아니라 읽기 쉬운 값이고, 간격을
 * 고르지 않게 두어 노드마다 `xor_addr` 가 달라지게 했다. 주소 0 은 널 포인터라 쓰지 않는다.
 */
const RUST_NODES = [
  { name: "A", addr: 0x1000, value: 10 },
  { name: "B", addr: 0x1010, value: 20 },
  { name: "C", addr: 0x1030, value: 30 },
] as const;

const hex = (n: number): string => `0x${n.toString(16).padStart(4, "0")}`;

const rustXor = (i: number): number =>
  (RUST_NODES[i - 1]?.addr ?? 0) ^ (RUST_NODES[i + 1]?.addr ?? 0);

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 원고의 세 구현 코드와 정본을 배열 모델과 대조한다. */
  implementations: () => {
    if (fromGuide === null)
      throw new Error("원고에서 구현 코드 세 개를 못 읽었다");
    againstModel("배열 구현 코드", fromGuide.ArrayList);
    againstModel("이중 연결 리스트 구현 코드", fromGuide.DoublyLinkedList);
    againstModel("XOR 연결 리스트 전체 코드", fromGuide.XorLinkedList);
    againstModel("정본", XorLinkedList);
    return [
      "원고의 세 구현 코드와 정본: 각각 배열 모델과 대조해 일치",
      "빈 수열 · 값 0 두 번 · 음수 · 중복 · 무작위 붙이기 20,000회 뒤 toArray() · toArrayReverse()",
    ].join("\n");
  },

  /**
   * `perf.worst` — 정본에 뒤로만 붙일 때 붙이기 한 번의 평균 비용이 n 에 따라 자라지 않는가.
   * 비용은 정본의 `__cost`(노드를 표에서 찾을 때 1, 새 노드를 만들 때 1)다. 벽시계가 아니다.
   */
  growth: () => {
    let previous: number | undefined;
    const lines = [
      "정본에 뒤로만 붙이기: n, 붙이기 한 번의 평균 비용, 이전 크기 대비 비율",
    ];
    for (const n of [1024, 4096, 16384]) {
      const d = new XorLinkedList();
      for (let i = 0; i < n; i++) d.append(i);
      const average = d.__cost / n;
      lines.push(
        `${num(n)}, ${average.toFixed(6)}, ${previous === undefined ? "—" : (average / previous).toFixed(3)}`,
      );
      previous = average;
    }
    return lines.join("\n");
  },

  /** `deep.walk.step` 3 — 같은 노드 표를 앞 끝과 뒤 끝에서 한 번씩 순회한다. */
  "two-directions": () => {
    const rows = agree([
      ...appends([10, 20, 30]),
      { op: "toArray" },
      { op: "toArrayReverse" },
    ]);
    const body = rows
      .filter((r) => r.iter !== null)
      .map((r) => {
        const it = r.iter as Iter;
        return [
          r.call.op === "toArray" ? "앞에서부터" : "뒤에서부터",
          num(it.prev),
          num(it.curr),
          num(it.x),
          `${it.x} ^ ${it.prev} = ${it.next}`,
          seq(it.values),
        ];
      });
    return table(
      ["출발", "prev", "curr", "xorId(curr)", "다음 = xorId ^ prev", "담은 값"],
      body,
      [4],
    );
  },

  /**
   * Rust 구현 소절 — 예시 주소로 노드마다 `xor_addr` 를 계산한다. 주소는 실행마다 다르므로
   * 원고가 예시 값이라고 밝히고, 여기서는 그 주소로 XOR 계산이 맞는지만 보인다.
   */
  "rust-nodes": () =>
    table(
      ["노드", "주소", "값", "이전 주소", "다음 주소", "xor_addr"],
      RUST_NODES.map((n, i) => [
        n.name,
        hex(n.addr),
        num(n.value),
        hex(RUST_NODES[i - 1]?.addr ?? 0),
        hex(RUST_NODES[i + 1]?.addr ?? 0),
        hex(rustXor(i)),
      ]),
      [1, 3, 4, 5],
    ),

  /** Rust 구현 소절 — 같은 예시 주소로 두 방향을 읽는다. 주소 0 에서 멈춘다. */
  "rust-walk": () => {
    const body: string[][] = [];
    for (const [from, start] of [
      ["앞에서부터", 0],
      ["뒤에서부터", RUST_NODES.length - 1],
    ] as const) {
      const byAddr = new Map<number, number>(
        RUST_NODES.map((n, i) => [n.addr, i]),
      );
      const values: number[] = [];
      let prev = 0;
      let curr = RUST_NODES[start]?.addr ?? 0;
      while (curr !== 0) {
        const i = byAddr.get(curr);
        if (i === undefined) throw new Error(`예시에 없는 주소: ${hex(curr)}`);
        const x = rustXor(i);
        const next = x ^ prev;
        values.push(RUST_NODES[i]?.value ?? Number.NaN);
        body.push([
          from,
          hex(prev),
          hex(curr),
          hex(x),
          `${hex(x)} ^ ${hex(prev)} = ${hex(next)}`,
          seq(values),
        ]);
        prev = curr;
        curr = next;
      }
    }
    const forward = body.filter((r) => r[0] === "앞에서부터").at(-1)?.[5];
    if (forward !== seq(RUST_NODES.map((n) => n.value))) {
      throw new Error(`앞에서부터 읽은 값이 붙인 순서와 다르다: ${forward}`);
    }
    return table(
      [
        "출발",
        "prev",
        "curr",
        "xor_addr(curr)",
        "다음 = xor_addr ^ prev",
        "담은 값",
      ],
      body,
      [1, 2, 3, 4],
    );
  },

  /** `deep.walk.step` 3 — 붙일 때마다 새 노드의 x 와 옛 꼬리의 x 가 어떻게 바뀌는가. */
  "append-states": () => {
    const rows = agree(appends([10, 20, 30, 40]));
    const body = rows.map((r) => {
      const j = r.joined as Joined;
      return [
        label(r.call),
        num(j.id),
        num(j.oldTail?.id ?? NIL),
        j.oldTail === null
          ? "빈 리스트 — 마지막 노드 없음"
          : `id ${j.oldTail.id}: ${j.oldTail.before} ^ ${j.id} = ${j.oldTail.after}`,
        num(r.head),
        num(r.tail),
      ];
    });
    return table(
      [
        "호출",
        "새 id",
        "새 노드의 xorId",
        "기존 마지막 노드의 xorId",
        "headId",
        "tailId",
      ],
      body,
      [3],
    );
  },

  /**
   * `deep.walk.step` 4 의 `<!--viz:walk-->` 아래 그림. **시뮬 프레임과 한 걸음씩 맞댄다** — 프레임이
   * 실행과 다르면 던진다.
   */
  "walk-viz": () => {
    if (walk.steps.length !== WALK_ROWS.length) {
      throw new Error(
        `실행 걸음 ${WALK_ROWS.length} 과 시뮬 프레임 ${walk.steps.length} 이 다르다`,
      );
    }
    for (const [index, frame] of walk.steps.entries()) {
      const r = WALK_ROWS[index] as Row;
      const want = JSON.stringify(frameOf(r));
      const got = JSON.stringify({
        title: frame.title,
        array: frame.array,
        entries: frame.entries,
      });
      if (want !== got) {
        throw new Error(
          `프레임 ${index + 1} 이 실행과 다르다\n  실행 ${want}\n  시뮬 ${got}`,
        );
      }
    }
    return table(
      [
        "단계",
        "노드 표 (id 1 · 2 · 3)",
        "headId",
        "tailId",
        "prev",
        "curr",
        "담은 값",
      ],
      WALK_ROWS.map((r) => [
        `T${r.t}`,
        r.cells.join(" "),
        num(r.head),
        num(r.tail),
        r.iter === null ? "" : num(r.iter.prev),
        r.iter === null ? "" : num(r.iter.curr),
        r.iter === null ? (r.kind === "walk" ? "[]" : "") : seq(r.iter.values),
      ]),
      [1],
    );
  },

  /** `deep.walk.step` 4 — 전개 연산 열의 걸음 표. */
  "walk-trace": () =>
    table(
      ["단계", "호출", "조건", "계산", "돌려준 값", "비용"],
      WALK_ROWS.map((r) => [
        `T${r.t}`,
        label(r.call),
        condition(r),
        calc(r),
        r.last && r.kind !== "append" ? show(r.out) : "",
        num(r.cost),
      ]),
      [1, 2, 3],
    ),

  /**
   * `deep.walk.pause` — 헷갈리기 쉬운 두 줄을 바꾼 정본을 전개와 같은 붙이기 열에 건다. 바꾼
   * 코드는 정본 소스에서 기계로 만든다.
   */
  pitfalls: () => {
    const rows: string[][] = [];
    let changed = false;
    const cases: [string, XorModule, number[], OpName][] = [
      ["#nextId = 0;", idFromZero, [10], "toArray"],
      ["#nextId = 0;", idFromZero, [10, 0, 30], "toArray"],
      ["prevId = nextId;", carryNext, [10, 0, 30], "toArray"],
      ["prevId = nextId;", carryNext, [10, 0], "toArray"],
      ["prevId = nextId;", carryNext, [10, 20, 30, 40], "toArrayReverse"],
    ];
    for (const [line, mutant, values, read] of cases) {
      const right = new XorLinkedList();
      const wrong = new mutant.XorLinkedList();
      for (const v of values) {
        right.append(v);
        wrong.append(v);
      }
      const a = attempt(() => apply(right, { op: read }));
      const b = attempt(() => apply(wrong, { op: read }));
      if (!same(a, b)) changed = true;
      rows.push([
        line,
        `append ${values.join(" · ")}`,
        `${read}()`,
        show(b),
        show(a),
      ]);
    }
    if (!neutral(idFromZero) && !neutral(carryNext) && !changed) {
      throw new Error("변이가 어느 입력에서도 결과를 바꾸지 못했다");
    }
    return table(
      ["바꾼 줄", "붙인 값", "호출", "바꾼 코드의 결과", "정본의 결과"],
      rows,
      [1, 2, 3, 4],
    );
  },

  /** `invariant` ③ — 옛 꼬리의 x 를 XOR 대신 덮어썼다. */
  "mutant-overwrite": () =>
    mutantTable(
      overwrite,
      [
        [10, 20],
        [10, 20, 30],
      ],
      ["toArray", "toArrayReverse"],
      "덮어쓴 코드",
    ),

  /**
   * `invariant` ③ — 같은 변이에 계약의 불변식 검사 함수를 그대로 건다.
   *
   * 불변식 이름은 본문의 순서 표기(첫째 · 둘째)로 적는다. 계약 파일의 이름에는 「같다」가
   * 들어 있어, 그대로 실으면 `check-proof` 가 그 칸을 판정 열로 읽는다.
   */
  "mutant-overwrite-invariants": () => {
    const labels = ["두 방향의 수열"];
    if (xorLinkedListContract.invariants.length !== labels.length) {
      throw new Error("계약의 불변식 수가 본문의 표기와 다르다");
    }
    const rows: string[][] = [];
    for (const values of [
      [10, 20],
      [10, 20, 30],
    ]) {
      const d = new overwrite.XorLinkedList();
      for (const v of values) d.append(v);
      for (const [i, inv] of xorLinkedListContract.invariants.entries()) {
        rows.push([
          `append ${values.join(" · ")}`,
          labels[i] as string,
          inv.check(d) ?? "지킨다",
        ]);
      }
    }
    return table(["붙인 값", "불변식", "덮어쓴 코드에서"], rows, [1, 2]);
  },
};

/* ────────────────────────── 보조 ────────────────────────── */

/** 걸음 표의 「조건」 칸. */
function condition(r: Row): string {
  if (r.kind === "append") {
    const j = r.joined as Joined;
    return j.empty
      ? "tailId 0 = NIL — 빈 수열에 붙인다"
      : `tailId ${j.oldTail?.id ?? NIL} ≠ NIL — 마지막 노드 뒤에 잇는다`;
  }
  if (r.iter === null) return "currId 0 = NIL — 읽을 노드가 없다";
  const head = `currId ${r.iter.curr} ≠ NIL`;
  return r.last ? `${head} · 다음 0 = NIL — 끝` : head;
}

/** 걸음 표의 「계산」 칸. */
function calc(r: Row): string {
  if (r.kind === "append") {
    const j = r.joined as Joined;
    const made = `id ${j.id} · xorId ${j.oldTail?.id ?? NIL}`;
    return j.oldTail === null
      ? made
      : `${made} · id ${j.oldTail.id}: ${j.oldTail.before} ^ ${j.id} = ${j.oldTail.after}`;
  }
  if (r.iter === null) return "";
  return `다음 = ${r.iter.x} ^ ${r.iter.prev} = ${r.iter.next}`;
}

/** 시뮬 프레임이 담아야 하는 값. `walk-viz` 가 이것과 프레임을 맞댄다. */
export function frameOf(r: Row): {
  title: string;
  array: string[];
  entries: { label: string; value: string | number }[];
} {
  const entries: { label: string; value: string | number }[] = [
    { label: "head", value: r.head },
    { label: "tail", value: r.tail },
  ];
  if (r.iter !== null) {
    entries.push(
      { label: "prev", value: r.iter.prev },
      { label: "curr", value: r.iter.curr },
      {
        label: "다음 = x ^ prev",
        value: `${r.iter.x} ^ ${r.iter.prev} = ${r.iter.next}`,
      },
      { label: "담은 값", value: seq(r.iter.values) },
    );
  } else if (r.kind === "walk") {
    entries.push({ label: "담은 값", value: "[]" });
  }
  return { title: `T${r.t} ${label(r.call)}`, array: r.cells, entries };
}
