export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled,
  children,
  ...props
}) {
  return (
    <Component
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()}
      disabled={Component === "button" ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="ui-spinner" aria-hidden="true" />}
      {children}
    </Component>
  );
}