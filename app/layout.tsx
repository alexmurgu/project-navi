import type { Metadata } from "next";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/get-session";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Project Navi",
  description: "Advanced Finance Dashboard",
  icons: {
    icon: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const isLoginPage = !session; 

  return (
    <html
      lang="en"
      className={cn(
        "dark",
        jetbrainsMono.variable,
        plusJakartaSans.variable,
        "font-sans"
      )}
    >
      <body className="antialiased min-h-screen">
        {/* Ambient background glow blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-[15%] -left-[10%] h-[600px] w-[600px] rounded-full bg-purple-600/10 blur-[150px]"></div>
          <div className="absolute -top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[150px]"></div>
          <div className="absolute bottom-[10%] right-[20%] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[150px]"></div>
        </div>

        <SidebarProvider>
          {!isLoginPage && <AppSidebar />}
          <main className="relative z-10 flex w-full flex-1 flex-col transition-all duration-300 ease-in-out">
            {!isLoginPage && (
              <header className="glass-panel flex h-14 shrink-0 items-center gap-4 border-b border-white/10 px-6">
                <SidebarTrigger className="text-white transition-colors hover:bg-white/10" />
                <div className="h-4 w-[1px] bg-white/10"></div>
                <div className="flex flex-1 items-center text-sm font-bold tracking-widest text-white uppercase">
                  Dashboard
                </div>
              </header>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
