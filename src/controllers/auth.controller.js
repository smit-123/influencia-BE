const User = require("../models/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.register = async (req, res) => {
  try {
    const { fname, lname, email, phoneNo, password, accountType } = req.body;

    // Manual Validation
    // Check if all fields are provided
    if (!fname || !lname || !email || !phoneNo || !password || !accountType) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate email format (basic)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    // Check if accountType is valid
    if (accountType !== "brand" && accountType !== "influencer") {
      return res.status(400).json({ message: "Invalid account type." });
    }

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Check if the phone number already exists
    const existingPhone = await User.findOne({ phoneNo });
    if (existingPhone) {
      return res
        .status(400)
        .json({ message: "Phone number is already registered" });
    }

    // Generate a verification token and optional expiry time
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Create the user
    const user = new User({
      fname,
      lname,
      email,
      phoneNo,
      password,
      accountType,
      emailVerified: false,
      verificationToken,
      tokenExpiry,
    });

    await user.save();

    // Send email verification link
    const verificationUrl = `${process.env.BASE_URL}/api/v1/auth/verify-email/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Email Verification",
      html: `<p>Hi ${user.fname},</p>
             <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
             <p><a href="${verificationUrl}">Verify Email</a></p>`,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({
      message:
        "User registered successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof nodemailer.NodemailerError) {
      return res.status(500).json({
        message: "Failed to send email verification. Please try again later.",
      });
    }

    res.status(500).json({
      message: "An error occurred during registration",
      details: error.message,
    });
  }
};

exports.verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;
  try {
    // Find user by verification token
    const user = await User.findOne({ verificationToken });
    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/email-verification?status=failed&message=Invalid or expired token`
      );
    }

    // Check if the token has expired
    if (user.tokenExpiry < Date.now()) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/email-verification?status=failed&message=Verification token has expired`
      );
    }
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.tokenExpiry = undefined;

    await user.save();

    // Redirect to the frontend URL with a success message
    res.redirect(
      `${process.env.FRONTEND_URL}/email-verification?status=success&message=Email verified successfully`
    );
  } catch (error) {
    console.error(error);
    res.redirect(
      `${process.env.FRONTEND_URL}/email-verification?status=failed&message=An error occurred during email verification`
    );
  }
};

// Login user (using either email or phoneNo with password)
exports.login = async (req, res) => {
  try {
    const { email, phoneNo, password } = req.body;

    // Check if either email or phoneNo is provided
    if (!email && !phoneNo) {
      return res.status(400).json({
        status: false,
        message: "Email or phone number must be provided",
      });
    }

    if (!password) {
      return res
        .status(400)
        .json({ status: false, message: "Password is required" });
    }

    // Find the user by email or phoneNo
    const user = await User.findOne({ $or: [{ email }, { phoneNo }] });
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid credentials" });
    }
    // Check if the user's email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        status: false,
        message: "Please verify your email to continue",
      });
    }
    // Generate a JWT token
    const payload = { userId: user._id, email: user.email }; // or any other user info you want to store in the token
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    }); // Token expires in 1 hour
    res.json({
      status: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        phoneNo: user.phoneNo,
        emailVerified: user.emailVerified,
        accountType: user.accountType,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An unexpected error occurred",
      details: error.message,
    });
  }
};
