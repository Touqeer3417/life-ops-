import type { HTMLAttributes, PropsWithChildren } from 'react'
import { cn } from '@/utils/cn'

export function Card({ className, children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  )
}
