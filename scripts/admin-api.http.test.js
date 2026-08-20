const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { createCmsApp } = require("./admin-api");

describe("admin-api HTTP lock", () => {
  let server;
  let baseUrl;

  before(async () => {
    const created = createCmsApp({});
    assert.equal(created.ok, true);
    server = http.createServer(created.app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("returns 400 for encoded slash in news slug", async () => {
    const res = await fetch(`${baseUrl}/api/news/foo%2Fbar`);
    assert.equal(res.status, 400);
  });

  it("returns 400 for malformed percent-encoding in news slug", async () => {
    const res = await fetch(`${baseUrl}/api/news/foo%`);
    assert.equal(res.status, 400);
  });

  it("returns 415 for GIF news upload", async () => {
    const form = new FormData();
    form.append("file", new Blob(["GIF89a"], { type: "image/gif" }), "x.gif");
    const res = await fetch(`${baseUrl}/api/upload`, { method: "POST", body: form });
    assert.equal(res.status, 415);
  });
});
