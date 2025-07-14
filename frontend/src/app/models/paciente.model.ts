export interface Paciente {
  id?: number;
  nombre: string;
  apellido: string;
  rut: string;
  fechaNacimiento: string; // ISO string (yyyy-MM-dd)
  direccion: string;
  telefono: string;
  esBeneficiario?: boolean;
  tipoBeneficio?: 'ADULTO_MAYOR' | 'CRONICO' | 'GRATUIDAD_PSICOTROPICOS' | null;
}
