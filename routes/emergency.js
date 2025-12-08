// const express = require('express');
// const { body, query } = require('express-validator');
// const { protect } = require('../middleware/auth');
// const asyncHandler = require('../middleware/asyncHandler');
// const handleValidationErrors = require('../middleware/validation');
// const {
//   getEmergencyMedicalInfo,
//   updateEmergencyMedicalInfo,
//   getEmergencyContacts,
//   updateEmergencyContacts,
//   triggerEmergency,
//   connectEmergencyDoctor,
//   dispatchAmbulance,
//   endEmergency,
//   getEmergencyServices
// } = require('../models/emergency');

// const router = express.Router();

// // All routes protected
// router.use(protect);

// // @desc    Get emergency medical info
// // @route   GET /api/emergency/medical-info
// // @access  Private
// router.get('/medical-info', asyncHandler(async (req, res) => {
//   const medicalInfo = await getEmergencyMedicalInfo(req.user.id);
  
//   res.status(200).json({
//     success: true,
//     data: medicalInfo
//   });
// }));

// // @desc    Update emergency medical info
// // @route   PUT /api/emergency/medical-info
// // @access  Private
// router.put('/medical-info', [
//   body('blood_type').optional().isString(),
//   body('allergies').optional().isArray(),
//   body('medications').optional().isArray(),
//   body('conditions').optional().isArray(),
//   body('emergency_notes').optional().isString(),
//   body('doctor_name').optional().isString(),
//   body('doctor_phone').optional().isString(),
//   body('insurance_provider').optional().isString(),
//   body('insurance_id').optional().isString()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const updatedInfo = await updateEmergencyMedicalInfo(req.user.id, req.body);
  
//   res.status(200).json({
//     success: true,
//     message: 'Medical information updated',
//     data: updatedInfo
//   });
// }));

// // @desc    Get emergency contacts
// // @route   GET /api/emergency/contacts
// // @access  Private
// router.get('/contacts', asyncHandler(async (req, res) => {
//   const contacts = await getEmergencyContacts(req.user.id);
  
//   res.status(200).json({
//     success: true,
//     count: contacts.length,
//     data: contacts
//   });
// }));

// // @desc    Update emergency contacts
// // @route   PUT /api/emergency/contacts
// // @access  Private
// router.put('/contacts', [
//   body('contacts').isArray(),
//   body('contacts.*.name').isString().notEmpty(),
//   body('contacts.*.phone').isString().notEmpty(),
//   body('contacts.*.email').optional().isEmail(),
//   body('contacts.*.relationship').isString(),
//   body('contacts.*.is_primary').isBoolean()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const updatedContacts = await updateEmergencyContacts(req.user.id, req.body.contacts);
  
//   res.status(200).json({
//     success: true,
//     message: 'Emergency contacts updated',
//     data: updatedContacts
//   });
// }));

// // @desc    Trigger emergency
// // @route   POST /api/emergency/trigger
// // @access  Private
// router.post('/trigger', [
//   body('location').optional().isObject(),
//   body('medical_info').optional().isObject()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const emergency = await triggerEmergency(req.user.id, req.body);
  
//   res.status(201).json({
//     success: true,
//     message: 'Emergency triggered successfully',
//     data: emergency
//   });
// }));

// // @desc    Connect to emergency doctor
// // @route   POST /api/emergency/connect-doctor
// // @access  Private
// router.post('/connect-doctor', [
//   body('location').optional().isObject(),
//   body('medical_info').optional().isObject()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const result = await connectEmergencyDoctor(req.user.id, req.body.location, req.body.medical_info);
  
//   res.status(200).json({
//     success: true,
//     message: 'Connecting to emergency doctor',
//     data: result
//   });
// }));

// // @desc    Dispatch ambulance
// // @route   POST /api/emergency/dispatch-ambulance
// // @access  Private
// router.post('/dispatch-ambulance', [
//   body('location').isObject(),
//   body('medical_info').optional().isObject(),
//   body('hospital_id').optional().isInt(),
//   body('estimated_arrival').optional().isString()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const dispatch = await dispatchAmbulance(
//     req.user.id,
//     req.body.location,
//     req.body.medical_info,
//     req.body.hospital_id
//   );
  
//   res.status(201).json({
//     success: true,
//     message: 'Ambulance dispatched',
//     data: dispatch
//   });
// }));

// // @desc    End emergency
// // @route   POST /api/emergency/end
// // @access  Private
// router.post('/end', [
//   body('emergency_log_id').isInt()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   const endedEmergency = await endEmergency(req.user.id, req.body.emergency_log_id);
  
//   res.status(200).json({
//     success: true,
//     message: 'Emergency ended',
//     data: endedEmergency
//   });
// }));

// // @desc    Get emergency services
// // @route   GET /api/emergency/services
// // @access  Private
// router.get('/services', asyncHandler(async (req, res) => {
//   const services = await getEmergencyServices();
  
//   res.status(200).json({
//     success: true,
//     count: services.length,
//     data: services
//   });
// }));

// // @desc    Notify emergency contact
// // @route   POST /api/emergency/notify-contact
// // @access  Private
// router.post('/notify-contact', [
//   body('contact_id').isInt(),
//   body('message').isString()
// ], handleValidationErrors, asyncHandler(async (req, res) => {
//   // This would typically send SMS/email notifications
//   // For now, we'll just return success
  
//   res.status(200).json({
//     success: true,
//     message: 'Contact notified'
//   });
// }));

