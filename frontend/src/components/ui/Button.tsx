import type {
  ButtonHTMLAttributes,
} from 'react'

import { cn } from '@/utils/cn'


interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'secondary'
    | 'ghost'
}


export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        [
          'group relative inline-flex min-h-10 items-center justify-center',
          'overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold',
          'tracking-[-0.01em] outline-none transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-cyan-300/75',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070b]',
          'active:scale-[0.985]',
          'disabled:pointer-events-none disabled:cursor-not-allowed',
          'disabled:opacity-45 disabled:saturate-50',
        ].join(' '),

        variant === 'primary' &&
          [
            'border border-white/[0.10]',
            'bg-white text-slate-950',
            'shadow-[0_12px_38px_-18px_rgba(255,255,255,0.28)]',
            'hover:-translate-y-0.5 hover:bg-cyan-50',
            'hover:shadow-[0_16px_46px_-20px_rgba(103,232,249,0.32)]',
          ].join(' '),

        variant === 'secondary' &&
          [
            'border border-white/[0.09]',
            'bg-white/[0.045] text-slate-200',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]',
            'backdrop-blur-xl',
            'hover:-translate-y-0.5 hover:border-white/[0.16]',
            'hover:bg-white/[0.075] hover:text-white',
          ].join(' '),

        variant === 'ghost' &&
          [
            'border border-transparent',
            'bg-transparent text-slate-400',
            'hover:bg-white/[0.055] hover:text-white',
          ].join(' '),

        className,
      )}
      {...props}
    />
  )
}
