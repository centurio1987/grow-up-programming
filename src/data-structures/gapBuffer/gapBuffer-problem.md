# GapBuffer (갭 버퍼)

## 한 줄 요약

> 텍스트 에디터에서 커서 위치 삽입·삭제를 O(1)로 만드는 배열 기반 버퍼 — 커서 근처에 "갭(빈 공간)"을 두어 삽입 시 복사 비용을 없앤다.

## 스토리

텍스트 에디터를 구현할 때 가장 자주 일어나는 연산은 "사용자가 현재 커서 위치에 문자를 입력하거나 지우는 것"입니다. 단순 배열로 버퍼를 구현하면 커서 앞쪽 원소들을 밀어야 하므로 O(n) 시간이 걸립니다. 연결 리스트를 쓰면 삽입은 O(1)이지만 커서 이동이 O(n)이고 캐시 효율도 나쁩니다.

갭 버퍼는 배열 중간에 "갭(Gap)"이라는 빈 슬롯 범위를 유지합니다. 커서는 항상 갭의 왼쪽 끝에 위치하며, 삽입 시 갭의 첫 슬롯에 문자를 쓰고 갭 시작을 오른쪽으로 이동시키기만 하면 됩니다. 삭제는 갭 시작을 왼쪽으로 한 칸 당기는 것으로 끝납니다. 커서를 다른 위치로 이동할 때만 갭을 이동시켜야 하므로 O(|delta|) 비용이 발생합니다.

Emacs, vim의 내부 버퍼, 초기 버전의 텍스트 에디터들이 이 방식을 사용했으며, 커서가 한 위치에 집중되는 일반적인 편집 패턴에서 매우 효율적입니다.

## 함수 인터페이스

```ts
export class GapBuffer {
  constructor(initialCapacity: number = 16)
  insert(char: string): void
  delete(): void
  moveCursor(position: number): void
  getCursorPosition(): number
  getText(): string
  length(): number
}
```

| 메서드 | 설명 | 시간복잡도 |
|--------|------|-----------|
| `constructor(initialCapacity)` | 초기 용량으로 내부 배열을 초기화한다 | O(1) |
| `insert(char)` | 커서 위치에 단일 문자를 삽입한다. 갭이 가득 찼으면 배열을 2배로 확장한다 | O(1) amortized |
| `delete()` | 커서 왼쪽 문자를 삭제한다(Backspace). 커서가 맨 앞이면 무시 | O(1) |
| `moveCursor(position)` | 커서를 절대 위치로 이동한다. 범위 초과 시 클램프 | O(\|delta\|) |
| `getCursorPosition()` | 현재 커서 위치를 반환한다 | O(1) |
| `getText()` | 갭을 제외한 실제 텍스트를 반환한다 | O(n) |
| `length()` | 실제 문자 수를 반환한다 | O(1) |

## 제약 조건

- `insert`의 인자는 단일 문자(길이 1 string)를 기준으로 한다.
- `delete`는 커서 왼쪽 문자를 제거한다(커서가 0이면 무시).
- `moveCursor`의 position이 0 미만이면 0, length() 초과이면 length()로 클램프한다.
- 갭 크기가 0이 되면 버퍼 크기를 2배로 늘리고 갭을 재배치한다.
- 시간 제한: 1초, 메모리 제한: 256 MB

## 문제 상세

내부 배열은 다음과 같이 구성됩니다:

```
[ 커서 앞 텍스트 | gap(빈 슬롯) | 커서 뒤 텍스트 ]
  ← gapStart →   ← gapEnd →    ← bufferSize →
```

- `buffer[0..gapStart-1]`: 커서 왼쪽 텍스트
- `buffer[gapStart..gapEnd-1]`: 갭 (빈 공간)
- `buffer[gapEnd..bufferSize-1]`: 커서 오른쪽 텍스트

커서 이동(예: 왼쪽으로 k칸) 시 갭도 왼쪽으로 k칸 이동해야 합니다. 이 과정에서 커서 왼쪽 문자들을 갭 오른쪽으로 복사합니다.

## 예시

```ts
const buf = new GapBuffer(8);

buf.insert("H"); // H|______   (| = gapStart = 1)
buf.insert("i"); // Hi|_____   (gapStart = 2)
buf.insert("!"); // Hi!|____   (gapStart = 3)

console.log(buf.getText()); // "Hi!"
console.log(buf.length());  // 3

buf.moveCursor(1); // H|i!___   (갭이 왼쪽으로 이동)
buf.insert("e");  // He|i!__

console.log(buf.getText()); // "Hei!"

buf.delete();      // H|i!___   (e 삭제)
console.log(buf.getText()); // "Hi!"
```
