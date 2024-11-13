import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  position: { type: String, required: true },
  monthlyRate: { type: Number, required: true },
  startDate: { type: Date, required: true },
  contactNumber: { type: String, required: true },
  address: { type: String },
  duties: { type: [String], required: true },
  isActive: { type: Boolean, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
});

const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
