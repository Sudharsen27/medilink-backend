// const pool = require('../config/db');

// /**
//  * Advanced search across multiple entities
//  */
// const advancedSearch = async (userId, searchParams) => {
//   const {
//     query = '',
//     entityTypes = ['doctors', 'appointments', 'prescriptions', 'medical_records'],
//     filters = {},
//     sortBy = 'relevance',
//     sortOrder = 'desc',
//     page = 1,
//     limit = 10
//   } = searchParams;

//   try {
//     // Build search queries for each entity type
//     const searchPromises = [];
    
//     if (entityTypes.includes('doctors')) {
//       searchPromises.push(searchDoctors(query, filters.doctors, userId));
//     }
    
//     if (entityTypes.includes('appointments')) {
//       searchPromises.push(searchAppointments(query, filters.appointments, userId));
//     }
    
//     if (entityTypes.includes('prescriptions')) {
//       searchPromises.push(searchPrescriptions(query, filters.prescriptions, userId));
//     }
    
//     if (entityTypes.includes('medical_records')) {
//       searchPromises.push(searchMedicalRecords(query, filters.medical_records, userId));
//     }

//     // Execute all search queries
//     const results = await Promise.all(searchPromises);
    
//     // Combine and sort results
//     const combinedResults = combineSearchResults(results, sortBy, sortOrder);
    
//     // Apply pagination
//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + limit;
//     const paginatedResults = combinedResults.slice(startIndex, endIndex);

//     return {
//       results: paginatedResults,
//       total: combinedResults.length,
//       page,
//       limit,
//       totalPages: Math.ceil(combinedResults.length / limit),
//       entityCounts: getEntityCounts(results)
//     };
//   } catch (error) {
//     console.error('Error in advancedSearch:', error);
//     throw error;
//   }
// };

// /**
//  * Search doctors with filters
//  */
// const searchDoctors = async (query, filters = {}, userId) => {
//   let whereConditions = ['d.is_active = true'];
//   const queryParams = [];
//   let paramCount = 0;

//   // Text search across multiple fields
//   if (query) {
//     paramCount++;
//     whereConditions.push(`
//       (d.name ILIKE $${paramCount} OR 
//        d.specialization ILIKE $${paramCount} OR 
//        d.hospital ILIKE $${paramCount})
//     `);
//     queryParams.push(`%${query}%`);
//   }

//   // Apply filters
//   if (filters.specialization) {
//     paramCount++;
//     whereConditions.push(`d.specialization = $${paramCount}`);
//     queryParams.push(filters.specialization);
//   }

//   if (filters.hospital) {
//     paramCount++;
//     whereConditions.push(`d.hospital = $${paramCount}`);
//     queryParams.push(filters.hospital);
//   }

//   if (filters.rating_min) {
//     paramCount++;
//     whereConditions.push(`d.rating >= $${paramCount}`);
//     queryParams.push(parseFloat(filters.rating_min));
//   }

//   if (filters.experience_min) {
//     paramCount++;
//     whereConditions.push(`d.experience_years >= $${paramCount}`);
//     queryParams.push(parseInt(filters.experience_min));
//   }

//   // Check if user has favorited the doctor
//   const favoriteSubquery = `
//     SELECT EXISTS(
//       SELECT 1 FROM favorites f 
//       WHERE f.item_id = d.id AND f.user_id = $${paramCount + 1} AND f.type = 'doctor'
//     ) as is_favorite
//   `;
//   queryParams.push(userId);

//   const sqlQuery = `
//     SELECT 
//       d.id,
//       'doctor' as entity_type,
//       d.name,
//       d.specialization,
//       d.hospital,
//       d.rating,
//       d.experience_years,
//       d.photo_url,
//       d.contact_info,
//       (${favoriteSubquery}),
//       -- Calculate relevance score
//       CASE 
//         WHEN d.name ILIKE $1 THEN 100
//         WHEN d.specialization ILIKE $1 THEN 80
//         WHEN d.hospital ILIKE $1 THEN 60
//         ELSE 40
//       END as relevance_score
//     FROM doctors d
//     WHERE ${whereConditions.join(' AND ')}
//     ORDER BY relevance_score DESC, d.rating DESC
//   `;

//   const { rows } = await pool.query(sqlQuery, queryParams);
//   return rows.map(row => ({ ...row, entity_type: 'doctor' }));
// };

// /**
//  * Search appointments with filters
//  */
// const searchAppointments = async (query, filters = {}, userId) => {
//   let whereConditions = ['a.user_id = $1'];
//   const queryParams = [userId];
//   let paramCount = 1;

//   // Text search
//   if (query) {
//     paramCount++;
//     whereConditions.push(`
//       (a.doctor_name ILIKE $${paramCount} OR 
//        a.reason ILIKE $${paramCount} OR 
//        a.appointment_type ILIKE $${paramCount})
//     `);
//     queryParams.push(`%${query}%`);
//   }

//   // Date filters
//   if (filters.date_from) {
//     paramCount++;
//     whereConditions.push(`a.date >= $${paramCount}`);
//     queryParams.push(filters.date_from);
//   }

//   if (filters.date_to) {
//     paramCount++;
//     whereConditions.push(`a.date <= $${paramCount}`);
//     queryParams.push(filters.date_to);
//   }

//   if (filters.status) {
//     paramCount++;
//     whereConditions.push(`a.status = $${paramCount}`);
//     queryParams.push(filters.status);
//   }

//   if (filters.appointment_type) {
//     paramCount++;
//     whereConditions.push(`a.appointment_type = $${paramCount}`);
//     queryParams.push(filters.appointment_type);
//   }

//   const sqlQuery = `
//     SELECT 
//       a.id,
//       'appointment' as entity_type,
//       a.doctor_name,
//       a.date,
//       a.time,
//       a.status,
//       a.appointment_type,
//       a.reason,
//       a.created_at,
//       -- Calculate relevance score
//       CASE 
//         WHEN a.doctor_name ILIKE $2 THEN 100
//         WHEN a.reason ILIKE $2 THEN 80
//         WHEN a.appointment_type ILIKE $2 THEN 60
//         ELSE 40
//       END as relevance_score
//     FROM appointments a
//     WHERE ${whereConditions.join(' AND ')}
//     ORDER BY 
//       CASE 
//         WHEN a.status = 'scheduled' THEN 1
//         WHEN a.status = 'confirmed' THEN 2
//         ELSE 3
//       END,
//       a.date DESC,
//       relevance_score DESC
//   `;

//   const { rows } = await pool.query(sqlQuery, queryParams);
//   return rows;
// };

// /**
//  * Search prescriptions with filters
//  */
// const searchPrescriptions = async (query, filters = {}, userId) => {
//   let whereConditions = ['p.user_id = $1'];
//   const queryParams = [userId];
//   let paramCount = 1;

//   // Text search
//   if (query) {
//     paramCount++;
//     whereConditions.push(`
//       (p.medication_name ILIKE $${paramCount} OR 
//        p.doctor_name ILIKE $${paramCount} OR 
//        p.dosage ILIKE $${paramCount})
//     `);
//     queryParams.push(`%${query}%`);
//   }

