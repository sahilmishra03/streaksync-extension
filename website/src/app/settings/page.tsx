import type { Metadata } from "next";
import { SettingsApp } from "./SettingsApp";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default function SettingsPage() {
  return <SettingsApp />;
}
