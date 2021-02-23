import { MbClassList, MbEntityList, MB } from '../config.js'
import '../lib/fontfaceobserver.js'

export class ActorGenerator {
    constructor () {
        this.rollLog = []
        this.generatedData = {}
    }

    /**
     * Generate a new character according to MÖRK BORG rulesets
     * Allows preselected class, and to decide if a new name should be rolled or not.
     *
     * @param {String} selectedClass
     * @param {Boolean} rollForName
     */
    async character (selectedClass, rollForName) {
        const data = {
            data: {}
        }

        const mbClass = await this.getClass(selectedClass)
        const abilities = await this.getAbilities(mbClass)
        const powers = this.getPowers(abilities)
        const omens = this.getOmens(mbClass)

        if (rollForName) {
            data.name = await this.getName()
        }

        data.data.biography = await this.getBiography()
        data.data.abilities = abilities
        data.data.class = this.getClassAttributes(mbClass)

        data.data.health = this.getHitPoints(mbClass, abilities)
        data.data['currency.sp'] = this.getSilver(mbClass)

        data.data.omens = {
            value: omens,
            max: omens
        }

        data.data.powers = {
            value: powers,
            max: powers
        }

        this.generatedData = data

        return data
    }

    /**
     * Generate a full set of Items according to class/general rules in MÖRK BORG
     *
     * @param Object baseData
     */
    async items (baseData) {
        const mbClass = baseData.data.class.mbClass
        const abilities = baseData.data.abilities

        const supplies = await this.getSuppliesAndGear(mbClass, abilities)
        const weapon = await this.getWeapon(mbClass, abilities)
        const armor = await this.getArmor(mbClass, abilities)

        return [...supplies, weapon, armor].filter(item => item !== null)
    }

    async levelUp (actorData) {
        const data = {}
        const items = []

        // Mer TP:
        // Slå 6t10 och nå över
        // eller lika med nuvarande
        // TP-max. Om du lyckas
        // ökar TP-max med t6 TP.
        this.log('Slå 6t10 och nå över eller lika med nuvarande TP-max. Om du lyckas ökar TP-max med t6 TP.')
        const hitpointsRoll = this.roller('6d10')
        this.log()

        if (hitpointsRoll > actorData.data.health.max) {
            this.log('Du lyckas och ökar TP-max med:')

            const newMaxRoll = this.roller('1d6')
            data['data.health.max'] = actorData.data.health.max + newMaxRoll
            data['data.health.value'] = data['data.health.max']

            this.log('RESULT', `Ny TP-max: ${data['data.health.max']}`)
        }

        // Bland bratet hittar du:
        // 0-3 ingenting
        // 4 3t10 silver
        // 5 en smutsig pergamentrulle
        // 6 en ren pergamentrulle
        this.log('Bland bråtet hittar du:')
        const richesRoll = this.roller('1d6')

        if (richesRoll < 4) {
            this.log('RESULT', 'Ingenting')
        }

        if (richesRoll === 4) {
            data['data.currency.sp'] = parseInt(actorData.data.currency.sp) + this.roller('3d10')
            this.log('RESULT', `${this.roller('3d10')} silver`)
        }

        if (richesRoll === 5) {
            const scroll = await this.getScroll('unclean', false)
            items.push(scroll)

            this.log('RESULT', scroll.data.name)
        }

        if (richesRoll === 6) {
            const scroll = await this.getScroll('sacred', false)
            items.push(scroll)

            this.log('RESULT', scroll.data.name)
        }

        // Forandrade egenskaper:
        // Slå t6 mot varje egenskaps
        // värde. Resultat lika med eller
        // över värdet höjer egenskapen
        // +1 till max +6. Resultat under
        // värdet sänker -1.
        // Egenskaper från −3 till +1 höjs därmed alltid med +1. Undantaget är om en etta slås med t6.
        // Då sänks istället egenskapens värde med -1, men aldrig lägre än till –3.

        this.log('Slå t6 mot varje egenskaps värde. Resultat lika med eller över värdet höjer egenskapen +1 till max +6. Resultat under värdet sänker -1.')
        this.log()
        const abilities = actorData.data.abilities

        Object.keys(abilities).forEach(ability => {
            const abilityRoll = this.roller('1d6')

            if (abilityRoll >= abilities[ability].value) {
                data[`data.abilities.${ability}.value`] = Math.min(abilities[ability].value + 1, abilities[ability].max)

                this.log(ability, `ökar med +1 till ${data[`data.abilities.${ability}.value`]}`)
            } else {
                data[`data.abilities.${ability}.value`] = Math.max(abilities[ability].value - 1, abilities[ability].min)

                this.log(ability, `minskar med -1 till ${data[`data.abilities.${ability}.value`]}`)
            }
        })

        return { data, items }
    }

