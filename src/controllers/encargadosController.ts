import { Request, Response } from 'express';
import { hashPasword } from '../services/password.service';
import prisma from '../models/encargado';


export const createEncargado = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, paterno, materno, ci, ext, celular, alojamientoId, userId } = req.body;
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

        const encargado = await prisma.create({
            data: {
                nombre, paterno, materno, ci, ext, celular, alojamientoId, userId, created_at: new Date().toISOString(), updated_at: varnull
            }
        })
        res.status(201).json(encargado)

    } catch (error: any) {
        /*if(error?.code === 'P2002' && error?.meta?.target?.includes('email')){
            res.status(404).json({message: 'El mail ingresado ya existe'})
            return
        }*/
        console.log(error);
        res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
    }
}

export const getallEncargados = async (req: Request, res: Response): Promise<void> => {
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
        const encargados = await prisma.findMany({
            skip: skip,
            take: limit,
            where,
            orderBy: {
                created_at: 'desc'
            },
            include: {
                alojamiento: true,
                user: true,
                reservaciones: true // Incluye los detalles del alojamiento
            }
        });
        const totalRecords = await prisma.count({ where });
        res.status(200).json({
            statusCode: 200,
            message: "Registros encontrados",
            data: encargados,
            count: totalRecords
        })
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
    }
}

export const getallEncargadosById = async (req: Request, res: Response): Promise<void> => {
    const encargadoId = parseInt(req.params.id)
    try {
        const encargado = await prisma.findUnique({
            where: {
                id: encargadoId
            }
        })
        if (!encargado) {
            res.status(404).json({ error: 'El alojamiento no fue encontrado' })
            return
        }
        res.status(200).json(encargado)
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
    }
}

export const updateEncargado = async (req: Request, res: Response): Promise<void> => {
    const encargadoId = parseInt(req.params.id)
    const { nombre, paterno, materno, ci, ext, celular, alojamientoId, userId } = req.body;
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
        if (ext) {
            dataToUpdate.ext = ext
        }
        if (celular) {
            dataToUpdate.celular = celular
        }
        if (alojamientoId) {
            dataToUpdate.alojamientoId = alojamientoId
        }
        if (userId) {
            dataToUpdate.userId = userId
        }

        dataToUpdate.updated_at = new Date().toISOString()

        const encargado = await prisma.update({
            where: {
                id: encargadoId
            }, data: dataToUpdate
        })
        res.status(200).json(encargado)
    } catch (error: any) {
        if (error?.code === 'P2025') {
            res.status(400).json({ error: 'Alojamiento no encontrado' })
            return
        } else {
            console.log(error);
            res.status(500).json({ error: 'Hubo un error, pruebe mas tarde' })
            return
        }

    }
}

export const deleteEncargado = async (req: Request, res: Response): Promise<void> => {
    const encargadoId = parseInt(req.params.id)
    try {
        await prisma.delete({
            where: {
                id: encargadoId
            }
        })
        res.status(200).json({
            message: `El usuario ${encargadoId} ha sido eliminado`
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


export const getByIdEncargadoUser = async (req: Request, res: Response): Promise<void> => {
    const userId = parseInt(req.params.id)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    //let where: { [key: string]: any } = {};

    let where: { [key: string]: any } = {
        alojamiento: {
            encargados: {
                some: {
                    userId: userId,
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

        const encargado = await prisma.findMany({
            select: {
                id: true,
                nombre: true,
                paterno: true,
                materno: true,
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