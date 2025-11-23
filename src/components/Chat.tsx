import React from "react";
import { View, TextInput, Button, FlatList, Text } from "react-native";
import { API_BASE } from "../api/client";
import FileUploader from "./FileUploader";

export default function Chat({ token, project, onBack }: any) {
  const [text, setText] = React.useState("");
  const [messages, setMessages] = React.useState<any[]>([]);

  React.useEffect(() => {
    // load project messages
    fetch(`${API_BASE}/api/projects/${project.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => setMessages(j.messages || []));
  }, []);

  async function send() {
    if (!text) return;
    // append user message locally and to DB
    setMessages((m) => [...m, { role: "user", content: text }]);
    await fetch(`${API_BASE}/api/projects/${project.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: "user", content: text })
    });
    // call model proxy (streaming)
    const body = { messages: [...messages, { role: "user", content: text }], projectId: project.id };
    // Try streaming endpoint (SSE)
    const es = new EventSource(`${API_BASE}/api/model/stream`);
    // NOTE: many browsers block cross origin EventSource without proper CORS. Server must proxy upstream SSE.
    // Send initial POST via fetch to server to start the stream
    fetch(`${API_BASE}/api/model/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    }).catch(() => { /* ignore */ });

    es.onmessage = (e) => {
      if (e.data === "[DONE]") {
        es.close();
        return;
      }
      // append as assistant partial message
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last && last.role === "assistant" && last.streaming) {
          last.content = last.content + e.data;
          return [...m.slice(0, -1), last];
        } else {
          return [...m, { role: "assistant", content: e.data, streaming: true }];
        }
      });
    };
    es.onerror = () => {
      es.close();
      setMessages((m) => {
        const last = m[m.length - 1];
        if (last && last.role === "assistant") last.streaming = false;
        return [...m];
      });
    };

    setText("");
  }

  return (
    <View style={{ flex: 1 }}>
      <Button title="Back to projects" onPress={onBack} />
      <Text>Project: {project.name}</Text>
      <FileUploader token={token} projectId={project.id} onUploaded={() => {}} />
      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ padding: 8, marginVertical: 4, backgroundColor: item.role === "user" ? "#dfe7ff" : "#fff" }}>
            <Text>{item.role}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
      />
      <TextInput value={text} onChangeText={setText} placeholder="Type a message" />
      <Button title="Send" onPress={send} />
    </View>
  );
}