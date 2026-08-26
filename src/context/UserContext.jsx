import { createContext, useContext, useMemo } from 'react'

const UserContext = createContext(null)

const defaultUser = {
  name: 'Customer',
  email: 'customer@example.com',
  role: 'User',
}

export function UserProvider({ children }) {
  const value = useMemo(
    () => ({
      user: defaultUser,
      isLoggedIn: true,
    }),
    [],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }

  return context
}
