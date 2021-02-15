import { MB } from '../config.js'

export class HandlebarHelper {
    static register () {
        Handlebars.registerHelper('concat', function () {
            let outStr = ''
            for (const arg in arguments) {
                if (typeof arguments[arg] !== 'object') {
                    outStr += arguments[arg]
                }
            }
            return outStr
        })

        Handlebars.registerHelper('toLowerCase', function (str) {
            return str.toLowerCase()
        })

        Handlebars.registerHelper('firstChar', function (name) {
            return name.charAt(0)
        })

        Handlebars.registerHelper('abilityLabel', function (abilityKey) {
            return game.i18n.localize(CONFIG.MB.abilities[abilityKey])
        })

        Handlebars.registerHelper('scrollLabel', function (scrollKey) {
            return game.i18n.localize(CONFIG.MB.scrollTypes[scrollKey])
        })

        Handlebars.registerHelper('armorDamageReduction', function (tier) {
            return MB.armorTierDamageReduction[tier]
        })

        Handlebars.registerHelper('for', function (from, to, incr, block) {
            let accum = ''
            for (let i = from; i < to; i += incr) { accum += block.fn(i) }
            return accum
        })

        Handlebars.registerHelper('is', function (v1, v2, options) {
            return v1 == v2
        })

        Handlebars.registerHelper('notIs', function (v1, v2, options) {
            return v1 != v2
        })
    }
}
