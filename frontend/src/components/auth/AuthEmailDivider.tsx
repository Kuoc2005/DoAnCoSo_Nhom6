export function AuthEmailDivider() {
  return (
    <div
      className="auth-fade-up auth-delay-4 relative mt-6 flex items-center gap-4 py-2"
      role="separator"
      aria-label="Hoặc tiếp tục với email"
    >
      <span className="h-px flex-1 bg-border" />
      <span className="text-label uppercase tracking-wide text-text-quaternary">hoặc</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
