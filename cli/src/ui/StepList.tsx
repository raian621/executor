import { useState, useEffect } from "react";
import { Box } from "ink";
import { Select } from "@inkjs/ui";
import type { Executor } from "../core/executor";
import { StepStatus } from "@executor/types";

interface StepListProps {
  executor: Executor;
  onSelect?: (stepId: string) => void;
}

export default function StepList({ executor, onSelect }: StepListProps) {
  const steps = executor.getSteps();
  const [statuses, setStatuses] = useState<Map<string, StepStatus>>(
    new Map(steps.map((step) => [step.id, executor.getStepStatus(step.id)])),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStatuses(
        new Map(
          steps.map((step) => [step.id, executor.getStepStatus(step.id)]),
        ),
      );
    }, 100);
    return () => clearInterval(interval);
  }, [executor, steps]);

  return (
    <Box flexDirection="column">
      <Select
        options={steps.map((step) => ({
          label: `${statuses.get(step.id)} ${step.name}`,
          value: step.id,
        }))}
        onChange={(stepId) => onSelect?.(stepId)}
      />
    </Box>
  );
}
