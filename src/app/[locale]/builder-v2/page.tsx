"use client";

import dynamic from "next/dynamic";

const CanvasBuilderPage = dynamic(
  () => import("@/components/canvas-builder/CanvasBuilderPage"),
  { ssr: false }
);

export default function BuilderV2Page(): React.ReactElement {
  return <CanvasBuilderPage />;
}
