#!/usr/bin/env node
// 產生或讀回 Cloudflare 資源名稱，輸出一行 JSON。只用 Node 內建模組，技能本來就要求 Node ≥ 20。
//
//   node resource-name.mjs                  有設定檔就讀回，沒有才產生
//   node resource-name.mjs --name my-blog   使用者指定 Worker 名稱
//   node resource-name.mjs --check abc-123  只檢查名稱是否合法
//
// 刻意不讀帳號 Email：名稱會進公開網址與 wrangler.jsonc，防撞名靠隨機數字。
import { randomInt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const NAME_RULE = /^[a-z]([a-z0-9-]{0,61}[a-z0-9])?$/;
const CONFIG_FILES = ["wrangler.jsonc", "wrangler.json", "wrangler.toml"];
const SLUG_MAX = 30;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readText(path) {
  return readFileSync(path, "utf8").replace(/^﻿/, "");
}

function parseJsonc(text) {
  // 先比對字串，網址裡的 // 才不會被當成註解
  const noComments = text.replace(
    /("(?:[^"\\]|\\.)*")|\/\/.*$|\/\*[\s\S]*?\*\//gm,
    (_match, string) => string ?? "",
  );
  return JSON.parse(noComments.replace(/,(\s*[}\]])/g, "$1"));
}

function readConfig(path) {
  const text = readText(path);
  if (path.endsWith(".toml")) {
    // name 只算第一個 [table] 之前的頂層欄位
    const top = text.split(/^\s*\[/m)[0];
    return {
      name: top.match(/^\s*name\s*=\s*["']([^"']+)["']/m)?.[1],
      database: text.match(/^\s*database_name\s*=\s*["']([^"']+)["']/m)?.[1],
    };
  }
  const config = parseJsonc(text);
  return { name: config.name, database: config.d1_databases?.[0]?.database_name };
}

function findExisting() {
  for (const path of CONFIG_FILES) {
    if (!existsSync(path)) continue;
    let config;
    try {
      config = readConfig(path);
    } catch (error) {
      // 讀不懂就停下：重新產生會讓名稱與已建立的資源對不起來
      fail(`無法解析 ${path}：${error.message}`);
    }
    if (config.name) return { ...config, path };
  }
  return null;
}

function projectSlug() {
  let name = "";
  try {
    name = JSON.parse(readText("package.json")).name ?? "";
  } catch {
    // 沒有 package.json 或解析失敗就用預設值
  }
  const slug = name
    .replace(/^@[^/]+\//, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/, "");
  return /^[a-z]/.test(slug) ? slug : "site";
}

function print(result) {
  console.log(JSON.stringify(result));
}

function main(args) {
  const flag = args[0];
  if (flag === "--check") {
    const name = args[1] ?? "";
    const valid = NAME_RULE.test(name);
    print({ name, valid });
    process.exit(valid ? 0 : 1);
  }
  if (flag === "--name") {
    const name = args[1] ?? "";
    if (!NAME_RULE.test(name)) fail(`名稱不合法：${name}（小寫英數與連字號、字母開頭、最多 63 字）`);
    print({ source: "specified", worker: name, d1: `${name}-db` });
    return;
  }
  if (flag !== undefined) fail(`不認得的參數：${flag}`);

  const existing = findExisting();
  if (existing) {
    print({
      source: existing.path,
      worker: existing.name,
      d1: existing.database ?? `${existing.name}-db`,
    });
    return;
  }

  const nickname = `cf-${String(randomInt(1_000_000)).padStart(6, "0")}`;
  const worker = `${nickname}-${projectSlug()}`;
  print({ source: "generated", nickname, subdomain: nickname, worker, d1: `${worker}-db` });
}

main(process.argv.slice(2));
