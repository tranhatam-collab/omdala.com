import { APP_ROUTES } from './routes'

export const APP_PRIMARY_NAV = [
  { label: 'Dashboard', href: APP_ROUTES.dashboard },
  { label: 'Nodes', href: APP_ROUTES.nodes },
  { label: 'Resources', href: APP_ROUTES.resources },
  { label: 'Profile', href: APP_ROUTES.profile },
  { label: 'Settings', href: APP_ROUTES.settings },
] as const

export const AUTH_ENTRY_LINKS = [
  { label: 'Log in', href: APP_ROUTES.login },
  { label: 'Create account', href: APP_ROUTES.signup },
] as const
