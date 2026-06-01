import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { Audio } from "expo-av";
import { evaluateAudioWithGemini, fetchPrivacyStatus } from "@/lib/api";
import { colors, radius, spacing } from "@/lib/theme";

type Props = {
  textId: string;
  onApply: (counts: {
    omissions: number;
    substitutions: number;
    hesitations: number;
  }) => void;
};

export function VoiceAnalyzeButton({ textId, onApply }: Props) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);

  async function startRecording() {
    const privacy = await fetchPrivacyStatus();
    if (!privacy.hasVoiceConsent) {
      Alert.alert(
        "LGPD",
        "Autorize o uso do microfone na tela de consentimento (privacidade).",
      );
      return;
    }

    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );
    setRecording(rec);
  }

  async function stopAndAnalyze() {
    if (!recording) return;
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) throw new Error("Gravação vazia");

      // Chama a nova API do Gemini no backend
      const result = await evaluateAudioWithGemini(uri, textId);
      
      if (result.success && result.evaluation) {
        onApply({
          omissions: result.evaluation.metrics.omissions || 0,
          substitutions: result.evaluation.metrics.substitutions || 0,
          hesitations: result.evaluation.metrics.hesitations || 0,
        });
        Alert.alert(
          "Análise Concluída", 
          `O Gemini encontrou ${result.evaluation.errors.length} erro(s). Confirme na tabela abaixo!`
        );
      } else {
        throw new Error("Erro na avaliação.");
      }
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível analisar o áudio com o Gemini",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        if (recording) void stopAndAnalyze();
        else void startRecording();
      }}
      disabled={loading}
    >
      <Text style={styles.text}>
        {loading
          ? "Analisando…"
          : recording
            ? "⏹ Parar e analisar voz"
            : "🎤 Gravar e analisar (IA)"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
  },
  text: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
});
