export interface GuiaDespacho {
  id?: number;
  numeroGuia: string;
  facturaId: number;
  transportista: string;
  estado?: string;
  fechaEmision?: string;
}
