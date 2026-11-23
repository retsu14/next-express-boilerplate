import type { ReactNode } from "react";

type NoticeProps = Readonly<{
  tone: "error" | "success" | "info";
  children: ReactNode;
}>;

/** Accessible message box: errors are announced assertively, others politely. */
export function Notice({ tone, children }: NoticeProps) {
  return (
    <p
      className={`notice notice-${tone}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
