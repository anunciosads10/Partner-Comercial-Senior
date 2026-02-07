import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: "PartnerVerse",
  description: "Plataforma SaaS para la gestión de Partners Comerciales Senior.",
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <FirebaseClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