    /**
     * Simple convenience wrapper around Roll Class. Takes Die and Mod as primary arguments,
     * also allows for exclusion of values (dontAllow) which forces rerolls until a different value is met.
     * Potentially life threatening for CPU fans if used with 1d1.
     *
     * @param {String} die
     * @param {String} mod
     * @param {Number} dontAllow
     */
    roller (die, mod = 0, dontAllow = null) {
        let roll

        if (mod) {
            roll = new Roll('@die+@mod', { die, mod })
        } else {
            roll = new Roll('@die', { die })
        }

        roll.roll()
        let result = roll.total

        if (dontAllow !== null && result === dontAllow) {
            while (result === dontAllow) {
                roll = new Roll('@die+@mod', { die, mod })

                roll.roll()
                result = roll.total
            }
        }

        this.log('ROLL', result, roll)
        return result
    }

    log (name = '', description = '', roll = null) {
        this.rollLog.push({
            name,
            description,
            roll
        })
    }

    /**
     * Get class from selection or roll 1d@{classList.length}
     *
     * @param {String} selectedClass
     */
    async getClass (selectedClass = null) {
        const classList = await MbClassList.getClasses(false)
        this.log('GETCLASS', `${selectedClass || 'Ingen/slumpad'} vald.`)

        if (selectedClass) {
            let foundClass = classList.find(item => item.data.name === selectedClass)

            if (!foundClass) {
                foundClass = classList.find(item => item.data.name === 'Classless')
            }

            return foundClass
        }

        const classRoll = this.roller(`1d${classList.length - 1}`)

        this.log('RESULT', `${classList[classRoll].data.name} slagen.`)

        return classList[classRoll]
    }

    /**
     *  Roll starting Omens MÖRK BORG s.38
     *
     * @param {MBActorClass} mbClass
     */
    getOmens (mbClass) {
        this.log('GETOMENS')

        const omensDice = mbClass.data.data.baseOmensDice
        const omenRoll = this.roller(omensDice)

        this.log('RESULT', omenRoll)

        return omenRoll
    }

    /**
     * Roll starting abilities MÖRK BORG s.34
     *
     * @param {Array} abilities
     */
    getPowers (abilities) {
        this.log('GETABILITIES')
        const presence = abilities.presence.value
        const powersRoll = this.roller('1d4', presence)

        const powers = Math.max(0, powersRoll)

        this.log('RESULT', powers)

        return powers
    }

    /**
     *  Roll starting hit points MÖRK BORG s.28
     *
     * @param {MBActorClass} mbClass
     * @param {Array} abilities
     */
    getHitPoints (mbClass, abilities) {
        this.log('GETHITPOINTS')
        const startingInfo = mbClass.data.data.startingInfo

        const hitPointRoll = this.roller(startingInfo.startingHitPointDice, abilities[startingInfo.startingHitPointAtt].value)
        const hitPoint = Math.max(1, hitPointRoll)

        this.log('RESULT', hitPoint)

        return {
            value: hitPoint,
            max: hitPoint
        }
    }

    /**
     * Roll starting silver MÖRK BORG s.18
     *
     * @param {MBActorClass} mbClass
     */
    getSilver (mbClass) {
        this.log('GETSILVER')
        const startingInfo = mbClass.data.data.startingInfo

        const silverRoll = this.roller(startingInfo.startingSilverDice)
        const silver = silverRoll * startingInfo.startingSilverMod

        this.log('RESULT', silver)

        return silver
    }

