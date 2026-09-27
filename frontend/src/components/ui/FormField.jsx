export default function FormField({ label, htmlFor, hint, error, children, className = "" }) {
  return (
    <div className={`form-field-group ${error ? "has-error" : ""} ${className}`.trim()}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <small className="field-error" role="alert">{error}</small> : hint ? <small className="field-help">{hint}</small> : null}
    </div>
  );
}