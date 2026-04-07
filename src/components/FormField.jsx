export default function FormField({ label, value, onChange, name, type = 'text', placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
      />
    </label>
  );
}
