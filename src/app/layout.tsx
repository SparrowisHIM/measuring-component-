import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const displayFont = localFont({
  src: "./fonts/geist-latin.woff2",
  variable: "--font-space-grotesk",
  weight: "100 900",
});

const monoFont = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  variable: "--font-plex-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "GrowthCard - an interactive growth widget",
  description:
    "A reusable, themeable growth card. The month tape streams past a fixed reading head as it counts up, then drag the tape to inspect any month.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
