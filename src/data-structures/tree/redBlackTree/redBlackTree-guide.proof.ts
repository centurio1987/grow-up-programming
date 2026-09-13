/**
 * 본문이 「실행하면 이렇게 나옵니다」로 내미는 블록의 출처.
 *
 * 값을 여기 적지 않는다 — **정본(`_reference/redBlackTree.ts`)을 부르고, 변이는 그 소스에서
 * 기계로 만든다.** 값을 적어 넣으면 대조가 자기 자신과의 대조가 되고, 그때 이 파일은 아무것도
 * 증명하지 않는다.
 *
 *   bun run tools/check-proof.ts src/data-structures/tree/redBlackTree/redBlackTree-guide.md
 *
 * 정본은 노드와 감시 노드를 private 으로 감춘다. 그래서 트리 모양을 보여 주는 블록은 같은
 * 절차의 사본 `RbCopy` 를 쓰되, **호출마다 정본과 반환값·`__cost` 증가분이 같은지 확인**하고
 * 어긋나면 던진다(`agree`). 사본이 정본에서 갈라지면 그 자리에서 실패한다.
 *
 * 단순한 구현 셋(정렬 배열 · 균형 없는 트리 · 조회가 고쳐 쓰는 트리)은 저장소의 **결함
 * fixture** 를 그대로 부르고, 비용은 **계약 스위트의 판정 함수 `judgeScenario` 에 그대로 넣어**
 * 얻는다. 본문이 인용하는 성장률이 축3 이 실제로 내는 값과 같은 값이어야 해서다.
 */

import { loadMutant } from "../../../../tools/check-proof.ts";
import { 으로, 을를, 이가 } from "../../../../tools/josa.ts";
import { SortedArraySet } from "../../_contract/_fixtures/sortedArraySet.ts";
import { SplayingSearchTree } from "../../_contract/_fixtures/splayingSearchTree.ts";
import { UnbalancedSearchTree } from "../../_contract/_fixtures/unbalancedSearchTree.ts";
import { judgeScenario } from "../../_contract/runContract.ts";
import { RedBlackTree } from "./_reference/redBlackTree.ts";
import {
  type RedBlackTreeContract,
  redBlackTreeContract,
} from "./redBlackTree.contract.ts";
import { walk } from "./redBlackTree-guide.sim.ts";

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

/** 반환값을 본문 표기로. 배열은 `[30 40 50]`, 반환이 없으면 「—」. */
const show = (v: unknown): string => {
  if (Array.isArray(v)) return `[${v.join(" ")}]`;
  if (v === undefined) return "—";
  return String(v);
};

const same = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

/* ────────────────────────── 호출 열 ────────────────────────── */

type OpName = keyof RedBlackTreeContract<number>;

interface Call {
  op: OpName | "new";
  args?: number[];
}

const label = (c: Call): string =>
  c.op === "new"
    ? "new RedBlackTree<number>()"
    : `${c.op}(${(c.args ?? []).join(", ")})`;

/** 호출 하나를 어느 구현에든 건다. 생성자는 부르는 쪽이 따로 만든다. */
function apply(d: RedBlackTreeContract<number>, c: Call): unknown {
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
    case "size":
      return d.size();
    case "toArray":
      return d.toArray();
  }
}

const op = (name: OpName, ...args: number[]): Call => ({ op: name, args });

/**
 * 「수행으로 알아보는 자료구조」가 끝까지 쓰는 연산 열. 스무 번이다.
 *
 * 아홉 연산(생성자 포함)이 모두 한 번 이상 나오고, **넣은 뒤 고치기의 세 갈래와 지운 뒤 고치기의
 * 네 갈래가 전부** 들어 있다. 넣기 여섯과 지우기 둘은 그 일곱 갈래를 모두 지나는 가장 짧은
 * 열을 실행으로 찾아 고른 것이다(값 10 · 20 · … · 90 에서 넣기 5~8 개 · 지우기 2~5 개 조합을
 * 전수에 가깝게 실행해 가장 짧은 것).
 */
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
  op("size"),
  op("toArray"),
];

const ascending = (n: number): Call[] =>
  Array.from({ length: n }, (_, i) => op("insert", i + 1));

/* ────────────────────────── 상태를 보이는 사본 ────────────────────────── */

type Color = "red" | "black";

interface CNode {
  value: number;
  color: Color;
  left: CNode;
  right: CNode;
  parent: CNode;
}

/** 갈래 이름. 본문의 원문자 라벨과 1:1 이다(`LABEL`). */
type Branch =
  | "dup"
  | "recolor"
  | "inner"
  | "outer"
  | "missing"
  | "oneChild"
  | "twoChildren"
  | "sibRed"
  | "bothBlack"
  | "farBlack"
  | "farRed"
  | "empty"
  | "reversed";

const LABEL: Record<Branch, string> = {
  dup: "①",
  recolor: "②",
  inner: "③",
  outer: "④",
  missing: "⑤",
  oneChild: "⑥",
  twoChildren: "⑦",
  sibRed: "⑧",
  bothBlack: "⑨",
  farBlack: "⑩",
  farRed: "⑪",
  empty: "⑫",
  reversed: "⑬",
};

interface Ev {
  b: Branch;
  /** 그 갈래가 한 일을 값으로. 걸음 표의 설명 칸이 읽는다. */
  note: string;
}

