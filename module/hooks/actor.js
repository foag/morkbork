
export default function () {
    Hooks.on('preCreateActor', (createData) => {
        // console.log('preCreateActor', createData)
    })

    Hooks.on('createActor', (actor, options, data) => {
        // const characterData = generateCharacter().then((data) => {
        //     actor.update(data)
        // })
    })

    Hooks.on('preUpdateActor', (actor, updatedData) => {
        console.log('preUpdateActor', actor, updatedData)
    })

    Hooks.on('preCreateToken', (scene, data, options, userId) => {
        // console.log('preCreateToken', scene, data, options, userId)
    })
}
