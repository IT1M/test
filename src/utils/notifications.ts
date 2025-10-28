import { prisma } from "@/services/prisma";
import { NotificationType, UserRole } from "@prisma/client";
import { sendNotificationEmail } from "@/services/email";

interface CreateNotificationParams {
  userId?: string;
  userIds?: string[];
  role?: UserRole;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for one or more users
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, userIds, role, type, title, message, metadata } = params;

  try {
    // If specific user IDs are provided
    if (userId) {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          metadata: metadata || {},
        },
        include: {
          user: {
            select: {
              email: true,
              preferences: true,
            },
          },
        },
      });

      // Send email if user has email notifications enabled
      await sendEmailIfEnabled(notification.user.email, notification.user.preferences, type, title, message, metadata);

      return notification;
    }

    // If multiple user IDs are provided
    if (userIds && userIds.length > 0) {
      const result = await prisma.notification.createMany({
        data: userIds.map((id) => ({
          userId: id,
          type,
          title,
          message,
          metadata: metadata || {},
        })),
      });

      // Fetch users to send emails
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { email: true, preferences: true },
      });

      // Send emails to users with email notifications enabled
      await Promise.all(
        users.map((user) => sendEmailIfEnabled(user.email, user.preferences, type, title, message, metadata))
      );

      return result;
    }

    // If role is provided, send to all users with that role
    if (role) {
      const users = await prisma.user.findMany({
        where: { role, isActive: true },
        select: { id: true, email: true, preferences: true },
      });

      if (users.length > 0) {
        const result = await prisma.notification.createMany({
          data: users.map((user) => ({
            userId: user.id,
            type,
            title,
            message,
            metadata: metadata || {},
          })),
        });

        // Send emails to users with email notifications enabled
        await Promise.all(
          users.map((user) => sendEmailIfEnabled(user.email, user.preferences, type, title, message, metadata))
        );

        return result;
      }
    }

    throw new Error("No valid recipient specified for notification");
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Helper function to send email if user has email notifications enabled
 */
async function sendEmailIfEnabled(
  email: string,
  preferences: any,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>
) {
  try {
    // Check if user has email notifications enabled in preferences
    const emailNotificationsEnabled = preferences?.emailNotifications !== false; // Default to true

    if (emailNotificationsEnabled) {
      await sendNotificationEmail(email, type, title, message, metadata);
    }
  } catch (error) {
    console.error("Error sending notification email:", error);
    // Don't throw - we don't want email failures to break notification creation
  }
}

/**
 * Check if inventory item has high reject rate and create notification
 */
export async function checkHighRejectRate(inventoryItem: {
  id: string;
  itemName: string;
  batch: string;
  quantity: number;
  reject: number;
}) {
  const rejectRate = (inventoryItem.reject / inventoryItem.quantity) * 100;

  if (rejectRate > 15) {
    // Notify SUPERVISOR, MANAGER, and ADMIN roles
    const supervisors = await prisma.user.findMany({
      where: {
        role: { in: ["SUPERVISOR", "MANAGER", "ADMIN"] },
        isActive: true,
      },
      select: { id: true },
    });

    if (supervisors.length > 0) {
      await prisma.notification.createMany({
        data: supervisors.map((user) => ({
          userId: user.id,
          type: "WARNING" as NotificationType,
          title: "High Reject Rate Alert",
          message: `Item "${inventoryItem.itemName}" (Batch: ${inventoryItem.batch}) has a reject rate of ${rejectRate.toFixed(1)}%`,
          metadata: {
            inventoryItemId: inventoryItem.id,
            rejectRate,
            itemName: inventoryItem.itemName,
            batch: inventoryItem.batch,
          },
        })),
      });
    }
  }
}

/**
 * Notify admins about backup completion or failure
 */
export async function notifyBackupStatus(
  status: "success" | "failure",
  backupId: string,
  fileName: string,
  error?: string
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((user) => ({
        userId: user.id,
        type: status === "success" ? ("SUCCESS" as NotificationType) : ("ERROR" as NotificationType),
        title: status === "success" ? "Backup Completed" : "Backup Failed",
        message:
          status === "success"
            ? `Backup "${fileName}" has been created successfully`
            : `Backup "${fileName}" failed: ${error || "Unknown error"}`,
        metadata: {
          backupId,
          fileName,
          status,
          ...(error && { error }),
        },
      })),
    });
  }
}

/**
 * Notify admins about new user registration
 */
export async function notifyNewUserRegistration(newUser: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((user) => ({
        userId: user.id,
        type: "INFO" as NotificationType,
        title: "New User Registration",
        message: `${newUser.name} (${newUser.email}) has registered with role ${newUser.role}`,
        metadata: {
          newUserId: newUser.id,
          userName: newUser.name,
          userEmail: newUser.email,
          userRole: newUser.role,
        },
      })),
    });
  }
}

/**
 * Notify users about system updates
 */
export async function notifySystemUpdate(
  title: string,
  message: string,
  targetRoles?: UserRole[]
) {
  const whereClause = targetRoles
    ? { role: { in: targetRoles }, isActive: true }
    : { isActive: true };

  const users = await prisma.user.findMany({
    where: whereClause,
    select: { id: true },
  });

  if (users.length > 0) {
    await prisma.notification.createMany({
      data: users.map((user) => ({
        userId: user.id,
        type: "INFO" as NotificationType,
        title,
        message,
        metadata: {
          type: "system_update",
        },
      })),
    });
  }
}
