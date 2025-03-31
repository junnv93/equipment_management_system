import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { sendSuccess, sendError } from '../utils/response';

const prisma = new PrismaClient();

export const getEquipments = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [equipments, total] = await Promise.all([
      prisma.equipment.findMany({
        skip,
        take: Number(limit),
        orderBy: {
          [sortBy as string]: order,
        },
        include: {
          category: true,
          location: true,
        },
      }),
      prisma.equipment.count(),
    ]);

    sendSuccess(res, equipments, undefined, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    logger.error(`Error fetching equipments: ${error}`);
    sendError(res, 'Error fetching equipments');
  }
};

export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        maintenanceRecords: {
          orderBy: {
            date: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!equipment) {
      return sendError(res, 'Equipment not found', 404);
    }

    sendSuccess(res, equipment);
  } catch (error) {
    logger.error(`Error fetching equipment: ${error}`);
    sendError(res, 'Error fetching equipment');
  }
}; 