/**
 * 정본과 같은 절차. 노드를 읽을 수 있게 열어 두었고, 비용을 정본과 같은 자리에서 센다 — 노드
 * 하나를 지나갈 때마다 1, 색을 바꾸는 일과 회전도 지나간 노드로 센다.
 *
 * `newColor` 를 바꿔 끼우면 **새 노드를 넣는 색만 다른 사본**이 된다 — 멈춤 절이 그 사본으로
 * 모양을 보이고, 그 사본의 반환값·비용이 기계로 만든 변이와 같은지를 따로 확인한다.
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

  insert(item: number): void {
    let parent = this.nil;
    let at = this.root;
    while (at !== this.nil) {
      this.cost += 1;
      parent = at;
      const c = this.cmp(item, at.value);
      if (c === 0) {
        this.events.push({ b: "dup", note: `${item}${이가(item)} 이미 있다` });
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
      this.events.push({ b: "missing", note: `${item}${이가(item)} 없다` });
      return false;
    }
    let removed = target;
    let removedColor = removed.color;
    let orphan: CNode;
    if (target.left === this.nil || target.right === this.nil) {
      const child = target.left === this.nil ? target.right : target.left;
      this.events.push({
        b: "oneChild",
        note:
          child === this.nil
            ? `${target.value}${을를(target.value)} 떼어 내고 그 자리를 비운다`
            : `${target.value} 의 자리를 자식 ${child.value}${이가(child.value)} 잇는다`,
      });
      orphan = child;
      this.replace(target, child);
    } else {
      removed = this.leftmost(target.right);
      this.events.push({
        b: "twoChildren",
        note: `오른쪽 최솟값 ${removed.value}${이가(removed.value)} ${target.value} 의 자리를 잇는다`,
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
    if (this.root === this.nil) {
      this.events.push({ b: "empty", note: "뿌리가 빈 자리다" });
      return null;
    }
    return this.leftmost(this.root).value;
  }

  max(): number | null {
    if (this.root === this.nil) {
      this.events.push({ b: "empty", note: "뿌리가 빈 자리다" });
      return null;
    }
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
    if (this.cmp(low, high) > 0) {
      this.events.push({ b: "reversed", note: `${low} > ${high}` });
      return out;
    }
    this.collect(this.root, low, high, out);
    return out;
  }

  size(): number {
    this.cost += 1;
    return this.count;
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
          b: "recolor",
          note: `부모 ${parent.value} · 삼촌 ${uncle.value} 검게, 조부모 ${grand.value} 빨갛게`,
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
          b: "inner",
          note: `부모 ${parent.value}${을를(parent.value)} ${parentIsLeft ? "왼쪽" : "오른쪽"}으로 회전`,
        });
        at = parent;
        if (parentIsLeft) this.rotateLeft(at);
        else this.rotateRight(at);
      }
      const g = at.parent.parent;
      this.events.push({
        b: "outer",
        note: `${at.parent.value} 검게 · 조부모 ${g.value} 빨갛게, ${g.value}${을를(g.value)} ${parentIsLeft ? "오른쪽" : "왼쪽"}으로 회전`,
      });
      at.parent.color = "black";
      at.parent.parent.color = "red";
      if (parentIsLeft) this.rotateRight(at.parent.parent);
      else this.rotateLeft(at.parent.parent);
      node = at;
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
          b: "sibRed",
          note: `형제 ${sibling.value} 검게 · 부모 ${node.parent.value} 빨갛게, ${node.parent.value}${을를(node.parent.value)} ${isLeft ? "왼쪽" : "오른쪽"}으로 회전`,
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
          b: "bothBlack",
          note: `형제 ${sibling.value} 빨갛게, 물음이 ${node.parent.value}${으로(node.parent.value)}`,
        });
        sibling.color = "red";
        node = node.parent;
        continue;
      }
      if (far.color === "black") {
        this.events.push({
          b: "farBlack",
          note: `가까운 조카 ${near.value} 검게 · 형제 ${sibling.value} 빨갛게, ${sibling.value}${을를(sibling.value)} ${isLeft ? "오른쪽" : "왼쪽"}으로 회전`,
        });
        near.color = "black";
        sibling.color = "red";
        if (isLeft) this.rotateRight(sibling);
        else this.rotateLeft(sibling);
        sibling = isLeft ? node.parent.right : node.parent.left;
      }
      this.events.push({
        b: "farRed",
        note: `형제 ${sibling.value} 에 부모 색, 부모 ${node.parent.value}${을를(node.parent.value)} ${isLeft ? "왼쪽" : "오른쪽"}으로 회전하고 끝`,
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
    node.color = "black";
  }

  /* ── 모양을 읽는 도구. 비용을 세지 않는다. ── */

  tag(n: CNode): string {
    return `${n.value}${n.color === "red" ? "R" : "B"}`;
  }

  /** 괄호 표기 — `20B(10B 40R(30B 90B))`. 자식이 둘 다 빈 자리면 괄호를 안 쓴다. */
  shape(n: CNode = this.root): string {
    if (n === this.nil) return "·";
    if (n.left === this.nil && n.right === this.nil) return this.tag(n);
    return `${this.tag(n)}(${this.shape(n.left)} ${this.shape(n.right)})`;
  }

  /** 뿌리에서 가장 먼 노드까지 지나는 노드 수. 빈 트리는 0. */
  height(n: CNode = this.root): number {
    return n === this.nil
      ? 0
      : 1 + Math.max(this.height(n.left), this.height(n.right));
  }

  /** 뿌리에서 빈 자리까지의 길 전부 — 지나는 노드와 그중 검은 노드 수. */
  paths(): { nodes: CNode[]; blacks: number }[] {
    const out: { nodes: CNode[]; blacks: number }[] = [];
    const visit = (n: CNode, trail: CNode[]): void => {
      if (n === this.nil) {
        out.push({
          nodes: trail,
          blacks: trail.filter((x) => x.color === "black").length,
        });
        return;
      }
      visit(n.left, [...trail, n]);
      visit(n.right, [...trail, n]);
    };
    if (this.root !== this.nil) visit(this.root, []);
    return out;
  }

  /**
   * 깊이마다 한 줄, 가로 자리는 중위 순서. 칸마다 그 깊이에 노드가 없으면 `-` 를 둔다.
   * 모든 노드가 서로 다른 가로 자리를 받으므로 부모와 자식의 좌우가 그대로 보이고, 칸이 비지
   * 않아 열이 흔들리지 않는다.
   */
  levels(): string {
    const placed: { depth: number; rank: number; tag: string }[] = [];
    let rank = 0;
    const visit = (n: CNode, d: number): void => {
      if (n === this.nil) return;
      visit(n.left, d + 1);
      placed.push({ depth: d, rank: rank++, tag: this.tag(n) });
      visit(n.right, d + 1);
    };
    visit(this.root, 1);
    return grid(placed);
  }

  /** 시뮬 패널의 트리. 빈 자리는 `null` 이고, 자식이 둘 다 빈 자리면 `children` 을 안 둔다. */
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

