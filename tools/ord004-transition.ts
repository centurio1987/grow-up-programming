/**
 * ORD-004 원자적 전환 — 검증을 통과한 신규 가이드를 정규 경로로 교체하고 구본을 폐기한다.
 *
 * 순서(중단 안전): 구 정규본 → `_deprecated/`(v1.0.0) 이동 → 신규본을 정규명(v2.0.0)으로 배치 →
 * manifest 갱신. 호출 전에 신규본이 G1/G4/품질 게이트를 통과했어야 한다(이 스크립트는 배치만 담당).
 *
 * 사용: bun run tools/ord004-transition.ts <name> <new-content.mdx> \
 *          [--g1 pass] [--g4 pass|n/a] [--gate PASS] [--ext done|skipped|n/a] [--note "..."]
 *
 * <name> 은 manifest 의 토픽 이름(예: mosAlgorithm). 신규 콘텐츠 파일은 임시본 경로.
 */
import { $ } from "bun";
import { dirname, join } from "node:path";
import { mkdir, rename } from "node:fs/promises";

function flag(name: string, dflt: string | null = null): string | null {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : dflt;
}

const [name, newPath] = process.argv.slice(2);
if (!name || !newPath || newPath.startsWith("--")) {
  console.error(
    "usage: bun run tools/ord004-transition.ts <name> <new-content.mdx> [--g1 pass] [--g4 pass|n/a] [--gate PASS] [--ext done|skipped|n/a] [--note ...]",
  );
  process.exit(1);
}

const root = process.cwd();
const manifestPath = join(root, "tools/ord004-manifest.json");
const manifest = JSON.parse(await Bun.file(manifestPath).text());
const entry = manifest.entries.find((e: any) => e.name === name);
if (!entry) {
  console.error(`manifest에 '${name}' 항목이 없습니다.`);
  process.exit(1);
}

const canonical = join(root, entry.path); // src/.../<name>-guide.mdx
const dir = dirname(canonical);
const deprecatedDir = join(dir, "_deprecated");
const deprecated = join(deprecatedDir, `${name}-guide.mdx`);

if (!(await Bun.file(newPath).exists())) {
  console.error(`신규 콘텐츠 파일이 없습니다: ${newPath}`);
  process.exit(1);
}

/** 파일 맨 위에 YAML 프론트매터를 부여(기존 프론트매터가 있으면 교체). */
function withFrontmatter(text: string, fields: Record<string, string>): string {
  const body = text.replace(/^---\n[\s\S]*?\n---\n+/, "");
  const yaml = Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return `---\n${yaml}\n---\n\n${body.replace(/^\n+/, "")}`;
}

// 1) 구 정규본 → _deprecated/ (v1.0.0). git mv 로 이력 보존.
await mkdir(deprecatedDir, { recursive: true });
if (await Bun.file(canonical).exists()) {
  try {
    await $`git mv ${canonical} ${deprecated}`.quiet();
  } catch {
    await rename(canonical, deprecated); // git 추적 밖이면 일반 이동
  }
  const oldText = await Bun.file(deprecated).text();
  await Bun.write(
    deprecated,
    withFrontmatter(oldText, { version: "1.0.0", deprecated: "true" }),
  );
}

// 2) 신규본 → 정규명 (v2.0.0).
const newText = await Bun.file(newPath).text();
await Bun.write(canonical, withFrontmatter(newText, { version: "2.0.0" }));
// 임시본 정리
if (newPath !== canonical) await $`rm -f ${newPath}`.quiet().nothrow();

// 3) manifest 갱신.
entry.status = flag("--gate") === "FAIL" ? "failed" : "done";
entry.g1 = flag("--g1", entry.g1);
entry.g4 = flag("--g4", entry.g4);
entry.gate = flag("--gate", entry.gate);
entry.extReview = flag("--ext", entry.extReview);
if (flag("--note")) entry.note = flag("--note");
entry.committedAt = new Date().toISOString();
await Bun.write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(
  `✓ ${name}: ${entry.path} (v2.0.0) · deprecated → _deprecated/${name}-guide.mdx (v1.0.0)\n  status=${entry.status} g1=${entry.g1} g4=${entry.g4} gate=${entry.gate} ext=${entry.extReview}`,
);
