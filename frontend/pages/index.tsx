*** Begin Patch
*** Update File: frontend/pages/index.tsx
@@
   async function send() {
     if (!text) return;
     // append
     setMessages((m) => [...m, { role: "user", content: text }]);
     await apiFetch(`/api/projects/${project.id}/messages`, token, {
       method: "POST",
       body: JSON.stringify({ role: "user", content: text })
     });
-    // call model proxy
-    const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000") + "/api/model", {
-      method: "POST",
-      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
-      body: JSON.stringify({ messages: [...messages, { role: "user", content: text }], projectId: project.id })
-    });
-    const j = await res.json();
-    setMessages((m) => [...m, { role: "assistant", content: j.text }]);
-    setText("");
+    // call model proxy using streaming fetch and read chunks
+    try {
+      const body = { messages: [...messages, { role: "user", content: text }], projectId: project.id };
+      const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
+      const res = await fetch(base + "/api/model/stream", {
+        method: "POST",
+        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
+        body: JSON.stringify(body)
+      });
+
+      if (!res.ok) {
+        const errText = await res.text();
+        throw new Error(errText || `HTTP ${res.status}`);
+      }
+
+      // read stream reader and parse SSE-like `data: {...}` chunks sent by server
+      const reader = res.body!.getReader();
+      const decoder = new TextDecoder();
+      let buffer = "";
+
+      // push a placeholder assistant message to be updated as stream arrives
+      setMessages((m) => [...m, { role: "assistant", content: "", streaming: true }]);
+
+      while (true) {
+        const { value, done } = await reader.read();
+        if (done) break;
+        buffer += decoder.decode(value, { stream: true });
+
+        // split on SSE event separator
+        const parts = buffer.split("\n\n");
+        buffer = parts.pop() || "";
+
+        for (const part of parts) {
+          const line = part.trim();
+          if (!line) continue;
+          // lines expected: data: {"delta":"..."} OR plain json OR raw text
+          let delta: string | null = null;
+          if (line.startsWith("data:")) {
+            const payload = line.replace(/^data:\s*/, "");
+            try {
+              const p = JSON.parse(payload);
+              delta = p.delta || p.text || null;
+            } catch {
+              delta = payload;
+            }
+          } else {
+            try {
+              const j = JSON.parse(line);
+              delta = j.delta || j.text || null;
+            } catch {
+              delta = line;
+            }
+          }
+
+          if (delta !== null) {
+            // append delta to last streaming assistant message
+            setMessages((m) => {
+              const last = m[m.length - 1];
+              if (last && last.role === "assistant") {
+                const updated = { ...last, content: (last.content || "") + delta, streaming: true };
+                return [...m.slice(0, -1), updated];
+              } else {
+                return [...m, { role: "assistant", content: delta, streaming: true }];
+              }
+            });
+          }
+        }
+      }
+
+      // flush any remainder
+      if (buffer.trim()) {
+        try {
+          const j = JSON.parse(buffer);
+          const delta = j.delta || j.text || buffer;
+          setMessages((m) => {
+            const last = m[m.length - 1];
+            if (last && last.role === "assistant") {
+              const updated = { ...last, content: (last.content || "") + delta, streaming: false };
+              return [...m.slice(0, -1), updated];
+            } else {
+              return [...m, { role: "assistant", content: delta, streaming: false }];
+            }
+          });
+        } catch {
+          setMessages((m) => {
+            const last = m[m.length - 1];
+            if (last && last.role === "assistant") {
+              const updated = { ...last, content: (last.content || "") + buffer, streaming: false };
+              return [...m.slice(0, -1), updated];
+            } else {
+              return [...m, { role: "assistant", content: buffer, streaming: false }];
+            }
+          });
+        }
+      } else {
+        // mark last message done
+        setMessages((m) => {
+          const last = m[m.length - 1];
+          if (last && last.role === "assistant") last.streaming = false;
+          return [...m];
+        });
+      }
+    } catch (err: any) {
+      console.error("stream error", err);
+      setMessages((m) => [...m, { role: "assistant", content: "[stream error] " + String(err) }]);
+    } finally {
+      setText("");
+    }
   }
*** End Patch