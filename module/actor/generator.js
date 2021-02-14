import { MbClassList, MbEntityList, MB } from '../config.js'

export const generateCharacter = async function () {
    const name = await getName()

    // Get class
    const mbClass = await getClass()

    // Set abilities from class
    const abilities = await getAbilities(mbClass)
    const classAttributes = getClassAttributes(mbClass)

    const hitPoints = getHitPoints(mbClass, abilities)
    const silver = getSilver(mbClass)

    const omens = getOmens(mbClass)
    const powers = getPowers(abilities)

    return {
        name: name,
        data: {
            abilities,
            omens: {
                value: omens,
                max: omens
            },
            powers: {
                value: powers,
                max: powers
            },
            class: classAttributes,
            health: hitPoints,
            currency: {
                sp: silver
            }
        }
    }
}

export const generateItems = async function (baseData) {
    const mbClass = baseData.data.class.mbClass
    const abilities = baseData.data.abilities
    const items = []

    const supplies = await getSuppliesAndGear(mbClass, abilities)
    const weapon = await getWeapon(mbClass, abilities)
    const armor = await getArmor(mbClass, abilities)

    return [...supplies, weapon, armor].filter(item => item !== null)
}

function roller (die, mod = 0) {
    // const roll = new Roll('@die', { die: die })
    const roll = new Roll('@die+@mod', { die, mod })

    roll.roll()
    MB.log('ROLL', roll.results, roll.total)
    return roll.total
}

function getOmens (mbClass) {
    const omensDice = mbClass.data.data.baseOmensDice
    const omenRoll = roller(omensDice)

    return omenRoll
}

function getPowers (abilities) {
    const presence = abilities.presence.value
    const powersRoll = roller('1d4', presence)

    return Math.max(0, powersRoll)
}

function getHitPoints (mbClass, abilities) {
    const startingInfo = mbClass.data.data.startingInfo

    const hitPointRoll = roller(startingInfo.startingHitPointDice, abilities[startingInfo.startingHitPointAtt].value)
    const hitPoint = Math.max(1, hitPointRoll)

    MB.log('HIT POINTS', hitPoint, startingInfo.startingHitPointDice, startingInfo.startingHitPointAtt, abilities[startingInfo.startingHitPointAtt].value)

    return {
        value: hitPoint,
        max: hitPoint
    }
}

function getSilver (mbClass) {
    const startingInfo = mbClass.data.data.startingInfo

    const silverRoll = roller(startingInfo.startingSilverDice)
    const silver = silverRoll * startingInfo.startingSilverMod

    MB.log('Silver', silver, silverRoll, startingInfo.startingSilverMod)
    return silver
}

function getItem (list, group, order, abilities) {
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

async function getScroll (scrollType) {
    const scrollList = await MbEntityList.getEntities('scrolls')
    const scrolls = scrollList.filter(item => item.data.data.scrollType === scrollType)

    const scrollsRoll = roller(`1d${scrolls.length}`)

    return scrolls[scrollsRoll - 1]
}

async function getSuppliesAndGear (mbClass, abilities) {
    const gearList = await MbEntityList.getEntities('gear')
    const gear = gearList.filter(item => item.data.data.startingEquipment)
    const supplyRoll = roller('1d4')
    const items = []

    const startingGearRoll1 = roller('1d6')
    const startingGear1 = getItem(gear, 1, startingGearRoll1, abilities)

    const startingGearRoll2 = roller('1d12')
    const startingGear2 = startingGearRoll2 !== 5 ? getItem(gear, 2, startingGearRoll2, abilities) : await getScroll('unclean')

    const startingGearRoll3 = roller('1d12')
    const startingGear3 = startingGearRoll3 !== 2 ? getItem(gear, 3, startingGearRoll3, abilities) : await getScroll('sacred')

    console.log('startingGear1', startingGearRoll1, startingGear1)
    console.log('startingGear2', startingGearRoll2, startingGear2)
    console.log('startingGear3', startingGearRoll3, startingGear3)

    return [startingGear1, startingGear2, startingGear3]
}

async function getWeapon (mbClass) {
    const startingInfo = mbClass.data.data.startingInfo
    const weaponsList = await MbEntityList.getEntities('weapons')
    const weapons = weaponsList.filter(item => item.data.data.startingEquipment)

    const weaponRoll = roller(startingInfo.weaponsDice)
    const weapon = getItem(weapons, 1, weaponRoll)
    console.log('WEAPONS', weapon, weaponRoll)

    return weapon
}

async function getArmor (mbClass) {
    const startingInfo = mbClass.data.data.startingInfo
    const armors = await MbEntityList.getEntities('armor')

    const armorRoll = roller(startingInfo.armorDice)
    const armor = armors[armorRoll - 1]
    console.log('ARMOR', armor, armorRoll)

    return armor
}

function getClassAttributes (mbClass) {
    const startingInfo = mbClass.data.data.startingInfo
    const abilities = []

    for (let i = 1; i <= startingInfo.startingAbilities; i++) {
        const specialtyRoll = roller(`1d${startingInfo.abilities.options.length}`)
        const ability = startingInfo.abilities.options[specialtyRoll - 1]

        if (abilities.includes(ability)) {
            i--
        } else {
            abilities.push(ability)
        }
    }

    const originRoll = startingInfo.origins ? roller(`1d${startingInfo.origins.options.length}`) : 0
    const origin = startingInfo.origins ? startingInfo.origins.options[originRoll - 1] : []

    MB.log('ABILITY ROLL', startingInfo.startingAbilities, abilities)
    MB.log('ORIGINS ROLL', origin)

    return {
        abilities,
        name: mbClass.data.name,
        origins: [origin],
        mbClass
    }
}

async function getAbilities (mbClass) {
    MB.log('CLASS', mbClass.data.name, mbClass)
    const startingInfo = mbClass.data.data.startingInfo

    const strength = getAbilityPoint(startingInfo.strMod)
    const agility = getAbilityPoint(startingInfo.agiMod)
    const presence = getAbilityPoint(startingInfo.preMod)
    const toughness = getAbilityPoint(startingInfo.touMod)

    return {
        strength,
        agility,
        presence,
        toughness
    }
}

function getAbilityPoint (modifier) {
    const abilityRoll = roller('3d6', modifier)

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

async function getClass () {
    const classList = await MbClassList.getClasses(false)
    const classRoll = roller(`1d${classList.length - 1}`)

    return classList[classRoll]
}

async function getName () {
    const request = await fetch('systems/morkbork/module/actor/names.json')
    const names = await request.json()

    const groupRoll = roller('1d6')
    const itemRoll = roller('1d8')

    return names[groupRoll][itemRoll]
}

window.generateCharacter = generateCharacter
window.generateItems = generateItems

window.mockCharacter = async function () {
    const data = await generateCharacter()
    const items = await generateItems(data)

    data.items = items

    console.log(data, items)
}