//   // Status filter
//   if (filters.status) {
//     paramCount++;
//     whereConditions.push(`p.status = $${paramCount}`);
//     queryParams.push(filters.status);
//   }

//   // Date filters
//   if (filters.start_date_from) {
//     paramCount++;
//     whereConditions.push(`p.start_date >= $${paramCount}`);
//     queryParams.push(filters.start_date_from);
//   }

//   if (filters.end_date_to) {
//     paramCount++;
//     whereConditions.push(`p.end_date <= $${paramCount}`);
//     queryParams.push(filters.end_date_to);
//   }

//   // Expiring soon filter
//   if (filters.expiring_soon) {
//     paramCount++;
//     whereConditions.push(`p.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`);
//   }

//   const sqlQuery = `
//     SELECT 
//       p.id,
//       'prescription' as entity_type,
//       p.medication_name,
//       p.doctor_name,
//       p.dosage,
//       p.frequency,
//       p.start_date,
//       p.end_date,
//       p.status,
//       p.instructions,
//       p.created_at,
//       -- Calculate relevance score
//       CASE 
//         WHEN p.medication_name ILIKE $2 THEN 100
//         WHEN p.doctor_name ILIKE $2 THEN 80
//         WHEN p.dosage ILIKE $2 THEN 60
//         ELSE 40
//       END as relevance_score,
//       -- Days remaining
//       CASE 
//         WHEN p.end_date IS NOT NULL THEN 
//           EXTRACT(DAY FROM (p.end_date - CURRENT_DATE))
//         ELSE NULL
//       END as days_remaining
//     FROM prescriptions p
//     WHERE ${whereConditions.join(' AND ')}
//     ORDER BY 
//       CASE 
//         WHEN p.status = 'active' THEN 1
//         WHEN p.status = 'pending' THEN 2
//         ELSE 3
//       END,
//       p.end_date ASC NULLS LAST,
//       relevance_score DESC
//   `;

//   const { rows } = await pool.query(sqlQuery, queryParams);
//   return rows;
// };

// /**
//  * Search medical records with filters
//  */
// const searchMedicalRecords = async (query, filters = {}, userId) => {
//   let whereConditions = ['mr.user_id = $1'];
//   const queryParams = [userId];
//   let paramCount = 1;

//   // Text search
//   if (query) {
//     paramCount++;
//     whereConditions.push(`
//       (mr.description ILIKE $${paramCount} OR 
//        mr.doctor_name ILIKE $${paramCount} OR 
//        mr.record_type ILIKE $${paramCount} OR
//        mr.notes ILIKE $${paramCount})
//     `);
//     queryParams.push(`%${query}%`);
//   }

//   // Record type filter
//   if (filters.record_type) {
//     paramCount++;
//     whereConditions.push(`mr.record_type = $${paramCount}`);
//     queryParams.push(filters.record_type);
//   }

//   // Date filters
//   if (filters.date_from) {
//     paramCount++;
//     whereConditions.push(`mr.record_date >= $${paramCount}`);
//     queryParams.push(filters.date_from);
//   }

//   if (filters.date_to) {
//     paramCount++;
//     whereConditions.push(`mr.record_date <= $${paramCount}`);
//     queryParams.push(filters.date_to);
//   }

//   // Has file filter
//   if (filters.has_file !== undefined) {
//     if (filters.has_file) {
//       whereConditions.push(`mr.file_url IS NOT NULL`);
//     } else {
//       whereConditions.push(`mr.file_url IS NULL`);
//     }
//   }

//   const sqlQuery = `
//     SELECT 
//       mr.id,
//       'medical_record' as entity_type,
//       mr.record_type,
//       mr.record_date,
//       mr.description,
//       mr.doctor_name,
//       mr.hospital,
//       mr.file_url,
//       mr.file_size,
//       mr.notes,
//       mr.created_at,
//       -- Calculate relevance score
//       CASE 
//         WHEN mr.description ILIKE $2 THEN 100
//         WHEN mr.doctor_name ILIKE $2 THEN 80
//         WHEN mr.record_type ILIKE $2 THEN 60
//         ELSE 40
//       END as relevance_score
//     FROM medical_records mr
//     WHERE ${whereConditions.join(' AND ')}
//     ORDER BY mr.record_date DESC, relevance_score DESC
//   `;

//   const { rows } = await pool.query(sqlQuery, queryParams);
//   return rows;
// };

// /**
//  * Combine and sort results from multiple entities
//  */
// const combineSearchResults = (results, sortBy, sortOrder) => {
//   const allResults = results.flat();
  
//   const sortFunctions = {
//     relevance: (a, b) => b.relevance_score - a.relevance_score,
//     date: (a, b) => {
//       const dateA = getEntityDate(a);
//       const dateB = getEntityDate(b);
//       return new Date(dateB) - new Date(dateA);
//     },
//     name: (a, b) => a.name?.localeCompare(b.name) || a.medication_name?.localeCompare(b.medication_name) || a.description?.localeCompare(b.description)
//   };

//   const sortFunction = sortFunctions[sortBy] || sortFunctions.relevance;
//   const sortedResults = allResults.sort(sortFunction);
  
//   return sortOrder === 'desc' ? sortedResults : sortedResults.reverse();
// };

// /**
//  * Get date for sorting based on entity type
//  */
// const getEntityDate = (entity) => {
//   switch (entity.entity_type) {
//     case 'appointment':
//       return entity.date;
//     case 'prescription':
//       return entity.start_date;
//     case 'medical_record':
//       return entity.record_date;
//     default:
//       return entity.created_at;
//   }
// };

// /**
//  * Get counts per entity type
//  */
// const getEntityCounts = (results) => {
//   const counts = {
//     doctors: 0,
//     appointments: 0,
//     prescriptions: 0,
//     medical_records: 0,
//     total: 0
//   };

//   results.forEach((entityResults, index) => {
//     const entityType = ['doctors', 'appointments', 'prescriptions', 'medical_records'][index];
//     counts[entityType] = entityResults.length;
//     counts.total += entityResults.length;
//   });

//   return counts;
// };

// /**
//  * Get search filters and options
//  */
// const getSearchFilters = async (entityType) => {
//   const filters = {
//     doctors: await getDoctorFilters(),
//     appointments: await getAppointmentFilters(),
//     prescriptions: await getPrescriptionFilters(),
//     medical_records: await getMedicalRecordFilters()
//   };

//   return filters[entityType] || {};
// };

// /**
//  * Get available doctor filters
//  */
// const getDoctorFilters = async () => {
//   const specializationQuery = `
//     SELECT DISTINCT specialization as value, specialization as label
//     FROM doctors 
//     WHERE is_active = true 
//     ORDER BY specialization
//   `;

//   const hospitalQuery = `
//     SELECT DISTINCT hospital as value, hospital as label
//     FROM doctors 
//     WHERE is_active = true AND hospital IS NOT NULL
//     ORDER BY hospital
//   `;

//   const [specializations, hospitals] = await Promise.all([
//     pool.query(specializationQuery),
//     pool.query(hospitalQuery)
//   ]);

