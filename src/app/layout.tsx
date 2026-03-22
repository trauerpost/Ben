import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trauerpost",
  description: "Würdevolle Erinnerungskarten — individuell gestaltet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
