// E3 자기검증용 스크래치 — stack-guide.new.mdx 본문 코드 그대로 추출

class NaiveStack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.unshift(item); // 앞에 넣으려면 기존 원소를 전부 한 칸씩 밀어야 한다 — O(n)
  }

  pop(): T | undefined {
    return this.items.shift(); // 앞에서 빼려면 나머지를 전부 한 칸씩 당겨야 한다 — O(n)
  }
}

class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

console.log("=== 대표 (실행 시각화 재현) ===");
const s1 = new Stack<number>();
console.log("초기 isEmpty:", s1.isEmpty(), "size:", s1.size());
s1.push(10);
console.log("push(10) 후 size:", s1.size());
s1.push(20);
console.log("push(20) 후 size:", s1.size());
s1.push(30);
console.log("push(30) 후 size:", s1.size());
const popped = s1.pop();
console.log("pop() =>", popped, "size:", s1.size());
const peeked = s1.peek();
console.log("peek() =>", peeked, "size:", s1.size());

console.log("=== D6 함정 검증 (top을 index 0로 착각하는 경우) ===");
const s2 = new Stack<string>();
s2.push("A");
s2.push("B");
s2.push("C");
console.log("pop() 1회차 =>", s2.pop(), "(index0 착각 시 예상 오답: A)");
console.log("pop() 2회차 =>", s2.pop(), "(index0 착각 시 예상 오답: B)");

console.log("=== 엣지 케이스 ===");
const s3 = new Stack<number>();
console.log("빈 스택 pop():", s3.pop());
console.log("빈 스택 peek():", s3.peek());
s3.push(99);
s3.pop();
console.log("단일 push 후 pop 후 isEmpty:", s3.isEmpty());

console.log("=== 무작위 교차검증 (1000회, 배열 reference와 비교) ===");
function randomCheck(seed: number): boolean {
  let x = seed;
  const rand = () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
  const stack = new Stack<number>();
  const reference: number[] = [];
  let ok = true;
  for (let i = 0; i < 1000; i++) {
    if (rand() < 0.6 || reference.length === 0) {
      const v = Math.floor(rand() * 1000);
      stack.push(v);
      reference.push(v);
    } else {
      const expected = reference.pop();
      const actual = stack.pop();
      if (expected !== actual) ok = false;
    }
    if (stack.size() !== reference.length) ok = false;
    if (stack.peek() !== reference[reference.length - 1]) ok = false;
    if (stack.isEmpty() !== (reference.length === 0)) ok = false;
  }
  return ok;
}
console.log("결과:", randomCheck(12345) ? "PASS" : "FAIL");
