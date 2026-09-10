import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type ButtonProps = {
  variant?: 'primary' | 'danger' | 'dangerGhost' | 'ghost'
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

const Button = ({
  variant = 'primary',
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) => {
  return (
    <button type={type} className={[styles.button, styles[variant], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </button>
  )
}

export { Button }
