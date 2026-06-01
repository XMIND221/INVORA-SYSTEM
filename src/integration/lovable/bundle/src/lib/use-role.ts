import { useEffect, useState } from "react";

export type Role = "organisateur" | "participant" | "partenaire" | "scanner";

const KEY = "invora.role";

export function getStoredRole(): Role | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  if (v === "organisateur" || v === "participant" || v === "partenaire" || v === "scanner") {
    return v;
  }
  return null;
}

export function setStoredRole(role: Role) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, role);
}

export function useRole(): Role {
  const [role, setRole] = useState<Role>("organisateur");
  useEffect(() => {
    const stored = getStoredRole();
    if (stored) setRole(stored);
    const handler = () => {
      const r = getStoredRole();
      if (r) setRole(r);
    };
    window.addEventListener("storage", handler);
    window.addEventListener("invora:role", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("invora:role", handler);
    };
  }, []);
  return role;
}

export const ROLE_LABEL: Record<Role, string> = {
  organisateur: "Organisateur",
  participant: "Participant",
  partenaire: "Partenaire",
  scanner: "Scanner",
};
