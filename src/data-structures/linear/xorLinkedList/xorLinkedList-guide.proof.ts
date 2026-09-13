/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`_reference/xorLinkedList.ts`)을 부르고, 변이는 그 소스에서
 * 기계로 만든다.** 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도
 * 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/data-structures/linear/xorLinkedList/xorLinkedList-guide.md
 *
 * 정본은 노드 표(`#nodes`)와 id 넷(`#headId`·`#tailId`·`#count`·`#nextId`)을 private 으로
 * 감춘다. 그래서 상태를 보여 주는 블록은 같은 절차의 사본 `XorCopy` 를 쓰되, **호출마다 정본과
 * 반환값·`__cost` 증가분이 같은지 확인**하고 어긋나면 던진다(`agree`). 사본이 정본에서 갈라지면
 * 그 자리에서 실패한다.
 *
 * 경쟁 설계(배열 하나 · 뒤 끝을 안 드는 사슬 · 이중 연결 리스트)의 비용은 **계약 스위트의 판정
 * 함수 `judgeScenario` 에 그대로 넣어** 얻는다. 본문이 인용하는 성장률이 축3 이 실제로 내는
 * 값과 같은 값이어야 해서다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { judgeScenario } from "../../_contract/runContract.ts";
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
const fixed2 = (n: number): string =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
    case "size":
      return d.size();
  }
}

/**
 * 「수행으로 알아보는 자료구조」가 끝까지 쓰는 연산 열. 여덟 번이다.
 *
 * 네 연산이 모두 한 번 이상 나오고, 빈 수열의 순회 · 빈 수열에 붙이기 · 옛 꼬리에 잇기 ·
 * **빈자리 표시 `NIL` 과 같은 수인 값 0** · 두 방향 순회가 전부 들어 있다.
 */
