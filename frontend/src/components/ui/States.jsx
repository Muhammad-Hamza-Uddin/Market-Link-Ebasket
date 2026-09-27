import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import Button from "./Button";

function State({ icon, title, description, action, tone = "neutral", role }) {
  return (
    <div className={`ui-state ui-state--${tone}`} role={role}>
      <span className="ui-state__icon" aria-hidden="true">{icon}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ title = "Loading…", description }) {
  return <State icon={<LoaderCircle className="ui-spin" />} title={title} description={description} role="status" />;
}

export function EmptyState({ title = "Nothing here yet", description, action }) {
  return <State icon={<Inbox />} title={title} description={description} action={action} />;
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return <State tone="danger" icon={<AlertCircle />} title={title} description={description} role="alert" action={onRetry && <Button onClick={onRetry}>Retry</Button>} />;
}