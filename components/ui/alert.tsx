import type React from "react"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertProps {
  type?: "success" | "error" | "warning" | "info"
  title?: string
  children: React.ReactNode
  className?: string
}

const alertStyles = {
  success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300",
  error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
  warning:
    "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300",
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
}

const alertIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

export default function Alert({ type = "info", title, children, className }: AlertProps) {
  const Icon = alertIcons[type]

  return (
    <div className={cn("border rounded-lg p-4", alertStyles[type], className)}>
      <div className="flex">
        <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
