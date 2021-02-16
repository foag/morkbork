import { MbClassList } from '../config.js'
import { objValueFromPath } from '../utils/utils.js'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MorkBorkActorSheet extends ActorSheet {
    /** @override */
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            classes: ['morkbork', 'sheet', 'actor'],
            width: 900,
            height: 620,
            tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'main' }]
        })
    }

    /* -------------------------------------------- */

    /** @override */
    get template () {
        const path = 'systems/morkbork/templates/actor'
        return `${path}/${this.actor.data.type}-sheet.html`
    }

    /* -------------------------------------------- */

    /** @override */
    async getData () {
        const data = super.getData()
        const dataActor = data.actor

        data.dtypes = ['String', 'Number', 'Boolean']

        // Include CONFIG values
        data.config = CONFIG.MB

        // Prepare items.
        if (this.actor.data.type == 'character') {
            dataActor.classNameList = await MbClassList.getClasses(true)
            dataActor.classObjectList = await MbClassList.getClasses(false)

            this._prepareCharacterItems(data)
        } else if (this.actor.data.type == 'npc') {
            this._prepareNpcItems(data)
        }

        return data
    }

    /**
   * Organize and classify Items for NPC sheets.
   * TODO: this can probably be deleted, MB is simple enough that we can use the same sheet for Npcs and PCs
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
    _prepareNpcItems (data) {
        const dataActor = data.actor

        // Initialize containers.
        const features = []
        const carriables = []
        const gears = []
        const weapons = []
        const armors = []
        const scrolls = {
            unclean: [],
            sacred: [],
            unknown: []
        }

        // Iterate through items, allocating to containers
        for (const i of data.items) {
            const item = i.data
            i.img = i.img || DEFAULT_TOKEN

            if (i.type !== 'feature') {
                // Push all to carriables except features
                carriables.push(i)
            }

            // Append to weapons.
            if (i.type === 'weapon') {
                weapons.push(i)
            }

            // Append to armors.
            else if (i.type === 'armor') {
                armors.push(i)
            }

            // Append to scrolls.
            else if (i.type === 'scroll') {
                // scrolls.push(i);
                switch (item.scrollType) {
                case 'unclean':
                    scrolls[item.scrollType].push(i)
                    break
                case 'sacred':
                    scrolls[item.scrollType].push(i)
                    break
                default:
                    scrolls.unknown.push(i)
                    break
                }
            }

            // Append to gear list.
            else if (i.type === 'gear') {
                gears.push(i)
            }
            // Append to features list.
            else if (i.type === 'feature') {
                features.push(i)
            }
        }

        dataActor.features = features
        dataActor.gears = gears
        dataActor.weapons = weapons
        dataActor.armors = armors
        dataActor.scrolls = scrolls
        dataActor.carriables = carriables
    }

    /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
    _prepareCharacterItems (data) {
        const dataActor = data.actor
        const dataData = data.data

        this._processClass(data)

        // Initialize containers.
        const features = []
        const carriables = []
        const gears = []
        const weapons = []
        const armors = []
        const scrolls = {
            unclean: [],
            sacred: [],
            unknown: []
        }

        const sacks = 0
        let stones = 0
        const soaps = 0

        // Iterate through items, allocating to containers
        for (const i of data.items) {
            const item = i.data
            i.img = i.img || DEFAULT_TOKEN

            if (i.type !== 'feature') {
                carriables.push(i)
                // sacks += item.encumbrance.sacks
                // stones += item.encumbrance.stones
                // soaps += item.encumbrance.soaps
            }

            // Append to features
            if (i.type === 'feature') {
                features.push(i)
            }

            // Append to weapons.
            if (i.type === 'weapon') {
                weapons.push(i)
            }

            // Append to armors.
            else if (i.type === 'armor') {
                armors.push(i)
            }

            // Append to scrolls.
            else if (i.type === 'scroll') {
                // scrolls.push(i);
                switch (item.scrollType) {
                case 'unclean':
                    scrolls[item.scrollType].push(i)
                    break
                case 'sacred':
                    scrolls[item.scrollType].push(i)
                    break
                default:
                    scrolls.unknown.push(i)
                    break
                }
            }

            // Append to gear list.
            else if (i.type === 'gear') {
                gears.push(i)
            }
        }

        const totalSoaps = soaps % 100
        stones += Math.floor(soaps / 100)
        const totalStones = stones % 10
        const totalSacks = sacks + Math.floor(stones / 10)

        let invSlotsUsed = stones + (sacks * 10)

        if (totalSoaps > 1) {
            invSlotsUsed++
        }

        // Assign and return
        dataData.inventorySlots.value = invSlotsUsed
        dataData.encumbrance.soaps = totalSoaps
        dataData.encumbrance.stones = totalStones
        dataData.encumbrance.sacks = totalSacks
        dataActor.encumbered = invSlotsUsed > 10
        dataActor.overEncumbered = invSlotsUsed > 20
        dataActor.features = features
        dataActor.gears = gears
        dataActor.weapons = weapons
        dataActor.armors = armors
        dataActor.scrolls = scrolls
        dataActor.carriables = carriables
    }

    _processClass (data) {
        const dataActor = data.actor
        const dataData = data.data

        const classObj = dataActor.classObjectList.find(classObject => classObject.name === dataData.class.name)
        dataActor.classObj = classObj ? classObj.data : {}

        // if (confirm('hepp')) {
        //     console.log('will set actor data to ', dataActor, classObj)
        // }
    }

    /** @override */
    activateListeners (html) {
        super.activateListeners(html)

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this))

        // Allow increase/decrease for values
        html.find('.increase, .decrease').click(this._onIncreaseDecrease.bind(this))

        // Upgrade/downgrade armor tier from buttons
        html.find('.armor-tier').click(this._onSetArmorTier.bind(this))

        // Re-roll daily abilities armor tier from buttons
        html.find('.reroll-omens').click(this._onReRollOmens.bind(this))
        html.find('.reroll-powers').click(this._onReRollPowers.bind(this))

        // Generate character data
        html.find('.generate-character-btn').click(this._onGenerateCharacter.bind(this))

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents('.item')
            const item = this.actor.getOwnedItem(li.data('itemId'))
            item.sheet.render(true)
        })

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents('.item')
            this.actor.deleteOwnedItem(li.data('itemId'))
            li.slideUp(200, () => this.render(false))
        })

        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this))

        // Item summaries
        html.find('.item .item-name h4').click(event => this._onItemSummary(event))

        // Item Rolling
        html.find('.item .action').click(event => this._onItemRoll(event))

        // Drag events for macros.
        if (this.actor.owner) {
            const handler = ev => this._onDragStart(ev)
            // Find all items on the character sheet.
            html.find('li.item').each((i, li) => {
                // Ignore for the header row.
                if (li.classList.contains('item-header')) return
                // Add draggable attribute and dragstart listener.
                li.setAttribute('draggable', true)
                li.addEventListener('dragstart', handler, false)
            })
            // Ability Checks
            html.find('.ability-name').click(this._onRollAbilityCheck.bind(this))
            html.find('li.ability').each((i, li) => {
                // Add draggable attribute and dragstart listener.
                li.setAttribute('draggable', true)
                li.addEventListener('dragstart', handler, false)
            })
        }
    }

    _onIncreaseDecrease (event) {
        event.preventDefault()

        const data = {}
        const target = event.currentTarget
        const updatePath = target.dataset.value
        const value = target.classList.contains('increase') ? 1 : -1

        const updateObj = objValueFromPath(this.actor.data, updatePath)

        if (updateObj.max !== undefined) {
            // Target has max/min/value structure
            const newValue = updateObj.value + value
            if (value > 0) {
                data[updatePath + '.value'] = Math.min(updateObj.max, newValue)
            } else {
                data[updatePath + '.value'] = Math.max(updateObj.min, newValue)
            }
            console.log('IncDec Object', updateObj, updatePath, value, data)
        } else {
            // Target is a basic Number
            data[updatePath] = updateObj + value
            console.log('IncDec Number', updateObj, updatePath, value, updateObj + value)
        }

        this.actor.update(data)
    }

    _onGenerateCharacter (event) {
        this.actor.generate()
    }

    async _onSetArmorTier (event) {
        event.preventDefault()
        const armor = $(event.currentTarget).parent()[0]
        const tier = event.currentTarget.dataset.tier

        const item = this.actor.items.get(armor.dataset.itemId)

        await item.update({
            'data.tier.value': tier
        })
    }

    _onReRollOmens (event) {
        Dialog.confirm({
            title: 'Slå om Järtecken',
            content: `Detta slår <strong>${this.actor.data.data.class.mbClass.data.data.baseOmensDice}</strong> för nytt antal Järtecken och återställer förbrukade Järtecken.`,
            yes: () => {
                const omensRoll = new Roll(this.actor.data.data.class.mbClass.data.data.baseOmensDice).roll()

                this.actor.update({
                    'data.omens.max': omensRoll.total,
                    'data.omens.value': omensRoll.total
                })
            },
            no: () => null,
            defaultYes: false
        })
    }

    _onReRollPowers (event) {
        Dialog.confirm({
            title: 'Slå om Krafter',
            content: `Detta slår <strong>1d4 + NÄRVARO (${this.actor.data.data.abilities.presence.value}) </strong> för nytt antal Krafter och återställer förbrukade Krafter.`,
            yes: () => {
                const powersRoll = new Roll('1d4 + @presence', { presence: this.actor.data.data.abilities.presence.value }).roll()

                this.actor.update({
                    'data.powers.max': powersRoll.total,
                    'data.powers.value': powersRoll.total
                })
            },
            no: () => null,
            defaultYes: false
        })
    }

    /* -------------------------------------------- */
    /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
    _onItemCreate (event) {
        event.preventDefault()
        const header = event.currentTarget
        // Get the type of item to create.
        const type = header.dataset.type
        // Grab any data associated with this control.
        const data = duplicate(header.dataset)
        // Initialize a default name.
        const name = `New ${type.capitalize()}`
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        }
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data.type

        // Finally, create the item!
        return this.actor.createOwnedItem(itemData)
    }

    /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
    _onRoll (event) {
        event.preventDefault()
        const element = event.currentTarget
        const dataset = element.dataset

        if (dataset.roll) {
            const roll = new Roll(dataset.roll, this.actor.data.data)
            const label = dataset.label ? `Rolling ${dataset.label}` : ''
            roll.roll().toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            })
        }
    }

    /**
   * Handle expand/collapse of an item on the character sheet
   * @private
   */
    _onItemSummary (event) {
        event.preventDefault()
        const li = $(event.currentTarget).parents('.item')
        const item = this.actor.getOwnedItem(li.data('item-id'))
        // chatData = item.getChatData({secrets: this.actor.owner});

        // Toggle summary
        if (li.hasClass('expanded')) {
            const summary = li.children('.item-summary')
            summary.slideUp(200, () => summary.remove())
        } else {
            const div = $(`<div class="item-summary">${item.data.data.description}</div>`)
            const props = $('<div class="item-properties"></div>')

            if (item.data.type !== 'feature') {
                props.append(`<span class="tag">Silver ${item.data.data.silver}</span>`)
            }

            // TODO clean this up on the items object
            let strEnc = ''
            if (item.data.data.encumbrance.sacks > 0) {
                strEnc += item.data.data.encumbrance.sacks
                if (item.data.data.encumbrance.sacks > 1) {
                    strEnc += ' Sacks'
                } else {
                    strEnc += ' Sack'
                }
                if (item.data.data.encumbrance.stones > 0 || item.data.data.encumbrance.soaps > 0) {
                    strEnc += ', '
                }
            }
            if (item.data.data.encumbrance.stones > 0) {
                strEnc += item.data.data.encumbrance.stones
                if (item.data.data.encumbrance.stones > 1) {
                    strEnc += ' Stones'
                } else {
                    strEnc += ' Stone'
                }
                if (item.data.data.encumbrance.soaps > 0) {
                    strEnc += ', '
                }
            }
            if (item.data.data.encumbrance.soaps > 0) {
                strEnc += item.data.data.encumbrance.soaps
                if (item.data.data.encumbrance.soaps > 1) {
                    strEnc += ' Soaps'
                } else {
                    strEnc += ' Soap'
                }
            }

            if (item.data.type !== 'feature') {
                props.append(`<span class="tag">Encumbrance ${strEnc}</span>`)
            }

            if (item.data.data.isConsumable) {
                props.append(`<span class="tag">Usage Die ${item.data.data.usageDie} ${item.data.data.usageDieType}</span>`)
            }

            if (item.data.data.hasLight) {
                props.append(`<span class="tag">Light Source Radius ${item.data.data.lightRadius}, Strength ${item.data.data.lightStrength}</span>`)
            }

            div.append(props)
            li.append(div.hide())
            div.slideDown(200)
        }
        li.toggleClass('expanded')
    }

    /**
   * Handle rolling of an item from the Actor sheet, obtaining the Item instance and dispatching to it's roll method
   * @private
   */
    _onItemRoll (event) {
        event.preventDefault()
        const itemId = event.currentTarget.closest('.item').dataset.itemId
        const item = this.actor.getOwnedItem(itemId)

        // Trigger the item roll
        if (item.data.type === 'scroll') {
            return ui.notifications.warn('Scrolls cannot be rolled yet.')
            // TODO return actor.useScroll(item);
        }
        if (item.data.type === 'gear') {
            return ui.notifications.warn('Gear cannot be rolled yet.')
            // TODO return actor.useGear(item);
        }

        // Otherwise roll the Item directly
        else return item.roll()
    }

    /**
   * Create a macro when a rollable element is dragged
   * @param {Event} event
   * @override */
    _onDragStart (event) {
        let dragData = null

        // Handle the various draggable elements on the sheet
        const classes = event.target.classList
        if (classes.contains('ability')) {
            // Normal ability rolls and DCC d20 roll under luck rolls
            const abilityId = event.currentTarget.dataset.ability
            dragData = {
                type: 'Ability',
                actorId: this.actor.id,
                data: {
                    abilityId: abilityId
                }
            }
        } else if (classes.contains('item')) {
            const li = event.currentTarget
            const weapon = this.actor.items.get(li.dataset.itemId)
            dragData = {
                type: 'Weapon',
                actorId: this.actor.id,
                data: {
                    weapon: weapon,
                    slot: li.dataset.itemSlot
                }
            }
        }
        if (dragData) {
            if (this.actor.isToken) dragData.tokenId = this.actor.token.id
            event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
        }
    }
    /* -------------------------------------------- */

    /**
   * Handle rolling an Ability check TODO: I don't think we need this
   * @param {Event} event   The originating click event
   * @private
   */
    _onRollAbilityCheck (event) {
        event.preventDefault()
        const ability = event.currentTarget.parentElement.parentNode.dataset.ability
        this.actor.rollAbilityCheck(ability)
    }
}
export default MorkBorkActorSheet
