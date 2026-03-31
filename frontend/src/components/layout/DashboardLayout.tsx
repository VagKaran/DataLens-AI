"use client";

import TopNav from "./TopNav";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onUploadClick: () => void;
}

export default function DashboardLayout({
  children,
  onUploadClick,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <TopNav />
      <Sidebar onUploadClick={onUploadClick} />
      <main className="lg:ml-64 pt-16 min-h-screen bg-surface">{children}</main>
    </div>
  );
}
