const statusTone = (value = "") => {
  const status = value.toLowerCase();
  if (/(active|complete|ready|approved|in stock)/.test(status)) return "success";
  if (/(pending|placed|accepted|low)/.test(status)) return "warning";
  if (/(suspend|cancel|archive|remove|error)/.test(status)) return "danger";
  if (/(info|verified)/.test(status)) return "info";
  return "neutral";
};

export default function Badge({ tone, children, className = "" }) {
  return <span className={`ui-badge ui-badge--${tone || statusTone(String(children))} ${className}`.trim()}>{children}</span>;
}