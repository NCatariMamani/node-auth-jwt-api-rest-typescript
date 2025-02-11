import { Request, Response } from 'express';
import { hashPasword } from '../services/password.service';
import prisma from '../models/cliente';


export const createCliente = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, paterno, materno, ci, extencion, alojamientoId } = req.body;
        /*if(!email) {
            res.status(404).json({message: 'El email es obligatorio'})
            return
         }
         if(!password){
            res.status(404).json({message: 'El password es obligatorio'})
            return
        } */
        //const hashedPassword = await hashPasword(password)
        const varnull: any = null

        const cliente = await prisma.create({
            data: {
                nombre, paterno, materno, ci, extencion, alojamientoId, created_at: new Date().toISOString(), updated_at: varnull
            }
        })
        res.status(201).json(cliente)

    } catch (error: any) {
        if (error.code === 'P2003') {
            res.status(404).json({ message: 'No existe Id de ese alojamiento' })
            return
        }
        console.log(error.code);
        res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
    }
}

export const getallClientes = async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    let where: { [key: string]: any } = {};

    // Manejar el parámetro de filtro
    for (const key in req.query) {
        if (key.startsWith('filter.')) {
            const field = key.replace('filter.', '');
            const value = req.query[key] as string;
            const [op, filterValue] = value.split(':');

            if (field.includes('.')) {
                const [relation, fieldName] = field.split('.');

                if (!where[relation]) {
                    where[relation] = {};
                }

                if (op === '$ilike') {
                    where[relation][fieldName] = {
                        contains: filterValue,
                        mode: 'insensitive' // Para búsqueda case-insensitive
                    };
                } else if (op === '$eq') {
                    where[relation][fieldName] = filterValue;
                }
            } else {
                if (op === '$ilike') {
                    where[field] = {
                        contains: filterValue,
                        mode: 'insensitive' // Para búsqueda case-insensitive
                    };
                } else if (op === '$eq') {
                    if (field === 'fecha') {
                        const date = String(filterValue);
                        const newDate = new Date(date);
                        if (date.toString() !== 'Invalid Date') {
                            // Ajuste para comparar solo la parte de la fecha
                            const startOfDay = new Date(newDate.setUTCHours(0, 0, 0, 0));
                            const endOfDay = new Date(newDate.setUTCHours(23, 59, 59, 999));
                            where[field] = {
                                gte: startOfDay,
                                lte: endOfDay
                            };
                        }
                    } else {
                        where[field] = Number(filterValue);
                    }
                }
            }


        }
    }

    try {


        const clientes = await prisma.findMany({
            skip: skip,
            take: limit,
            where,
            orderBy: {
                created_at: 'desc'
            }, include: {
                alojamientos: true // Incluye los detalles del alojamiento
            }
        });
        const totalRecords = await prisma.count({ where });
        res.status(200).json({
            statusCode: 200,
            message: "Registros encontrados",
            data: clientes,
            count: totalRecords
        });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
    }
}

export const getallClienteById = async (req: Request, res: Response): Promise<void> => {
    const clienteId = parseInt(req.params.id)
    try {
        const cliente = await prisma.findUnique({
            where: {
                id: clienteId
            }
        })
        if (!cliente) {
            res.status(404).json({ error: 'El alojamiento no fue encontrado' })
            return
        }
        res.status(200).json(cliente)
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
    }
}

export const updateCliente = async (req: Request, res: Response): Promise<void> => {
    const clienteId = parseInt(req.params.id)
    const { nombre, paterno, materno, ci, extencion, alojamientoId } = req.body
    try {
        let dataToUpdate: any = { ...req.body }
        if (nombre) {
            dataToUpdate.nombre = nombre
        }
        if (paterno) {
            dataToUpdate.paterno = paterno
        }
        if (materno) {
            dataToUpdate.materno = materno
        }
        if (ci) {
            dataToUpdate.ci = ci
        }
        if (extencion) {
            dataToUpdate.extencion = extencion
        }
        if (alojamientoId) {
            dataToUpdate.alojamientoId = alojamientoId
        }

        dataToUpdate.updated_at = new Date().toISOString()

        const compra = await prisma.update({
            where: {
                id: clienteId
            }, data: dataToUpdate
        })
        res.status(200).json(compra)
    } catch (error: any) {
        if (error?.code === 'P2025') {
            res.status(400).json({ error: 'Alojamiento no encontrado' })
            return
        } else if (error?.code === 'P2003') {
            console.log(error);
            res.status(500).json({ error: 'No existe Id de ese alojamiento' })
            return
        } else {
            console.log(error);
            res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
            return
        }

    }
}

