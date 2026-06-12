# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 프로젝트 목적

- 이 프로젝트는 코드 테스트 문제 풀이 목적입니다.
- 파일 내부 주석에는 문제가 서술되어있습니다.
- 주석에 적힌 문제를 보고, 문제를 풀기 위해 필요한 함수를 선언합니다.
- 주석에 적힌 문제와 함수를 보고, 대응하는 테스트 코드를 생성해야 합니다.

## Runtime & Package Manager

This project uses **Bun** exclusively. Do not use Node.js, npm, yarn, pnpm, or npx.

- Run files: `bun index.ts` or `bun --hot index.ts` (with hot reload)
- Install dependencies: `bun install`
- Run scripts: `bun run <script>`
- Run packages: `bunx <package> <command>`
- Bun auto-loads `.env` — no dotenv needed

## Testing

```bash
bun test                        # run all tests
bun test index.test.ts          # run a single test file
bun test --watch                # watch mode
```

Test files use `bun:test` (Jest-compatible API):

```ts
import { test, expect } from "bun:test";
```

## Preferred APIs (use Bun built-ins, not npm packages)

| Task | Use | Avoid |
|------|-----|-------|
| HTTP server | `Bun.serve()` | `express` |
| SQLite | `bun:sqlite` | `better-sqlite3` |
| Redis | `Bun.redis` | `ioredis` |
| Postgres | `Bun.sql` | `pg`, `postgres.js` |
| WebSocket | built-in `WebSocket` | `ws` |
| File I/O | `Bun.file()` | `fs.readFile/writeFile` |
| Shell | `Bun.$\`cmd\`` | `execa` |

## Frontend (if applicable)

Use `Bun.serve()` with HTML imports — do not use Vite or Webpack. HTML files can directly import `.tsx`/`.jsx` and CSS; Bun bundles automatically.

## TypeScript

Strict mode is enabled. Key settings in `tsconfig.json`:
- `moduleResolution: "bundler"` — use Bun's resolver, not Node's
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `noUncheckedIndexedAccess: true` — array/object access may return `undefined`
- `noEmit: true` — Bun handles transpilation directly
