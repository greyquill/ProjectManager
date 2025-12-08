import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Container({
  children,
  className,
  size = 'lg',
  ...props
}: ContainerProps) {
  const sizeClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[1400px]',
  }

  return (
    <div
      className={clsx('container', sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  )
}

