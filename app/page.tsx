import { redirect } from "next/navigation";

// Landing page menyusul; untuk sekarang langsung ke wizard pembuatan sertifikat.
export default function Home() {
  redirect("/certificate");
}
