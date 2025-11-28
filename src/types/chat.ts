export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "VIDEO"
  | "FILE"
  | "SYSTEM"
  | "INTAKE_QUESTION"
  | "INTAKE_ANSWER"
  | "ADMIN_POST_REJECTION";

export type ConversationStatus =
  | "REQUESTED"
  | "ACTIVE"
  | "REJECTED"
  | "BLOCKED"
  | "CLOSED";
