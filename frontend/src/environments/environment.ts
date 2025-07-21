export const environment = {
  production: false,
  apiBase: 'http://localhost:8081/api',
  // URLs específicas para cada microservicio en desarrollo (localhost)
  endpoints: {
    compras: 'http://localhost:8082/api/compras',
    facturas: 'http://localhost:8082/api/facturas',
    guiasDespacho: 'http://localhost:8082/api/guias-despacho',
    inventario: 'http://localhost:8081/api/inventario',
    ventas: 'http://localhost:8084/api/ventas',
    precios: 'http://localhost:8086/api/precios',
    dashboard: 'http://localhost:8085/api/dashboard',
    seguridad: 'http://localhost:8083/api/seguridad',
    backend: 'http://localhost:8080/api',
    // Endpoints específicos para el microservicio de ventas
    sales: 'http://localhost:8084/api/sales',
    inventoryQuery: 'http://localhost:8084/api/inventory-query',
    pricelist: 'http://localhost:8081/api/pricelist'
  }
};