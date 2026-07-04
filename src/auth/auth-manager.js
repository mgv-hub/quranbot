const { PermissionsBitField } = require('discord.js');
const { safeError } = require('@interactions/flow/deferReply');
const logger = require('@logging/logger');
const { permissions_config } = require('@config/constants');

// actions everyone can do in 'everyone' mode
const allowed_everyone_actions = [
    'next',
    'prev',
    'select_surah',
    'select_reciter',
    'select_radio',
    'toggle_radio',
    'prev_page',
    'next_page',
    'playback',
    'radio',
];

// admin check. handles both bigint and number perm formats from discord.js
function hasAdminPermission(member) {
    if (!member?.permissions) return false;
    // quick check, handle both cases
    const check = member.permissions.has?.bind(member.permissions);
    if (check) return check(PermissionsBitField.Flags.Administrator);
    return false;
}

// check admin roles from config (keyword match)
function hasAdminRole(member) {
    if (!member?.roles?.cache) return false;
    const adminKws = permissions_config.admin_roles;
    return member.roles.cache.some((r) => adminKws.some((kw) => r.name.toLowerCase().includes(kw)));
}

// check special dev/admin users list
function isSpecialUser(userId) {
    return global.SPE_USER_IDS?.includes(userId) || false;
}

// main auth check - returns true/false
function isAuthorized(interaction, guildState, interactionType) {
    const member = interaction.member;
    const userId = interaction.user?.id;

    if (!member) {
        logger.debug('auth: no member');
        return false;
    }

    // support/help always open
    if (interactionType === 'support' || interactionType === 'open_complaint_modal') {
        return true;
    }

    // null type = command level check
    if (interactionType === null) {
        return hasAdminPermission(member) || hasAdminRole(member) || isSpecialUser(userId);
    }

    // admin/special bypass everything
    if (hasAdminPermission(member) || hasAdminRole(member) || isSpecialUser(userId)) {
        return true;
    }

    // control mode check
    if (!guildState?.controlMode || guildState.controlMode === 'admins') {
        return false;
    }

    // everyone mode - check whitelist
    return allowed_everyone_actions.includes(interactionType);
}

// wrapper for interactions - handles error reply
async function authorizeInteraction(interaction, guildState, interactionType = null) {
    if (isAuthorized(interaction, guildState, interactionType)) return true;

    // pick message based on mode
    const msg =
        guildState?.controlMode === 'everyone'
            ? 'هذا الإجراء غير متاح للأعضاء العاديين في وضع الجميع. التنقل بين السور واختيار القارئ متاح مع تأخير 90 ثانية. الأدمنز لديهم تحكم كامل.'
            : 'تتطلب هذه العملية امتلاك صلاحيات المسؤول (Administrator) أو دور إداري معين.';

    await safeError(interaction, msg, 'auth_denied');
    return false;
}

// check if feature is public (no auth needed)
function isPublicFeature(interaction) {
    const { customId } = interaction;

    // azkar buttons
    if (interaction.isButton() && (customId.startsWith('play_azkar_') || customId === 'azkar_get_role')) return true;

    if (customId.startsWith('search_') || customId.startsWith('tafseer_') || customId.startsWith('tasbih_')) return true;
    // prayer buttons
    if (interaction.isButton()) {
        if (
            customId === 'prayer_times' ||
            customId === 'home_prayer' ||
            customId === 'refresh_prayer' ||
            customId === 'back_country_prayer' ||
            customId === 'cancel_prayer' ||
            customId.startsWith('prev_country_page_') ||
            customId.startsWith('next_country_page_')
        ) {
            return true;
        }
    }

    // prayer selects
    if (interaction.isStringSelectMenu() && (customId === 'select_country_prayer' || customId === 'select_city_prayer')) {
        return true;
    }

    // nav buttons
    if (customId === 'more_features' || customId === 'back_to_main') return true;

    return false;
}

module.exports.isAuthorized = isAuthorized;
module.exports.authorizeInteraction = authorizeInteraction;
module.exports.hasAdminPermission = hasAdminPermission;
module.exports.hasAdminRole = hasAdminRole;
module.exports.isSpecialUser = isSpecialUser;
module.exports.isPublicFeature = isPublicFeature;
module.exports.allowed_everyone_actions = allowed_everyone_actions;
