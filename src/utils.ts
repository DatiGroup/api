import { FastifyRequest } from 'fastify';

export const unProtectedRoutes: { 
  url: string; 
  method: string; 
  queryParams?: Record<string, string>; 
}[] = [
  { url: '/public', method: 'GET' }, 
  { url: '/health', method: 'GET' }, 
  { url: '/status', method: 'GET', queryParams: { detail: 'basic' } },
];

export const handleRouteSecurity = (request: FastifyRequest): boolean => {
  const query = (request.query as Record<string, string>) || {};

  return unProtectedRoutes.some((route) => {
    const isUrlMatch = route.url === request.url;
    const isMethodMatch = route.method === request.method;

    if (isUrlMatch && isMethodMatch) {
      const isQueryParamsMatch =
        !route.queryParams || JSON.stringify(route.queryParams) === JSON.stringify(query);
      return isQueryParamsMatch;
    }

    return false;
  });
};