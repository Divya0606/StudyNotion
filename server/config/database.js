const mongoose = require("mongoose");
require("dotenv").config();

exports.connect = () => {
  const dbUrl = process.env.MONGODB_URL;

  if (!dbUrl) {
    console.log("DB connection failed: MONGODB_URL is missing in server/.env");
    process.exit(1);
  }

  mongoose
    .connect(dbUrl)
    .then(() => console.log("DB Connected successfully"))
    .catch((error) => {
      console.log("DB connection failed");
      console.error(error.message || error);
      console.log(
        "\nFix: Open MongoDB Atlas → Connect → copy the URI → paste it as MONGODB_URL in server/.env"
      );
      console.log(
        "Also allow Network Access 0.0.0.0/0, then restart: npm run server\n"
      );
      process.exit(1);
    });
};


