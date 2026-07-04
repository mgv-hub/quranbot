const { dhikrData, buildTypeSelectionComponents, buildCounter } = require('@interactions/helpers/tasbihHelper');

module.exports = {
    async execute(interaction) {
        const customId = interaction.customId;

        if (customId === 'tasbih_back_to_types') {
            const payload = buildTypeSelectionComponents();
            await interaction.update(payload);
            return;
        }

        if (customId.startsWith('tasbih_type_')) {
            const catIdx = parseInt(customId.split('_')[2]);
            const payload = buildCounter(catIdx, 0, 0);
            await interaction.update(payload);
            return;
        }

        const parts = customId.split('_');
        const action = parts[1];

        let catIdx = parseInt(parts[2]);
        let dhikrIdx = parseInt(parts[3]);
        let count = parseInt(parts[4]);

        const cat = dhikrData[catIdx];
        const maxDhikr = cat.items.length - 1;

        switch (action) {
            case 'inc':
                count += 1;
                break;

            case 'reset':
                count = 0;
                break;

            case 'next':
                dhikrIdx = dhikrIdx >= maxDhikr ? 0 : dhikrIdx + 1;
                count = 0;
                break;

            case 'prev':
                dhikrIdx = dhikrIdx <= 0 ? maxDhikr : dhikrIdx - 1;
                count = 0;
                break;
        }

        const payload = buildCounter(catIdx, dhikrIdx, count);
        await interaction.update(payload);
    },
};
