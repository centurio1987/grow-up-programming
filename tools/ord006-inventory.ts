/**
 * ORD-006 자료구조 인벤토리 생성기.
 *
 * `src/data-structures/<category>/<name>/` 69종을 스캔해 docs/ORD-006-inventory.tsv 를 만든다.
 * 목적은 세션 진입 비용 절감 — KAN-025(P4 분류)가 60종 디렉터리를 다시 열지 않고
 * 이 TSV 하나만 읽고 분류하도록 하는 것이다.
 *
 * 결함등급의 출처는 ORDER.md:39-63 진단 표 **하나뿐이다.** 9종만 채우고 나머지 60종은 `-` 로 둔다.
 * 추정해서 채우지 않는다. 검증등급·에스컬레이션 후보 열도 B1·B2 전까지는 `-` 다.
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

/** ORDER.md:39-63 진단 표 9종. 키는 `<category>/<name>`. 이 표 밖은 전부 `-`. */
const DEFECT_GRADES: Record<string, "A" | "B" | "C"> = {
  "hash/multiset": "A",
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
  const names = (await readdir(join(scanRoot, category), { withFileTypes: true }))
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
      "-", // 검증등급후보 — B2 에서 채운다
      "-", // 에스컬레이션후보 — B1 에서 채운다
      String(await countLines(join(dir, `${name}-problem.md`))),
      String(await countLines(join(dir, `${name}-guide.mdx`))),
      String(await isDir(join(dir, "_reference"))),
    ]);
  }
}

// 진단 표의 키가 실제 디렉터리와 어긋나면(오타·이동·삭제) 조용히 `-` 로 새지 않도록 여기서 멈춘다.
const missing = Object.keys(DEFECT_GRADES).filter((k) => !seenKeys.has(k));
if (missing.length > 0) {
  console.error(
    `진단 표의 키가 실제 구조와 맞지 않습니다: ${missing.join(", ")}\n` +
      "ORDER.md:39-63 과 src/data-structures/ 를 대조하십시오.",
  );
  process.exit(1);
}

const tsv = [COLUMNS.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
await Bun.write(outPath, `${tsv}\n`);

const graded = rows.filter((r) => r[3] !== "-").length;
console.log(`${outPath}: ${rows.length} 행 (카테고리 ${categories.length}종, 결함등급 부여 ${graded}종)`);
