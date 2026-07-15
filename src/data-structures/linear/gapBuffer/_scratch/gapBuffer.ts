// E3 자기검증용 스크래치. 가이드 본문 코드를 그대로 추출해 실측한다.
// bun src/data-structures/linear/gapBuffer/_scratch/gapBuffer.ts

// ---------------------------------------------------------------------------
// 최종 구현 (가이드 "아이디어를 코드로 옮기기" 절과 동일)
// ---------------------------------------------------------------------------
class GapBuffer {
  private buffer: string[];
  private gapStart: number;
  private gapEnd: number;
  private _length: number;

  constructor(initialCapacity: number = 16) {
    this.buffer = new Array(initialCapacity).fill("");
    this.gapStart = 0;
    this.gapEnd = initialCapacity;
    this._length = 0;
  }

  private grow(): void {
    const newSize = this.buffer.length === 0 ? 1 : this.buffer.length * 2;
    const newBuffer = new Array(newSize).fill("");
    for (let i = 0; i < this.gapStart; i++) newBuffer[i] = this.buffer[i];
    const tailLen = this.buffer.length - this.gapEnd;
    for (let i = 0; i < tailLen; i++) {
      newBuffer[newSize - tailLen + i] = this.buffer[this.gapEnd + i];
    }
    this.gapEnd = newSize - tailLen;
    this.buffer = newBuffer;
  }

  insert(char: string): void {
    if (this.gapStart === this.gapEnd) this.grow();
    this.buffer[this.gapStart] = char;
    this.gapStart++;
    this._length++;
  }

  delete(): void {
    if (this.gapStart === 0) return;
    this.gapStart--;
    this._length--;
  }

  moveCursor(position: number): void {
    const target = Math.max(0, Math.min(position, this._length));
    while (this.gapStart < target) {
      this.buffer[this.gapStart] = this.buffer[this.gapEnd];
      this.gapStart++;
      this.gapEnd++;
    }
    while (this.gapStart > target) {
      this.gapStart--;
      this.gapEnd--;
      this.buffer[this.gapEnd] = this.buffer[this.gapStart];
    }
  }

  getCursorPosition(): number {
    return this.gapStart;
  }

  getText(): string {
    return (
      this.buffer.slice(0, this.gapStart).join("") +
      this.buffer.slice(this.gapEnd).join("")
    );
  }

  length(): number {
    return this._length;
  }

