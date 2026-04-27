import express, { type Express } from "express";
import { createApiRouter } from "./api";
import type { DataStore } from "./datastore";

export function createApp(datastore: DataStore): Express {
  const app = express();
  app.use("/api/v1", createApiRouter(datastore));
  return app;
}