// module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const handleValidationErrors = require('../middleware/validation');
const {
  getEmergencyMedicalInfo,
  updateEmergencyMedicalInfo,
  getEmergencyContacts,
  updateEmergencyContacts,
  triggerEmergency,
  connectEmergencyDoctor,
  dispatchAmbulance,
  endEmergency,
  getEmergencyServices
} = require('../models/emergency');

const router = express.Router();

// ----------------------------------------------------
// ALL ROUTES PROTECTED
// ----------------------------------------------------
router.use(protect);

// ----------------------------------------------------
// MEDICAL INFO
// ----------------------------------------------------
router.get('/medical-info', asyncHandler(async (req, res) => {
  const medicalInfo = await getEmergencyMedicalInfo(req.user.id);

  res.status(200).json({
    success: true,
    data: medicalInfo
  });
}));

router.put(
  '/medical-info',
  [
    body('blood_type').optional().isString(),
    body('allergies').optional().isArray(),
    body('medications').optional().isArray(),
    body('conditions').optional().isArray(),
    body('emergency_notes').optional().isString(),
    body('doctor_name').optional().isString(),
    body('doctor_phone').optional().isString(),
    body('insurance_provider').optional().isString(),
    body('insurance_id').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const updatedInfo = await updateEmergencyMedicalInfo(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Medical information updated',
      data: updatedInfo
    });
  })
);

// ----------------------------------------------------
// EMERGENCY CONTACTS
// ----------------------------------------------------
router.get('/contacts', asyncHandler(async (req, res) => {
  const contacts = await getEmergencyContacts(req.user.id);

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts
  });
}));

router.put(
  '/contacts',
  [
    body('contacts').isArray(),
    body('contacts.*.name').isString().notEmpty(),
    body('contacts.*.phone').isString().notEmpty(),
    body('contacts.*.email').optional().isEmail(),
    body('contacts.*.relationship').isString(),
    body('contacts.*.is_primary').isBoolean()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const updatedContacts = await updateEmergencyContacts(
      req.user.id,
      req.body.contacts
    );

    res.status(200).json({
      success: true,
      message: 'Emergency contacts updated',
      data: updatedContacts
    });
  })
);

// ----------------------------------------------------
// EMERGENCY ACTIONS
// ----------------------------------------------------
router.post(
  '/trigger',
  [
    body('location').optional().isObject(),
    body('medical_info').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const emergency = await triggerEmergency(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Emergency triggered successfully',
      data: emergency
    });
  })
);

router.post(
  '/connect-doctor',
  [
    body('location').optional().isObject(),
    body('medical_info').optional().isObject()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const result = await connectEmergencyDoctor(
      req.user.id,
      req.body.location,
      req.body.medical_info
    );

    res.status(200).json({
      success: true,
      message: 'Connecting to emergency doctor',
      data: result
    });
  })
);

router.post(
  '/dispatch-ambulance',
  [
    body('location').isObject(),
    body('medical_info').optional().isObject(),
    body('hospital_id').optional().isInt(),
    body('estimated_arrival').optional().isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const dispatch = await dispatchAmbulance(
      req.user.id,
      req.body.location,
      req.body.medical_info,
      req.body.hospital_id
    );

    res.status(201).json({
      success: true,
      message: 'Ambulance dispatched',
      data: dispatch
    });
  })
);

router.post(
  '/end',
  [body('emergency_log_id').isInt()],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const endedEmergency = await endEmergency(
      req.user.id,
      req.body.emergency_log_id
    );

    res.status(200).json({
      success: true,
      message: 'Emergency ended',
      data: endedEmergency
    });
  })
);

// ----------------------------------------------------
// EMERGENCY SERVICES
// ----------------------------------------------------
router.get('/services', asyncHandler(async (req, res) => {
  const services = await getEmergencyServices();

  res.status(200).json({
    success: true,
    count: services.length,
    data: services
  });
}));

// ----------------------------------------------------
// ✅ NEARBY HOSPITALS (BACKEND SAFE – MOCK VERSION)
// ----------------------------------------------------
router.post(
  '/nearby-hospitals',
  [
    body('latitude').isFloat(),
    body('longitude').isFloat(),
    body('radius').optional().isFloat({ min: 1, max: 50 })
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const { latitude, longitude, radius = 10 } = req.body;

    const hospitals = getMockHospitalsByLocation(latitude, longitude, radius);

    res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals
    });
  })
);

// ----------------------------------------------------
// NOTIFY CONTACT (MOCK)
// ----------------------------------------------------
router.post(
  '/notify-contact',
  [
    body('contact_id').isInt(),
    body('message').isString()
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Contact notified'
    });
  })
);

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------
const getMockHospitalsByLocation = (lat, lon, radius) => {
  const names = [
    'Apollo Hospitals',
    'Fortis Hospital',
    'AIIMS',
    'Manipal Hospital',
    'Medanta',
    'KIMS Hospital'
  ];

  const results = [];

  for (let i = 0; i < 5; i++) {
    const hLat = lat + (Math.random() * 0.05 - 0.025);
    const hLon = lon + (Math.random() * 0.05 - 0.025);
    const dist = calculateDistance(lat, lon, hLat, hLon);

    if (dist <= radius) {
      results.push({
        name: names[Math.floor(Math.random() * names.length)],
        latitude: hLat,
        longitude: hLon,
        distance: dist.toFixed(1),
        address: 'Nearby area',
        phone: '+91 9XXXXXXXXX'
      });
    }
  }

  return results.sort((a, b) => a.distance - b.distance);
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

module.exports = router;
