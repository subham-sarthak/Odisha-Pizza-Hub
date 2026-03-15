let ioRef;

export const setupSocket = (io) => {
  ioRef = io;

  io.on("connection", (socket) => {
    socket.on("join:customer", (userId) => {
      socket.join(`customer:${userId}`);
    });

    socket.on("join:admin", () => {
      socket.join("admin");
    });

    socket.on("join:kitchen", () => {
      socket.join("kitchen");
    });

    socket.on("disconnect", () => {
      // No-op: room cleanup handled by socket.io.
    });
  });
};

export const emitOrderUpdate = ({ userId, order }) => {
  if (!ioRef) return;
  ioRef.to(`customer:${userId}`).emit("orderUpdated", order);
  ioRef.to("admin").emit("orderUpdated", order);
  ioRef.to("kitchen").emit("orderUpdated", order);
};

export const emitNewOrder = (order) => {
  if (!ioRef) return;
  ioRef.to("admin").emit("newOrder", order);
  ioRef.to("kitchen").emit("newOrder", order);
};

export const emitStoreStatusUpdated = (storeStatus) => {
  if (!ioRef) return;
  ioRef.emit("storeStatusUpdated", storeStatus);
};
