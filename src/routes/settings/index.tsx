import { createFileRoute } from "@tanstack/react-router";
import { SettingsContent } from "@/settings-pages/index-content";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings | Aftermind" },
      { name: "description", content: "Configure your profile and application preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return <SettingsContent />;
}
