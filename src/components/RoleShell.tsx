"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomerShell from "./shells/CustomerShell";
import AdminShell from "./shells/AdminShell";
import TechnicianShell from "./shells/TechnicianShell";

export default function RoleShell({ children, title, forceRole }: { children: React.ReactNode; title?: string; forceRole?: "CUSTOMER" | "ADMIN" | "TECHNICIAN" }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = localStorage.getItem("user");
    if (!u) { router.push("/login"); return; }
    setUser(JSON.parse(u));
  }, []);

  if (!mounted || !user) return null;

  const role = forceRole || user.role;
  if (role === "ADMIN") return <AdminShell title={title} user={user}>{children}</AdminShell>;
  if (role === "TECHNICIAN") return <TechnicianShell title={title} user={user}>{children}</TechnicianShell>;
  return <CustomerShell title={title} user={user}>{children}</CustomerShell>;
}