//   return {
//     specialization: {
//       type: 'select',
//       label: 'Specialization',
//       options: specializations.rows
//     },
//     hospital: {
//       type: 'select',
//       label: 'Hospital',
//       options: hospitals.rows
//     },
//     rating_min: {
//       type: 'range',
//       label: 'Minimum Rating',
//       min: 1,
//       max: 5,
//       step: 0.1
//     },
//     experience_min: {
//       type: 'range',
//       label: 'Minimum Experience (years)',
//       min: 0,
//       max: 50,
//       step: 1
//     }
//   };
// };

// /**
//  * Get available appointment filters
//  */
// const getAppointmentFilters = async () => {
//   const statusQuery = `
//     SELECT DISTINCT status as value, 
//            INITCAP(status) as label
//     FROM appointments 
//     ORDER BY status
//   `;

//   const typeQuery = `
//     SELECT DISTINCT appointment_type as value, 
//            INITCAP(appointment_type) as label
//     FROM appointments 
//     WHERE appointment_type IS NOT NULL
//     ORDER BY appointment_type
//   `;

//   const [statuses, types] = await Promise.all([
//     pool.query(statusQuery),
//     pool.query(typeQuery)
//   ]);

//   return {
//     status: {
//       type: 'select',
//       label: 'Status',
//       options: statuses.rows
//     },
//     appointment_type: {
//       type: 'select',
//       label: 'Type',
//       options: types.rows
//     },
//     date_from: {
//       type: 'date',
//       label: 'From Date'
//     },
//     date_to: {
//       type: 'date',
//       label: 'To Date'
//     }
//   };
// };

// /**
//  * Get available prescription filters
//  */
// const getPrescriptionFilters = async () => {
//   const statusQuery = `
//     SELECT DISTINCT status as value, 
//            INITCAP(status) as label
//     FROM prescriptions 
//     ORDER BY status
//   `;

//   const { rows: statuses } = await pool.query(statusQuery);

//   return {
//     status: {
//       type: 'select',
//       label: 'Status',
//       options: statuses
//     },
//     start_date_from: {
//       type: 'date',
//       label: 'Start Date From'
//     },
//     end_date_to: {
//       type: 'date',
//       label: 'End Date To'
//     },
//     expiring_soon: {
//       type: 'boolean',
//       label: 'Expiring Soon (7 days)'
//     }
//   };
// };

// /**
//  * Get available medical record filters
//  */
// const getMedicalRecordFilters = async () => {
//   const typeQuery = `
//     SELECT DISTINCT record_type as value, 
//            INITCAP(REPLACE(record_type, '_', ' ')) as label
//     FROM medical_records 
//     ORDER BY record_type
//   `;

//   const { rows: types } = await pool.query(typeQuery);

//   return {
//     record_type: {
//       type: 'select',
//       label: 'Record Type',
//       options: types
//     },
//     date_from: {
//       type: 'date',
//       label: 'From Date'
//     },
//     date_to: {
//       type: 'date',
//       label: 'To Date'
//     },
//     has_file: {
//       type: 'boolean',
//       label: 'Has File'
//     }
//   };
// };

// /**
//  * Save search for user
//  */
// const saveSearch = async (userId, searchData) => {
//   const { name, query, entity_types, filters, is_global = false } = searchData;

//   const queryText = `
//     INSERT INTO saved_searches (user_id, name, query, entity_types, filters, is_global)
//     VALUES ($1, $2, $3, $4, $5, $6)
//     RETURNING *
//   `;

//   const values = [
//     userId,
//     name,
//     query,
//     JSON.stringify(entity_types),
//     JSON.stringify(filters),
//     is_global
//   ];

//   const { rows } = await pool.query(queryText, values);
//   return rows[0];
// };

// /**
//  * Get user's saved searches
//  */
// const getSavedSearches = async (userId) => {
//   const queryText = `
//     SELECT * FROM saved_searches 
//     WHERE user_id = $1 OR is_global = true
//     ORDER BY created_at DESC
//   `;

//   const { rows } = await pool.query(queryText, [userId]);
  
//   return rows.map(row => ({
//     ...row,
//     entity_types: JSON.parse(row.entity_types),
//     filters: JSON.parse(row.filters)
//   }));
// };

// /**
//  * Delete saved search
//  */
// const deleteSavedSearch = async (searchId, userId) => {
//   const queryText = `
//     DELETE FROM saved_searches 
//     WHERE id = $1 AND (user_id = $2 OR is_global = false)
//     RETURNING *
//   `;

//   const { rows } = await pool.query(queryText, [searchId, userId]);
//   return rows[0];
// };

// /**
//  * Get search suggestions
//  */
// const getSearchSuggestions = async (query, entityType) => {
//   let suggestionQuery = '';
//   const queryParams = [`%${query}%`];

//   switch (entityType) {
//     case 'doctors':
//       suggestionQuery = `
//         SELECT DISTINCT name as suggestion, 'doctor' as type
//         FROM doctors 
//         WHERE name ILIKE $1 AND is_active = true
//         UNION
//         SELECT DISTINCT specialization as suggestion, 'specialization' as type
//         FROM doctors 
//         WHERE specialization ILIKE $1 AND is_active = true
//         LIMIT 10
//       `;
//       break;
    
//     case 'medications':
//       suggestionQuery = `
//         SELECT DISTINCT medication_name as suggestion, 'medication' as type
//         FROM prescriptions 
//         WHERE medication_name ILIKE $1
//         LIMIT 10
//       `;
//       break;
    
//     default:
//       suggestionQuery = `
//         SELECT DISTINCT 
//           COALESCE(doctor_name, medication_name, description) as suggestion,
//           'general' as type
//         FROM (
//           SELECT doctor_name FROM appointments WHERE doctor_name ILIKE $1
//           UNION
//           SELECT medication_name FROM prescriptions WHERE medication_name ILIKE $1
//           UNION
//           SELECT description FROM medical_records WHERE description ILIKE $1
//         ) AS suggestions
//         LIMIT 10
//       `;
//   }

//   const { rows } = await pool.query(suggestionQuery, queryParams);
//   return rows;
// };

// module.exports = {
//   advancedSearch,
//   getSearchFilters,
//   saveSearch,
//   getSavedSearches,
//   deleteSavedSearch,
//   getSearchSuggestions
// };

// const pool = require('../config/db');

// /**
//  * Advanced search across multiple entities
//  */
// const advancedSearch = async (userId, searchParams) => {
//   const {
//     query = '',
//     entityTypes = ['doctors', 'appointments', 'prescriptions', 'medical_records'],
//     filters = {},
//     sortBy = 'relevance',
//     sortOrder = 'desc',
//     page = 1,
//     limit = 10
//   } = searchParams;

//   try {
//     // Build search queries for each entity type
//     const searchPromises = [];
    
//     if (entityTypes.includes('doctors')) {
//       searchPromises.push(searchDoctors(query, filters.doctors, userId));
//     }
    
//     if (entityTypes.includes('appointments')) {
//       searchPromises.push(searchAppointments(query, filters.appointments, userId));
//     }
    