export const WALK: Call[] = [
  { op: "toArray" },
  { op: "size" },
  { op: "append", arg: 10 },
  { op: "append", arg: 0 },
  { op: "append", arg: 30 },
  { op: "size" },
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
  count = 0;
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
    this.count += 1;
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

  size(): number {
    this.cost += 1;
    return this.count;
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

type Kind = "append" | "walk" | "size";

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
  count: number;
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
    const snap = (): Pick<Row, "head" | "tail" | "count" | "cells"> => ({
      head: mine.head,
      tail: mine.tail,
      count: mine.count,
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
    } else if (c.op === "size") {
      const out = mine.size();
      if (out !== refOut) {
        throw new Error(`사본 size ${out} · 정본 ${String(refOut)}`);
      }
      rows.push({
        t: ++t,
        call: c,
        kind: "size",
        joined: null,
        iter: null,
        last: true,
        out,
        cost: 1,
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

/* ────────────────────────── 경쟁 설계 — 같은 단위로 센다 ────────────────────────── */

type Counted = XorLinkedListContract & { __cost: number };

/**
 * 배열 하나. 칸 8 개로 시작해 가득 차면 두 배로 늘린다.
 *
 * 비용 단위는 정본과 같은 뜻으로 맞춘다 — **원소 하나를 건드릴 때마다 1**. 붙이기는 칸 하나에
 * 쓰는 1 에, 가득 찬 순간이면 옮긴 원소 수를 더한다. 순회는 원소마다 1 이다.
 */
class GrowArray implements Counted {
  slots: number[] = new Array(8);
  count = 0;
  __cost = 0;
  append(value: number): void {
    if (this.count === this.slots.length) {
      const grown = new Array(this.slots.length * 2);
      for (let i = 0; i < this.count; i++) {
        this.__cost += 1;
        grown[i] = this.slots[i];
      }
      this.slots = grown;
    }
    this.__cost += 1;
    this.slots[this.count] = value;
    this.count += 1;
  }
  toArray(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.count; i++) {
      this.__cost += 1;
      out.push(this.slots[i] as number);
    }
    return out;
  }
  toArrayReverse(): number[] {
    const out: number[] = [];
    for (let i = this.count - 1; i >= 0; i--) {
      this.__cost += 1;
      out.push(this.slots[i] as number);
    }
    return out;
  }
  size(): number {
    this.__cost += 1;
    return this.count;
  }
}

/**
 * 뒤 끝을 안 드는 사슬. 노드가 뒤 이웃 하나만 들고, 붙일 때마다 앞 끝에서부터 뒤 끝을 찾는다.
 * 뒤→앞 순회는 앞→뒤로 모은 뒤 뒤집는다.
 *
 * 비용은 정본과 같은 자리에서 센다 — 노드를 들여다볼 때 1, 새 노드를 만들 때 1.
 */
class NoTailChain implements Counted {
  nodes: { value: number; next: number }[] = [];
  head = -1;
  __cost = 0;
  append(value: number): void {
    const id = this.nodes.length;
    this.nodes.push({ value, next: -1 });
    this.__cost += 1;
    if (this.head === -1) {
      this.head = id;
      return;
    }
    let at = this.head;
    for (;;) {
      this.__cost += 1;
      const node = this.nodes[at] as { value: number; next: number };
      if (node.next === -1) {
        node.next = id;
        return;
      }
      at = node.next;
    }
  }
  toArray(): number[] {
    const out: number[] = [];
    for (let at = this.head; at !== -1; ) {
      this.__cost += 1;
      const node = this.nodes[at] as { value: number; next: number };
      out.push(node.value);
      at = node.next;
    }
    return out;
  }
  toArrayReverse(): number[] {
    return this.toArray().reverse();
  }
  size(): number {
    this.__cost += 1;
    return this.nodes.length;
  }
}

interface DNode {
  value: number;
  prev: DNode | null;
  next: DNode | null;
}

/** 이중 연결 리스트. 노드가 앞 이웃과 뒤 이웃을 따로 든다. 비용 단위는 정본과 같다. */
class Doubly implements Counted {
  head: DNode | null = null;
  tail: DNode | null = null;
  count = 0;
  __cost = 0;
  append(value: number): void {
    const node: DNode = { value, prev: this.tail, next: null };
    this.__cost += 1;
    if (this.tail === null) {
      this.head = node;
    } else {
      this.__cost += 1;
      this.tail.next = node;
    }
    this.tail = node;
    this.count += 1;
  }
  #walk(start: DNode | null, forward: boolean): number[] {
    const out: number[] = [];
    for (let at = start; at !== null; at = forward ? at.next : at.prev) {
      this.__cost += 1;
      out.push(at.value);
    }
    return out;
  }
  toArray(): number[] {
    return this.#walk(this.head, true);
  }
  toArrayReverse(): number[] {
    return this.#walk(this.tail, false);
  }
  size(): number {
    this.__cost += 1;
    return this.count;
  }
}

/**
 * 경쟁 설계가 **답은 정본과 같은지** 먼저 확인한다. 비용만 다르고 답이 다르면 그것은 다른
 * 설계가 아니라 틀린 구현이고, 그 비용을 견주는 것은 의미가 없다.
 */
function agreeAnswers(make: () => Counted, name: string): void {
  let seed = 20260913;
  const next = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const ops: OpName[] = [
    "append",
    "append",
    "toArray",
    "toArrayReverse",
    "size",
  ];
  const ref = new XorLinkedList();
  const other = make();
  for (let i = 0; i < 600; i++) {
    const op = ops[Math.floor(next() * ops.length)] as OpName;
    const c: Call =
      op === "append" ? { op, arg: Math.floor(next() * 200) - 100 } : { op };
    const a = apply(ref, c);
    const b = apply(other, c);
    if (!same(a, b)) {
      throw new Error(
        `${name} 이 정본과 다른 답을 냈다 — ${i + 1} 번째 ${label(c)}: 정본 ${show(a)}, ${name} ${show(b)}`,
      );
    }
  }
}

agreeAnswers(() => new GrowArray(), "배열 하나");
agreeAnswers(() => new NoTailChain(), "뒤 끝을 안 드는 사슬");
agreeAnswers(() => new Doubly(), "이중 연결 리스트");

/* ────────────────────────── 축3 판정 — 계약 스위트의 함수 그대로 ────────────────────────── */

type Scenario = (typeof xorLinkedListContract.scenarios)[number];

interface Judged {
  stats: number[];
  ratios: number[];
  ok: boolean;
}

/** 계약의 검증 등급(`invariant`)을 그대로 넘긴다 — 축3 이 이 구조를 재는 엄격도와 같게. */
function judge(make: () => Counted, s: Scenario): Judged {
  const v = judgeScenario(
    { kind: "self-reported", make },
    s,
    xorLinkedListContract.grade,
  );
  const stats = v.points.map((p) => p.stat);
  const ratios = stats.slice(1).map((x, i) => x / (stats[i] as number));
  return { stats, ratios, ok: v.ok };
}

const DESIGNS: [string, () => Counted][] = [
  ["배열 하나", () => new GrowArray()],
  ["뒤 끝을 안 드는 사슬", () => new NoTailChain()],
  ["이중 연결 리스트", () => new Doubly()],
  ["XOR 연결 리스트(정본)", () => new XorLinkedList()],
];

/** 설계 하나를 네 시나리오에 넣은 표. */
function ratesOf(make: () => Counted): string {
  const rows = xorLinkedListContract.scenarios.map((s) => {
    const j = judge(make, s);
    return [
      s.covers.join("·"),
      s.bound,
      ...j.stats.map(fixed2),
      fixed2(j.ratios[0] as number),
      j.ok ? "통과" : "실패",
    ];
  });
  return table(
    ["시나리오가 부르는 연산", "상한", "n = 1,024", "n = 4,096", "r", "판정"],
    rows,
    [1],
  );
}

/* ────────────────────────── 변이 ────────────────────────── */

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
 * 붙이기 열 여러 벌을 정본과 변이에 걸고, 붙인 뒤 부르는 호출마다 한 줄씩 낸다. 변이가 어느
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

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /**
   * `deep.build` ② — 가장 단순한 구현. 배열 하나를 계약 스위트의 네 시나리오에 넣는다.
   */
  "array-rates": () => ratesOf(() => new GrowArray()),

  /** `deep.build` ② — 뒤 끝을 안 드는 사슬. 붙이기 시나리오 하나에서 실패한다. */
  "no-tail-rates": () => {
    const j = judge(
      () => new NoTailChain(),
      xorLinkedListContract.scenarios[0] as Scenario,
    );
    return [
      "뒤로만 n 번 붙이기 — 뒤 끝을 안 드는 사슬",
      "",
      table(
        ["n", "연산당 들여다본 노드", "r = C(4n)/C(n)"],
        [
          [num(1024), fixed2(j.stats[0] as number), ""],
          [
            num(4096),
            fixed2(j.stats[1] as number),
            fixed2(j.ratios[0] as number),
          ],
        ],
      ),
      "",
      `계약 스위트 판정: ${j.ok ? "통과" : "실패"} (O(1) 상한의 기대 r = 1.00, 허용 ±60%)`,
    ].join("\n");
  },

  /**
   * `deep.build` ③ — 값 10 · 20 · 30 을 붙인 뒤 노드마다 앞 이웃 id · 뒤 이웃 id 와 그 XOR.
   * x 칸은 사본이 실제로 들고 있는 값이고, 앞 이웃 ^ 뒤 이웃과 다르면 던진다.
   */
  "doubly-links": () => {
    const rows = agree(appends([10, 20, 30]));
    const last = rows.at(-1) as Row;
    const mine = new XorCopy();
    for (const v of [10, 20, 30]) mine.append(v);
    const order = mine.walk(mine.head).map((it) => it.curr);
    const body = order.map((id, i) => {
      const prev = order[i - 1] ?? NIL;
      const next = order[i + 1] ?? NIL;
      const node = mine.nodes.get(id) as CopyNode;
      if (node.x !== (prev ^ next)) {
        throw new Error(
          `id ${id} 의 x ${node.x} 가 ${prev} ^ ${next} 가 아니다`,
        );
      }
      return [
        num(id),
        num(node.value),
        num(prev),
        num(next),
        `${prev} ^ ${next} = ${node.x}`,
      ];
    });
    if (last.count !== 3) throw new Error("붙인 원소가 셋이 아니다");
    return table(["id", "값", "앞 이웃 id", "뒤 이웃 id", "x = 앞 ^ 뒤"], body);
  },

  /** `deep.build` ④ — 같은 노드 표를 앞 끝과 뒤 끝에서 한 번씩 순회한다. */
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
          r.call.op === "toArray" ? "앞 끝에서" : "뒤 끝에서",
          num(it.prev),
          num(it.curr),
          num(it.x),
          `${it.x} ^ ${it.prev} = ${it.next}`,
          seq(it.values),
        ];
      });
    return table(
      ["출발", "prev", "curr", "x(curr)", "다음 = x ^ prev", "담은 값"],
      body,
      [4],
    );
  },

  /** `deep.build` ⑤ — 붙일 때마다 새 노드의 x 와 옛 꼬리의 x 가 어떻게 바뀌는가. */
  "append-states": () => {
    const rows = agree(appends([10, 20, 30, 40]));
    const body = rows.map((r) => {
      const j = r.joined as Joined;
      return [
        label(r.call),
        num(j.id),
        num(j.oldTail?.id ?? NIL),
        j.oldTail === null
          ? "빈 수열 — 옛 꼬리 없음"
          : `id ${j.oldTail.id}: ${j.oldTail.before} ^ ${j.id} = ${j.oldTail.after}`,
        num(r.head),
        num(r.tail),
      ];
    });
    return table(
      ["호출", "새 id", "새 노드의 x", "옛 꼬리의 x", "head", "tail"],
      body,
      [3],
    );
  },

  /** `deep.build` ⑥ — 네 설계를 네 시나리오에 모두 넣는다. */
  "designs-rates": () => {
    const rows = DESIGNS.map(([name, make]) => [
      name,
      ...xorLinkedListContract.scenarios.map((s) => {
        const j = judge(make, s);
        return `${fixed2(j.ratios[0] as number)} ${j.ok ? "통과" : "실패"}`;
      }),
    ]);
    return table(
      [
        "설계",
        ...xorLinkedListContract.scenarios.map((s) => s.covers.join("·")),
      ],
      rows,
    );
  },

  /** `deep.walk.step` 2 — 붙이기 셋. */
  "append-steps": () =>
    table(
      [
        "단계",
        "호출",
        "조건",
        "새 id · x",
        "옛 꼬리의 x",
        "head",
        "tail",
        "count",
      ],
      WALK_ROWS.filter((r) => r.kind === "append").map((r) => {
        const j = r.joined as Joined;
        return [
          `T${r.t}`,
          label(r.call),
          condition(r),
          `id ${j.id} · x ${j.oldTail?.id ?? NIL}`,
          j.oldTail === null
            ? ""
            : `id ${j.oldTail.id}: ${j.oldTail.before} ^ ${j.id} = ${j.oldTail.after}`,
          num(r.head),
          num(r.tail),
          num(r.count),
        ];
      }),
      [1, 2, 3, 4],
    ),

  /** `deep.walk.pause` — id 를 0 부터 나눠 줬다. 전개가 붙이는 값 그대로. */
  "pause-id0": () =>
    mutantTable(
      idFromZero,
      [[10], [10, 0], [10, 0, 30]],
      ["toArray", "toArrayReverse", "size"],
      "0 부터 준 코드",
    ),

  /**
   * `deep.walk.pause` — 같은 변이를 사본으로 펼쳐 붙일 때마다의 id 넷. 사본의 반환값이 기계로
   * 만든 변이와 다르면 던진다.
   */
  "pause-id0-state": () => {
    const mine = new XorCopy(0);
    const mutant = new idFromZero.XorLinkedList();
    const rows: string[][] = [];
    for (const v of [10, 0, 30]) {
      const j = mine.append(v);
      mutant.append(v);
      rows.push([
        `append(${v})`,
        num(j.id),
        j.empty ? "참" : "거짓",
        num(mine.head),
        num(mine.tail),
        seq(
          mine
            .walk(mine.head)
            .map((it) => it.values)
            .at(-1) ?? [],
        ),
      ]);
      const want = mine.walk(mine.head).at(-1)?.values ?? [];
      if (!neutral(idFromZero) && !same(want, mutant.toArray())) {
        throw new Error(
          `사본 ${seq(want)} 과 변이 ${seq(mutant.toArray())} 이 다르다`,
        );
      }
    }
    return table(
      ["호출", "새 id", "tailId === NIL", "head", "tail", "toArray()"],
      rows,
    );
  },

  /** `deep.walk.step` 3 — 읽기 셋. 빈 수열과 원소 셋에서. */
  "read-steps": () =>
    table(
      ["단계", "호출", "조건", "다음 = x ^ prev", "돌려준 값", "비용"],
      WALK_ROWS.filter((r) => r.kind !== "append").map((r) => [
        `T${r.t}`,
        label(r.call),
        condition(r),
        r.iter === null ? "" : `${r.iter.x} ^ ${r.iter.prev} = ${r.iter.next}`,
        r.last ? show(r.out) : "",
        num(r.cost),
      ]),
      [1, 2, 3],
    ),

  /** `deep.walk.pause` — `prevId` 에 다음 노드를 넣었다. */
  "pause-prev": () =>
    mutantTable(
      carryNext,
      [[10], [10, 0], [10, 0, 30], [10, 20, 30, 40]],
      ["toArray", "toArrayReverse"],
      "prev 에 다음을 넣은 코드",
    ),

  /** `deep.walk.pause` — 같은 변이를 사본으로 펼친 앞→뒤 순회 걸음. */
  "pause-prev-trace": () => {
    const rows: string[][] = [];
    for (const values of [
      [10, 0, 30],
      [10, 0],
    ]) {
      const { steps, error } = traceCarryNext(values);
      const mutant = new carryNext.XorLinkedList();
      for (const v of values) mutant.append(v);
      const got = attempt(() => mutant.toArray());
      const want =
        error === "" ? (steps.at(-1)?.values ?? []) : `오류: ${error}`;
      if (!neutral(carryNext) && !same(want, got)) {
        throw new Error(`사본 ${show(want)} 과 변이 ${show(got)} 이 다르다`);
      }
      for (const [k, it] of steps.entries()) {
        rows.push([
          k === 0 ? `append ${values.join(" · ")}` : "",
          num(it.prev),
          num(it.curr),
          `${it.x} ^ ${it.prev} = ${it.next}`,
          `prev ← ${it.next} · curr ← ${it.next}`,
          seq(it.values),
        ]);
      }
      rows.push([
        "",
        "",
        "",
        "",
        error === "" ? "curr 0 = NIL → 끝" : `${error} → 던진다`,
        "",
      ]);
    }
    return table(
      [
        "붙인 값",
        "prev",
        "curr",
        "다음 = x ^ prev",
        "다음 걸음으로",
        "담은 값",
      ],
      rows,
      [3, 4],
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
        "head",
        "tail",
        "count",
        "prev",
        "curr",
        "담은 값",
      ],
      WALK_ROWS.map((r) => [
        `T${r.t}`,
        r.cells.join(" "),
        num(r.head),
        num(r.tail),
        num(r.count),
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

  /** `deep.walk.step` 4 — 분기 라벨이 어느 걸음에서 실행됐는가. */
  "walk-branches": () => {
    const ts = (pred: (r: Row) => boolean): string =>
      WALK_ROWS.filter(pred)
        .map((r) => `T${r.t}`)
        .join(" · ");
    return table(
      ["라벨", "무엇", "실행된 걸음"],
      [
        ["①", "빈 수열에 붙인다", ts((r) => r.joined?.empty === true)],
        ["②", "옛 꼬리에 잇는다", ts((r) => r.joined?.empty === false)],
        ["③", "노드를 읽는다", ts((r) => r.iter !== null)],
        ["④", "순회를 끝낸다", ts((r) => r.kind === "walk" && r.last)],
      ],
      [1, 2],
    );
  },

  /**
   * `invariant` ② — 계약 스위트의 경계 입력 전부. 각 입력을 정본에 걸고, 계약의 불변식 검사
   * 함수 둘을 그대로 부른다. 하나라도 어기면 던진다.
   */
  "invariant-edges": () => {
    const rows = xorLinkedListContract.edges.map((edge) => {
      const d = new XorLinkedList();
      const added: number[] = [];
      for (const step of edge.steps) {
        if (step.op === "append") added.push(step.arg as number);
        apply(d, {
          op: step.op as OpName,
          arg: step.arg as number | undefined,
        });
        for (const inv of xorLinkedListContract.invariants) {
          const broke = inv.check(d);
          if (broke !== null) {
            throw new Error(
              `정본이 경계 입력 「${edge.name}」 에서 ${inv.name} 을 어겼다: ${broke}`,
            );
          }
        }
      }
      return [
        added.length === 0 ? "붙인 값 없음" : added.map(String).join(" · "),
        seq(d.toArray()),
        seq(d.toArrayReverse()),
        num(d.size()),
      ];
    });
    return table(
      ["붙인 값", "toArray()", "toArrayReverse()", "size()"],
      rows,
      [1, 2],
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
      ["toArray", "toArrayReverse", "size"],
      "덮어쓴 코드",
    ),

  /**
   * `invariant` ③ — 같은 변이에 계약의 불변식 검사 함수 둘을 그대로 건다.
   *
   * 불변식 이름은 본문의 순서 표기(첫째 · 둘째)로 적는다. 계약 파일의 이름에는 「같다」가
   * 들어 있어, 그대로 실으면 `check-proof` 가 그 칸을 판정 열로 읽는다.
   */
  "mutant-overwrite-invariants": () => {
    const labels = ["첫째 — size() 와 순회 길이", "둘째 — 두 방향의 수열"];
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

  /** `perf.derive` — 걸음 표의 비용 칸을 연산별로 모은다. */
  "cost-by-group": () => {
    const groups: [string, OpName[]][] = [
      ["append", ["append"]],
      ["toArray · toArrayReverse", ["toArray", "toArrayReverse"]],
      ["size", ["size"]],
    ];
    const rows = groups.map(([name, ops]) => {
      const mine = WALK_ROWS.filter((r) => ops.includes(r.call.op));
      const calls = new Set(mine.map((r) => WALK.indexOf(r.call))).size;
      const sum = mine.reduce((s, r) => s + r.cost, 0);
      return [
        name,
        num(calls),
        num(sum),
        mine.map((r) => `T${r.t}=${r.cost}`).join(" · "),
      ];
    });
    const all = WALK_ROWS.reduce((s, r) => s + r.cost, 0);
    rows.push(["합", num(WALK.length), num(all), ""]);
    return table(["연산", "호출 수", "비용 합", "걸음별 비용"], rows, [3]);
  },

  /** `perf.bounds` — 계약 스위트 축3 이 정본에 대해 내는 값 전부. */
  "growth-rate": () => {
    const rows = xorLinkedListContract.scenarios.map((s) => {
      const j = judge(() => new XorLinkedList(), s);
      return [
        s.covers.join("·"),
        s.qualifier,
        s.bound,
        ...j.stats.map(fixed2),
        fixed2(j.ratios[0] as number),
        j.ok ? "통과" : "실패",
      ];
    });
    return table(
      [
        "시나리오가 부르는 연산",
        "한정자",
        "상한",
        "n = 1,024",
        "n = 4,096",
        "r",
        "판정",
      ],
      rows,
      [1, 2],
    );
  },

  /**
   * `perf.worst` — 설계마다 최악이 되는 입력이 다르다. `n = 4,096` 에서 호출당 평균과 한 호출이
   * 건드린 원소의 최댓값을 함께 낸다.
   */
  "worst-inputs": () => {
    const n = 4096;
    const inputs: [string, (d: Counted) => number[]][] = [
      [
        "뒤로 n 번 붙이기",
        (d) => {
          const out: number[] = [];
          for (let i = 0; i < n; i++) out.push(costOf(d, () => d.append(i)));
          return out;
        },
      ],
      [
        "n 개를 채운 뒤 한 번 더 붙이기",
        (d) => {
          for (let i = 0; i < n; i++) d.append(i);
          return [costOf(d, () => d.append(n))];
        },
      ],
      [
        "n 개를 채운 뒤 toArrayReverse 한 번",
        (d) => {
          for (let i = 0; i < n; i++) d.append(i);
          return [costOf(d, () => d.toArrayReverse())];
        },
      ],
    ];
    const designs: [string, () => Counted][] = [
      ["배열 하나", () => new GrowArray()],
      ["뒤 끝을 안 드는 사슬", () => new NoTailChain()],
      ["XOR 연결 리스트(정본)", () => new XorLinkedList()],
    ];
    const rows: string[][] = [];
    for (const [iname, run] of inputs) {
      for (const [dname, make] of designs) {
        const costs = run(make());
        const avg = costs.reduce((s, c) => s + c, 0) / costs.length;
        rows.push([iname, dname, fixed2(avg), num(Math.max(...costs))]);
      }
    }
    return table(
      ["입력 (n = 4,096)", "설계", "호출당 평균", "한 호출 최대"],
      rows,
      [1],
    );
  },

  /** `selfcheck` 답 — T12 뒤에 40 을 한 번 더 붙이면. */
  "check-append40": () => {
    const rows = agree([...WALK, { op: "append", arg: 40 }]);
    const r = rows.at(-1) as Row;
    const j = r.joined as Joined;
    const mine = new XorCopy();
    for (const c of [...WALK, { op: "append", arg: 40 } as Call]) {
      if (c.op === "append") mine.append(c.arg ?? 0);
    }
    const xs = [...mine.nodes.values()]
      .map((node) => `id ${node.id}: x ${node.x}`)
      .join(" · ");
    return [
      `${label(r.call)}   ${condition(r)}   새 id ${j.id} · x ${j.oldTail?.id ?? NIL}   비용 ${r.cost}`,
      `옛 꼬리  id ${j.oldTail?.id ?? NIL}: ${j.oldTail?.before ?? NIL} ^ ${j.id} = ${j.oldTail?.after ?? NIL}`,
      `노드 표  ${xs}`,
      `head ${r.head}  tail ${r.tail}  count ${r.count}`,
    ].join("\n");
  },
};

/* ────────────────────────── 보조 ────────────────────────── */

/**
 * `prev` 에 다음 노드를 넣는 사본으로 앞→뒤 순회를 펼친다. 표에 없는 id 에 이르면 그 걸음까지의
 * 기록과 정본이 던지는 것과 같은 메시지를 돌려준다.
 */
function traceCarryNext(values: number[]): { steps: Iter[]; error: string } {
  const mine = new XorCopy(1, "next");
  for (const v of values) mine.append(v);
  const steps: Iter[] = [];
  const got: number[] = [];
  let prev = NIL;
  let curr = mine.head;
  while (curr !== NIL) {
    if (steps.length > 64) throw new Error("사본의 순회가 끝나지 않는다");
    const node = mine.nodes.get(curr);
    if (node === undefined) {
      return { steps, error: `표에 없는 id 를 따라갔다: ${curr}` };
    }
    got.push(node.value);
    const next = node.x ^ prev;
    steps.push({ prev, curr, x: node.x, next, values: [...got] });
    prev = next;
    curr = next;
  }
  return { steps, error: "" };
}

/** 걸음 표의 「조건」 칸. */
function condition(r: Row): string {
  if (r.kind === "append") {
    const j = r.joined as Joined;
    return j.empty
      ? "tailId 0 = NIL → ①"
      : `tailId ${j.oldTail?.id ?? NIL} ≠ NIL → ②`;
  }
  if (r.kind === "size") return "";
  if (r.iter === null) return "currId 0 = NIL → ④";
  const head = `currId ${r.iter.curr} ≠ NIL → ③`;
  return r.last ? `${head} · 다음 0 = NIL → ④` : head;
}

/** 걸음 표의 「계산」 칸. */
function calc(r: Row): string {
  if (r.kind === "append") {
    const j = r.joined as Joined;
    const made = `id ${j.id} · x ${j.oldTail?.id ?? NIL}`;
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
    { label: "count", value: r.count },
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

function costOf(d: Counted, fn: () => unknown): number {
  const before = d.__cost;
  fn();
  return d.__cost - before;
}
