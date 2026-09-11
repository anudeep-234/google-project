import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import trafficRoutes from "./routes/traffic";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.use("/api/traffic", trafficRoutes);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "production") {
	app.listen(PORT, () => console.log(`Running on port ${PORT}`));
}

export default app;
