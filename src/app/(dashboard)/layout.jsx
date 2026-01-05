import { Sidebar, SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <MainNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
