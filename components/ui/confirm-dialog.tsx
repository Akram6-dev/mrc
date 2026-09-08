"use client"
import { AlertTriangle } from "lucide-react"
import Modal from "./modal"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: "danger" | "warning" | "info"
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  type = "danger",
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const iconColors = {
    danger: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  }

  const buttonColors = {
    danger: "btn-danger",
    warning:
      "bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-200",
    info: "btn-primary",
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <AlertTriangle className={`w-6 h-6 ${iconColors[type]}`} />
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>

        <div className="flex space-x-3 justify-center">
          <button onClick={onClose} className="btn-secondary">
            {cancelText}
          </button>
          <button onClick={handleConfirm} className={buttonColors[type]}>
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