  // 디버그용: 내부 상태 노출 (가이드 트레이스 검증 전용)
  debugState() {
    return {
      buffer: this.buffer.map((c) => (c === "" ? 0 : c.codePointAt(0))),
      gapStart: this.gapStart,
      gapEnd: this.gapEnd,
      length: this._length,
    };
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${label}\n  actual:   ${a}\n  expected: ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label} -> ${a}`);
  }
}

// ---------------------------------------------------------------------------
// 1) 시뮬레이션(steps) 트레이스와 1:1 대조 — capacity=8
// ---------------------------------------------------------------------------
console.log("=== 1) 시뮬레이션 트레이스 ===");
{
  const buf = new GapBuffer(8);
  assertEqual(buf.debugState(), { buffer: [0,0,0,0,0,0,0,0], gapStart: 0, gapEnd: 8, length: 0 }, "초기 상태");

  buf.insert("H");
  assertEqual(buf.debugState(), { buffer: [72,0,0,0,0,0,0,0], gapStart: 1, gapEnd: 8, length: 1 }, "insert('H')");

  buf.insert("i");
  buf.insert("!");
  assertEqual(buf.debugState(), { buffer: [72,105,33,0,0,0,0,0], gapStart: 3, gapEnd: 8, length: 3 }, "insert('i'), insert('!')");
  assertEqual(buf.getText(), "Hi!", "getText 후 'Hi!'");

  buf.moveCursor(1);
  assertEqual(buf.debugState(), { buffer: [72,105,33,0,0,0,105,33], gapStart: 1, gapEnd: 6, length: 3 }, "moveCursor(1)");
  assertEqual(buf.getText(), "Hi!", "moveCursor 후 getText 불변");

  buf.insert("e");
  assertEqual(buf.debugState(), { buffer: [72,101,33,0,0,0,105,33], gapStart: 2, gapEnd: 6, length: 4 }, "insert('e')");
  assertEqual(buf.getText(), "Hei!", "insert('e') 후 getText");

  buf.delete();
  assertEqual(buf.debugState(), { buffer: [72,101,33,0,0,0,105,33], gapStart: 1, gapEnd: 6, length: 3 }, "delete()");
  assertEqual(buf.getText(), "Hi!", "delete() 후 getText");
}

// ---------------------------------------------------------------------------
// 2) 엣지 케이스
// ---------------------------------------------------------------------------
console.log("\n=== 2) 엣지 케이스 ===");
{
  const empty = new GapBuffer(4);
  empty.delete(); // no-op
  assertEqual(empty.getText(), "", "빈 버퍼 delete는 no-op");
  assertEqual(empty.length(), 0, "빈 버퍼 length=0");

  const b = new GapBuffer(4);
  b.insert("a");
  b.moveCursor(-5);
  assertEqual(b.getCursorPosition(), 0, "moveCursor 음수 클램프 -> 0");

  b.moveCursor(999);
  assertEqual(b.getCursorPosition(), 1, "moveCursor 초과값 클램프 -> length()");

  // grow() 트리거: capacity=4, 5문자 삽입
  const g = new GapBuffer(4);
  "abcde".split("").forEach((c) => g.insert(c));
  assertEqual(g.getText(), "abcde", "grow 이후 getText");
  assertEqual(g.length(), 5, "grow 이후 length");
  const st = g.debugState();
  assertEqual(st.buffer.length >= 8, true, "grow 이후 버퍼가 2배 이상으로 확장됨");
}

// ---------------------------------------------------------------------------
// 3) 무작위 교차검증: 참조 구현(단순 문자열 splice)과 비교
// ---------------------------------------------------------------------------
console.log("\n=== 3) 무작위 교차검증 ===");
{
  function randomTest(seed: number) {
    let rng = seed;
    const next = () => {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff;
      return rng;
    };
    const buf = new GapBuffer(4);
    let ref = ""; // 참조: 커서 위치를 별도로 추적하는 단순 문자열
    let cursor = 0;
    for (let i = 0; i < 500; i++) {
      const op = next() % 3;
      if (op === 0) {
        const ch = String.fromCharCode(97 + (next() % 26));
        buf.insert(ch);
        ref = ref.slice(0, cursor) + ch + ref.slice(cursor);
        cursor++;
      } else if (op === 1) {
        buf.delete();
        if (cursor > 0) {
          ref = ref.slice(0, cursor - 1) + ref.slice(cursor);
          cursor--;
        }
      } else {
        const pos = next() % (ref.length + 3); // 범위 초과도 섞는다
        buf.moveCursor(pos);
        cursor = Math.max(0, Math.min(pos, ref.length));
      }
    }
    if (buf.getText() !== ref || buf.length() !== ref.length || buf.getCursorPosition() !== cursor) {
      console.error(`FAIL: 무작위 시드=${seed}`);
      console.error(`  buf.getText()=${JSON.stringify(buf.getText())}`);
      console.error(`  ref          =${JSON.stringify(ref)}`);
      process.exitCode = 1;
    } else {
      console.log(`PASS: 무작위 시드=${seed} (길이=${ref.length}, 일치)`);
    }
  }
  for (const seed of [1, 42, 12345, 999999]) randomTest(seed);
}

// ---------------------------------------------------------------------------
// 4) 코드 진화 사다리 — "개선" 단계(고정 크기, grow 없음)의 실패 시나리오
// ---------------------------------------------------------------------------
console.log("\n=== 4) 고정 크기(grow 없는) 버전의 구체적 실패 ===");
class FixedGapBuffer {
  private buffer: string[];
  private gapStart = 0;
  private gapEnd: number;
  constructor(capacity: number) {
    this.buffer = new Array(capacity).fill("");
    this.gapEnd = capacity;
  }
  insert(char: string): void {
    // grow() 호출이 없다 — 갭이 가득 차도 그냥 쓴다
    this.buffer[this.gapStart] = char;
    this.gapStart++;
  }
  getText(): string {
    return (
      this.buffer.slice(0, this.gapStart).join("") +
      this.buffer.slice(this.gapEnd).join("")
    );
  }
}
{
  const f = new FixedGapBuffer(4);
  "abcde".split("").forEach((c) => f.insert(c)); // 5번째 삽입에서 갭이 이미 다 참
  const text = f.getText();
  console.log(`FixedGapBuffer(4)에 'abcde' 삽입 -> getText() = ${JSON.stringify(text)}`);
  assertEqual(text, "abcdee", "grow 누락 시 마지막 문자가 중복되는 구체적 오답");
}

// ---------------------------------------------------------------------------
// 5) moveCursor 복사 순서를 바꾼 버그 버전 — 구체적 오답 확인
// ---------------------------------------------------------------------------
console.log("\n=== 5) moveCursor 순서 버그 ===");
{
  // 순서를 바꾼 왼쪽 이동: 먼저 복사하고 나중에 감소 (틀린 버전)
  class LeftBuggy {
    buffer: (string | number)[];
    gapStart: number;
    gapEnd: number;
    constructor(cap: number) {
      this.buffer = new Array(cap).fill("");
      this.gapStart = 0;
      this.gapEnd = cap;
    }
    insert(ch: string) {
      this.buffer[this.gapStart] = ch;
      this.gapStart++;
    }
    // 버그: 감소 전에 복사 (순서가 바뀜)
    moveCursorBuggy(target: number) {
      while (this.gapStart > target) {
        this.buffer[this.gapEnd] = this.buffer[this.gapStart]; // 감소를 빼먹고 먼저 복사
        this.gapStart--;
        this.gapEnd--;
      }
    }
    getText(): string {
      return (
        (this.buffer.slice(0, this.gapStart) as string[]).join("") +
        (this.buffer.slice(this.gapEnd) as string[]).join("")
      );
    }
  }
  const lb = new LeftBuggy(8);
  "Hi!".split("").forEach((c) => lb.insert(c)); // gapStart=3, gapEnd=8
  lb.moveCursorBuggy(1);
  console.log(`버그 버전 moveCursor(1) 후 getText() = ${JSON.stringify(lb.getText())}`);
  assertEqual(lb.getText(), "H!", "복사·감소 순서를 바꾸면 'i'가 통째로 사라지는 구체적 오답(정답은 'Hi!' 그대로여야 함)");
}

// ---------------------------------------------------------------------------
// 6) delete 3연속 — buffer 배열은 그대로, getText만 바뀜을 확인
// ---------------------------------------------------------------------------
console.log("\n=== 6) delete 연속 호출 확인 질문 검증 ===");
{
  const buf = new GapBuffer(8);
  "abc".split("").forEach((c) => buf.insert(c));
  assertEqual(buf.debugState().buffer, [97, 98, 99, 0, 0, 0, 0, 0], "insert 'abc' 후 buffer");
  buf.delete();
  buf.delete();
  buf.delete();
  assertEqual(buf.debugState(), { buffer: [97, 98, 99, 0, 0, 0, 0, 0], gapStart: 0, gapEnd: 8, length: 0 }, "delete 3연속 후 buffer는 그대로, gapStart만 0");
  assertEqual(buf.getText(), "", "delete 3연속 후 getText는 빈 문자열");
}

console.log("\n모든 검증 완료.");
