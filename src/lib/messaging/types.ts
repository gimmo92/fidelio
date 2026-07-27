export type MessagePayload = {
  to: string;
  channel: "EMAIL" | "SMS" | "WHATSAPP";
  subject: string;
  body: string;
};

export type MessageResult = {
  success: boolean;
  providerMessageId?: string;
  error?: string;
};

export interface MessageProvider {
  send(message: MessagePayload): Promise<MessageResult>;
}
