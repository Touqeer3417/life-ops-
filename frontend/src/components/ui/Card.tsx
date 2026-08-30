import type {
  HTMLAttributes,
  PropsWithChildren,
} from 'react'

import { cn } from '@/utils/cn'


export function Card({
  className,
  children,
  ...props
}: PropsWithChildren<
  HTMLAttributes<HTMLDivElement>
>) {
  return (
    <div
      className={cn(
        [
          'relative rounded-[22px]',
          'border border-white/[0.075]',
          'bg-[#0a0d13]/82 p-5',
          'text-slate-100',
          'shadow-[0_22px_65px_-42px_rgba(0,0,0,0.95)]',
          'backdrop-blur-xl',
          'transition-[border-color,background-color,box-shadow]',
          'duration-300',
        ].join(' '),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
