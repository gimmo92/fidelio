/** Demo mode: bypass login e usa utenti seed. Disattiva con DEMO_MODE=false. */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}
