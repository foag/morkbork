/* eslint-disable no-undef */
// Import Modules
import { MB } from './module/config.js'
import { MorkBorkActor } from './module/actor/actor.js'
import { MorkBorkItem } from './module/item/item.js'
import { rollItemMacro, rollMBWeaponAttackMacro, getMacroActor } from './module/system/macros.js'

import * as initHooks from './module/hooks/init.js'

Hooks.once('init', async function () {
    CONFIG.MB = MB
    CONFIG.debug.hooks = true

    game.morkbork = {
        MorkBorkActor,
        MorkBorkItem,
        rollItemMacro,
        getMacroActor,
        rollMBWeaponAttackMacro
    }

    /**
   * Set an initiative formula for the system
   * @type {String}
   */
    CONFIG.Combat.initiative = {
        formula: '1d6',
        decimals: 2
    }

    // Define custom Entity classes
    CONFIG.Actor.entityClass = MorkBorkActor
    CONFIG.Item.entityClass = MorkBorkItem

    initHooks.default()
})

/* -------------------------------------------- */
/*  Post initialization hook                    */
/* -------------------------------------------- */
Hooks.once('ready', async function () {
    // Register system settings - needs to happen after packs are initialised
    // await registerSystemSettings()
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
})

window.importCompendium = async function (name) {
    const pack = game.packs.find(p => p.collection === `morkbork.${name}`)
    pack.locked = false

    const response = await fetch(`systems/morkbork/compendium/${name}.json`)
    const content = await response.json()
    const items = await Item.create(content, { temporary: true })

    console.log(pack)

    for (const i of items) {
        await pack.importEntity(i)
        console.log(`Imported Item ${i.name} into Compendium classesPack ${pack.collection}`)
    }
}
