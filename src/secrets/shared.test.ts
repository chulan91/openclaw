import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeTextFileAtomic } from "./shared.js";

describe("writeTextFileAtomic", () => {
  let tmpDir: string;

  function setup(): string {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "openclaw-shared-test-"));
    return tmpDir;
  }

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("writes file atomically with correct content", () => {
    const dir = setup();
    const filePath = path.join(dir, "test.txt");
    writeTextFileAtomic(filePath, "hello world");
    expect(fs.readFileSync(filePath, "utf8")).toBe("hello world");
  });

  it("sets restrictive file permissions by default", () => {
    const dir = setup();
    const filePath = path.join(dir, "secret.txt");
    writeTextFileAtomic(filePath, "secret-content");
    const stat = fs.statSync(filePath);
    // 0o600 = owner read/write only
    expect(stat.mode & 0o777).toBe(0o600);
  });

  it("respects custom file mode", () => {
    const dir = setup();
    const filePath = path.join(dir, "custom.txt");
    writeTextFileAtomic(filePath, "content", 0o644);
    const stat = fs.statSync(filePath);
    expect(stat.mode & 0o777).toBe(0o644);
  });

  it("does not leave temp files on success", () => {
    const dir = setup();
    const filePath = path.join(dir, "clean.txt");
    writeTextFileAtomic(filePath, "content");
    const remaining = fs.readdirSync(dir);
    expect(remaining).toEqual(["clean.txt"]);
  });

  it("uses unpredictable temp file names (no PID or timestamp pattern)", () => {
    const dir = setup();
    const filePath = path.join(dir, "rand.txt");
    // Write several files and verify no temp files remain
    for (let i = 0; i < 5; i++) {
      writeTextFileAtomic(filePath, `content-${i}`);
    }
    const remaining = fs.readdirSync(dir);
    expect(remaining).toEqual(["rand.txt"]);
    expect(fs.readFileSync(filePath, "utf8")).toBe("content-4");
  });

  it("creates parent directories if they don't exist", () => {
    const dir = setup();
    const filePath = path.join(dir, "a", "b", "c", "nested.txt");
    writeTextFileAtomic(filePath, "nested-content");
    expect(fs.readFileSync(filePath, "utf8")).toBe("nested-content");
  });
});
