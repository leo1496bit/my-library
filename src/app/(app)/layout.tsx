import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/top-bar";
import { BottomNav } from "@/components/nav/bottom-nav";
import { FabAddButton } from "@/components/nav/fab-add-button";
import { QuickAddSheet } from "@/components/add/quick-add-sheet";
import { AddBookProvider } from "@/components/add/add-book-context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AddBookProvider>
      <TopBar email={user.email ?? null} />
      <main className="mx-auto w-full max-w-xl flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <FabAddButton />
      <BottomNav />
      <QuickAddSheet />
    </AddBookProvider>
  );
}
