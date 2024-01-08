import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  uploadVideo,
  updateThumbnail,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/upload-video").post(
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo
);

router
  .route("/update-thumbnail/id/:id")
  .patch(verifyJWT, upload.single("thumbnail"), updateThumbnail);

export default router;
