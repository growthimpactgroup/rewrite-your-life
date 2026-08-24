// Shared red/boxed notice — Jeff review call, 2026-08-11: disclosures that
// must not be missed (clinical disclaimer, education-only framing, no-
// email/no-storage notices) get this treatment everywhere they appear.
// Deliberately the one place red is used in the app — everywhere else
// (delta badges, low scores) stays neutral grey by explicit design rule.
export default function RedNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
      <p className="text-center text-[15px] leading-relaxed font-semibold text-red-700 dark:text-red-300">
        {children}
      </p>
    </div>
  );
}
