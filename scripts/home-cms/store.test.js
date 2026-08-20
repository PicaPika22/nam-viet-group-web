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

function createFakeGitHub(initialFiles) {
  const files = new Map();
  const calls = [];
  let revision = 1;
  let conflictPath;

  for (const [filePath, content] of Object.entries(initialFiles)) {
    files.set(filePath, { content, sha: `sha-${revision++}` });
  }

  return {
    files,
    calls,
    conflictNextPut(filePath) {
      conflictPath = filePath;
    },
    async ghGetFile(filePath) {
      const file = files.get(filePath);
      return file
        ? { content: Buffer.from(file.content).toString("base64"), sha: file.sha }
        : null;
    },
    async ghPutFile(filePath, content, message, sha) {
      calls.push({ type: "file", filePath, content, message, sha });
      const current = files.get(filePath);
      if (filePath === conflictPath) {
        conflictPath = undefined;
        current.sha = `sha-${revision++}`;
        const error = new Error("sha does not match");
        error.status = 409;
        throw error;
      }
      if ((current?.sha || undefined) !== sha) {
        const error = new Error("sha does not match");
        error.status = 409;
        throw error;
      }
      const next = { content, sha: `sha-${revision++}` };
      files.set(filePath, next);
      return { content: { sha: next.sha } };
    },
    async ghPutBinary(filePath, buffer, message, sha) {
      calls.push({ type: "binary", filePath, buffer, message, sha });
      const next = { content: Buffer.from(buffer), sha: `sha-${revision++}` };
      files.set(filePath, next);
      return { content: { sha: next.sha } };
    },
  };
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

  it("creates draft when only published exists and reports in-sync", async () => {
    const store = createStore({ rootDir });

    const state = await store.getState();

    assert.equal(fs.existsSync(draftPath), true);
    assert.equal(state.status, "in-sync");
    assert.deepEqual(state.draft, state.published);
  });

  it("throws a 409 HttpError with currentRevision for a stale draft save", async () => {
    const store = createStore({ rootDir });
    const state = await store.getState();

    await assert.rejects(
      store.saveDraft(state.draft, "wrong-revision"),
      (error) =>
        error instanceof HttpError &&
        error.status === 409 &&
        error.body.currentRevision === state.draftRevision,
    );
  });

  it("writes a matching draft without changing published bytes and reports draft", async () => {
    const store = createStore({ rootDir });
    const state = await store.getState();
    const publishedBefore = fs.readFileSync(publishedPath);
    state.draft.sections[0].visible = false;

    const next = await store.saveDraft(state.draft, state.draftRevision);

    assert.deepEqual(fs.readFileSync(publishedPath), publishedBefore);
    assert.equal(next.draft.sections[0].visible, false);
    assert.equal(next.status, "draft");
  });

  it("publishes draft onto published, changes both revisions, and reports in-sync", async () => {
    const store = createStore({ rootDir });
    const initial = await store.getState();
    initial.draft.sections[0].visible = false;
    const saved = await store.saveDraft(initial.draft, initial.draftRevision);

    const published = await store.publish(saved.draftRevision, saved.publishedRevision);

    assert.notEqual(published.draftRevision, initial.draftRevision);
    assert.notEqual(published.publishedRevision, initial.publishedRevision);
    assert.deepEqual(fs.readFileSync(draftPath), fs.readFileSync(publishedPath));
    assert.equal(published.status, "in-sync");
  });

  it("stores the canonical hero primary href instead of a client href", async () => {
    const store = createStore({ rootDir });
    const state = await store.getState();
    state.draft.sections[0].cta.primary.href = "https://evil";

    const next = await store.saveDraft(state.draft, state.draftRevision);

    assert.equal(next.draft.sections[0].cta.primary.href, "/#about");
  });

  it("writes an allowed image without modifying either JSON file", async () => {
    const store = createStore({ rootDir });
    await store.getState();
    const draftBefore = fs.readFileSync(draftPath);
    const publishedBefore = fs.readFileSync(publishedPath);

    const result = await store.writeImage({
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

  it("rejects path traversal in an otherwise allowed image slot", async () => {
    const store = createStore({ rootDir });
    const imageDir = path.join(rootDir, "src", "assets", "img", "home");

    await assert.rejects(
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

  it("rejects image buffers larger than 8 MB", async () => {
    const store = createStore({ rootDir });

    await assert.rejects(
      store.writeImage({
        sectionId: "hero",
        slot: "art",
        buffer: Buffer.alloc(8 * 1024 * 1024 + 1),
        ext: ".webp",
      }),
      (error) => error instanceof HttpError && error.status === 413,
    );
  });

  it("rejects unsupported image extensions", async () => {
    const store = createStore({ rootDir });

    await assert.rejects(
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

describe("createStore remote mode", () => {
  const publishedFile = "src/_data/home.json";
  const draftFile = "src/_cms/home.draft.json";
  let github;
  let store;

  beforeEach(() => {
    const document = jsonBytes(minimalValidDocument());
    github = createFakeGitHub({
      [publishedFile]: document,
      [draftFile]: document,
    });
    store = createStore({
      rootDir: "unused",
      remote: true,
      ghGetFile: github.ghGetFile,
      ghPutFile: github.ghPutFile,
      ghPutBinary: github.ghPutBinary,
    });
  });

  it("uses GitHub file SHAs as remote revisions", async () => {
    const state = await store.getState();

    assert.equal(state.publishedRevision, "sha-1");
    assert.equal(state.draftRevision, "sha-2");
  });

  it("saves the draft through GitHub using its existing SHA", async () => {
    const state = await store.getState();
    state.draft.sections[0].visible = false;

    const next = await store.saveDraft(state.draft, state.draftRevision);

    assert.deepEqual(
      github.calls.at(-1),
      {
        type: "file",
        filePath: draftFile,
        content: jsonBytes(next.draft),
        message: "home: save draft",
        sha: "sha-2",
      },
    );
    assert.equal(next.draftRevision, "sha-3");
  });

  it("publishes identical content to published and draft through GitHub", async () => {
    const state = await store.getState();
    state.draft.sections[0].visible = false;
    const saved = await store.saveDraft(state.draft, state.draftRevision);
    github.calls.length = 0;

    const next = await store.publish(saved.draftRevision, saved.publishedRevision);

    assert.equal(github.calls.length, 2);
    assert.deepEqual(
      github.calls.map(({ filePath, message, sha }) => ({ filePath, message, sha })),
      [
        {
          filePath: publishedFile,
          message: "home: publish homepage",
          sha: "sha-1",
        },
        {
          filePath: draftFile,
          message: "home: publish homepage",
          sha: "sha-3",
        },
      ],
    );
    assert.equal(github.calls[0].content, github.calls[1].content);
    assert.equal(next.status, "in-sync");
  });

  it("uploads image bytes through GitHub", async () => {
    const result = await store.writeImage({
      sectionId: "hero",
      slot: "art",
      buffer: Buffer.from("webp"),
      ext: ".webp",
    });

    const call = github.calls.at(-1);
    assert.equal(call.type, "binary");
    assert.equal(call.filePath, result.relPath);
    assert.deepEqual(call.buffer, Buffer.from("webp"));
  });

  it("maps a GitHub SHA mismatch to HttpError 409", async () => {
    const state = await store.getState();
    github.conflictNextPut(draftFile);

    await assert.rejects(
      store.saveDraft(state.draft, state.draftRevision),
      (error) =>
        error instanceof HttpError &&
        error.status === 409 &&
        error.body.currentRevision === "sha-3",
    );
  });
});