//     if (entityTypes.includes('prescriptions')) {
//       searchPromises.push(searchPrescriptions(query, filters.prescriptions, userId));
//     }
    
//     if (entityTypes.includes('medical_records')) {
//       searchPromises.push(searchMedicalRecords(query, filters.medical_records, userId));
//     }

//     // Execute all search queries
//     const results = await Promise.all(searchPromises);
    
//     // Combine and sort results
//     const combinedResults = combineSearchResults(results, sortBy, sortOrder);
    
//     // Apply pagination
//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + limit;
//     const paginatedResults = combinedResults.slice(startIndex, endIndex);

//     return {
//       results: paginatedResults,
//       total: combinedResults.length,
//       page,
//       limit,
//       totalPages: Math.ceil(combinedResults.length / limit),
//       entityCounts: getEntityCounts(results)
//     };
//   } catch (error) {
//     console.error('Error in advancedSearch:', error);
//     throw error;
//   }
// };

// /**
//  * Search doctors with filters - UPDATED with correct column names
//  */
// const searchDoctors = async (query, filters = {}, userId) => {
//   let whereConditions = ['d.is_active = true'];
//   const queryParams = [];
//   let paramCount = 0;

//   // First, let's check what columns actually exist in the doctors table
//   const columnCheck = await pool.query(`
//     SELECT column_name 
//     FROM information_schema.columns 
//     WHERE table_name = 'doctors' 
//     AND column_name IN ('full_name', 'first_name', 'last_name', 'name')
//   `);

//   const existingColumns = columnCheck.rows.map(row => row.column_name);
  
//   // Build search condition based on available columns
//   if (query) {
//     paramCount++;
//     let searchCondition = '';
    
//     if (existingColumns.includes('full_name')) {
//       searchCondition += `d.full_name ILIKE $${paramCount} OR `;
//     } else if (existingColumns.includes('first_name') && existingColumns.includes('last_name')) {
//       searchCondition += `(d.first_name || ' ' || d.last_name) ILIKE $${paramCount} OR `;
//     }
    
//     // Always search in specialization and hospital
//     searchCondition += `d.specialization ILIKE $${paramCount} OR d.hospital ILIKE $${paramCount}`;
    
//     whereConditions.push(`(${searchCondition})`);
//     queryParams.push(`%${query}%`);
//   }

//   // Apply filters
//   if (filters.specialization) {
//     paramCount++;
//     whereConditions.push(`d.specialization = $${paramCount}`);
//     queryParams.push(filters.specialization);
//   }

//   if (filters.hospital) {
//     paramCount++;
//     whereConditions.push(`d.hospital = $${paramCount}`);
//     queryParams.push(filters.hospital);
//   }

//   if (filters.rating_min) {
//     paramCount++;
//     whereConditions.push(`d.rating >= $${paramCount}`);
//     queryParams.push(parseFloat(filters.rating_min));
//   }

//   if (filters.experience_min) {
//     paramCount++;
//     whereConditions.push(`d.experience_years >= $${paramCount}`);
//     queryParams.push(parseInt(filters.experience_min));
//   }

//   // Build SELECT fields based on available columns
//   let nameField = 'd.id as name'; // fallback
//   if (existingColumns.includes('full_name')) {
//     nameField = 'd.full_name as name';
//   } else if (existingColumns.includes('first_name') && existingColumns.includes('last_name')) {
//     nameField = 'd.first_name || \' \' || d.last_name as name';
//   }

//   // Check if user has favorited the doctor
//   const favoriteSubquery = `
//     SELECT EXISTS(
//       SELECT 1 FROM favorites f 
//       WHERE f.item_id = d.id AND f.user_id = $${paramCount + 1} AND f.type = 'doctor'
//     ) as is_favorite
//   `;
//   queryParams.push(userId);

//   const sqlQuery = `
//     SELECT 
//       d.id,
//       'doctor' as entity_type,
//       ${nameField},
//       d.specialization,
//       d.hospital,
//       d.rating,
//       d.experience_years,
//       d.photo_url,
//       d.contact_info,
//       (${favoriteSubquery}),
//       -- Calculate relevance score based on available columns
//       CASE 
//         ${existingColumns.includes('full_name') ? "WHEN d.full_name ILIKE $1 THEN 100" : ""}
//         ${existingColumns.includes('first_name') && existingColumns.includes('last_name') ? "WHEN (d.first_name || ' ' || d.last_name) ILIKE $1 THEN 100" : ""}
//         WHEN d.specialization ILIKE $1 THEN 80
//         WHEN d.hospital ILIKE $1 THEN 60
//         ELSE 40
//       END as relevance_score
//     FROM doctors d
//     WHERE ${whereConditions.join(' AND ')}
//     ORDER BY relevance_score DESC, d.rating DESC
//   `;

//   try {
//     const { rows } = await pool.query(sqlQuery, queryParams);
//     return rows.map(row => ({ ...row, entity_type: 'doctor' }));
//   } catch (error) {
//     console.error('Error in searchDoctors:', error);
//     return [];
//   }
// };

// /**
//  * Search appointments with filters - UPDATED with correct column names
//  */
// const searchAppointments = async (query, filters = {}, userId) => {
//   let whereConditions = ['a.user_id = $1'];
//   const queryParams = [userId];
//   let paramCount = 1;

//   // Text search
//   if (query) {
//     paramCount++;
//     whereConditions.push(`
//       (a.doctor_name ILIKE $${paramCount} OR 
//        a.reason ILIKE $${paramCount} OR 
//        a.appointment_type ILIKE $${paramCount})
//     `);
//     queryParams.push(`%${query}%`);
//   }

//   // Date filters
//   if (filters.date_from) {
//     paramCount++;
//     whereConditions.push(`a.date >= $${paramCount}`);
//     queryParams.push(filters.date_from);
//   }

//   if (filters.date_to) {
//     paramCount++;
//     whereConditions.push(`a.date <= $${paramCount}`);
//     queryParams.push(filters.date_to);
//   }

//   if (filters.status) {
//     paramCount++;
//     whereConditions.push(`a.status = $${paramCount}`);
//     queryParams.push(filters.status);
//   }

//   if (filters.appointment_type) {
//     paramCount++;
//     whereConditions.push(`a.appointment_type = $${paramCount}`);
//     queryParams.push(filters.appointment_type);
//   }

//   const sqlQuery = `
//     SELECT 
//       a.id,
//       'appointment' as entity_type,
//       a.doctor_name,
//       a.date,
//       a.time,
//       a.status,
//       a.appointment_type,
//       a.reason,
//       a.created_at,
//       -- Calculate relevance score
//       CASE 
//         WHEN a.doctor_name ILIKE $2 THEN 100
//         WHEN a.reason ILIKE $2 THEN 80
//         WHEN a.appointment_type ILIKE $2 THEN 60
//         ELSE 40
//       END as relevance_score
//     FROM appointments a
//     WHERE ${whereConditions.join(' AND ')}
//     ORDER BY 
//       CASE 
//         WHEN a.status = 'scheduled' THEN 1
//         WHEN a.status = 'confirmed' THEN 2
//         ELSE 3
//       END,
//       a.date DESC,
//       relevance_score DESC
//   `;

