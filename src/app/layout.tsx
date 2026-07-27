import { Source_Sans_3, Fraunces } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Fidelio",
    template: "%s · Fidelio",
  },
  description:
    "Piattaforma di fidelizzazione clienti per concessionarie auto italiane",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${sourceSans.variable} ${fraunces.variable} min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
