/**
 * ORD-004 대상 manifest 생성기 (재개의 단일 진실원).
 *
 * 착수 시점 `src/**\/*-guide.mdx`(단 `_deprecated/`·`*-study-guide.mdx` 제외)를 스캔해
 * 정규 재생성 대상을 tools/ord004-manifest.json 에 고정한다. 각 토픽에 진행 상태를 기록한다.
 *
 * 멱등: 이미 manifest 파일이 있으면 덮어쓰지 않는다(진행 기록 보존). 재생성하려면 --force.
 *
 * 사용: bun run tools/ord004-manifest-gen.ts [--force]
 */
import { Glob } from "bun";
import { join } from "node:path";

const root = process.cwd();
const manifestPath = join(root, "tools/ord004-manifest.json");
const force = process.argv.includes("--force");

if (!force && (await Bun.file(manifestPath).exists())) {
  console.error(
    `manifest already exists: ${manifestPath}\n진행 기록 보존을 위해 덮어쓰지 않습니다. 재생성하려면 --force.`,
  );
  process.exit(0);
}

type Kind = "algo" | "ds";
interface Entry {
  name: string; // e.g. mosAlgorithm
  path: string; // 정규 가이드 경로 src/.../<name>-guide.mdx
  dir: string; // 토픽 폴더
  kind: Kind; // algorithms → algo, data-structures → ds
  studyFold: boolean; // 같은 폴더에 <name>-study-guide.mdx 존재 → 편입 대상
  // 진행 상태 (원자적 전환·done-detection 근거)
  status: "pending" | "processing" | "done" | "failed";
  g1: "pass" | "fail" | null; // compile-check
  g4: "pass" | "n/a" | "fail" | null; // check-mermaid
  gate: "PASS" | "FAIL" | null; // 품질 게이트
  extReview: "done" | "skipped" | "n/a" | null; // 외부 검토(배치 0만)
  committedAt: string | null; // 원자적 전환 완료 스탬프(런타임에 채움)
  note: string | null;
}

const all = (
  await Array.fromAsync(new Glob("src/**/*-guide.mdx").scan({ cwd: root }))
)
  .filter((p) => !p.includes("/_deprecated/"))
  .filter((p) => !p.endsWith("-study-guide.mdx"))
  .sort();

const studySet = new Set(
  (
    await Array.fromAsync(
      new Glob("src/**/*-study-guide.mdx").scan({ cwd: root }),
    )
  ).map((p) => p.replace(/-study-guide\.mdx$/, "")),
);

const entries: Entry[] = all.map((path) => {
  const dir = path.slice(0, path.lastIndexOf("/"));
  const base = path.slice(path.lastIndexOf("/") + 1);
  const name = base.replace(/-guide\.mdx$/, "");
  const kind: Kind = path.startsWith("src/algorithms/") ? "algo" : "ds";
  const studyFold = studySet.has(`${dir}/${name}`);
  return {
    name,
    path,
    dir,
    kind,
    studyFold,
    status: "pending",
    g1: null,
    g4: null,
    gate: null,
    extReview: null,
    committedAt: null,
    note: null,
  };
});

const manifest = {
  order: "ORD-004",
  createdNote: "ORD-004 전 가이드 재생성 대상 고정본. 착수 시 1회 생성, 이후 진행 기록.",
  counts: {
    total: entries.length,
    algo: entries.filter((e) => e.kind === "algo").length,
    ds: entries.filter((e) => e.kind === "ds").length,
    studyFold: entries.filter((e) => e.studyFold).length,
  },
  entries,
};

await Bun.write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `✓ ${manifestPath}\n  total=${manifest.counts.total} algo=${manifest.counts.algo} ds=${manifest.counts.ds} studyFold=${manifest.counts.studyFold}`,
);
