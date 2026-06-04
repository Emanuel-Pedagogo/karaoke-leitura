import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { API_URL } from "@/lib/config";
import {
  deleteAccount,
  eraseVoiceData,
  fetchPrivacyStatus,
} from "@/lib/api";
import { clearCache } from "@/lib/db";
import { clearPendingReadings } from "@/lib/offline-audio";
import { clearAuthToken } from "@/lib/session";
import { colors, radius, spacing } from "@/lib/theme";

export default function DadosScreen() {
  const router = useRouter();
  const [hasVoiceConsent, setHasVoiceConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erasing, setErasing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const privacy = await fetchPrivacyStatus();
      setHasVoiceConsent(privacy.hasVoiceConsent);
    } catch {
      router.replace("/welcome");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      void loadStatus();
    }, [loadStatus]),
  );

  function handleEraseVoice() {
    Alert.alert(
      "Apagar transcrições",
      "Apagar todas as transcrições de voz? As métricas de leitura permanecem.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setErasing(true);
              try {
                const data = await eraseVoiceData();
                await clearPendingReadings();
                await clearCache();
                Alert.alert("Pronto", data.message ?? "Dados apagados.");
                await loadStatus();
              } catch (e) {
                Alert.alert(
                  "Erro",
                  e instanceof Error ? e.message : "Não foi possível apagar.",
                );
              } finally {
                setErasing(false);
              }
            })();
          },
        },
      ],
    );
  }

  function handleDeleteAccount() {
    if (confirmText !== "ENCERRAR") {
      Alert.alert("Confirmação", 'Digite exatamente "ENCERRAR" para continuar.');
      return;
    }
    Alert.alert(
      "Encerrar conta",
      "Sua conta e todo o histórico serão excluídos permanentemente. Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir conta",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                const data = await deleteAccount();
                await clearAuthToken();
                await clearPendingReadings();
                await clearCache();
                Alert.alert(
                  "Conta encerrada",
                  data.message ?? "Sua conta foi excluída.",
                  [{ text: "OK", onPress: () => router.replace("/welcome") }],
                );
              } catch (e) {
                Alert.alert(
                  "Erro",
                  e instanceof Error ? e.message : "Não foi possível excluir.",
                );
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.muted}>
        Exercite seus direitos previstos na Lei 13.709/2018 (LGPD).
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Política de privacidade</Text>
        <Pressable onPress={() => Linking.openURL(`${API_URL}/privacidade`)}>
          <Text style={styles.link}>Abrir política completa →</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/consentimento")}
          style={styles.secondaryAction}
        >
          <Text style={styles.link}>Atualizar consentimentos →</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados de voz</Text>
        <Text style={styles.muted}>
          Microfone:{" "}
          {hasVoiceConsent ? (
            <Text style={styles.ok}>autorizado</Text>
          ) : (
            "não autorizado"
          )}
        </Text>
        <Pressable
          style={[styles.dangerOutline, erasing && styles.disabled]}
          onPress={handleEraseVoice}
          disabled={erasing}
        >
          <Text style={styles.dangerText}>
            {erasing ? "Apagando…" : "Apagar transcrições de voz"}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.card, styles.dangerCard]}>
        <Text style={styles.cardTitle}>Encerrar conta</Text>
        <Text style={styles.muted}>
          Exclui permanentemente sua conta, histórico, XP e conquistas. Não pode
          ser desfeito.
        </Text>
        {!showDeleteConfirm ? (
          <Pressable
            style={styles.dangerOutline}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Text style={styles.dangerText}>Encerrar e excluir minha conta</Text>
          </Pressable>
        ) : (
          <View style={styles.confirmBox}>
            <Text style={styles.label}>Digite ENCERRAR para confirmar</Text>
            <TextInput
              value={confirmText}
              onChangeText={(t) => setConfirmText(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
              editable={!deleting}
            />
            <View style={styles.row}>
              <Pressable
                style={[
                  styles.dangerSolid,
                  (deleting || confirmText !== "ENCERRAR") && styles.disabled,
                ]}
                onPress={handleDeleteAccount}
                disabled={deleting || confirmText !== "ENCERRAR"}
              >
                <Text style={styles.dangerSolidText}>
                  {deleting ? "Excluindo…" : "Confirmar exclusão"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText("");
                }}
                disabled={deleting}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  muted: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  ok: { color: "#15803d", fontWeight: "600" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  dangerCard: { borderColor: "#fecaca" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  link: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  secondaryAction: { marginTop: spacing.xs },
  dangerOutline: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "#dc2626",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  dangerText: { color: "#b91c1c", fontWeight: "600", fontSize: 14 },
  dangerSolid: {
    flex: 1,
    backgroundColor: "#dc2626",
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  dangerSolidText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  confirmBox: { gap: spacing.sm, marginTop: spacing.sm },
  label: { fontSize: 13, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  row: { flexDirection: "row", gap: spacing.sm },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.foreground, fontWeight: "600" },
  disabled: { opacity: 0.5 },
});
