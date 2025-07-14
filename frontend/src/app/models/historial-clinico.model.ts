export interface HistorialClinico {
    diagnostico: string;
    /** La fecha en formato ISO string (YYYY-MM-DDTHH:mm:ss.sssZ) */
    fecha: string;
    observaciones: string;
    tratamiento: string;
    medicamentosRecetados: string;
    pacienteRut: string;
}
