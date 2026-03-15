import { useMemo } from "react";
import { useOrderSocket } from "./useOrderSocket";

export const useSocketOrders = (isAdmin = false) => {
  const { lastNewOrder, lastOrderUpdate } = useOrderSocket({ isAdmin });

  return useMemo(() => {
    const events = [];
    if (lastOrderUpdate) events.push(lastOrderUpdate);
    if (lastNewOrder) events.push(lastNewOrder);
    return events;
  }, [lastNewOrder, lastOrderUpdate]);
};
