import { Alert } from "react-native";
import type { Router } from "expo-router";
import { clearClassCode } from "@/lib/class-session";
import { clearCache } from "@/lib/db";
import { clearAuthToken } from "@/lib/session";

export async function performLogout(router: Router) {
  await clearAuthToken();
  await clearClassCode();
  await clearCache();
  router.replace("/welcome");
}

/** Confirma antes de limpar a sessão (celular compartilhado na escola). */
export function confirmLogout(router: Router) {
  Alert.alert(
    "Sair da turma",
    "O código da turma será esquecido e será preciso entrar de novo.",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => void performLogout(router),
      },
    ],
  );
}
