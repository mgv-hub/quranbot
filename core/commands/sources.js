require('pathlra-aliaser')();
module.exports = {
   name: 'مصادر',
   description: 'عرض مصادر المعلومات والروابط التي يستخدمها البوت',
   async execute(interaction) {
      const imp = require('@loader-core_bootstrap');
      const logger = require('@logger');
      try {
         if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ flags: 64 }).catch(() => {});
         }
         const embed = new imp.EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('مصادر معلومات البوت')
            .setDescription('البوت يستخدم المصادر الرسمية التالية لجلب البيانات')
            .addFields(
               {
                  name: 'القرآن الكريم والتلاوات',
                  value: '[mp3quran.net](https://www.mp3quran.net/ar)\nمصدر رسمي لتلاوات القرآن الكريم بأصوات القراء',
                  inline: false,
               },
               {
                  name: 'مواقيت الصلاة',
                  value: '[aladhan.com](https://api.aladhan.com)\nمصدر عالمي لمواقيت الصلاة لجميع الدول والمدن',
                  inline: false,
               },
               {
                  name: 'الأذكار والأدعية',
                  value: '[adhkar.json](https://hub-mgv.github.io/QuranBotData/adhkar.json)\nمصدر متخصص لبيانات الأذكار مع الملفات الصوتية',
                  inline: false,
               },
               {
                  name: 'قاعدة البيانات',
                  value: 'Firebase Realtime Database\nلتخزين الإعدادات والبيانات بشكل آمن ومستمر',
                  inline: false,
               },
               {
                  name: 'الإذاعات القرآنية',
                  value: '[mp3quran.net/radios](https://www.mp3quran.net/ar/radios)\nبث مباشر للإذاعات القرآنية من مختلف الدول',
                  inline: false,
               },
            )
            .setFooter({ text: 'جميع المصادر رسمية وموثوقة' });
         await interaction.editReply({
            embeds: [embed],
            flags: 64,
         });
      } catch (error) {
         logger.error('Error in sources command', error);
         await interaction.editReply({
            content: 'جاري معالجة الطلب',
            flags: 64,
         });
      }
   },
};
