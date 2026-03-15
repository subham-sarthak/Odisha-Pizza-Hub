export const calculateRewardEarned = (netAmount) => Math.floor(netAmount / 20);

export const maxRewardRedeem = (availablePoints, totalAmount) => {
  const maxByOrder = Math.floor(totalAmount * 0.15);
  return Math.min(availablePoints, maxByOrder);
};
