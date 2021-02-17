'use strict';

const speed = 1
const fps = 30
let fpsCounter = []
const wheelStep = 10
const defaultStarRadius = 2
const starRadiusDeviation = 5
const growSpeed = .5
let range = 10
const w = document.body.clientWidth
const h = document.body.clientHeight
let data = gen(1000)
const k = document.getElementById('k')
k.width = w
k.height = h
/**
 * @type {CanvasRenderingContext2D}
 */
const d2 = k.getContext("2d")

function genStar(x, y, i) {
    let star = {
        x: x,
        y: y,
        id: `id-${i}-${Math.floor(Math.random() * 1000000)}`,
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
            this.bounds = this.newBounds()
            return this;
        },
        move() {
            const moveX = (Math.random() - .5) * speed
            const moveY = (Math.random() - .5) * speed
            this.x = Math.min(w, Math.max(0, this.x + moveX))
            this.y = Math.min(h, Math.max(0, this.y + moveY));
            return this
        },
        growSpeed: Math.random() * growSpeed + growSpeed,
        growMax: defaultStarRadius + starRadiusDeviation,
        growMin: defaultStarRadius,
        radius: defaultStarRadius + Math.floor(starRadiusDeviation * Math.random()),
        color: `rgba(${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)},${Math.floor(Math.random() * 255)}, 1)`,
        shadowBlur: Math.floor(30 * Math.random()) + 10,
        rotation: Math.PI * 2 * Math.random(),
        /**
         * @param {CanvasRenderingContext2D} d2
         */
        draw(d2) {
            d2.shadowColor = this.color
            d2.shadowBlur = this.shadowBlur
            this.drawBody(d2)
            this.drawBounds(d2)
            d2.shadowBlur = 0;
            return this
        },
        /**
         * @param {CanvasRenderingContext2D} d2
         */
        drawBody(d2) {
            d2.beginPath()
            const {t, r, b, l} = this.bounds
            d2.arc(t[0], t[1], this.radius, t[2], t[3], false)
            d2.arc(r[0], r[1], this.radius, r[2], r[3], false)
            d2.arc(b[0], b[1], this.radius, b[2], b[3], false)
            d2.arc(l[0], l[1], this.radius, l[2], l[3], false)
            d2.fillStyle = this.color
            d2.fill()
        },
        /**
         * @param {CanvasRenderingContext2D} d2
         */
        drawBounds(d2) {
            // const radiusFactor = Math.sqrt(defaultStarRadius / this.radius)
            // d2.beginPath()
            // d2.strokeStyle = `rgba(222,222,222,${2 / radiusFactor})`
            // d2.strokeWidth = 3 / radiusFactor
            // d2.stroke()
            // d2.beginPath()
            // d2.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
            // d2.stroke()
        },
        distanceTo(other) {
            return Math.sqrt(
                (this.x - other.x) * (this.x - other.x)
                + (this.y - other.y) * (this.y - other.y)
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
            this.bounds = this.newBounds()
            return this
        },
        newBounds() {
            const r = this.radius, fi = this.rotation, hpi = Math.PI * .5
            const x = this.x, y = this.y
            return {
                t: [
                    x + Math.SQRT2 * Math.cos(fi + hpi + hpi + hpi) * r,
                    y + Math.SQRT2 * Math.sin(fi + hpi + hpi + hpi) * r,
                    Math.PI * .25 + fi,
                    Math.PI * .75 + fi
                ],
                r: [
                    x + Math.SQRT2 * Math.cos(fi) * r,
                    y + Math.SQRT2 * Math.sin(fi) * r,
                    Math.PI * .75 + fi,
                    Math.PI * 1.25 + fi
                ],
                b: [
                    x + Math.SQRT2 * Math.cos(fi + hpi) * r,
                    y + Math.SQRT2 * Math.sin(fi + hpi) * r,
                    Math.PI * 1.25 + fi,
                    Math.PI * 1.75 + fi
                ],
                l: [
                    x + Math.SQRT2 * Math.cos(fi + hpi + hpi) * r,
                    y + Math.SQRT2 * Math.sin(fi + hpi + hpi) * r,
                    Math.PI * 1.75 + fi,
                    Math.PI * 2.25 + fi
                ],

            }
        }
    }
    star.bounds = star.newBounds()
    return star
}

function gen(num) {
    return Array(num).fill(0).map((x, i) => {
            return genStar(Math.random() * w, Math.random() * h, i)
        }
    )
}

function recalc() {
    data = merge(data
        .map(star => star.move())
        .map(star => star.grow()))
}

function redraw() {
    d2.clearRect(0, 0, w, h)

    data.reduce(findConnected, {})
    data.map(star => star.draw(d2))

    const t = performance.now()
    while (fpsCounter[0] < (t - 10000)) {
        fpsCounter = fpsCounter.slice(1, fpsCounter.length)
    }

    d2.font = "22px serif";
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

document.addEventListener('mousedown', function (event) {
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

function connect(a, b, rangeFactor) {
    d2.strokeStyle = `rgba(222,222,222,${rangeFactor})`
    d2.beginPath()
    d2.moveTo(a.x, a.y)
    d2.lineTo(b.x, b.y)
    d2.stroke()
}

let starRange, forwardKey, reverseKey;

function merge(stars) {
    let merged = {}
    return stars
        .reverse()
        .sort((a, b) => b.radius - a.radius)
        .reduce((acc, current, i, all) => {
            if (1 === merged[current.id]) {
                return acc
            }

            all
                .slice(i + 1)
                .filter(x => !merged.hasOwnProperty(x.id))
                .filter(star => current.canMerge(star))
                .forEach(star => {
                    current = current.merge(star)
                    merged[star.id] = 1
                })

            acc.push(current)

            return acc
        }, [])
}

function findConnected(graph, current, i, all) {
    all
        .slice(i + 1)
        .forEach(star => {
            starRange = Math.sqrt((current.x - star.x) * (current.x - star.x) + (current.y - star.y) * (current.y - star.y))

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
            connect(current, star, 1 - starRange / range)
        })

    return graph
}

