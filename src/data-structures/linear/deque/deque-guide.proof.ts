/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`_reference/deque.ts`)을 부르고, 변이는 그 소스에서 기계로
 * 만든다.** 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도
 * 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/data-structures/linear/deque/deque-guide.md
 *
 * 정본은 칸 배치(`#slots`)와 두 정수(`#head`·`#count`)를 private 으로 감춘다. 그래서 상태를
 * 보여 주는 블록은 같은 절차의 사본 `Ring` 을 쓰되, **호출마다 정본과 반환값·`__cost` 증가분이
 * 같은지 확인**하고 어긋나면 던진다(`agreeRing`). 사본이 정본에서 갈라지면 그 자리에서 실패한다.
 *
 * 경쟁 설계(배열 하나 · 배열 두 개)의 비용은 **계약 스위트의 판정 함수 `judgeScenario` 에
 * 그대로 넣어** 얻는다. 본문이 인용하는 성장률이 축3 이 실제로 내는 값과 같은 값이어야 해서다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { judgeScenario } from "../../_contract/runContract.ts";
import { Deque } from "./_reference/deque.ts";
import { type DequeContract, dequeContract } from "./deque.contract.ts";
import { walk } from "./deque-guide.sim.ts";

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

/** 반환값을 본문 표기로. `-0` 은 `0` 과 구별해 적는다 — 그 차이가 멈춤 절의 요점이다. */
const show = (v: unknown): string => {
  if (typeof v === "number" && Object.is(v, -0)) return "-0";
  if (v === undefined) return "undefined";
  return String(v);
};

/* ────────────────────────── 호출 열 ────────────────────────── */

type OpName = keyof DequeContract<number>;

interface Call {
  op: OpName;
  arg?: number;
}

const label = (c: Call): string =>
  c.arg === undefined ? `${c.op}()` : `${c.op}(${c.arg})`;

/** 호출 하나를 어느 구현에든 건다. */
function apply(d: DequeContract<number>, c: Call): unknown {
  switch (c.op) {
    case "pushFront":
      return d.pushFront(c.arg ?? 0);
    case "pushBack":
      return d.pushBack(c.arg ?? 0);
    case "popFront":
      return d.popFront();
    case "popBack":
      return d.popBack();
    case "peekFront":
      return d.peekFront();
    case "peekBack":
      return d.peekBack();
    case "isEmpty":
      return d.isEmpty();
    case "size":
      return d.size();
  }
}

/**
 * 「수행으로 알아보는 자료구조」가 끝까지 쓰는 연산 열. 스물세 번이다.
 *
 * 여덟 연산이 모두 한 번 이상 나오고, 빈 덱의 `null` · 음수를 감는 자리 · 칸 수를 넘는 번호를
 * 감는 자리 · **감긴 채로 칸이 차서 늘리는 자리**가 전부 들어 있다.
 */
export const WALK: Call[] = [
  { op: "popFront" },
  { op: "peekBack" },
  { op: "isEmpty" },
  { op: "pushBack", arg: 1 },
  { op: "pushBack", arg: 2 },
  { op: "pushFront", arg: 0 },
  { op: "peekFront" },
  { op: "peekBack" },
  { op: "popFront" },
  { op: "popBack" },
  { op: "pushBack", arg: 2 },
  { op: "pushBack", arg: 3 },
  { op: "pushBack", arg: 4 },
  { op: "pushBack", arg: 5 },
  { op: "pushBack", arg: 6 },
  { op: "pushBack", arg: 7 },
  { op: "pushFront", arg: 0 },
  { op: "size" },
  { op: "pushFront", arg: -1 },
  { op: "peekFront" },
  { op: "peekBack" },
  { op: "popFront" },
  { op: "popBack" },
];

/* ────────────────────────── 상태를 보이는 사본 ────────────────────────── */

/** 사본이 한 호출에서 겪은 일. 표의 「계산」·「판정」 칸이 이것을 읽는다. */
interface Event {
  /** 칸 번호 계산을 식으로. 없으면 빈 문자열. */
  calc: string;
  /** 넣기에서 칸이 가득 차 늘렸는가. */
  grew: boolean;
  /** 늘릴 때 옮긴 원소 수. */
  moved: number;
  /** 빼기·보기가 빈 덱을 만났는가. */
  empty: boolean;
}

/**
 * 정본과 같은 절차. 상태를 읽을 수 있게 열어 두었고, 비용을 정본과 같은 자리에서 센다.
 *
 * `wrapOf` 를 바꿔 끼우면 **감싸는 식만 다른 사본**이 된다 — 멈춤 절이 그 사본으로 칸 배치를
 * 보이고, 그 사본의 반환값이 기계로 만든 변이와 같은지를 따로 확인한다.
 */
class Ring {
  slots: (number | undefined)[] = new Array(8);
  head = 0;
  count = 0;
  cost = 0;
  constructor(
    readonly wrapOf: (index: number, total: number) => number = (i, t) =>
      ((i % t) + t) % t,
  ) {}

  wrap(index: number): number {
    return this.wrapOf(index, this.slots.length);
  }

  grow(): number {
    const grown: (number | undefined)[] = new Array(this.slots.length * 2);
    for (let offset = 0; offset < this.count; offset++) {
      this.cost += 1;
      grown[offset] = this.slots[this.wrap(this.head + offset)];
    }
    this.slots = grown;
    this.head = 0;
    return this.count;
  }

