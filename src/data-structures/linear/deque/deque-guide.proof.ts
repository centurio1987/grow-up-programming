/** 새 원고의 세 전체 코드와 실행 시각화를 실제 연산 결과와 대조한다. */
import { Deque } from "./_reference/deque.ts";
import type { DequeContract } from "./deque.contract.ts";
import { walk } from "./deque-guide.sim.ts";

const md = await Bun.file(new URL("./deque-guide.md", import.meta.url)).text();
const implementations = [...md.matchAll(/```ts[^\n]*\n([\s\S]*?)```/g)]
  .map((match) => match[1] ?? "")
  .filter((code) => /export class (StackDeque|Deque|LinkedDeque)/.test(code));
if (implementations.length !== 3)
  throw new Error("전체 구현 코드 세 개가 필요합니다.");
const js = new Bun.Transpiler({ loader: "ts" }).transformSync(
  implementations.join("\n"),
);
const examples = new Function(
  js.replaceAll("export class", "class") +
    "\nreturn { StackDeque, Deque, LinkedDeque };",
)() as Record<"StackDeque" | "Deque" | "LinkedDeque", Constructor>;
type Constructor = new () => DequeContract<unknown>;
const constructors: Constructor[] = [
  examples.StackDeque,
  examples.Deque,
  examples.LinkedDeque,
  Deque,
];
function equal(got: unknown, want: unknown): void {
  if (!Object.is(got, want))
    throw new Error(`결과 불일치: ${String(got)} / ${String(want)}`);
}
function check(d: DequeContract<unknown>, model: unknown[]): void {
  equal(d.peekFront(), model.length ? model[0] : null);
  equal(d.peekBack(), model.length ? model.at(-1) : null);
}

export const PROOFS: Record<string, () => string> = {
  implementations: () => {
    for (const Ctor of constructors) {
      const d = new Ctor();
      const model: unknown[] = [];
      let seed = 731;
      for (let i = 0; i < 20000; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const op = seed % 7;
        const value = seed % 101;
        if (op === 0 || op === 4) {
          d.pushFront(value);
          model.unshift(value);
        }
        if (op === 1 || op === 5) {
          d.pushBack(value);
          model.push(value);
        }
        if (op === 2 || op === 6)
          equal(d.popFront(), model.length ? model.shift() : null);
        if (op === 3) equal(d.popBack(), model.length ? model.pop() : null);
        check(d, model);
      }
      while (model.length) equal(d.popFront(), model.shift());
      check(d, model);
      equal(d.popFront(), null);
      equal(d.popBack(), null);
      for (const front of [true, false]) {
        for (let i = 0; i < 2049; i++) {
          if (front) {
            d.pushFront(i);
            model.unshift(i);
          } else {
            d.pushBack(i);
            model.push(i);
          }
        }
        let fromFront = true;
        while (model.length) {
          equal(
            fromFront ? d.popFront() : d.popBack(),
            fromFront ? model.shift() : model.pop(),
          );
          check(d, model);
          fromFront = !fromFront;
        }
      }
      const object = {};
      const values = [undefined, null, false, 0, "", object, object];
      for (const value of values) {
        d.pushBack(value);
        model.push(value);
      }
      for (const value of values) {
        equal(d.popFront(), value);
        model.shift();
        check(d, model);
      }
      d.pushFront(7);
      equal(d.popBack(), 7);
      d.pushBack(8);
      equal(d.popFront(), 8);
      check(d, model);
    }
    return "세 구현과 참조 구현: 각각 무작위 연산 20,000회 일치\n양쪽 교대 삭제·빈 덱 재사용·특수값·객체 동일성: 모두 일치";
  },
  simulation: () => {
    const d = new Deque<number>();
    const model: number[] = [];
    let last: unknown;
    for (const frame of walk.steps) {
      const match = /^T\d+ (\w+)\((-?\d+)?\)$/.exec(frame.title);
      if (!match) throw new Error(`호출을 읽을 수 없음: ${frame.title}`);
      const op = match[1] as keyof DequeContract<number>;
      const arg = Number(match[2]);
      if (op === "pushFront") {
        d.pushFront(arg);
        model.unshift(arg);
      } else if (op === "pushBack") {
        d.pushBack(arg);
        model.push(arg);
      } else if (op === "popFront") {
        last = d.popFront();
        equal(last, model.length ? model.shift() : null);
      } else if (op === "popBack") {
        last = d.popBack();
        equal(last, model.length ? model.pop() : null);
      } else if (op === "peekFront" || op === "peekBack") {
        last = d[op]();
      } else {
        // `KAN-040` `S3` 이 계약에서 뺀 행(`isEmpty` · `size`)의 프레임이다. 시뮬은 물려받은
        // 걸음을 그대로 들고 있고, 이 걸음에서 볼 것은 「상태가 안 바뀐다」뿐이라 아래
        // `check` 와 프레임 대조가 그 몫을 그대로 한다.
        last = undefined;
      }
      check(d, model);
      const entries = frame.entries;
      equal(entries.find((e) => e.label === "count")?.value, model.length);
      equal(
        entries.find((e) => e.label === "앞 끝부터")?.value,
        `[${model.join(" ")}]`,
      );
      const head = frame.pointers.head;
      const active = new Set<number>();
      for (let i = 0; i < model.length; i++) {
        const at = (head + i) % frame.array.length;
        equal(frame.array[at], model[i]);
        active.add(at);
      }
      for (let i = 0; i < frame.array.length; i++)
        if (!active.has(i)) equal(frame.array[i], "·");
    }
    equal(String(last), walk.result);
    return `시뮬레이션 ${walk.steps.length}단계: 반환값·원소 순서·배열 배치 일치\n마지막 반환값: ${String(last)}\n최종 덱: [${model.join(",")}]`;
  },
};
