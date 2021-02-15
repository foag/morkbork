import { createMorkBorkMacro } from '../system/macros.js'

export default function () {
    // Create a macro when a rollable is dropped on the hotbar
    Hooks.on('hotbarDrop', (bar, data, slot) => createMorkBorkMacro(data, slot))
}
