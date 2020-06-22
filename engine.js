const boundary = (that, min, max) => Math.min(Math.max(that, min), max)

const utils =  {
	pixelRatio: (context) => {
		let stores = [
			'webkitBackingStorePixelRatio',
			'mozBackingStorePixelRatio',
			'msBackingStorePixelRatio',
			'oBackingStorePixelRatio',
			'backingStorePixelRatio'
		]
		let deviceRatio = window.devicePixelRatio
		let backingRatio = stores.reduce((prev, curr) => context.hasOwnProperty(curr) ? context[curr] : 1)
		return deviceRatio / backingRatio
	},
	generateCanvas: (w, h) => {
		const canvas = document.createElement('canvas'),
			ctx = canvas.getContext('2d'),
			ratio = utils.pixelRatio(ctx)
		
		Object.assign(canvas, {
			width: Math.round(w * ratio),
			height: Math.round(h * ratio),
			id: 'default-canvas'
		})
		Object.assign(canvas.style, {
			width: `${w}px`,
			height: `${h}px`
		})		

		ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

		return canvas
	}
}

const keysDown = () => {
	this.isPressed = {}

	let left, right, up, down
	document.onkeydown = (e) => {
		if(e.keyCode == 39) right = true
		if(e.keyCode == 37) left = true
		if(e.keyCode == 38) up = true
		if(e.keyCode == 40) down = true
	}
	document.onkeyup = (e) => {
		if(e.keyCode == 39) right = false
		if(e.keyCode == 37) left = false
		if(e.keyCode == 38) up = false
		if(e.keyCode == 40) down = false
	}
	Object.defineProperty(this.isPressed, 'left', {
		get: () => left,
		configurable: true,
		enumerable: true
	})

	Object.defineProperty(this.isPressed, 'right', {
		get: () => right,
		configurable: true,
		enumerable: true
	})

	Object.defineProperty(this.isPressed, 'up', {
		get: () => up,
		configurable: true,
		enumerable: true
	})

	Object.defineProperty(this.isPressed, 'down', {
		get: () => down,
		configurable: true,
		enumerable: true
	})

	return this
}
const keys = keysDown()
	
const gameUpdate = scope => {
	return update = tFrame => {
		let state = scope.state || {}
		if(state.hasOwnProperty('entities')) {
			let {entities} = state
			for(let key in entities) {
				entities[key].update(scope)
			}
		}
		return state
	}
}
const gameRender = scope => {
	let w = scope.constants.width,
		h = scope.constants.height
	return render = () => {
		let state = scope.state || {}
		scope.ctx.clearRect(0, 0, w, h)
		if(scope.constants.showFps) {
			scope.text(w - 100, 50, scope.loop.fps)
		}
		if(state.hasOwnProperty('entities')) {
			let {entities} = state
			for(let key in entities) {
				entities[key].render(scope)
			}
		}
	}
}
const gameLoop = scope => {
	let loop = this

	let fps = scope.constants.targetFps,
		fpsInterval = 1000 / fps,
		before = window.performance.now()
	let cycles = {
		'new': {
			frameCount: 0,
			startTime: before,
			sinceStart: 0
		},
		'old': {
			frameCount: 0,
			startTime: before,
			sinceStart: 0
		}
	}

	let resetInterval = 5,
		resetState = 'new'

	loop.fps = 0
	loop.main = tFrame => {
		loop.stopLoop = window.requestAnimationFrame( loop.main )

		let now = tFrame,
			elapsed = now - before,
			activeCycle, targetResetInterval
		if (elapsed > fpsInterval) {
			before = now - (elapsed % fpsInterval)

			for (let calc in cycles) {
				++cycles[calc].frameCount
				cycles[calc].sinceStart = now - cycles[calc].startTime
			}

			activeCycle = cycles[resetState]
			loop.fps = Math.round(1000 / (activeCycle.sinceStart / activeCycle.frameCount) * 100) / 100

			targetResetInterval = (cycles.new.frameCount === cycles.old.frameCount ? resetInterval * fps : (resetInterval * 2) * fps)

			if (activeCycle.frameCount > targetResetInterval) {
				cycles[resetState].frameCount = 0
				cycles[resetState].startTime = now
				cycles[resetState].sinceStart = 0
				resetState = (resetState === 'new' ? 'old' : 'new')
			}

			scope.state = scope.update( now )
			scope.render()
		}
	}
	loop.main()
	return loop
}

class Game {
	constructor({width=600, height=600, targetFps=24, showFps=false}={}, location) {
		this.constants = Object.freeze({
			width, height, targetFps, showFps
		})
		this.state = {}
		this.location = location
		this.initialize()
		this.update = gameUpdate(this)
		this.render = gameRender(this)
		this.loop = gameLoop(this)
		return this
	}
	initialize() {
		this.viewport = utils.generateCanvas(this.constants.width, this.constants.height)
		this.ctx = this.viewport.getContext('2d')

		if(typeof this.location == 'string') {
			this.location = document.getElementById(this.location)
		}

		this.location.appendChild(this.viewport)
	}
	text(x, y, text, font, color) {
		this.ctx.font = font || '14px Verdana'
		this.ctx.fillStyle = color || '#555'
		this.ctx.fillText(text, x, y, this.width)
	}
	player() {
		this.state.entities = this.state.entities || {}
       	this.state.entities.player = new Player(this, (this.constants.width / 2), (this.constants.height - 100))
	}
}
class Player {
	constructor(scope, x, y) {
		this.position = {x, y}
		this.movement = 10

		this.height = 30
		this.width = 30

		this.update(scope)
		this.render(scope)
		
		return this
	}
	render(scope) {
		scope.ctx.fillStyle = '#000'
		scope.ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
	}
	update(scope) {
		if (keys.isPressed.left) this.position.x -= this.movement
        if (keys.isPressed.right) this.position.x += this.movement
        if (keys.isPressed.up) this.position.y -= this.movement
        if (keys.isPressed.down) this.position.y += this.movement

		this.position.x = boundary(this.position.x, 0, (scope.constants.width - this.width))
		this.position.y = boundary(this.position.y, 0, (scope.constants.height - this.height))
	}
}