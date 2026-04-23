require('pathlra-aliaser')();
module.exports = {
   name: 'مواقيت_الصلاة',
   description: 'عرض مواقيت الصلاة لجميع الدول والمناطق',
   async execute(interaction) {
      const imp = require('@loader-core_bootstrap');
      const logger = require('@logger');
      try {
         if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: 64 });
         }
         const embed = {
            embeds: [
               {
                  color: 0x1e1f22,
                  title: 'مواقيت الصلاة',
                  description:
                     'اختر الدولة ثم المنطقة لعرض مواقيت الصلاة\n**تحذير مهم**\nهذه المعلومات يتم جلبها من https://aladhan.com وقد تختلف عن مواقيت الصلاة الرسمية في بلدك\n**نوصي بالتحقق من الموقع الرسمي** للمواعيد الدقيقة: https://aladhan.com/prayer-times',
                  fields: [
                     {
                        name: 'طريقة الاستخدام',
                        value: 'اضغط على زر مواقيت الصلاة لاختيار الدولة والمنطقة',
                        inline: false,
                     },
                  ],
               },
            ],
         };
         let components = [];
         if (imp && imp.createPrayerTimesButtonRow) {
            components.push(imp.createPrayerTimesButtonRow());
         }
         if (!interaction.replied) {
            await interaction.editReply({
               embeds: embed.embeds,
               components: components,
               flags: 64,
            });
         }
      } catch (error) {
         logger.error('Error in prayerTimes command', error);
         try {
            if (!interaction.replied) {
               await interaction.editReply({
                  content: 'حدث خطأ أثناء معالجة طلبك يرجى المحاولة مرة أخرى لاحقاً',
                  flags: 64,
               });
            }
         } catch (replyError) {
            logger.error('Error sending error reply', replyError);
         }
      }
   },
};
