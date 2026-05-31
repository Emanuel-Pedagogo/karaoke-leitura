import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Karaokê de Leitura",
  slug: "karaoke-leitura",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "karaoke-leitura",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#2563eb",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#2563eb",
    },
    package: "br.edu.karaokeleitura.app",
    versionCode: 1,
    permissions: ["INTERNET", "RECORD_AUDIO", "MODIFY_AUDIO_SETTINGS"],
  },
  plugins: [
    "expo-router",
    [
      "expo-av",
      {
        microphonePermission:
          "O microfone é usado para gravar a leitura em voz alta e analisar fluência, apenas com seu consentimento (LGPD).",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
