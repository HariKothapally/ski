import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  employeeID: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    description: "Unique employee identifier"
  },
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  position: { 
    type: String, 
    required: true 
  },
  monthlyRate: { 
    type: Number, 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  contactNumber: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String 
  },
  duties: { 
    type: [String], 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    required: true 
  },
  hasUser: { 
    type: Boolean, 
    default: false 
  },
  role: { 
    type: String, 
    enum: ['admin', 'staff'], 
    default: 'staff' 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  },
  modified_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Admin" 
  }
});

// Update the updated_at timestamp before saving
employeeSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Create a compound index for efficient searching
employeeSchema.index({ employeeID: 1 }, { unique: true });

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
