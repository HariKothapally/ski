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

async function migrateEmployeeIDs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find all employees without employeeID
    const employees = await Employee.find({ employeeID: { $exists: false } });
    console.log(`Found ${employees.length} employees without employeeID`);

    // Update each employee with a new employeeID
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      const newEmployeeID = `EMP${String(i + 1).padStart(3, '0')}`;
      
      await Employee.findByIdAndUpdate(emp._id, { 
        $set: { employeeID: newEmployeeID } 
      });
      
      console.log(`Updated employee ${emp.firstName} ${emp.lastName} with ID: ${newEmployeeID}`);
    }

    // Verify all employees now have employeeIDs
    const allEmployees = await Employee.find({});
    console.log('\nAll employees after migration:');
    allEmployees.forEach(emp => {
      console.log(`- ${emp.employeeID}: ${emp.firstName} ${emp.lastName} (${emp.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateEmployeeIDs();
