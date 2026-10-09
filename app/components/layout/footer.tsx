export interface FooterProps {
  className?: string;
}

const Footer = ({ className = "" }: FooterProps) => {
  return (
    <footer className={`px-4 py-4 text-center md:px-6 ${className}`}>
      <p className="text-body text-ink-muted">
        All certificates and recipient data stay in your browser. Nothing is
        permanently stored on our servers.{" "}
        <a
          href="/privacy"
          className="text-action underline underline-offset-2 hover:opacity-80"
        >
          Privacy policy
        </a>
      </p>
    </footer>
  );
};

export default Footer;
