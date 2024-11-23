import Supplier from "../models/supplierModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { validateEmail, validatePhoneNumber, sanitizeInput } from '../utils/validation.js';
import Ingredient from "../models/ingredientsModel.js";

const validateSupplierInput = (data) => {
  const { name, contactPerson, phone, email, address } = data;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('Supplier name is required', 400);
  }
  
  if (!contactPerson || typeof contactPerson !== 'string' || contactPerson.trim().length === 0) {
    throw new AppError('Contact person name is required', 400);
  }
  
  if (!phone || !validatePhoneNumber(phone)) {
    throw new AppError('Valid phone number is required', 400);
  }
  
  if (!email || !validateEmail(email)) {
    throw new AppError('Valid email address is required', 400);
  }
  
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new AppError('Address is required', 400);
  }
  
  return {
    name: sanitizeInput(name),
    contactPerson: sanitizeInput(contactPerson),
    phone: phone.trim(),
    email: email.toLowerCase().trim(),
    address: sanitizeInput(address)
  };
};

// Create a new supplier
export const createSupplier = catchAsync(async (req, res) => {
  const validatedData = validateSupplierInput(req.body);
  
  // Check if supplier with same name or email already exists
  const existingSupplier = await Supplier.findOne({ 
    $or: [
      { name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') } },
      { email: validatedData.email }
    ]
  });
  
  if (existingSupplier) {
    throw new AppError(
      existingSupplier.name.toLowerCase() === validatedData.name.toLowerCase() ?
      'A supplier with this name already exists' :
      'A supplier with this email already exists',
      400
    );
  }

  const newSupplier = await Supplier.create({
    ...validatedData,
    created_by: req.user._id,
    created_at: new Date()
  });

  res.status(201).json({
    success: true,
    data: newSupplier
  });
});

// Get all suppliers
export const getSuppliers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object based on query parameters
  let filter = {};
  
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search, 'i');
    filter = {
      $or: [
        { name: searchRegex },
        { contactPerson: searchRegex },
        { email: searchRegex }
      ]
    };
  }

  if (req.query.active === 'true') {
    filter.active = true;
  } else if (req.query.active === 'false') {
    filter.active = false;
  }

  // Build sort object
  let sort = { name: 1 }; // default sort by name
  if (req.query.sort) {
    sort = {};
    const sortFields = req.query.sort.split(',');
    sortFields.forEach(field => {
      const [key, order] = field.split(':');
      sort[key] = order === 'desc' ? -1 : 1;
    });
  }

  const suppliers = await Supplier.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-__v');

  // Get ingredient counts for each supplier
  const supplierData = await Promise.all(suppliers.map(async (supplier) => {
    const ingredientCount = await Ingredient.countDocuments({ supplier: supplier._id });
    return {
      ...supplier.toObject(),
      ingredientCount
    };
  }));

  const total = await Supplier.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      suppliers: supplierData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a supplier by ID
export const getSupplierById = catchAsync(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id)
    .populate('created_by', 'name')
    .select('-__v');

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // Get supplier's ingredients
  const ingredients = await Ingredient.find({ supplier: supplier._id })
    .select('name currentQuantity unit reorderPoint');

  res.status(200).json({
    success: true,
    data: {
      ...supplier.toObject(),
      ingredients
    }
  });
});

// Update a supplier
export const updateSupplier = catchAsync(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // If name or email is being updated, check for duplicates
  if (req.body.name || req.body.email) {
    const existingSupplier = await Supplier.findOne({ 
      $or: [
        req.body.name ? { 
          name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
          _id: { $ne: req.params.id }
        } : null,
        req.body.email ? {
          email: req.body.email.toLowerCase(),
          _id: { $ne: req.params.id }
        } : null
      ].filter(Boolean)
    });
    
    if (existingSupplier) {
      throw new AppError(
        existingSupplier.name.toLowerCase() === req.body.name?.toLowerCase() ?
        'A supplier with this name already exists' :
        'A supplier with this email already exists',
        400
      );
    }
  }

  const validatedData = validateSupplierInput({
    ...supplier.toObject(),
    ...req.body
  });

  const updatedSupplier = await Supplier.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  ).select('-__v');

  res.status(200).json({
    success: true,
    data: updatedSupplier
  });
});

// Delete a supplier
export const deleteSupplier = catchAsync(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // Check if the supplier has any ingredients
  const ingredientCount = await Ingredient.countDocuments({ supplier: supplier._id });
  if (ingredientCount > 0) {
    throw new AppError(
      'This supplier cannot be deleted as they have associated ingredients. Please reassign or delete the ingredients first.',
      400
    );
  }

  await supplier.remove();

  res.status(200).json({
    success: true,
    message: 'Supplier deleted successfully'
  });
});
