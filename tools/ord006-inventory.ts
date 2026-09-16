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
import { ESCALATION } from "./ord006-escalation.ts";

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
  // A군 그래프 표현 둘(KAN-026 S9 · S10). **새 줄은 알파벳 자리에 넣는다**(`docs/ORD-006-wbs.md`
  // §4) — 표 전체가 추가 순서로 쌓여 있어 「알파벳 자리」가 정해지지 않으므로, 자기보다 뒤로
  // 정렬되는 첫 기존 키(`linear/stack`) 앞에 둔다. 기존 줄은 옮기지 않았다.
  //
  // `dag`(KAN-026 S11) — 정점 번호 모형을 `graphAdjList` 에서 따르므로 사전이 들지 않고, 여섯 행이
  // 정점마다 나가는 간선 배열 · 지나간 표시 하나로 선다. 불변식이 하나라 `basic` 이 아니다. 알파벳
  // 자리가 `graphAdjList` 앞이다.
  "graph-repr/dag": "invariant",
  // `graphAdjList` — 정점 번호를 구조가 `[0, n)` 으로 매기므로 번호에서 이웃 배열을 찾는 데 사전이
  // 들지 않고, 일곱 행이 정점마다 배열 하나로 선다. 불변식이 둘이라 `basic` 이 아니다.
  "graph-repr/graphAdjList": "invariant",
  // `graphAdjMatrix` — 「공간」 표시였지만 계약이 갈린다(판별 셋째 걸음을 축3으로 돌려 확인). 칸
  // 배열 하나가 여덟 행을 지키고, 쌍을 읽는 두 경로의 정합 셋이 불변식이다.
  "graph-repr/graphAdjMatrix": "invariant",
  // A군 공간 판정(KAN-026 S13). 자기보다 뒤로 정렬되는 첫 기존 키(`linear/doublyLinkedList`) 앞에 둔다.
  //
  // `bitArray` — 짝 정본이 없는 B15 처분(존치 + 성격 전환). 자리마다 불리언 하나를 담는 언어 배열이
  // 다섯 행을 지키고, 물려받은 `count` · `toggle` 을 빼면서 불변식 후보가 사라져 `basic` 이다(S1 예상은
  // `invariant`).
  "linear/bitArray": "basic",
  // A군 핸들 수열(KAN-026 S5). 자기보다 뒤로 정렬되는 첫 기존 키(`linear/dynamicArray`) 앞에 둔다.
  //
  // `doublyLinkedList` — 연결 마디가 자명한 구현이므로(2026-09-15 유저 결정) 여섯 행이 앞뒤 이음을 든
  // 마디 하나로 서고, 산 핸들 판정도 마디가 기억한 수열을 보는 상수다. 세어 둔 수 ↔ 늘어놓은 수 하나가
  // 불변식이라 `basic` 이 아니다.
  "linear/doublyLinkedList": "invariant",
  // A군 수열 둘(KAN-026 S4 · S6). 둘 다 자기보다 뒤로 정렬되는 첫 기존 키(`linear/stack`) 앞에 둔다.
  //
  // `dynamicArray` — 언어 배열 하나에 맡기면 여섯 행이 선다(불변 사실 197). 물려받은 두 배 늘리기는
  // 상각 설계인데 등급은 존재 조건이라 `complexity` 가 아니고(불변 사실 55), 불변식이 둘이다.
  // (KAN-026 S23 · S29 가 `toArray` 를 빼 `basic` 으로 내렸던 것을 S31 이 되돌렸다 — 원칙 A5′-2 기준 시점 조항.)
  "linear/dynamicArray": "invariant",
  // A군 단조 둘(KAN-026 S7 · S8). 둘 다 자기보다 뒤로 정렬되는 첫 기존 키(`linear/singlyLinkedList`) 앞에 둔다.
  //
  // `monotonicQueue` — 뒤에 넣고 앞에서 빼며 최댓값을 묻는 큐(연산 집합 교체, 2026-09-15 유저 결정). 앞 끝에서
  // 빼므로 칸마다 적은 최댓값이 어느 방향이든 한 행에서 낡아, 일곱 행을 함께 지키려면 후보를 버리거나 무더기를
  // 옮기는 상각 설계가 든다. 불변식 절은 비었다 — 판정 절차 2번에서 먼저 걸린다(`linear/deque` 와 같은 자리).
  "linear/monotonicQueue": "complexity",
  // `monotonicStack` — 최댓값을 묻는 스택(연산 집합 교체, 2026-09-15 유저 결정). 언어 배열 하나에 (원소,
  // 그 원소까지의 최댓값) 짝을 쌓으면 일곱 행이 서고 — 넣고 빼는 끝이 같아 곁에 적은 값이 낡지 않는다 —
  // 불변식 절이 비어 `basic` 이다.
  "linear/monotonicStack": "basic",
  // `singlyLinkedList` — 연결 마디가 자명한 구현이므로(2026-09-15 유저 결정) 다섯 행이 마디 사슬
  // 하나로 선다. 세어 둔 수 ↔ 늘어놓은 수 하나가 불변식이라 `basic` 이 아니다.
  "linear/singlyLinkedList": "invariant",
  "linear/stack": "basic",
  // A군 확률 필터(KAN-026 S14). 자기보다 뒤로 정렬되는 첫 기존 키(`tree/multiset`) 앞에 둔다.
  //
  // `bloomFilter` — 비트 배열에 해시 k 번이면 두 행의 시간이 확률 논증 없이 선다. 오차 보장의 확률 논증은 등급을
  // 올리지 않는다(판정 절차 2번은 시간 상한만 읽는다 — 불변 사실 203). 불변식 절이 비었다.
  "probabilistic/bloomFilter": "basic",
  // `countMinSketch`(KAN-026 S15) — 줄 ⌈ln(1/δ)⌉ 개에 줄마다 해시 한 번이면 두 행의 시간이 확률 논증 없이 선다. 불변식 절이 비었다.
  "probabilistic/countMinSketch": "basic",
  // `cuckooFilter`(KAN-026 S19) — 칸마다 수를 세는 블룸 필터가 세 행을 확률 논증 없는 시간에 지키고 용량 미만에서 거절하지
  // 않는다(판정 도구 fixture 로 실행). S1 이 예상한 「add 한정자가 등급을 가른다」는 이름의 기법만 본 판정이었다. 불변식 절이 비었다.
  "probabilistic/cuckooFilter": "basic",
  // `hyperLogLog`(KAN-026 S16) — 자리 1/(ε²·δ) 개에 원소마다 해시 한 번, 추정 · 합치기는 자리를 한 번씩 훑으면 세 행의 시간이
  // 확률 논증 없이 선다. 불변식 절이 비었다(합친 결과의 정합은 merge 행의 의미).
  "probabilistic/hyperLogLog": "basic",
  // `minHash`(KAN-026 S17) — 해시 함수 1/(ε²·δ) 개에 원소마다 함수를 한 번씩 돌려 칸마다 가장 작은 값을 남기고, 닮음은 칸을 한 번씩
  // 견주면 두 행의 시간이 확률 논증 없이 선다. 불변식 절이 비었다(자기 자신과의 닮음 · 방향 무관은 similarity 행의 의미).
  "probabilistic/minHash": "basic",
  "tree/multiset": "complexity",
  "linear/deque": "complexity",
  "range-query/intervalTree": "complexity",
  "linear/xorLinkedList": "invariant",
  "linear/unrolledLinkedList": "complexity",
  // 성격 전환(KAN-026 S3). 계약이 `trie/ternarySearchTree` 의 것과 같으므로 등급도 같다
  // (불변 사실 56). 에지를 접는 기법이 자명한 구현보다 손이 더 가는 것은 등급을 바꾸지 않는다
  // (불변 사실 55). 자기보다 뒤로 정렬되는 첫 기존 키(`trie/suffixArray`) 앞에 둔다.
  "trie/radixTree": "invariant",
  "trie/suffixArray": "complexity",
  "trie/suffixTree": "complexity",
  "linear/queue": "basic",
  "trie/ternarySearchTree": "invariant",
  "tree/redBlackTree": "complexity",
  // 조회 `worst` + 갱신 `amortized` — 한정자가 연산마다 갈리는 첫 계약(T1-03).
  "tree/scapegoatTree": "complexity",
  // 한정자만 갈린 이웃 계약(T1-01). 등급은 같다 — 자명한 구현이 상한을 못 지키는 것이
  // 상각으로 봐도 그대로이기 때문이고, 등급이 같아도 계약은 다르다(불변 사실 56 의 역).
  "tree/splayTree": "complexity",
  // 형제 셋째(T1-02). 등급이 같아도 계약은 다르다 — 자명한 구현이 상한을 못 지키는 것이
  // 기댓값으로 봐도 그대로다.
  "tree/treap": "complexity",
  // 형제 넷과 **등급이 갈리는** 계약(T1-04). 상한을 로그로 적지 않으므로 정렬 배열
  // 하나가 여덟 행을 전부 상한 안에 하고, 그래서 `complexity` 가 아니다. 불변식 절이
  // 넷이라 `invariant` 다 — **등급이 다르면 계약이 같을 수 없다**(불변 사실 56).
  "tree/binarySearchTree": "invariant",
  // 담기는 쪽(`tree/multiset`)과 **등급이 같다.** 등급이 다르면 계약이 같을 수 없다는 것의
  // 역은 성립하지 않으므로(불변 사실 56) 여기서는 등급이 판정의 입력이 아니고, 두 계약을
  // 가르는 것은 반례다(T1-05 — `keyCountingMultiset`).
  "tree/orderStatisticTree": "complexity",
  // 형제 다섯과 연산 집합부터 갈리는 계약(T1-07). 담는 것이 정렬 집합이 아니라 숲이고,
  // 갈리는 자리가 `cut` 하나다. 등급이 같은 것은 여기서도 판정의 입력이 아니다.
  "tree/linkCutTree": "complexity",
  // 힙 덩어리의 계약 A(T2-01). 갱신 둘이 `amortized`, 조회 셋이 `worst` 로 갈린 계약이고
  // 등급은 자명한 구현 둘이 반대쪽에서 막히는 데서 나온다.
  "heap/priorityQueue": "complexity",
  // 성격 전환 셋(T2-01). 계약이 같으므로 등급도 같다(불변 사실 56).
  "heap/minHeap": "complexity",
  "heap/maxHeap": "complexity",
  "heap/daryHeap": "complexity",
  // 사전 계약(T3-01). `expected` 한정자가 확률 논증을 요구하므로 등급 판정 2번에서 걸린다.
  "hash/hashMapChaining": "complexity",
  // 성격 전환(T3-01). 적재율과 표현이 계약의 문장이 못 되는 것이 전환의 근거다.
  "hash/hashMapOpenAddressing": "complexity",
  // 같은 카테고리의 이웃과 **결합 연산 하나로** 갈리는 계약(T4-01). 가르는 것은 반례다 —
  // 구간을 두 앞구간의 차로 내는 구현이 이 계약을 지키고 임의 결합 계약을 못 지킨다.
  "range-query/fenwickTree": "complexity",
  // 「공간이 존재 이유」 13건의 판정 선례(T5-01). 등급이 `linear/queue` 와 같은데 계약은
  // 갈린다 — 등급이 같아도 계약은 다를 수 있다(불변 사실 56 의 역은 성립하지 않는다).
  "linear/circularBuffer": "basic",
  // T1 트랙의 첫 **불변 구조**(T1-06). 불변식 절이 비었는데도 `invariant` 가 아닌 것은
  // 판정 절차가 상한(2번)을 불변식(3번)보다 먼저 보기 때문이다 — `linear/deque` 와 같은 자리.
  "tree/cartesianTree": "complexity",
  "probabilistic/concurrentSkipList": "concurrency",
  // 성격 전환(B22·B23). 계약이 `tree/redBlackTree` 의 것과 같으므로 등급도 같다 —
  // 등급은 계약에서 기계적으로 따라 나온다(불변 사실 56).
  "tree/avlTree": "complexity",
  "tree/twoThreeTree": "complexity",
  "tree/bTree": "complexity",
  "tree/bPlusTree": "complexity",
  // 힙 덩어리의 계약 B(T2-02). `heap/priorityQueue` 의 다섯에 합치기 한 행을 더하고 갱신
  // 셋의 한정자를 `worst` 로 올린 계약이라 등급이 같다 — 배열 한 줄이 여섯 행을 지키면서
  // 합치기에서 나가고, 늘 정렬해 두면 넣기에서 나간다.
  "heap/leftistHeap": "complexity",
  // 성격 전환(T2-02). 담는 모양이 정본과 전혀 다른데 계약이 그 차이를 관측하지 못한다.
  "heap/binomialHeap": "complexity",
  // 사전과 **서로 담지 않는** 이웃 계약(T3-02 · 불변 사실 54). 등급이 같은 것은 판정의
  // 입력이 아니다 — 상한이 확률 논증에서만 나오는 것이 사전 쪽과 같기 때문이다.
  "hash/hashSet": "complexity",
  // `range-query/fenwickTree` 와 **주입 정책 한 줄로** 갈리는 계약(T4-02). 등급이 같은데
  // **자명한 구현의 목록이 다르다** — 앞구간을 미리 접어 두는 길이 여기서는 후보조차 아니다.
  "range-query/segmentTree": "complexity",
  // 「공간이 존재 이유」 표시가 붙었는데 존재 이유가 공간이 아니었던 계약(T5-02). 배열 둘이
  // 여섯 행을 전부 상한 안에 하므로 `complexity` 가 아니고, 불변식 하나가 남아 `basic` 도
  // 아니다 — 판정 절차의 3번에서 멈춘 첫 계약이다.
  "linear/gapBuffer": "invariant",
  // 성격 전환(KAN-026 S2). 계약이 `trie/ternarySearchTree` 의 것과 같으므로 등급도 같다
  // (불변 사실 56). 이 이름이 가리키는 기법(자식을 표로 드는 마디)이 그 계약 헤더가 든 자명한
  // 구현 그 자체다. 자기보다 뒤로 정렬되는 기존 키가 없어 표 끝에 둔다(`docs/ORD-006-wbs.md` §4).
  "trie/trie": "invariant",
};

