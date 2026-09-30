/**
 * main 을 solutions 브랜치로 병합하되, solutions 쪽 풀이가 main 의 스텁으로 덮이지 않게 한다.
 *
 * 평소 흐름은 main→solutions 한 방향이다. main 이 스텁을 되돌리면(KAN-064 — 새어 든 풀이 24편)
 * solutions 쪽은 병합 기준점 뒤로 그 파일을 안 고쳤으므로 `git merge main` 이 충돌 없이 스텁을
 * 가져와 풀이를 덮는다. 그래서 병합을 커밋하기 전에 한 번 훑는다 — 병합 전 solutions(HEAD)에서는
 * `Not implemented` 가 없던 파일이 병합 뒤 그것을 던지게 됐으면 HEAD 판으로 되살린다. main 이
 * 경로를 옮긴 파일(옛 경로는 지워지고 새 경로에 스텁이 선다)은 같은 파일 이름의 지워진 풀이가
 * 하나뿐일 때만 새 경로로 옮겨 싣는다. 둘 이상이면 고르지 않고 알린다.
 *
 * 목록을 박지 않으므로 이번 24편이 아니라도 같은 규칙이 돈다. 한 번 이렇게 병합하면 기준점이
 * 되돌림 뒤로 옮겨 가서, 그 뒤로는 main 이 그 스텁을 다시 고칠 때만 이 훑기가 일을 한다.
 *
 * 실행(solutions 체크아웃, 작업 트리가 깨끗할 때): `bun run tools/solutions-merge.ts [병합할 ref=main]`
 * 충돌이 나면 되살림까지 한 뒤 커밋하지 않고 멈춘다 — 충돌을 풀고 `git commit` 한다.
 */

import { $ } from "bun";

const STUB = "Not implemented";

export interface Restored {
  path: string;
  /** 경로가 옮겨진 경우 풀이를 가져온 HEAD 쪽 옛 경로. */
  from?: string;
}

export interface Plan {
  restored: Restored[];
  /** 옛 경로 후보가 둘 이상이라 고르지 않은 새 경로. */
  ambiguous: { path: string; candidates: string[] }[];
}

async function show(cwd: string, spec: string): Promise<string | null> {
  const r = await $`git show ${spec}`.cwd(cwd).quiet().nothrow();
  return r.exitCode === 0 ? r.stdout.toString() : null;
}

