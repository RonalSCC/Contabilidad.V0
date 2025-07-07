export interface AsientoContable {
    id: string
    fechaFiscal: string
    identificacionContable: IdentificacionContable
    estado: number
    partidasContables: PartidasContable[]
}

export interface IdentificacionContable {
    abreviatura: string
    nombre: string
    consecutivo: string
}

export interface PartidasContable {
    id: string
    cuentaContable: CuentaContable
    centroCosto: CentroCosto
    valorDebito: ValorDebito
    valorCredito: ValorCredito
    tercero: Tercero
    tasaCambio: number
    descripcion: string
    tieneDebito: boolean
    tieneCredito: boolean
}

export interface CuentaContable {
    codigo: string
    nombre: string
    subCuentas: string[]
    naturaleza: number
}

export interface CentroCosto {
    codigo: string
    nombre: string
}

export interface ValorDebito {
    moneda: number
    valor: number
}

export interface ValorCredito {
    moneda: number
    valor: number
}

export interface Tercero {
    tipoIdentificacion: string
    numeroIdentificacion: string
}
