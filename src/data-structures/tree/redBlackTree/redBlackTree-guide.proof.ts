/**
 * 원고의 실행 결과 블록을 만든다.
 *
 * - 원고에 직접 실은 2-3 트리·AVL 트리 코드를 추출해 실행하고, 세 참조 구현(레드블랙·AVL·2-3)과 함께
 *   참조 모델(정렬된 중복 없는 배열)에 대조한다.
 * - 레드블랙 트리의 모양은 참조 구현이 노드를 감추므로 같은 절차의 사본 `RbCopy` 로 보이되, 호출마다
 *   참조 구현과 반환값·`__cost` 증가분이 같은지 확인하고 어긋나면 던진다.
 * - 시뮬레이션 프레임은 참조 구현 실행과 한 걸음씩 맞댄다.
 *
 *   bun run tools/check-proof.ts src/data-structures/tree/redBlackTree/redBlackTree-guide.md
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 을를, 이가 } from "../../../../tools/josa.ts";
import { judgeScenario } from "../../_contract/runContract.ts";
import { AVLTree as AvlReference } from "../avlTree/_reference/avlTree.ts";
import { TwoThreeTree as TwoThreeReference } from "../twoThreeTree/_reference/twoThreeTree.ts";
import { RedBlackTree } from "./_reference/redBlackTree.ts";
import {
  type RedBlackTreeContract,
  redBlackTreeContract,
} from "./redBlackTree.contract.ts";
import { walk } from "./redBlackTree-guide.sim.ts";

/* ────────────────────────── 표 그리기 ────────────────────────── */

/** 한글·가나·한자를 고정폭 화면의 두 칸으로 센다. */
const width = (s: string): number =>
  [...s].reduce((n, c) => n + (/[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿]/.test(c) ? 2 : 1), 0);

const pad = (s: string, to: number): string =>
  s + " ".repeat(Math.max(0, to - width(s)));

const padL = (s: string, to: number): string =>
  " ".repeat(Math.max(0, to - width(s))) + s;

