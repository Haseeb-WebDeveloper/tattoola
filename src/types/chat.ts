export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "FILE"
  | "SYSTEM"
  | "INTAKE_QUESTION"
  | "INTAKE_ANSWER";

export type ConversationStatus =
  | "REQUESTED"
  | "ACTIVE"
  | "REJECTED"
  | "BLOCKED"
  | "CLOSED";
