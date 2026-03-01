const { prisma } = require('../config/db');
const logger = require('../config/logger');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const { subscriptionId } = req.query;
    const where = { isActive: true };
    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }
    const services = await prisma.service.findMany({
      where,
    });
    res.json(services);
  } catch (error) {
    logger.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services' });
  }
};

// Create service (Admin only)
exports.createService = async (req, res) => {
  try {
    const { name, description, duration, price, subscriptionId } = req.body;
    const service = await prisma.service.create({
      data: { name, description, duration: parseInt(duration), price: parseFloat(price), subscriptionId },
    });
    res.status(201).json(service);
  } catch (error) {
    logger.error('Error creating service:', error);
    res.status(500).json({ message: 'Error creating service' });
  }
};

// Update service (Admin only)
exports.updateService = async (req, res) => {
  try {
    const { name, description, duration, price, isActive } = req.body;
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: { 
        name, 
        description, 
        duration: duration ? parseInt(duration) : undefined, 
        price: price ? parseFloat(price) : undefined,
        isActive
      },
    });
    res.json(service);
  } catch (error) {
    logger.error('Error updating service:', error);
    res.status(500).json({ message: 'Error updating service' });
  }
};

// Delete service (Admin only)
exports.deleteService = async (req, res) => {
  try {
    await prisma.service.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    logger.error('Error deleting service:', error);
    res.status(500).json({ message: 'Error deleting service' });
  }
};

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, startTime, notes, subscriptionId } = req.body;
    const userId = req.user.id;

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);

    // Basic overlap check (optional but recommended)
    const overlap = await prisma.booking.findFirst({
      where: {
        serviceId,
        status: 'confirmed',
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          },
        ],
      },
    });

    if (overlap) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        serviceId,
        subscriptionId,
        startTime: start,
        endTime: end,
        notes,
      },
      include: { service: true },
    });

    res.status(201).json(booking);
  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking' });
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const { subscriptionId } = req.query;
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    
    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: { 
        service: true,
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { startTime: 'asc' },
    });
    res.json(bookings);
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
};
