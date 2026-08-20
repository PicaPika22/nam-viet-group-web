const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const { minimalValidDocument } = require("./schema");
const { createStore } = require("./store");
const { mountHomeRoutes } = require("./routes");

function jsonBytes(document) {
  return JSON.stringify(document, null, 2) + "\n";
}

describe("Home CMS routes", () => {
  let rootDir;
  let publishedPath;
  let server;
  let baseUrl;

  beforeEach(async () => {
    rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "home-cms-routes-"));
    publishedPath = path.join(rootDir, "src", "_data", "home.json");
    fs.mkdirSync(path.dirname(publishedPath), { recursive: true });
    fs.writeFileSync(publishedPath, jsonBytes(minimalValidDocument()), "utf8");

    const app = express();
    app.use(express.json());
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 8 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
    });
    mountHomeRoutes(app, { store: createStore({ rootDir }), upload });
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(rootDir, { recursive: true, force: true });
  });

  async function request(pathname, options) {
    const response = await fetch(`${baseUrl}${pathname}`, options);
    const body = await response.json();
    return { response, body };
  }

  async function getState() {
    return request("/api/home");
  }

  it("returns the published and draft Home documents", async () => {
    const { response, body } = await getState();

    assert.equal(response.status, 200);
    assert.equal(body.draft.sections.length, 12);
    assert.equal(typeof body.draftRevision, "string");
  });

  it("returns 409 when saving with a stale revision", async () => {
    const { body: state } = await getState();

    const { response, body } = await request("/api/home/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document: state.draft, revision: "stale" }),
    });

    assert.equal(response.status, 409);
    assert.equal(body.error, "conflict");
    assert.equal(body.currentRevision, state.draftRevision);
  });

  it("saves a draft without changing the published document", async () => {
    const { body: state } = await getState();
    state.draft.sections.find((section) => section.id === "hero").visible = false;

    const { response, body } = await request("/api/home/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document: state.draft, revision: state.draftRevision }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.draft.sections.find((section) => section.id === "hero").visible, false);
    const published = JSON.parse(fs.readFileSync(publishedPath, "utf8"));
    assert.equal(published.sections.find((section) => section.id === "hero").visible, true);
  });

  it("publishes the current draft with matching revisions", async () => {
    const { body: state } = await getState();
    state.draft.sections.find((section) => section.id === "hero").visible = false;
    const { body: saved } = await request("/api/home/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document: state.draft, revision: state.draftRevision }),
    });

    const { response, body } = await request("/api/home/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revision: saved.draftRevision,
        publishedRevision: state.publishedRevision,
      }),
    });

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    const published = JSON.parse(fs.readFileSync(publishedPath, "utf8"));
    assert.equal(published.sections.find((section) => section.id === "hero").visible, false);
  });

  it("rejects an image upload for an unknown slot", async () => {
    const form = new FormData();
    form.append("sectionId", "hero");
    form.append("slot", "bogus");
    form.append("file", new Blob([Buffer.from("png")], { type: "image/png" }), "hero.png");

    const { response, body } = await request("/api/home/images", {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, 400);
    assert.equal(body.error, "Invalid image slot");
  });

  it("replaces a client-supplied href with the locked href", async () => {
    const { body: state } = await getState();
    state.draft.sections.find((section) => section.id === "hero").cta.primary.href =
      "https://evil.example";

    const { response, body } = await request("/api/home/draft", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document: state.draft, revision: state.draftRevision }),
    });

    assert.equal(response.status, 200);
    assert.equal(
      body.draft.sections.find((section) => section.id === "hero").cta.primary.href,
      "/#about",
    );
  });
});
