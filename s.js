'use strict';

const w = document.body.clientWidth
const h = document.body.clientHeight
const k = document.getElementById('k')
k.width = w
k.height = h

const movingSpeed = 1
const fps = 30
let fpsCounter = []
const wheelStep = 10
const defaultStarRadius = 5
const starRadiusDeviation = 5
const growSpeed = .5
const useMerge = false
let range = 10
const cheapIdGenerator = (i) => `id-${i}`
let data = gen(100)

/**
 * @type {CanvasRenderingContext2D}
 */
const d2 = k.getContext("2d", {alpha: true, desynchronized: true})
d2.font = "22px serif";

const starShape = ((p) => {
    p.moveTo(0, 1)
    p.arcTo(0, 0, -1, 0, 1)
    p.arcTo(0, 0, 0, -1, 1)
    p.arcTo(0, 0, 1, 0, 1)
    p.arcTo(0, 0, 0, 1, 1)
    return p
})(new Path2D())

function genStar(x, y, i) {
    return {
        x: x,
        y: y,
        id: cheapIdGenerator(i),
        grows: true,
        grow() {
            if (this.grows) {
                this.radius += this.growSpeed
            } else {
                this.radius -= this.growSpeed
            }
            if (this.radius < this.growMin) {
                this.radius = this.growMin
                this.grows = true
            } else if (this.radius > this.growMax) {
                this.radius = this.growMax
                this.grows = false
            }
            this.matrix.a = this.rotation.cos * this.radius
            this.matrix.b = this.rotation.sin * this.radius
            this.matrix.c = -this.rotation.sin * this.radius
            this.matrix.d = this.rotation.cos * this.radius
            return this;
        },
        tx: 0,
        ty: 0,
        move() {
            this.tx += (Math.random() - .5) * movingSpeed
            this.ty += (Math.random() - .5) * movingSpeed
            this.matrix.e = this.tx
            this.matrix.f = this.ty
            return this
        },
        growSpeed: Math.random() * growSpeed + growSpeed,
        growMax: defaultStarRadius + starRadiusDeviation,
        growMin: defaultStarRadius,
        radius: defaultStarRadius + Math.floor(starRadiusDeviation * Math.random()),
        color: `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)}, 1)`,
        shadowBlur: Math.floor(30 * Math.random()) + 10,
        rotation: ((angle) => {
            return {
                sin: Math.sin(angle),
                cos: Math.cos(angle)
            }
        })(Math.PI * 2 * Math.random()),
        /**
         * @param {CanvasRenderingContext2D} d2
         */
        draw(d2) {
            d2.save()
            d2.shadowColor = this.color
            d2.shadowBlur = this.shadowBlur
            d2.fillStyle = this.color
            d2.translate(this.x, this.y)
            let p = new Path2D()
            p.addPath(starShape, this.matrix)
            d2.fill(p)
            d2.restore()
            return this
        },
        matrix: new DOMMatrix([
            1, 0, 0, 1, 0, 0
        ]),
        distanceTo(other) {
            return Math.sqrt(
                (this.x + this.tx - other.x - other.tx) * (this.x + this.tx - other.x - other.tx)
                + (this.y + this.ty - other.y - other.ty) * (this.y + this.ty - other.y - other.ty)
            )
        },
        canMerge(other) {
            return this.distanceTo(other) <= (this.radius + other.radius);
        },
        merge(other) {
            this.growMax = Math.abs(
                Math.sqrt(
                    this.growMax * this.growMax + other.growMax * other.growMax
                )
            )
            // this.radius = newRadius
            this.growSpeed += .1
            return this
        },
    }
}

function gen(num) {
    return Array(num).fill(0).map((x, i) => {
            return genStar(Math.random() * w, Math.random() * h, i)
        }
    )
}

let lines = []

function recalc() {
    data = merge(data)
    lines = data.reduce(findConnected, {lines: []}).lines
}

function redraw() {
    d2.clearRect(0, 0, k.width, k.height)
    lines.map((x) => {
        d2.strokeStyle = `rgba(222,222,222,${x[4]})`
        d2.beginPath()
        d2.moveTo(x[0], x[1])
        d2.lineTo(x[2], x[3])
        d2.stroke()
    })
    data.map(star => star.draw(d2))
    const t = performance.now()
    while (fpsCounter[0] < (t - 10000)) {
        fpsCounter = fpsCounter.slice(1, fpsCounter.length)
    }

    d2.fillStyle = 'rgb(255,255,255)'
    d2.fillText(`total stars: ${data.length}`, 10, 22);
    d2.fillText(`connection range: ${range}`, 10, 42);
    d2.fillText(`fps: ${fpsCounter.length / 10}`, 10, 62);

    fpsCounter.push(t)
}

window.setInterval(function () {
    recalc()
    redraw()
}, 1000 / fps)

document.addEventListener('wheel', function (event) {
    range = Math.max(0, range + (event.deltaY > 0 ? wheelStep : -wheelStep))
})
const onMouseMove = (event) => {
    const add = () => {
        data.push(genStar(
            event.x, event.y, data.length
        ))

    }
    setTimeout(add, 100)
}
document.addEventListener('mousedown', function (event) {
    document.addEventListener('mousemove', onMouseMove)
})
document.addEventListener('mouseup', function (event) {
    document.removeEventListener('mousemove', onMouseMove)
    if (event.ctrlKey) {

    } else {
        data.push(genStar(event.x, event.y, data.length))
    }
})

document.addEventListener('keydown', function (event) {
    if (event.ctrlKey) {
        document.body.classList += ' ctrl'
    }
})

document.addEventListener('keyup', function (event) {
    document.body.classList.remove('ctrl')
})

let starRange, forwardKey, reverseKey;

function merge(stars) {
    for (let i = 0; i < stars.length; i++) {
        stars[i] = stars[i].move().grow()
    }

    if(!useMerge){
        return stars
    }

    for (let i = 0; i < stars.length; i++) {
        for (let k = i + 1; k < stars.length; k++) {
            if (stars[i].canMerge(stars[k])) {
                stars[k] = stars[k].merge(stars[i])
                stars[i] = null
                break;
            }
        }
    }

    return stars.filter(x => x != null)
}

function findConnected(graph, current, i, all) {
    all
        .slice(i + 1)
        .forEach(star => {
            starRange = current.distanceTo(star)

            if (starRange >= range) {
                return
            }

            forwardKey = `${current.id}-${star.id}`
            if (!!graph[forwardKey]) {
                return;
            } else {
                graph[forwardKey] = true;
            }
            reverseKey = `${star.id}-${current.id}`
            if (!!graph[reverseKey]) {
                return;
            } else {
                graph[reverseKey] = true;
            }
            graph.lines.push([
                current.x + current.tx,
                current.y + current.ty,
                star.x + star.tx,
                star.y + star.ty,
                1 - starRange / range
            ])
        })

    return graph
}

