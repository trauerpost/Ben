"use client";

import dynamic from "next/dynamic";
import type { Asset } from "@/lib/supabase/types";

const WizardShell = dynamic(
  () => import("@/components/wizard/WizardShell"),
  { ssr: false }
);

interface WizardClientProps {
  initialAssets: Asset[];
}

export default function WizardClient({ initialAssets }: WizardClientProps) {
  return <WizardShell initialAssets={initialAssets} />;
}
