require('pathlra-aliaser')();
module.exports = {
   name: 'دليل',
   description: 'دليل استخدام البوت وخيارات الإعداد',
   async execute(interaction) {
      const imp = require('@loader-core_bootstrap');
      const guildId = interaction.guildId;
      const state = imp.getGuildState(guildId);
      try {
         if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: 64 }).catch(() => {});
         }
         const embed = {
            embeds: [
               {
                  color: 0x1e1f22,
                  title: 'دليل استخدام البوت',
                  description:
                     '**/إعداد**: إعداد فئة القرآن الكريم (سيتم إنشاء قنوات تلقائيًا)' +
                     '**/دخول**: الانضمام إلى الروم الصوتي (بعد الإعداد)' +
                     '**/دخول_قناة**: الانضمام إلى غرفة صوتية محددة' +
                     '**/خروج**: الخروج من الروم الصوتي' +
                     '**/تحكم**: عرض لوحة التحكم' +
                     '**/سرعة**: عرض سرعة البوت، ومدة التشغيل، وعدد السيرفرات الحالي',
               },
            ],
         };
         await interaction.editReply(embed);
      } catch (error) {
         const logger = require('@logger');
         logger.error('Error in guide command', error);
         await interaction.editReply({
            content: 'جاري معالجة الطلب',
            flags: 64,
         });
      }
   },
};
