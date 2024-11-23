import mongoose from "mongoose";

const budgetItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  allocatedAmount: {
    type: Number,
    required: [true, 'Allocated amount is required'],
    min: [0, 'Allocated amount cannot be negative']
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  notes: {
    type: String,
    trim: true
  }
});

const budgetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true
  },
  period: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    }
  },
  type: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual', 'custom'],
    required: [true, 'Budget type is required']
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  totalAllocated: {
    type: Number,
    required: [true, 'Total allocated amount is required'],
    min: [0, 'Total allocated amount cannot be negative']
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent amount cannot be negative']
  },
  items: {
    type: [budgetItemSchema],
    required: [true, 'At least one budget item is required'],
    validate: {
      validator: function(items) {
        return items.length > 0;
      },
      message: 'Budget must contain at least one item'
    }
  },
  alerts: {
    overspendingThreshold: {
      type: Number,
      min: [0, 'Threshold cannot be negative'],
      max: [100, 'Threshold cannot exceed 100%'],
      default: 80
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  fiscalYear: {
    type: String,
    required: [true, 'Fiscal year is required']
  },
  description: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  approvals: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    date: Date,
    comments: String
  }],
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes for better query performance
budgetSchema.index({ department: 1, fiscalYear: 1 });
budgetSchema.index({ status: 1 });
budgetSchema.index({ 'period.startDate': 1, 'period.endDate': 1 });
budgetSchema.index({ created_at: -1 });

// Virtual field for remaining amount
budgetSchema.virtual('remainingAmount').get(function() {
  return this.totalAllocated - this.totalSpent;
});

// Virtual field for percentage spent
budgetSchema.virtual('percentageSpent').get(function() {
  return this.totalAllocated > 0 ? (this.totalSpent / this.totalAllocated) * 100 : 0;
});

// Virtual field for budget status
budgetSchema.virtual('budgetStatus').get(function() {
  const percentageSpent = this.percentageSpent;
  if (percentageSpent >= 100) return 'exceeded';
  if (percentageSpent >= this.alerts.overspendingThreshold) return 'warning';
  return 'normal';
});

// Pre-save middleware
budgetSchema.pre('save', async function(next) {
  // Calculate total allocated amount
  this.totalAllocated = this.items.reduce((sum, item) => sum + item.allocatedAmount, 0);
  
  // Calculate total spent amount
  this.totalSpent = this.items.reduce((sum, item) => sum + item.spentAmount, 0);
  
  // Validate period dates
  if (this.period.endDate <= this.period.startDate) {
    throw new Error('End date must be after start date');
  }

  // Set status to completed if end date has passed
  if (this.status !== 'archived' && this.period.endDate < new Date()) {
    this.status = 'completed';
  }

  next();
});

// Static method to generate budget analytics
budgetSchema.statics.generateAnalytics = async function(query = {}) {
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalBudgets: { $sum: 1 },
        totalAllocated: { $sum: '$totalAllocated' },
        totalSpent: { $sum: '$totalSpent' },
        averageSpentPercentage: {
          $avg: { $multiply: [{ $divide: ['$totalSpent', '$totalAllocated'] }, 100] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalBudgets: 1,
        totalAllocated: 1,
        totalSpent: 1,
        averageSpentPercentage: { $round: ['$averageSpentPercentage', 2] },
        totalRemaining: { $subtract: ['$totalAllocated', '$totalSpent'] }
      }
    }
  ]);
};

const Budget = mongoose.model("Budget", budgetSchema);
export default Budget;
