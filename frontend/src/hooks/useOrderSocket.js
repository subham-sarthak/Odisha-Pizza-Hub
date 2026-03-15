import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext.jsx";

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:5000";

export const useOrderSocket = ({ isAdmin = false, isKitchen = false, connectWithoutAuth = false } = {}) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastNewOrder, setLastNewOrder] = useState(null);
  const [lastOrderUpdate, setLastOrderUpdate] = useState(null);
  const [lastStoreStatusUpdate, setLastStoreStatusUpdate] = useState(null);

  useEffect(() => {
    if (!connectWithoutAuth && (!token || !user?._id)) return undefined;

    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);

      if (isAdmin) {
        socket.emit("join:admin");
        return;
      }

      if (isKitchen) {
        socket.emit("join:kitchen");
        return;
      }

      if (user?._id) {
        socket.emit("join:customer", user._id);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("newOrder", (order) => {
      setLastNewOrder(order);
    });

    socket.on("orderUpdated", (order) => {
      setLastOrderUpdate(order);
    });

    socket.on("storeStatusUpdated", (status) => {
      setLastStoreStatusUpdate(status);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAdmin, isKitchen, connectWithoutAuth, token, user?._id]);

  return {
    socket: socketRef.current,
    isConnected,
    lastNewOrder,
    lastOrderUpdate,
    lastStoreStatusUpdate
  };
};
