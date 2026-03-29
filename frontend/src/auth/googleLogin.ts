const domain = import.meta.env.VITE_COGNITO_DOMAIN
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID

export function redirectToGoogle() {
  const redirectUri = encodeURIComponent(window.location.origin)
  window.location.href =
    `${domain}/oauth2/authorize` +
    `?client_id=${clientId}` +
    `&response_type=code` +
    `&scope=email+openid+profile` +
    `&identity_provider=Google` +
    `&redirect_uri=${redirectUri}`
}
