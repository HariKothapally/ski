import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const employeeSchema = new mongoose.Schema({
  employeeID: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    description: "Unique employee identifier"
  },
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

async function createTestEmployee() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Create a new employee with employeeID
    const employee = new Employee({
      employeeID: 'EMP002',  // Using a different ID to avoid conflicts
      firstName: 'Test',
      lastName: 'Employee',
      position: 'Staff',
      monthlyRate: 5000,
      startDate: new Date(),
      contactNumber: '1234567890',
      duties: ['General'],
      isActive: true,
      hasUser: false,
      role: 'staff'
    });

    const saved = await employee.save();
    console.log('Created employee with ID:', saved._id);
    console.log('Employee details:', saved);

    // Verify we can find the employee by employeeID
    const foundByEmployeeID = await Employee.findOne({ employeeID: 'EMP002' });
    console.log('\nFound by employeeID:', foundByEmployeeID ? 'Yes' : 'No');

    // List all employees in the database
    const allEmployees = await Employee.find({});
    console.log('\nAll employees in database:');
    allEmployees.forEach(emp => {
      console.log(`- ${emp.employeeID}: ${emp.firstName} ${emp.lastName} (${emp.role})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestEmployee();
