import * as adminService from "./admin.service.js";

export async function getUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await adminService.getAllUsers({ page, limit });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransactions(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || null;
    const email = req.query.email || null;  // ADD THIS

    const result = await adminService.getAllTransactions({ page, limit, status, email });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}