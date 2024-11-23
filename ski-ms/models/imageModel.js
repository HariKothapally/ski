import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Image name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'uncategorized',
    lowercase: true,
    trim: true
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  data: {
    original: {
      type: Buffer,
      required: [true, 'Original image data is required']
    },
    thumbnail: {
      type: Buffer,
      required: [true, 'Thumbnail image data is required']
    },
    medium: {
      type: Buffer,
      required: [true, 'Medium image data is required']
    }
  },
  contentType: {
    type: String,
    required: [true, 'Content type is required'],
    enum: ['image/jpeg', 'image/png', 'image/webp']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  dimensions: {
    original: {
      width: Number,
      height: Number,
      format: String
    },
    thumbnail: {
      width: Number,
      height: Number
    },
    medium: {
      width: Number,
      height: Number
    }
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.data; // Exclude binary data when converting to JSON
      return ret;
    }
  }
});

// Indexes for better query performance
imageSchema.index({ category: 1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ created_at: -1 });
imageSchema.index({ name: 'text', description: 'text' }); // Text search index

// Virtual for public URLs
imageSchema.virtual('urls').get(function() {
  return {
    original: `/api/images/${this._id}/original`,
    thumbnail: `/api/images/${this._id}/thumbnail`,
    medium: `/api/images/${this._id}/medium`
  };
});

// Pre-save middleware for data validation
imageSchema.pre('save', function(next) {
  if (!this.data.original || !this.data.thumbnail || !this.data.medium) {
    next(new Error('All image sizes are required'));
  }
  next();
});

const Image = mongoose.model("Image", imageSchema);
export default Image;
