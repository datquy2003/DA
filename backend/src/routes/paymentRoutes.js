import express from "express";
import Stripe from "stripe";
import sql from "mssql";
import { sqlConfig } from "../config/db.js";
import { checkAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const toVietnamTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

router.post("/create-checkout-session", checkAuth, async (req, res) => {
  const { planId } = req.body;
  const userId = req.firebaseUser.uid;

  if (!planId) return res.status(400).json({ message: "Thiếu thông tin gói." });

  try {
    const pool = await sql.connect(sqlConfig);
    const planResult = await pool
      .request()
      .input("PlanID", sql.Int, planId)
      .query("SELECT * FROM SubscriptionPlans WHERE PlanID = @PlanID");

    const plan = planResult.recordset[0];
    if (!plan) return res.status(404).json({ message: "Gói không tồn tại." });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "vnd",
            product_data: {
              name: plan.PlanName,
              description:
                plan.PlanType === "SUBSCRIPTION"
                  ? `Gói định kỳ ${plan.DurationInDays} ngày`
                  : "Dịch vụ mua 1 lần",
            },
            unit_amount: parseInt(plan.Price),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&plan_id=${planId}`,
      cancel_url: `${CLIENT_URL}/payment/cancel`,
      client_reference_id: userId,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ message: "Lỗi tạo giao dịch thanh toán." });
  }
});

router.post("/verify-payment", checkAuth, async (req, res) => {
  const { sessionId, planId } = req.body;
  const userId = req.firebaseUser.uid;

  if (!sessionId || !planId)
    return res.status(400).json({ message: "Thiếu thông tin." });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Thanh toán chưa hoàn tất." });
    }
    if (session.client_reference_id !== userId) {
      return res.status(403).json({ message: "User không khớp." });
    }

    const pool = await sql.connect(sqlConfig);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const checkTrans = await transaction
        .request()
        .input("TransID", sql.NVarChar, sessionId)
        .query(
          "SELECT TOP 1 1 FROM UserSubscriptions WHERE PaymentTransactionID = @TransID"
        );

      if (checkTrans.recordset.length > 0) {
        await transaction.rollback();
        return res
          .status(200)
          .json({ message: "Giao dịch đã được ghi nhận trước đó." });
      }

      const planResult = await transaction
        .request()
        .input("PlanID", sql.Int, planId)
        .query("SELECT * FROM SubscriptionPlans WHERE PlanID = @PlanID");
      const plan = planResult.recordset[0];

      if (!plan) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ message: "Gói không tìm thấy trong DB." });
      }

      const startDate = toVietnamTime();
      let endDate = new Date(startDate);

      if (plan.PlanType === "SUBSCRIPTION" && plan.DurationInDays > 0) {
        endDate.setDate(endDate.getDate() + plan.DurationInDays);
      } else {
        endDate.setFullYear(startDate.getFullYear() + 1000);
      }

      await transaction
        .request()
        .input("UserID", sql.NVarChar, userId)
        .input("PlanID", sql.Int, planId)
        .input("StartDate", sql.DateTime, startDate)
        .input("EndDate", sql.DateTime, endDate)
        .input("PaymentTransactionID", sql.NVarChar, sessionId)
        .input("Status", sql.TinyInt, 1)
        .input("SnapshotPlanName", sql.NVarChar, plan.PlanName)
        .input("SnapshotFeatures", sql.NText, plan.Features)
        .input("SnapshotPrice", sql.Decimal(18, 2), plan.Price)
        .input("SnapshotPlanType", sql.NVarChar, plan.PlanType)
        .input("Snapshot_JobPostDaily", sql.Int, plan.Limit_JobPostDaily || 0)
        .input("Snapshot_PushTopDaily", sql.Int, plan.Limit_PushTopDaily || 0)
        .input(
          "Snapshot_PushTopInterval",
          sql.Int,
          plan.Limit_PushTopInterval || 1
        )
        .input("Snapshot_CVStorage", sql.Int, plan.Limit_CVStorage || 0).query(`
          INSERT INTO UserSubscriptions 
          (UserID, PlanID, StartDate, EndDate, PaymentTransactionID, Status, 
           SnapshotPlanName, SnapshotFeatures, SnapshotPrice, SnapshotPlanType,
           Snapshot_JobPostDaily, Snapshot_PushTopDaily, Snapshot_PushTopInterval, Snapshot_CVStorage)
          VALUES 
          (@UserID, @PlanID, @StartDate, @EndDate, @PaymentTransactionID, @Status,
           @SnapshotPlanName, @SnapshotFeatures, @SnapshotPrice, @SnapshotPlanType,
           @Snapshot_JobPostDaily, @Snapshot_PushTopDaily, @Snapshot_PushTopInterval, @Snapshot_CVStorage)
        `);

      await transaction.commit();

      res
        .status(200)
        .json({ message: "Kích hoạt thành công!", planName: plan.PlanName });
    } catch (transError) {
      await transaction.rollback();
      throw transError;
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi xác thực thanh toán." });
  }
});

export default router;