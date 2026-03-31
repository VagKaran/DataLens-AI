"use client";

import { useStore } from "@/lib/store";
import UploadZone from "@/components/onboarding/UploadZone";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExploreTab from "@/components/tabs/ExploreTab";
import PredictTab from "@/components/tabs/PredictTab";
import StoryTab from "@/components/tabs/StoryTab";
import ChatTab from "@/components/tabs/ChatTab";

export default function Home() {
  const { dataset, setDataset, activeTab } = useStore();

  if (!dataset) {
    return <UploadZone />;
  }

  return (
    <DashboardLayout onUploadClick={() => setDataset(null)}>
      {activeTab === "explore" && <ExploreTab />}
      {activeTab === "predict" && <PredictTab />}
      {activeTab === "story" && <StoryTab />}
      {activeTab === "chat" && <ChatTab />}
    </DashboardLayout>
  );
}
