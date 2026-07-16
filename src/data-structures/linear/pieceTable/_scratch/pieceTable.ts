// E3 자기검증용 스크래치 — 가이드 본문 코드를 그대로 옮겨 실행 결과를 실측한다.

type BufferKind = "original" | "add";

interface Piece {
  buffer: BufferKind;
  start: number;
  length: number;
}

class PieceTable {
  private originalBuffer: string;
  private addBuffer: string = "";
  private pieces: Piece[] = [];
  private totalLength = 0;

  constructor(originalText: string = "") {
    this.originalBuffer = originalText;
    if (originalText.length > 0) {
      this.pieces = [{ buffer: "original", start: 0, length: originalText.length }];
      this.totalLength = originalText.length;
    }
  }

  length(): number {
    return this.totalLength;
  }

  private findPiece(offset: number): { index: number; localOffset: number } {
    let cumulative = 0;
    for (let i = 0; i < this.pieces.length; i++) {
      const piece = this.pieces[i]!;
      if (cumulative + piece.length > offset) {
        return { index: i, localOffset: offset - cumulative };
      }
      cumulative += piece.length;
    }
    return { index: this.pieces.length, localOffset: 0 };
  }

  insert(offset: number, text: string): void {
    if (text.length === 0) return;
    const clamped = Math.max(0, Math.min(offset, this.totalLength));
    const { index, localOffset } = this.findPiece(clamped);

    const newPiece: Piece = { buffer: "add", start: this.addBuffer.length, length: text.length };
    this.addBuffer += text;

    if (index === this.pieces.length || localOffset === 0) {
      this.pieces.splice(index, 0, newPiece);
    } else if (localOffset === this.pieces[index]!.length) {
      this.pieces.splice(index + 1, 0, newPiece);
    } else {
      const original = this.pieces[index]!;
      const left: Piece = { ...original, length: localOffset };
      const right: Piece = {
        ...original,
        start: original.start + localOffset,
        length: original.length - localOffset,
      };
      this.pieces.splice(index, 1, left, newPiece, right);
    }

    this.totalLength += text.length;
  }

  delete(offset: number, length: number): void {
    if (length <= 0 || this.totalLength === 0) return;
    const start = Math.max(0, Math.min(offset, this.totalLength));
    const end = Math.max(0, Math.min(offset + length, this.totalLength));
    if (start >= end) return;

    const result: Piece[] = [];
    let cumulative = 0;
    for (const piece of this.pieces) {
      const pieceStart = cumulative;
      const pieceEnd = cumulative + piece.length;
      cumulative = pieceEnd;

      if (pieceEnd <= start || pieceStart >= end) {
        result.push(piece);
        continue;
      }

      const localStart = Math.max(0, start - pieceStart);
      const localEnd = Math.min(piece.length, end - pieceStart);

      if (localStart > 0) {
        result.push({ ...piece, length: localStart });
      }
      if (localEnd < piece.length) {
        result.push({ ...piece, start: piece.start + localEnd, length: piece.length - localEnd });
      }
    }

    this.pieces = result;
    this.totalLength -= end - start;
  }

  getText(): string {
    let result = "";
    for (const piece of this.pieces) {
      const buffer = piece.buffer === "original" ? this.originalBuffer : this.addBuffer;
      result += buffer.slice(piece.start, piece.start + piece.length);
    }
    return result;
  }

