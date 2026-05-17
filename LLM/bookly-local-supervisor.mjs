import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { openSync } from "node:fs";
import path from "node:path";

const host = process.env.BOOKLY_HOST || "0.0.0.0";
const port = Number(process.env.PORT || process.env.BOOKLY_PORT || 3000);
const cwd = process.cwd();
const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
const out = openSync(path.join(cwd, "bookly-local-supervisor-out.log"), "a");
const err = openSync(path.join(cwd, "bookly-local-supervisor-err.log"), "a");

function cleanEnv() {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key !== "Path" && key.toLowerCase() === "path") delete env[key];
  }
  return env;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canUsePort() {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function start() {
  while (!(await canUsePort())) {
    console.log(`Port ${port} is busy. Waiting...`);
    await wait(1500);
  }

  console.log(`Starting BOOKLY on http://127.0.0.1:${port}/`);
  const child = spawn(process.execPath, [nextBin, "dev", "-H", host, "-p", String(port)], {
    cwd,
    env: cleanEnv(),
    stdio: ["ignore", out, err],
    windowsHide: true
  });

  child.on("exit", async (code, signal) => {
    console.log(`BOOKLY dev server exited with code=${code} signal=${signal}. Restarting...`);
    await wait(1500);
    start();
  });
}

start();
