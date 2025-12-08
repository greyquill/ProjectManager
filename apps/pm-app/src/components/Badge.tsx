import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

type Status = 'todo' | 'in_progress' | 'blocked' | 'done' | 'archived'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: Status
  label?: string
}

export function Badge({ status, label, className, children, ...props }: BadgeProps) {
  if (status) {
    const statusClasses = {
      todo: 'badge-todo',
      in_progress: 'badge-in-progress',
      blocked: 'badge-blocked',
      done: 'badge-done',
      archived: 'badge-archived',
    }

    const statusLabels = {
      todo: 'To Do',
      in_progress: 'In Progress',
      blocked: 'Blocked',
      done: 'Done',
      archived: 'Archived',
    }

    return (
      <span className={clsx('badge', statusClasses[status], className)} {...props}>
        {children || statusLabels[status]}
      </span>
    )
  }

  return (
    <span className={clsx('badge', className)} {...props}>
      {children || label}
    </span>
  )
}

