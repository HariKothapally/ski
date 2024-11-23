import Image from "../models/imageModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { sanitizeInput } from '../utils/validation.js';
import sharp from 'sharp';
import path from 'path';
import FormData from "form-data";
import axios from "axios";

const VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const THUMBNAIL_SIZE = { width: 200, height: 200 };
const MEDIUM_SIZE = { width: 800, height: 800 };

const validateImage = (file) => {
  // Check if file exists
  if (!file) {
    throw new AppError('No image file provided', 400);
  }

  // Check file type
  if (!VALID_IMAGE_TYPES.includes(file.mimetype)) {
    throw new AppError(`Invalid file type. Allowed types: ${VALID_IMAGE_TYPES.join(', ')}`, 400);
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    throw new AppError(`File too large. Maximum size: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`, 400);
  }

  return true;
};

const processImage = async (buffer, options = {}) => {
  const {
    width,
    height,
    quality = 80,
    format = 'jpeg'
  } = options;

  let processor = sharp(buffer);

  // Resize if dimensions provided
  if (width || height) {
    processor = processor.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // Convert to specified format
  switch (format) {
    case 'jpeg':
      processor = processor.jpeg({ quality });
      break;
    case 'png':
      processor = processor.png({ quality });
      break;
    case 'webp':
      processor = processor.webp({ quality });
      break;
    default:
      throw new AppError('Unsupported image format', 400);
  }

  return processor.toBuffer();
};

// Upload image
export const uploadImage = catchAsync(async (req, res) => {
  validateImage(req.file);

  const { category, description, tags } = req.body;

  // Process images in different sizes
  const [originalBuffer, thumbnailBuffer, mediumBuffer] = await Promise.all([
    processImage(req.file.buffer, { quality: 90 }),
    processImage(req.file.buffer, { ...THUMBNAIL_SIZE, quality: 70 }),
    processImage(req.file.buffer, { ...MEDIUM_SIZE, quality: 80 })
  ]);

  // Create image document
  const image = await Image.create({
    name: sanitizeInput(req.file.originalname),
    description: description ? sanitizeInput(description) : undefined,
    category: category ? sanitizeInput(category) : 'uncategorized',
    tags: tags ? tags.map(tag => sanitizeInput(tag.toLowerCase())) : [],
    contentType: req.file.mimetype,
    size: req.file.size,
    dimensions: {
      original: await sharp(req.file.buffer).metadata(),
      thumbnail: THUMBNAIL_SIZE,
      medium: MEDIUM_SIZE
    },
    data: {
      original: originalBuffer,
      thumbnail: thumbnailBuffer,
      medium: mediumBuffer
    },
    created_by: req.user._id,
    created_at: new Date()
  });

  res.status(201).json({
    success: true,
    data: {
      imageId: image._id,
      name: image.name,
      category: image.category,
      tags: image.tags,
      contentType: image.contentType,
      size: image.size,
      dimensions: image.dimensions,
      urls: {
        original: `/api/images/${image._id}/original`,
        thumbnail: `/api/images/${image._id}/thumbnail`,
        medium: `/api/images/${image._id}/medium`
      }
    }
  });
});

// Get all images with filtering
export const getImages = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category.toLowerCase();
  }

  // Tag filter
  if (req.query.tags) {
    const tags = req.query.tags.split(',').map(tag => tag.trim().toLowerCase());
    filter.tags = { $all: tags };
  }

  // Search by name
  if (req.query.search) {
    filter.name = new RegExp(sanitizeInput(req.query.search), 'i');
  }

  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filter.created_at = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  // Build sort object
  let sort = { created_at: -1 }; // default sort by creation date desc
  if (req.query.sort) {
    sort = {};
    const sortFields = req.query.sort.split(',');
    sortFields.forEach(field => {
      const [key, order] = field.split(':');
      sort[key] = order === 'desc' ? -1 : 1;
    });
  }

  const images = await Image.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-data') // Exclude binary data
    .populate('created_by', 'name')
    .select('-__v');

  const total = await Image.countDocuments(filter);

  // Calculate analytics
  const analytics = {
    totalImages: total,
    totalSize: await Image.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]).then(result => result[0]?.total || 0),
    byCategory: await Image.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]),
    popularTags: await Image.aggregate([
      { $match: filter },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  };

  res.status(200).json({
    success: true,
    data: {
      images: images.map(image => ({
        ...image.toObject(),
        urls: {
          original: `/api/images/${image._id}/original`,
          thumbnail: `/api/images/${image._id}/thumbnail`,
          medium: `/api/images/${image._id}/medium`
        }
      })),
      analytics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get image by ID and size
export const getImage = catchAsync(async (req, res) => {
  const { imageId, size = 'original' } = req.params;
  
  const image = await Image.findById(imageId);
  
  if (!image) {
    throw new AppError('Image not found', 404);
  }

  if (!['original', 'thumbnail', 'medium'].includes(size)) {
    throw new AppError('Invalid image size requested', 400);
  }

  res.set('Content-Type', image.contentType);
  res.set('Cache-Control', 'public, max-age=31557600'); // Cache for 1 year
  res.send(image.data[size]);
});

// Update image metadata
export const updateImage = catchAsync(async (req, res) => {
  const { description, category, tags } = req.body;
  
  const image = await Image.findById(req.params.imageId);
  
  if (!image) {
    throw new AppError('Image not found', 404);
  }

  // Update metadata
  const updates = {
    description: description ? sanitizeInput(description) : image.description,
    category: category ? sanitizeInput(category) : image.category,
    tags: tags ? tags.map(tag => sanitizeInput(tag.toLowerCase())) : image.tags,
    updated_by: req.user._id,
    updated_at: new Date()
  };

  const updatedImage = await Image.findByIdAndUpdate(
    req.params.imageId,
    updates,
    { new: true }
  )
  .select('-data')
  .populate('created_by', 'name')
  .populate('updated_by', 'name');

  res.status(200).json({
    success: true,
    data: {
      ...updatedImage.toObject(),
      urls: {
        original: `/api/images/${updatedImage._id}/original`,
        thumbnail: `/api/images/${updatedImage._id}/thumbnail`,
        medium: `/api/images/${updatedImage._id}/medium`
      }
    }
  });
});

// Delete image
export const deleteImage = catchAsync(async (req, res) => {
  const image = await Image.findById(req.params.imageId);
  
  if (!image) {
    throw new AppError('Image not found', 404);
  }

  // Optional: Add permission check
  // if (image.created_by.toString() !== req.user._id.toString()) {
  //   throw new AppError('Not authorized to delete this image', 403);
  // }

  await image.remove();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully'
  });
});

// Analyze image using Gemini
export const analyzeImage = catchAsync(async (req, res) => {
  const GEMINI_API_URL = process.env.GEMINI_API_URL;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new AppError('Gemini API key not configured', 500);
  }

  validateImage(req.file);

  const formData = new FormData();
  formData.append('prompt', req.body.prompt || 'Analyze this image and provide detailed information about its contents');
  formData.append('image', req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
    knownLength: req.file.buffer.length
  });

  try {
    const response = await axios.post(GEMINI_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${GEMINI_API_KEY}`
      }
    });

    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    throw new AppError(
      `Error analyzing image: ${error.response?.data?.error || error.message}`,
      error.response?.status || 500
    );
  }
});