export const deleteCliente = async (req: Request, res: Response): Promise<void> => {
    const clienteId = parseInt(req.params.id)
    try {
        await prisma.delete({
            where: {
                id: clienteId
            }
        })
        res.status(200).json({
            message: `El usuario ${clienteId} ha sido eliminado`
        }).end()
    } catch (error: any) {
        if (error?.code === 'P2025') {
            res.status(400).json({ error: 'Usuario no encontrado' })
            return
        } else if (error?.code === 'P2003') {
            res.status(409).json({ error: 'No se puede completar la operación debido a una restricción de clave externa.' })
            return
        } else {
            console.log(error);
            res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
            return
        }
    }
}


export const getByIdAlojaClientes = async (req: Request, res: Response): Promise<void> => {
    const alojaId = parseInt(req.params.id)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    //let where: { [key: string]: any } = {};

    let where: { [key: string]: any } = {
        alojamientos: {
            id: alojaId,
        },
    };

    // Manejar el parámetro de filtro
    for (const key in req.query) {
        if (key.startsWith('filter.')) {
            const field = key.replace('filter.', '');
            const value = req.query[key] as string;
            const [op, filterValue] = value.split(':');
            if (op === '$ilike') {
                where[field] = {
                    contains: filterValue,
                    mode: 'insensitive' // Para búsqueda case-insensitive
                };
            } else if (op === '$eq') {
                where[field] = Number(filterValue);
            }
        }
    }


    try {

        const encargado = await prisma.findMany({
            select: {
                id: true,
                nombre: true,
                paterno: true,
                materno: true,
                ci: true,
                extencion: true,
            },
            where: where,
            orderBy: {
                id: 'asc',  // Ordenar por el número de la habitación
            },
        });

        const totalRecords = await prisma.count({ where });

        console.log(totalRecords);

        res.status(200).json({
            statusCode: 200,
            message: "Registros encontrados",
            data: encargado,
            count: totalRecords
        })
        if (!encargado) {
            res.status(404).json({ error: 'El alojamiento no fue encontrado' })
            return
        }
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
    }
}


export const getAllVentaByIdClient = async (req: Request, res: Response): Promise<void> => {
    const reserId = parseInt(req.params.id)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    //let where: { [key: string]: any } = {};

    let where: { [key: string]: any } = {
        reservaciones: {
            some: {
                id: reserId,
                ventas: {
                    some: {},
                },
            },
        },
    };

    // Manejar el parámetro de filtro
    for (const key in req.query) {
        if (key.startsWith('filter.')) {
            const field = key.replace('filter.', '');
            const value = req.query[key] as string;
            const [op, filterValue] = value.split(':');
            if (op === '$ilike') {
                where[field] = {
                    contains: filterValue,
                    mode: 'insensitive' // Para búsqueda case-insensitive
                };
            } else if (op === '$eq') {
                where[field] = Number(filterValue);
            }
        }
    }


    try {

        const ventas = await prisma.findMany({
            skip: skip,
            take: limit,
            select: {
                id: true,
                nombre: true,
                paterno: true,
                materno: true,
                reservaciones: {
                    select: {
                        fecha: true,
                    },
                    where: {
                        id: reserId,
                    },
                },
            },
            where: where,
        });

        const transformed = ventas.map(item => ({
            id: item.id,
            reservaciones: `${item.nombre} ${item.paterno} ${item.materno}`,
            fecha: item.reservaciones[0]?.fecha || null, // Toma la primera fecha o `null` si no hay
          }));

        const totalRecords = await prisma.count({ where });

        res.status(200).json({
            statusCode: 200,
            message: "Registros encontrados",
            data: transformed,
            count: totalRecords
        })
        if (!ventas) {
            res.status(404).json({ error: 'El alojamiento no fue encontrado' })
            return
        }
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
    }
}