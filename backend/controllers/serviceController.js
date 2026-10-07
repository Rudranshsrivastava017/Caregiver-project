const { ServiceModelAdapter } = require('../models/Service');
const { BookingModelAdapter } = require('../models/Booking');

// 1. Get all services with optional category & search filter
const getServices = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    let services = await ServiceModelAdapter.find();

    // Filter by Category if provided
    if (category && category !== 'all') {
      services = services.filter(
        (s) => s.category?.toLowerCase() === category.toLowerCase()
      );
    }

    // Filter by Search keyword if provided
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      services = services.filter(
        (s) =>
          s.serviceName?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.requiredQualification?.toLowerCase().includes(q)
      );
    }

    const allBookings = await BookingModelAdapter.find();
    const activeBookings = allBookings.filter((b) =>
      ['pending', 'confirmed', 'in_progress'].includes(b.status)
    );

    const enrichedServices = services.map((s) => {
      const raw = typeof s.toObject === 'function' ? s.toObject() : { ...s };
      const isBooked = activeBookings.some(
        (b) => b.serviceId === raw.serviceId || (raw.caregiverId && b.caregiverId === raw.caregiverId)
      );
      return {
        ...raw,
        isBooked,
      };
    });

    return res.status(200).json({
      status: 'success',
      count: enrichedServices.length,
      data: enrichedServices,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get a single service by ID
const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await ServiceModelAdapter.findById(id);

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Healthcare service not found.',
      });
    }

    const allBookings = await BookingModelAdapter.find();
    const activeBookings = allBookings.filter((b) =>
      ['pending', 'confirmed', 'in_progress'].includes(b.status)
    );
    const raw = typeof service.toObject === 'function' ? service.toObject() : { ...service };
    const isBooked = activeBookings.some(
      (b) => b.serviceId === raw.serviceId || (raw.caregiverId && b.caregiverId === raw.caregiverId)
    );

    return res.status(200).json({
      status: 'success',
      data: {
        ...raw,
        isBooked,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create a new service (Admin only)
const createService = async (req, res, next) => {
  try {
    const {
      serviceName,
      description,
      durationOptions,
      price,
      requiredQualification,
      category,
    } = req.body;

    if (!serviceName || !description || price === undefined || !requiredQualification || !category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide serviceName, description, price, requiredQualification, and category.',
      });
    }

    const serviceId = `SVC-${Date.now().toString().slice(-6)}`;
    const newService = await ServiceModelAdapter.createService({
      serviceId,
      serviceName: serviceName.trim(),
      description: description.trim(),
      durationOptions: durationOptions || ['4 Hours', '8 Hours', '12 Hours', '24 Hours'],
      price: parseFloat(price),
      requiredQualification: requiredQualification.trim(),
      category,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Healthcare service created successfully.',
      data: newService,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
};
