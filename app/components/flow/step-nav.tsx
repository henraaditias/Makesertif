import { CheckIcon } from "../common/icons";

export interface StepItem {
  id: string;
  title: string;
  description: string;
}

export interface StepNavProps {
  steps: StepItem[];
  /** Index step aktif (0-based) */
  current: number;
}

type StepState = "completed" | "active" | "pending";

/**
 * Navigasi step vertikal (Design.md "Navigation Step"):
 * dot indigo untuk aktif/selesai (selesai ditandai centang, bukan warna saja),
 * dot abu untuk pending, garis penghubung tipis antar step.
 * Judul step Bold 16px, deskripsi Regular 12px.
 *
 * Indikator saja — TIDAK bisa diklik. Pindah step hanya lewat tombol
 * "Sebelumnya" / "Lanjutkan" di action bar.
 */
const StepNav = ({ steps, current }: StepNavProps) => {
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => {
        const state: StepState =
          index < current ? "completed" : index === current ? "active" : "pending";

        return (
          <li key={step.id} className="flex flex-col items-start">
            <div
              aria-current={state === "active" ? "step" : undefined}
              className="flex cursor-default items-start gap-3 text-left select-none"
            >
              <StepDot state={state} />
              <span className="flex flex-col gap-0.5">
                <span
                  className={
                    state === "pending" ? "text-section text-ink-muted" : "text-section text-ink"
                  }
                >
                  {step.title}
                </span>
                <span
                  className={
                    state === "pending" ? "text-body text-ink-disabled" : "text-body text-ink-muted"
                  }
                >
                  {step.description}
                </span>
              </span>
            </div>
            {index < steps.length - 1 && (
              <span aria-hidden className="ml-2 h-20 w-px bg-line" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

const StepDot = ({ state }: { state: StepState }) => {
  if (state === "pending") {
    return <span aria-hidden className="mt-1 size-4 shrink-0 rounded-full bg-line-strong" />;
  }
  return (
    <span
      aria-hidden
      className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary"
    >
      {state === "completed" && <CheckIcon className="size-2.5 text-surface" />}
    </span>
  );
};

export default StepNav;
