const express = require("express");
const router = express.Router();
const { verifyToken } = require("../utils/middleware");
const userController = require("../controllers/user.controller");

router.post("/users", userController.createUser);
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.put("/users/:id", verifyToken, userController.updateUserById);
router.delete("/users/:id", userController.deleteUserById);

module.exports = router;
