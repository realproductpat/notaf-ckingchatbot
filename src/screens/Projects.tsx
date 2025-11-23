import React from "react";
import { View, Text, Button, TextInput, FlatList, TouchableOpacity } from "react-native";
import { apiFetch } from "../api/client";

export default function ProjectsScreen({ token, onOpenProject }: any) {
  const [projects, setProjects] = React.useState<any[]>([]);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await apiFetch("/api/projects", token);
    setProjects(data);
  }

  async function create() {
    if (!name) return;
    const p = await apiFetch("/api/projects", token, {
      method: "POST",
      body: JSON.stringify({ name })
    });
    setName("");
    load();
  }

  return (
    <View>
      <Text>Projects</Text>
      <TextInput placeholder="New project name" value={name} onChangeText={setName} />
      <Button title="Create" onPress={create} />
      <FlatList
        data={projects}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onOpenProject(item)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}