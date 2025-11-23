import React from "react";
import { View, TextInput, Button, Text } from "react-native";
import { apiFetch, API_BASE } from "../api/client";

export default function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [isRegister, setIsRegister] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function submit() {
    try {
      const path = isRegister ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });
      if (!res.ok) {
        setErr(await res.text());
        return;
      }
      const json = await res.json();
      onAuthenticated(json.token);
    } catch (e: any) {
      setErr(String(e));
    }
  }

  return (
    <View>
      <Text>{isRegister ? "Register" : "Login"}</Text>
      {isRegister && <TextInput placeholder="Name" value={name} onChangeText={setName} />}
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {!!err && <Text style={{ color: "red" }}>{err}</Text>}
      <Button title={isRegister ? "Register" : "Login"} onPress={submit} />
      <Button title={isRegister ? "Switch to Login" : "Switch to Register"} onPress={() => setIsRegister(!isRegister)} />
    </View>
  );
}