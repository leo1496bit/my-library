import { Suspense } from "react";
import { LibraryTabs } from "@/components/library/library-tabs";

export default function LibraryPage() {
  return (
    <Suspense>
      <LibraryTabs />
    </Suspense>
  );
}
