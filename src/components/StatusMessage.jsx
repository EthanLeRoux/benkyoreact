export default function StatusMessage({ loading, error, message }) {
  if (loading) {
    return <div className="status loading">Loading...</div>;
  }

  if (error) {
    return <div className="status error">Error: {error}</div>;
  }

  if (message) {
    return <div className="status success">{message}</div>;
  }

  return null;
}
