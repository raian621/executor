export interface Verification {
  // Unix timestamp
  time: number;
  type: VerificationType;
}

export enum VerificationType {
  TerminalUi,
  WebUi,
}
