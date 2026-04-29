export class ExecutorClientError extends Error {
  status: number;
  responseBody: unknown;

  constructor(status: number, responseBody: unknown) {
    super(`ExecutorClient request failed with status ${status}`);
    this.name = "ExecutorClientError";
    this.status = status;
    this.responseBody = responseBody;
  }
}
