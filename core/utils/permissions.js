'use strict';
require('pathlra-aliaser')();
const { PermissionsBitField } = require('discord.js');
const logger = require('@logger');

function isAuthorized(interaction, state, interactionType) {
   try {
      const member = interaction.member;
      if (!member) {
         logger.debug('Member Not Found In Interaction');
         return false;
      }
      const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
      const hasQuranAdminRole = member.roles.cache.some(
         (role) =>
            role.name.toLowerCase().includes('quran admin') ||
            role.name.toLowerCase().includes('islamic admin') ||
            role.name.toLowerCase().includes('admin'),
      );
      const isSpecialUser = global.SPE_USER_IDS.includes(interaction.user?.id);
      if (interactionType === null) {
         return isAdmin || hasQuranAdminRole || isSpecialUser;
      }
      if (interactionType === 'support') {
         return true;
      }
      if (isAdmin || hasQuranAdminRole || isSpecialUser) {
         return true;
      }
      if (state?.controlMode === 'admins') {
         return false;
      }
      if (state?.controlMode === 'everyone') {
         const allowedInteractions = [
            'next',
            'prev',
            'select_surah',
            'select_reciter',
            'select_radio',
            'toggle_radio',
            'prev_page',
            'next_page',
         ];
         return allowedInteractions.includes(interactionType);
      }
      return false;
   } catch (error) {
      logger.error('Authorization Check Error');
      return false;
   }
}

function checkAuthorization(interaction, state, interactionType) {
   const isAuth = isAuthorized(interaction, state, interactionType);
   if (!isAuth) {
      const member = interaction.member;
      const details = {
         isAdmin: member?.permissions.has(PermissionsBitField.Flags.Administrator),
         hasQuranAdminRole: member?.roles.cache.some(
            (role) =>
               role.name.toLowerCase().includes('quran admin') ||
               role.name.toLowerCase().includes('islamic admin') ||
               role.name.toLowerCase().includes('admin'),
         ),
         isSpecialUser: interaction.user.id === global.SPE_USER_ID,
         controlMode: state?.controlMode,
         interactionType: interactionType,
         allowedForEveryone: [
            'next',
            'prev',
            'select_surah',
            'select_reciter',
            'select_radio',
            'toggle_radio',
            'prev_page',
            'next_page',
         ].includes(interactionType),
         timestamp: new Date().toISOString(),
      };
      logger.debug('Permission Denial Details');
   }
   return isAuth;
}

function isMemberInVoiceChannel(interaction) {
   try {
      const member = interaction.member;
      return member?.voice.channelId !== null;
   } catch (error) {
      logger.error('Error Checking Member Voice Channel');
      return false;
   }
}

function checkBotVoicePermissions(interaction, state) {
   try {
      const guild = interaction.guild;
      if (!guild) return false;
      const botMember = guild.members.me;
      if (!botMember) return false;
      if (state?.channelId) {
         const channel = guild.channels.cache.get(state.channelId);
         if (channel) {
            const permissions = channel.permissionsFor(botMember);
            return (
               permissions.has(PermissionsBitField.Flags.Connect) && permissions.has(PermissionsBitField.Flags.Speak)
            );
         }
      }
      const member = interaction.member;
      if (member?.voice.channel) {
         const permissions = member.voice.channel.permissionsFor(botMember);
         return permissions.has(PermissionsBitField.Flags.Connect) && permissions.has(PermissionsBitField.Flags.Speak);
      }
      return false;
   } catch (error) {
      logger.error('Error Checking Bot Voice Permissions');
      return false;
   }
}

module.exports.isAuthorized = isAuthorized;
module.exports.checkAuthorization = checkAuthorization;
module.exports.isMemberInVoiceChannel = isMemberInVoiceChannel;
module.exports.checkBotVoicePermissions = checkBotVoicePermissions;