//   try {
//     const { rows } = await pool.query(sqlQuery, queryParams);
//     return rows;
//   } catch (error) {
//     console.error('Error in searchAppointments:', error);
//     return [];
//   }
// };

// /**
//  * Search prescriptions with filters - UPDATED with correct column names
//  */
// const searchPrescriptions = async (query, filters = {}, userId) => {
//   let whereConditions = ['p.user_id = $1'];
//   const queryParams = [userId];
//   let paramCount = 1;

//   // Text search
//   if (query) {
//     paramCount++;
//     whereConditions.push(`
//       (p.medication_name ILIKE $${paramCount} OR 
//        p.doctor_name ILIKE $${paramCount} OR 
//        p.dosage ILIKE $${paramCount})
//     `);
//     queryParams.push(`%${query}%`);
//   }

//   // Status filter
//   if (filters.status) {
//     paramCount++;
//     whereConditions.push(`p.status = $${paramCount}`);
//     queryParams.push(filters.status);
//   }

//   // Date filters
//   if (filters.start_date_from) {
//     paramCount++;
//     whereConditions.push(`p.start_date >= $${paramCount}`);
//     queryParams.push(filters.start_date_from);
//   }

//   if (filters.end_date_to) {
//     paramCount++;
//     whereConditions.push(`p.end_date <= $${paramCount}`);
//     queryParams.push(filters.end_date_to);
//   }

//   // Expiring soon filter
//   if (filters.expiring_soon) {
//     whereConditions.push(`p.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`);
//   }

//   const sqlQuery = `
//     SELECT 
//       p.id,
//       'prescription' as entity_type,
//       p.medication_name,
//       p.doctor_name,
//       p.dosage,
//       p.frequency,
//       p.start_date,
//       p.end_date,
//       p.status,
//       p.instructions,
//       p.created_at,
//       -- Calculate relevance score
//       CASE 
//         WHEN p.medication_name ILIKE $2 THEN 100
//         WHEN p.doctor_name ILIKE $2 THEN 80
//         WHEN p.dosage ILIKE $2 THEN 60
//         ELSE 40
//       END as relevance_score,
//       -- Days remaining
//       CASE 
//         WHEN p.end_date IS NOT NULL THEN 
//           EXTRACT(DAY FROM (p.end_date - CURRENT_DATE))
//         ELSE NULL
//       END as days_remaining
//     FROM prescriptions p
//     WHERE ${whereConditions.join(' AND ')}
//     ORDER BY 
//       CASE 
//         WHEN p.status = 'active' THEN 1
//         WHEN p.status = 'pending' THEN 2
//         ELSE 3
//       END,
//       p.end_date ASC NULLS LAST,
//       relevance_score DESC
//   `;

//   try {
//     const { rows } = await pool.query(sqlQuery, queryParams);
//     return rows;
//   } catch (error) {
//     console.error('Error in searchPrescriptions:', error);
//     return [];
//   }
// };

// /**
//  * Search medical records with filters - UPDATED with correct column names
//  */
// const searchMedicalRecords = async (query, filters = {}, userId) => {
//   let whereConditions = ['mr.user_id = $1'];
//   const queryParams = [userId];
//   let paramCount = 1;

//   // Text search
//   if (query) {
//     paramCount++;
//     whereConditions.push(`
//       (mr.description ILIKE $${paramCount} OR 
//        mr.doctor_name ILIKE $${paramCount} OR 
//        mr.record_type ILIKE $${paramCount} OR
//        mr.notes ILIKE $${paramCount})
//     `);
//     queryParams.push(`%${query}%`);
//   }

//   // Record type filter
//   if (filters.record_type) {
//     paramCount++;
//     whereConditions.push(`mr.record_type = $${paramCount}`);
//     queryParams.push(filters.record_type);
//   }

//   // Date filters
//   if (filters.date_from) {
//     paramCount++;
//     whereConditions.push(`mr.record_date >= $${paramCount}`);
//     queryParams.push(filters.date_from);
//   }

//   if (filters.date_to) {
//     paramCount++;
//     whereConditions.push(`mr.record_date <= $${paramCount}`);
//     queryParams.push(filters.date_to);
//   }

//   // Has file filter
//   if (filters.has_file !== undefined) {
//     if (filters.has_file) {
//       whereConditions.push(`mr.file_url IS NOT NULL`);
//     } else {
//       whereConditions.push(`mr.file_url IS NULL`);
//     }
//   }

//   const sqlQuery = `
//     SELECT 
//       mr.id,
//       'medical_record' as entity_type,
//       mr.record_type,
//       mr.record_date,
//       mr.description,
//       mr.doctor_name,
//       mr.hospital,
//       mr.file_url,
//       mr.file_size,
//       mr.notes,
//       mr.created_at,
//       -- Calculate relevance score
//       CASE 
//         WHEN mr.description ILIKE $2 THEN 100
//         WHEN mr.doctor_name ILIKE $2 THEN 80
//         WHEN mr.record_type ILIKE $2 THEN 60
//         ELSE 40
//       END as relevance_score
//     FROM medical_records mr
//     WHERE ${whereConditions.join(' AND ')}
//     ORDER BY mr.record_date DESC, relevance_score DESC
//   `;

//   try {
//     const { rows } = await pool.query(sqlQuery, queryParams);
//     return rows;
//   } catch (error) {
//     console.error('Error in searchMedicalRecords:', error);
//     return [];
//   }
// };

// // The rest of the functions remain the same as before...
// // combineSearchResults, getEntityCounts, getSearchFilters, etc.

// /**
//  * Get available doctor filters - UPDATED to handle missing columns
//  */
// const getDoctorFilters = async () => {
//   const specializationQuery = `
//     SELECT DISTINCT specialization as value, specialization as label
//     FROM doctors 
//     WHERE is_active = true 
//     ORDER BY specialization
//   `;

//   const hospitalQuery = `
//     SELECT DISTINCT hospital as value, hospital as label
//     FROM doctors 
//     WHERE is_active = true AND hospital IS NOT NULL
//     ORDER BY hospital
//   `;

//   try {
//     const [specializations, hospitals] = await Promise.all([
//       pool.query(specializationQuery),
//       pool.query(hospitalQuery)
//     ]);

//     return {
//       specialization: {
//         type: 'select',
//         label: 'Specialization',
//         options: specializations.rows
//       },
//       hospital: {
//         type: 'select',
//         label: 'Hospital',
//         options: hospitals.rows
//       },
//       rating_min: {
//         type: 'range',
//         label: 'Minimum Rating',
//         min: 1,
//         max: 5,
//         step: 0.1
//       },
//       experience_min: {
//         type: 'range',
//         label: 'Minimum Experience (years)',
//         min: 0,
//         max: 50,
//         step: 1
//       }
//     };
//   } catch (error) {
//     console.error('Error getting doctor filters:', error);
//     return {};
//   }
// };

