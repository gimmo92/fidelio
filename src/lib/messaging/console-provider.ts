import type { MessagePayload, MessageProvider, MessageResult } from "./types";

/** Provider simulato: logga in console. Sostituibile con email/WhatsApp. */
export class ConsoleProvider implements MessageProvider {
  async send(message: MessagePayload): Promise<MessageResult> {
    console.log("[ConsoleProvider] Messaggio simulato", {
      to: message.to,
      channel: message.channel,
      subject: message.subject,
      body: message.body,
    });
    return {
      success: true,
      providerMessageId: `console-${Date.now()}`,
    };
  }
}

export function getMessageProvider(): MessageProvider {
  return new ConsoleProvider();
}
