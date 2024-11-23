import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  position: { type: String, required: true },
  monthlyRate: { type: Number, required: true },
  startDate: { type: Date, required: true },
  contactNumber: { type: String, required: true },
  duties: { type: [String], required: true },
  isActive: { type: Boolean, required: true },
  hasUser: { type: Boolean, default: false },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
});

const Employee = mongoose.model('Employee', employeeSchema);

async function checkEmployee() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ski_db');
    
    const employees = await Employee.find({});
    console.log('All employees:', employees);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkEmployee();
