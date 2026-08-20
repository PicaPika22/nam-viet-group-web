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
const PUBLISHED_FILE = "src/_data/home.json";
const DRAFT_FILE = "src/_cms/home.draft.json";

class HttpError extends Error {
  constructor(status, body) {
    super(body.message || "Error");
    this.status = status;
    this.body = body;
  }
}

function createStore({
  rootDir,
  fsImpl = fs,
  cryptoImpl = crypto,
  remote = false,
  ghGetFile,
  ghPutFile,
  ghPutBinary,
}) {
  const publishedPath = path.join(rootDir, "src", "_data", "home.json");
  const draftPath = path.join(rootDir, "src", "_cms", "home.draft.json");
  const imageDir = path.join(rootDir, "src", "assets", "img", "home");

  function hashBytes(buffer) {
    return cryptoImpl.createHash("sha256").update(buffer).digest("hex");
  }

  function writeJson(filePath, document) {
    fsImpl.mkdirSync(path.dirname(filePath), { recursive: true });
    fsImpl.writeFileSync(filePath, serialize(document), "utf8");
  }

  function serialize(document) {
    return JSON.stringify(document, null, 2) + "\n";
  }

  function readDocument(filePath) {
    const bytes = fsImpl.readFileSync(filePath);
    return { bytes, document: JSON.parse(bytes.toString("utf8")) };
  }

  async function readRemoteDocument(filePath) {
    const file = await ghGetFile(filePath);
    if (!file) return null;
    const bytes = Buffer.from(file.content, "base64");
    return { bytes, document: JSON.parse(bytes.toString("utf8")), sha: file.sha };
  }

  function stateFromDocuments(draft, published) {
    return {
      draft: draft.document,
      published: published.document,
      draftRevision: remote ? draft.sha : hashBytes(draft.bytes),
      publishedRevision: remote ? published.sha : hashBytes(published.bytes),
      status: documentsEqual(draft.document, published.document) ? "in-sync" : "draft",
    };
  }

  async function getState() {
    if (remote) {
      const published = await readRemoteDocument(PUBLISHED_FILE);
      if (!published) {
        throw new HttpError(404, { error: "Published Home document not found" });
      }
      let draft = await readRemoteDocument(DRAFT_FILE);
      if (!draft) {
        await ghPutFile(
          DRAFT_FILE,
          serialize(published.document),
          "home: initialize draft",
        );
        draft = await readRemoteDocument(DRAFT_FILE);
      }
      return stateFromDocuments(draft, published);
    }

    const published = readDocument(publishedPath);
    if (!fsImpl.existsSync(draftPath)) writeJson(draftPath, published.document);
    const draft = readDocument(draftPath);
    return stateFromDocuments(draft, published);
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

  async function mapWriteError(error, revision) {
    if (error?.status === 409) {
      const current = await getState();
      throw conflict(current, revision);
    }
    throw error;
  }

  async function saveDraft(document, revision) {
    const state = await getState();
    assertRevisions(state, revision);
    const next = applyOrder(mergeLockedHrefs(document, state.published));
    assertValid(next);
    if (remote) {
      try {
        await ghPutFile(
          DRAFT_FILE,
          serialize(next),
          "home: save draft",
          state.draftRevision,
        );
      } catch (error) {
        await mapWriteError(error, revision);
      }
      return getState();
    }
    writeJson(draftPath, next);
    return getState();
  }

  async function publish(revision, publishedRevision) {
    const state = await getState();
    assertRevisions(state, revision, publishedRevision);
    assertValid(state.draft);
    if (remote) {
      const content = serialize(state.draft);
      try {
        await ghPutFile(
          PUBLISHED_FILE,
          content,
          "home: publish homepage",
          state.publishedRevision,
        );
        await ghPutFile(
          DRAFT_FILE,
          content,
          "home: publish homepage",
          state.draftRevision,
        );
      } catch (error) {
        await mapWriteError(error, revision);
      }
      return getState();
    }
    writeJson(publishedPath, state.draft);
    return getState();
  }

  async function discard(revision, publishedRevision) {
    const state = await getState();
    assertRevisions(state, revision, publishedRevision);
    if (remote) {
      try {
        await ghPutFile(
          DRAFT_FILE,
          serialize(state.published),
          "home: discard draft",
          state.draftRevision,
        );
      } catch (error) {
        await mapWriteError(error, revision);
      }
      return getState();
    }
    writeJson(draftPath, state.published);
    return getState();
  }

  async function writeImage({ sectionId, slot, buffer, ext }) {
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
    if (remote) {
      await ghPutBinary(relPath, buffer, `home: upload ${filename}`);
      return {
        url: `/assets/img/home/${filename}`,
        relPath,
      };
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
