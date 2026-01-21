require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/user_route");
const ebayKeyword = require("./routes/ebay/keyword_route");
const ebaySellerRoute = require ("./routes/ebay/seller_analysis_route");
const GeminiRoute = require ("./routes/gemini/gemini_route");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/user", authRoutes);
app.use("/api/ebay-keyword",ebayKeyword);
app.use("/api/seller", ebaySellerRoute);
app.use("/api/ai",GeminiRoute);



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});