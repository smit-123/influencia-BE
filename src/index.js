const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const userRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");
require("dotenv").config();
const { default: mongoose } = require("mongoose");

const app = express();
// Middleware

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(compression());

app.use(helmet());
// Routes
// app.use("/api/example", exampleRoutes);
app.get("/", (req, res) => {
  res.send("Hello world");
});

const connectDb = async () => {
  try {
    await mongoose
      .connect(
        "mongodb+srv://test:9898800029@influencia.44y9g.mongodb.net/?retryWrites=true&w=majority&appName=influencia"
      )
      .then((res) => {
        console.log("connected");
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error) {
    console.log(error);
  }
};

connectDb();

app.use("/api/v1", userRoutes);
app.use("/api/v1/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