    /**
     * Get item from collection
     *
     * @param {Collection} list
     * @param {Number} group
     * @param {Number} order
     * @param {Array} abilities
     */
    getItem (list, group, order, abilities) {
        const gearItem = list.find(item => item.data.data.startingEquipment.group === group && item.data.data.startingEquipment.order === order)

        if (!gearItem) {
            MB.log(group, order)
            this.log('RESULT', 'Inget')
            return null
        }

        if (gearItem.data.data.startingEquipment.quantity) {
            gearItem.data.data.quantity = gearItem.data.data.startingEquipment.quantity
        }

        if (gearItem.data.data.startingEquipment.modAbility) {
            gearItem.data.data.quantity = gearItem.data.data.quantity + abilities[gearItem.data.data.startingEquipment.modAbility].value
        }

        this.log('RESULT', gearItem.data.name)

        return gearItem
    }

    /**
     * Get random scroll of type
     *
     * @param {String} scrollType
     */
    async getScroll (scrollType, log = true) {
        if (log) this.log('GETSCROLL', scrollType)

        const scrollList = await MbEntityList.getEntities('scrolls')
        const scrolls = scrollList.filter(item => item.data.data.scrollType === scrollType)

        const scrollsRoll = this.roller(`1d${scrolls.length}`)
        const scroll = scrolls[scrollsRoll - 1]

        if (log) this.log('RESULT', scroll)

        return scroll
    }

