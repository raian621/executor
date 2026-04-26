import express from "express";
import { api } from "./api";

const PORT = 12345;

const app = express();
app.use(express.json());
app.use("/api/v1", api);

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
