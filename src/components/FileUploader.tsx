import React from "react";
import { View, Button, Text } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { API_BASE } from "../api/client";

export default function FileUploader({ token, projectId, onUploaded }: any) {
  async function pick() {
    const res = await DocumentPicker.getDocumentAsync({});
    if (res.type !== "success") return;
    const uri = res.uri;
    const name = res.name;
    // fetch file blob and upload
    const resp = await fetch(uri);
    const blob = await resp.blob();
    const form = new FormData();
    // @ts-ignore
    form.append("file", blob, name);
    const r = await fetch(`${API_BASE}/api/files/${projectId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form as any
    });
    const json = await r.json();
    onUploaded && onUploaded(json);
  }

  return (
    <View>
      <Button title="Upload file" onPress={pick} />
    </View>
  );
}