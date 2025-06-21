export interface Paciente {
  id?: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string; // ISO string (yyyy-MM-dd)
  direccion: string;
  telefono: string;
}
