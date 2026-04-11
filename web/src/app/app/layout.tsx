import { AppContextProvider } from "@/components/app/app-context";
import { PersistentSidebar } from "@/components/app/persistent-sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppContextProvider>
      <PersistentSidebar />
      {children}
    </AppContextProvider>
  );
}
