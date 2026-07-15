// E3 자기검증용 스크래치. 가이드 본문 코드를 그대로 옮겨 실행 결과를 실측한다.

export class ListNode<T> {
  value: T;
  prev: ListNode<T> | null = null;
  next: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export class DoublyLinkedList<T> {
  private head: ListNode<T> | null = null;
  private tail: ListNode<T> | null = null;
  private _size = 0;

  prepend(value: T): ListNode<T> {
    const node = new ListNode(value);
    if (this.head === null) {
      this.head = this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this._size++;
    return node;
  }

  append(value: T): ListNode<T> {
    const node = new ListNode(value);
    if (this.tail === null) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
    this._size++;
    return node;
  }

  insertAfter(refNode: ListNode<T>, value: T): ListNode<T> {
    const node = new ListNode(value);
    node.prev = refNode;
    node.next = refNode.next;
    if (refNode.next !== null) {
      refNode.next.prev = node;
    }
    refNode.next = node;
    if (refNode === this.tail) {
      this.tail = node;
    }
    this._size++;
    return node;
  }

  remove(node: ListNode<T>): void {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next !== null) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
    node.prev = null;
    node.next = null;
    this._size--;
  }

  toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur !== null) {
      result.push(cur.value);
      cur = cur.next;
    }
    return result;
  }

  size(): number {
    return this._size;
  }
}

// ── 버그 버전: remove()에서 tail 갱신을 빠뜨렸을 때 ───────────────────────────
// (D6 함정 포인팅 실측용 — 가이드 코드에는 포함하지 않는다)
class ListNodeB<T> {
  value: T;
  prev: ListNodeB<T> | null = null;
  next: ListNodeB<T> | null = null;
  constructor(value: T) {
    this.value = value;
  }
}
class BuggyDoublyLinkedList<T> {
  head: ListNodeB<T> | null = null;
  tail: ListNodeB<T> | null = null;
  private _size = 0;

  append(value: T): ListNodeB<T> {
    const node = new ListNodeB(value);
    if (this.tail === null) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      node.prev = this.tail;
      this.tail = node;
    }
    this._size++;
    return node;
  }

  // tail 갱신 줄(else tail = node.prev)을 의도적으로 누락
  removeBuggy(node: ListNodeB<T>): void {
    if (node.prev !== null) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }
    if (node.next !== null) {
      node.next.prev = node.prev;
    }
    // 여기 else 분기(tail = node.prev)가 빠졌다
    node.prev = null;
    node.next = null;
    this._size--;
  }

  toArray(): T[] {
    const result: T[] = [];
    let cur = this.head;
    while (cur !== null) {
      result.push(cur.value);
      cur = cur.next;
    }
    return result;
  }

  size(): number {
    return this._size;
  }
}

console.log("=== 정상 시나리오 (실행 시각화 steps 검증) ===");
const list = new DoublyLinkedList<string>();
console.log("초기: toArray=", list.toArray(), "size=", list.size());

const codes = (arr: string[]) => arr.map((c) => c.charCodeAt(0));

const a = list.append("A");
console.log("append('A'): array(codes)=", codes(list.toArray()), "size=", list.size());

const b = list.append("B");
console.log("append('B'): array(codes)=", codes(list.toArray()), "size=", list.size());

const c = list.append("C");
console.log("append('C'): array(codes)=", codes(list.toArray()), "size=", list.size());

const d = list.insertAfter(a, "D");
console.log("insertAfter(A,'D'): array(codes)=", codes(list.toArray()), "size=", list.size());

list.remove(b);
console.log("remove(B): array(codes)=", codes(list.toArray()), "size=", list.size());

list.prepend("Z");
console.log("prepend('Z'): array(codes)=", codes(list.toArray()), "size=", list.size());

console.log();
console.log("=== 엣지 케이스 ===");
const empty = new DoublyLinkedList<number>();
console.log("빈 리스트 toArray:", empty.toArray(), "size:", empty.size());