/** 머리줄과 본문을 열 폭에 맞춰 그린다. `left` 에 든 열은 왼쪽, 나머지는 오른쪽 정렬이다. */
function table(head: string[], body: string[][], left: number[] = []): string {
  const rows = body.map((r) => r.map((v) => (v === "" ? "—" : v)));
  const w: number[] = [];
  for (let c = 0; c < head.length; c++) {
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

/** 값 뒤에 조사를 붙인다. 이 원고는 조사를 띄어 쓰지 않는다. */
const withJosa = (v: number | string, pick: (v: string) => string): string =>
  `${v}${pick(String(v)).trim()}`;

/** 「과/와」 — 받침이 있으면 「과」. 숫자는 우리말 읽기의 마지막 음절로 본다. */
const 과와 = (v: string): string => (이가(v).trim() === "이" ? "과" : "와");

const show = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.join(", ")}]`;
  if (v === undefined) return "—";
  return String(v);
};

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/* ────────────────────────── 원고에 실은 두 구현 ────────────────────────── */

interface OrderedSet {
  insert(item: number): void;
  delete(item: number): boolean;
  has(item: number): boolean;
  min(): number | null;
  max(): number | null;
  range(low: number, high: number): number[];
  toArray(): number[];
}

type SetConstructor = new () => OrderedSet;

const md = await Bun.file(
  new URL("./redBlackTree-guide.md", import.meta.url),
).text();
const blocks = [...md.matchAll(/```ts\n([\s\S]*?)```/g)]
  .map((match) => match[1] ?? "")
  .filter((code) => /export class (AVLTree|TwoThreeTree)</.test(code));
if (blocks.length !== 2) {
  throw new Error(
    `원고에 2-3 트리와 AVL 트리 구현 코드가 하나씩 있어야 합니다. 찾은 수: ${blocks.length}`,
  );
}
const js = new Bun.Transpiler({ loader: "ts" }).transformSync(
  blocks.join("\n"),
);
const written = new Function(
  `${js.replaceAll("export class", "class")}\nreturn { AVLTree, TwoThreeTree };`,
)() as { AVLTree: SetConstructor; TwoThreeTree: SetConstructor };

/* ────────────────────────── 모양 읽기 ────────────────────────── */

interface AvlShape {
  value: number;
  height: number;
  left: AvlShape | null;
  right: AvlShape | null;
}

interface TwoThreeShape {
  values: number[];
  children: TwoThreeShape[];
}

const avlRoot = (t: OrderedSet): AvlShape | null =>
  (t as unknown as { root: AvlShape | null }).root;

const twoThreeRoot = (t: OrderedSet): TwoThreeShape | null =>
  (t as unknown as { root: TwoThreeShape | null }).root;

/** `4(2(1 3) 6(5 ·))` — 값 뒤 괄호가 왼쪽·오른쪽 자식이고 `·` 는 빈 자리다. */
function avlShape(n: AvlShape | null): string {
  if (n === null) return "·";
  if (n.left === null && n.right === null) return String(n.value);
  return `${n.value}(${avlShape(n.left)} ${avlShape(n.right)})`;
}

/** `[2 4]([1] [3] [5 6])` — 대괄호가 노드 하나이고 뒤 괄호가 자식들이다. */
function twoThreeShape(n: TwoThreeShape | null): string {
  if (n === null) return "·";
  const self = `[${n.values.join(" ")}]`;
  return n.children.length === 0
    ? self
    : `${self}(${n.children.map(twoThreeShape).join(" ")})`;
}

const avlHeight = (n: AvlShape | null): number => (n === null ? 0 : n.height);

const twoThreeHeight = (n: TwoThreeShape | null): number => {
  let h = 0;
  for (let at = n; at !== null; at = at.children[0] ?? null) h++;
  return h;
};

/* ────────────────────────── 레드블랙 트리 사본 ────────────────────────── */

type Color = "red" | "black";

interface CNode {
  value: number;
  color: Color;
  left: CNode;
  right: CNode;
  parent: CNode;
}

/** 고치기에서 어떤 경우를 만났는가. `note` 는 시뮬레이션 설명에 쓰는 문장이다. */
interface Ev {
  kind:
    | "same"
    | "uncleRed"
    | "inner"
    | "outer"
    | "missing"
    | "oneChild"
    | "twoChildren"
    | "siblingRed"
    | "nephewsBlack"
    | "farBlack"
    | "farRed"
    | "rootBlack"
    | "redBlack";
  note: string;
}

const ROTATIONS: Ev["kind"][] = [
  "inner",
  "outer",
  "siblingRed",
  "farBlack",
  "farRed",
];

/**
 * 참조 구현과 같은 절차. 노드를 읽을 수 있게 열어 두었고, 비용을 참조 구현과 같은 자리에서 센다.
 * `newColor` 를 바꾸면 새 노드를 넣는 색만 다른 사본이 된다.
 */
class RbCopy {
  nil: CNode;
  root: CNode;
  count = 0;
  cost = 0;
  events: Ev[] = [];

  constructor(readonly newColor: Color = "red") {
    const nil = { value: Number.NaN, color: "black" } as CNode;
    nil.left = nil;
    nil.right = nil;
    nil.parent = nil;
    this.nil = nil;
    this.root = nil;
  }

  cmp(a: number, b: number): number {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  side(isLeft: boolean): string {
    return isLeft ? "왼쪽" : "오른쪽";
  }

  insert(item: number): void {
    let parent = this.nil;
    let at = this.root;
    while (at !== this.nil) {
      this.cost += 1;
      parent = at;
      const c = this.cmp(item, at.value);
      if (c === 0) {
        this.events.push({
          kind: "same",
          note: `${withJosa(item, 이가)} 이미 있으므로 트리를 바꾸지 않습니다`,
        });
        return;
      }
      at = c < 0 ? at.left : at.right;
    }
    const node: CNode = {
      value: item,
      color: this.newColor,
      left: this.nil,
      right: this.nil,
      parent,
    };
    if (parent === this.nil) this.root = node;
    else if (this.cmp(item, parent.value) < 0) parent.left = node;
    else parent.right = node;
    this.count += 1;
    this.fixInsert(node);
  }

  delete(item: number): boolean {
    const target = this.find(item);
    if (target === this.nil) {
      this.events.push({
        kind: "missing",
        note: `${withJosa(item, 이가)} 없으므로 false를 반환합니다`,
      });
      return false;
    }
    let removed = target;
    let removedColor = removed.color;
    let orphan: CNode;
    if (target.left === this.nil || target.right === this.nil) {
      const child = target.left === this.nil ? target.right : target.left;
      this.events.push({
        kind: "oneChild",
        note:
          child === this.nil
            ? `자식이 없는 ${withJosa(target.value, 을를)} 떼어 냅니다`
            : `${target.value}의 자리를 자식 ${withJosa(child.value, 이가)} 잇습니다`,
      });
      orphan = child;
      this.replace(target, child);
    } else {
      removed = this.leftmost(target.right);
      this.events.push({
        kind: "twoChildren",
        note: `자식이 둘이므로 오른쪽 부분트리의 최솟값 ${withJosa(removed.value, 이가)} ${target.value}의 자리와 색을 잇습니다`,
      });
      removedColor = removed.color;
      orphan = removed.right;
      if (removed.parent === target) {
        orphan.parent = removed;
      } else {
        this.replace(removed, removed.right);
        removed.right = target.right;
        removed.right.parent = removed;
      }
      this.replace(target, removed);
      removed.left = target.left;
      removed.left.parent = removed;
      removed.color = target.color;
    }
    this.count -= 1;
    if (removedColor === "black") this.fixDelete(orphan);
    return true;
  }

  has(item: number): boolean {
    return this.find(item) !== this.nil;
  }

  min(): number | null {
    if (this.root === this.nil) return null;
    return this.leftmost(this.root).value;
  }

  max(): number | null {
    if (this.root === this.nil) return null;
    let at = this.root;
    while (at.right !== this.nil) {
      this.cost += 1;
      at = at.right;
    }
    this.cost += 1;
    return at.value;
  }

  range(low: number, high: number): number[] {
    const out: number[] = [];
    if (this.cmp(low, high) > 0) return out;
    this.collect(this.root, low, high, out);
    return out;
  }

  toArray(): number[] {
    const out: number[] = [];
    this.inOrder(this.root, out);
    return out;
  }

  find(item: number): CNode {
    let at = this.root;
    while (at !== this.nil) {
      this.cost += 1;
      const c = this.cmp(item, at.value);
      if (c === 0) return at;
      at = c < 0 ? at.left : at.right;
    }
    return this.nil;
  }

  leftmost(from: CNode): CNode {
    let at = from;
    while (at.left !== this.nil) {
      this.cost += 1;
      at = at.left;
    }
    this.cost += 1;
    return at;
  }

  collect(node: CNode, low: number, high: number, out: number[]): void {
    if (node === this.nil) return;
    this.cost += 1;
    const vl = this.cmp(node.value, low);
    const vh = this.cmp(node.value, high);
    if (vl > 0) this.collect(node.left, low, high, out);
    if (vl >= 0 && vh <= 0) out.push(node.value);
    if (vh < 0) this.collect(node.right, low, high, out);
  }

  inOrder(node: CNode, out: number[]): void {
    if (node === this.nil) return;
    this.cost += 1;
    this.inOrder(node.left, out);
    out.push(node.value);
    this.inOrder(node.right, out);
  }

  replace(target: CNode, replacement: CNode): void {
    this.cost += 1;
    if (target.parent === this.nil) this.root = replacement;
    else if (target === target.parent.left) target.parent.left = replacement;
    else target.parent.right = replacement;
    replacement.parent = target.parent;
  }

  rotateLeft(pivot: CNode): void {
    this.cost += 1;
    const risen = pivot.right;
    pivot.right = risen.left;
    if (risen.left !== this.nil) risen.left.parent = pivot;
    risen.parent = pivot.parent;
    if (pivot.parent === this.nil) this.root = risen;
    else if (pivot === pivot.parent.left) pivot.parent.left = risen;
    else pivot.parent.right = risen;
    risen.left = pivot;
    pivot.parent = risen;
  }

  rotateRight(pivot: CNode): void {
    this.cost += 1;
    const risen = pivot.left;
    pivot.left = risen.right;
    if (risen.right !== this.nil) risen.right.parent = pivot;
    risen.parent = pivot.parent;
    if (pivot.parent === this.nil) this.root = risen;
    else if (pivot === pivot.parent.right) pivot.parent.right = risen;
    else pivot.parent.left = risen;
    risen.right = pivot;
    pivot.parent = risen;
  }

  fixInsert(start: CNode): void {
    let node = start;
    while (node.parent.color === "red") {
      this.cost += 1;
      const parent = node.parent;
      const grand = parent.parent;
      const parentIsLeft = parent === grand.left;
      const uncle = parentIsLeft ? grand.right : grand.left;
      if (uncle.color === "red") {
        this.events.push({
          kind: "uncleRed",
          note: `부모 ${withJosa(parent.value, 과와)} 삼촌 ${withJosa(uncle.value, 이가)} 모두 빨간색이므로 둘을 검게, 조부모 ${withJosa(grand.value, 을를)} 빨갛게 바꿉니다`,
        });
        parent.color = "black";
        uncle.color = "black";
        grand.color = "red";
        node = grand;
        continue;
      }
      let at = node;
      if (parentIsLeft ? at === parent.right : at === parent.left) {
        this.events.push({
          kind: "inner",
          note: `새 노드가 부모의 안쪽 자식이므로 부모 ${withJosa(parent.value, 을를)} ${this.side(parentIsLeft)}으로 먼저 회전합니다`,
        });
        at = parent;
        if (parentIsLeft) this.rotateLeft(at);
        else this.rotateRight(at);
      }
      const top = at.parent;
      const g = top.parent;
      this.events.push({
        kind: "outer",
        note: `${withJosa(top.value, 을를)} 검게, ${withJosa(g.value, 을를)} 빨갛게 바꾸고 ${withJosa(g.value, 을를)} ${this.side(!parentIsLeft)}으로 회전합니다`,
      });
      at.parent.color = "black";
      at.parent.parent.color = "red";
      if (parentIsLeft) this.rotateRight(at.parent.parent);
      else this.rotateLeft(at.parent.parent);
      node = at;
    }
    if (start !== this.root && this.root.color === "red") {
      this.events.push({
        kind: "rootBlack",
        note: `뿌리 ${withJosa(this.root.value, 이가)} 빨간색이 되었으므로 다시 검게 칠합니다`,
      });
    }
    this.root.color = "black";
  }

  fixDelete(start: CNode): void {
    let node = start;
    while (node !== this.root && node.color === "black") {
      this.cost += 1;
      const isLeft = node === node.parent.left;
      let sibling = isLeft ? node.parent.right : node.parent.left;
      if (sibling.color === "red") {
        this.events.push({
          kind: "siblingRed",
          note: `형제 ${withJosa(sibling.value, 이가)} 빨간색이므로 ${withJosa(sibling.value, 을를)} 검게, 부모 ${withJosa(node.parent.value, 을를)} 빨갛게 바꾸고 부모를 ${this.side(isLeft)}으로 회전합니다`,
        });
        sibling.color = "black";
        node.parent.color = "red";
        if (isLeft) this.rotateLeft(node.parent);
        else this.rotateRight(node.parent);
        sibling = isLeft ? node.parent.right : node.parent.left;
      }
      const near = isLeft ? sibling.left : sibling.right;
      const far = isLeft ? sibling.right : sibling.left;
      if (near.color === "black" && far.color === "black") {
        this.events.push({
          kind: "nephewsBlack",
          note: `형제 ${sibling.value}의 두 자식이 모두 검은색이므로 ${withJosa(sibling.value, 을를)} 빨갛게 바꾸고 부모 ${node.parent.value}에서 다시 확인합니다`,
        });
        sibling.color = "red";
        node = node.parent;
        continue;
      }
      if (far.color === "black") {
        this.events.push({
          kind: "farBlack",
          note: `먼 조카가 검은색이고 가까운 조카 ${withJosa(near.value, 이가)} 빨간색이므로 ${withJosa(near.value, 을를)} 검게, 형제 ${withJosa(sibling.value, 을를)} 빨갛게 바꾸고 형제를 ${this.side(!isLeft)}으로 회전합니다`,
        });
        near.color = "black";
        sibling.color = "red";
        if (isLeft) this.rotateRight(sibling);
        else this.rotateLeft(sibling);
        sibling = isLeft ? node.parent.right : node.parent.left;
      }
      this.events.push({
        kind: "farRed",
        note: `형제 ${withJosa(sibling.value, 이가)} 부모의 색을 받고, 부모 ${withJosa(node.parent.value, 과와)} 먼 조카를 검게 바꾼 뒤 부모를 ${this.side(isLeft)}으로 회전하고 끝냅니다`,
      });
      sibling.color = node.parent.color;
      node.parent.color = "black";
      if (isLeft) {
        sibling.right.color = "black";
        this.rotateLeft(node.parent);
      } else {
        sibling.left.color = "black";
        this.rotateRight(node.parent);
      }
      node = this.root;
    }
    if (node.color === "red") {
      this.events.push({
        kind: "redBlack",
        note: `${withJosa(node.value, 이가)} 빨간색이므로 검게 바꾸고 끝냅니다`,
      });
    }
    node.color = "black";
  }

  /* ── 모양 읽기. 비용을 세지 않는다. ── */

  /** `20B(10B 40R(30B 90B))` — 값 뒤 B 는 검정, R 은 빨강, `·` 는 빈 자리다. */
  shape(n: CNode = this.root): string {
    if (n === this.nil) return "·";
    const tag = `${n.value}${n.color === "red" ? "R" : "B"}`;
    if (n.left === this.nil && n.right === this.nil) return tag;
    return `${tag}(${this.shape(n.left)} ${this.shape(n.right)})`;
  }

  /**
   * 검은 노드 하나와 그 빨간 자식들을 한 노드로 묶어 읽은 모양. 빨간 노드는 늘 검은 부모에
   * 묶이므로 결과는 노드마다 키가 한 개에서 세 개인 트리다.
   */
  as234(n: CNode = this.root): string {
    if (n === this.nil) return "·";
    const keys: number[] = [];
    const children: CNode[] = [];
    const absorb = (x: CNode): void => {
      if (x !== this.nil && x.color === "red") {
        absorb(x.left);
        keys.push(x.value);
        absorb(x.right);
      } else {
        children.push(x);
      }
    };
    absorb(n.left);
    keys.push(n.value);
    absorb(n.right);
    const self = `[${keys.join(" ")}]`;
    if (children.every((c) => c === this.nil)) return self;
    return `${self}(${children.map((c) => this.as234(c)).join(" ")})`;
  }

  height(n: CNode = this.root): number {
    return n === this.nil
      ? 0
      : 1 + Math.max(this.height(n.left), this.height(n.right));
  }

  treeData(n: CNode = this.root): TreeData | null {
    if (n === this.nil) return null;
    const node: TreeData = {
      id: `n${n.value}`,
      label: `${n.value} · ${n.color === "red" ? "R" : "B"}`,
    };
    if (n.left !== this.nil || n.right !== this.nil) {
      node.children = [this.treeData(n.left), this.treeData(n.right)];
    }
    return node;
  }
}

interface TreeData {
  id: string;
  label: string;
  children?: (TreeData | null)[];
}

/* ────────────────────────── 호출 열 ────────────────────────── */

type OpName = keyof RedBlackTreeContract<number>;

interface Call {
  op: OpName | "new";
  args?: number[];
}

const op = (name: OpName, ...args: number[]): Call => ({ op: name, args });

const label = (c: Call): string =>
  c.op === "new"
    ? "new RedBlackTree<number>()"
    : `${c.op}(${(c.args ?? []).join(", ")})`;

function apply(d: OrderedSet, c: Call): unknown {
  const [a = 0, b = 0] = c.args ?? [];
  switch (c.op) {
    case "new":
      return undefined;
    case "insert":
      return d.insert(a);
    case "delete":
      return d.delete(a);
    case "has":
      return d.has(a);
    case "min":
      return d.min();
    case "max":
      return d.max();
    case "range":
      return d.range(a, b);
    case "toArray":
      return d.toArray();
  }
}

/** 전개의 호출 열. 넣기 뒤 고치기의 세 경우와 지우기 뒤 고치기의 네 경우가 모두 나온다. */
export const WALK: Call[] = [
  { op: "new" },
  op("max"),
  op("insert", 10),
  op("insert", 90),
  op("insert", 20),
  op("insert", 30),
  op("insert", 40),
  op("insert", 50),
  op("insert", 30),
  op("has", 40),
  op("has", 35),
  op("range", 25, 55),
  op("range", 50, 20),
  op("delete", 20),
  op("delete", 10),
  op("delete", 35),
  op("min"),
  op("max"),
  op("toArray"),
];

export interface Row {
  t: number;
  call: Call;
  out: unknown;
  events: Ev[];
  cost: number;
  shape: string;
  tree: TreeData | null;
  count: number;
  height: number;
}

/** 사본과 참조 구현을 나란히 실행한다. 반환값이나 비용 증가분이 다르면 던진다. */
function agree(calls: Call[], mine = new RbCopy()): Row[] {
  const ref = new RedBlackTree<number>();
  const rows: Row[] = [];
  for (const [index, c] of calls.entries()) {
    const refBefore = ref.__cost;
    const mineBefore = mine.cost;
    const eventsBefore = mine.events.length;
    const refOut = apply(ref, c);
    const mineOut = apply(mine, c);
    const refCost = ref.__cost - refBefore;
    const mineCost = mine.cost - mineBefore;
    if (!same(refOut, mineOut) || refCost !== mineCost) {
      throw new Error(
        `사본이 참조 구현과 갈라졌습니다 — ${index + 1}번째 ${label(c)}: 참조 구현 ${show(refOut)}·비용 ${refCost}, 사본 ${show(mineOut)}·비용 ${mineCost}`,
      );
    }
    rows.push({
      t: index + 1,
      call: c,
      out: mineOut,
      events: mine.events.slice(eventsBefore),
      cost: mineCost,
      shape: mine.shape(),
      tree: mine.treeData(),
      count: mine.count,
      height: mine.height(),
    });
  }
  return rows;
}

export const WALK_ROWS = agree(WALK);

/** 시뮬레이션 프레임 한 장의 설명 문장. */
export function detailOf(r: Row): string {
  if (r.events.length > 0) {
    return `${r.events.map((e) => e.note).join(". ")}.`;
  }
  const [a = 0, b = 0] = r.call.args ?? [];
  switch (r.call.op) {
    case "new":
      return "빈 트리를 만듭니다. 뿌리는 검은 빈 자리 노드를 가리킵니다.";
    case "insert":
      return r.count === 1
        ? `빈 트리였으므로 ${withJosa(a, 이가)} 뿌리가 되고 검은색으로 칠해집니다.`
        : `${withJosa(a, 을를)} 빨간 노드로 붙였고 부모가 검은색이므로 고칠 것이 없습니다.`;
    case "has":
      return `${withJosa(a, 을를)} 찾아 내려가 ${String(r.out)}를 반환합니다.`;
    case "min":
    case "max":
      return r.out === null
        ? "트리가 비어 있으므로 null을 반환합니다."
        : `${r.call.op === "min" ? "왼쪽" : "오른쪽"}으로 끝까지 내려가 ${withJosa(String(r.out), 을를)} 반환합니다.`;
    case "range":
      return a > b
        ? `low ${withJosa(a, 이가)} high ${b}보다 크므로 빈 배열을 반환합니다.`
        : `${a} 이상 ${b} 이하인 값 ${show(r.out)}을 오름차순으로 반환합니다.`;
    case "toArray":
      return `중위 순회로 ${show(r.out)}을 반환합니다. 이것이 마지막 결과입니다.`;
    default:
      return "";
  }
}

/** 시뮬 프레임이 담아야 하는 값. */
export function frameOf(r: Row): {
  title: string;
  root: TreeData | null;
  entries: { label: string; value: string | number }[];
} {
  return {
    title: `T${r.t} ${label(r.call)}`,
    root: r.tree,
    entries: [
      { label: "반환값", value: show(r.out) },
      { label: "지나간 노드", value: r.cost },
      { label: "원소 수", value: r.count },
      { label: "높이", value: r.height },
    ],
  };
}

/* ────────────────────────── 참조 모델 대조 ────────────────────────── */

/** 정렬된 중복 없는 배열에 같은 호출을 적용한 결과. */
function modelApply(model: number[], c: Call): unknown {
  const [a = 0, b = 0] = c.args ?? [];
  switch (c.op) {
    case "new":
      return undefined;
    case "insert": {
      if (!model.includes(a)) {
        model.push(a);
        model.sort((x, y) => x - y);
      }
      return undefined;
    }
    case "delete": {
      const at = model.indexOf(a);
      if (at < 0) return false;
      model.splice(at, 1);
      return true;
    }
    case "has":
      return model.includes(a);
    case "min":
      return model[0] ?? null;
    case "max":
      return model.at(-1) ?? null;
    case "range":
      return model.filter((v) => v >= a && v <= b);
    case "toArray":
      return [...model];
  }
}

const IMPLEMENTATIONS: [string, () => OrderedSet][] = [
  ["본문의 2-3 트리 코드", () => new written.TwoThreeTree()],
  ["본문의 AVL 트리 코드", () => new written.AVLTree()],
  ["레드블랙 트리 참조 구현", () => new RedBlackTree<number>()],
  ["2-3 트리 참조 구현", () => new TwoThreeReference<number>()],
  ["AVL 트리 참조 구현", () => new AvlReference<number>()],
];

function randomCalls(count: number, seed: number): Call[] {
  let s = seed;
  const next = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
  const names: OpName[] = [
    "insert",
    "insert",
    "insert",
    "delete",
    "delete",
    "has",
    "min",
    "max",
    "range",
    "toArray",
  ];
  return Array.from({ length: count }, () => {
    const r = next();
    const name = names[r % names.length] as OpName;
    const v = (r >>> 8) % 64;
    return op(name, v, v + ((r >>> 16) % 12));
  });
}

/* ────────────────────────── 여러 구현의 모양 ────────────────────────── */

const ascending = (n: number): Call[] =>
  Array.from({ length: n }, (_, i) => op("insert", i + 1));

/** 같은 호출을 원고의 두 구현과 레드블랙 사본에 걸고, 호출마다 세 모양을 적는다. */
function threeShapes(calls: Call[], prefix: Call[]): string[][] {
  const two = new written.TwoThreeTree();
  const avl = new written.AVLTree();
  const mine = new RbCopy();
  const ref = new RedBlackTree<number>();
  for (const c of prefix) {
    apply(two, c);
    apply(avl, c);
    apply(mine, c);
    apply(ref, c);
  }
  const rows: string[][] = [];
  for (const c of calls) {
    const outs = [apply(two, c), apply(avl, c)];
    const before = mine.cost;
    const refBefore = ref.__cost;
    const a = apply(mine, c);
    const b = apply(ref, c);
    if (!same(a, b) || mine.cost - before !== ref.__cost - refBefore) {
      throw new Error(
        `레드블랙 사본이 ${label(c)}에서 참조 구현과 갈라졌습니다`,
      );
    }
    if (outs.some((o) => !same(o, a))) {
      throw new Error(`세 구현의 반환값이 ${label(c)}에서 다릅니다`);
    }
    if (
      !same(two.toArray(), mine.toArray()) ||
      !same(avl.toArray(), mine.toArray())
    ) {
      throw new Error(`세 구현의 원소가 ${label(c)} 뒤에 다릅니다`);
    }
    rows.push([
      label(c),
      twoThreeShape(twoThreeRoot(two)),
      avlShape(avlRoot(avl)),
      mine.shape(),
    ]);
  }
  return rows;
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF_PATH = new URL("./_reference/redBlackTree.ts", import.meta.url)
  .pathname;

type RbModule = { RedBlackTree: typeof RedBlackTree };

/** 새 노드를 빨간색이 아니라 검은색으로 넣는 참조 구현 변이. */
const blackInsert = await loadMutant<RbModule>(REF_PATH, {
  swap: [/color: "red",/, 'color: "black",'],
});

const neutral = (m: RbModule): boolean => m.RedBlackTree === RedBlackTree;

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /** 설계 상세 — 오름차순으로 넣었을 때 균형 없는 트리와 세 구현의 높이. */
  "ascending-heights": () => {
    const rows: string[][] = [];
    for (const n of [7, 1023]) {
      const two = new written.TwoThreeTree();
      const avl = new written.AVLTree();
      const rb = new RbCopy();
      for (let i = 1; i <= n; i++) {
        two.insert(i);
        avl.insert(i);
        rb.insert(i);
      }
      rows.push([
        num(n),
        num(n),
        num(twoThreeHeight(twoThreeRoot(two))),
        num(avlHeight(avlRoot(avl))),
        num(rb.height()),
      ]);
    }
    return table(
      [
        "1부터 n까지 오름차순",
        "균형 없는 트리",
        "2-3 트리",
        "AVL 트리",
        "레드블랙 트리",
      ],
      rows,
    );
  },

  /** 2-3 트리 절 — 오름차순 1~7 넣기의 모양 변화. */
  "two-three-inserts": () => {
    const t = new written.TwoThreeTree();
    const counter = { splits: 0, fixes: 0 };
    countTwoThree(t, counter);
    return table(
      ["호출", "나누기", "2-3 트리 모양", "높이"],
      ascending(7).map((c) => {
        counter.splits = 0;
        apply(t, c);
        return [
          label(c),
          num(counter.splits),
          twoThreeShape(twoThreeRoot(t)),
          num(twoThreeHeight(twoThreeRoot(t))),
        ];
      }),
      [2],
    );
  },

  /** 2-3 트리 절 — 1~7 을 넣은 뒤 4 · 1 · 2 를 지운 모양 변화. */
  "two-three-deletes": () => {
    const t = new written.TwoThreeTree();
    for (const c of ascending(7)) apply(t, c);
    const counter = { splits: 0, fixes: 0 };
    countTwoThree(t, counter);
    return table(
      ["호출", "반환값", "빌리기·합치기", "2-3 트리 모양", "높이"],
      [4, 1, 2].map((v) => {
        counter.fixes = 0;
        const out = t.delete(v);
        return [
          `delete(${v})`,
          String(out),
          num(counter.fixes),
          twoThreeShape(twoThreeRoot(t)),
          num(twoThreeHeight(twoThreeRoot(t))),
        ];
      }),
      [3],
    );
  },

  /** AVL 트리 절 — 오름차순 1~7 넣기에서 회전 수와 모양. */
  "avl-inserts": () => {
    const t = new written.AVLTree();
    const counter = { rotations: 0 };
    countAvlRotations(t, counter);
    return table(
      ["호출", "회전", "AVL 트리 모양", "뿌리의 높이"],
      ascending(7).map((c) => {
        counter.rotations = 0;
        apply(t, c);
        return [
          label(c),
          num(counter.rotations),
          avlShape(avlRoot(t)),
          num(avlHeight(avlRoot(t))),
        ];
      }),
      [2],
    );
  },

  /** 레드블랙 트리 절 — 같은 넣기에서 레드블랙 트리 모양과 2-3-4 트리로 묶어 읽은 모양. */
  "rb-as-234": () => {
    const mine = new RbCopy();
    const rows = agree(ascending(7), mine);
    const reread = new RbCopy();
    return table(
      ["호출", "레드블랙 트리 모양", "검은 노드와 빨간 자식을 묶어 읽은 모양"],
      rows.map((r) => {
        apply(reread, r.call);
        if (reread.shape() !== r.shape) {
          throw new Error("다시 만든 모양이 참조 구현 대조 사본과 다릅니다");
        }
        return [label(r.call), r.shape, reread.as234()];
      }),
      [1, 2],
    );
  },

  /** 세 구현을 나란히 — 오름차순 1~7 넣기 뒤 4 · 1 · 2 지우기. */
  "three-deletes": () =>
    table(
      ["호출", "2-3 트리", "AVL 트리", "레드블랙 트리"],
      threeShapes(
        [op("delete", 4), op("delete", 1), op("delete", 2)],
        ascending(7),
      ),
      [1, 2, 3],
    ),

  /** 수행 — 전개 호출 열의 반환값과 호출 뒤 모양. */
  "walk-table": () =>
    table(
      ["단계", "호출", "반환값", "호출 뒤 모양", "높이"],
      WALK_ROWS.map((r) => [
        `T${r.t}`,
        label(r.call),
        show(r.out),
        r.shape,
        num(r.height),
      ]),
      [1, 2, 3],
    ),

  /** 수행 — 넣기·지우기 뒤 고치기가 만난 경우와 한 일. */
  "walk-fixes": () => {
    const rows: string[][] = [];
    for (const r of WALK_ROWS) {
      if (r.events.length === 0) continue;
      for (const [k, e] of r.events.entries()) {
        rows.push([k === 0 ? `T${r.t}` : "", e.note]);
      }
    }
    return table(["단계", "한 일"], rows, [1]);
  },

  /** 수행 — 시뮬레이션 프레임을 참조 구현 실행과 맞댄다. */
  simulation: () => {
    if (walk.steps.length !== WALK_ROWS.length) {
      throw new Error(
        `실행 걸음 ${WALK_ROWS.length}과 시뮬 프레임 ${walk.steps.length}이 다릅니다`,
      );
    }
    for (const [index, frame] of walk.steps.entries()) {
      const r = WALK_ROWS[index] as Row;
      const want = JSON.stringify({ ...frameOf(r), detail: detailOf(r) });
      const got = JSON.stringify({
        title: frame.title,
        root: frame.root,
        entries: frame.entries,
        detail: frame.detail,
      });
      if (want !== got) {
        throw new Error(
          `프레임 ${index + 1}이 실행과 다릅니다\n  실행 ${want}\n  시뮬 ${got}`,
        );
      }
    }
    const last = WALK_ROWS.at(-1) as Row;
    if (JSON.stringify(last.out) !== walk.result) {
      throw new Error("시뮬레이션의 result가 마지막 반환값과 다릅니다");
    }
    return [
      `시뮬레이션 ${walk.steps.length}단계: 호출·반환값·모양·설명이 참조 구현 실행과 일치`,
      `마지막 반환값: ${show(last.out)}`,
      `최종 모양: ${last.shape}`,
    ].join("\n");
  },

  /** 멈춤 — 새 노드를 검게 넣은 변이. 넣기만 하는 입력. */
  "black-insert": () => {
    const rows: string[][] = [];
    let changed = false;
    for (const n of [7, 1023]) {
      const a = new RedBlackTree<number>();
      const b = new blackInsert.RedBlackTree<number>();
      const copyA = new RbCopy();
      const copyB = new RbCopy(neutral(blackInsert) ? "red" : "black");
      for (let i = 1; i <= n; i++) {
        a.insert(i);
        b.insert(i);
        copyA.insert(i);
        copyB.insert(i);
      }
      if (copyA.cost !== a.__cost || copyB.cost !== b.__cost) {
        throw new Error("사본의 비용이 참조 구현이나 변이와 다릅니다");
      }
      if (a.__cost !== b.__cost) changed = true;
      const verdict = (x: unknown, y: unknown): string =>
        same(x, y) ? "같다" : "어긋난다";
      rows.push(
        [
          `1~${num(n)}`,
          "toArray()",
          `1부터 ${num(n)}까지`,
          same(a.toArray(), b.toArray()) ? `1부터 ${num(n)}까지` : "다름",
          verdict(a.toArray(), b.toArray()),
        ],
        [
          "",
          "높이",
          num(copyA.height()),
          num(copyB.height()),
          verdict(copyA.height(), copyB.height()),
        ],
        [
          "",
          "넣기 전체가 지나간 노드",
          num(a.__cost),
          num(b.__cost),
          verdict(a.__cost, b.__cost),
        ],
      );
    }
    if (!neutral(blackInsert) && !changed) {
      throw new Error("변이가 값을 바꾸지 못했습니다");
    }
    return table(
      [
        "넣은 값",
        "무엇",
        "빨간색으로 넣는 코드",
        "검은색으로 넣는 코드",
        "판정",
      ],
      rows,
      [1, 2, 3],
    );
  },

  /** 불변식 — 다섯 구현을 참조 모델과 무작위 호출·계약 경계 입력으로 대조한다. */
  implementations: () => {
    const calls = randomCalls(20000, 731);
    for (const [name, make] of IMPLEMENTATIONS) {
      const d = make();
      const model: number[] = [];
      for (const [i, c] of calls.entries()) {
        const got = apply(d, c);
        const want = modelApply(model, c);
        if (!same(got, want)) {
          throw new Error(
            `${name}: ${i + 1}번째 ${label(c)} 결과 ${show(got)}, 모델 ${show(want)}`,
          );
        }
      }
      for (const edge of redBlackTreeContract.edges) {
        const e = make();
        const m: number[] = [];
        for (const step of edge.steps) {
          const args = Array.isArray(step.arg)
            ? (step.arg as number[])
            : step.arg === undefined
              ? []
              : [step.arg as number];
          const c = op(step.op as OpName, ...args);
          if (!same(apply(e, c), modelApply(m, c))) {
            throw new Error(
              `${name}: 경계 입력 「${edge.name}」에서 모델과 다릅니다`,
            );
          }
          for (const inv of redBlackTreeContract.invariants) {
            const broke = inv.check(e as RedBlackTreeContract<number>);
            if (broke !== null) throw new Error(`${name}: ${broke}`);
          }
        }
      }
    }
    return [
      `다섯 구현(본문의 2-3 트리·AVL 트리 코드와 세 참조 구현): 무작위 호출 ${num(calls.length)}번이 참조 모델과 일치`,
      `계약의 경계 입력 ${redBlackTreeContract.edges.length}개: 호출마다 계약의 불변식 ${redBlackTreeContract.invariants.length}개 성립`,
    ].join("\n");
  },

  /** 수식 — 높이 h 인 트리가 담아야 하는 최소 원소 수와, 원소 백만 개일 때의 높이 상한. */
  "min-nodes": () => {
    const avlMin: number[] = [0, 1];
    for (let h = 2; h <= 40; h++) {
      avlMin.push((avlMin[h - 1] as number) + (avlMin[h - 2] as number) + 1);
    }
    const twoThreeMin = (h: number): number => 2 ** h - 1;
    const avlMinOf = (h: number): number => avlMin[h] as number;
    const rbMin = (h: number): number => 2 ** Math.ceil(h / 2) - 1;
    const rows = [1, 2, 3, 4, 5, 6, 10, 20].map((h) => [
      num(h),
      num(twoThreeMin(h)),
      num(avlMinOf(h)),
      num(rbMin(h)),
    ]);
    const n = 1_000_000;
    const maxHeight = (min: (h: number) => number): number => {
      let h = 0;
      while (min(h + 1) <= n) h++;
      return h;
    };
    return [
      table(["높이 h", "2-3 트리", "AVL 트리", "레드블랙 트리 (하한)"], rows),
      "",
      `원소 ${num(n)}개일 때 높이 상한 — 2-3 트리 ${maxHeight(twoThreeMin)} · AVL 트리 ${maxHeight(avlMinOf)} · 레드블랙 트리 ${maxHeight(rbMin)}`,
    ].join("\n");
  },

  /** 수식 — 두 입력 순서에서 실제로 잰 높이. */
  heights: () => {
    const rows: string[][] = [];
    for (const n of [1023, 65535]) {
      for (const order of ["오름차순", "무작위"]) {
        const values = Array.from({ length: n }, (_, i) => i + 1);
        if (order === "무작위") {
          let s = 97;
          for (let i = n - 1; i > 0; i--) {
            s = (s * 1103515245 + 12345) % 2147483648;
            const k = Math.floor((s / 2147483648) * (i + 1));
            [values[i], values[k]] = [values[k] as number, values[i] as number];
          }
        }
        const two = new written.TwoThreeTree();
        const avl = new written.AVLTree();
        const rb = new RbCopy();
        for (const v of values) {
          two.insert(v);
          avl.insert(v);
          rb.insert(v);
        }
        rows.push([
          num(n),
          order,
          num(twoThreeHeight(twoThreeRoot(two))),
          num(avlHeight(avlRoot(avl))),
          num(rb.height()),
          fixed2(Math.log2(n + 1)),
          fixed2(2 * Math.log2(n + 1)),
        ]);
      }
    }
    return table(
      [
        "n",
        "넣은 순서",
        "2-3 트리",
        "AVL 트리",
        "레드블랙 트리",
        "log₂(n+1)",
        "2·log₂(n+1)",
      ],
      rows,
      [1],
    );
  },

  /** 비용 — 호출 한 번이 모양을 고치는 횟수의 최댓값. */
  "fix-counts": () => {
    const n = 4095;
    let s = 5;
    const shuffled = (): number[] => {
      const order = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = n - 1; i > 0; i--) {
        s = (s * 1103515245 + 12345) % 2147483648;
        const k = Math.floor((s / 2147483648) * (i + 1));
        [order[i], order[k]] = [order[k] as number, order[i] as number];
      }
      return order;
    };
    const inserts = shuffled();
    const deletes = shuffled();
    const two = new written.TwoThreeTree();
    const avl = new written.AVLTree();
    const rb = new RbCopy();
    const avlCount = { rotations: 0 };
    const twoCount = { splits: 0, fixes: 0 };
    countAvlRotations(avl, avlCount);
    countTwoThree(two, twoCount);
    const max = { splits: 0, avlIn: 0, rbIn: 0, fixes: 0, avlOut: 0, rbOut: 0 };
    const rotationsSince = (from: number): number =>
      rb.events.slice(from).filter((e) => ROTATIONS.includes(e.kind)).length;
    for (const i of inserts) {
      twoCount.splits = 0;
      avlCount.rotations = 0;
      const e0 = rb.events.length;
      two.insert(i);
      avl.insert(i);
      rb.insert(i);
      max.splits = Math.max(max.splits, twoCount.splits);
      max.avlIn = Math.max(max.avlIn, avlCount.rotations);
      max.rbIn = Math.max(max.rbIn, rotationsSince(e0));
    }
    for (const v of deletes) {
      twoCount.fixes = 0;
      avlCount.rotations = 0;
      const e0 = rb.events.length;
      two.delete(v);
      avl.delete(v);
      rb.delete(v);
      max.fixes = Math.max(max.fixes, twoCount.fixes);
      max.avlOut = Math.max(max.avlOut, avlCount.rotations);
      max.rbOut = Math.max(max.rbOut, rotationsSince(e0));
    }
    if (
      rb.count !== 0 ||
      two.toArray().length !== 0 ||
      avl.toArray().length !== 0
    ) {
      throw new Error("다 지운 뒤 원소가 남았습니다");
    }
    return [
      `1부터 ${num(n)}까지 섞은 순서로 넣고 다른 순서로 모두 지웠을 때, 호출 한 번의 최댓값`,
      table(
        ["구현", "넣기 한 번", "지우기 한 번"],
        [
          ["2-3 트리", `나누기 ${max.splits}`, `빌리기·합치기 ${max.fixes}`],
          ["AVL 트리", `회전 ${max.avlIn}`, `회전 ${max.avlOut}`],
          ["레드블랙 트리", `회전 ${max.rbIn}`, `회전 ${max.rbOut}`],
        ],
        [1, 2],
      ),
    ].join("\n");
  },

  /** 비용 — 세 참조 구현을 계약 스위트의 시나리오 여섯에 넣는다. */
  scenarios: () => {
    const makes: [
      string,
      () => { __cost: number } & RedBlackTreeContract<number>,
    ][] = [
      ["2-3 트리", () => new TwoThreeReference<number>()],
      ["AVL 트리", () => new AvlReference<number>()],
      ["레드블랙 트리", () => new RedBlackTree<number>()],
    ];
    const rows = redBlackTreeContract.scenarios.map((sc) => [
      `${sc.covers.join("·")}${sc.adversarial ? " (적대적)" : ""}`,
      sc.bound,
      ...makes.map(([, make]) => {
        const v = judgeScenario(
          { kind: "self-reported", make },
          sc,
          redBlackTreeContract.grade,
        );
        const stats = v.points.map((p) => p.stat);
        const r = (stats.at(-1) as number) / (stats.at(-2) as number);
        return `${fixed2(r)} ${v.ok ? "통과" : "실패"}`;
      }),
    ]);
    return table(
      ["시나리오", "상한", ...makes.map(([name]) => name)],
      rows,
      [1],
    );
  },
};

/* ────────────────────────── 보조 ────────────────────────── */

type Rotating = {
  rotateLeft: (p: unknown) => unknown;
  rotateRight: (p: unknown) => unknown;
};

/** 원고의 AVL 코드 인스턴스에서 회전 호출을 센다. 코드는 바꾸지 않는다. */
function countAvlRotations(
  t: OrderedSet,
  counter: { rotations: number },
): void {
  const self = t as unknown as Rotating;
  const proto = Object.getPrototypeOf(t) as Rotating;
  self.rotateLeft = function (this: unknown, p: unknown) {
    counter.rotations += 1;
    return proto.rotateLeft.call(this, p);
  };
  self.rotateRight = function (this: unknown, p: unknown) {
    counter.rotations += 1;
    return proto.rotateRight.call(this, p);
  };
}

type TwoThreeInternals = {
  insertInto: (n: TwoThreeShape, item: number) => unknown;
  fixChild: (p: TwoThreeShape, at: number) => void;
};

/** 원고의 2-3 코드 인스턴스에서 노드 나누기와, 빈 자식을 빌리기·합치기로 메운 횟수를 센다. */
function countTwoThree(
  t: OrderedSet,
  counter: { splits: number; fixes: number },
): void {
  const self = t as unknown as TwoThreeInternals;
  const proto = Object.getPrototypeOf(t) as TwoThreeInternals;
  self.insertInto = function (this: unknown, n: TwoThreeShape, item: number) {
    const split = proto.insertInto.call(this, n, item);
    if (split !== null) counter.splits += 1;
    return split;
  };
  self.fixChild = function (this: unknown, p: TwoThreeShape, at: number) {
    if ((p.children[at] as TwoThreeShape).values.length === 0) {
      counter.fixes += 1;
    }
    proto.fixChild.call(this, p, at);
  };
}
