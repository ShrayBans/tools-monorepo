import { useTheme } from "../context/ThemeProvider"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme as ToasterProps["theme"]}
      className="top-0 toaster group"
      position="top-right"
      offset={14}
      gap={8}
      closeButton
      style={
        {
          "--mobile-offset-top": "14px",
          "--mobile-offset-left": "14px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:py-[12px] group-[.toaster]:px-4 group-[.toaster]:bg-popover group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          title: "text-sm -mt-[2px]",
          description: "group-[.toast]:text-muted-foreground text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton: "!left-[auto] !right-[0px]",
        },
      }}
      {...props}
    />
    // <Sonner
    //   theme={theme as ToasterProps["theme"]}
    //   className="toaster group"
    //   position="top-right"
    //   offset={14}
    //   gap={8}
    //   closeButton
    //   toastOptions={{
    //     classNames: {
    //       toast:
    //         "group toast pt-[13px] pb-[12px] px-4 bg-popover flex flex-row border rounded-md w-full gap-1 shadow-lg !items-start",
    //       title: "text-sm -mt-[2px]",
    //       description: "group-[.toast]:text-muted-foreground text-xs",
    //       error:
    //         "[&>*:first-child]:mt-[2px] [&>*:first-child]:text-destructive",
    //       // success: "[&>*:first-child]:mt-[2px] [&>*:first-child]:text-primary",
    //       // info: "[&>*:first-child]:mt-[2px]",
    //       // warning: "[&>*:first-child]:mt-[2px]",
    //       closeButton: "!left-[auto] !right-[0px]",

    //       // toast:
    //       //   "w-full group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
    //       // description: "group-[.toast]:text-muted-foreground text-xs",
    //       actionButton:
    //         "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
    //       cancelButton:
    //         "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
    //     },
    //   }}
    //   {...props}
    // />
  )
}

export { Toaster, toast }