    /**
     * Roll starting equipment MÖRK BORG s.19
     *
     * @param {MBActorClass} mbClass
     * @param {Array} abilities
     */
    async getSuppliesAndGear (mbClass, abilities) {
        const gearList = await MbEntityList.getEntities('gear')
        const gear = gearList.filter(item => item.data.data.startingEquipment)
        const supplyRoll = this.roller('1d4')
        const items = []
        // TODO STARTING SUPPLIES

        this.log('GETSTARTINGGEAR', 't6')
        const startingGearRoll1 = this.roller('1d6')
        const startingGear1 = this.getItem(gear, 1, startingGearRoll1, abilities)

        this.log('GETSTARTINGGEAR', 't12')
        const startingGearRoll2 = this.roller('1d12')
        const startingGear2 = startingGearRoll2 !== 5 ? this.getItem(gear, 2, startingGearRoll2, abilities) : await this.getScroll('unclean')

        this.log('GETSTARTINGGEAR', 't12')
        const startingGearRoll3 = this.roller('1d12')
        const startingGear3 = startingGearRoll3 !== 2 ? this.getItem(gear, 3, startingGearRoll3, abilities) : await this.getScroll('sacred')

        return [startingGear1, startingGear2, startingGear3]
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    async getWeapon (mbClass) {
        this.log('GETWEAPON')

        const startingInfo = mbClass.data.data.startingInfo
        const weaponsList = await MbEntityList.getEntities('weapons')
        const weapons = weaponsList.filter(item => item.data.data.startingEquipment)

        const weaponRoll = this.roller(startingInfo.weaponsDice)
        const weapon = this.getItem(weapons, 1, weaponRoll)

        return weapon
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    async getArmor (mbClass) {
        // TODO kontrollera tärningsslagen
        this.log('GETARMOR')
        const startingInfo = mbClass.data.data.startingInfo
        const armors = await MbEntityList.getEntities('armor')

        const armorRoll = this.roller(startingInfo.armorDice)
        const armor = armors[armorRoll - 1]

        this.log('RESULT', armor.data.name)

        return armor
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    getClassAttributes (mbClass) {
        const startingInfo = mbClass.data.data.startingInfo
        const abilities = []

        this.log('GETCLASSATTRIBUTES')
        for (let i = 1; i <= startingInfo.startingAbilities; i++) {
            const specialtyRoll = this.roller(`1d${startingInfo.abilities.options.length}`)
            const ability = startingInfo.abilities.options[specialtyRoll - 1]

            if (abilities.includes(ability)) {
                i--
                this.log('RESULT', 'Attribut fanns redan, slår om.')
            } else {
                abilities.push(ability)
                this.log('RESULT', ability)
            }
        }

        this.log('GETCLASSORIGINS')
        const originRoll = startingInfo.origins ? this.roller(`1d${startingInfo.origins.options.length}`) : 0
        const origin = startingInfo.origins ? startingInfo.origins.options[originRoll - 1] : []
        const originDescription = startingInfo.origins ? startingInfo.origins.description : ''

        this.log('RESULT', `${origin} ${originDescription}`)

        return {
            abilities,
            name: mbClass.data.name,
            origins: [originDescription, origin].filter(item => item),
            mbClass
        }
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    async getAbilities (mbClass) {
        const startingInfo = mbClass.data.data.startingInfo

        this.log('GETSTRENGTH')
        const strength = this.getAbilityPoint(startingInfo.strMod)
        this.log('GETAGILITY')
        const agility = this.getAbilityPoint(startingInfo.agiMod)
        this.log('GETPRESENCE')
        const presence = this.getAbilityPoint(startingInfo.preMod)
        this.log('GETTOUGHNESS')
        const toughness = this.getAbilityPoint(startingInfo.touMod)

        return {
            strength,
            agility,
            presence,
            toughness
        }
    }

    /**
     *
     * @param {Number} modifier
     */
    getAbilityPoint (modifier) {
        const abilityRoll = this.roller('3d6', modifier)

        const abilityMap = {
            4: '-3',
            6: '-2',
            8: '-1',
            12: '0',
            14: '1',
            16: '2',
            20: '3'
        }

        const abilityKey = Object.keys(abilityMap).find(max => abilityRoll <= max)

        this.log('RESULT', abilityMap[abilityKey])

        return { value: parseInt(abilityMap[abilityKey]) }
    }

    /**
     * Get name from character library
     */
    async getName () {
        this.log('GETNAME')

        const request = await fetch('systems/morkbork/module/data/character.json')
        const json = await request.json()

        const groupRoll = this.roller('1d6')
        const itemRoll = this.roller('1d8')

        const name = json.names.find(name => name.cell[0] == groupRoll && name.cell[1] == itemRoll)

        this.log('RESULT', name.name)

        return name.name
    }

    /**
     * Get biography from character library
     */
    async getBiography () {
        this.log('GETBIO')
        const request = await fetch('systems/morkbork/module/data/character.json')
        const json = await request.json()

        const traits = json.traits
        const bodies = json.bodies
        const habits = json.habits

        const traitsRoll1 = this.roller('1d20')
        const traitsRoll2 = this.roller('1d20', '', traitsRoll1)

        const bodyRoll = this.roller('1d20')
        const habitRoll = this.roller('1d20')

        const biography = `${traits[traitsRoll1 - 1]} och ${traits[traitsRoll2 - 1].toLowerCase()}. ${bodies[bodyRoll - 1]} ${habits[habitRoll - 1]}`

        this.log('RESULT', biography)

        return biography
    }

    getHtml () {
        const htmlLines = []

        this.rollLog.forEach(log => {
            if (log.name === '') {
                htmlLines.push('<br>')
            } else if (!log.roll) {
                if (log.name !== 'RESULT') {
                    htmlLines.push(`<small class="text-xs font-bold">${log.name} ${log.description || ''}</small><br>`)
                } else {
                    htmlLines.push(`Resultat: ${log.description || ''}<br><br>`)
                }
            } else {
                const roll = log.roll
                htmlLines.push(`Slog <pre class="inline-block font-bold text-xs text-white bg-black px-1">${roll._formula}</pre> fick ${roll.results.join('')} (${roll.total})<br>`)
            }
        })

        const html = `<div class="pb-4">${htmlLines.join('')}</div>`

        return html
    }

    showRollLogDialog () {
        const d = new Dialog({
            title: 'Resultat',
            content: this.getHtml(),
            default: 'one',
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Ok'
                }
            }
        })
        d.render(true)
    }
}

/*
window.generateCharacter = generateCharacter
window.generateItems = generateItems
*/
window.mockCharacter = async function () {
    let data = {
        items: []
    }

    const creationData = { class: null, name: false }
    const generator = new ActorGenerator()

    const characterData = await generator.character(creationData.class, creationData.name)
    data = mergeObject(data, characterData)

    const characterItems = await generator.items(data)
    data.items = characterItems

    console.log(generator)
}
