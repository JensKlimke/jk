
export interface UserData {
  id?: string
  name: string
  email: string
  avatar?: string
  role: string
}

export interface AuthData {
  user ?: UserData;
  clientToken ?: string
  accessToken ?: string
}
