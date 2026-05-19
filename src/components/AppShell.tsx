"use client";
import RoleShell from "./RoleShell";

export default function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  return <RoleShell title={title}>{children}</RoleShell>;
}
