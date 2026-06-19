import Script from "next/script";
import { Geist, Geist_Mono, Khula } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { APIProvider } from "@/contexts/APIContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const khula = Khula({
  variable: "--font-khula",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
});

const themeInitializerScript = `(function(){try{var stored=localStorage.getItem('theme');var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=stored?stored==='dark':prefersDark;document.documentElement.classList.toggle('dark',isDark);document.documentElement.dataset.theme=isDark?'dark':'light';}catch(e){}})();`;

export const metadata = {
  title: "CCIC Admin Panel",
  description: "CCIC education management admin panel",
  other: {
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  themeColor: "#0038b5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializerScript }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${khula.variable} antialiased overflow-x-hidden bg-background text-foreground transition-colors duration-300`}
      >
        <AuthProvider>
          <APIProvider>
            <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
              {children}
            </main>
          </APIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
