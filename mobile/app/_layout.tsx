import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="login" options={{ title: "Entrar" }} />
        <Stack.Screen name="cadastro" options={{ title: "Criar conta" }} />
        <Stack.Screen name="consentimento" options={{ title: "Privacidade" }} />
        <Stack.Screen name="index" options={{ title: "Karaokê de Leitura" }} />
        <Stack.Screen
          name="leitura/[textId]"
          options={{ title: "Leitura" }}
        />
      </Stack>
    </>
  );
}
