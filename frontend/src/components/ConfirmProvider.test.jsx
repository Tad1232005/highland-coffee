import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConfirmProvider } from './ConfirmProvider'
import { ToastProvider } from './ToastProvider'
import { useConfirm } from '../context/useConfirm'
import { useToast } from '../context/useToast'

function Harness() {
  const confirm = useConfirm()
  const { notify } = useToast()

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const ok = await confirm({ title: 'Xoá món?', message: 'Khong the hoan tac.' })
          notify(ok ? 'Da xoa' : 'Da huy', { type: ok ? 'success' : 'info' })
        }}
      >
        Mo hop thoai
      </button>
    </div>
  )
}

function renderHarness() {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        <Harness />
      </ConfirmProvider>
    </ToastProvider>,
  )
}

describe('ConfirmProvider', () => {
  it('mo hop thoai xac nhan', async () => {
    renderHarness()
    fireEvent.click(screen.getByRole('button', { name: 'Mo hop thoai' }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
    expect(screen.getByText('Xoá món?')).toBeTruthy()
  })

  it('tra ve true khi dong y', async () => {
    renderHarness()
    fireEvent.click(screen.getByRole('button', { name: 'Mo hop thoai' }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đồng ý' }))
    await waitFor(() => {
      expect(screen.getByText('Da xoa')).toBeTruthy()
    })
  })

  it('tra ve false khi dong hop thoai', async () => {
    renderHarness()
    fireEvent.click(screen.getByRole('button', { name: 'Mo hop thoai' }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Huỷ' }))
    await waitFor(() => {
      expect(screen.getByText('Da huy')).toBeTruthy()
    })
  })
})
