// Replaced all inline authorization logic with centralized authManager to eliminate duplication
const { isAuthorized, hasAdminPermission, hasAdminRole, isSpecialUser, allowed_everyone_actions } = require('@core/Auth/AuthManager');

module.exports.isAuthorized = isAuthorized;
module.exports.checkAdminPermission = hasAdminPermission;
module.exports.hasAdminRole = hasAdminRole;
module.exports.isSpecialUser = isSpecialUser;
module.exports.allowed_everyone_actions = allowed_everyone_actions;