// // Export all functions (same as before)
// module.exports = {
//   advancedSearch,
//   getSearchFilters,
//   saveSearch,
//   getSavedSearches,
//   deleteSavedSearch,
//   getSearchSuggestions
// };

const pool = require('../config/db');

/**
 * Advanced search across multiple entities - UNIVERSAL VERSION
 */
const advancedSearch = async (userId, searchParams) => {
  const {
    query = '',
    entityTypes = ['doctors', 'appointments', 'prescriptions', 'medical_records'],
    filters = {},
    sortBy = 'relevance',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = searchParams;

  try {
    // Build search queries for each entity type
    const searchPromises = [];
    
    if (entityTypes.includes('doctors')) {
      searchPromises.push(searchDoctorsUniversal(query, filters.doctors, userId));
    }
    
    if (entityTypes.includes('appointments')) {
      searchPromises.push(searchAppointmentsUniversal(query, filters.appointments, userId));
    }
    
    if (entityTypes.includes('prescriptions')) {
      searchPromises.push(searchPrescriptionsUniversal(query, filters.prescriptions, userId));
    }
    
    if (entityTypes.includes('medical_records')) {
      searchPromises.push(searchMedicalRecordsUniversal(query, filters.medical_records, userId));
    }

    // Execute all search queries
    const results = await Promise.all(searchPromises);
    
    // Combine and sort results
    const combinedResults = combineSearchResults(results, sortBy, sortOrder);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = combinedResults.slice(startIndex, endIndex);

    return {
      results: paginatedResults,
      total: combinedResults.length,
      page,
      limit,
      totalPages: Math.ceil(combinedResults.length / limit),
      entityCounts: getEntityCounts(results)
    };
  } catch (error) {
    console.error('Error in advancedSearch:', error);
    throw error;
  }
};

/**
 * UNIVERSAL Doctor Search - Works with any doctors table structure
 */
const searchDoctorsUniversal = async (query, filters = {}, userId) => {
  try {
    // First, discover the actual structure of the doctors table
    const structure = await discoverTableStructure('doctors');
    
    let whereConditions = [];
    const queryParams = [];
    let paramCount = 0;

    // Build WHERE conditions based on available columns
    if (structure.is_active) {
      whereConditions.push('is_active = true');
    }

    // Text search across available text columns
    if (query) {
      paramCount++;
      const searchFields = [];
      
      if (structure.full_name) searchFields.push('full_name');
      if (structure.first_name && structure.last_name) searchFields.push("first_name || ' ' || last_name");
      if (structure.name) searchFields.push('name');
      if (structure.specialization) searchFields.push('specialization');
      if (structure.hospital) searchFields.push('hospital');
      if (structure.clinic) searchFields.push('clinic');
      if (structure.location) searchFields.push('location');
      
      if (searchFields.length > 0) {
        const searchCondition = searchFields.map(field => `${field} ILIKE $${paramCount}`).join(' OR ');
        whereConditions.push(`(${searchCondition})`);
        queryParams.push(`%${query}%`);
      }
    }

    // Apply filters for available columns
    if (filters.specialization && structure.specialization) {
      paramCount++;
      whereConditions.push(`specialization = $${paramCount}`);
      queryParams.push(filters.specialization);
    }

    if (filters.hospital && structure.hospital) {
      paramCount++;
      whereConditions.push(`hospital = $${paramCount}`);
      queryParams.push(filters.hospital);
    }

    if (filters.rating_min && structure.rating) {
      paramCount++;
      whereConditions.push(`rating >= $${paramCount}`);
      queryParams.push(parseFloat(filters.rating_min));
    }

    // Build SELECT fields
    const selectFields = [
      'id',
      "'doctor' as entity_type"
    ];

    // Add name field based on available columns
    if (structure.full_name) {
      selectFields.push('full_name as name');
    } else if (structure.first_name && structure.last_name) {
      selectFields.push("first_name || ' ' || last_name as name");
    } else if (structure.name) {
      selectFields.push('name');
    } else {
      selectFields.push("'Doctor' as name");
    }

    // Add other available fields
    if (structure.specialization) selectFields.push('specialization');
    if (structure.hospital) selectFields.push('hospital');
    if (structure.rating) selectFields.push('rating');
    if (structure.experience_years) selectFields.push('experience_years');
    if (structure.photo_url) selectFields.push('photo_url');
    if (structure.contact_info) selectFields.push('contact_info');

    // Check favorites if favorites table exists
    const hasFavorites = await tableExists('favorites');
    if (hasFavorites) {
      selectFields.push(`
        (SELECT EXISTS(
          SELECT 1 FROM favorites f 
          WHERE f.item_id = doctors.id AND f.user_id = $${paramCount + 1} AND f.type = 'doctor'
        )) as is_favorite
      `);
      queryParams.push(userId);
    } else {
      selectFields.push('false as is_favorite');
    }

    // Calculate relevance score
    selectFields.push(`
      CASE 
        ${structure.full_name ? "WHEN full_name ILIKE $1 THEN 100" : ""}
        ${structure.first_name && structure.last_name ? "WHEN (first_name || ' ' || last_name) ILIKE $1 THEN 100" : ""}
        ${structure.name ? "WHEN name ILIKE $1 THEN 100" : ""}
        ${structure.specialization ? "WHEN specialization ILIKE $1 THEN 80" : ""}
        ${structure.hospital ? "WHEN hospital ILIKE $1 THEN 60" : ""}
        ELSE 40
      END as relevance_score
    `);

    const sqlQuery = `
      SELECT ${selectFields.join(', ')}
      FROM doctors
      ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
      ORDER BY relevance_score DESC
      ${structure.rating ? ', rating DESC' : ''}
      LIMIT 50
    `;

    const { rows } = await pool.query(sqlQuery, queryParams);
    return rows.map(row => ({ ...row, entity_type: 'doctor' }));
  } catch (error) {
    console.error('Error in searchDoctorsUniversal:', error);
    return []; // Return empty array instead of failing
  }
};

/**
 * UNIVERSAL Appointment Search
 */
const searchAppointmentsUniversal = async (query, filters = {}, userId) => {
  try {
    const structure = await discoverTableStructure('appointments');
    
    let whereConditions = ['user_id = $1'];
    const queryParams = [userId];
    let paramCount = 1;

    // Text search
    if (query) {
      paramCount++;
      const searchFields = [];
      
      if (structure.doctor_name) searchFields.push('doctor_name');
      if (structure.reason) searchFields.push('reason');
      if (structure.appointment_type) searchFields.push('appointment_type');
      if (structure.notes) searchFields.push('notes');
      
      if (searchFields.length > 0) {
        const searchCondition = searchFields.map(field => `${field} ILIKE $${paramCount}`).join(' OR ');
        whereConditions.push(`(${searchCondition})`);
        queryParams.push(`%${query}%`);
      }
    }

    // Date filters
    if (filters.date_from && structure.date) {
      paramCount++;
      whereConditions.push(`date >= $${paramCount}`);
      queryParams.push(filters.date_from);
    }

    if (filters.date_to && structure.date) {
      paramCount++;
      whereConditions.push(`date <= $${paramCount}`);
      queryParams.push(filters.date_to);
    }

    if (filters.status && structure.status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(filters.status);
    }

    if (filters.appointment_type && structure.appointment_type) {
      paramCount++;
      whereConditions.push(`appointment_type = $${paramCount}`);
      queryParams.push(filters.appointment_type);
    }

    const selectFields = [
      'id',
      "'appointment' as entity_type"
    ];

    if (structure.doctor_name) selectFields.push('doctor_name');
    if (structure.date) selectFields.push('date');
    if (structure.time) selectFields.push('time');
    if (structure.status) selectFields.push('status');
    if (structure.appointment_type) selectFields.push('appointment_type');
    if (structure.reason) selectFields.push('reason');
    if (structure.created_at) selectFields.push('created_at');

    // Relevance score
    selectFields.push(`
      CASE 
        ${structure.doctor_name ? "WHEN doctor_name ILIKE $2 THEN 100" : ""}
        ${structure.reason ? "WHEN reason ILIKE $2 THEN 80" : ""}
        ${structure.appointment_type ? "WHEN appointment_type ILIKE $2 THEN 60" : ""}
        ELSE 40
      END as relevance_score
    `);

    const sqlQuery = `
      SELECT ${selectFields.join(', ')}
      FROM appointments
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        ${structure.status ? `
          CASE 
            WHEN status = 'scheduled' THEN 1
            WHEN status = 'confirmed' THEN 2
            ELSE 3
          END,
        ` : ''}
        ${structure.date ? 'date DESC,' : ''}
        relevance_score DESC
      LIMIT 50
    `;

    const { rows } = await pool.query(sqlQuery, queryParams);
    return rows;
  } catch (error) {
    console.error('Error in searchAppointmentsUniversal:', error);
    return [];
  }
};

/**
 * UNIVERSAL Prescription Search
 */
const searchPrescriptionsUniversal = async (query, filters = {}, userId) => {
  try {
    const structure = await discoverTableStructure('prescriptions');
    
    let whereConditions = ['user_id = $1'];
    const queryParams = [userId];
    let paramCount = 1;

    // Text search
    if (query) {
      paramCount++;
      const searchFields = [];
      
      if (structure.medication_name) searchFields.push('medication_name');
      if (structure.doctor_name) searchFields.push('doctor_name');
      if (structure.dosage) searchFields.push('dosage');
      
      if (searchFields.length > 0) {
        const searchCondition = searchFields.map(field => `${field} ILIKE $${paramCount}`).join(' OR ');
        whereConditions.push(`(${searchCondition})`);
        queryParams.push(`%${query}%`);
      }
    }

    // Status filter
    if (filters.status && structure.status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(filters.status);
    }

    // Date filters
    if (filters.start_date_from && structure.start_date) {
      paramCount++;
      whereConditions.push(`start_date >= $${paramCount}`);
      queryParams.push(filters.start_date_from);
    }

    if (filters.end_date_to && structure.end_date) {
      paramCount++;
      whereConditions.push(`end_date <= $${paramCount}`);
      queryParams.push(filters.end_date_to);
    }

    // Expiring soon filter
    if (filters.expiring_soon && structure.end_date) {
      whereConditions.push(`end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`);
    }

    const selectFields = [
      'id',
      "'prescription' as entity_type"
    ];

    if (structure.medication_name) selectFields.push('medication_name');
    if (structure.doctor_name) selectFields.push('doctor_name');
    if (structure.dosage) selectFields.push('dosage');
    if (structure.frequency) selectFields.push('frequency');
    if (structure.start_date) selectFields.push('start_date');
    if (structure.end_date) selectFields.push('end_date');
    if (structure.status) selectFields.push('status');
    if (structure.instructions) selectFields.push('instructions');
    if (structure.created_at) selectFields.push('created_at');

    // Relevance score
    selectFields.push(`
      CASE 
        ${structure.medication_name ? "WHEN medication_name ILIKE $2 THEN 100" : ""}
        ${structure.doctor_name ? "WHEN doctor_name ILIKE $2 THEN 80" : ""}
        ${structure.dosage ? "WHEN dosage ILIKE $2 THEN 60" : ""}
        ELSE 40
      END as relevance_score
    `);

    // Days remaining
    if (structure.end_date) {
      selectFields.push(`
        CASE 
          WHEN end_date IS NOT NULL THEN 
            EXTRACT(DAY FROM (end_date - CURRENT_DATE))
          ELSE NULL
        END as days_remaining
      `);
    }

    const sqlQuery = `
      SELECT ${selectFields.join(', ')}
      FROM prescriptions
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        ${structure.status ? `
          CASE 
            WHEN status = 'active' THEN 1
            WHEN status = 'pending' THEN 2
            ELSE 3
          END,
        ` : ''}
        ${structure.end_date ? 'end_date ASC NULLS LAST,' : ''}
        relevance_score DESC
      LIMIT 50
    `;

    const { rows } = await pool.query(sqlQuery, queryParams);
    return rows;
  } catch (error) {
    console.error('Error in searchPrescriptionsUniversal:', error);
    return [];
  }
};

/**
 * UNIVERSAL Medical Records Search
 */
const searchMedicalRecordsUniversal = async (query, filters = {}, userId) => {
  try {
    const structure = await discoverTableStructure('medical_records');
    
    let whereConditions = ['user_id = $1'];
    const queryParams = [userId];
    let paramCount = 1;

    // Text search
    if (query) {
      paramCount++;
      const searchFields = [];
      
      if (structure.description) searchFields.push('description');
      if (structure.doctor_name) searchFields.push('doctor_name');
      if (structure.record_type) searchFields.push('record_type');
      if (structure.notes) searchFields.push('notes');
      
      if (searchFields.length > 0) {
        const searchCondition = searchFields.map(field => `${field} ILIKE $${paramCount}`).join(' OR ');
        whereConditions.push(`(${searchCondition})`);
        queryParams.push(`%${query}%`);
      }
    }

    // Record type filter
    if (filters.record_type && structure.record_type) {
      paramCount++;
      whereConditions.push(`record_type = $${paramCount}`);
      queryParams.push(filters.record_type);
    }

    // Date filters
    if (filters.date_from && structure.record_date) {
      paramCount++;
      whereConditions.push(`record_date >= $${paramCount}`);
      queryParams.push(filters.date_from);
    }

    if (filters.date_to && structure.record_date) {
      paramCount++;
      whereConditions.push(`record_date <= $${paramCount}`);
      queryParams.push(filters.date_to);
    }

    // Has file filter
    if (filters.has_file !== undefined && structure.file_url) {
      if (filters.has_file) {
        whereConditions.push(`file_url IS NOT NULL`);
      } else {
        whereConditions.push(`file_url IS NULL`);
      }
    }

    const selectFields = [
      'id',
      "'medical_record' as entity_type"
    ];

    if (structure.record_type) selectFields.push('record_type');
    if (structure.record_date) selectFields.push('record_date');
    if (structure.description) selectFields.push('description');
    if (structure.doctor_name) selectFields.push('doctor_name');
    if (structure.hospital) selectFields.push('hospital');
    if (structure.file_url) selectFields.push('file_url');
    if (structure.file_size) selectFields.push('file_size');
    if (structure.notes) selectFields.push('notes');
    if (structure.created_at) selectFields.push('created_at');

    // Relevance score
    selectFields.push(`
      CASE 
        ${structure.description ? "WHEN description ILIKE $2 THEN 100" : ""}
        ${structure.doctor_name ? "WHEN doctor_name ILIKE $2 THEN 80" : ""}
        ${structure.record_type ? "WHEN record_type ILIKE $2 THEN 60" : ""}
        ELSE 40
      END as relevance_score
    `);

    const sqlQuery = `
      SELECT ${selectFields.join(', ')}
      FROM medical_records
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        ${structure.record_date ? 'record_date DESC,' : ''}
        relevance_score DESC
      LIMIT 50
    `;

    const { rows } = await pool.query(sqlQuery, queryParams);
    return rows;
  } catch (error) {
    console.error('Error in searchMedicalRecordsUniversal:', error);
    return [];
  }
};

/**
 * Discover table structure
 */
const discoverTableStructure = async (tableName) => {
  try {
    const { rows } = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position
    `, [tableName]);
    
    const structure = {};
    rows.forEach(row => {
      structure[row.column_name] = true;
    });
    
    return structure;
  } catch (error) {
    console.error(`Error discovering structure for ${tableName}:`, error);
    return {};
  }
};

/**
 * Check if table exists
 */
const tableExists = async (tableName) => {
  try {
    const { rows } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )
    `, [tableName]);
    
    return rows[0].exists;
  } catch (error) {
    return false;
  }
};

