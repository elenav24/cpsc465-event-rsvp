import { apiFetch } from './client'
import type { UserOut } from './types'

// Base URL already ends in /users, so paths here are relative to that.

export function getMe(): Promise<UserOut> {
  return apiFetch('users', '/me')
}

export function updateMe(body: {
  display_name?: string
  phone_number?: string
  sms_opted_in?: boolean
}): Promise<UserOut> {
  return apiFetch('users', '/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function getUserById(userId: number): Promise<UserOut> {
  return apiFetch('users', `/${userId}`)
}
