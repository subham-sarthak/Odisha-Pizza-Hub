import { env } from "../config/env.js";

export const notifyOrderEvent = async ({ user, order, event }) => {
  const payload = {
    event,
    user: user?.phone || user?.email,
    token: order.tokenNumber,
    status: order.status,
    amount: order.totalAmount
  };

  // Provider integrations can be swapped in without changing controller logic.
  console.log(`[Email:${env.emailProvider}]`, payload);
  console.log(`[SMS:${env.smsProvider}]`, payload);
  console.log(`[WhatsApp:${env.whatsappProvider}]`, payload);
};
