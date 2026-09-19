import { SharingSettings } from "@/components/settings/sharing-settings";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <div>
        <h1 className="font-heading text-2xl text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Gérez le partage de votre bibliothèque.</p>
      </div>
      <SharingSettings />
    </div>
  );
}
