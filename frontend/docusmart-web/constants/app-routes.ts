export const APP_ROUTES = {
  PUBLIC: {
    HOME: '/',
    ACOMPANHAR: '/acompanhar',
    LOGIN: '/login',
  },
  PRIVATE: {
    PAINEL: '/painel',
    SINISTRO: (numero: string) => `/painel/${numero}`,
    ASSISTENTE: '/assistente',
  },
} as const;
