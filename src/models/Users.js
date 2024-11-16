const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// User Schema
const userSchema = new mongoose.Schema(
  {
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNo: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    accountType: {
      type: String,
      enum: ["brand", "influencer", "admin"],
      default: "standard",
    },
    password: { type: String, required: true },
    verificationToken: {
      type: String,
      required: false,
    },
    tokenExpiry: {
      type: Date,
      required: false,
    },
  },
  {
    // Customize toJSON method to exclude the password field
    toJSON: {
      transform: (doc, ret) => {
        // Remove the password field from the returned document
        delete ret.password;
        return ret;
      },
    },
    toObject: {
      transform: (doc, ret) => {
        // Remove the password field from the returned object
        delete ret.password;
        return ret;
      },
    },
  }
);

// Pre-save middleware to hash the password before saving to the database
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (password) {
  const isMatch = await bcrypt.compare(password, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", userSchema);
