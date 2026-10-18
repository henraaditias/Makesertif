import Link from "next/link";
import BackToTop from "../common/back-to-top";

export interface FooterProps {
  className?: string;
  /**
   * `wizard` (default): catatan privasi + Privacy policy (wizard & dashboard).
   * `landing`: copyright + Privacy policy + "Kembali ke atas" (mockup rev/).
   */
  variant?: "wizard" | "landing";
}

const Footer = ({ className = "", variant = "wizard" }: FooterProps) => {
  if (variant === "landing") {
    return (
      <footer className={`px-4 py-5 md:px-6 ${className}`}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center text-body text-ink-muted sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} Makesertif. Semua hak
            dilindungi.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-action underline underline-offset-2 hover:opacity-80"
            >
              Privacy policy
            </Link>
            <BackToTop />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`px-4 py-4 text-center md:px-6 ${className}`}>
      <p className="text-body text-ink-muted">
        Semua sertifikat dan data penerima tetap di browser kamu. Tidak ada
        yang disimpan permanen di server kami.{" "}
        <Link
          href="/privacy"
          className="text-action underline underline-offset-2 hover:opacity-80"
        >
          Privacy policy
        </Link>
      </p>
    </footer>
  );
};

export default Footer;
