
/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createMorkBorkMacro (data, slot) {
    const handlers = {
        Ability: _createMBAbilityMacro,
        Armor: _createMBDefenseMacro,
        Weapon: _createMBWeaponAttackMacro
    }

    if (!handlers[data.type]) return

    if (!('data' in data)) return ui.notifications.warn('You can only create macro buttons for owned Items')

    const item = data.data

    // Call the appropriate function to generate a macro
    const macroData = handlers[data.type](data, slot)
    if (macroData) {
    // Create or reuse existing macro
        let macro = game.macros.entities.find(
            m => (m.name === macroData.name) && (m.command === macroData.command)
        )
        if (!macro) {
            macro = await Macro.create({
                name: macroData.name,
                type: 'script',
                img: macroData.img,
                command: macroData.command,
                flags: { 'morkbork.itemMacro': true }
            })
        }
        await game.user.assignHotbarMacro(macro, slot)
    }
    return false
}

/**
 * Create a macro from an ability check drop.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function _createMBAbilityMacro (data, slot) {
    if (data.type !== 'Ability') return

    // Create the macro command
    const abilityId = data.data.abilityId
    const macroData = {
        name: game.i18n.localize(CONFIG.MB.abilities[abilityId]),
        command: `const _actor = game.morkbork.getMacroActor(); if (_actor) { _actor.rollAbilityCheck("${abilityId}") }`,
        img: 'icons/dice/d20black.svg'
    }
    return macroData
}

/**
 * Create a macro from a spell check drop.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function _createMBPowerCheckMacro (data, slot) {
    if (data.type !== 'Spell Check') return

    // Create the macro command
    const spell = data.data.spell || null
    const img = data.data.img || null
    const macroData = {
        name: spell || game.i18n.localize('MB.SpellCheck'),
        command: 'const _actor = game.morkbork.getMacroActor(); if (_actor) { _actor.rollSpellCheck() }',
        img: img || '/systems/mb/styles/images/critical.png'
    }

    if (spell) {
        macroData.command = `const _actor = game.morkbork.getMacroActor(); if (_actor) { _actor.rollSpellCheck({ spell: "${spell}" }) }`
    }

    return macroData
}

/**
 * Create a Macro from a weapon drop.
 * Get an existing macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function _createMBWeaponAttackMacro (data, slot) {
    if (data.type !== 'Weapon') return
    const item = data.data.weapon
    const weaponId = data.data.weapon._id

    const macroData = {
        name: item.name,
        command: `game.morkbork.rollMBWeaponAttackMacro("${weaponId}");`,
        img: item.img
    }
    return macroData
}
/**
 * Create a Macro from a weapon drop.
 * Get an existing macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
function _createMBDefenseMacro (data, slot) {
    if (data.type !== 'Weapon') return
    const item = data.data.weapon
    const weaponSlot = data.data.slot

    const macroData = {
        name: item.name,
        command: `game.morkbork.rollMBWeaponAttackMacro("${weaponSlot}", ${JSON.stringify(options)});`,
        img: '/systems/mb/styles/images/axe-square.png'
    }
    return macroData
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
export function rollItemMacro (itemName) {
    const speaker = ChatMessage.getSpeaker()
    let actor
    if (speaker.token) actor = game.actors.tokens[speaker.token]
    if (!actor) actor = game.actors.get(speaker.actor)

    // Get matching items
    const items = actor ? actor.items.filter(i => i.name === itemName) : []
    if (items.length > 1) {
        ui.notifications.warn(`Your controlled Actor ${actor.name} has more than one Item with name ${itemName}. The first matched item will be chosen.`)
    } else if (items.length === 0) {
        return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`)
    }
    const item = items[0]

    // Trigger the item roll
    if (item.data.type === 'scroll') {
        return ui.notifications.warn('Scrolls cannot be in the hotbar yet.')
    // TODO return actor.useScroll(item);
    }
    if (item.data.type === 'gear') {
        return ui.notifications.warn('Gear cannot be in the hotbar yet.')
    // TODO return actor.useGear(item);
    }
    return item.roll()
}
/**
 * Get the current actor - for use in macros
 * @return {Promise}
 */
export function getMacroActor () {
    const speaker = ChatMessage.getSpeaker()
    let actor
    if (speaker.token) actor = game.actors.tokens[speaker.token]
    if (!actor) actor = game.actors.get(speaker.actor)
    if (!actor) return ui.notifications.warn('You must select a token to run this macro.')

    // Return the actor if found
    return actor
}

/**
 * Roll a weapon attack from a macro.
 * @param {string} itemId
 * @return {Promise}
 */
export function rollMBWeaponAttackMacro (itemId, options = {}) {
    const speaker = ChatMessage.getSpeaker()
    let actor
    if (speaker.token) actor = game.actors.tokens[speaker.token]
    if (!actor) actor = game.actors.get(speaker.actor)
    if (!actor) return ui.notifications.warn('You must select a token to run this macro.')

    // Trigger the weapon roll
    return actor.rollWeaponAttack(itemId, options)
}
