import { setCache } from "./db";

export type PrivacyStatus = {
  needsPrivacy: boolean;
  hasVoiceConsent: boolean;
};

export async function cachePrivacyStatus(status: PrivacyStatus) {
  await setCache("privacyStatus", status);
}
