/** The one Node API vite.config.ts uses. Only tsconfig.node.json sees it, so browser code cannot import it. */
declare module 'node:fs' {
    export function readFileSync(path: URL, encoding: 'utf8'): string;
}
