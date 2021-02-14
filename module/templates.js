/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    // Define template paths to load
    const templatePaths = [

        // Actor Sheet Partials
        'systems/morkbork/templates/actor/parts/actor-encumbrance.html',
        'systems/morkbork/templates/actor/parts/item-armor.html',
        'systems/morkbork/templates/actor/parts/item-controls.html',
        // Item Sheet Partials
        'systems/morkbork/templates/item/parts/item-header.html',
        'systems/morkbork/templates/item/parts/item-description.html',
        'systems/morkbork/templates/item/parts/item-consumable.html',
        'systems/morkbork/templates/item/parts/item-light.html'
    ]

    // Load the template parts
    return loadTemplates(templatePaths)
}
