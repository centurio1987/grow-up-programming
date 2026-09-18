/**
 * `purpose.alt` 가 인용하는 수치의 출처 — L13.
 *
 * **같은 입력**에 세 설계를 걸고 **결정론적 계수**만 센다. 벽시계·힙 측정은 실행마다, 엔진마다
 * 달라 "본문의 수치가 실측과 일치하는가"(P10)를 정의할 수 없다.
 *
 *   bun run tools/bench-alt.ts src/data-structures/linear/xorLinkedList/xorLinkedList-guide.alt.ts
 *
 * **입력은 계약 스위트의 붙이기 시나리오와 같은 모양이다** — 뒤로 `N` 번 붙인다. 전개가 쓰는
 * 세 번의 붙이기는 배열이 칸을 한 번도 늘리지 않아 두 설계가 갈리는 축(붙이기 한 번이 쓰는
 * 슬롯의 최댓값)이 1 과 6 처럼 붙어 나오고, 규모에 따라 어떻게 벌어지는지가 안 보인다
 * (L20 — 입력을 바꾼 사유를 본문에도 적는다).
 *
 * **단위는 슬롯이다 — 원소를 담으려고 잡는 값 자리 하나(수 하나 또는 참조 하나).** 정본의
 * `__cost` 는 노드를 찾은 횟수라 공간을 세지 않으므로, 여기서는 설계마다 **원소 하나에 딸린
 * 자리**를 소스에서 세어 둔 수로 계산한다. 수열 전체가 하나씩 드는 `head`·`tail`·`count` 같은
 * 자리는 세 설계에 다 있고 원소 수와 무관해 넣지 않는다. 객체 머리·해시 표의 여유 칸은 언어가
 * 노출하지 않으므로 세지 않는다 — 그래서 여기 수는 **하한**이다.
 */
import { XorLinkedList } from "./_reference/xorLinkedList.ts";

/** 대조에 쓰는 원소 수. 계약 스위트 축3 의 첫 크기와 같다. 한 번 정하면 바꾸지 않는다. */
export const N = 1024;

interface Counts {
  [metric: string]: number;
  "append 한 번이 쓴 슬롯의 최댓값": number;
  "append 전체가 쓴 슬롯": number;
  "잡고 있는 슬롯": number;
}

/** 붙인 값을 두 방향으로 읽어 정본과 같은지 확인한다. 답이 다르면 비용을 견줄 의미가 없다. */
function sameAsReference(
  name: string,
  forward: number[],
  backward: number[],
): void {
  const ref = new XorLinkedList();
  for (let i = 0; i < N; i++) ref.append(i);
  const a = JSON.stringify([ref.toArray(), ref.toArrayReverse()]);
  const b = JSON.stringify([forward, backward]);
  if (a !== b) throw new Error(`${name} 이 정본과 다른 수열을 냈다`);
}

/* ────────────────────── 이 가이드의 XOR 연결 리스트(정본) ────────────────────── */

/**
 * 정본을 그대로 부른다. 노드 하나에 딸린 슬롯은 **5** 다 — 노드 객체 `{ id, value, xorId }` 의
 * 필드 셋과, 그 노드를 id 로 찾게 하는 `Map` 항목의 키·값 둘. 붙이기 한 번은 그 다섯을 쓰고,
 * 옛 꼬리가 있으면 그 `xorId` 하나를 더 쓴다.
 *
 * 옛 꼬리를 고쳤는지는 정본이 감추므로 **`__cost` 증가분**으로 안다 — 정본은 새 노드를 만들 때
 * 1, 옛 꼬리를 찾을 때 1 을 센다. 증가분이 2 인 호출이 옛 꼬리를 고친 호출이다.
 */
function xor(): Counts {
  const d = new XorLinkedList();
  let max = 0;
  let total = 0;
  for (let i = 0; i < N; i++) {
    const before = d.__cost;
    d.append(i);
    const touchedTail = d.__cost - before === 2 ? 1 : 0;
    const written = 5 + touchedTail;
    total += written;
    max = Math.max(max, written);
  }
  sameAsReference("XOR 연결 리스트", d.toArray(), d.toArrayReverse());
  return {
    "append 한 번이 쓴 슬롯의 최댓값": max,
    "append 전체가 쓴 슬롯": total,
    "잡고 있는 슬롯": 5 * d.toArray().length,
  };
}

/* ────────────────────── 배열 하나 ────────────────────── */

/**
 * 칸 8 개로 시작해 가득 차면 두 배로 늘리는 배열. 원소 하나에 딸린 슬롯은 **1** 이지만, 늘린
 * 뒤에는 아직 안 쓴 칸도 잡고 있다. 붙이기 한 번은 칸 하나를 쓰고, 가득 찬 순간이면 옮긴 원소
 * 수만큼 더 쓴다.
 */
function array(): Counts {
  let slots: number[] = new Array(8);
  let count = 0;
  let max = 0;
  let total = 0;
  for (let i = 0; i < N; i++) {
    let written = 1;
    if (count === slots.length) {
      const grown: number[] = new Array(slots.length * 2);
      for (let k = 0; k < count; k++) grown[k] = slots[k] as number;
      written += count;
      slots = grown;
    }
    slots[count] = i;
    count += 1;
    total += written;
    max = Math.max(max, written);
  }
  const forward = slots.slice(0, count);
  sameAsReference("배열 하나", forward, [...forward].reverse());
  return {
    "append 한 번이 쓴 슬롯의 최댓값": max,
    "append 전체가 쓴 슬롯": total,
    "잡고 있는 슬롯": slots.length,
  };
}

/* ────────────────────── 이중 연결 리스트 ────────────────────── */

interface DNode {
  value: number;
  prev: DNode | null;
  next: DNode | null;
}

/**
 * 노드가 앞 이웃과 뒤 이웃을 따로 드는 리스트. 원소 하나에 딸린 슬롯은 **3** 이다 — `value` ·
 * `prev` · `next`. 노드를 참조로 바로 가리키므로 id 표가 없다. 붙이기 한 번은 그 셋을 쓰고,
 * 옛 꼬리가 있으면 그 `next` 하나를 더 쓴다.
 */
function doubly(): Counts {
  let head: DNode | null = null;
  let tail: DNode | null = null;
  let count = 0;
  let max = 0;
  let total = 0;
  for (let i = 0; i < N; i++) {
    const node: DNode = { value: i, prev: tail, next: null };
    let written = 3;
    if (tail === null) {
      head = node;
    } else {
      tail.next = node;
      written += 1;
    }
    tail = node;
    count += 1;
    total += written;
    max = Math.max(max, written);
  }
  const forward: number[] = [];
  for (let at = head; at !== null; at = at.next) forward.push(at.value);
  const backward: number[] = [];
  for (let at = tail; at !== null; at = at.prev) backward.push(at.value);
  sameAsReference("이중 연결 리스트", forward, backward);
  return {
    "append 한 번이 쓴 슬롯의 최댓값": max,
    "append 전체가 쓴 슬롯": total,
    "잡고 있는 슬롯": 3 * count,
  };
}

export const cases = {
  "XOR 연결 리스트": xor,
  "배열 하나": array,
  "이중 연결 리스트": doubly,
};
