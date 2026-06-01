import { useCallback, useRef, useState } from "react";
import { Audio } from "expo-av";

export function useReadingRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    setError(null);
    setRecordingUri(null);
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError("Permissão de microfone negada.");
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível iniciar a gravação.",
      );
      return false;
    }
  }, []);

  const stop = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return null;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      if (uri) setRecordingUri(uri);
      return uri ?? null;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível finalizar a gravação.",
      );
      recordingRef.current = null;
      setIsRecording(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setRecordingUri(null);
    setError(null);
  }, []);

  return {
    isRecording,
    recordingUri,
    error,
    start,
    stop,
    reset,
  };
}
