/** "Keep me signed in": when off, the sign-in ends once the browser is closed. */
const FLAG = "sp-ephemeral";
const ALIVE = "sp-alive";

export function setRemember(keep: boolean) {
  if (keep) localStorage.removeItem(FLAG);
  else localStorage.setItem(FLAG, "1");
  document.cookie = `${ALIVE}=1; path=/; SameSite=Lax`; // session cookie, cleared when the browser closes
}

/** True when the last sign-in asked not to be remembered and the browser has since been restarted. */
export function sessionShouldEnd() {
  if (localStorage.getItem(FLAG) !== "1") return false;
  return !document.cookie.split("; ").some((c) => c === `${ALIVE}=1`);
}
