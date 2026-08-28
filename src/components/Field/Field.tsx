import type { ReactNode } from 'react'
import styles from './Field.module.css'

const Field = ({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) => (
  <div className={styles.field}>
    <label className={styles.label} htmlFor={htmlFor}>{label}</label>
    {children}
  </div>
)

export { Field }