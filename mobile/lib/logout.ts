import { Alert } from "react-native";
import type { Router } from "expo-router";
import { clearAuthToken } from "@/lib/session";

export async function performLogout(router: Router) {
  await clearAuthToken();
  router.replace("/welcome");
}

/** Confirma antes de limpar a sessão (celular compartilhado na escola). */
export function confirmLogout(router: Router) {
  Alert.alert(
    "Trocar de aluno",
    "Outra pessoa vai usar este aparelho? Você sairá da sua conta e precisará entrar de novo.",
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
