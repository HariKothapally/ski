import express from "express";
import {
  uploadImage,
  getImage,
  deleteImage,
  referbilltoGemini,
} from "../controllers/imageController.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post("/upload", upload.single("image"), uploadImage);
router.post("/refergemini", upload.single("image"), referbilltoGemini);
router.get("/:imageId", getImage);
router.delete("/:imageId", deleteImage);
export default router;
