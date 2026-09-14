/**
 * 계약 헤더(`<name>.ts` 의 파일 머리 JSDoc)를 읽는 **순수 모듈**.
 *
 * **왜 `check-contract.ts` 에서 뽑아 왔는가.** 그 파일은 top-level 에서 전 구조를 검사하고
 * 화면에 결과를 찍는 CLI 다 — `import.meta.main` 가드가 없어서, 파서를 쓰려고 import 하는
 * 것만으로 검사가 돌고 그 출력이 부르는 쪽의 stdout 을 오염시킨다(`check-v2 --json` 의
 * JSON 이 실제로 깨졌다). CLI 를 함수로 감싸는 것은 그 파일의 구조를 바꾸는 일이라,
 * **읽기만 하는 조각을 이리로 옮기고 양쪽이 함께 쓴다.**
 *
 * 계약의 정본은 여전히 `<name>.ts` 헤더 한 곳이고, 그것을 읽는 파서도 이 파일 한 곳이다.
 */

/** 계약 명세 여섯 항목. 순서가 곧 규격이다(`docs/ORD-006-conventions.md` §규약1). */
export const SECTION_ORDER = [
  "목적",
  "불변식",
  "연산 계약",
  "주입 정책",
  "검증 등급",
  "필요충분조건",
];

/**
 * 계약 헤더에서 뽑은 것. **`check-v2` 의 ds 조항(P17·P18)이 이것을 함께 쓴다** — 연산
 * 목록의 정본은 계약 헤더 한 곳이고, 원고 판정기가 표를 다시 파싱하면 두 파서가 갈린다.
 */
export interface Contract {
  /** 연산 계약 표의 행에서 뽑은 연산 이름. */
  ops: string[];
  grade: string | null;
  /** 여섯 항목 중 실제로 있는 것. */
  sections: string[];
}

/** 파일 머리의 JSDoc 본문. `*` 접두를 걷어 낸 산문을 돌려준다. */
export function headerDoc(source: string): string | null {
  const match = /^\s*\/\*\*([\s\S]*?)\*\//.exec(source);
  if (match?.[1] === undefined) return null;
  return match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, ""))
    .join("\n");
}

export function parseContract(doc: string): Contract {
  const ops: string[] = [];
  for (const line of doc.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const [, first] = trimmed.split("|");
    if (first === undefined) continue;
    // 한 칸에 연산이 둘 이상 오는 자리가 있다(`min()` / `max()`).
    for (const found of first.matchAll(/`([A-Za-z_][A-Za-z0-9_]*)\s*\(/g)) {
      const name = found[1];
      if (name !== undefined && !ops.includes(name)) ops.push(name);
    }
  }

  const grade = /\*\*검증 등급\.\*\*\s*`([a-z]+)`/.exec(doc)?.[1] ?? null;
  const sections = SECTION_ORDER.filter((name) => doc.includes(`**${name}.**`));
  return { ops, grade, sections };
}
