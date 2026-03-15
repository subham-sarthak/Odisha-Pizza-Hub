import fs from "fs";
import path from "path";
import Order from "../models/Order.js";
import OrderArchive from "../models/OrderArchive.js";

const ARCHIVE_FOLDER = path.resolve(process.cwd(), "public", "order-archives");
const ARCHIVE_INTERVAL_MS = 60 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

const ensureArchiveFolder = async () => {
    await fs.promises.mkdir(ARCHIVE_FOLDER, { recursive: true });
};

const formatCurrency = (amount) => `INR ${Number(amount || 0).toFixed(2)}`;

const escapePdfText = (value) =>
    String(value ?? "")
        .replace(/[^\x20-\x7E]/g, "?")
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

const formatDateTime = (value) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    return dt.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const formatDateOnly = (value) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "Unknown Date";
    return dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const getLocalDateKey = (value) => {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "unknown-date";
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const normalizeItemName = (item) => item?.productName || item?.name || "Item";

const toArchivedOrderSnapshot = (order) => ({
    orderId: order._id,
    tokenNumber: order.tokenNumber || null,
    customerName: order.userId?.name || order.customerName || "Customer",
    status: String(order.status || "pending").toLowerCase(),
    paymentMethod: String(order.paymentMethod || "cod").toLowerCase(),
    paymentStatus: String(order.paymentStatus || "pending").toLowerCase(),
    totalAmount: Number(order.totalAmount || order.totalPrice || 0),
    totalPrice: Number(order.totalPrice || order.totalAmount || 0),
    items: Array.isArray(order.items)
        ? order.items.map((item) => ({
            name: normalizeItemName(item),
            qty: Number(item.qty || 0)
        }))
        : [],
    createdAt: order.createdAt
});

const isDateSummaryLine = (line) =>
    /^\d{2}\s[A-Za-z]{3}\s\d{4}\s\|\sOrders:\s\d+\s\|\sRevenue:\sINR\s/.test(String(line || ""));

const isOrderHeadingLine = (line) => /^\d+\.\sOrder\s#/.test(String(line || ""));

const isOrderDetailLine = (line) => /^\s{3}(Customer|Time|Status|Payment|Amount|Items):/.test(String(line || ""));

const isSummaryStatLine = (line) => /^(Generated on:|Total Orders:|Total Revenue:)/.test(String(line || ""));

const isSectionLabelLine = (line) => String(line || "").trim() === "Orders:";

const getCenteredX = (text, fontSize) => {
    const pageWidth = 595;
    const approxTextWidth = String(text || "").length * fontSize * 0.52;
    return Math.max(42, Math.floor((pageWidth - approxTextWidth) / 2));
};

const getLineHeight = (line) => {
    if (!String(line || "").trim()) return 12;
    if (isDateSummaryLine(line)) return 24;
    if (isSectionLabelLine(line)) return 20;
    if (isOrderHeadingLine(line)) return 19;
    if (isSummaryStatLine(line)) return 18;
    if (isOrderDetailLine(line)) return 17;
    return 16;
};

const getLineStyle = (line) => {
    const clean = String(line || "");

    if (!clean.trim()) {
        return { font: "/F1", size: 10, x: 50, color: "0.22 0.22 0.22", lineHeight: 12 };
    }

    if (isDateSummaryLine(clean)) {
        return {
            font: "/F2",
            size: 14,
            x: getCenteredX(clean, 14),
            color: "0.08 0.20 0.35",
            lineHeight: 24
        };
    }

    if (isSectionLabelLine(clean)) {
        return { font: "/F2", size: 11, x: 50, color: "0.20 0.24 0.30", lineHeight: 20 };
    }

    if (isOrderHeadingLine(clean)) {
        return { font: "/F2", size: 12, x: 50, color: "0.10 0.12 0.14", lineHeight: 19 };
    }

    if (isSummaryStatLine(clean)) {
        return { font: "/F2", size: 11, x: 50, color: "0.14 0.18 0.22", lineHeight: 18 };
    }

    if (isOrderDetailLine(clean)) {
        return { font: "/F1", size: 11, x: 56, color: "0.12 0.12 0.12", lineHeight: 17 };
    }

    return { font: "/F1", size: 10, x: 50, color: "0.18 0.18 0.18", lineHeight: 16 };
};

export const createOrdersPdfBuffer = ({ title, orders = [], generatedAt = new Date() }) => {
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount || order.totalPrice || 0), 0);
    const dateGroupsMap = orders.reduce((acc, order) => {
        const dateValue = new Date(order.createdAt);
        const hasValidDate = !Number.isNaN(dateValue.getTime());
        const dateKey = hasValidDate ? getLocalDateKey(dateValue) : "unknown-date";

        if (!acc[dateKey]) {
            acc[dateKey] = {
                dateLabel: hasValidDate ? formatDateOnly(dateValue) : "Unknown Date",
                latestTime: hasValidDate ? dateValue.getTime() : 0,
                orders: [],
                revenue: 0
            };
        }

        const amount = Number(order.totalAmount || order.totalPrice || 0);
        acc[dateKey].orders.push(order);
        acc[dateKey].revenue += amount;

        if (hasValidDate && dateValue.getTime() > acc[dateKey].latestTime) {
            acc[dateKey].latestTime = dateValue.getTime();
        }

        return acc;
    }, {});

    const dateGroups = Object.values(dateGroupsMap).sort((a, b) => b.latestTime - a.latestTime);

    const contentBlocks = [
        [
            `Generated on: ${formatDateTime(generatedAt)}`,
            `Total Orders: ${orders.length}`,
            `Total Revenue: ${formatCurrency(totalAmount)}`,
            ""
        ]
    ];

    if (!dateGroups.length) {
        contentBlocks.push(["No orders found"]);
    }

    dateGroups.forEach((group) => {
        const sectionOrders = [...group.orders].sort((a, b) => {
            const at = new Date(a.createdAt).getTime();
            const bt = new Date(b.createdAt).getTime();
            if (Number.isNaN(at) && Number.isNaN(bt)) return 0;
            if (Number.isNaN(at)) return 1;
            if (Number.isNaN(bt)) return -1;
            return bt - at;
        });

        contentBlocks.push([
            `${group.dateLabel} | Orders: ${sectionOrders.length} | Revenue: ${formatCurrency(group.revenue)}`,
            "Orders:"
        ]);

        sectionOrders.forEach((order, index) => {
            const token = order.tokenNumber || String(order._id || "").slice(-6);
            const customer = order.userId?.name || order.customerName || "Customer";
            const status = String(order.status || "pending").toLowerCase();
            const amount = formatCurrency(order.totalAmount || order.totalPrice);
            const heading = order.isArchiveSummary
                ? `${index + 1}. ${order.archiveLabel || "Legacy Archive Summary"}`
                : `${index + 1}. Order #${token}`;
            const itemText = Array.isArray(order.items) && order.items.length
                ? order.items.map((item) => `${normalizeItemName(item)} x${item.qty}`).join(", ")
                : "No items";

            contentBlocks.push([
                heading,
                `   Customer: ${customer}`,
                `   Time: ${formatDateTime(order.createdAt)}`,
                `   Status: ${status}`,
                `   Payment: ${(order.paymentMethod || "cod").toUpperCase()}`,
                `   Amount: ${amount}`,
                `   Items: ${itemText}`,
                ""
            ]);
        });

        contentBlocks.push([""]);
    });

    const lineChunks = [];
    let currentPageLines = [];
    let currentY = 775;
    const pageBottomY = 52;

    const startNewPage = () => {
        lineChunks.push(currentPageLines);
        currentPageLines = [];
        currentY = 800;
    };

    contentBlocks.forEach((block) => {
        const blockHeight = block.reduce((sum, line) => sum + getLineHeight(line), 0);

        if (currentY - blockHeight < pageBottomY && currentPageLines.length > 0) {
            startNewPage();
        }

        if (currentY - blockHeight < pageBottomY && currentPageLines.length === 0) {
            // Fallback for unusually large blocks: split only when a full block cannot fit on an empty page.
            block.forEach((line) => {
                const nextHeight = getLineHeight(line);
                if (currentY - nextHeight < pageBottomY && currentPageLines.length > 0) {
                    startNewPage();
                }
                currentPageLines.push(line);
                currentY -= nextHeight;
            });
            return;
        }

        block.forEach((line) => {
            currentPageLines.push(line);
            currentY -= getLineHeight(line);
        });
    });

    if (currentPageLines.length) {
        lineChunks.push(currentPageLines);
    }
    if (!lineChunks.length) lineChunks.push([]);

    const pageCount = lineChunks.length;
    const normalFontObjectId = 3 + pageCount * 2;
    const boldFontObjectId = normalFontObjectId + 1;
    const objectMap = {
        1: "<< /Type /Catalog /Pages 2 0 R >>",
        2: ""
    };

    const pageIds = [];
    for (let i = 0; i < pageCount; i += 1) {
        const pageObjectId = 3 + i * 2;
        const contentObjectId = 4 + i * 2;
        pageIds.push(pageObjectId);

        const contentLines = [];

        // Soft page background and white content card for cleaner readability.
        contentLines.push("0.95 0.95 0.96 rg");
        contentLines.push("0 0 595 842 re f");
        contentLines.push("1 1 1 rg");
        contentLines.push("24 24 547 794 re f");

        let y = 800;
        if (i === 0) {
            contentLines.push("0.96 0.43 0.20 rg");
            contentLines.push("24 768 547 52 re f");
            contentLines.push("BT");
            contentLines.push("/F2 22 Tf");
            contentLines.push("1 1 1 rg");
            contentLines.push(`${getCenteredX(title, 22)} 786 Td`);
            contentLines.push(`(${escapePdfText(title)}) Tj`);
            contentLines.push("ET");
            y = 760;
        } else {
            y = 796;
        }

        lineChunks[i].forEach((line) => {
            const style = getLineStyle(line);

            contentLines.push("BT");
            contentLines.push(`${style.font} ${style.size} Tf`);
            contentLines.push(`${style.color} rg`);
            contentLines.push(`${style.x} ${y} Td`);
            contentLines.push(`(${escapePdfText(line)}) Tj`);
            contentLines.push("ET");
            y -= style.lineHeight;
        });

        const content = `${contentLines.join("\n")}\n`;

        objectMap[pageObjectId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${normalFontObjectId} 0 R /F2 ${boldFontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
        objectMap[contentObjectId] = `<< /Length ${content.length} >>\nstream\n${content}endstream`;
    }

    objectMap[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`;
    objectMap[normalFontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objectMap[boldFontObjectId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

    let pdf = "%PDF-1.4\n";
    const offsets = [0];

    for (let id = 1; id <= boldFontObjectId; id += 1) {
        const body = objectMap[id];
        offsets.push(pdf.length);
        pdf += `${id} 0 obj\n${body}\nendobj\n`;
    }

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${boldFontObjectId + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
        pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${boldFontObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return Buffer.from(pdf, "utf-8");
};

export const archiveOrdersOlderThan24Hours = async () => {
    await ensureArchiveFolder();

    const cutoff = new Date(Date.now() - RETENTION_MS);
    const oldOrders = await Order.find({ createdAt: { $lte: cutoff } })
        .populate("userId", "name phone email")
        .sort({ createdAt: 1 })
        .lean();

    if (!oldOrders.length) {
        return { archived: 0, deleted: 0, files: [] };
    }

    const groups = oldOrders.reduce((acc, order) => {
        const dayKey = new Date(order.createdAt).toISOString().slice(0, 10);
        if (!acc[dayKey]) acc[dayKey] = [];
        acc[dayKey].push(order);
        return acc;
    }, {});

    const files = [];
    let archived = 0;
    let deleted = 0;

    for (const [dayKey, ordersForDay] of Object.entries(groups)) {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `orders-${dayKey}-${stamp}.pdf`;
        const filePath = path.join(ARCHIVE_FOLDER, fileName);

        const pdfBuffer = await createOrdersPdfBuffer({
            title: `Odisha Pizza Hub Orders Archive (${dayKey})`,
            orders: ordersForDay,
            generatedAt: new Date()
        });

        await fs.promises.writeFile(filePath, pdfBuffer);

        const totalAmount = ordersForDay.reduce((sum, order) => sum + Number(order.totalAmount || order.totalPrice || 0), 0);
        const createdTimes = ordersForDay.map((order) => new Date(order.createdAt).getTime()).filter((time) => !Number.isNaN(time));
        const fallbackTime = Date.now();
        const firstTime = createdTimes.length ? Math.min(...createdTimes) : fallbackTime;
        const lastTime = createdTimes.length ? Math.max(...createdTimes) : fallbackTime;

        await OrderArchive.create({
            fileName,
            filePath,
            archiveDate: new Date(`${dayKey}T00:00:00.000Z`),
            orderCount: ordersForDay.length,
            totalAmount,
            fromDate: new Date(firstTime),
            toDate: new Date(lastTime),
            archivedOrders: ordersForDay.map(toArchivedOrderSnapshot),
            sourceOrderIds: ordersForDay.map((order) => order._id),
            generatedAt: new Date()
        });

        const ids = ordersForDay.map((order) => order._id);
        if (ids.length) {
            const deletionResult = await Order.deleteMany({ _id: { $in: ids } });
            deleted += deletionResult.deletedCount || 0;
        }

        archived += ordersForDay.length;
        files.push(fileName);
    }

    return { archived, deleted, files };
};

export const startOrderArchiveScheduler = () => {
    const run = async () => {
        try {
            const result = await archiveOrdersOlderThan24Hours();
            if (result.archived > 0) {
                console.log(`Archived ${result.archived} orders into PDFs and deleted ${result.deleted} old orders.`);
            }
        } catch (error) {
            console.error("Order archive scheduler failed", error);
        }
    };

    run();
    return setInterval(run, ARCHIVE_INTERVAL_MS);
};
