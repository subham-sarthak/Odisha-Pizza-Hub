import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const REPORTS_DIR = path.resolve(process.cwd(), "order-reports");

const formatCurrency = (amount) => `INR ${Number(amount || 0).toFixed(2)}`;

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatDateTime = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const paymentLabel = (method) => {
  const normalized = String(method || "").toLowerCase();
  if (normalized === "cod") return "Cash on Delivery";
  if (normalized === "online") return "Online";
  return normalized ? normalized.toUpperCase() : "-";
};

const orderTypeLabel = (order) => {
  if (order?.tableBooking) return "Dine-In";
  return order?.pickupTime ? "Pickup" : "Delivery";
};

const itemLine = (item) => `${item.productName || item.name || "Item"} x${Number(item.qty || 0)}`;

export const getDailyReportFileName = (dateValue) => {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `orders-${year}-${month}-${day}.pdf`;
};

export const getOrderReportsDir = async () => {
  await fs.promises.mkdir(REPORTS_DIR, { recursive: true });
  return REPORTS_DIR;
};

export const generateDailyOrdersPdf = async ({
  restaurantName = "Odisha Pizza Hub",
  reportDate,
  orders = []
}) => {
  const reportsDir = await getOrderReportsDir();
  const reportDateObj = new Date(reportDate);
  const fileName = getDailyReportFileName(reportDateObj);
  const filePath = path.join(reportsDir, fileName);

  // Filter to only show completed orders in revenue report
  const completedOrders = orders.filter((order) => order.status === "completed");

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    doc.fontSize(22).fillColor("#1f2937").text(restaurantName, { align: "center" });
    doc.moveDown(0.35);
    doc.fontSize(14).fillColor("#374151").text(`Order Report: ${formatDate(reportDateObj)}`, { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text(`Generated At: ${formatDateTime(new Date())}`, { align: "center" });

    doc.moveDown(1.1);

    const grandTotal = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    doc
      .fontSize(11)
      .fillColor("#111827")
      .text(`Total Orders: ${completedOrders.length}`)
      .text(`Total Revenue: ${formatCurrency(grandTotal)}`);

    doc.moveDown(1);

    if (!completedOrders.length) {
      doc.fontSize(12).fillColor("#6b7280").text("No completed orders found for this day.");
      doc.end();
      return;
    }

    completedOrders.forEach((order, index) => {
      if (doc.y > 690) {
        doc.addPage();
      }

      const orderNo = order.tokenNumber || String(order._id || "").slice(-6);
      const customerName = order.userId?.name || order.customerName || "Customer";
      const orderItems = Array.isArray(order.items) ? order.items : [];

      doc
        .fontSize(13)
        .fillColor("#111827")
        .text(`Order #${orderNo}`, { underline: false })
        .moveDown(0.15);

      doc
        .fontSize(10)
        .fillColor("#1f2937")
        .text(`Customer Name: ${customerName}`)
        .text(`Payment Method: ${paymentLabel(order.paymentMethod)}`)
        .text(`Order Type: ${orderTypeLabel(order)}`)
        .text(`Order Status: ${order.status || "pending"}`)
        .text(`Order Time: ${formatDateTime(order.createdAt)}`)
        .text(`Total Price: ${formatCurrency(order.totalAmount || order.totalPrice)}`)
        .moveDown(0.2);

      doc.fontSize(10).fillColor("#111827").text("Items Ordered:");
      if (orderItems.length) {
        orderItems.forEach((item) => {
          doc.fontSize(10).fillColor("#374151").text(`- ${itemLine(item)}`, { indent: 12 });
        });
      } else {
        doc.fontSize(10).fillColor("#6b7280").text("- No items", { indent: 12 });
      }

      if (index !== completedOrders.length - 1) {
        doc
          .moveDown(0.5)
          .strokeColor("#e5e7eb")
          .lineWidth(1)
          .moveTo(48, doc.y)
          .lineTo(547, doc.y)
          .stroke()
          .moveDown(0.5);
      }
    });

    doc.end();

    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
  });

  return {
    fileName,
    filePath,
    orderCount: orders.length
  };
};
