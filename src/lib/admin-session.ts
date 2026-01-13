// Shared session store for admin authentication
const sessions = new Map<string, { username: string; expires: number }>()

export function createSession(username: string, duration: number = 24 * 60 * 60 * 1000): string {
  const sessionToken = crypto.randomUUID()
  const expiresAt = Date.now() + duration
  
  sessions.set(sessionToken, {
    username: username,
    expires: expiresAt
  })
  
  return sessionToken
}

export function validateSession(sessionToken: string): { valid: boolean; username?: string } {
  const session = sessions.get(sessionToken)
  
  if (!session || session.expires < Date.now()) {
    // Session expired or invalid
    sessions.delete(sessionToken)
    return { valid: false }
  }
  
  return { valid: true, username: session.username }
}

export function removeSession(sessionToken: string): void {
  sessions.delete(sessionToken)
}

export function cleanupExpiredSessions(): void {
  const now = Date.now()
  for (const [token, session] of sessions.entries()) {
    if (session.expires < now) {
      sessions.delete(token)
    }
  }
}

// Auto-cleanup expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000)