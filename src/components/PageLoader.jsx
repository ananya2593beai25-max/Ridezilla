export default function PageLoader() {
  return (
    <div className="container" style={{ paddingBlock: 48 }} role="status" aria-label="Loading page">
      <div className="skeleton" style={{ height: 40, width: "40%", marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 280 }} />
    </div>
  );
}
