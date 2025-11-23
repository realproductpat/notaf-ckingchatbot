import React from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { AdapterProvider } from "./src/api/adapter";
import createAdapter from "./src/api/adapterFactory";
import AuthScreen from "./src/screens/Auth";
import ProjectsScreen from "./src/screens/Projects";
import Chat from "./src/components/Chat";

// very small app state: logged in token and selected project
export default function App() {
  const adapter = createAdapter(); // uses window.__env to target backend/model
  const [token, setToken] = React.useState<string | null>(null);
  const [project, setProject] = React.useState<any | null>(null);

  if (!token) {
    return <AuthScreen onAuthenticated={(t) => setToken(t)} />;
  }

  if (!project) {
    return <ProjectsScreen token={token} onOpenProject={setProject} />;
  }

  return (
    <AdapterProvider value={adapter}>
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Chat token={token} project={project} onBack={() => setProject(null)} />
        </View>
      </SafeAreaView>
    </AdapterProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f5f7" },
  inner: { flex: 1, padding: 16, maxWidth: 900, alignSelf: "center", width: "100%" }
});