/**
 * 다른 카드로 **이관된** 구조 — 키는 `<category>/<name>`, 값은 인수한 카드 id. 검증 등급 열에
 * `transferred:<카드 id>` 로 적는다(ASCII). 등급이 없는 까닭이 「아직 안 정했다」(`-`)가 아니라 「이 트랙에서
 * 계약을 세우지 않고 옮긴다」임을 행에서 읽게 하려는 것이다. 열을 늘리지 않는 이유는 `COLUMNS` 주석과 같다.
 * `tools/ord006-wbs.ts` 의 `transferredTo` 와 같은 값을 적는다. 인수한 카드가 디렉터리를 걷으면 아래 가드가
 * 멈추므로 그때 이 줄을 지운다.
 */
const TRANSFERRED_TO: Record<string, string> = {
  // KAN-026 S12 · S26 — 자료구조가 아니다(불변 사실 200), 알고리즘 트랙으로 옮기는 일은 KAN-039 가 v2 가이드와
  // 한 커밋에서 한다(불변 사실 288 · 2026-09-15 유저 결재 「가」).
  "hash/rollingHash": "KAN-039-FG8HWZ",
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
      VERIFICATION_GRADES[key] ??
        (TRANSFERRED_TO[key] ? `transferred:${TRANSFERRED_TO[key]}` : "-"),
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
  ["이관", TRANSFERRED_TO, "tools/ord006-wbs.ts 의 transferredTo"],
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
