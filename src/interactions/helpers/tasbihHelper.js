const dhikrData = {
    0: {
        name: 'تسبيح',
        items: [
            'سبحان الله',
            'سبحان الله وبحمده',
            'سبحان الله العظيم',
            'سبحان الله وبحمده، سبحان الله العظيم',
            'سبحان الله والحمد لله',
            'سبحان الله ولا إله إلا الله',
            'سبحان الله والحمد لله ولا إله إلا الله والله أكبر',
        ],
    },
    1: {
        name: 'تحميد',
        items: ['الحمد لله', 'الحمد لله على كل حال', 'الحمد لله حمداً كثيراً طيباً مباركاً فيه'],
    },
    2: {
        name: 'تكبير',
        items: ['الله أكبر', 'الله أكبر كبيرًا', 'الله أكبر ولله الحمد'],
    },
    3: {
        name: 'تهليل',
        items: [
            'لا إله إلا الله',
            'لا إله إلا الله وحده لا شريك له',
            'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',
            'لا إله إلا الله وحده صدق وعده، ونصر عبده، وأعز جنده، وهزم الأحزاب وحده',
        ],
    },
    4: {
        name: 'استغفار',
        items: ['أستغفر الله', 'أستغفر الله وأتوب إليه', 'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه'],
    },
    5: {
        name: 'الصلاة على النبي ﷺ',
        items: ['اللهم صل وسلم على نبينا محمد', 'اللهم صل على محمد وعلى آل محمد', 'صلى الله عليه وسلم'],
    },
};

function buildTypeSelection() {
    return {
        flags: 32768,
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    {
                        type: 1,
                        components: [
                            { type: 2, custom_id: 'tasbih_type_0', label: 'تسبيح', style: 2 },
                            { type: 2, custom_id: 'tasbih_type_1', label: 'تحميد', style: 2 },
                            { type: 2, custom_id: 'tasbih_type_2', label: 'تكبير', style: 2 },
                            { type: 2, custom_id: 'tasbih_type_3', label: 'تهليل', style: 2 },
                            { type: 2, custom_id: 'tasbih_type_4', label: 'استغفار', style: 2 },
                        ],
                    },
                    {
                        type: 1,
                        components: [{ type: 2, custom_id: 'tasbih_type_5', label: 'صلاة على النبي', style: 2 }],
                    },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: '### اختيار نوع الذكر' },
                    { type: 14, divider: false, spacing: 2 },
                    { type: 10, content: 'اختر نوع الذكر الذي تريد البدء به من الأزرار أعلاه' },
                ],
            },
        ],
    };
}

function buildCounter(catIdx, dhikrIdx, count) {
    const cat = dhikrData[catIdx];
    const text = cat.items[dhikrIdx];
    return {
        flags: 32768,
        components: [
            {
                type: 17,
                accent_color: 0xfefdfe,
                components: [
                    {
                        type: 1,
                        components: [
                            { type: 2, custom_id: 'tasbih_type_0', label: 'تسبيح', style: 2 },
                            { type: 2, custom_id: 'tasbih_type_1', label: 'تحميد', style: 2 },
                            { type: 2, custom_id: 'tasbih_type_2', label: 'تكبير', style: 2 },
                            { type: 2, custom_id: 'tasbih_type_3', label: 'تهليل', style: 2 },
                            { type: 2, custom_id: 'tasbih_type_4', label: 'استغفار', style: 2 },
                        ],
                    },
                    {
                        type: 1,
                        components: [{ type: 2, custom_id: 'tasbih_type_5', label: 'صلاة على النبي', style: 2 }],
                    },
                    { type: 14, divider: true, spacing: 1 },
                    { type: 10, content: `### ${cat.name}\n**${text}**` },
                    { type: 14, divider: false, spacing: 2 },
                    { type: 10, content: `**العدد:** \`${count}\`` },
                    { type: 14, divider: true, spacing: 1 },
                    {
                        type: 1,
                        components: [
                            { type: 2, custom_id: `tasbih_prev_${catIdx}_${dhikrIdx}_${count}`, label: 'السابق', style: 2 },
                            { type: 2, custom_id: `tasbih_next_${catIdx}_${dhikrIdx}_${count}`, label: 'التالي', style: 2 },
                            { type: 2, custom_id: `tasbih_inc_${catIdx}_${dhikrIdx}_${count}`, label: 'زيادة (+1)', style: 2 },
                            { type: 2, custom_id: `tasbih_reset_${catIdx}_${dhikrIdx}_0`, label: 'تصفير', style: 2 },
                        ],
                    },
                ],
            },
        ],
    };
}

module.exports = {
    dhikrData,
    buildTypeSelection,
    buildCounter,
};
