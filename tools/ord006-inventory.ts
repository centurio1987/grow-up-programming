/**
 * ORD-006 자료구조 인벤토리 생성기.
 *
 * `src/data-structures/<category>/<name>/` 69종을 스캔해 docs/ORD-006-inventory.tsv 를 만든다.
 * 목적은 세션 진입 비용 절감 — KAN-025(P4 분류)가 60종 디렉터리를 다시 열지 않고
 * 이 TSV 하나만 읽고 분류하도록 하는 것이다.
 *
 * 결함등급의 출처는 ORDER.md:39-63 진단 표 **하나뿐이다.** 9종만 채우고 나머지 60종은 `-` 로 둔다.
 * 검증등급·에스컬레이션도 같은 규칙 — 확정된 것만 적고 추정으로 메우지 않는다.
 * 세 열 모두 아래 결정 맵이 유일한 출처이고, 맵에 없는 구조는 `-` 다.
 *
 * TSV 열 이름은 ASCII 로 쓴다(런북의 한글 열 이름과의 대응은 COLUMNS 주석 참조).
 * 하위 도구가 `cut -f1` 로 path 를 뽑아 쓰기 때문이다.
 *
 * 사용: bun run tools/ord006-inventory.ts [--out <path>]
 */
import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = process.cwd();
const scanRoot = join(root, "src/data-structures");
const outIdx = process.argv.indexOf("--out");
// resolve — join 은 절대 경로 인자를 루트 뒤에 이어붙여 리포 안에 엉뚱한 파일을 만든다.
const outPath =
  outIdx >= 0 && process.argv[outIdx + 1]
    ? resolve(root, process.argv[outIdx + 1]!)
    : join(root, "docs/ORD-006-inventory.tsv");

/**
 * 열 대응 (런북 → TSV 헤더)
 *   path · category · name · 결함등급 · 검증등급후보 · 에스컬레이션후보 ·
 *   problem_lines · guide_lines · has_reference
 *
 * **`has_reference` 는 TS 정본(`_reference/`)의 유무다.** 규약4 (가) 등급 구조는 정본이
 * `rust/structures/src/` 에 있으므로 이 열이 `false` 인 것이 정상이고, 정본이 없다는 뜻이
 * 아니다(`probabilistic/concurrentSkipList`). 열을 늘리지 않는 이유는 하위 도구가 이 파일을
 * 열 번호로 읽기 때문이다.
 */
const COLUMNS = [
  "path",
  "category",
  "name",
  "defect_grade",
  "verification_grade",
  "escalation",
  "problem_lines",
  "guide_lines",
  "has_reference",
] as const;

/**
 * 규약4 언어 에스컬레이션 **확정** 판정. 키는 `<category>/<name>`.
 *
 * 출처는 docs/ORD-006-conventions.md 의 확정 판정 표 하나뿐이다.
 * 전략 표(docs/ORD-006-strategy.md:190-204)의 목록은 착수 시점의 **예상**이므로 넣지 않는다.
 * 결함등급과 같은 규칙 — 확정된 것만 적고 추정하지 않는다.
 *
 * 값이 `(가)`/`(나)` 가 아니라 `req`/`opt` 인 이유: en_US.UTF-8 로케일의 awk·uniq 는
 * `가` 와 `나` 를 같은 문자열로 판정한다(`awk '$6=="가"'` 가 두 등급을 모두 잡는다).
 * 기계가 읽는 열은 ASCII 로 둔다 — 아래 assertAscii 가 이를 강제한다.
 */
const ESCALATION: Record<string, "req" | "opt"> = {
  // (가) Rust 필수 — 선형화·진행 보장은 단일 스레드 TS 에서 표현 불가
  "probabilistic/concurrentSkipList": "req",
  // (나) Rust 선택 — 계약은 TS 로 충족, 포인터 XOR 의 메모리 이득만 측정 불가
  "linear/xorLinkedList": "opt",
};

/**
 * 규약1 검증 등급 **확정** 판정. 키는 `<category>/<name>`.
 *
 * 출처는 docs/ORD-006-conventions.md §규약1 의 판정 절차다. 계약을 적은 구조만 채운다 —
 * 등급은 계약에서 기계적으로 따라 나오므로 계약 없이 매기면 그건 추정이다.
 * 69종 일괄 판정은 KAN-025 의 일이고, B2 는 시범 2종만 채웠다.
 */
const VERIFICATION_GRADES: Record<
  string,
  "basic" | "invariant" | "complexity" | "concurrency"
