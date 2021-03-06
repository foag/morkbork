/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MorkBorkItemSheet extends ItemSheet {
    constructor (item, options) {
        super(item, options)
        this.options.classes = [...this.options.classes, item.type] // append some custom classes
    }

    /** @override */
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            classes: ['morkbork', 'sheet', 'item'],
            width: 590,
            height: 480,
            tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }]
        })
    }

    /** @override */
    get template () {
        const path = 'systems/morkbork/templates/item'
        return `${path}/${this.item.data.type}-sheet.html`
    }

    /* -------------------------------------------- */

    /** @override */
    getData () {
        const data = super.getData()

        // Include CONFIG values
        data.config = CONFIG.MB

        data.itemType = data.item.type.titleCase()

        if (data.item.type === 'weapon') {
            data.damageType = CONFIG.MB.damageTypes[data.item.data.damageType]
            data.rangeType = CONFIG.MB.rangeTypes[data.item.data.rangeType]
            data.rangeDistance = CONFIG.MB.distanceUnits[data.item.data.rangeDistance]
        }

        if (data.item.type === 'scroll') {
            data.scrollType = CONFIG.MB.scrollTypes[data.item.data.scrollType]
        }

        console.log(data)

        return data
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition (options = {}) {
        const position = super.setPosition(options)
        const sheetBody = this.element.find('.sheet-body')
        const bodyHeight = position.height - 192
        sheetBody.css('height', bodyHeight)
        return position
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners (html) {
        super.activateListeners(html)

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return

    // Roll handlers, click handlers, etc. would go here.
    }
}