const single = new DoublyLinkedList<number>();
const only = single.append(42);
console.log("단일 노드 append 후:", single.toArray(), "size:", single.size());
single.remove(only);
console.log("단일 노드 remove 후:", single.toArray(), "size:", single.size());

const headRemove = new DoublyLinkedList<string>();
const h1 = headRemove.append("X");
headRemove.append("Y");
headRemove.append("Z");
headRemove.remove(h1); // head 제거
console.log("head(X) 제거 후:", headRemove.toArray(), "size:", headRemove.size());

const tailRemove = new DoublyLinkedList<string>();
tailRemove.append("P");
tailRemove.append("Q");
const t3 = tailRemove.append("R");
tailRemove.remove(t3); // tail 제거
console.log("tail(R) 제거 후:", tailRemove.toArray(), "size:", tailRemove.size());
tailRemove.append("S"); // tail이 제대로 갱신됐는지 확인
console.log("정상 remove 후 append('S'):", tailRemove.toArray(), "size:", tailRemove.size());

console.log();
console.log("=== 무작위 교차검증 (배열 시뮬레이션과 대조) ===");
function randomTrial(seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const dll = new DoublyLinkedList<number>();
  const ref: number[] = [];
  const nodes: ListNode<number>[] = [];
  for (let i = 0; i < 30; i++) {
    const op = rand();
    if (ref.length === 0 || op < 0.35) {
      const v = Math.floor(rand() * 1000);
      if (rand() < 0.5) {
        dll.prepend(v);
        ref.unshift(v);
      } else {
        dll.append(v);
        ref.push(v);
      }
      nodes.push(...[]); // nodes 배열은 head->tail 순서로 별도 추적하지 않고 매번 toArray 기준 재검증
    } else if (op < 0.7 && ref.length > 0) {
      // insertAfter: DLL 순서상 임의 노드 뒤에 삽입 (index 방식으로 노드 추적)
      const idx = Math.floor(rand() * ref.length);
      const v = Math.floor(rand() * 1000);
      // idx번째 노드를 찾기 위해 head부터 순회
      let cur: ListNode<number> | null = (dll as any).head;
      for (let k = 0; k < idx && cur; k++) cur = cur.next;
      if (cur) {
        dll.insertAfter(cur, v);
        ref.splice(idx + 1, 0, v);
      }
    } else if (ref.length > 0) {
      const idx = Math.floor(rand() * ref.length);
      let cur: ListNode<number> | null = (dll as any).head;
      for (let k = 0; k < idx && cur; k++) cur = cur.next;
      if (cur) {
        dll.remove(cur);
        ref.splice(idx, 1);
      }
    }
    const actual = dll.toArray();
    if (actual.length !== ref.length || !actual.every((x, i) => x === ref[i])) {
      console.log(`시드 ${seed} 스텝 ${i}에서 불일치! actual=`, actual, "expected=", ref);
      return false;
    }
  }
  return true;
}
let allPass = true;
for (const seed of [1, 7, 42, 123, 999]) {
  const ok = randomTrial(seed);
  console.log(`시드 ${seed}:`, ok ? "일치" : "불일치");
  if (!ok) allPass = false;
}
console.log("무작위 교차검증 전체:", allPass ? "통과" : "실패");

console.log();
console.log("=== D6 함정: remove()에서 tail 갱신 누락 시 ===");
const buggy = new BuggyDoublyLinkedList<string>();
buggy.append("A");
const bB = buggy.append("B");
console.log("append('A'), append('B') 후:", buggy.toArray(), "size:", buggy.size());
buggy.removeBuggy(bB); // B가 tail인데 tail 갱신을 빼먹음
console.log("removeBuggy(B) 후 (tail 갱신 누락):", buggy.toArray(), "size:", buggy.size());
buggy.append("C"); // 갱신 안 된 tail(=B, 이미 고립됨)에 이어붙임
console.log("append('C') 후: toArray=", buggy.toArray(), " size=", buggy.size());
console.log("→ size는", buggy.size(), "인데 toArray() 길이는", buggy.toArray().length, "— C가 유실됨(불일치)");
