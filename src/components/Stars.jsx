export default function Stars({ value = 0, max = 5, onChange }) {
  return (
    <span className="stars" role={onChange ? 'radiogroup' : undefined}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < value;
        const star = (
          <span key={i} className={filled ? '' : 'dim'}>
            {filled ? '★' : '☆'}
          </span>
        );
        if (!onChange) return star;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          >
            {star}
          </button>
        );
      })}
    </span>
  );
}
