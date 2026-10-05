export const OTP_LENGTH = 6;

export function normalizeOtp(value: string, length = OTP_LENGTH): string {
  return value.replace(/\D/g, "").slice(0, length);
}
