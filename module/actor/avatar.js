export class ActorAvatar {
    async make (char = 'Z') {
        const app = new PIXI.Application({
            width: 200, height: 200, backgroundColor: 0x1099bb
        })

        const font = new FontFaceObserver('agathodaimonregular')

        await font.load()
        // document.body.appendChild(app.view);
        const style = new PIXI.TextStyle({
            fontFamily: 'agathodaimonregular',
            fontSize: 140,
            fill: '#000000',
            dropShadow: true,
            dropShadowColor: '#FFE82C',
            dropShadowBlur: 0,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 3
        })

        const container = new PIXI.Container()
        container.x = 0
        container.y = 0
        app.stage.addChild(container)

        const img = await this.preloadImage('systems/morkbork/img/char_bg.png')
        const bg = await PIXI.Sprite.from(img)
        bg.width = app.screen.width
        bg.height = app.screen.height
        container.addChild(bg)

        const basicText = new PIXI.Text(char, style)
        basicText.x = 100
        basicText.y = 100
        basicText.anchor.set(0.4, 0.5)
        container.addChild(basicText)

        return await app.renderer.plugins.extract.base64(container, 'image/png', 1)
    }

    preloadImage (src) {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = src
        })
    }
}
