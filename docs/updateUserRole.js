
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.updateUserRoleFromAdminPanel = onCall(async (request) => {
  // 1. Ensure caller is a superadmin.
  if (!request.auth?.token.superadmin) {
    throw new HttpsError("permission-denied", "Only superadmins can assign roles.");
  }

  const { uid, role } = request.data;
  
  if (!uid || !role) {
    throw new HttpsError("invalid-argument", "The function must be called with 'uid' and 'role' arguments.");
  }

  const allowedRoles = ["superadmin", "admin", "agent", "user"];
  if (!allowedRoles.includes(role)) {
     throw new HttpsError("invalid-argument", "Invalid role specified.");
  }

  try {
    const auth = getAuth();
    const firestore = getFirestore();
    
    const user = await auth.getUser(uid);
    const oldClaims = user.customClaims || {};

    // Prepare new claims based on the specified role.
    const newClaims = {
        superadmin: role === "superadmin",
        admin: role === "admin",
        agent: role === "agent",
    };
    
    // To avoid leaving stale boolean flags, we construct a clean claims object.
    // Any other custom claims you might have would be preserved here.
    const claimsToSet = {...oldClaims};
    delete claimsToSet.superadmin;
    delete claimsToSet.admin;
    delete claimsToSet.agent;
    
    if (newClaims.superadmin) claimsToSet.superadmin = true;
    if (newClaims.admin) claimsToSet.admin = true;
    if (newClaims.agent) claimsToSet.agent = true;


    // 7. Update the target user's custom claim.
    await auth.setCustomUserClaims(uid, claimsToSet);

    // 8. (Optional) Write an audit log.
    const auditLogRef = firestore.collection("admin_roleAudit").doc();
    await auditLogRef.set({
      uid: uid,
      email: user.email,
      oldRole: oldClaims.superadmin ? 'superadmin' : oldClaims.admin ? 'admin' : oldClaims.agent ? 'agent' : 'user',
      newRole: role,
      changedBy: request.auth.uid,
      changedAt: new Date(),
    });

    return { success: true, message: `Role for ${user.email} updated to ${role}.` };

  } catch (error) {
    console.error("Error updating user role:", error);
    if (error instanceof HttpsError) {
        throw error; // Re-throw HttpsError directly
    }
    throw new HttpsError("internal", "An unexpected error occurred while updating the user role.");
  }
});
