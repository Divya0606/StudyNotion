const express = require("express");
const app = express();

const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payments");
const courseRoutes = require("./routes/Course");
const contactUsRoute = require("./routes/Contact");
const aiRoutes = require("./routes/AI");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const {cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

dotenv.config();
const PORT = process.env.PORT || 4000;

//database connect
database.connect();
//middlewares
app.use(express.json());
app.use(cookieParser());
const normalizeOrigin = (value) =>
	(value || "").trim().replace(/\/$/, "")

const allowedOrigins = [
	"http://localhost:3000",
	"https://study-notion-techskill.vercel.app",
	normalizeOrigin(process.env.FRONTEND_URL),
	...(process.env.FRONTEND_URLS || "")
		.split(",")
		.map(normalizeOrigin),
].filter(Boolean)

app.use(
	cors({
		origin: function (origin, callback) {
			// allow non-browser / same-origin tools with no Origin header
			if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
				return callback(null, true)
			}
			// reject without throwing (throwing becomes HTTP 500 / Network Error)
			return callback(null, false)
		},
		credentials: true,
	})
)

app.use(
	fileUpload({
		useTempFiles:true,
		tempFileDir:"/tmp",
	})
)
//cloudinary connection
cloudinaryConnect();

//routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/reach", contactUsRoute);
app.use("/api/v1/ai", aiRoutes);

//def route

app.get("/", (req, res) => {
	return res.json({
		success:true,
		message:'Your server is up and running....'
	});
});

app.listen(PORT, () => {
	console.log(`App is running at ${PORT}`)
})