function base(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

/** 병합이 진행 중인 작업 트리에서 되살릴 파일을 찾는다(쓰지 않는다). */
export async function plan(cwd: string): Promise<Plan> {
  const lines = async (cmd: ReturnType<typeof $>) =>
    (await cmd.cwd(cwd).quiet().text()).split("\n").filter(Boolean);
  // 병합 결과(index)와 HEAD 사이에 바뀐 .ts 파일. 추가(A)·수정(M)·삭제(D)만 본다.
  const diff = await lines(
    $`git diff --cached --no-renames --name-status HEAD`,
  );
  const changed: string[] = [];
  const added: string[] = [];
  const deleted: string[] = [];
  for (const l of diff) {
    const [st, path] = l.split("\t") as [string, string];
    if (!path.endsWith(".ts")) continue;
    if (st === "M") changed.push(path);
    else if (st === "A") added.push(path);
    else if (st === "D") deleted.push(path);
  }
  const restored: Restored[] = [];
  const ambiguous: Plan["ambiguous"] = [];
  const isStub = async (spec: string) =>
    (await show(cwd, spec))?.includes(STUB) ?? false;
  for (const path of changed) {
    const ours = await show(cwd, `HEAD:${path}`);
    if (ours === null || ours.includes(STUB)) continue;
    if (await isStub(`:${path}`)) restored.push({ path });
  }
  const solvedGone: string[] = [];
  for (const path of deleted) {
    const ours = await show(cwd, `HEAD:${path}`);
    if (ours !== null && !ours.includes(STUB)) solvedGone.push(path);
  }
  for (const path of added) {
    if (!(await isStub(`:${path}`))) continue;
    const candidates = solvedGone.filter((p) => base(p) === base(path));
    if (candidates.length === 1)
      restored.push({ path, from: candidates[0] as string });
    else if (candidates.length > 1) ambiguous.push({ path, candidates });
  }
  return { restored, ambiguous };
}

/** `plan` 이 찾은 파일을 HEAD 판으로 되돌려 쓰고 스테이징한다. */
export async function apply(cwd: string, p: Plan): Promise<void> {
  for (const r of p.restored) {
    const body = await show(cwd, `HEAD:${r.from ?? r.path}`);
    if (body === null) throw new Error(`HEAD 에 ${r.from ?? r.path} 가 없다`);
    await Bun.write(`${cwd}/${r.path}`, body);
    await $`git add -- ${r.path}`.cwd(cwd).quiet();
  }
}

/** 병합 → 되살림 → (충돌이 없으면) 커밋. 반환값은 사람이 읽을 보고 줄. */
export async function mergeKeepingSolutions(
  cwd: string,
  ref: string,
): Promise<{ plan: Plan; conflicts: string[]; committed: boolean }> {
  const merge = await $`git merge --no-ff --no-commit ${ref}`
    .cwd(cwd)
    .quiet()
    .nothrow();
  const conflicts = (
    await $`git diff --name-only --diff-filter=U`.cwd(cwd).quiet().text()
  )
    .split("\n")
    .filter(Boolean);
  if (merge.exitCode !== 0 && conflicts.length === 0) {
    const out = `${merge.stdout}${merge.stderr}`;
    if (out.includes("Already up to date"))
      return {
        plan: { restored: [], ambiguous: [] },
        conflicts,
        committed: false,
      };
    throw new Error(`git merge 실패:\n${out}`);
  }
  const p = await plan(cwd);
  await apply(cwd, p);
  if (conflicts.length > 0 || p.ambiguous.length > 0)
    return { plan: p, conflicts, committed: false };
  const branch = (
    await $`git symbolic-ref --short HEAD`.cwd(cwd).quiet().nothrow().text()
  ).trim();
  const msg =
    `Merge branch '${ref}' into ${branch || "HEAD"}` +
    (p.restored.length > 0
      ? `\n\nsolutions-merge: 풀이 ${p.restored.length}편을 스텁 대신 solutions 판으로 보존\n${p.restored
          .map((r) => `- ${r.path}${r.from ? ` (← ${r.from})` : ""}`)
          .join("\n")}`
      : "");
  await $`git commit -q -m ${msg}`.cwd(cwd).quiet();
  return { plan: p, conflicts, committed: true };
}

if (import.meta.main) {
  const cwd = process.cwd();
  const ref = process.argv[2] ?? "main";
  const dirty = (
    await $`git status --porcelain`.cwd(cwd).quiet().text()
  ).trim();
  if (dirty !== "") {
    console.error(
      "작업 트리가 깨끗하지 않습니다 — 먼저 커밋하세요(병합이 미커밋 변경과 섞이지 않게).",
    );
    console.error(dirty);
    process.exit(1);
  }
  const r = await mergeKeepingSolutions(cwd, ref);
  console.log(`되살린 풀이 ${r.plan.restored.length}`);
  for (const x of r.plan.restored)
    console.log(`  ${x.path}${x.from ? `  ← ${x.from}` : ""}`);
  for (const a of r.plan.ambiguous)
    console.log(
      `고르지 않음  ${a.path} — 옛 경로 후보 ${a.candidates.join(", ")}`,
    );
  for (const c of r.conflicts) console.log(`충돌  ${c}`);
  if (r.committed) console.log("병합 커밋 완료");
  else if (r.conflicts.length + r.plan.ambiguous.length > 0) {
    console.log("커밋하지 않았습니다 — 위 항목을 풀고 `git commit` 하세요.");
    process.exit(2);
  } else console.log("병합할 것이 없습니다");
}
