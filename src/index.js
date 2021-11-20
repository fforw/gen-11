import domready from "domready"
import boids from "boids"
import { voronoi } from "d3-voronoi"
import { polygonCentroid } from "d3-polygon"
import "./style.css"
import AABB from "./AABB";
import Color from "./Color";


const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx;
let canvas;

function distanceSq(a, b) {
    return Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2);
}

function relax(points) {

    console.log("IN", points)
    const { width, height } = config;

    let isConverged = false;
    let centroids;
    let count = 0;
    while (!isConverged)
    {
        const polygons = voronoi().extent([[0,0], [width, height]]).polygons(points);
        centroids = polygons.map(polygonCentroid);

        isConverged = points.every(function(point, i){
            return distanceSq(point, centroids[i]) < 1000;
        });


        if (count > 1000)
        {
            break;
        }

        points = centroids;
        count++;
    }

    console.log("Looped ", count, "times")

    return centroids;
}


function randomPoints()
{
    const { width, height } = config;

    const pts = [];
    const num = 0 | Math.random() * 3 + 5;

    for (let i=0; i < num; i++)
    {
        pts.push([
            0|Math.random() * width,
            0|Math.random() * height
        ])
    }
    return pts;
}


function createFlock(coords)
{
    const attractors = [];

    coords.forEach(([x,y]) => {
        attractors.push(
            x, y, Math.random() * 100, Math.random() < 0.5 ? 1 : -1
        )
    })

    return boids({
        boids: 150,              // The amount of boids to use
        speedLimit: 1,          // Max steps to take per tick
        accelerationLimit: 1,   // Max acceleration per tick
        separationDistance: 60, // Radius at which boids avoid others
        alignmentDistance: 180, // Radius at which boids align with others
        choesionDistance: 180,  // Radius at which boids approach others
        separationForce: 0.15,  // Speed to avoid at
        alignmentForce: 0.25,   // Speed to align with other boids
        choesionForce: 0.1,     // Speed to move towards other boids
        attractors: []
    })
}

let offscreen, offCtx;

domready(
    () => {

        canvas = document.getElementById("screen");
        offscreen = document.createElement("canvas")
        ctx = canvas.getContext("2d");
        offCtx = offscreen.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;
        offscreen.width = width;
        offscreen.height = height;

        offCtx.fillStyle = "#000";
        offCtx.fillRect(0,0, width, height);

        for (let i=0; i < 400; i++)
        {
            offCtx.fillStyle = Color.fromHSL(Math.random(), 1, 0.5).toRGBA(0.5);

            const x = 0 | Math.random() * width;
            const y = 0 | Math.random() * height;
            const w = 0 | Math.random() * 100 + 100;
            const h = 0 | Math.random() * 100 + 100;
            offCtx.fillRect(x,y,w,h);
        }

        offCtx.fillStyle = Color.fromHSL(Math.random(), 0.25, 0.5).toRGBA(0.5);
        offCtx.fillRect(0,0,width, height)

        const flock = createFlock(
            relax(
                randomPoints()
            )
        )
        
        for (let i = 0; i < 500; i++)
        {
            flock.tick();
        }


        const size = 0 | Math.max(width,height) * 0.9

        const aabb = new AABB();
        flock.boids.forEach(
            ([x,y]) => {
                aabb.add(x,y);
            }
        )

        const brushSize = 30;
        const bh = brushSize/2;

        const colors = flock.boids.map(
            ([x,y]) => {
                const brush = document.createElement("canvas");
                brush.width = brushSize;
                brush.height = brushSize;

                /**
                 * @type CanvasRenderingContext2D
                 */
                const brushCtx = brush.getContext("2d")


                const x0 = (x - aabb.minY) * size / aabb.width;
                const y0 = (y - aabb.minY) * size / aabb.height;

                brushCtx.drawImage(offscreen, x0 - bh,y0 - bh, brushSize, brushSize, 0, 0, brushSize, brushSize )
                brushCtx.globalAlpha = 0.1;
                return brushCtx;
            }
        )

        const paint = () => {

            const aabb = new AABB();
            flock.boids.forEach(
                ([x,y]) => {
                    aabb.add(x,y);
                }
            )

            flock.boids.forEach(([x,y], idx) => {

                const x0 = (x - aabb.minY) * size / aabb.width;
                const y0 = (y - aabb.minY) * size / aabb.height;

                const brushCtx = colors[idx];
                brushCtx.drawImage(offscreen, x0 - bh, (idx & 1) ? y0 - bh : height - y0 - bh, brushSize, brushSize, 0, 0, brushSize, brushSize )
                ctx.drawImage(brushCtx.canvas, x0 - bh, y0 - bh)
            })

            flock.tick()

            requestAnimationFrame(paint)
        }


        requestAnimationFrame(paint)



    }
);
