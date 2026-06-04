const DEFAULT_MAX_AUDIO_UPLOAD_BYTES = 8 * 1024 * 1024;

function configuredMaxAudioUploadBytes() {
  const raw = process.env.MAX_AUDIO_UPLOAD_BYTES;
  if (!raw) return DEFAULT_MAX_AUDIO_UPLOAD_BYTES;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_MAX_AUDIO_UPLOAD_BYTES;
  }

  return Math.floor(parsed);
}

export const MAX_AUDIO_UPLOAD_BYTES = configuredMaxAudioUploadBytes();

export function formatUploadBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

export function validateAudioUploadSize(file: Blob) {
  if (file.size <= MAX_AUDIO_UPLOAD_BYTES) return null;

  return {
    error: `Audio muito grande. Envie no maximo ${formatUploadBytes(
      MAX_AUDIO_UPLOAD_BYTES,
    )}.`,
    code: "AUDIO_TOO_LARGE",
  };
}
