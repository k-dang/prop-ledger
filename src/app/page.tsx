import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Rental Property Workspace",
  description: "Tax-ready rental property management workspace.",
};

export default function Home() {
  redirect("/dashboard");
}
