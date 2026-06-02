import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { HeaderLogoutButton } from "@/components/HeaderLogoutButton";
import { colors } from "@/lib/theme";

const loggedInHeader = {
  headerRight: () => <HeaderLogoutButton />,
};

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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Entrar" }} />
        <Stack.Screen name="cadastro" options={{ title: "Criar conta" }} />
        <Stack.Screen name="consentimento" options={{ title: "Privacidade" }} />
        <Stack.Screen
          name="home"
          options={{ title: "Início", ...loggedInHeader }}
        />
        <Stack.Screen
          name="turma"
          options={{ title: "Minha turma", ...loggedInHeader }}
        />
        <Stack.Screen
          name="ranking"
          options={{ title: "Ranking", ...loggedInHeader }}
        />
        <Stack.Screen
          name="dados"
          options={{ title: "Meus dados", ...loggedInHeader }}
        />
        <Stack.Screen
          name="leitura/[textId]"
          options={{ title: "Leitura", ...loggedInHeader }}
        />
      </Stack>
    </>
  );
}
