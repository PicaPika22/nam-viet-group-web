const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  validateHome,
  mergeLockedHrefs,
  applyOrder,
  documentsEqual,
  isAllowedUpload,
} = require("./schema");

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SAFE_IMAGE_IDENTIFIER = /^[a-z0-9-]+(?::[a-z0-9-]+)?$/i;

class HttpError extends Error {
  constructor(status, body) {
    super(body.message || "Error");
    this.status = status;
    this.body = body;
  }
}

function createStore({ rootDir, fsImpl = fs, cryptoImpl = crypto }) {
  const publishedPath = path.join(rootDir, "src", "_data", "home.json");
  const draftPath = path.join(rootDir, "src", "_cms", "home.draft.json");
  const imageDir = path.join(rootDir, "src", "assets", "img", "home");

  function hashBytes(buffer) {
    return cryptoImpl.createHash("sha256").update(buffer).digest("hex");
  }

  function writeJson(filePath, document) {
    fsImpl.mkdirSync(path.dirname(filePath), { recursive: true });
    fsImpl.writeFileSync(filePath, JSON.stringify(document, null, 2) + "\n", "utf8");
  }

  function readDocument(filePath) {
    const bytes = fsImpl.readFileSync(filePath);
    return { bytes, document: JSON.parse(bytes.toString("utf8")) };
  }

  function getState() {
    const published = readDocument(publishedPath);
    if (!fsImpl.existsSync(draftPath)) {
      writeJson(draftPath, published.document);
    }
    const draft = readDocument(draftPath);
    return {
      draft: draft.document,
      published: published.document,
      draftRevision: hashBytes(draft.bytes),
      publishedRevision: hashBytes(published.bytes),
      status: documentsEqual(draft.document, published.document) ? "in-sync" : "draft",
    };
  }

  function conflict(state, revision) {
    return new HttpError(409, {
      error: "conflict",
      message: "Bản Home đã được cập nhật bởi người khác.",
      currentRevision: state.draftRevision,
      currentPublishedRevision: state.publishedRevision,
      yourRevision: revision,
    });
  }

  function assertRevisions(state, revision, publishedRevision) {
    if (
      revision !== state.draftRevision ||
      (publishedRevision !== undefined && publishedRevision !== state.publishedRevision)
    ) {
      throw conflict(state, revision);
    }
  }

  function assertValid(document) {
    const validation = validateHome(document);
    if (!validation.ok) {
      throw new HttpError(400, {
        error: "Invalid document",
        fields: validation.fields,
      });
    }
  }

  function saveDraft(document, revision) {
    const state = getState();
    assertRevisions(state, revision);
    const next = applyOrder(mergeLockedHrefs(document, state.published));
    assertValid(next);
    writeJson(draftPath, next);
    return getState();
  }

  function publish(revision, publishedRevision) {
    const state = getState();
    assertRevisions(state, revision, publishedRevision);
    assertValid(state.draft);
    writeJson(publishedPath, state.draft);
    return getState();
  }

  function discard(revision, publishedRevision) {
    const state = getState();
    assertRevisions(state, revision, publishedRevision);
    writeJson(draftPath, state.published);
    return getState();
  }

  function writeImage({ sectionId, slot, buffer, ext }) {
    if (
      typeof sectionId !== "string" ||
      typeof slot !== "string" ||
      !SAFE_IMAGE_IDENTIFIER.test(sectionId) ||
      !SAFE_IMAGE_IDENTIFIER.test(slot) ||
      !isAllowedUpload(sectionId, slot)
    ) {
      throw new HttpError(400, { error: "Invalid image slot" });
    }
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
      throw new HttpError(415, { error: "Unsupported image type" });
    }
    if (!Buffer.isBuffer(buffer)) {
      throw new HttpError(400, { error: "Invalid image buffer" });
    }
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new HttpError(413, { error: "Image too large" });
    }
    const filename = `${sectionId}-${slot.replace(/:/g, "-")}-${Date.now()}${ext}`;
    const relPath = path.posix.join("src", "assets", "img", "home", filename);
    const imagePath = path.resolve(imageDir, filename);
    if (path.dirname(imagePath) !== path.resolve(imageDir)) {
      throw new HttpError(400, { error: "Invalid image slot" });
    }
    fsImpl.mkdirSync(imageDir, { recursive: true });
    fsImpl.writeFileSync(imagePath, buffer);
    return {
      url: `/assets/img/home/${filename}`,
      relPath,
    };
  }

  return {
    getState,
    saveDraft,
    publish,
    discard,
    writeImage,
  };
}

module.exports = {
  createStore,
  HttpError,
};
