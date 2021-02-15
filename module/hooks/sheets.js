import { MorkBorkActorSheet } from '../actor/actor-sheet.js'
import { MorkBorkItemSheet } from '../item/item-sheet.js'

export class SheetsHelper {
    static register () {
        // Register sheet application classes
        Actors.unregisterSheet('core', ActorSheet)
        Actors.registerSheet('morkbork', MorkBorkActorSheet, { makeDefault: true })
        Items.unregisterSheet('core', ItemSheet)
        Items.registerSheet('morkbork', MorkBorkItemSheet, { makeDefault: true })
    }
}
