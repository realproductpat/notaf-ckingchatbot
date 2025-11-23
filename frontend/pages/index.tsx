import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiFetch } from "../lib/api";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState("");
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) setToken(stored);
  }, []);

  const { data: projects, mutate: refreshProjects } = useSWR(
    token ? ["/api/projects", token] : null,
    ([url, t]) => apiFetch(url, t)
  );

  const { data: projectMessages } = useSWR(
    token && projectId ? [`/api/projects/${projectId}/messages`, token] : null,
    ([url, t]) => apiFetch(url, t)
  );

  useEffect(() => {
    if (projectMessages) setMessages(projectMessages);
  }, [projectMessages]);

  async function handleAuth() {
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email, password } : { email, password, name };
    const res = await apiFetch(endpoint, undefined, {
      method: "POST",
      body: JSON.stringify(body)
    });
    setToken(res.token);
    localStorage.setItem("token", res.token);
  }

  async function createProject() {
    if (!projectName || !token) return;
    await apiFetch("/api/projects", token, {
      method: "POST",
      body: JSON.stringify({ name: projectName })
    });
    setProjectName("");
    refreshProjects();
  }

  async function send() {
    if (!text || !projectId || !token) return;
    // append user message
    setMessages((m) => [...m, { role: "user", content: text }]);
    await apiFetch(`/api/projects/${projectId}/messages`, token, {
      method: "POST",
      body: JSON.stringify({ role: "user", content: text })
    });

    // call model proxy using streaming fetch and read chunks
    try {
      const body = { messages: [...messages, { role: "user", content: text }], projectId };
      const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
      const res = await fetch(base + "/api/model/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      // read stream reader and parse SSE-like `data: {...}` chunks sent by server
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // push a placeholder assistant message to be updated as stream arrives
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // split on SSE event separator
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line || line === "data: [DONE]") continue;
          
          let delta: string | null = null;
          if (line.startsWith("data:")) {
            const payload = line.replace(/^data:\s*/, "");
            try {
              const p = JSON.parse(payload);
              delta = p.delta || p.text || null;
            } catch {
              delta = payload;
            }
          } else {
            try {
              const j = JSON.parse(line);
              delta = j.delta || j.text || null;
            } catch {
              delta = line;
            }
          }

          if (delta !== null) {
            // append delta to last assistant message
            setMessages((m) => {
              const last = m[m.length - 1];
              if (last && last.role === "assistant") {
                const updated = { ...last, content: (last.content || "") + delta };
                return [...m.slice(0, -1), updated];
              } else {
                return [...m, { role: "assistant", content: delta }];
              }
            });
          }
        }
      }
    } catch (err: any) {
      console.error("stream error", err);
      setMessages((m) => [...m, { role: "assistant", content: "[stream error] " + String(err) }]);
    } finally {
      setText("");
    }
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("token");
    setProjectId(null);
    setMessages([]);
  }

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h1>{isLogin ? "Login" : "Register"}</h1>
        {!isLogin && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={{ display: "block", marginBottom: 10 }} />}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ display: "block", marginBottom: 10 }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ display: "block", marginBottom: 10 }} />
        <button onClick={handleAuth}>{isLogin ? "Login" : "Register"}</button>
        <button onClick={() => setIsLogin(!isLogin)} style={{ marginLeft: 10 }}>Switch to {isLogin ? "Register" : "Login"}</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={logout}>Logout</button>
      </div>
      <h1>Projects</h1>
      <div style={{ marginBottom: 20 }}>
        <input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Project name" />
        <button onClick={createProject} style={{ marginLeft: 10 }}>Create Project</button>
      </div>
      <div style={{ marginBottom: 20 }}>
        {projects?.map((p: any) => (
          <div key={p.id} onClick={() => setProjectId(p.id)} style={{ cursor: "pointer", padding: 10, background: projectId === p.id ? "#eee" : "white", border: "1px solid #ccc", marginBottom: 5 }}>
            {p.name}
          </div>
        ))}
      </div>
      {projectId && (
        <>
          <h2>Chat</h2>
          <div style={{ border: "1px solid #ccc", padding: 10, height: 400, overflowY: "auto", marginBottom: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <strong>{msg.role}:</strong> {msg.content}
              </div>
            ))}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Type message..." style={{ width: "100%", height: 100 }} />
          <button onClick={send} style={{ marginTop: 10 }}>Send</button>
        </>
      )}
    </div>
  );
}
