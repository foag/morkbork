import { MbClassList, MbEntityList } from '../config.js'

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

export const generateItems = async function () {
    const items = []

    const supplies = await getSuppliesAndGear()
    const weapon = await getWeapon()
    const armor = await getArmor()

    return [...supplies, weapon, armor]
}

function roller (die, mod = 0) {
    // const roll = new Roll('@die', { die: die })
    const roll = new Roll('@die+@mod', { die, mod })

    roll.roll()
    console.log('ROLL', roll.results, roll.total)
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
    console.log('Hit points', startingInfo.startingHitPointDice, abilities[startingInfo.startingHitPointAtt])

    const hitPointRoll = roller(startingInfo.startingHitPointDice, abilities[startingInfo.startingHitPointAtt].value)

    return {
        value: hitPointRoll,
        max: hitPointRoll
    }
}

function getSilver (mbClass) {
    const startingInfo = mbClass.data.data.startingInfo

    const silverRoll = roller(startingInfo.startingSilverDice)
    const silver = silverRoll * startingInfo.startingSilverMod

    console.log('Silver', silver, silverRoll, startingInfo.startingSilverMod)
    return silver
}

async function getSuppliesAndGear () {
    // TODO consider weaponsDice and allow for expansion weapons?
    const gear = await MbEntityList.getEntities('gear')
    const supplyRoll = roller('1d4')

    const supplies = gear.find(gearItem => gearItem._id == 'v9sax820KDDdIkR7')
    supplies.data.data.quantity = supplyRoll

    return [supplies.data]
}

async function getWeapon () {
    // TODO consider weaponsDice and allow for expansion weapons?
    const weapons = await MbEntityList.getEntities('weapons')
    const weaponRoll = roller(`1d${weapons.length}`)
    const weapon = weapons[weaponRoll - 1].data
    console.log('WEAPONS', weapon, weaponRoll)

    return weapon
}

async function getArmor () {
    // TODO consider weaponsDice and allow for expansion weapons?
    const armors = await MbEntityList.getEntities('armor')
    const armorRoll = roller('1d4')
    const armor = armors[armorRoll - 1].data
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

    console.log('ABILITY ROLL', startingInfo.startingAbilities, abilities)
    console.log('ORIGINS ROLL', origin)

    return {
        abilities,
        name: mbClass.data.name,
        origins: [origin]
    }
}

async function getAbilities (mbClass) {
    console.log('CLASS', mbClass.data.name, mbClass)
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
