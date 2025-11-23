export type Adapter = {
  id: string;
  sendMessage: (messages: { role: string; content: string }[]) => Promise<string>;
  streamMessage?: (messages: { role: string; content: string }[], onDelta: (d: string, done?: boolean) => void) => Promise<void>;
};