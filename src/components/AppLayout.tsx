import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-4 shadow-card">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
              <span className="font-medium text-foreground">IntelliCredit</span>
              <span>•</span>
              <span>AI-Powered Credit Decisioning</span>
            </div>
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