/** 깊이 그림을 격자로 — 한 줄이 한 깊이, 한 칸이 중위 순서의 한 자리. 빈 칸은 `-`. */
function grid(placed: { depth: number; rank: number; tag: string }[]): string {
  if (placed.length === 0) return "(비었다)";
  const cell = Math.max(...placed.map((p) => p.tag.length)) + 2;
  const deepest = Math.max(...placed.map((p) => p.depth));
  const lines: string[] = [];
  for (let d = 1; d <= deepest; d++) {
    const cells = Array.from({ length: placed.length }, () => "-");
    for (const p of placed) if (p.depth === d) cells[p.rank] = p.tag;
    lines.push(
      `깊이 ${d}   ${cells.map((c) => c.padEnd(cell, " ")).join("")}`.replace(
        /\s+$/,
        "",
      ),
    );
  }
  return lines.join("\n");
}

/* ────────────────────────── 정본과 나란히 ────────────────────────── */

export interface Row {
  t: number;
  call: Call;
  out: unknown;
  events: Ev[];
  cost: number;
  shape: string;
  levels: string;
  tree: TreeData | null;
  count: number;
  height: number;
}

/** 사본과 정본을 나란히 실행한다. 반환값이나 비용 증가분이 하나라도 다르면 던진다. */
function agree(calls: Call[], mine = new RbCopy()): Row[] {
  const ref = new RedBlackTree<number>();
  const rows: Row[] = [];
  for (const [index, c] of calls.entries()) {
    const refBefore = ref.__cost;
    const mineBefore = mine.cost;
    const eventsBefore = mine.events.length;
    const refOut = apply(ref, c);
    const mineOut = apply(mine as unknown as RedBlackTreeContract<number>, c);
    const refCost = ref.__cost - refBefore;
    const mineCost = mine.cost - mineBefore;
    if (!same(refOut, mineOut) || refCost !== mineCost) {
      throw new Error(
        `사본이 정본과 갈라졌다 — ${index + 1} 번째 ${label(c)}: 정본 ${show(refOut)}·비용 ${refCost}, 사본 ${show(mineOut)}·비용 ${mineCost}`,
      );
    }
    rows.push({
      t: index + 1,
      call: c,
      out: mineOut,
      events: mine.events.slice(eventsBefore),
      cost: mineCost,
      shape: mine.shape(),
      levels: mine.levels(),
      tree: mine.treeData(),
      count: mine.count,
      height: mine.height(),
    });
  }
  return rows;
}

export const WALK_ROWS = agree(WALK);

const rowAt = (t: number): Row => {
  const r = WALK_ROWS.find((x) => x.t === t);
  if (r === undefined) throw new Error(`T${t} 가 없다`);
  return r;
};

const branches = (r: Row): string => r.events.map((e) => LABEL[e.b]).join(" ");

/* ────────────────────────── 경쟁 설계 — 같은 단위로 센다 ────────────────────────── */

type Counted = RedBlackTreeContract<number> & { __cost: number };

/**
 * 넣고 지울 때마다 트리 전체를 완전 균형으로 다시 세운다. 높이는 늘 가장 낮지만, 다시 세우는
 * 일이 노드 전부를 지나간다.
 *
 * 원소는 정렬 배열에 두고, 트리는 그 배열의 가운데를 뿌리로 삼는 완전 균형 트리로 **셈한다** —
 * 조회는 그 트리를 내려가는 걸음 수만큼, 갱신은 원소 수만큼 센다. 비용 단위는 정본과 같다.
 */
