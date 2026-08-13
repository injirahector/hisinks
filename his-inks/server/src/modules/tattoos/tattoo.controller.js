const tattooService = require('./tattoo.service');
const { validateCreateTattoo, validateUpdateTattoo } = require('./tattoo.validation');

// ── POST /api/tattoos  (admin only) ───────────────────────────────────────────
async function createTattoo(req, res, next) {
  try {
    const { errors, isValid } = validateCreateTattoo(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const tattoo = await tattooService.createTattoo(req.body);
    return res.status(201).json({
      success: true,
      message: 'Tattoo created successfully.',
      data: { tattoo },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/tattoos  (public) ────────────────────────────────────────────────
async function getAllTattoos(req, res, next) {
  try {
    const { category, page, limit } = req.query;
    const result = await tattooService.getAllTattoos({
      category,
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return res.status(200).json({
      success: true,
      count: result.tattoos.length,
      pagination: result.pagination,
      data: { tattoos: result.tattoos },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/tattoos/:id  (public) ────────────────────────────────────────────
async function getTattooById(req, res, next) {
  try {
    const tattoo = await tattooService.getTattooById(req.params.id);
    return res.status(200).json({ success: true, data: { tattoo } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/tattoos/:id  (admin only) ──────────────────────────────────────
async function updateTattoo(req, res, next) {
  try {
    const { errors, isValid } = validateUpdateTattoo(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const tattoo = await tattooService.updateTattoo(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Tattoo updated successfully.',
      data: { tattoo },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/tattoos/:id  (admin only) ─────────────────────────────────────
async function deleteTattoo(req, res, next) {
  try {
    await tattooService.deleteTattoo(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Tattoo deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/tattoos/reorder  (admin only) ──────────────────────────────────
async function reorderTattoos(req, res, next) {
  try {
    const { orderedIds } = req.body;
    
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'orderedIds must be an array of tattoo IDs' 
      });
    }

    const result = await tattooService.reorderTattoos(orderedIds);
    
    return res.status(200).json({
      success: true,
      message: `Successfully reordered ${result.count} tattoos.`,
      data: {
        tattoos: result.tattoos,
        count: result.count
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTattoo, getAllTattoos, getTattooById, updateTattoo, deleteTattoo, reorderTattoos };
