import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import App from './App.jsx'

describe('App', () => {
  it('renders the Highlands header and the hero headline', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: /Pha phin đúng cách/i })).toBeTruthy()
    expect(screen.getAllByText('Highlands').length).toBeGreaterThan(0)
  })
})