class RebuildTree implements Counted {
  #items: number[] = [];
  __cost = 0;
  #descend(item: number): { at: number; found: boolean } {
    let lo = 0;
    let hi = this.#items.length - 1;
    while (lo <= hi) {
      this.__cost += 1;
      const mid = (lo + hi) >> 1;
      const v = this.#items[mid] as number;
      if (v === item) return { at: mid, found: true };
      if (item < v) hi = mid - 1;
      else lo = mid + 1;
    }
    return { at: lo, found: false };
  }
  insert(item: number): void {
    const { at, found } = this.#descend(item);
    if (found) return;
    this.#items.splice(at, 0, item);
    this.__cost += this.#items.length;
  }
  delete(item: number): boolean {
    const { at, found } = this.#descend(item);
    if (!found) return false;
    this.#items.splice(at, 1);
    this.__cost += this.#items.length;
    return true;
  }
  has(item: number): boolean {
    return this.#descend(item).found;
  }
  min(): number | null {
    this.__cost += Math.max(1, Math.ceil(Math.log2(this.#items.length + 1)));
    return this.#items.length === 0 ? null : (this.#items[0] as number);
  }
  max(): number | null {
    this.__cost += Math.max(1, Math.ceil(Math.log2(this.#items.length + 1)));
    return this.#items.length === 0 ? null : (this.#items.at(-1) as number);
  }
  range(low: number, high: number): number[] {
    if (low > high) return [];
    const out = this.#items.filter((v) => v >= low && v <= high);
    this.__cost +=
      2 * Math.max(1, Math.ceil(Math.log2(this.#items.length + 1))) +
      out.length;
    return out;
  }
  size(): number {
    this.__cost += 1;
    return this.#items.length;
  }
  toArray(): number[] {
    this.__cost += this.#items.length;
    return [...this.#items];
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
  const names: OpName[] = [
    "insert",
    "insert",
    "delete",
    "has",
    "min",
    "max",
    "range",
    "size",
    "toArray",
  ];
  const ref = new RedBlackTree<number>();
  const other = make();
  for (let i = 0; i < 3000; i++) {
    const name2 = names[Math.floor(next() * names.length)] as OpName;
    const a = Math.floor(next() * 40);
    const c: Call = op(name2, a, a + Math.floor(next() * 8));
    const x = apply(ref, c);
    const y = apply(other, c);
    if (!same(x, y)) {
      throw new Error(
        `${name} 이 정본과 다른 답을 냈다 — ${i + 1} 번째 ${label(c)}: 정본 ${show(x)}, ${name} ${show(y)}`,
      );
    }
  }
}

const DESIGNS: [string, () => Counted][] = [
  ["정렬 배열", () => new SortedArraySet<number>()],
  ["균형 없는 트리", () => new UnbalancedSearchTree<number>()],
  ["조회가 고쳐 쓰는 트리", () => new SplayingSearchTree<number>()],
  ["정본", () => new RedBlackTree<number>()],
];

for (const [name, make] of DESIGNS) agreeAnswers(make, name);
agreeAnswers(() => new RebuildTree(), "매번 다시 세우는 트리");

/* ────────────────────────── 축3 판정 — 계약 스위트의 함수 그대로 ────────────────────────── */

type Scenario = (typeof redBlackTreeContract.scenarios)[number];

/** 시나리오를 번호가 아니라 이름으로 찾는다. 계약 파일의 순서가 바뀌어도 엉뚱한 것을 안 잡게. */
function scenario(covers: string, adversarial: boolean): Scenario {
  const hit = redBlackTreeContract.scenarios.filter(
    (s) => s.covers.join("·") === covers && s.adversarial === adversarial,
  );
  if (hit.length !== 1) {
    throw new Error(`시나리오 ${covers} 가 ${hit.length} 개다`);
  }
  return hit[0] as Scenario;
}

const ASC_INSERT = scenario("insert", true);
const RANDOM_INSERT = scenario("insert", false);
const SEQ_LOOKUP = scenario("has·min·max", true);
const ASC_DELETE = scenario("delete", true);

const SCENARIO_NAMES: [string, Scenario][] = [
  ["오름차순 넣기", ASC_INSERT],
  ["무작위 넣기", RANDOM_INSERT],
  ["순차 조회", SEQ_LOOKUP],
  ["오름차순 지우기", ASC_DELETE],
];

interface Judged {
  stats: number[];
  ratios: number[];
  ok: boolean;
}

function judge(make: () => Counted, s: Scenario): Judged {
  const v = judgeScenario(
    { kind: "self-reported", make },
    s,
    redBlackTreeContract.grade,
  );
  const stats = v.points.map((p) => p.stat);
  const ratios = stats.slice(1).map((x, i) => x / (stats[i] as number));
  return { stats, ratios, ok: v.ok };
}

/* ────────────────────────── 평범한 탐색 트리의 사본 ────────────────────────── */

interface PNode {
  value: number;
  left: PNode | null;
  right: PNode | null;
}

/** 균형을 잡지 않는 탐색 트리의 모양을 그리려고 둔 사본. 반환값과 비용을 fixture 와 맞댄다. */
class PlainBst {
  root: PNode | null = null;
  cost = 0;
  insert(item: number): void {
    if (this.root === null) {
      this.root = { value: item, left: null, right: null };
      this.cost += 1;
      return;
    }
    let at = this.root;
    for (;;) {
      this.cost += 1;
      if (item === at.value) return;
      const side = item < at.value ? "left" : "right";
      const next = at[side];
      if (next === null) {
        at[side] = { value: item, left: null, right: null };
        return;
      }
      at = next;
    }
  }
  height(n: PNode | null = this.root): number {
    return n === null
      ? 0
      : 1 + Math.max(this.height(n.left), this.height(n.right));
  }
  levels(): string {
    const placed: { depth: number; rank: number; tag: string }[] = [];
    let rank = 0;
    const visit = (n: PNode | null, d: number): void => {
      if (n === null) return;
      visit(n.left, d + 1);
      placed.push({ depth: d, rank: rank++, tag: String(n.value) });
      visit(n.right, d + 1);
    };
    visit(this.root, 1);
    return grid(placed);
  }
}

/** 사본 `PlainBst` 가 fixture 와 같은 비용을 내는지 확인하고, 넣기마다의 비용을 돌려준다. */
function plainAgrees(values: number[]): { bst: PlainBst; costs: number[] } {
  const fixture = new UnbalancedSearchTree<number>();
  const bst = new PlainBst();
  const costs: number[] = [];
  for (const v of values) {
    const a = fixture.__cost;
    const b = bst.cost;
    fixture.insert(v);
    bst.insert(v);
    if (fixture.__cost - a !== bst.cost - b) {
      throw new Error(
        `균형 없는 트리의 사본이 fixture 와 비용이 다르다 — insert(${v}): fixture ${fixture.__cost - a}, 사본 ${bst.cost - b}`,
      );
    }
    costs.push(bst.cost - b);
  }
  if (
    !same(
      fixture.toArray(),
      [...new Set(values)].sort((x, y) => x - y),
    )
  ) {
    throw new Error("균형 없는 트리 fixture 의 수열이 정렬되지 않았다");
  }
  return { bst, costs };
}

/* ────────────────────────── 변이 ────────────────────────── */

const REF_PATH = new URL("./_reference/redBlackTree.ts", import.meta.url)
  .pathname;

type RbModule = { RedBlackTree: typeof RedBlackTree };

/** 새 노드를 빨갛게가 아니라 검게 넣는 사본. */
const blackInsert = await loadMutant<RbModule>(REF_PATH, {
  swap: [/color: "red",/, 'color: "black",'],
});

/** 두 자식이 다 있는 자리를 지울 때, 이어받는 노드에 왼쪽 부분트리를 다시 거는 줄을 지운 사본. */
const dropLeft = await loadMutant<RbModule>(REF_PATH, {
  drop: /removed\.left = target\.left;/,
});

/**
 * 중화 실행인가. `loadMutant` 가 변이를 적용하지 않으면 정본 모듈을 그대로 돌려주므로, 클래스가
 * 정본과 **같은 객체**다. 그때는 「변이가 답을 바꿨다」 자기검사를 건너뛴다(`algo SPEC` §0).
 */
const neutral = (m: RbModule): boolean => m.RedBlackTree === RedBlackTree;

/* ────────────────────────── 블록 ────────────────────────── */

export const PROOFS: Record<string, () => string> = {
  /**
   * `deep.build` ② — 단순한 구현 셋과 정본을 계약 스위트의 네 시나리오에 넣는다. 칸은
   * 마지막 구간(4,096 → 16,384)의 `r` 과 판정이다.
   */
  "naive-rates": () => {
    const rows = DESIGNS.map(([name, make]) => [
      name,
      ...SCENARIO_NAMES.map(([, s]) => {
        const j = judge(make, s);
        return `${fixed2(j.ratios.at(-1) as number)} ${j.ok ? "통과" : "실패"}`;
      }),
    ]);
    return table(["설계", ...SCENARIO_NAMES.map(([name]) => name)], rows);
  },

  /** `deep.build` ② — 세 시나리오에서 단순한 구현 셋이 낸 호출 한 번의 최댓값. */
  "naive-stats": () => {
    const rows: string[][] = [];
    for (const [sname, s] of SCENARIO_NAMES.slice(0, 3)) {
      for (const [name, make] of DESIGNS) {
        const j = judge(make, s);
        rows.push([sname, name, ...j.stats.map(fixed2)]);
      }
    }
    return table(
      ["시나리오", "설계", "n = 1,024", "n = 4,096", "n = 16,384"],
      rows,
      [1],
    );
  },

  /** `deep.build` ③ — 1 부터 7 까지 오름차순으로 넣은 균형 없는 트리. */
  "chain-seven": () => {
    const { bst, costs } = plainAgrees([1, 2, 3, 4, 5, 6, 7]);
    return [
      bst.levels(),
      "",
      `넣기마다 지나간 노드   ${costs.join(" · ")}   합 ${costs.reduce((s, c) => s + c, 0)}   높이 ${bst.height()}`,
    ].join("\n");
  },

  /** `deep.build` ④ — 같은 일곱 값을 두 순서로 넣은 균형 없는 트리의 높이와 넣기 비용. */
  "two-orders": () => {
    const orders: [string, number[]][] = [
      ["오름차순 1 2 3 4 5 6 7", [1, 2, 3, 4, 5, 6, 7]],
      ["가운데부터 4 2 6 1 3 5 7", [4, 2, 6, 1, 3, 5, 7]],
    ];
    const rows = orders.map(([name, values]) => {
      const { bst, costs } = plainAgrees(values);
      return [
        name,
        costs.join(" · "),
        num(costs.reduce((s, c) => s + c, 0)),
        num(bst.height()),
      ];
    });
    return table(
      ["넣은 순서", "넣기마다 지나간 노드", "합", "높이"],
      rows,
      [1],
    );
  },

  /** `deep.build` ⑤ — 매번 다시 세우는 트리를 넣기 두 시나리오와 순차 조회에 넣는다. */
  "rebuild-rates": () => {
    const rows = SCENARIO_NAMES.slice(0, 3).map(([name, s]) => {
      const j = judge(() => new RebuildTree(), s);
      return [
        name,
        ...j.stats.map(fixed2),
        fixed2(j.ratios.at(-1) as number),
        j.ok ? "통과" : "실패",
      ];
    });
    return table(
      ["시나리오", "n = 1,024", "n = 4,096", "n = 16,384", "r", "판정"],
      rows,
    );
  },

  /** `deep.build` ⑤ — 오름차순 1~7 을 정본에 넣을 때 넣기마다 거친 갈래와 넣은 뒤 모양. */
  "ascending-fixes": () => {
    const rows = agree(ascending(7));
    return table(
      ["호출", "갈래", "한 일", "넣은 뒤 모양", "높이"],
      rows.map((r) => [
        label(r.call),
        branches(r),
        r.events.map((e) => e.note).join(" → "),
        r.shape,
        num(r.height),
      ]),
      [1, 2, 3],
    );
  },

  /** `deep.build` ⑤ — 오름차순 1~7 을 넣은 정본의 모양과 뿌리에서 빈 자리까지의 길 전부. */
  "black-paths": () => {
    const mine = new RbCopy();
    agree(ascending(7), mine);
    const rows = mine
      .paths()
      .map((p) => [
        p.nodes.map((n) => mine.tag(n)).join(" → "),
        num(p.nodes.length),
        num(p.blacks),
      ]);
    return [
      mine.levels(),
      "",
      table(["뿌리에서 빈 자리까지", "지나는 노드", "그중 검은 노드"], rows),
    ].join("\n");
  },

  /** `deep.build` ⑥ — 넣는 순서 둘 · 크기 넷에서 잰 높이. */
  heights: () => {
    const rows: string[][] = [];
    for (const n of [15, 255, 4095, 65535]) {
      const asc = new RbCopy();
      for (let i = 1; i <= n; i++) asc.insert(i);
      let seed = 97;
      const next = (): number => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
      const values = Array.from({ length: n }, (_, i) => i + 1);
      for (let i = values.length - 1; i > 0; i--) {
        const k = Math.floor(next() * (i + 1));
        [values[i], values[k]] = [values[k] as number, values[i] as number];
      }
      const rnd = new RbCopy();
      const plain = new PlainBst();
      for (const v of values) {
        rnd.insert(v);
        plain.insert(v);
      }
      rows.push([
        num(n),
        num(asc.height()),
        num(rnd.height()),
        fixed2(2 * Math.log2(n + 1)),
        num(n),
        num(plain.height()),
      ]);
    }
    return table(
      [
        "n",
        "정본 · 오름차순",
        "정본 · 무작위",
        "2·log₂(n+1)",
        "균형 없는 트리 · 오름차순",
        "균형 없는 트리 · 무작위",
      ],
      rows,
    );
  },

  /** `deep.walk.step` 2 — 내려가서 읽는 조회 셋. */
  "find-steps": () =>
    table(
      ["단계", "호출", "갈래", "지나간 노드", "돌려준 값"],
      [2, 10, 11, 17, 18].map((t) => {
        const r = rowAt(t);
        return [
          `T${r.t}`,
          label(r.call),
          branches(r),
          num(r.cost),
          show(r.out),
        ];
      }),
      [1, 2],
    ),

  /** `deep.walk.step` 3 — 고칠 것이 없는 넣기 둘과 이미 있는 값 넣기. */
  "insert-steps": () =>
    table(
      ["단계", "호출", "갈래", "지나간 노드", "넣은 뒤 모양"],
      [3, 4, 9].map((t) => {
        const r = rowAt(t);
        return [`T${r.t}`, label(r.call), branches(r), num(r.cost), r.shape];
      }),
      [1, 2, 4],
    ),

  /** `deep.walk.step` 4 — 넣은 뒤 고치기가 반복되는 넣기 넷. 반복 한 번이 한 줄이다. */
  "fix-steps": () => {
    const rows: string[][] = [];
    for (const t of [5, 6, 7, 8]) {
      const r = rowAt(t);
      const before = rowAt(t - 1).shape;
      for (const [k, e] of r.events.entries()) {
        rows.push([
          k === 0 ? `T${r.t}` : "",
          k === 0 ? label(r.call) : "",
          LABEL[e.b],
          e.note,
        ]);
      }
      rows.push(["", "", "", `${before}  →  ${r.shape}`]);
    }
    return table(
      ["단계", "호출", "갈래", "한 일 · 호출 전 모양 → 뒤 모양"],
      rows,
      [1, 2, 3],
    );
  },

  /** `deep.walk.pause` — 새 노드를 검게 넣었다. 넣기만 하는 입력. */
  "pause-black": () => {
    const rows: string[][] = [];
    let changed = false;
    for (const n of [7, 63, 1023]) {
      const a = new RedBlackTree<number>();
      const b = new blackInsert.RedBlackTree<number>();
      for (let i = 1; i <= n; i++) {
        a.insert(i);
        b.insert(i);
      }
      const costA = a.__cost;
      const costB = b.__cost;
      const hA = new RbCopy();
      const hB = new RbCopy("black");
      for (let i = 1; i <= n; i++) {
        hA.insert(i);
        hB.insert(i);
      }
      if (hA.cost !== costA)
        throw new Error("사본의 넣기 비용이 정본과 다르다");
      if (!neutral(blackInsert) && hB.cost !== costB) {
        throw new Error("검게 넣는 사본의 비용이 변이와 다르다");
      }
      const arrA = a.toArray();
      const arrB = b.toArray();
      const heightB = neutral(blackInsert) ? hA.height() : hB.height();
      if (costA !== costB || hA.height() !== heightB) changed = true;
      const verdict = (x: unknown, y: unknown): string =>
        same(x, y) ? "같다" : "어긋난다";
      rows.push(
        [
          `1~${num(n)} 오름차순`,
          "toArray() 길이",
          num(arrA.length),
          num(arrB.length),
          verdict(arrA, arrB),
        ],
        [
          "",
          "높이",
          num(hA.height()),
          num(heightB),
          verdict(hA.height(), heightB),
        ],
        [
          "",
          "넣기 전체가 지나간 노드",
          num(costA),
          num(costB),
          verdict(costA, costB),
        ],
      );
    }
    if (!neutral(blackInsert) && !changed) {
      throw new Error("변이가 어느 입력에서도 값을 바꾸지 못했다");
    }
    return table(
      ["입력", "무엇", "빨갛게 넣는 코드", "검게 넣는 코드", "판정"],
      rows,
      [1],
    );
  },

  /** `deep.walk.pause` — 같은 변이를 사본으로 펼친 1~7 의 모양. */
  "pause-black-shape": () => {
    const mine = new RbCopy("black");
    const mutant = new blackInsert.RedBlackTree<number>();
    for (let i = 1; i <= 7; i++) {
      mine.insert(i);
      mutant.insert(i);
    }
    if (!neutral(blackInsert) && mine.cost !== mutant.__cost) {
      throw new Error("검게 넣는 사본과 변이의 비용이 다르다");
    }
    return [
      mine.levels(),
      "",
      `넣은 뒤 모양 ${mine.shape()}   높이 ${mine.height()}`,
    ].join("\n");
  },

  /** `deep.walk.step` 5 — 지우기 셋의 앞 절반. 어느 자리를 비우는가. */
  "delete-steps": () =>
    table(
      ["단계", "호출", "갈래", "한 일", "돌려준 값", "지운 뒤 모양"],
      [14, 15, 16].map((t) => {
        const r = rowAt(t);
        const head = r.events.filter((e) =>
          ["missing", "oneChild", "twoChildren"].includes(e.b),
        );
        return [
          `T${r.t}`,
          label(r.call),
          head.map((e) => LABEL[e.b]).join(" "),
          head.map((e) => e.note).join(""),
          show(r.out),
          r.shape,
        ];
      }),
      [1, 2, 3, 5],
    ),

  /** `deep.walk.step` 6 — 지운 뒤 고치기. 반복 한 번이 한 줄이다. */
  "fixdelete-steps": () => {
    const rows: string[][] = [];
    for (const t of [14, 15]) {
      const r = rowAt(t);
      const fix = r.events.filter(
        (e) => !["missing", "oneChild", "twoChildren"].includes(e.b),
      );
      for (const [k, e] of fix.entries()) {
        rows.push([
          k === 0 ? `T${r.t}` : "",
          k === 0 ? label(r.call) : "",
          LABEL[e.b],
          e.note,
        ]);
      }
    }
    return table(["단계", "호출", "갈래", "한 일"], rows, [1, 2, 3]);
  },

  /** `deep.walk.step` 7 — 순서대로 모으는 조회 셋. */
  "order-steps": () =>
    table(
      ["단계", "호출", "갈래", "지나간 노드", "돌려준 값"],
      [12, 13, 19, 20].map((t) => {
        const r = rowAt(t);
        return [
          `T${r.t}`,
          label(r.call),
          branches(r),
          num(r.cost),
          show(r.out),
        ];
      }),
      [1, 2],
    ),

  /**
   * `deep.walk.step` 8 의 `<!--viz:walk-->` 아래 그림. **시뮬 프레임과 한 걸음씩 맞댄다** — 프레임이
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
        root: frame.root,
        entries: frame.entries,
      });
      if (want !== got) {
        throw new Error(
          `프레임 ${index + 1} 이 실행과 다르다\n  실행 ${want}\n  시뮬 ${got}`,
        );
      }
    }
    return table(
      ["단계", "호출 뒤 모양", "size", "높이"],
      WALK_ROWS.map((r) => [`T${r.t}`, r.shape, num(r.count), num(r.height)]),
      [1],
    );
  },

  /** `deep.walk.step` 8 — 전개 연산 열의 걸음 표. */
  "walk-trace": () =>
    table(
      ["단계", "호출", "갈래", "지나간 노드", "돌려준 값"],
      WALK_ROWS.map((r) => [
        `T${r.t}`,
        label(r.call),
        branches(r),
        num(r.cost),
        show(r.out),
      ]),
      [1, 2],
    ),

  /** `deep.walk.step` 8 — 분기 라벨이 어느 걸음에서 실행됐는가. */
  "walk-branches": () => {
    const names: [Branch, string][] = [
      ["dup", "이미 있는 값이다"],
      ["recolor", "삼촌이 빨갛다 — 색을 옮긴다"],
      ["inner", "삼촌이 검고 안쪽 자식이다 — 먼저 한 번 회전"],
      ["outer", "삼촌이 검다 — 조부모를 회전하고 끝"],
      ["missing", "지울 값이 없다"],
      ["oneChild", "자식이 하나 이하다"],
      ["twoChildren", "자식이 둘이다 — 오른쪽 최솟값이 잇는다"],
      ["sibRed", "형제가 빨갛다 — 먼저 한 번 회전"],
      ["bothBlack", "형제의 두 자식이 검다 — 물음을 위로"],
      ["farBlack", "먼 조카가 검다 — 형제를 먼저 회전"],
      ["farRed", "먼 조카가 빨갛다 — 부모를 회전하고 끝"],
      ["empty", "비었다"],
      ["reversed", "low > high"],
    ];
    return table(
      ["라벨", "무엇", "실행된 걸음"],
      names.map(([b, what]) => {
        const ts = WALK_ROWS.filter((r) => r.events.some((e) => e.b === b)).map(
          (r) => `T${r.t}`,
        );
        if (ts.length === 0) throw new Error(`갈래 ${b} 가 한 번도 안 나왔다`);
        return [LABEL[b], what, ts.join(" · ")];
      }),
      [1, 2],
    );
  },

  /**
   * `deep.math` ② ④ — 여러 트리에서 검은 높이 `b` 를 재어 `n ≥ 2^b − 1` 과 `h ≤ 2b` 를
   * 실행으로 확인한다. 어기면 던진다.
   */
  "math-check": () => {
    const cases: [string, number[]][] = [
      ["오름차순 1~7", Array.from({ length: 7 }, (_, i) => i + 1)],
      ["전개 T8", [10, 90, 20, 30, 40, 50]],
      ["오름차순 1~1,023", Array.from({ length: 1023 }, (_, i) => i + 1)],
      [
        "오름차순 1~1,048,575",
        Array.from({ length: 1048575 }, (_, i) => i + 1),
      ],
    ];
    const rows = cases.map(([name, values]) => {
      const t = new RbCopy();
      for (const v of values) t.insert(v);
      const blackCounts = new Set(t.paths().map((p) => p.blacks));
      if (blackCounts.size !== 1) {
        throw new Error(`${name}: 길마다 검은 노드 수가 다르다`);
      }
      const b = [...blackCounts][0] as number;
      const n = t.count;
      const h = t.height();
      if (n < 2 ** b - 1 || h > 2 * b) {
        throw new Error(`${name}: n=${n} b=${b} h=${h} 가 식을 어긴다`);
      }
      return [
        name,
        num(n),
        num(b),
        num(2 ** b - 1),
        num(h),
        num(2 * b),
        fixed2(2 * Math.log2(n + 1)),
      ];
    });
    return table(["트리", "n", "b", "2^b − 1", "h", "2b", "2·log₂(n+1)"], rows);
  },

  /**
   * `invariant` ② — 계약 스위트의 경계 입력 전부. 각 입력을 정본으로 실행하고, 호출마다 계약의
   * 불변식 검사 함수 넷을 그대로 부른다. 하나라도 어기면 던진다.
   */
  "invariant-edges": () => {
    const rows = redBlackTreeContract.edges.map((edge, i) => {
      const d = new RedBlackTree<number>();
      for (const step of edge.steps) {
        const args = Array.isArray(step.arg)
          ? (step.arg as number[])
          : step.arg === undefined
            ? []
            : [step.arg as number];
        apply(d, op(step.op as OpName, ...args));
        for (const inv of redBlackTreeContract.invariants) {
          const broke = inv.check(d);
          if (broke !== null) {
            throw new Error(
              `정본이 경계 입력 ${i + 1} 에서 ${inv.name} 을 어겼다: ${broke}`,
            );
          }
        }
      }
      return [
        `${i + 1}`,
        num(edge.steps.length),
        show(d.toArray()),
        num(d.size()),
        show(d.min()),
        show(d.max()),
      ];
    });
    return table(
      ["경계 입력", "호출 수", "끝난 뒤 toArray()", "size()", "min()", "max()"],
      rows,
      [2],
    );
  },

  /** `invariant` ③ — 두 자식이 다 있는 자리를 지울 때 왼쪽 부분트리를 다시 거는 줄을 지웠다. */
  "mutant-left": () => {
    const inputs: [string, Call[]][] = [
      ["1~7 을 넣고 7 을 지운다", [...ascending(7), op("delete", 7)]],
      ["1~7 을 넣고 4 를 지운다", [...ascending(7), op("delete", 4)]],
      ["전개 T1~T14", WALK.slice(1, 14)],
    ];
    const rows: string[][] = [];
    let changed = false;
    for (const [name, calls] of inputs) {
      const a = new RedBlackTree<number>();
      const b = new dropLeft.RedBlackTree<number>();
      for (const c of calls) {
        apply(a, c);
        apply(b, c);
      }
      for (const read of ["toArray", "size", "min"] as OpName[]) {
        const x = apply(a, op(read));
        const y = apply(b, op(read));
        if (!same(x, y)) changed = true;
        rows.push([
          name,
          `${read}()`,
          show(x),
          show(y),
          same(x, y) ? "같다" : "어긋난다",
        ]);
      }
    }
    if (!neutral(dropLeft) && !changed) {
      throw new Error("변이가 어느 호출에서도 값을 바꾸지 못했다");
    }
    return table(
      ["입력", "호출", "바른 코드", "그 줄을 지운 코드", "판정"],
      rows,
      [1, 2, 3],
    );
  },

  /**
   * `invariant` ③ — 같은 변이에 계약의 불변식 검사 함수 넷을 그대로 건다. 불변식 이름은 본문의
   * 순서 표기로 적는다 — 계약 파일의 이름에 「같다」가 들어 있어 판정 열로 읽힌다.
   */
  "mutant-left-invariants": () => {
    const labels = ["첫째", "둘째", "셋째", "넷째"];
    if (redBlackTreeContract.invariants.length !== labels.length) {
      throw new Error("계약의 불변식 수가 본문의 표기와 다르다");
    }
    const d = new dropLeft.RedBlackTree<number>();
    for (const c of [...ascending(7), op("delete", 4)]) apply(d, c);
    return table(
      ["불변식", "1~7 을 넣고 4 를 지운 뒤"],
      redBlackTreeContract.invariants.map((inv, i) => [
        labels[i] as string,
        inv.check(d) ?? "지킨다",
      ]),
      [1],
    );
  },

  /** `perf.derive` — 걸음 표의 비용 칸을 연산 묶음별로 모은다. */
  "cost-by-group": () => {
    const groups: [string, Call["op"][]][] = [
      ["생성자", ["new"]],
      ["내려가서 읽기 (has · min · max)", ["has", "min", "max"]],
      ["넣기", ["insert"]],
      ["지우기", ["delete"]],
      [
        "순서대로 모으기 (range · size · toArray)",
        ["range", "size", "toArray"],
      ],
    ];
    const rows = groups.map(([name, ops]) => {
      const mine = WALK_ROWS.filter((r) => ops.includes(r.call.op));
      return [
        name,
        num(mine.length),
        num(mine.reduce((s, r) => s + r.cost, 0)),
        mine.map((r) => `T${r.t}=${r.cost}`).join(" · "),
      ];
    });
    rows.push([
      "합",
      num(WALK_ROWS.length),
      num(WALK_ROWS.reduce((s, r) => s + r.cost, 0)),
      "",
    ]);
    return table(["묶음", "호출 수", "비용 합", "걸음별 비용"], rows, [3]);
  },

  /** `perf.bounds` — 계약 스위트 축3 이 정본에 대해 내는 값 전부. */
  "growth-rate": () => {
    const rows = redBlackTreeContract.scenarios.map((s) => {
      const j = judge(() => new RedBlackTree<number>(), s);
      return [
        s.covers.join("·"),
        s.adversarial ? "예" : "아니오",
        s.bound,
        ...j.stats.map(fixed2),
        j.ratios.map(fixed2).join(" · "),
        j.ok ? "통과" : "실패",
      ];
    });
    return table(
      [
        "시나리오가 부르는 연산",
        "적대적",
        "상한",
        "n = 1,024",
        "n = 4,096",
        "n = 16,384",
        "r",
        "판정",
      ],
      rows,
      [1, 2],
    );
  },

  /**
   * `perf.worst` — 설계마다 최악이 되는 입력이 다르다. `n = 4,096` 에서 호출 한 번의 최댓값을
   * 입력 넷 × 설계 넷으로 낸다.
   */
  "worst-inputs": () => {
    const n = 4096;
    const inputs: [string, (d: Counted) => number[]][] = [
      [
        "오름차순 넣기",
        (d) =>
          Array.from({ length: n }, (_, i) => costOf(d, () => d.insert(i))),
      ],
      [
        "무작위 넣기",
        (d) => {
          let seed = 7;
          const next = (): number => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed / 2147483648;
          };
          return Array.from({ length: n }, () =>
            costOf(d, () => d.insert(Math.floor(next() * n * 4))),
          );
        },
      ],
      [
        "오름차순으로 채운 뒤 순차 조회",
        (d) => {
          for (let i = 0; i < n; i++) d.insert(i);
          return Array.from({ length: n }, (_, i) => costOf(d, () => d.has(i)));
        },
      ],
      [
        "오름차순으로 채운 뒤 오름차순 지우기",
        (d) => {
          for (let i = 0; i < n; i++) d.insert(i);
          return Array.from({ length: n }, (_, i) =>
            costOf(d, () => d.delete(i)),
          );
        },
      ],
    ];
    const rows: string[][] = [];
    for (const [iname, run] of inputs) {
      for (const [dname, make] of DESIGNS) {
        const costs = run(make());
        rows.push([
          iname,
          dname,
          fixed2(costs.reduce((s, c) => s + c, 0) / costs.length),
          num(Math.max(...costs)),
        ]);
      }
    }
    return table(
      ["입력 (n = 4,096)", "설계", "호출당 평균", "호출 한 번 최대"],
      rows,
      [1],
    );
  },

  /** `selfcheck` 답 — T20 뒤에 35 를 넣으면. */
  "check-insert35": () => {
    const rows = agree([...WALK, op("insert", 35)]);
    const r = rows.at(-1) as Row;
    const before = rows.at(-2) as Row;
    return [
      `${label(r.call)}   갈래 ${branches(r)}   지나간 노드 ${r.cost}`,
      ...r.events.map((e) => `  ${LABEL[e.b]} ${e.note}`),
      `호출 전  ${before.shape}`,
      `호출 뒤  ${r.shape}`,
    ].join("\n");
  },
};

/* ────────────────────────── 보조 ────────────────────────── */

/** 시뮬 프레임이 담아야 하는 값. `walk-viz` 가 이것과 프레임을 맞댄다. */
export function frameOf(r: Row): {
  title: string;
  root: TreeData | null;
  entries: { label: string; value: string | number }[];
} {
  return {
    title: `T${r.t} ${label(r.call)}`,
    root: r.tree,
    entries: [
      { label: "갈래", value: branches(r) === "" ? "—" : branches(r) },
      { label: "지나간 노드", value: r.cost },
      { label: "돌려준 값", value: show(r.out) },
      { label: "size", value: r.count },
      { label: "높이", value: r.height },
    ],
  };
}

function costOf(d: Counted, fn: () => unknown): number {
  const before = d.__cost;
  fn();
  return d.__cost - before;
}
