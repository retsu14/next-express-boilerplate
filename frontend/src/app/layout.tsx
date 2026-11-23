import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Next.js + Express + MySQL domain-oriented starter",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="container row">
            <Link className="brand" href="/">Tasks starter</Link>
            <Link href="/tasks">All tasks</Link>
            <Link href="/tasks/new">New task</Link>
          </nav>
        </header>
        <div className="container">{children}</div>
      </body>
    </html>
  );
}
