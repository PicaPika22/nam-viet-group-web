const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { minimalValidDocument } = require("./schema");
const { createStore, HttpError } = require("./store");

function jsonBytes(document) {
  return JSON.stringify(document, null, 2) + "\n";
}

describe("createStore", () => {
  let rootDir;
  let publishedPath;
  let draftPath;

  beforeEach(() => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "home-cms-store-"));
    publishedPath = path.join(rootDir, "src", "_data", "home.json");
    draftPath = path.join(rootDir, "src", "_cms", "home.draft.json");
    fs.mkdirSync(path.dirname(publishedPath), { recursive: true });
    fs.mkdirSync(path.dirname(draftPath), { recursive: true });
    fs.writeFileSync(publishedPath, jsonBytes(minimalValidDocument()), "utf8");
  });

  afterEach(() => {
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  it("creates draft when only published exists and reports in-sync", () => {
    const store = createStore({ rootDir });

    const state = store.getState();

    assert.equal(fs.existsSync(draftPath), true);
    assert.equal(state.status, "in-sync");
    assert.deepEqual(state.draft, state.published);
  });

  it("throws a 409 HttpError with currentRevision for a stale draft save", () => {
    const store = createStore({ rootDir });
    const state = store.getState();

    assert.throws(
      () => store.saveDraft(state.draft, "wrong-revision"),
      (error) =>
        error instanceof HttpError &&
        error.status === 409 &&
        error.body.currentRevision === state.draftRevision,
    );
  });

  it("writes a matching draft without changing published bytes and reports draft", () => {
    const store = createStore({ rootDir });
    const state = store.getState();
    const publishedBefore = fs.readFileSync(publishedPath);
    state.draft.sections[0].visible = false;

    const next = store.saveDraft(state.draft, state.draftRevision);

    assert.deepEqual(fs.readFileSync(publishedPath), publishedBefore);
    assert.equal(next.draft.sections[0].visible, false);
    assert.equal(next.status, "draft");
  });

  it("publishes draft onto published, changes both revisions, and reports in-sync", () => {
    const store = createStore({ rootDir });
    const initial = store.getState();
    initial.draft.sections[0].visible = false;
    const saved = store.saveDraft(initial.draft, initial.draftRevision);

    const published = store.publish(saved.draftRevision, saved.publishedRevision);

    assert.notEqual(published.draftRevision, initial.draftRevision);
    assert.notEqual(published.publishedRevision, initial.publishedRevision);
    assert.deepEqual(fs.readFileSync(draftPath), fs.readFileSync(publishedPath));
    assert.equal(published.status, "in-sync");
  });

  it("stores the canonical hero primary href instead of a client href", () => {
    const store = createStore({ rootDir });
    const state = store.getState();
    state.draft.sections[0].cta.primary.href = "https://evil";

    const next = store.saveDraft(state.draft, state.draftRevision);

    assert.equal(next.draft.sections[0].cta.primary.href, "/#about");
  });

  it("writes an allowed image without modifying either JSON file", () => {
    const store = createStore({ rootDir });
    store.getState();
    const draftBefore = fs.readFileSync(draftPath);
    const publishedBefore = fs.readFileSync(publishedPath);

    const result = store.writeImage({
      sectionId: "hero",
      slot: "art",
      buffer: Buffer.from("webp"),
      ext: ".webp",
    });

    assert.match(result.url, /^\/assets\/img\/home\/hero-art-\d+\.webp$/);
    assert.match(result.relPath, /^src\/assets\/img\/home\/hero-art-\d+\.webp$/);
    assert.deepEqual(fs.readFileSync(draftPath), draftBefore);
    assert.deepEqual(fs.readFileSync(publishedPath), publishedBefore);
    assert.deepEqual(fs.readFileSync(path.join(rootDir, result.relPath)), Buffer.from("webp"));
  });

  it("rejects path traversal in an otherwise allowed image slot", () => {
    const store = createStore({ rootDir });
    const imageDir = path.join(rootDir, "src", "assets", "img", "home");

    assert.throws(
      () =>
        store.writeImage({
          sectionId: "milestones",
          slot: "timeline:../../etc",
          buffer: Buffer.from("webp"),
          ext: ".webp",
        }),
      (error) => error instanceof HttpError && error.status === 400,
    );
    assert.equal(fs.existsSync(imageDir), false);
  });

  it("rejects image buffers larger than 8 MB", () => {
    const store = createStore({ rootDir });

    assert.throws(
      () =>
        store.writeImage({
          sectionId: "hero",
          slot: "art",
          buffer: Buffer.alloc(8 * 1024 * 1024 + 1),
          ext: ".webp",
        }),
      (error) => error instanceof HttpError && error.status === 413,
    );
  });

  it("rejects unsupported image extensions", () => {
    const store = createStore({ rootDir });

    assert.throws(
      () =>
        store.writeImage({
          sectionId: "hero",
          slot: "art",
          buffer: Buffer.from("gif"),
          ext: ".gif",
        }),
      (error) => error instanceof HttpError && error.status === 415,
    );
  });
});
