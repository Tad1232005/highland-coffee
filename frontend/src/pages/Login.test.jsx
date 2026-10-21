import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '../components/ToastProvider'
import { AuthProvider } from '../context/AuthProvider'
import { Login } from './Login'

function renderLogin() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('Login', () => {
  it('hien thi truong dang nhap va nut tai khoan demo', () => {
    renderLogin()
    expect(screen.getByLabelText('Email')).toBeTruthy()
    expect(screen.getByLabelText('Mật khẩu')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Khách hàng' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Quản trị' })).toBeTruthy()
  })

  it('bao loi khi gui form rong', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    await waitFor(() => {
      expect(screen.getByText('Vui lòng nhập email.')).toBeTruthy()
    })
    expect(screen.getByText('Vui lòng nhập mật khẩu.')).toBeTruthy()
  })

  it('dien san tai khoan demo khi bam chip', () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Khách hàng' }))
    expect(screen.getByLabelText('Email').value).toBe('customer@highland.vn')
  })

  it('dang nhap thanh cong voi tai khoan demo', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Khách hàng' }))
    fireEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    await waitFor(() => {
      expect(screen.getByText('Đăng nhập thành công')).toBeTruthy()
    })
  })
})
