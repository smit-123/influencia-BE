const User = require("../models/users");

exports.createUser = async (req, res) => {
  try {
    const { email, phoneNo, fname, lname, password, accountType } = req.body;

    // Validate required fields
    if (!fname || !lname || !email || !phoneNo || !password || !accountType) {
      return res.status(400).json({
        status: false,
        message: "All required fields must be provided",
      });
    }

    // Check if a user with the same email or phone number already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phoneNo }] });
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User with this email or phone number already exists",
      });
    }

    // Create and save new user
    const user = new User(req.body);
    await user.save();
    res
      .status(201)
      .json({ status: true, message: "user registered successfully" });
  } catch (error) {
    // Check for validation errors or other database-related errors
    if (error.name === "ValidationError") {
      res.status(400).json({
        status: false,
        message: "Validation error",
        details: error.errors,
      });
    } else if (error.code === 11000) {
      // MongoDB duplicate key error code
      res.status(400).json({
        status: false,
        message: "Duplicate key error",
        details: error.keyValue,
      });
    } else {
      res.status(500).json({
        status: false,
        message: "An unexpected error occurred",
        details: error.message,
      });
    }
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a user by ID (single field or multiple fields)
exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    // Handle errors
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error", details: error.errors });
    } else {
      return res.status(500).json({
        message: "An unexpected error occurred",
        details: error.message,
      });
    }
  }
};

// Delete a user by ID
exports.deleteUserById = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
