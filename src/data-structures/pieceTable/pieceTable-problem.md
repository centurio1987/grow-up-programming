# PieceTable (조각 테이블)

## 한 줄 요약

> 원본 텍스트를 절대 수정하지 않고, 추가 버퍼와 조각(Piece) 목록만으로 편집 결과를 재구성하는 텍스트 저장 구조 — VS Code가 대용량 파일 편집에 사용하는 방식.

## 스토리

1GB짜리 로그 파일의 10번째 줄에 한 단어를 삽입해야 한다고 가정해 봅시다. 파일 전체를 메모리에 복사하면서 삽입 지점 이후 내용을 모두 밀어내는 방식은 실용적이지 않습니다. 그렇다고 원본 파일을 직접 수정하면 실행 취소(undo) 구현이 복잡해지고 데이터 손실 위험도 있습니다.

PieceTable은 두 개의 버퍼와 조각 목록으로 이 문제를 해결합니다. 원본 텍스트는 "원본 버퍼"에 불변으로 보관되고, 새로 추가된 텍스트는 "추가 버퍼"에 append-only로 기록됩니다. 텍스트의 현재 상태는 각 조각이 어느 버퍼의 어느 구간을 가리키는지만 기억해 두었다가 필요할 때 이어 붙여서 만들어 냅니다.

이 구조는 1990년대 AbiWord에서 처음 대중화되었으며, VS Code가 2016년 이 방식을 채택한 후 고성능 텍스트 에디터의 표준 자료구조로 자리잡았습니다.

## 함수 인터페이스

```ts
export class PieceTable {
  constructor(originalText: string = "")
  insert(offset: number, text: string): void
  delete(offset: number, length: number): void
  getText(): string
  length(): number
}
```

| 메서드 | 설명 | 시간복잡도 |
|--------|------|-----------|
| `constructor(originalText)` | 원본 텍스트로 PieceTable을 초기화한다. 원본 버퍼에 저장하고 단일 조각을 생성 | O(1) |
| `insert(offset, text)` | offset 위치에 text를 삽입한다. 해당 조각을 분할하고 새 조각을 추가 | O(p) — 조각 수 p |
| `delete(offset, length)` | offset부터 length만큼 삭제한다. 범위에 걸친 조각들을 분할·제거 | O(p) |
| `getText()` | 조각 목록을 순서대로 이어 붙여 현재 텍스트를 반환 | O(n) |
| `length()` | 현재 텍스트의 총 길이 | O(1) |

## 제약 조건

- 원본 버퍼(`originalBuffer`)는 생성 후 절대 수정하지 않는다.
- 추가 버퍼(`addBuffer`)는 append-only다 — 기존 내용을 수정하거나 삭제하지 않는다.
- `insert`의 offset이 0 미만이면 0, length() 초과이면 length()로 클램프한다.
- `delete`의 범위가 텍스트 끝을 초과하면 텍스트 끝까지만 삭제한다.
- 빈 문자열 삽입 시 아무것도 하지 않는다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

**Piece 구조:**

```ts
interface Piece {
  bufferType: "original" | "add";
  start: number;   // 버퍼 내 시작 인덱스
  length: number;  // 조각 길이
}
```

**삽입 동작 (offset이 조각 중간에 위치할 때):**

1. 조각 목록을 순회해 offset이 속한 조각 i와 내부 오프셋 `localOffset`을 찾는다.
2. 조각 i를 `[0..localOffset-1]`과 `[localOffset..]` 두 조각으로 분할한다.
3. 새 텍스트를 추가 버퍼에 append하고, 이를 가리키는 새 조각을 두 조각 사이에 삽입한다.

**삭제 동작:**

삭제 범위 `[offset, offset+length)`에 걸친 조각들을 제거하고, 범위의 양 끝에 걸친 조각은 각각 앞부분·뒷부분만 남도록 분할한다.

## 예시

```ts
const pt = new PieceTable("hello world");
// pieces: [{ original, 0, 11 }]

pt.insert(5, "!!!");
// 조각 분할: [{ original, 0, 5 }, { add, 0, 3 }, { original, 5, 6 }]
// getText() → "hello!!! world"

pt.delete(0, 6);
// "hello!" 삭제
// pieces: [{ add, 2, 1 }, { original, 5, 6 }]
// getText() → "! world"

console.log(pt.length()); // 7
```
