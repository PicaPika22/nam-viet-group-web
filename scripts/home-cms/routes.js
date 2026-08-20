const path = require("node:path");
const { HttpError } = require("./store");
const { isAllowedUpload } = require("./schema");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function sendError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).json(error.body);
  }
  return res.status(500).json({ error: "Internal server error" });
}

function route(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendError(res, error);
    }
  };
}

function mountHomeRoutes(app, { store, upload }) {
  app.get(
    "/api/home",
    route(async (_req, res) => {
      res.json(await store.getState());
    }),
  );

  app.put(
    "/api/home/draft",
    route(async (req, res) => {
      const state = await store.saveDraft(req.body?.document, req.body?.revision);
      res.json({
        ok: true,
        draft: state.draft,
        draftRevision: state.draftRevision,
      });
    }),
  );

  app.post(
    "/api/home/publish",
    route(async (req, res) => {
      const state = await store.publish(req.body?.revision, req.body?.publishedRevision);
      res.json({
        ok: true,
        publishedRevision: state.publishedRevision,
        draftRevision: state.draftRevision,
      });
    }),
  );

  app.post(
    "/api/home/discard",
    route(async (req, res) => {
      const state = await store.discard(req.body?.revision, req.body?.publishedRevision);
      res.json(state);
    }),
  );

  app.post("/api/home/images", (req, res) => {
    upload.single("file")(req, res, async (uploadError) => {
      try {
        if (uploadError) {
          if (uploadError.code === "LIMIT_FILE_SIZE") {
            throw new HttpError(413, { error: "Image too large" });
          }
          if (uploadError.message === "Chỉ nhận file ảnh") {
            throw new HttpError(415, { error: "Unsupported image type" });
          }
          throw uploadError;
        }
        if (!req.file) throw new HttpError(400, { error: "No file" });

        const { sectionId, slot } = req.body || {};
        if (!isAllowedUpload(sectionId, slot)) {
          throw new HttpError(400, { error: "Invalid image slot" });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        if (
          !ALLOWED_IMAGE_TYPES.has(req.file.mimetype) ||
          !ALLOWED_IMAGE_EXTENSIONS.has(ext)
        ) {
          throw new HttpError(415, { error: "Unsupported image type" });
        }

        const image = await store.writeImage({
          sectionId,
          slot,
          buffer: req.file.buffer,
          ext,
        });
        res.json({ ok: true, url: image.url, sectionId, slot });
      } catch (error) {
        sendError(res, error);
      }
    });
  });
}

module.exports = {
  mountHomeRoutes,
};
