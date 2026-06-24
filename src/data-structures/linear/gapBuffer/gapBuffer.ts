/**
 * GapBuffer (갭 버퍼)
 *
 * 텍스트 에디터에서 커서 근처의 삽입·삭제를 효율적으로 처리하는 자료구조.
 * 내부 배열 중간에 "갭(빈 공간)"을 유지하여 커서 위치에서의 삽입·삭제를 O(1)로 만든다.
 * 커서를 다른 위치로 이동하면 갭도 따라 이동하므로 O(|delta|) 시간이 소요된다.
 * vim, Emacs 등 텍스트 에디터의 내부 버퍼로 사용된다.
 *
 * 요구사항:
 * - insert(char): 커서 위치에 문자 삽입 (갭의 왼쪽 끝에 추가)
 * - delete(): 커서 왼쪽 문자 삭제 (갭을 왼쪽으로 확장)
 * - moveCursor(position): 커서를 절대 위치로 이동 (갭 이동)
 * - getCursorPosition(): 현재 커서 위치 반환
 * - getText(): 갭을 제외한 실제 텍스트 반환
 * - length(): 실제 문자 수 반환
 *
 * 시간복잡도:
 * - insert: O(1) amortized (갭이 부족하면 재할당 O(n))
 * - delete: O(1)
 * - moveCursor: O(|delta|) — 갭을 이동해야 하는 거리
 * - getCursorPosition: O(1)
 * - getText: O(n)
 * - length: O(1)
 */
export class GapBuffer {
  private buffer: string[];
  private gapStart: number;  // 갭의 시작 인덱스 (커서 위치)
  private gapEnd: number;    // 갭의 끝 인덱스 (exclusive)
  private _length: number;   // 실제 문자 수

  constructor(initialCapacity: number = 16) {
    throw new Error("Not implemented");
  }

  /**
   * 커서 위치에 문자를 삽입한다.
   * 단일 문자(string)를 받는다. 갭이 가득 차면 버퍼를 2배로 확장한다.
   * O(1) amortized
   */
  insert(char: string): void {
    throw new Error("Not implemented");
  }

  /**
   * 커서 왼쪽의 문자를 삭제한다 (Backspace 동작).
   * 커서가 맨 앞(0)이면 아무것도 하지 않는다.
   * O(1)
   */
  delete(): void {
    throw new Error("Not implemented");
  }

  /**
   * 커서를 절대 위치 position으로 이동한다.
   * position은 0 이상 length() 이하의 값이어야 한다.
   * 범위를 벗어난 값은 0 또는 length()로 클램프한다.
   * O(|delta|) — 갭을 이동해야 하는 문자 수만큼 복사 발생
   */
  moveCursor(position: number): void {
    throw new Error("Not implemented");
  }

  /**
   * 현재 커서 위치(gapStart)를 반환한다. O(1)
   */
  getCursorPosition(): number {
    throw new Error("Not implemented");
  }

  /**
   * 갭을 제외한 실제 텍스트 전체를 문자열로 반환한다. O(n)
   */
  getText(): string {
    throw new Error("Not implemented");
  }

  /**
   * 실제 문자 수(갭 제외)를 반환한다. O(1)
   */
  length(): number {
    throw new Error("Not implemented");
  }
}
