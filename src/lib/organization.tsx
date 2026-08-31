import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  plan: "Starter" | "Growth" | "Enterprise";
  role: "Administrador" | "Supervisor" | "Agente";
};
type OrganizationContextValue = {
  organizations: Organization[];
  current: Organization;
  switchOrganization: (id: string) => void;
  createOrganization: (name: string) => Organization;
};
const defaults: Organization[] = [
  {
    id: "org_zolmyra",
    name: "Zolmyra AI",
    slug: "zolmyra-ai",
    plan: "Growth",
    role: "Administrador",
  },
];
const LIST_KEY = "zolmyra.organizations";
const CURRENT_KEY = "zolmyra.current-organization";
const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState(defaults);
  const [currentId, setCurrentId] = useState(defaults[0]!.id);
  useEffect(() => {
    const list = localStorage.getItem(LIST_KEY);
    const selected = localStorage.getItem(CURRENT_KEY);
    if (list) setOrganizations(JSON.parse(list) as Organization[]);
    if (selected) setCurrentId(selected);
  }, []);
  const current = organizations.find((org) => org.id === currentId) ?? organizations[0]!;
  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      current,
      switchOrganization(id) {
        if (organizations.some((org) => org.id === id)) {
          setCurrentId(id);
          localStorage.setItem(CURRENT_KEY, id);
        }
      },
      createOrganization(name) {
        const slug = name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const organization: Organization = {
          id: `org_${crypto.randomUUID()}`,
          name: name.trim(),
          slug,
          plan: "Starter",
          role: "Administrador",
        };
        const next = [...organizations, organization];
        setOrganizations(next);
        setCurrentId(organization.id);
        localStorage.setItem(LIST_KEY, JSON.stringify(next));
        localStorage.setItem(CURRENT_KEY, organization.id);
        return organization;
      },
    }),
    [organizations, current],
  );
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization debe utilizarse dentro de OrganizationProvider");
  return context;
}
