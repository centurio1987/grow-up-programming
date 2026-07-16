/**
 * ORD-004 워크플로우 args 생성기 — 카테고리별 잔여 가이드 목록을 워크플로우 args JSON으로 출력.
 * 사용: bun run tools/ord004-emit-args.ts <category>   (예: data-structures/hash)
 */
import { existsSync, readFileSync } from "node:fs";

const category = process.argv[2];
if (!category) {
  console.error("usage: bun run tools/ord004-emit-args.ts <category>  (예: algorithms/sorting)");
  process.exit(1);
}
const m = JSON.parse(readFileSync("tools/ord004-manifest.json", "utf8"));
const factSensitive = /number-theory|geometry|string/.test(category);
const guides = m.entries
  .filter((e: any) => e.status !== "done" && e.path.startsWith(`src/${category}/`))
  .map((e: any) => {
    const problem = existsSync(`${e.dir}/${e.name}-problem.md`) ? `${e.dir}/${e.name}-problem.md` : null;
    const ts = existsSync(`${e.dir}/${e.name}.ts`) ? `${e.dir}/${e.name}.ts` : null;
    const g = readFileSync(e.path, "utf8");
    return {
      name: e.name,
      path: e.path,
      dir: e.dir,
      kind: e.kind,
      problem,
      ts,
      oldHasSim: /export const \w+\s*=|AlgorithmSimulation/.test(g),
      oldHasMermaid: /```mermaid/.test(g),
    };
  });
console.log(JSON.stringify({ category, factSensitive, guides }));
console.error(`# ${category}: ${guides.length}종${factSensitive ? " [사실성→외부검토]" : ""}`);