  call(c: Call): { out: unknown; ev: Event } {
    const ev: Event = { calc: "", grew: false, moved: 0, empty: false };
    switch (c.op) {
      case "pushFront": {
        if (this.count === this.slots.length) {
          ev.grew = true;
          ev.moved = this.grow();
        }
        const before = this.head;
        this.head = this.wrap(this.head - 1);
        ev.calc = `wrap(${before} - 1) = ${this.head}`;
        this.cost += 1;
        this.slots[this.head] = c.arg;
        this.count += 1;
        return { out: undefined, ev };
      }
      case "pushBack": {
        if (this.count === this.slots.length) {
          ev.grew = true;
          ev.moved = this.grow();
        }
        const at = this.wrap(this.head + this.count);
        ev.calc = `wrap(${this.head} + ${this.count}) = ${at}`;
        this.cost += 1;
        this.slots[at] = c.arg;
        this.count += 1;
        return { out: undefined, ev };
      }
      case "popFront": {
        if (this.count === 0) {
          ev.empty = true;
          return { out: null, ev };
        }
        this.cost += 1;
        const item = this.slots[this.head];
        this.slots[this.head] = undefined;
        const before = this.head;
        this.head = this.wrap(this.head + 1);
        ev.calc = `head ← wrap(${before} + 1) = ${this.head}`;
        this.count -= 1;
        return { out: item, ev };
      }
      case "popBack": {
        if (this.count === 0) {
          ev.empty = true;
          return { out: null, ev };
        }
        const at = this.wrap(this.head + this.count - 1);
        ev.calc = `wrap(${this.head} + ${this.count} - 1) = ${at}`;
        this.cost += 1;
        const item = this.slots[at];
        this.slots[at] = undefined;
        this.count -= 1;
        return { out: item, ev };
      }
      case "peekFront": {
        this.cost += 1;
        if (this.count === 0) {
          ev.empty = true;
          return { out: null, ev };
        }
        ev.calc = `head = ${this.head}`;
        return { out: this.slots[this.head], ev };
      }
      case "peekBack": {
        this.cost += 1;
        if (this.count === 0) {
          ev.empty = true;
          return { out: null, ev };
        }
        const at = this.wrap(this.head + this.count - 1);
        ev.calc = `wrap(${this.head} + ${this.count} - 1) = ${at}`;
        return { out: this.slots[at], ev };
      }
      case "isEmpty":
        this.cost += 1;
        return { out: this.count === 0, ev };
      case "size":
        this.cost += 1;
        return { out: this.count, ev };
    }
  }

  /** 칸 배치를 한 줄로. 빈 칸은 `·`. */
  layout(): string {
    return Array.from(this.slots, (v) => (v === undefined ? "·" : String(v)))
      .join(" ")
      .trim();
  }

  /** 앞 끝부터 읽은 논리 순서. */
  order(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.count; i++) {
      out.push(this.slots[this.wrap(this.head + i)] as number);
    }
    return out;
  }
}

interface Row {
  t: number;
  call: Call;
  out: unknown;
  ev: Event;
  cost: number;
  head: number;
  count: number;
  total: number;
  layout: string;
  order: number[];
}

/** 사본과 정본을 나란히 실행한다. 반환값이나 비용 증가분이 하나라도 다르면 던진다. */
function agreeRing(calls: Call[]): Row[] {
  const ref = new Deque<number>();
  const mine = new Ring();
  const rows: Row[] = [];
  for (const [index, c] of calls.entries()) {
    const refBefore = ref.__cost;
    const mineBefore = mine.cost;
    const refOut = apply(ref, c);
    const { out, ev } = mine.call(c);
    const refCost = ref.__cost - refBefore;
    const mineCost = mine.cost - mineBefore;
    if (refOut !== out || refCost !== mineCost) {
      throw new Error(
        `사본이 정본과 갈라졌다 — ${index + 1} 번째 ${label(c)}: 정본 ${show(refOut)}·비용 ${refCost}, 사본 ${show(out)}·비용 ${mineCost}`,
      );
    }
    rows.push({
      t: index + 1,
      call: c,
      out,
      ev,
      cost: mineCost,
      head: mine.head,
      count: mine.count,
      total: mine.slots.length,
      layout: mine.layout(),
      order: mine.order(),
    });
  }
  return rows;
}

export const WALK_ROWS = agreeRing(WALK);

/* ────────────────────────── 경쟁 설계 — 같은 단위로 센다 ────────────────────────── */

type Counted = DequeContract<number> & { __cost: number };

/**
 * 배열 하나. 뒤는 `push`·`pop`, 앞은 `unshift`·`shift`.
 *
 * 비용 단위는 정본과 같다 — **칸 하나를 지나갈 때마다 1**. 앞에 넣으면 이미 든 원소 전부가
 * 한 칸씩 옮겨지고 새 원소를 한 칸 쓴다. 앞에서 빼면 앞 칸을 읽고 나머지가 한 칸씩 옮겨진다.
 */
