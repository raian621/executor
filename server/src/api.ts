import { json, Router, type Request, type Response } from "express";
import { DataStore } from "./datastore";
import type { Workflow } from "@executor/types";

export const api = Router();
const datastore = new DataStore();

api.use(json());

api.post("/workflow", (req: Request, res: Response) => {
  const { workflow }: { workflow: Workflow } = req.body;
  datastore.addWorkflow(workflow);
  workflow.steps.forEach((step) =>
    datastore.updateStepStatus(workflow.id, step.id, step.status),
  );
  return res.json({ status: "Successfully stored workflow data" });
});

api.get("/workflow", (req: Request, res: Response) => {
  const { workflowId } = req.body;
  const workflow = datastore.getWorkflow(workflowId);

  if (workflow === null) {
    return res.json({ status: "Workflow not found" }).status(404);
  }

  return res.json({ workflow });
});

api.post("/workflow/step/status", (req: Request, res: Response) => {
  const { workflowId, stepId, stepStatus } = req.body;
  datastore.updateStepStatus(workflowId, stepId, stepStatus);
  return res.json({ status: "Successfully updated step status" });
});

api.get("/workflow/step/status", (req: Request, res: Response) => {
  const { workflowId, stepId } = req.body;
  const stepStatus = datastore.getStepStatus(workflowId, stepId);

  if (stepStatus === null) {
    return res.json({ status: "Step not found" }).status(404);
  }

  return res.json({ stepStatus });
});

// Fetch multiple statuses; useful for clients that know some steps have reached
// a terminal state and therefore won't have status updates.
api.get("/workflow/step/statuses", (req: Request, res: Response) => {
  const { workflowId, stepIds } = req.body;
  const stepStatusList = datastore.getStepStatuses(workflowId, stepIds);

  if (stepStatusList === null) {
    return res.json({ status: "Worlfow not found" });
  }

  if (
    stepStatusList.some((stepStatusRes) => stepStatusRes.status === "NOT_FOUND")
  ) {
    return res.json({ stepStatusList }).status(207);
  }

  return res.json({ stepStatusList });
});
