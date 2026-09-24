import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        playerduoPrimary:
          "h-8 rounded-[8px] border-none bg-[#6460FF] px-[14px] !text-[10px] !leading-[10px] !font-normal text-white hover:bg-[#5550DD] hover:shadow-[0px_0px_12px_rgba(100,96,255,0.3)] active:bg-[#463FB8] active:shadow-[0px_0px_6px_rgba(100,96,255,0.2)] active:not-aria-[haspopup]:translate-y-0 disabled:bg-[#CCCCCC] disabled:text-[#999999] disabled:opacity-100 focus-visible:border-[#6460FF] focus-visible:ring-[#6460FF]/30",
        playerduoSecondary:
          "h-8 rounded-[8px] border border-[#CCCCCC] bg-white px-[14px] !text-[10px] !leading-[10px] !font-normal text-[#333333] hover:border-[#999999] hover:bg-[#F5F5F5] active:bg-[#E8E8E8] active:not-aria-[haspopup]:translate-y-0 disabled:bg-[#F5F5F5] disabled:text-[#CCCCCC] disabled:opacity-100 focus-visible:border-[#6460FF]",
        playerduoGhost:
          "h-8 rounded-full border border-black/12 bg-white px-3 !text-xs !leading-[18px] !font-bold text-[#6460FF] hover:bg-[#F1EEFF] hover:text-[#280071] active:bg-[#E8D4FF] active:text-[#280071] active:not-aria-[haspopup]:translate-y-0 disabled:bg-[#F5F5F5] disabled:text-[#CCCCCC] disabled:opacity-100 focus-visible:border-[#6460FF]",
        /* Player Duo v2 design system */
        pdPrimary:
          "h-auto min-h-11 rounded-[8px] border-0 bg-[#6460FF] px-5 py-3 !text-[14px] !font-semibold !leading-[21px] tracking-[0.5px] text-white shadow-[0_0_8px_0_rgba(100,96,255,0.1)] hover:bg-[#5550DD] hover:shadow-[0_0_12px_0_rgba(100,96,255,0.2)] active:!translate-y-0 active:scale-[0.98] active:bg-[#4440BB] disabled:!opacity-100 disabled:cursor-not-allowed disabled:bg-[#A295BD] disabled:text-[#666666] focus-visible:border-[#6460FF] focus-visible:ring-[#6460FF]/40",
        pdSecondary:
          "h-auto min-h-11 rounded-[8px] border border-[#A295BD] bg-[rgba(162,149,189,0.2)] px-5 py-3 !text-[14px] !font-semibold !leading-[21px] tracking-[0.5px] text-[#354052] shadow-none hover:border-[#6460FF] hover:bg-[rgba(162,149,189,0.3)] active:!translate-y-0 active:bg-[rgba(100,96,255,0.15)] active:text-[#6460FF] disabled:!opacity-100 disabled:bg-[rgba(162,149,189,0.1)] disabled:text-[#999999] focus-visible:border-[#6460FF]",
        pdGhost:
          "h-auto min-h-11 rounded-[8px] border-0 bg-transparent px-4 py-3 !text-[14px] !font-semibold !leading-[21px] tracking-[0.5px] text-[#354052] shadow-none hover:bg-[rgba(100,96,255,0.08)] hover:text-[#6460FF] active:!translate-y-0 active:bg-[rgba(100,96,255,0.15)] disabled:!opacity-100 disabled:text-[#999999] focus-visible:border-[#6460FF] focus-visible:ring-[#6460FF]/30",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
