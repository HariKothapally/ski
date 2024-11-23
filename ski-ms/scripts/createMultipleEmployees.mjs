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
    trim: true
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

const employees = [
  {
    employeeID: 'EMP003',
    firstName: 'Sarah',
    lastName: 'Johnson',
    position: 'Ski Instructor',
    monthlyRate: 6000,
    startDate: new Date('2023-01-15'),
    contactNumber: '555-0101',
    duties: ['Ski Instruction', 'Safety Training'],
    isActive: true,
    role: 'staff'
  },
  {
    employeeID: 'EMP004',
    firstName: 'Michael',
    lastName: 'Chen',
    position: 'Operations Manager',
    monthlyRate: 8500,
    startDate: new Date('2022-11-01'),
    contactNumber: '555-0102',
    duties: ['Staff Management', 'Operations Planning', 'Resource Allocation'],
    isActive: true,
    role: 'admin'
  },
  {
    employeeID: 'EMP005',
    firstName: 'Emma',
    lastName: 'Davis',
    position: 'Equipment Manager',
    monthlyRate: 5500,
    startDate: new Date('2023-02-01'),
    contactNumber: '555-0103',
    duties: ['Equipment Maintenance', 'Inventory Management'],
    isActive: true,
    role: 'staff'
  },
  {
    employeeID: 'EMP006',
    firstName: 'James',
    lastName: 'Wilson',
    position: 'Senior Ski Instructor',
    monthlyRate: 7000,
    startDate: new Date('2022-09-15'),
    contactNumber: '555-0104',
    duties: ['Advanced Ski Instruction', 'Instructor Training', 'Safety Coordination'],
    isActive: true,
    role: 'staff'
  },
  {
    employeeID: 'EMP007',
    firstName: 'Sofia',
    lastName: 'Martinez',
    position: 'Guest Services Manager',
    monthlyRate: 6500,
    startDate: new Date('2023-03-01'),
    contactNumber: '555-0105',
    duties: ['Customer Service', 'Complaint Resolution', 'Guest Experience'],
    isActive: true,
    role: 'admin'
  },
  {
    employeeID: 'EMP008',
    firstName: 'Alex',
    lastName: 'Thompson',
    position: 'Snowboard Instructor',
    monthlyRate: 5800,
    startDate: new Date('2023-01-20'),
    contactNumber: '555-0106',
    duties: ['Snowboard Instruction', 'Youth Programs'],
    isActive: true,
    role: 'staff'
  },
  {
    employeeID: 'EMP009',
    firstName: 'Lisa',
    lastName: 'Anderson',
    position: 'Safety Coordinator',
    monthlyRate: 6200,
    startDate: new Date('2022-12-01'),
    contactNumber: '555-0107',
    duties: ['Safety Protocols', 'Emergency Response', 'Staff Training'],
    isActive: true,
    role: 'staff'
  },
  {
    employeeID: 'EMP010',
    firstName: 'David',
    lastName: 'Brown',
    position: 'Maintenance Supervisor',
    monthlyRate: 6800,
    startDate: new Date('2022-10-15'),
    contactNumber: '555-0108',
    duties: ['Facility Maintenance', 'Equipment Repairs', 'Safety Checks'],
    isActive: true,
    role: 'staff'
  },
  {
    employeeID: 'EMP011',
    firstName: 'Maria',
    lastName: 'Garcia',
    position: 'HR Manager',
    monthlyRate: 7500,
    startDate: new Date('2022-08-01'),
    contactNumber: '555-0109',
    duties: ['Recruitment', 'Employee Relations', 'Training Programs'],
    isActive: true,
    role: 'admin'
  },
  {
    employeeID: 'EMP012',
    firstName: 'Robert',
    lastName: 'Taylor',
    position: 'IT Specialist',
    monthlyRate: 7000,
    startDate: new Date('2023-04-01'),
    contactNumber: '555-0110',
    duties: ['System Maintenance', 'Technical Support', 'Software Updates'],
    isActive: true,
    role: 'staff'
  }
];

async function createEmployees() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create all employees
    const results = await Promise.all(
      employees.map(async (emp) => {
        try {
          const employee = new Employee(emp);
          const saved = await employee.save();
          return {
            success: true,
            employeeID: emp.employeeID,
            name: `${emp.firstName} ${emp.lastName}`,
            position: emp.position
          };
        } catch (error) {
          return {
            success: false,
            employeeID: emp.employeeID,
            error: error.message
          };
        }
      })
    );

    // Print results
    console.log('\nResults:');
    results.forEach(result => {
      if (result.success) {
        console.log(`✅ Created: ${result.employeeID} - ${result.name} (${result.position})`);
      } else {
        console.log(`❌ Failed to create ${result.employeeID}: ${result.error}`);
      }
    });

    // Print summary
    const successful = results.filter(r => r.success).length;
    console.log(`\nSummary: Created ${successful} out of ${employees.length} employees`);

    // List all employees in the database
    const allEmployees = await Employee.find({}).sort('employeeID');
    console.log('\nAll employees in database:');
    allEmployees.forEach(emp => {
      console.log(`- ${emp.employeeID}: ${emp.firstName} ${emp.lastName} (${emp.position})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createEmployees();
