export const environment = {
  production: false,
  apiUrl: '/api/v1',
  baseUrl: 'http://localhost:4200',
  wsUrl: 'http://localhost:4200', // En desarrollo, el proxy redirigirá a 8080
  googleClientId: '859858948205-gl3cjmmbqkft29t5nn0bc5evqd32svsf.apps.googleusercontent.com'
};

export type Environment = typeof environment;
