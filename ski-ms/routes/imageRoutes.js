import express from 'express';
import {
  uploadImage,
  getImages,
  getImage,
  updateImage,
  deleteImage,
  analyzeImage
} from "../controllers/imageController.js";
import multer from "multer";
import { authenticateToken as protect, authorizeRole as restrictTo } from '../middleware/authMiddleware.js';

// Configure multer with file size limits and file type validation
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const router = express.Router();

// All routes require authentication
router.use(protect);

// Image upload and management routes
router.post("/upload", upload.single("image"), uploadImage);
router.get("/", getImages); // Get all images with filtering
router.get("/:imageId/:size?", getImage); // Get image by ID and optional size
router.patch("/:imageId", updateImage); // Update image metadata
router.delete("/:imageId", deleteImage);

// Image analysis route
router.post("/analyze", upload.single("image"), analyzeImage);

export default router;
