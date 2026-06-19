export const APP_ROUTES = {
  PUBLIC: {
    HOME: '/',
    ACOMPANHAR: '/acompanhar',
  },
  PRIVATE: {
    PAINEL: '/painel',
    SINISTRO: (numero: string) => `/painel/${numero}`,
    ASSISTENTE: '/assistente',
  },
} as const;
