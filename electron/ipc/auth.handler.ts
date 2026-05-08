import { ipcMain } from "electron";
import bcrypt from "bcryptjs";
import { getDb } from "../lib/db";

const BCRYPT_ROUNDS = 10;

// Shape returned to the renderer — never includes passwordHash or pin
export type SanitizedUser = {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  status: string;
  avatar: string | null;
  roleId: string;
  lastLoginAt: string | null;
  role: { id: string; name: string; displayName: string };
};

function sanitizeUser(user: {
  id: string;
  username: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  status: string;
  avatar: string | null;
  roleId: string;
  lastLoginAt: Date | null;
  role: { id: string; name: string; displayName: string };
}): SanitizedUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    status: user.status,
    avatar: user.avatar,
    roleId: user.roleId,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    role: {
      id: user.role.id,
      name: user.role.name,
      displayName: user.role.displayName,
    },
  };
}

export function registerAuthHandlers(): void {
  const db = getDb();

  // ── Login ────────────────────────────────────────────────────────────────
  ipcMain.handle(
    "auth:login",
    async (_, username: string, password: string) => {
      try {
        const user = await db.user.findUnique({
          where: { username: username.trim().toLowerCase() },
          include: { role: true },
        });

        if (!user) {
          return { success: false, error: "Invalid username or password." };
        }

        if (user.status === "SUSPENDED") {
          return { success: false, error: "Account is suspended. Contact your administrator." };
        }

        if (user.status === "INACTIVE") {
          return { success: false, error: "Account is inactive. Contact your administrator." };
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) {
          return { success: false, error: "Invalid username or password." };
        }

        // Update last login timestamp
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Record login activity
        await db.activityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
            summary: `${user.fullName} signed in`,
          },
        });

        const permissions: string[] = JSON.parse(user.role.permissions);

        return {
          success: true,
          user: sanitizeUser(user),
          permissions,
        };
      } catch (err) {
        console.error("[auth:login]", err);
        return { success: false, error: "Login failed. Please try again." };
      }
    }
  );

  // ── Logout ───────────────────────────────────────────────────────────────
  ipcMain.handle("auth:logout", async (_, userId: string) => {
    try {
      await db.activityLog.create({
        data: {
          userId,
          action: "LOGOUT",
          entity: "User",
          entityId: userId,
          summary: "User signed out",
        },
      });
      return { success: true };
    } catch (err) {
      console.error("[auth:logout]", err);
      return { success: false };
    }
  });

  // ── Validate session (called on app reload to re-check user is still active) ──
  ipcMain.handle("auth:validateSession", async (_, userId: string) => {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user || user.status !== "ACTIVE") {
        return { valid: false };
      }

      const permissions: string[] = JSON.parse(user.role.permissions);

      return {
        valid: true,
        user: sanitizeUser(user),
        permissions,
      };
    } catch (err) {
      console.error("[auth:validateSession]", err);
      return { valid: false };
    }
  });

  // ── Change password ───────────────────────────────────────────────────────
  ipcMain.handle(
    "auth:changePassword",
    async (_, userId: string, currentPassword: string, newPassword: string) => {
      try {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, error: "User not found." };

        const match = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!match) return { success: false, error: "Current password is incorrect." };

        if (newPassword.length < 8) {
          return { success: false, error: "New password must be at least 8 characters." };
        }

        const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

        await db.user.update({
          where: { id: userId },
          data: { passwordHash: newHash },
        });

        await db.activityLog.create({
          data: {
            userId,
            action: "UPDATE",
            entity: "User",
            entityId: userId,
            summary: "Password changed",
          },
        });

        return { success: true };
      } catch (err) {
        console.error("[auth:changePassword]", err);
        return { success: false, error: "Failed to change password." };
      }
    }
  );

  // ── Hash a password (utility for user creation/management) ───────────────
  ipcMain.handle("auth:hashPassword", async (_, password: string) => {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  });

  // ── Verify PIN (quick-login) ──────────────────────────────────────────────
  ipcMain.handle("auth:verifyPin", async (_, userId: string, pin: string) => {
    try {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user || !user.pin || user.status !== "ACTIVE") {
        return { valid: false };
      }
      const match = await bcrypt.compare(pin, user.pin);
      return { valid: match };
    } catch {
      return { valid: false };
    }
  });
}
