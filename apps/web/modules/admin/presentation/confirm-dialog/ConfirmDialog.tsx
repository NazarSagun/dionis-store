import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@repo/ui'

import { adminButtonText } from '../../domain/styles'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  isPending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
    <DialogContent
      data-testid='admin-confirm-dialog'
      className='w-[480px] max-w-[calc(100vw-32px)] rounded-[10px] border border-border bg-card p-8'
    >
      <DialogTitle className='font-display text-lg font-medium text-foreground'>{title}</DialogTitle>
      <DialogDescription className='font-sans text-sm text-muted-foreground'>{description}</DialogDescription>
      <div className='flex justify-end gap-3 pt-2'>
        <Button data-testid='admin-cancel-button' variant='secondary' className={adminButtonText} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          data-testid='admin-confirm-button'
          variant='destructive'
          className={adminButtonText}
          disabled={isPending}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
)
