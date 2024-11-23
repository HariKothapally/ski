import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: [true, 'Ingredient ID is required']
  },
  name: { 
    type: String, 
    required: [true, 'Item name is required']
  },
  quantity: { 
    type: Number, 
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  unit: { 
    type: String, 
    required: [true, 'Unit is required']
  },
  unitPrice: { 
    type: Number, 
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalCost: { 
    type: Number, 
    required: [true, 'Total cost is required'],
    min: [0, 'Total cost cannot be negative']
  },
  tax: {
    rate: { 
      type: Number, 
      default: 0,
      min: 0,
      max: 100
    },
    amount: { 
      type: Number, 
      default: 0,
      min: 0
    }
  },
  discount: {
    type: { 
      type: String, 
      enum: ['percentage', 'fixed', 'none'],
      default: 'none'
    },
    value: { 
      type: Number, 
      default: 0,
      min: 0
    },
    amount: { 
      type: Number, 
      default: 0,
      min: 0
    }
  }
});

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: [true, 'Bill number is required'],
    unique: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: [true, 'Order ID is required']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, 'Customer ID is required']
  },
  billingDate: { 
    type: Date, 
    required: [true, 'Billing date is required'],
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  items: {
    type: [billItemSchema],
    required: [true, 'At least one item is required'],
    validate: {
      validator: function(items) {
        return items.length > 0;
      },
      message: 'Bill must contain at least one item'
    }
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    required: [true, 'Tax amount is required'],
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none'
    },
    value: {
      type: Number,
      default: 0,
      min: 0
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  totalAmount: { 
    type: Number, 
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount paid cannot be negative']
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative']
  },
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'upi', 'bank_transfer', 'other'],
    required: function() {
      return ['paid', 'partially_paid', 'refunded'].includes(this.status);
    }
  },
  paymentDetails: {
    transactionId: String,
    paymentDate: Date,
    notes: String
  },
  notes: {
    type: String,
    trim: true
  },
  termsAndConditions: {
    type: String,
    default: 'Standard terms and conditions apply'
  },
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true
  },
  updated_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User"
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
billSchema.index({ billNumber: 1 }, { unique: true });
billSchema.index({ orderId: 1 });
billSchema.index({ customerId: 1 });
billSchema.index({ status: 1 });
billSchema.index({ billingDate: -1 });
billSchema.index({ created_at: -1 });

// Virtual field for amount due
billSchema.virtual('amountDue').get(function() {
  return this.totalAmount - this.amountPaid;
});

// Virtual field for payment status
billSchema.virtual('paymentStatus').get(function() {
  if (this.status === 'cancelled') return 'Cancelled';
  if (this.status === 'refunded') return 'Refunded';
  if (this.amountPaid === 0) return 'Unpaid';
  if (this.amountPaid < this.totalAmount) return 'Partially Paid';
  return 'Paid';
});

// Pre-save middleware
billSchema.pre('save', async function(next) {
  // Update balance
  this.balance = this.totalAmount - this.amountPaid;
  
  // Update status based on payment
  if (this.status !== 'cancelled' && this.status !== 'refunded') {
    if (this.amountPaid === 0) this.status = 'pending';
    else if (this.amountPaid < this.totalAmount) this.status = 'partially_paid';
    else if (this.amountPaid === this.totalAmount) this.status = 'paid';
  }

  // Check if bill is overdue
  if (this.status !== 'paid' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }

  next();
});

// Method to generate bill number
billSchema.statics.generateBillNumber = async function() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Get the latest bill number for the current month
  const latestBill = await this.findOne({
    billNumber: new RegExp(`^BILL-${year}${month}`)
  }).sort({ billNumber: -1 });

  let sequence = '0001';
  if (latestBill) {
    const currentSequence = parseInt(latestBill.billNumber.slice(-4));
    sequence = (currentSequence + 1).toString().padStart(4, '0');
  }

  return `BILL-${year}${month}-${sequence}`;
};

const Bill = mongoose.model("Bill", billSchema);

export default Bill;
