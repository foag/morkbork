import { HandlebarHelper } from './handlebars.js'
import { TemplatesHelper } from './templates.js'
import { SheetsHelper } from './sheets.js'
import * as actorHooks from './actor.js'
import * as macros from './macros.js'

export default function () {
    // Register HandleBar helpers
    HandlebarHelper.register()

    // Preload Handlebars Templates
    TemplatesHelper.preload()

    // Register and unregister sheets
    SheetsHelper.register()

    // Register actor hooks
    actorHooks.default()

    // Register macros
    macros.default()
}
