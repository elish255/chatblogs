export const ACTIVATION_FEE = 14500;
export const PAYMENT_LIPA_NUMBER = "251161660";
export const PAYMENT_BUSINESS_NAME = "ASSERT BRIDGE";
export const WITHDRAWAL_MINIMUM = 50000;

const TOKEN_KEY = "chatpesa_public_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function loadToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}
