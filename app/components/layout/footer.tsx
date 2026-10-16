import Link from "next/link";

export interface FooterProps {
  className?: string;
}

const Footer = ({ className = "" }: FooterProps) => {
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
