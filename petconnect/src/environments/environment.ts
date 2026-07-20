export const environment = {
  production: false,
  apiUrl: '/api/v1',
  baseUrl: 'http://localhost:4200',
  wsUrl: 'http://localhost:4200' // En desarrollo, el proxy redirigirá a 8080
};

export type Environment = typeof environment;