class OneArray implements Counted {
  #a: number[] = [];
  __cost = 0;
  pushFront(item: number): void {
    this.__cost += this.#a.length + 1;
    this.#a.unshift(item);
  }
  pushBack(item: number): void {
    this.__cost += 1;
    this.#a.push(item);
  }
  popFront(): number | null {
    if (this.#a.length === 0) return null;
    this.__cost += this.#a.length;
    return this.#a.shift() as number;
  }
  popBack(): number | null {
    if (this.#a.length === 0) return null;
    this.__cost += 1;
    return this.#a.pop() as number;
  }
  peekFront(): number | null {
    this.__cost += 1;
    return this.#a.length === 0 ? null : (this.#a[0] as number);
  }
  peekBack(): number | null {
    this.__cost += 1;
    return this.#a.length === 0 ? null : (this.#a.at(-1) as number);
  }
  isEmpty(): boolean {
    this.__cost += 1;
    return this.#a.length === 0;
  }
  size(): number {
    this.__cost += 1;
    return this.#a.length;
  }
}

/**
 * 배열 두 개를 등 맞대어 둔다. `front` 는 앞쪽 원소를 **거꾸로**, `back` 은 뒤쪽 원소를
 * 정순으로 담는다. 한쪽이 비었는데 그쪽에서 빼야 하면 **반대쪽 전부를** 뒤집어 옮긴다.
 *
 * `moves` 는 옮긴 원소 수만 따로 센다 — 작은 입력의 걸음 표가 그 수를 보인다.
 */
class TwoArrays implements Counted {
  front: number[] = [];
  back: number[] = [];
  __cost = 0;
  moves = 0;
  pushFront(item: number): void {
    this.__cost += 1;
    this.front.push(item);
  }
  pushBack(item: number): void {
    this.__cost += 1;
    this.back.push(item);
  }
  #refill(into: number[], from: number[]): void {
    while (from.length > 0) {
      this.__cost += 1;
      this.moves += 1;
      into.push(from.pop() as number);
    }
  }
  popFront(): number | null {
    if (this.front.length === 0) {
      if (this.back.length === 0) return null;
      this.#refill(this.front, this.back);
    }
    this.__cost += 1;
    return this.front.pop() as number;
  }
  popBack(): number | null {
    if (this.back.length === 0) {
      if (this.front.length === 0) return null;
      this.#refill(this.back, this.front);
    }
    this.__cost += 1;
    return this.back.pop() as number;
  }
  peekFront(): number | null {
    this.__cost += 1;
    if (this.front.length > 0) return this.front.at(-1) as number;
    return this.back.length === 0 ? null : (this.back[0] as number);
  }
  peekBack(): number | null {
    this.__cost += 1;
    if (this.back.length > 0) return this.back.at(-1) as number;
    return this.front.length === 0 ? null : (this.front[0] as number);
  }
  isEmpty(): boolean {
    this.__cost += 1;
    return this.front.length + this.back.length === 0;
  }
  size(): number {
    this.__cost += 1;
    return this.front.length + this.back.length;
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
    "pushFront",
    "pushBack",
    "popFront",
    "popBack",
    "peekFront",
    "peekBack",
    "isEmpty",
    "size",
  ];
  const ref = new Deque<number>();
  const other = make();
  for (let i = 0; i < 4000; i++) {
    const op = ops[Math.floor(next() * ops.length)] as OpName;
    const c: Call = op.startsWith("push") ? { op, arg: i } : { op };
    const a = apply(ref, c);
    const b = apply(other, c);
    if (a !== b) {
      throw new Error(
        `${name} 이 정본과 다른 답을 냈다 — ${i + 1} 번째 ${label(c)}: 정본 ${show(a)}, ${name} ${show(b)}`,
      );
    }
  }
}

agreeAnswers(() => new OneArray(), "배열 하나");
agreeAnswers(() => new TwoArrays(), "배열 두 개");

/* ────────────────────────── 축3 판정 — 계약 스위트의 함수 그대로 ────────────────────────── */

type Scenario = (typeof dequeContract.scenarios)[number];

/** `covers` 로 시나리오를 찾는다. 계약 파일의 순서가 바뀌어도 블록이 엉뚱한 것을 안 잡게. */
function scenario(...covers: OpName[]): Scenario {
  const hit = dequeContract.scenarios.filter(
    (s) => s.covers.join(",") === covers.join(","),
  );
  if (hit.length !== 1) {
    throw new Error(`시나리오 ${covers.join("·")} 가 ${hit.length} 개다`);
  }
  return hit[0] as Scenario;
}

const FRONT_ONLY = scenario("pushFront");
const QUEUE = scenario("pushBack", "popFront");
const ALTERNATE = scenario("popFront", "popBack");

interface Judged {
  stats: number[];
  ratios: number[];
  ok: boolean;
}

function judge(make: () => Counted, s: Scenario): Judged {
  const v = judgeScenario({ kind: "self-reported", make }, s, "complexity");
  const stats = v.points.map((p) => p.stat);
  const ratios = stats.slice(1).map((x, i) => x / (stats[i] as number));
  return { stats, ratios, ok: v.ok };
}

const SIZES = [1024, 4096, 16384];

/* ────────────────────────── 용량을 늘리는 규칙 ────────────────────────── */

type Policy = (cap: number) => number;

/**
 * 뒤로만 `n` 번 넣을 때 용량 규칙 하나가 옮기는 원소 수와, 한 호출이 쓴 칸의 최댓값.
 *
 * 정본의 규칙(두 배)은 여기서 센 값이 정본 `__cost` 와 같은지 확인한다. 나머지 규칙은 정본에
 * 없으므로 이 계산이 곧 정의다.
 */
function policyCost(
  policy: Policy,
  n: number,
): { moved: number; perOp: number; maxCall: number; grows: number } {
  let cap = 8;
  let count = 0;
  let moved = 0;
  let maxCall = 1;
  let grows = 0;
  for (let i = 0; i < n; i++) {
    let call = 1;
    if (count === cap) {
      moved += count;
      call += count;
      cap = policy(cap);
      grows += 1;
    }
    count += 1;
    if (call > maxCall) maxCall = call;
  }
  return { moved, perOp: (n + moved) / n, maxCall, grows };
}

const DOUBLE: Policy = (cap) => cap * 2;

for (const n of SIZES) {
  const d = new Deque<number>();
  for (let i = 0; i < n; i++) d.pushBack(i);
  const mine = policyCost(DOUBLE, n);
  if (d.__cost !== n + mine.moved) {
    throw new Error(
      `두 배 규칙의 계산이 정본과 다르다 — n=${n}: 정본 ${d.__cost}, 계산 ${n + mine.moved}`,
    );
  }
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF_PATH = new URL("./_reference/deque.ts", import.meta.url).pathname;

type DequeModule = { Deque: typeof Deque };

/** 감싸는 식에서 두 번째 나머지를 뺀 사본. 음수 번호가 음수로 남는다. */
const modOnce = await loadMutant<DequeModule>(REF_PATH, {
  swap: [
    /return \(\(index % total\) \+ total\) % total;/,
    "return index % total;",
  ],
});

/** 칸을 늘릴 때 원소를 **같은 칸 번호로** 옮기는 사본. 앞 끝부터 차례로 옮기지 않는다. */
const copySame = await loadMutant<DequeModule>(REF_PATH, {
  swap: [
    /grown\[offset\] = this\.#slots\[this\.#wrap\(this\.#head \+ offset\)\];/,
    "grown[offset] = this.#slots[offset];",
  ],
});

/** 칸을 늘린 뒤 `#head` 를 0 으로 되돌리는 줄을 지운 사본. */
const noReset = await loadMutant<DequeModule>(REF_PATH, {
  drop: /this\.#head = 0;/,
});

/**
 * 중화 실행인가. `loadMutant` 가 변이를 적용하지 않으면 정본 모듈을 그대로 돌려주므로, 클래스가
 * 정본과 **같은 객체**다. 그때는 「변이가 답을 바꿨다」 자기검사를 건너뛴다(`algo SPEC` §0).
 */
const neutral = (m: DequeModule): boolean => m.Deque === Deque;

/** 같은 호출 열을 정본과 변이에 걸고, 값을 내는 호출만 행으로 모은다. */
function versus(
  mutant: DequeModule,
  calls: Call[],
  pick: (c: Call, t: number) => boolean,
): { t: number; call: Call; right: unknown; wrong: unknown }[] {
  const a = new Deque<number>();
  const b = new mutant.Deque<number>();
  const out: { t: number; call: Call; right: unknown; wrong: unknown }[] = [];
  for (const [index, c] of calls.entries()) {
    const right = apply(a, c);
    const wrong = apply(b, c);
    if (pick(c, index + 1)) {
      out.push({ t: index + 1, call: c, right, wrong });
    }
  }
  return out;
}

const verdict = (a: unknown, b: unknown): string =>
  Object.is(a, b) ? "같다" : "어긋난다";

const observes = (c: Call): boolean => !c.op.startsWith("push");

/** 뒤로만 아홉 번 넣는다 — 칸이 차는 순간 `head` 가 0 이라 감긴 원소가 없다. */
const BACK_NINE: Call[] = [
  ...Array.from(
    { length: 9 },
    (_, i): Call => ({ op: "pushBack", arg: i + 1 }),
  ),
  { op: "peekFront" },
  { op: "peekBack" },
  { op: "popFront" },
  { op: "popBack" },
];

/** 앞으로만 `k` 번 넣고 세 가지를 읽는다. */
const frontThen = (k: number): Call[] => [
  ...Array.from(
    { length: k },
    (_, i): Call => ({ op: "pushFront", arg: i + 1 }),
  ),
  { op: "peekFront" },
  { op: "peekBack" },
  { op: "size" },
];

/** 변이 표 둘을 한 모양으로 그린다 — 입력 두 벌, 값을 내는 호출마다 한 줄. */
function mutantTable(
  mutant: DequeModule,
  inputs: [string, Call[], (c: Call, t: number) => boolean][],
  wrongHead: string,
): string {
  const rows: string[][] = [];
  let changed = false;
  for (const [name, calls, pick] of inputs) {
    for (const r of versus(mutant, calls, pick)) {
      if (!Object.is(r.right, r.wrong)) changed = true;
      rows.push([
        name,
        label(r.call),
        show(r.right),
        show(r.wrong),
        verdict(r.right, r.wrong),
      ]);
    }
  }
  if (!neutral(mutant) && !changed) {
    throw new Error(
      "변이가 어느 호출에서도 값을 바꾸지 못했다 — 「깨진다」가 거짓이다",
    );
  }
  return table(["입력", "호출", "바른 코드", wrongHead, "판정"], rows, [1]);
}

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /**
   * `deep.build` ② — 가장 단순한 구현. 계약 스위트가 「앞으로만 넣기」 시나리오에서 재는
   * 연산당 평균 비용과 성장률을 그대로 낸다.
   */
  "naive-front": () => {
    const j = judge(() => new OneArray(), FRONT_ONLY);
    const rows = SIZES.map((n, i) => [
      num(n),
      fixed2(j.stats[i] as number),
      i === 0 ? "" : fixed2(j.ratios[i - 1] as number),
    ]);
    return [
      "앞으로만 n 번 넣기 — 배열 하나(unshift)",
      "",
      table(["n", "연산당 칸 수", "r = C(4n)/C(n)"], rows),
      "",
      `계약 스위트 판정: ${j.ok ? "통과" : "실패"} (amortized 상한의 기대 r = 1.00, 허용 ±30%)`,
    ].join("\n");
  },

  /** `deep.build` ③ — 배열 두 개에서 앞뒤를 번갈아 빼는 여섯 걸음. 옮긴 원소 수를 센다. */
  "two-arrays-walk": () => {
    const d = new TwoArrays();
    for (let i = 1; i <= 6; i++) d.pushBack(i);
    const lines: string[][] = [
      ["시작", `[${d.front.join(" ")}]`, `[${d.back.join(" ")}]`, "", "", ""],
    ];
    let total = 0;
    for (let i = 0; i < 6; i++) {
      const front = i % 2 === 0;
      const before = d.moves;
      const out = front ? d.popFront() : d.popBack();
      const moved = d.moves - before;
      total += moved;
      lines.push([
        front ? "popFront()" : "popBack()",
        `[${d.front.join(" ")}]`,
        `[${d.back.join(" ")}]`,
        num(moved),
        show(out),
        num(total),
      ]);
    }
    return table(
      ["호출", "front", "back", "옮긴 원소", "돌려준 값", "옮긴 원소 누계"],
      lines,
      [1, 2],
    );
  },

  /** `deep.build` ④ — 같은 설계(배열 두 개)를 두 호출 패턴에 건다. */
  "two-arrays-patterns": () => {
    const q = judge(() => new TwoArrays(), QUEUE);
    const a = judge(() => new TwoArrays(), ALTERNATE);
    const rows = SIZES.map((n, i) => [
      num(n),
      fixed2(q.stats[i] as number),
      fixed2(a.stats[i] as number),
    ]);
    rows.push([
      "r = C(4n)/C(n)",
      q.ratios.map(fixed2).join(" · "),
      a.ratios.map(fixed2).join(" · "),
    ]);
    rows.push([
      "계약 스위트 판정",
      q.ok ? "통과" : "실패",
      a.ok ? "통과" : "실패",
    ]);
    return table(["n", "뒤로 넣고 앞으로 빼기", "번갈아 앞뒤로 빼기"], rows);
  },

  /**
   * `deep.build` ⑤ — 두 끝을 칸 번호 둘(`head`·`tail`)로 들 때 빈 덱과 가득 찬 덱이 같은
   * 모양이 되는 자리. `tail` 은 다음 뒤 원소가 들어갈 칸이다.
   */
  "head-tail": () => {
    const rows: string[][] = [];
    let tail = 0;
    const mine = new Ring();
    const ref = new Deque<number>();
    const record = (what: string): void => {
      rows.push([
        what,
        `head ${mine.head} · tail ${tail}`,
        `head ${mine.head} · count ${mine.count}`,
      ]);
    };
    record("빈 덱");
    for (let i = 1; i <= 8; i++) {
      tail = mine.wrap(tail + 1);
      mine.call({ op: "pushBack", arg: i });
      ref.pushBack(i);
      if (i === 1 || i === 8) record(`pushBack 을 ${i} 번 한 뒤`);
    }
    if (ref.size() !== mine.count) {
      throw new Error("개수가 정본과 다르다");
    }
    return table(
      ["칸 8 개의 상태", "끝 번호 둘로 들 때", "앞 번호와 개수로 들 때"],
      rows,
      [1, 2],
    );
  },

  /** `deep.build` ⑤ — 감싸는 식이 번호를 어떻게 바꾸는가. 칸 수 8 에서. */
  wrap: () => {
    const r = new Ring();
    const rows = [-1, -8, 0, 7, 8, 9].map((i) => [
      num(i),
      show(i % 8),
      num(r.wrap(i)),
    ]);
    return table(["index", "index % 8", "((index % 8) + 8) % 8"], rows);
  },

  /**
   * `deep.build` ⑤ — 상태 유지. 쉬운 경우(감기지 않음)와 불안한 경우(음수를 감는다 · 감긴 채로
   * 늘린다)를 전개의 연산 열에서 골라 칸 배치와 함께 보인다.
   */
  "wrap-states": () => {
    const pickT = [4, 5, 6, 9, 17, 19];
    const rows = WALK_ROWS.filter((r) => pickT.includes(r.t)).map((r) => [
      `${r.t} 번째`,
      label(r.call),
      r.layout,
      num(r.head),
      num(r.count),
      `[${r.order.join(" ")}]`,
    ]);
    return table(
      ["순서", "호출", "칸 배치", "head", "count", "앞 끝부터 읽은 순서"],
      rows,
      [1, 2],
    );
  },

  /** `deep.build` ⑥ — 용량 규칙 셋을 같은 입력(뒤로만 n 번 넣기)에 건다. */
  "grow-policy": () => {
    const policies: [string, Policy][] = [
      ["8 칸씩 더한다", (cap) => cap + 8],
      ["64 칸씩 더한다", (cap) => cap + 64],
      ["두 배로 늘린다", DOUBLE],
    ];
    const rows: string[][] = [];
    for (const [name, p] of policies) {
      const at = SIZES.map((n) => policyCost(p, n));
      rows.push([
        name,
        ...at.map((x) => fixed2(x.perOp)),
        fixed2(
          (at[2] as { perOp: number }).perOp /
            (at[1] as { perOp: number }).perOp,
        ),
        num((at[0] as { maxCall: number }).maxCall),
      ]);
    }
    return table(
      [
        "규칙",
        "n = 1,024",
        "n = 4,096",
        "n = 16,384",
        "r (16,384 / 4,096)",
        "n = 1,024 한 호출 최대",
      ],
      rows,
    );
  },

  /** `deep.build` ⑥ 끝 — 세 설계를 계약 스위트의 적대적 시나리오 셋에 건다. 성장률만 싣는다. */
  "designs-rates": () => {
    const designs: [string, () => Counted][] = [
      ["배열 하나", () => new OneArray()],
      ["배열 두 개", () => new TwoArrays()],
      ["링 버퍼(정본)", () => new Deque<number>()],
    ];
    const rows = designs.map(([name, make]) => [
      name,
      ...[FRONT_ONLY, QUEUE, ALTERNATE].map((s) => {
        const j = judge(make, s);
        return `${fixed2(j.ratios[1] as number)} ${j.ok ? "통과" : "실패"}`;
      }),
    ]);
    return table(
      ["설계", "앞으로만 넣기", "뒤로 넣고 앞으로 빼기", "번갈아 앞뒤로 빼기"],
      rows,
    );
  },

  /** `deep.walk.step` 2 — 넣기 둘. 전개 연산 열의 T4~T6. */
  "push-pair": () => walkRows([4, 5, 6]),

  /** `deep.walk.step` 3 — 빼기 둘. T9·T10. */
  "pop-pair": () => walkRows([9, 10]),

  /** `deep.walk.step` 4 — 보기 넷. 빈 덱(T2·T3)과 원소 셋(T7·T8). */
  "peek-four": () => walkRows([2, 3, 7, 8, 18]),

  /** `deep.walk.step` 5 — 칸을 늘린다. 감긴 채로 가득 찬 T17 과 늘린 T19. */
  grow: () => walkRows([17, 19, 20, 21]),

  /**
   * `deep.walk.pause` — 나머지를 한 번만 하면 음수가 음수로 남는다. 여덟 번째에서 `-8 % 8` 이
   * `-0` 이 되어 칸 0 을 가리키고, 그 앞의 일곱은 배열 칸이 아닌 자리에 들어가 있다.
   */
  "pause-mod": () => {
    const rows: string[][] = [];
    let changed = false;
    for (const k of [7, 8]) {
      const calls = frontThen(k);
      const copy = new Ring((i, t) => i % t);
      for (const c of calls.slice(0, k)) copy.call(c);
      const shown = versus(modOnce, calls, (c) => observes(c));
      for (const r of shown) {
        // 칸 배치를 보여 줄 사본이 기계로 만든 변이와 같은 답을 내는지 확인한다.
        const mine = copy.call(r.call).out;
        if (!neutral(modOnce) && !Object.is(mine, r.wrong)) {
          throw new Error(
            `칸 배치 사본이 변이와 다른 답을 냈다 — ${label(r.call)}: 변이 ${show(r.wrong)}, 사본 ${show(mine)}`,
          );
        }
        if (!Object.is(r.right, r.wrong)) changed = true;
        rows.push([
          `pushFront ${k} 번 뒤`,
          label(r.call),
          show(r.right),
          show(r.wrong),
          verdict(r.right, r.wrong),
        ]);
      }
    }
    if (!neutral(modOnce) && !changed) {
      throw new Error("변이가 답을 바꾸지 못했다 — 멈춤 절의 반례가 거짓이다");
    }
    return table(
      ["입력", "호출", "바른 코드", "나머지 한 번", "판정"],
      rows,
      [1],
    );
  },

  /** `deep.walk.pause` — 위 변이에서 여덟 원소가 실제로 놓인 자리. 사본이 보인다. */
  "pause-mod-keys": () => {
    const copy = new Ring((i, t) => i % t);
    const heads: string[] = [];
    for (let i = 1; i <= 8; i++) {
      copy.call({ op: "pushFront", arg: i });
      heads.push(show(copy.head));
    }
    const keys = Object.keys(copy.slots);
    const cells = keys.filter((k) => /^\d+$/.test(k));
    return table(
      ["무엇", "값"],
      [
        ["head 가 거쳐 간 값", heads.join(" ")],
        [
          "칸 0..7 에 든 원소",
          cells.map((k) => `[${k}]=${show(copy.slots[Number(k)])}`).join(" "),
        ],
        ["칸 번호가 아닌 키", keys.filter((k) => !/^\d+$/.test(k)).join(" ")],
        ["slots.length", String(copy.slots.length)],
      ],
      [1],
    );
  },

  /**
   * `deep.walk.pause` — 늘릴 때 같은 칸 번호로 옮기면 감긴 채로 늘린 경우만 틀린다. 감긴 원소가
   * 없으면(뒤로만 아홉 번) 답이 같다.
   */
  "pause-copy": () =>
    mutantTable(
      copySame,
      [
        ["전개 T1~T19", WALK, (c, t) => t >= 20 && observes(c)],
        ["뒤로만 아홉 번", BACK_NINE, (c) => observes(c)],
      ],
      "같은 번호로 옮긴 코드",
    ),

  /**
   * `invariant` ② — 연산 여덟이 각각 「앞과 뒤가 같은 수열의 두 끝」을 지키는가. 계약 스위트의
   * 참조 모델(평범한 배열)과 정본을 나란히 실행해, 경계 입력마다 두 끝을 대조한다.
   */
  "invariant-ops": () => {
    const cases: [string, Call[]][] = [
      ["빈 덱", []],
      ["원소 하나 [7]", [{ op: "pushBack", arg: 7 }]],
      ["감긴 원소 셋 [0 1 2]", WALK.slice(3, 6)],
      ["가득 찬 여덟 [0 1 … 7]", WALK.slice(0, 17)],
      ["늘린 뒤 아홉 [-1 0 … 7]", WALK.slice(0, 19)],
    ];
    const ends = (d: Deque<number>): string =>
      `${show(d.peekFront())} · ${show(d.peekBack())}`;
    const rows: string[][] = [];
    for (const [name, prefix] of cases) {
      const ref = new Deque<number>();
      const model: number[] = [];
      // 호출마다 두 끝과 개수를 모델과 대조한다. 하나라도 다르면 던진다.
      const step = (c: Call): unknown => {
        const out = apply(ref, c);
        applyModel(model, c);
        const mf = model.length === 0 ? null : (model[0] as number);
        const mb = model.length === 0 ? null : (model.at(-1) as number);
        if (
          ref.peekFront() !== mf ||
          ref.peekBack() !== mb ||
          ref.size() !== model.length
        ) {
          throw new Error(`두 끝이 모델과 다르다 — ${name} 뒤 ${label(c)}`);
        }
        return out;
      };
      for (const c of prefix) step(c);
      const start = ends(ref);
      step({ op: "pushFront", arg: 100 });
      step({ op: "pushBack", arg: 200 });
      const pushed = ends(ref);
      step({ op: "popFront" });
      step({ op: "popBack" });
      const popped = ends(ref);
      rows.push([name, start, pushed, popped]);
    }
    return table(
      [
        "시작 상태",
        "시작 두 끝",
        "앞에 100 · 뒤에 200 을 넣은 뒤",
        "앞뒤에서 하나씩 뺀 뒤",
      ],
      rows,
    );
  },

  /** `invariant` ③ — 늘린 뒤 `#head` 를 0 으로 되돌리는 줄을 지웠다. */
  "mutant-head": () =>
    mutantTable(
      noReset,
      [
        ["전개 T1~T19", WALK, (c, t) => t >= 20 && observes(c)],
        ["뒤로만 아홉 번", BACK_NINE, (c) => observes(c)],
      ],
      "그 줄을 지운 코드",
    ),

  /** `deep.walk.step` 6 — 전개 연산 열 스물세 번의 걸음 표. */
  "walk-trace": () =>
    table(
      ["단계", "호출", "조건", "칸 번호 계산", "돌려준 값", "비용"],
      WALK_ROWS.map((r) => [
        `T${r.t}`,
        label(r.call),
        condition(r),
        r.ev.calc,
        r.out === undefined ? "" : show(r.out),
        num(r.cost),
      ]),
      [1, 2, 3],
    ),

  /**
   * `deep.walk.step` 6 의 `<!--viz:walk-->` 아래 그림. **시뮬 프레임과 한 걸음씩 맞댄다** — 프레임이
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
      const cells = Array.from({ length: r.total }, (_, i) =>
        r.layout.split(" ")[i] === "·" ? "·" : Number(r.layout.split(" ")[i]),
      );
      const want = JSON.stringify({
        title: `T${r.t} ${label(r.call)}`,
        array: cells,
        head: r.head,
        count: r.count,
      });
      const entries = frame.entries ?? [];
      const got = JSON.stringify({
        title: frame.title.split(" — ")[0],
        array: frame.array,
        head: entries.find((e) => e.label === "head")?.value,
        count: entries.find((e) => e.label === "count")?.value,
      });
      if (want !== got) {
        throw new Error(
          `프레임 ${index + 1} 이 실행과 다르다\n  실행 ${want}\n  시뮬 ${got}`,
        );
      }
    }
    return table(
      ["단계", "칸 배치", "head", "count", "앞 끝부터 읽은 순서"],
      WALK_ROWS.map((r) => [
        `T${r.t}`,
        r.layout,
        num(r.head),
        num(r.count),
        `[${r.order.join(" ")}]`,
      ]),
      [1],
    );
  },

  /** `deep.walk.step` 6 — 분기 라벨이 어느 걸음에서 실행됐는가. */
  "walk-branches": () => {
    const full = WALK_ROWS.filter((r) => r.ev.grew);
    const empty = WALK_ROWS.filter((r) => r.ev.empty);
    const moved = full.reduce((sum, r) => sum + r.ev.moved, 0);
    return table(
      ["라벨", "무엇", "실행된 걸음"],
      [
        ["①", "가득 찼다", full.map((r) => `T${r.t}`).join(" · ")],
        ["②", "비었다", empty.map((r) => `T${r.t}`).join(" · ")],
        [
          "③",
          "옮긴다",
          `${full.map((r) => `T${r.t}`).join(" · ")} 안에서 ${moved} 번`,
        ],
      ],
      [1, 2],
    );
  },

  /** `perf.derive` — 걸음 표의 비용 칸을 연산 묶음별로 모은다. */
  "cost-by-group": () => {
    const groups: [string, OpName[]][] = [
      ["넣기", ["pushFront", "pushBack"]],
      ["빼기", ["popFront", "popBack"]],
      ["보기", ["peekFront", "peekBack", "isEmpty", "size"]],
    ];
    const rows = groups.map(([name, ops]) => {
      const mine = WALK_ROWS.filter((r) => ops.includes(r.call.op));
      const sum = mine.reduce((s, r) => s + r.cost, 0);
      const extra = mine.filter((r) => r.cost !== 1);
      return [
        name,
        num(mine.length),
        num(sum),
        extra.length === 0
          ? "전부 1"
          : extra.map((r) => `T${r.t}=${r.cost}`).join(" · "),
      ];
    });
    const all = WALK_ROWS.reduce((s, r) => s + r.cost, 0);
    rows.push(["합", num(WALK_ROWS.length), num(all), ""]);
    return table(["묶음", "호출 수", "비용 합", "1 이 아닌 걸음"], rows, [3]);
  },

  /**
   * `deep.math` ② — 두 배 규칙에서 뒤로만 `n` 번 넣을 때 옮긴 원소 수를 닫힌 형태와 맞댄다.
   * `t` 는 늘린 횟수다.
   */
  "math-check": () => {
    const rows = [9, 16, 17, 1024, 1025, 1_000_000].map((n) => {
      const { moved, grows } = policyCost(DOUBLE, n);
      // 식으로 낸 t — 8·2^k ≤ n − 1 을 만족하는 k 의 개수.
      const t = n <= 8 ? 0 : Math.floor(Math.log2((n - 1) / 8)) + 1;
      const closed = 8 * (2 ** t - 1);
      if (t !== grows || closed !== moved) {
        throw new Error(
          `닫힌 형태가 실행과 다르다 — n=${n}: 늘린 횟수 ${grows}·옮긴 원소 ${moved}, 식 t=${t}·${closed}`,
        );
      }
      return [num(n), num(t), num(moved), num(2 * (n - 1) - 8)];
    });
    return table(
      ["n", "t", "옮긴 원소 = 8(2^t − 1)", "상한 2(n − 1) − 8"],
      rows,
    );
  },

  /** `perf.bounds` — 계약 스위트 축3 이 정본에 대해 내는 값 전부. */
  "growth-rate": () => {
    const rows = dequeContract.scenarios.map((s) => {
      const j = judge(() => new Deque<number>(), s);
      return [
        s.covers.join("·"),
        s.qualifier,
        ...j.stats.map(fixed2),
        j.ratios.map(fixed2).join(" · "),
        j.ok ? "통과" : "실패",
      ];
    });
    return table(
      [
        "시나리오가 부르는 연산",
        "한정자",
        "n = 1,024",
        "n = 4,096",
        "n = 16,384",
        "r",
        "판정",
      ],
      rows,
      [1],
    );
  },

  /**
   * `perf.worst` — 설계마다 최악이 되는 입력이 다르다. `n = 4,096` 에서 연산당 평균과 한 호출이
   * 쓴 칸의 최댓값을 함께 낸다.
   */
  "worst-inputs": () => {
    const n = 4096;
    const inputs: [string, (d: Counted) => number[]][] = [
      [
        "앞으로만 넣기",
        (d) => {
          const out: number[] = [];
          for (let i = 0; i < n; i++) out.push(costOf(d, () => d.pushFront(i)));
          return out;
        },
      ],
      [
        "번갈아 앞뒤로 빼기",
        (d) => {
          for (let i = 0; i < n; i++) d.pushBack(i);
          const out: number[] = [];
          for (let i = 0; i < n; i++) {
            out.push(
              costOf(d, () => (i % 2 === 0 ? d.popFront() : d.popBack())),
            );
          }
          return out;
        },
      ],
      [
        "칸이 찬 순간 한 번 더 넣기",
        (d) => {
          for (let i = 0; i < n; i++) d.pushBack(i);
          return [costOf(d, () => d.pushBack(n))];
        },
      ],
    ];
    const designs: [string, () => Counted][] = [
      ["배열 하나", () => new OneArray()],
      ["배열 두 개", () => new TwoArrays()],
      ["링 버퍼(정본)", () => new Deque<number>()],
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
      ["입력 (n = 4,096)", "설계", "연산당 평균", "한 호출 최대"],
      rows,
      [1],
    );
  },

  /** `selfcheck` 답 — T23 뒤에 앞으로 한 번 더 넣으면. */
  "check-next": () => {
    const rows = agreeRing([...WALK, { op: "pushFront", arg: -2 }]);
    const r = rows.at(-1) as Row;
    return [
      `${label(r.call)}   ${condition(r)}   ${r.ev.calc}   비용 ${r.cost}`,
      `칸 배치  ${r.layout}`,
      `head ${r.head}  count ${r.count}  앞 끝부터 [${r.order.join(" ")}]`,
    ].join("\n");
  },
};

/* ────────────────────────── 보조 ────────────────────────── */

/** 계약 스위트의 참조 모델과 같은 의미로 평범한 배열에 호출을 건다. */
function applyModel(model: number[], c: Call): void {
  switch (c.op) {
    case "pushFront":
      model.unshift(c.arg ?? 0);
      return;
    case "pushBack":
      model.push(c.arg ?? 0);
      return;
    case "popFront":
      model.shift();
      return;
    case "popBack":
      model.pop();
      return;
    default:
      return;
  }
}

/** 걸음 표의 「조건」 칸. */
function condition(r: Row): string {
  if (r.call.op.startsWith("push")) {
    return r.ev.grew
      ? `count ${r.ev.moved} = 칸 ${r.ev.moved} → ① ③×${r.ev.moved}`
      : `count ${r.count - 1} < 칸 ${r.total}`;
  }
  if (r.call.op === "isEmpty" || r.call.op === "size") return "";
  if (r.ev.empty) return "count 0 → ②";
  const before = r.call.op.startsWith("pop") ? r.count + 1 : r.count;
  return `count ${before} > 0`;
}

/** 전개 연산 열에서 고른 걸음만 표로. */
function walkRows(ts: number[]): string {
  return table(
    ["단계", "호출", "칸 번호 계산", "돌려준 값", "칸 배치", "head", "count"],
    WALK_ROWS.filter((r) => ts.includes(r.t)).map((r) => [
      `T${r.t}`,
      label(r.call),
      r.ev.calc,
      r.out === undefined ? "" : show(r.out),
      r.layout,
      num(r.head),
      num(r.count),
    ]),
    [1, 2, 4],
  );
}

function costOf(d: Counted, fn: () => unknown): number {
  const before = d.__cost;
  fn();
  return d.__cost - before;
}
