import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  openDB,
  saveProject,
  loadProject,
  deleteProjectData,
  _resetDB,
} from "../src/db.js";

beforeEach(() => {
  _resetDB();
});

afterEach(() => {
  _resetDB();
});

describe("db.js", () => {
  it("openDB returns a database instance", async () => {
    const db = await openDB();
    expect(db).toBeDefined();
    expect(db.name).toBe("wallPreviewer");
  });

  it("openDB returns the same instance on repeated calls", async () => {
    const db1 = await openDB();
    const db2 = await openDB();
    expect(db1).toBe(db2);
  });

  it("saveProject and loadProject round-trip", async () => {
    const payload = { version: 3, image: "data:img", mask: [[0, 4]] };
    await saveProject("abc", payload);

    const loaded = await loadProject("abc");
    expect(loaded).toEqual(payload);
  });

  it("loadProject returns undefined for missing key", async () => {
    const result = await loadProject("nonexistent");
    expect(result).toBeUndefined();
  });

  it("saveProject overwrites existing data", async () => {
    await saveProject("abc", { v: 1 });
    await saveProject("abc", { v: 2 });

    const loaded = await loadProject("abc");
    expect(loaded).toEqual({ v: 2 });
  });

  it("deleteProjectData removes the record", async () => {
    await saveProject("abc", { v: 1 });
    await deleteProjectData("abc");

    const loaded = await loadProject("abc");
    expect(loaded).toBeUndefined();
  });

  it("deleteProjectData is a no-op for missing key", async () => {
    await expect(deleteProjectData("nonexistent")).resolves.toBeUndefined();
  });

  it("stores multiple projects independently", async () => {
    await saveProject("a", { name: "A" });
    await saveProject("b", { name: "B" });

    expect(await loadProject("a")).toEqual({ name: "A" });
    expect(await loadProject("b")).toEqual({ name: "B" });

    await deleteProjectData("a");
    expect(await loadProject("a")).toBeUndefined();
    expect(await loadProject("b")).toEqual({ name: "B" });
  });
});