/**
 * Combine and sort results from multiple entities
 */
const combineSearchResults = (results, sortBy, sortOrder) => {
  const allResults = results.flat();
  
  const sortFunctions = {
    relevance: (a, b) => (b.relevance_score || 0) - (a.relevance_score || 0),
    date: (a, b) => {
      const dateA = getEntityDate(a);
      const dateB = getEntityDate(b);
      return new Date(dateB) - new Date(dateA);
    },
    name: (a, b) => (a.name || a.medication_name || a.description || '').localeCompare(b.name || b.medication_name || b.description || '')
  };

  const sortFunction = sortFunctions[sortBy] || sortFunctions.relevance;
  const sortedResults = allResults.sort(sortFunction);
  
  return sortOrder === 'desc' ? sortedResults : sortedResults.reverse();
};

/**
 * Get date for sorting based on entity type
 */
const getEntityDate = (entity) => {
  switch (entity.entity_type) {
    case 'appointment':
      return entity.date;
    case 'prescription':
      return entity.start_date;
    case 'medical_record':
      return entity.record_date;
    default:
      return entity.created_at;
  }
};

/**
 * Get counts per entity type
 */
const getEntityCounts = (results) => {
  const counts = {
    doctors: 0,
    appointments: 0,
    prescriptions: 0,
    medical_records: 0,
    total: 0
  };

  results.forEach((entityResults, index) => {
    const entityType = ['doctors', 'appointments', 'prescriptions', 'medical_records'][index];
    counts[entityType] = entityResults.length;
    counts.total += entityResults.length;
  });

  return counts;
};

