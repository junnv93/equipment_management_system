import { Router } from 'express';
import { getEquipments, getEquipmentById } from '../controllers/equipment.controller';
import { validatePaginationQuery } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.get('/', validatePaginationQuery, cacheMiddleware('equipments'), getEquipments);
router.get('/:id', cacheMiddleware('equipment'), getEquipmentById);

export default router; 