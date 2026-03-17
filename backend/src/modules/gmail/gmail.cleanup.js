import prisma from "../../config/prisma.js";
import { sendInactivityEmail } from "./gmail.mailer.js";

export const deleteUserCompletely = async (userId) => {
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.rawEmail.deleteMany({ where: { userId } });
  await prisma.merchantCategory.deleteMany({ where: { userId } });
  await prisma.gmailSyncState.deleteMany({ where: { userId } });
  await prisma.gmailToken.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  console.log(`User ${userId} deleted due to 3 months inactivity`);
};

export const handleInactivityWarning = async (userId, type) => {
  const state = await prisma.gmailSyncState.findUnique({
    where: { userId },
    include: { user: true }
  });

  // If user reconnected (disconnectedAt is null), skip
  if (!state || !state.disconnectedAt) {
    console.log(`User ${userId} has reconnected, skipping inactivity warning`);
    return;
  }

  await sendInactivityEmail(state.user.email, state.user.name, type);

  if (type === "one_month_warning") {
    await prisma.gmailSyncState.update({
      where: { userId },
      data: { oneMonthWarningSent: true }
    });
  } else if (type === "two_month_warning") {
    await prisma.gmailSyncState.update({
      where: { userId },
      data: { twoMonthWarningSent: true }
    });
  }
};

export const handleInactivityDelete = async (userId) => {
  const state = await prisma.gmailSyncState.findUnique({
    where: { userId },
    include: { user: true }
  });

  // If user reconnected, skip deletion
  if (!state || !state.disconnectedAt) {
    console.log(`User ${userId} has reconnected, skipping deletion`);
    return;
  }

  await sendInactivityEmail(state.user.email, state.user.name, "deleted");
  await deleteUserCompletely(userId);
};