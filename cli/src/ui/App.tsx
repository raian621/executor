import React from "react";
import { render } from "ink";
import StepList from "./StepList";
import type { Executor } from "../core/executor";

interface AppProps {
  executor: Executor;
}

const App: React.FC<AppProps> = ({ executor }) => {
  return <StepList executor={executor} />;
};

export default function renderApp(executor: Executor) {
  render(<App executor={executor} />);
}
