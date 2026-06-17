/**
 * 해설서 조립기 — 기존 `*-guide.md`(산문)는 그대로 두고, 맨 위에 `#guide-sim` import 한 줄과
 * `## 수도 코드와 Activity Diagram` 앞에 시뮬레이션 섹션을 삽입해 `*-guide.mdx`를 만든다.
 *
 * 산문을 다시 타이핑하지 않기 위한 도구. 시뮬레이션 섹션(시각화 데이터)만 별도 파일로 작성해 넘긴다.
 *
 * 사용: bun run tools/guide-preview/build-mdx.ts <guide.md> <sim-section.mdx>
 */
const [mdPath, simPath] = process.argv.slice(2);
if (!mdPath || !simPath) {
  console.error("usage: build-mdx.ts <guide.md> <sim-section.mdx>");
  process.exit(1);
}

const md = await Bun.file(mdPath).text();
const sim = (await Bun.file(simPath).text()).trim();

const ANCHOR = "## 수도 코드와 Activity Diagram";
const idx = md.indexOf(ANCHOR);
if (idx < 0) {
  console.error(`anchor not found in ${mdPath}: "${ANCHOR}"`);
  process.exit(1);
}

const importLine = 'import { AlgorithmSimulation } from "#guide-sim";\n\n';
const before = md.slice(0, idx).trimEnd();
const after = md.slice(idx);
const out = `${importLine}${before}\n\n${sim}\n\n${after}`;

const mdxPath = mdPath.replace(/-guide\.md$/, "-guide.mdx");
await Bun.write(mdxPath, out);
console.log(`✓ ${mdxPath}`);
