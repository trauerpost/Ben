import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Inter } from "next/font/google";
import HeaderWrapper from "@/components/layout/HeaderWrapper";
import Footer from "@/components/layout/Footer";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "de" | "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir="ltr">
      <body
        className={`${inter.className} bg-white text-brand-dark antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <HeaderWrapper />
          <main className="pt-16 min-h-screen">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