  // 검증용: 내부 조각 길이 배열을 노출 (가이드 시뮬레이션 array 패널과 대조)
  pieceLengths(): number[] {
    return this.pieces.map((p) => p.length);
  }
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL ${label}: got ${a}, expected ${e}`);
    process.exitCode = 1;
  } else {
    console.log(`ok   ${label}: ${a}`);
  }
}

// ── 시나리오 1: 가이드 본문/시뮬레이션 대표 트레이스 ──────────────────
console.log("=== 시나리오 1: hello world ===");
const pt = new PieceTable("hello world");
assertEqual(pt.pieceLengths(), [11], "초기 조각 길이");
assertEqual(pt.getText(), "hello world", "초기 getText");
assertEqual(pt.length(), 11, "초기 length");

pt.insert(5, "!!!");
assertEqual(pt.pieceLengths(), [5, 3, 6], "insert(5,'!!!') 후 조각 길이");
assertEqual(pt.getText(), "hello!!! world", "insert 후 getText");
assertEqual(pt.length(), 14, "insert 후 length");

pt.delete(0, 6);
assertEqual(pt.pieceLengths(), [2, 6], "delete(0,6) 후 조각 길이");
assertEqual(pt.getText(), "!! world", "delete 후 getText");
assertEqual(pt.length(), 8, "delete 후 length");

// ── 시나리오 2: 엣지 케이스 ──────────────────────────────────────────
console.log("=== 시나리오 2: 엣지 케이스 ===");
const empty = new PieceTable();
assertEqual(empty.getText(), "", "빈 생성자 getText");
assertEqual(empty.length(), 0, "빈 생성자 length");
empty.insert(0, "abc");
assertEqual(empty.getText(), "abc", "빈 테이블에 insert(0, 'abc')");

const ignoreEmpty = new PieceTable("xyz");
ignoreEmpty.insert(1, "");
assertEqual(ignoreEmpty.getText(), "xyz", "빈 문자열 insert는 무시");
assertEqual(ignoreEmpty.pieceLengths(), [3], "빈 문자열 insert 후 조각 불변");

const clampInsert = new PieceTable("abc");
clampInsert.insert(999, "Z"); // length(3) 초과 → 끝으로 클램프
assertEqual(clampInsert.getText(), "abcZ", "offset 초과 insert는 끝으로 클램프");
clampInsert.insert(-5, "!"); // 음수 → 0으로 클램프
assertEqual(clampInsert.getText(), "!abcZ", "offset 음수 insert는 0으로 클램프");

const deleteNoop = new PieceTable("abc");
deleteNoop.delete(0, 0);
assertEqual(deleteNoop.getText(), "abc", "length=0 delete는 무시");
deleteNoop.delete(1, -3);
assertEqual(deleteNoop.getText(), "abc", "음수 length delete는 무시");

const deleteOverflow = new PieceTable("abcdef");
deleteOverflow.delete(4, 100); // 범위 초과 → 끝까지만 삭제
assertEqual(deleteOverflow.getText(), "abcd", "범위 초과 delete는 끝까지만 삭제");

const deleteAll = new PieceTable("hello");
deleteAll.delete(0, 5);
assertEqual(deleteAll.getText(), "", "전체 삭제 후 getText는 빈 문자열");
assertEqual(deleteAll.pieceLengths(), [], "전체 삭제 후 조각 목록 빈 배열");
deleteAll.insert(0, "new");
assertEqual(deleteAll.getText(), "new", "빈 테이블에서 재삽입");

const midSplitDelete = new PieceTable("abcdefgh");
midSplitDelete.delete(2, 3); // 'cde' 삭제, 조각 내부에서만 발생 (분할 없이 단일 조각 축소는 아님: 앞뒤 두 조각으로 쪼개짐)
assertEqual(midSplitDelete.getText(), "abfgh", "조각 중간 삭제");
assertEqual(midSplitDelete.pieceLengths(), [2, 3], "조각 중간 삭제 후 앞/뒤 두 조각으로 분할");

// ── 시나리오 3: 무작위 교차검증 (naive 문자열 연산과 비교) ─────────────
console.log("=== 시나리오 3: 무작위 교차검증 ===");
function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}
function randomText(n: number): string {
  const chars = "abcdefghij";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[randInt(chars.length)];
  return s;
}

let mismatches = 0;
for (let trial = 0; trial < 200; trial++) {
  const initial = randomText(randInt(10));
  const table = new PieceTable(initial);
  let naive = initial;

  const ops = 1 + randInt(15);
  for (let step = 0; step < ops; step++) {
    if (Math.random() < 0.5) {
      const offset = randInt(naive.length + 3) - 1; // 음수 포함 가능
      const text = randomText(randInt(5));
      table.insert(offset, text);
      const clamped = Math.max(0, Math.min(offset, naive.length));
      naive = naive.slice(0, clamped) + text + naive.slice(clamped);
    } else {
      const offset = randInt(naive.length + 3) - 1;
      const len = randInt(6) - 1; // 음수 포함 가능
      table.delete(offset, len);
      if (len > 0) {
        const start = Math.max(0, Math.min(offset, naive.length));
        const end = Math.max(0, Math.min(offset + len, naive.length));
        if (start < end) naive = naive.slice(0, start) + naive.slice(end);
      }
    }
    if (table.getText() !== naive || table.length() !== naive.length) {
      console.error(
        `MISMATCH trial=${trial} step=${step}: table="${table.getText()}"(${table.length()}) naive="${naive}"(${naive.length})`,
      );
      mismatches++;
    }
  }
}
if (mismatches === 0) {
  console.log(`ok   무작위 교차검증 200회 × 최대 15연산: 전부 naive와 일치`);
} else {
  console.error(`FAIL 무작위 교차검증: 불일치 ${mismatches}건`);
  process.exitCode = 1;
}

console.log("=== 완료 ===");
