
// user data definition
export type UserType = {
  name: string
  email: string
  avatar?: string
  id: string
  isEmailVerified: boolean
  role: string
}

// session data definition
export type SessionType = {
  user: UserType
  token: string
}

export type RegisterValuesType = {
  name: string;
  email: string;
  password: string;
}

export type LoginCallback = () => void;
export type LogoutCallback = () => void;
export type RenewCallback = () => void;
export type FakeSessionCallback = (type: string) => void;

// the context data definition
export type AuthContextType = {
  session?: SessionType
  pending: boolean
  login: LoginCallback
  logout: LogoutCallback
  createFakeSession: FakeSessionCallback
  renew: RenewCallback
}
