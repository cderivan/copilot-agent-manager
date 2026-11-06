const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");
const tests = process.argv.includes("--tests");

/** @type {import('esbuild').BuildOptions} */
const shared = {
  bundle: true,
  sourcemap: !production,
  minify: production,
  logLevel: "info",
};

const builds = [
  {
    ...shared,
    entryPoints: ["src/extension.ts"],
    outfile: "out/extension.js",
    platform: "node",
    format: "cjs",
    target: "node18",
    external: ["vscode"],
  },
  {
    ...shared,
    entryPoints: ["src/webview/index.tsx"],
    outfile: "out/webview.js",
    platform: "browser",
    format: "iife",
    target: "es2020",
  },
];

async function buildTests() {
  const dir = "tests";
  const entryPoints = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".test.ts"))
    .map((name) => path.join(dir, name));
  await esbuild.build({
    ...shared,
    entryPoints,
    outdir: "out/tests",
    platform: "node",
    format: "cjs",
    target: "node18",
  });
  const fixtures = path.join(dir, "fixtures");
  if (fs.existsSync(fixtures)) {
    fs.cpSync(fixtures, path.join("out", "tests", "fixtures"), { recursive: true });
  }
}

async function main() {
  if (watch) {
    const contexts = await Promise.all(builds.map((options) => esbuild.context(options)));
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    return;
  }
  if (tests) {
    await buildTests();
    return;
  }
  await Promise.all(builds.map((options) => esbuild.build(options)));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
