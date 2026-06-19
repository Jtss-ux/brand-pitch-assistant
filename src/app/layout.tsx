import type { Metadata } from "next";

import "./styles.css";

export const metadata: Metadata = {
  title: "Brand Pitch Assistant",
  description: "Personal AI assistant for creator brand outreach."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
