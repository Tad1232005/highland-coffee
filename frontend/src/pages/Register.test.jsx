import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '../components/ToastProvider'
import { AuthProvider } from '../context/AuthProvider'
import { Register } from './Register'

function renderRegister() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('Register', () => {
  it('hien thi du cac truong thong tin', () => {
    renderRegister()
    expect(screen.getByLabelText('Họ và tên')).toBeTruthy()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Mật khẩu')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Tạo tài khoản' })).toBeTruthy()
  })

  it('bao loi khi gui form rong', async () => {
    renderRegister()
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    await waitFor(() => {
      expect(screen.getByText('Tên quá ngắn, cần ít nhất 2 ký tự.')).toBeTruthy()
    })
    expect(screen.getByText('Vui lòng nhập email.')).toBeTruthy()
    expect(screen.getByText('Mật khẩu phải có ít nhất 8 ký tự.')).toBeTruthy()
  })

  it('bao loi mat khau khong co chu va so', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Văn A' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'abcdefgh' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    await waitFor(() => {
      expect(screen.getByText('Mật khẩu phải có cả chữ và số.')).toBeTruthy()
    })
  })

  it('tao tai khoan thanh cong', async () => {
    renderRegister()
    fireEvent.change(screen.getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Văn A' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'khach_moi@example.com' } })
    fireEvent.change(screen.getByLabelText('Mật khẩu'), { target: { value: 'Abcdef123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    await waitFor(() => {
      expect(screen.getByText('Tạo tài khoản xong. Chúc bạn nhiều ly ngon!')).toBeTruthy()
    })
  })
})
