/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 두 설계를 걸고 **결정론적 계수**만 센다. 벽시계·처리량은 실행마다 달라
 * "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/data-structures/linear/deque/deque-guide.alt.ts
 *
 * **입력은 계약 스위트의 큐 패턴 시나리오와 같은 모양이다** — 뒤로 `N` 번 넣고 앞으로 `N` 번
 * 뺀다. 전개가 쓰는 스물세 번의 호출은 칸을 한 번만 늘려서 두 설계가 갈리는 축(한 호출이 쓰는
 * 칸의 최댓값 · 잡고 있는 칸 수)이 8 과 4 처럼 붙어 나오고, 규모에 따라 어떻게 벌어지는지가
 * 안 보인다(L20 — 입력을 바꾼 사유를 본문에도 적는다).
 *
 * 비용 단위는 정본 `__cost` 와 같다 — **칸 하나를 지나갈 때마다 1**. 연결 리스트에서 칸은 노드의
 * 필드 하나(값 · 앞 링크 · 뒤 링크)다.
 */
import { Deque } from "./_reference/deque.ts";

/** 대조에 쓰는 원소 수. 계약 스위트 축3 의 첫 크기와 같다. 한 번 정하면 바꾸지 않는다. */
export const N = 1024;

interface Counts {
  [metric: string]: number;
  "한 호출이 지나간 칸의 최댓값": number;
  "전체 지나간 칸": number;
  "가장 많이 잡고 있던 칸": number;
  "다 비운 뒤 잡고 있는 칸": number;
}

/* ────────────────────── 이 가이드의 링 버퍼(정본) ────────────────────── */

/**
 * 정본을 그대로 부른다. 칸 수는 정본이 감추므로 **비용이 1 을 넘은 넣기 횟수**로 센다 — 넣기
 * 한 번의 비용이 1 을 넘는 것은 칸을 두 배로 늘린 호출뿐이다. 정본은 칸을 줄이지 않는다.
 */
function ring(): Counts {
  const d = new Deque<number>();
  let max = 0;
  let grows = 0;
  for (let i = 0; i < N; i++) {
    const before = d.__cost;
    d.pushBack(i);
    const call = d.__cost - before;
    if (call > 1) grows += 1;
    if (call > max) max = call;
  }
  for (let i = 0; i < N; i++) {
    const before = d.__cost;
    d.popFront();
    max = Math.max(max, d.__cost - before);
  }
  const slots = 8 * 2 ** grows;
  return {
    "한 호출이 지나간 칸의 최댓값": max,
    "전체 지나간 칸": d.__cost,
    "가장 많이 잡고 있던 칸": slots,
    "다 비운 뒤 잡고 있는 칸": slots,
  };
}

/* ────────────────────── 이중 연결 리스트 ────────────────────── */

interface ListNode {
  value: number;
  prev: ListNode | null;
  next: ListNode | null;
}

/**
 * 원소마다 노드 하나. 칸을 미리 잡지 않으므로 옮기는 일이 없고, 대신 원소마다 필드 셋을 잡는다.
 * 계약의 여덟 연산 중 이 대조가 부르는 둘만 둔다.
 */
class LinkedDeque {
  head: ListNode | null = null;
  tail: ListNode | null = null;
  nodes = 0;
  __cost = 0;

  pushBack(value: number): void {
    const node: ListNode = { value, prev: this.tail, next: null };
    this.__cost += 3;
    if (this.tail === null) {
      this.head = node;
    } else {
      this.__cost += 1;
      this.tail.next = node;
    }
    this.tail = node;
    this.nodes += 1;
  }

  popFront(): number | null {
    const node = this.head;
    if (node === null) return null;
    this.__cost += 2;
    const next = node.next;
    if (next === null) {
      this.tail = null;
    } else {
      this.__cost += 1;
      next.prev = null;
    }
    this.head = next;
    this.nodes -= 1;
    return node.value;
  }
}

function linked(): Counts {
  const d = new LinkedDeque();
  const ref = new Deque<number>();
  let max = 0;
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const before = d.__cost;
    d.pushBack(i);
    ref.pushBack(i);
    max = Math.max(max, d.__cost - before);
    peak = Math.max(peak, d.nodes);
  }
  for (let i = 0; i < N; i++) {
    const before = d.__cost;
    const got = d.popFront();
    const want = ref.popFront();
    if (got !== want) {
      throw new Error(
        `연결 리스트가 정본과 다른 값을 냈다 — ${i + 1} 번째 popFront: ${got} ≠ ${want}`,
      );
    }
    max = Math.max(max, d.__cost - before);
  }
  return {
    "한 호출이 지나간 칸의 최댓값": max,
    "전체 지나간 칸": d.__cost,
    "가장 많이 잡고 있던 칸": 3 * peak,
    "다 비운 뒤 잡고 있는 칸": 3 * d.nodes,
  };
}

export const cases = {
  "링 버퍼": ring,
  "이중 연결 리스트": linked,
};
