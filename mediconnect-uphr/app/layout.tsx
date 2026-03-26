import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UPHR - Unified Patient Health Record",
  description: "Your health record, anywhere in the world",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}