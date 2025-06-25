import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ToastIcon,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }, index) {
        return (
          <Toast
            key={id}
            variant={variant}
            className="fade-in hover:scale-[1.02] transition-all duration-300 ease-out"
            style={{ animationDelay: `${index * 100}ms` }}
            {...props}
          >
            <div className="flex items-start gap-3">
              <div className="icon-hover-bounce">
                <ToastIcon variant={variant} />
              </div>
              <div className="grid gap-1 flex-1">
                {title && (
                  <ToastTitle className="font-semibold transition-all duration-300">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="transition-all duration-300">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="hover:scale-110 transition-all duration-200 ease-out" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
