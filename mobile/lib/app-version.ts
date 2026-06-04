import Constants from "expo-constants";

const expoConfig = Constants.expoConfig;
const androidVersionCode = expoConfig?.android?.versionCode;

export function appVersionLabel() {
  const version = expoConfig?.version ?? "dev";
  const code = androidVersionCode ? String(androidVersionCode) : "dev";
  return "Versão " + version + " (" + code + ")";
}
