import type { Metadata } from "next";
import "./globals.css";
import { ToastManager } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "DataLens AI",
  description: "Connect your intelligence — AI-powered data analysis platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <ToastManager />
      </body>
    </html>
  );
}
