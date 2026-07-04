const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// calc pagination bounds + indices
function calculatePagination(total, page, limit) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const curr = Math.min(Math.max(0, page), totalPages - 1);
    const start = curr * limit;
    return {
        totalPages,
        currentPage: curr,
        startIndex: start,
        endIndex: Math.min(start + limit, total),
    };
}

// create prev/next buttons row with auto-disable
function createPaginationRow(page, totalPages, cfg) {
    const { prevId, nextId, prevLabel = 'السابق', nextLabel = 'التالي', extraComponents = [] } = cfg;
    const resolve = (id, p) => (typeof id === 'function' ? id(p) : id);

    return new ActionRowBuilder().addComponents([
        new ButtonBuilder()
            .setCustomId(resolve(prevId, page))
            .setLabel(prevLabel)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 0),
        new ButtonBuilder()
            .setCustomId(resolve(nextId, page))
            .setLabel(nextLabel)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1),
        ...extraComponents,
    ]);
}

module.exports.calculatePagination = calculatePagination;
module.exports.createPaginationRow = createPaginationRow;
