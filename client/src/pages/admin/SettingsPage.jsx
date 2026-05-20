import { SettingsTab } from "../user/SettingsTab";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SettingsTab />
      </div>
    </div>
  );
}
