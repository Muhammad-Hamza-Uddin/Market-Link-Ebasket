export default function DataTable({ className = "", children, label }) {
  return (
    <div className="ui-table-shell" role="region" aria-label={label} tabIndex="0">
      <table className={`inventory-table ${className}`.trim()}>{children}</table>
    </div>
  );
}