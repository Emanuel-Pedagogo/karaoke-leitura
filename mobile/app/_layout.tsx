import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import NetInfo from "@react-native-community/netinfo";
import { HeaderLogoutButton } from "@/components/HeaderLogoutButton";
import { getDb } from "@/lib/db";
import { syncPendingSessions } from "@/lib/sync";
import { colors } from "@/lib/theme";

const loggedInHeader = {
  headerRight: () => <HeaderLogoutButton />,
};

export default function RootLayout() {
  useEffect(() => {
    void getDb();
    void syncPendingSessions();

    // Listen for network changes to sync when coming back online
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void syncPendingSessions();
      }
    });

    return () => unsubscribe();
  }, []);

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
          name="trocar-aluno"
          options={{ title: "Próximo aluno", ...loggedInHeader }}
        />
        <Stack.Screen
          name="leitura/[textId]"
          options={{ title: "Leitura", ...loggedInHeader }}
        />
      </Stack>
    </>
  );
}