> = {
  "linear/stack": "basic",
  "tree/multiset": "complexity",
  "linear/deque": "complexity",
  "range-query/intervalTree": "complexity",
  "linear/xorLinkedList": "invariant",
  "linear/unrolledLinkedList": "complexity",
  "trie/suffixArray": "complexity",
  "trie/suffixTree": "complexity",
  "linear/queue": "basic",
  "trie/ternarySearchTree": "invariant",
  "tree/redBlackTree": "complexity",
  "probabilistic/concurrentSkipList": "concurrency",
  // 성격 전환(B22·B23). 계약이 `tree/redBlackTree` 의 것과 같으므로 등급도 같다 —
  // 등급은 계약에서 기계적으로 따라 나온다(불변 사실 56).
  "tree/avlTree": "complexity",
  "tree/twoThreeTree": "complexity",
  "tree/bTree": "complexity",
  "tree/bPlusTree": "complexity",
};

/** ORDER.md:39-63 진단 표 9종. 키는 `<category>/<name>`. 이 표 밖은 전부 `-`. */
const DEFECT_GRADES: Record<string, "A" | "B" | "C"> = {
  "tree/multiset": "A",
  "range-query/intervalTree": "A",
  "linear/unrolledLinkedList": "A",
  "linear/deque": "A",
  "linear/xorLinkedList": "B",
  "probabilistic/concurrentSkipList": "B",
  "trie/suffixArray": "C",
  "trie/suffixTree": "C",
  "linear/queue": "C",
};

/** wc -l 과 달리 마지막 줄에 개행이 없어도 한 줄로 센다. 파일이 없으면 0. */
async function countLines(path: string): Promise<number> {
  const file = Bun.file(path);
  if (!(await file.exists())) return 0;
  const text = await file.text();
  if (text.length === 0) return 0;
  const parts = text.split("\n");
  return parts[parts.length - 1] === "" ? parts.length - 1 : parts.length;
}

async function isDir(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

const categories = (await readdir(scanRoot, { withFileTypes: true }))
  .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
  .map((e) => e.name)
  .sort();

const rows: string[][] = [];
const seenKeys = new Set<string>();

for (const category of categories) {
  const names = (
    await readdir(join(scanRoot, category), { withFileTypes: true })
  )
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();

  for (const name of names) {
    const dir = join(scanRoot, category, name);
    const key = `${category}/${name}`;
    seenKeys.add(key);
    rows.push([
      `src/data-structures/${key}`,
      category,
      name,
      DEFECT_GRADES[key] ?? "-",
      VERIFICATION_GRADES[key] ?? "-",
      ESCALATION[key] ?? "-",
      String(await countLines(join(dir, `${name}-problem.md`))),
      String(await countLines(join(dir, `${name}-guide.mdx`))),
      String(await isDir(join(dir, "_reference"))),
    ]);
  }
}

// 판정 표의 키가 실제 디렉터리와 어긋나면(오타·이동·삭제) 조용히 `-` 로 새지 않도록 여기서 멈춘다.
// multiset 의 tree/ 이동처럼 경로가 바뀌는 후속 작업이 예정돼 있어 이 가드가 실제로 걸린다.
for (const [label, table, source] of [
  ["결함등급", DEFECT_GRADES, "ORDER.md:39-63 진단 표"],
  ["에스컬레이션", ESCALATION, "docs/ORD-006-conventions.md 확정 판정 표"],
  [
    "검증등급",
    VERIFICATION_GRADES,
    "docs/ORD-006-conventions.md §규약1 판정 절차",
  ],
] as const) {
  const missing = Object.keys(table).filter((k) => !seenKeys.has(k));
  if (missing.length > 0) {
    console.error(
      `${label} 키가 실제 구조와 맞지 않습니다: ${missing.join(", ")}\n` +
        `${source} 와 src/data-structures/ 를 대조하십시오.`,
    );
    process.exit(1);
  }
}

/**
 * 값 열에 비 ASCII 가 섞이면 멈춘다.
 *
 * en_US.UTF-8 로케일에서 awk·uniq 는 한글 자모를 서로 같다고 판정한다(`가` == `나`).
 * 등급 열에 한글을 넣으면 하위 필터가 두 등급을 조용히 한 덩어리로 센다.
 * path·name 은 원래 ASCII 이므로 전 열에 걸어도 무해하고, 앞으로 열이 늘어도 자동으로 지켜진다.
 */
function assertAscii(rows: string[][]): void {
  const bad = rows.flatMap((r, i) =>
    r
      .map((v, c) => ({ v, c }))
      .filter(({ v }) => !/^[\x20-\x7e]*$/.test(v))
      .map(({ v, c }) => `${i + 2}행 ${COLUMNS[c]}="${v}"`),
  );
  if (bad.length > 0) {
    console.error(
      `TSV 값에 비 ASCII 가 섞였습니다: ${bad.join(", ")}\n` +
        "로케일에 따라 awk·uniq 가 한글 값을 구분하지 못합니다. ASCII 코드로 바꾸십시오.",
    );
    process.exit(1);
  }
}

assertAscii(rows);

const tsv = [COLUMNS.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
await Bun.write(outPath, `${tsv}\n`);

const graded = rows.filter((r) => r[3] !== "-").length;
console.log(
  `${outPath}: ${rows.length} 행 (카테고리 ${categories.length}종, 결함등급 부여 ${graded}종)`,
);
