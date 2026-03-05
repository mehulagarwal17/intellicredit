import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-3 sm:px-4 shadow-card">
            <SidebarTrigger className="mr-2 sm:mr-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1 min-w-0">
              <span className="font-medium text-foreground truncate">IntelliCredit</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline truncate">AI-Powered Credit Decisioning</span>
            </div>
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto p-3 sm:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
