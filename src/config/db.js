const { default: mongoose } = require("mongoose");

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
module.exports = { connectDb };
