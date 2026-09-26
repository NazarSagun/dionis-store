'use client'

import { useState } from 'react'
import { Input, useToast } from '@repo/ui'

import { useSetAuthUserName } from '@/modules/auth/core/facade'

import { useChangePassword, useUpdateName } from '../../integration/repository'

const buttonStyles =
  'w-fit rounded-md border border-ink bg-neon-magenta px-6 py-3 font-display text-xs text-primary-foreground shadow-retro-sm disabled:pointer-events-none disabled:opacity-50'

export const SettingsSection = () => {
  const setUserName = useSetAuthUserName()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const { mutate: updateName, isPending: isUpdatingName } = useUpdateName({
    mutation: {
      onSuccess: (data) => {
        if (data.name) setUserName(data.name)
        toast({ title: 'Display name saved' })
      },
      onError: (error) => {
        toast({ variant: 'destructive', title: error.response?.data.message ?? 'Could not save the name' })
      },
    },
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword({
    mutation: {
      onSuccess: () => {
        setPasswordError(null)
        setCurrentPassword('')
        setNewPassword('')
        toast({ title: 'Password updated' })
      },
      onError: (error) => {
        setPasswordError(error.response?.data.message ?? 'Current password is incorrect')
      },
    },
  })

  return (
    <div data-testid='account-settings' className='w-full'>
      <h2 className='sr-only'>Settings</h2>
      <div className='flex w-full flex-col gap-10 sm:flex-row'>
        <form
          className='flex w-full max-w-[320px] flex-col gap-3'
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim()) updateName({ data: { name } })
          }}
        >
          <span className='font-mono text-sm font-bold text-foreground'>Display name</span>
          <Input
            data-testid='settings-name-input'
            name='settings-name'
            value={name}
            onInputChange={setName}
            placeholder='Display name'
          />
          <button type='submit' data-testid='settings-name-save' disabled={isUpdatingName} className={buttonStyles}>
            Save name
          </button>
        </form>

        <form
          className='flex w-full max-w-[320px] flex-col gap-3'
          onSubmit={(event) => {
            event.preventDefault()
            changePassword({ data: { currentPassword, newPassword } })
          }}
        >
          <span className='font-mono text-sm font-bold text-foreground'>Password</span>
          <Input
            data-testid='settings-current-password'
            name='settings-current-password'
            type='password'
            value={currentPassword}
            onInputChange={setCurrentPassword}
            placeholder='Current password'
          />
          <Input
            data-testid='settings-new-password'
            name='settings-new-password'
            type='password'
            value={newPassword}
            onInputChange={setNewPassword}
            placeholder='New password'
          />
          {passwordError && <p className='font-mono text-sm text-destructive'>{passwordError}</p>}
          <button
            type='submit'
            data-testid='settings-password-save'
            disabled={isChangingPassword}
            className={buttonStyles}
          >
            Change password
          </button>
        </form>
      </div>
    </div>
  )
}
