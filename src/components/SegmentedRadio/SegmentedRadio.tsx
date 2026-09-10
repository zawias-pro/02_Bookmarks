import styles from './SegmentedRadio.module.css'

const SegmentedRadio = <Value extends string,>({
  name,
  ariaLabel,
  options,
  value,
  onChange,
}: {
  name: string
  ariaLabel: string
  options: readonly { value: Value; label: string }[]
  value: Value
  onChange: (value: Value) => void
}) => (
  <div className={styles.options} role="radiogroup" aria-label={ariaLabel}>
    {options.map((option) => (
      <label className={styles.option} key={option.value}>
        <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span>{option.label}</span>
      </label>
    ))}
  </div>
)

export { SegmentedRadio }
