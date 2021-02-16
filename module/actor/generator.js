import { MbClassList, MbEntityList, MB } from '../config.js'

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
        let roll = new Roll('@die+@mod', { die, mod })

        roll.roll()
        let result = roll.total

        if (dontAllow !== null && result === dontAllow) {
            while (result === dontAllow) {
                roll = new Roll('@die+@mod', { die, mod })

                roll.roll()
                result = roll.total
            }
        }

        MB.log('ROLL', roll, result)
        return result
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    getOmens (mbClass) {
        const omensDice = mbClass.data.data.baseOmensDice
        const omenRoll = this.roller(omensDice)

        return omenRoll
    }

    /**
     *
     * @param {Array} abilities
     */
    getPowers (abilities) {
        const presence = abilities.presence.value
        const powersRoll = this.roller('1d4', presence)

        return Math.max(0, powersRoll)
    }

    /**
     *
     * @param {MBActorClass} mbClass
     * @param {Array} abilities
     */
    getHitPoints (mbClass, abilities) {
        const startingInfo = mbClass.data.data.startingInfo

        const hitPointRoll = this.roller(startingInfo.startingHitPointDice, abilities[startingInfo.startingHitPointAtt].value)
        const hitPoint = Math.max(1, hitPointRoll)

        MB.log('HIT POINTS', hitPoint, startingInfo.startingHitPointDice, startingInfo.startingHitPointAtt, abilities[startingInfo.startingHitPointAtt].value)

        return {
            value: hitPoint,
            max: hitPoint
        }
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    getSilver (mbClass) {
        const startingInfo = mbClass.data.data.startingInfo

        const silverRoll = this.roller(startingInfo.startingSilverDice)
        const silver = silverRoll * startingInfo.startingSilverMod

        MB.log('Silver', silver, silverRoll, startingInfo.startingSilverMod)
        return silver
    }

    /**
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
            return null
        }

        MB.log('GEAR ITEM', gearItem.data.data.startingEquipment)

        if (gearItem.data.data.startingEquipment.quantity) {
            gearItem.data.data.quantity = gearItem.data.data.startingEquipment.quantity
        }

        if (gearItem.data.data.startingEquipment.modAbility) {
            gearItem.data.data.quantity = gearItem.data.data.quantity + abilities[gearItem.data.data.startingEquipment.modAbility].value
        }

        return gearItem
    }

    /**
     *
     * @param {String} scrollType
     */
    async getScroll (scrollType) {
        const scrollList = await MbEntityList.getEntities('scrolls')
        const scrolls = scrollList.filter(item => item.data.data.scrollType === scrollType)

        const scrollsRoll = this.roller(`1d${scrolls.length}`)

        return scrolls[scrollsRoll - 1]
    }

    /**
     *
     * @param {MBActorClass} mbClass
     * @param {Array} abilities
     */
    async getSuppliesAndGear (mbClass, abilities) {
        const gearList = await MbEntityList.getEntities('gear')
        const gear = gearList.filter(item => item.data.data.startingEquipment)
        const supplyRoll = this.roller('1d4')
        const items = []

        const startingGearRoll1 = this.roller('1d6')
        const startingGear1 = this.getItem(gear, 1, startingGearRoll1, abilities)

        const startingGearRoll2 = this.roller('1d12')
        const startingGear2 = startingGearRoll2 !== 5 ? this.getItem(gear, 2, startingGearRoll2, abilities) : await this.getScroll('unclean')

        const startingGearRoll3 = this.roller('1d12')
        const startingGear3 = startingGearRoll3 !== 2 ? this.getItem(gear, 3, startingGearRoll3, abilities) : await this.getScroll('sacred')

        console.log('startingGear1', startingGearRoll1, startingGear1)
        console.log('startingGear2', startingGearRoll2, startingGear2)
        console.log('startingGear3', startingGearRoll3, startingGear3)

        return [startingGear1, startingGear2, startingGear3]
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    async getWeapon (mbClass) {
        const startingInfo = mbClass.data.data.startingInfo
        const weaponsList = await MbEntityList.getEntities('weapons')
        const weapons = weaponsList.filter(item => item.data.data.startingEquipment)

        const weaponRoll = this.roller(startingInfo.weaponsDice)
        const weapon = this.getItem(weapons, 1, weaponRoll)
        console.log('WEAPONS', weapon, weaponRoll)

        return weapon
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    async getArmor (mbClass) {
        const startingInfo = mbClass.data.data.startingInfo
        const armors = await MbEntityList.getEntities('armor')

        const armorRoll = this.roller(startingInfo.armorDice)
        const armor = armors[armorRoll - 1]
        console.log('ARMOR', armor, armorRoll)

        return armor
    }

    /**
     *
     * @param {MBActorClass} mbClass
     */
    getClassAttributes (mbClass) {
        const startingInfo = mbClass.data.data.startingInfo
        const abilities = []

        for (let i = 1; i <= startingInfo.startingAbilities; i++) {
            const specialtyRoll = this.roller(`1d${startingInfo.abilities.options.length}`)
            const ability = startingInfo.abilities.options[specialtyRoll - 1]

            if (abilities.includes(ability)) {
                i--
            } else {
                abilities.push(ability)
            }
        }

        const originRoll = startingInfo.origins ? this.roller(`1d${startingInfo.origins.options.length}`) : 0
        const origin = startingInfo.origins ? startingInfo.origins.options[originRoll - 1] : []
        const originDescription = startingInfo.origins ? startingInfo.origins.description : ''

        MB.log('ABILITY ROLL', startingInfo.startingAbilities, abilities)
        MB.log('ORIGINS ROLL', origin)

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
        MB.log('CLASS', mbClass.data.name, mbClass)
        const startingInfo = mbClass.data.data.startingInfo

        const strength = this.getAbilityPoint(startingInfo.strMod)
        const agility = this.getAbilityPoint(startingInfo.agiMod)
        const presence = this.getAbilityPoint(startingInfo.preMod)
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

        return { value: parseInt(abilityMap[abilityKey]) }
    }

    /**
     *
     * @param {String} selectedClass
     */
    async getClass (selectedClass = null) {
        const classList = await MbClassList.getClasses(false)

        if (selectedClass) {
            let foundClass = classList.find(item => item.data.name === selectedClass)

            if (!foundClass) {
                foundClass = classList.find(item => item.data.name === 'Classless')
            }

            return foundClass
        }

        const classRoll = this.roller(`1d${classList.length - 1}`)

        return classList[classRoll]
    }

    /**
     * Get name from character library
     */
    async getName () {
        const request = await fetch('systems/morkbork/module/data/character.json')
        const json = await request.json()

        const groupRoll = this.roller('1d6')
        const itemRoll = this.roller('1d8')

        const name = json.names.find(name => name.cell[0] == groupRoll && name.cell[1] == itemRoll)
        console.log(json, name)
        return name.name
    }

    /**
     * Get biography from character library
     */
    async getBiography () {
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

        return biography
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
