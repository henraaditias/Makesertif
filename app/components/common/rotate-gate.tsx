import { RotateIcon } from "./icons";

const RotateGate = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-surface px-8 text-center md:hidden">
      <RotateIcon className="size-12 text-primary" />
      <div className="flex flex-col gap-2">
        <p className="text-title text-ink">
          Putar perangkat ini atau gunakan laptop
        </p>
        <p className="text-body text-ink-muted">
          Silakan rotasikan perangkat ini atau buka di laptop untuk menggunakan
          web.
        </p>
      </div>
    </div>
  );
};

export default RotateGate;
