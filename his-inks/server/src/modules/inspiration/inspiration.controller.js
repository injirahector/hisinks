const inspirationService = require('./inspiration.service');
const { validateInspirationCreate, validateInspirationUpdate } = require('./inspiration.validation');

// ── GET /api/inspirations (public - only published) ──────────────────────────
async function getPublicInspirations(req, res, next) {
  try {
    const { category, search, page, limit } = req.query;
    const result = await inspirationService.getPublicInspirations({
      category,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
    });
    return res.status(200).json({
      success: true,
      count: result.inspirations.length,
      pagination: result.pagination,
      data: { inspirations: result.inspirations },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/inspirations/:id (public - only if published) ──────────────────
async function getPublicInspirationById(req, res, next) {
  try {
    const inspiration = await inspirationService.getPublicInspirationById(req.params.id);
    return res.status(200).json({ success: true, data: { inspiration } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/inspirations (admin only - all) ───────────────────────────
async function getAllInspirations(req, res, next) {
  try {
    const { category, search, page, limit, published } = req.query;
    const result = await inspirationService.getAllInspirations({
      category,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      published: published ? (published === 'true') : undefined,
    });
    return res.status(200).json({
      success: true,
      count: result.inspirations.length,
      pagination: result.pagination,
      data: { inspirations: result.inspirations },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/inspirations/:id (admin only) ──────────────────────────────
async function getInspirationById(req, res, next) {
  try {
    const inspiration = await inspirationService.getInspirationById(req.params.id);
    return res.status(200).json({ success: true, data: { inspiration } });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/inspirations (admin only) ────────────────────────────────
async function createInspirationAdmin(req, res, next) {
  try {
    const { errors, isValid } = validateInspirationCreate(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const inspiration = await inspirationService.createInspirationAdmin(req.body);
    return res.status(201).json({
      success: true,
      message: 'Inspiration created successfully.',
      data: { inspiration },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/inspirations/:id (admin only) ──────────────────────────
async function updateInspirationAdmin(req, res, next) {
  try {
    const { errors, isValid } = validateInspirationUpdate(req.body);
    if (!isValid) {
      return res.status(422).json({ success: false, errors });
    }

    const inspiration = await inspirationService.updateInspirationAdmin(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Inspiration updated successfully.',
      data: { inspiration },
    });
  } catch (err) {
    next(err);
  }
}

// ── DELETE /api/admin/inspirations/:id (admin only) ─────────────────────────
async function deleteInspirationAdmin(req, res, next) {
  try {
    await inspirationService.deleteInspirationAdmin(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Inspiration deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/inspirations/:id/publish (admin only) ──────────────────
async function togglePublishInspirationAdmin(req, res, next) {
  try {
    const inspiration = await inspirationService.togglePublishInspirationAdmin(req.params.id);
    return res.status(200).json({
      success: true,
      message: `Inspiration ${inspiration.published ? 'published' : 'unpublished'} successfully.`,
      data: { inspiration },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/inspirations/categories (public) ──────────────────────────────
async function getCategories(req, res, next) {
  try {
    const categories = [
      'Minimalist',
      'Fine Line',
      'Black & Grey',
      'Realism',
      'Floral',
      'Geometric',
      'Tribal',
      'Lettering',
      'Portrait',
      'Japanese',
      'Animal',
      'Traditional',
      'Abstract',
      'Sleeve',
      'Small Tattoos',
      'Custom Ideas',
    ];
    return res.status(200).json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/inspirations/reorder (admin only) ─────────────────────────
async function reorderInspirationsAdmin(req, res, next) {
  try {
    const { orderedIds } = req.body;
    
    // Enhanced validation logging
    console.log('[Reorder Controller] Received orderedIds:', orderedIds);
    console.log('[Reorder Controller] Type:', typeof orderedIds);
    console.log('[Reorder Controller] Is Array:', Array.isArray(orderedIds));
    console.log('[Reorder Controller] Length:', orderedIds?.length);
    
    if (!orderedIds || !Array.isArray(orderedIds)) {
      console.error('[Reorder Controller] Validation failed: not an array');
      return res.status(400).json({ 
        success: false, 
        message: 'orderedIds must be an array of inspiration IDs' 
      });
    }

    const result = await inspirationService.reorderInspirations(orderedIds);
    
    return res.status(200).json({
      success: true,
      message: `Successfully reordered ${result.count} inspirations.`,
      data: {
        inspirations: result.inspirations,
        count: result.count
      },
    });
  } catch (err) {
    console.error('[Reorder Controller] Error:', err);
    console.error('[Reorder Controller] Error message:', err.message);
    console.error('[Reorder Controller] Error statusCode:', err.statusCode);
    next(err);
  }
}

module.exports = {
  getPublicInspirations,
  getPublicInspirationById,
  getAllInspirations,
  getInspirationById,
  createInspirationAdmin,
  updateInspirationAdmin,
  deleteInspirationAdmin,
  togglePublishInspirationAdmin,
  getCategories,
  reorderInspirationsAdmin,
};
