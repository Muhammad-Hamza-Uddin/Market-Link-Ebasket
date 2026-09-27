export default function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <header className={`ui-page-header ${className}`.trim()}>
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="ui-page-header__actions">{actions}</div>}
    </header>
  );
}