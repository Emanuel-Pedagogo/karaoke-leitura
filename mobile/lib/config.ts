import Constants from "expo-constants";

const fallbackUrl =
  Constants.expoConfig?.hostUri != null
    ? `http://${Constants.expoConfig.hostUri.split(":").shift()}:3000`
    : "http://localhost:3000";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? fallbackUrl;
