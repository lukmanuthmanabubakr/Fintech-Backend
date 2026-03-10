import * as kycService from "./kyc.service.js";

export async function submitKyc(req, res, next) {
  try {
    const userId = req.user.sub;
    const { bvn, nin } = req.body;

    if (!bvn && !nin) {
      return res.status(400).json({
        success: false,
        message: "At least one of BVN or NIN is required",
      });
    }

    const result = await kycService.submitKyc({ userId, bvn, nin });

    res.status(201).json({
      success: true,
      message: "KYC submitted successfully and is under review",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getKycStatus(req, res, next) {
  try {
    const userId = req.user.sub;

    const result = await kycService.getKycStatus({ userId });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}