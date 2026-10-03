/** Round recorded amounts to cents using the app's existing number semantics. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
