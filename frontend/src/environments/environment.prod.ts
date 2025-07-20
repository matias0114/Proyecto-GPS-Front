export const environment = {
  production: true,
  apiBase: '/api',
  // URLs específicas para cada microservicio en producción
  endpoints: {
    compras: '/api/compras',
    facturas: '/api/facturas',
    guiasDespacho: '/api/guias-despacho',
    inventario: '/api/inventario',
    ventas: '/api/ventas',
    precios: '/api/precios',
    dashboard: '/api/dashboard',
    seguridad: '/api/seguridad',
    backend: '/api'
  }
};