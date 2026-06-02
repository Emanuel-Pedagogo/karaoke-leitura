import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import {
  fetchStudentClassRequests,
  fetchStudentProfile,
  requestJoinClass,
  respondToInvite,
  type ClassJoinRequest,
  type StudentProfile,
} from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";

export default function TurmaScreen() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [requests, setRequests] = useState<ClassJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [classCode, setClassCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [studentData, requestsData] = await Promise.all([
        fetchStudentProfile(),
        fetchStudentClassRequests(),
      ]);
      setStudent(studentData);
      setRequests(requestsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData();
    }, [loadData])
  );

  async function handleJoinClass() {
    const code = classCode.trim();
    if (!code) {
      Alert.alert("Erro", "Digite o código da turma");
      return;
    }

    setSubmitting(true);
    try {
      await requestJoinClass(code);
      Alert.alert("Sucesso", "Solicitação enviada ao professor!");
      setClassCode("");
      await loadData();
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Erro ao entrar na turma");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInviteAction(requestId: string, action: "ACCEPT" | "REJECT") {
    setSubmitting(true);
    try {
      await respondToInvite(requestId, action);
      if (action === "ACCEPT") {
        Alert.alert("Sucesso", "Bem-vindo à nova turma!");
      }
      await loadData();
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Erro ao responder convite");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Minha Turma</Text>
      </View>

      {student?.className ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Turma Atual</Text>
          <Text style={styles.currentClass}>{student.className}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Entrar em uma Turma</Text>
        <Text style={styles.muted}>
          Peça o código da turma para o seu professor e digite abaixo para enviar
          uma solicitação.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Código da turma. Ex: ABC123"
          autoCapitalize="characters"
          value={classCode}
          onChangeText={setClassCode}
          editable={!submitting}
        />
        <Pressable
          style={[styles.primaryButton, submitting && styles.disabledButton]}
          onPress={() => void handleJoinClass()}
          disabled={submitting}
        >
          <Text style={styles.primaryButtonText}>Enviar Solicitação</Text>
        </Pressable>
      </View>

      {requests.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Solicitações e Convites</Text>
          {requests.map((req) => (
            <View key={req.id} style={styles.requestItem}>
              <Text style={styles.requestClass}>{req.class.name}</Text>
              <Text style={styles.requestSchool}>{req.class.school.name}</Text>
              
              {req.type === "CODE_JOIN" ? (
                <Text style={styles.statusPending}>
                  ⏳ Aguardando professor aprovar
                </Text>
              ) : (
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.acceptButton}
                    onPress={() => void handleInviteAction(req.id, "ACCEPT")}
                    disabled={submitting}
                  >
                    <Text style={styles.acceptText}>Aceitar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.rejectButton}
                    onPress={() => void handleInviteAction(req.id, "REJECT")}
                    disabled={submitting}
                  >
                    <Text style={styles.rejectText}>Recusar</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  backButton: { alignSelf: "flex-start" },
  backButtonText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  currentClass: { fontSize: 16, color: colors.primary, fontWeight: "600" },
  muted: { fontSize: 14, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  disabledButton: { opacity: 0.5 },
  requestItem: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  requestClass: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  requestSchool: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  statusPending: { fontSize: 14, color: "#d97706", fontWeight: "500" },
  actionRow: { flexDirection: "row", gap: spacing.sm },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.success,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  acceptText: { color: "#fff", fontWeight: "600" },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: "center",
  },
  rejectText: { color: colors.muted, fontWeight: "600" },
});