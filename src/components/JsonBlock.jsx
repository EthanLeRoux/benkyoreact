export default function JsonBlock({ data }) {
  if (!data) return null;

  return <pre className="json-block">{JSON.stringify(data, null, 2)}</pre>;
}