/**
 * Get search filters based on actual table structure
 */
const getSearchFilters = async (entityType) => {
  try {
    const structure = await discoverTableStructure(entityType);
    const filters = {};

    if (entityType === 'doctors') {
      if (structure.specialization) {
        const specializations = await pool.query(`
          SELECT DISTINCT specialization as value, specialization as label
          FROM doctors 
          WHERE specialization IS NOT NULL
          ORDER BY specialization
        `);
        filters.specialization = {
          type: 'select',
          label: 'Specialization',
          options: specializations.rows
        };
      }

      if (structure.rating) {
        filters.rating_min = {
          type: 'range',
          label: 'Minimum Rating',
          min: 1,
          max: 5,
          step: 0.1
        };
      }
    }

    if (entityType === 'appointments') {
      if (structure.status) {
        const statuses = await pool.query(`
          SELECT DISTINCT status as value, 
                 INITCAP(status) as label
          FROM appointments 
          WHERE status IS NOT NULL
          ORDER BY status
        `);
        filters.status = {
          type: 'select',
          label: 'Status',
          options: statuses.rows
        };
      }
    }

    if (entityType === 'prescriptions') {
      if (structure.status) {
        const statuses = await pool.query(`
          SELECT DISTINCT status as value, 
                 INITCAP(status) as label
          FROM prescriptions 
          WHERE status IS NOT NULL
          ORDER BY status
        `);
        filters.status = {
          type: 'select',
          label: 'Status',
          options: statuses.rows
        };
      }
    }

    if (entityType === 'medical_records') {
      if (structure.record_type) {
        const types = await pool.query(`
          SELECT DISTINCT record_type as value, 
                 INITCAP(REPLACE(record_type, '_', ' ')) as label
          FROM medical_records 
          WHERE record_type IS NOT NULL
          ORDER BY record_type
        `);
        filters.record_type = {
          type: 'select',
          label: 'Record Type',
          options: types.rows
        };
      }
    }

    return filters;
  } catch (error) {
    console.error(`Error getting filters for ${entityType}:`, error);
    return {};
  }
};

// Keep the other functions (saveSearch, getSavedSearches, etc.) the same as before
const saveSearch = async (userId, searchData) => {
  const { name, query, entity_types, filters, is_global = false } = searchData;

  const queryText = `
    INSERT INTO saved_searches (user_id, name, query, entity_types, filters, is_global)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    userId,
    name,
    query,
    JSON.stringify(entity_types),
    JSON.stringify(filters),
    is_global
  ];

  const { rows } = await pool.query(queryText, values);
  return rows[0];
};

const getSavedSearches = async (userId) => {
  const queryText = `
    SELECT * FROM saved_searches 
    WHERE user_id = $1 OR is_global = true
    ORDER BY created_at DESC
  `;

  const { rows } = await pool.query(queryText, [userId]);
  
  return rows.map(row => ({
    ...row,
    entity_types: JSON.parse(row.entity_types),
    filters: JSON.parse(row.filters)
  }));
};

const deleteSavedSearch = async (searchId, userId) => {
  const queryText = `
    DELETE FROM saved_searches 
    WHERE id = $1 AND (user_id = $2 OR is_global = false)
    RETURNING *
  `;

  const { rows } = await pool.query(queryText, [searchId, userId]);
  return rows[0];
};

const getSearchSuggestions = async (query, entityType) => {
  // Simplified suggestions that don't depend on specific columns
  const generalSuggestions = [
    'Checkup', 'Consultation', 'Follow-up', 'Emergency',
    'Prescription', 'Lab Test', 'X-Ray', 'Blood Test'
  ];

  const filtered = generalSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  return filtered.map(suggestion => ({
    suggestion,
    type: 'general'
  }));
};

module.exports = {
  advancedSearch,
  getSearchFilters,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  getSearchSuggestions
};