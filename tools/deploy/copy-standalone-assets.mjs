#!/usr/bin/env node
/**
 * Standalone Asset Synchronizer
 * 
 * Copies public/ and .next/static/ into .next/standalone/ after next build.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../..");
const STANDALONE_DIR = path.join(ROOT_DIR, ".next/standalone");

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    ensureDirSync(dest);
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log("[deploy:assets] Preparing standalone distribution assets...");

if (!fs.existsSync(STANDALONE_DIR)) {
  console.warn("[deploy:assets] Warning: .next/standalone does not exist. Did next build finish?");
  process.exit(0);
}

// 1. Copy public directory
const sourcePublic = path.join(ROOT_DIR, "public");
const targetPublic = path.join(STANDALONE_DIR, "public");
if (fs.existsSync(sourcePublic)) {
  copyRecursiveSync(sourcePublic, targetPublic);
  console.log("[deploy:assets] Synchronized public/ into .next/standalone/public");
}

// 2. Copy .next/static directory
const sourceStatic = path.join(ROOT_DIR, ".next/static");
const targetStatic = path.join(STANDALONE_DIR, ".next/static");
if (fs.existsSync(sourceStatic)) {
  copyRecursiveSync(sourceStatic, targetStatic);
  console.log("[deploy:assets] Synchronized .next/static/ into .next/standalone/.next/static");
}

console.log("[deploy:assets] Standalone assets ready.");

