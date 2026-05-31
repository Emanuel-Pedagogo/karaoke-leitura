import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { Audio } from "expo-av";
import { alignReading, fetchPrivacyStatus, transcribeAudio } from "@/lib/api";
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

      let transcript = "";
      try {
        const tr = await transcribeAudio(uri);
        transcript = tr.transcript;
      } catch {
        Alert.alert(
          "Transcrição",
          "Configure OPENAI_API_KEY no servidor ou cole o texto falado na web.",
        );
        return;
      }

      const result = await alignReading(textId, transcript);
      onApply(result.alignment);
      Alert.alert("Análise", result.disclaimer);
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível analisar",
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
