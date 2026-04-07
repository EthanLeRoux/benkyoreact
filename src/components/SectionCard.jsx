export default function SectionCard({ title, description, children }) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}
