import Employee from "../models/employeeModel.js";

// Create a new employee
export const createEmployee = async (req, res) => {
  const {
    firstName,
    lastName,
    position,
    monthlyRate,
    startDate,
    contactNumber,
    address,
    duties,
    isActive,
  } = req.body;
  try {
    const newEmployee = new Employee({
      firstName,
      lastName,
      position,
      monthlyRate,
      startDate,
      contactNumber,
      address,
      duties,
      isActive,
    });
    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all employees
export const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get an employee by ID
export const getEmployeeById = async (req, res) => {
  try {
    let employee;
    const { id } = req.params;

    // Try to find by employeeID first
    employee = await Employee.findOne({ employeeID: id });

    // If not found, try to find by MongoDB _id
    if (!employee) {
      try {
        employee = await Employee.findById(id);
      } catch (error) {
        // Invalid MongoDB ID format, we can ignore this error
      }
    }

    if (!employee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an employee
export const updateEmployee = async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedEmployee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an employee
export const deleteEmployee = async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee)
      return res.status(404).json({ message: "Employee not found" });
    res.status(200).json({ message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
