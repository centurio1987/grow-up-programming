/**
 * PieceTable (조각 테이블)
 *
 * VS Code, AbiWord 등 현대 텍스트 에디터가 채택한 텍스트 저장 방식.
 * 원본 텍스트를 담는 "원본 버퍼"와 추가된 텍스트를 담는 "추가 버퍼",
 * 그리고 버퍼 구간을 가리키는 "조각(Piece)" 목록으로 전체 텍스트를 재구성한다.
 *
 * 핵심 불변식:
 * - 원본 버퍼는 절대 수정하지 않는다.
 * - 새로 삽입한 텍스트는 추가 버퍼에 append-only로 기록한다.
 * - 텍스트의 현재 상태는 조각 목록을 순서대로 이어 붙여서 얻는다.
 *
 * 요구사항:
 * - insert(offset, text): offset 위치에 text를 삽입
 * - delete(offset, length): offset부터 length만큼 삭제
 * - getText(): 현재 텍스트 전체 반환
 * - length(): 현재 텍스트 길이 반환
 *
 * 시간복잡도:
 * - insert: O(p) — 조각 수 p에 비례 (조각 탐색 + 분할)
 * - delete: O(p)
 * - getText: O(n) — 전체 텍스트 길이
 * - length: O(1)
 */

type BufferType = "original" | "add";

interface Piece {
  bufferType: BufferType;
  start: number;   // 버퍼 내 시작 인덱스
  length: number;  // 조각 길이
}

export class PieceTable {
  private originalBuffer: string;
  private addBuffer: string;
  private pieces: Piece[];
  private _length: number;

  constructor(originalText: string = "") {
    throw new Error("Not implemented");
  }

  /**
   * offset 위치에 text를 삽입한다.
   * 1. offset이 속한 조각을 찾는다.
   * 2. 해당 조각을 분할하여 새 조각을 중간에 끼워 넣는다.
   * 3. 새 텍스트는 추가 버퍼에 append-only로 기록한다.
   * O(p) — 조각 탐색
   */
  insert(offset: number, text: string): void {
    throw new Error("Not implemented");
  }

  /**
   * offset부터 length만큼 삭제한다.
   * 삭제 범위에 걸친 조각들을 적절히 분할·제거한다.
   * O(p)
   */
  delete(offset: number, length: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 현재 텍스트 전체를 문자열로 반환한다.
   * 조각 목록을 순서대로 이어 붙인다. O(n)
   */
  getText(): string {
    throw new Error("Not implemented");
  }

  /**
   * 현재 텍스트의 총 길이를 반환한다. O(1)
   */
  length(): number {
    throw new Error("Not implemented");
  }
}
