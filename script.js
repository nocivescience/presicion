const mazeEl = document.querySelector('#maze');
const joystickEl = document.querySelector('#joystick-head');
const noteEl = document.querySelector('#note');
const wallW = 10;
const pathW = 25;
const slow = (number, difference) => {
    if (Math.abs(number) < difference) {
        return 0;
    }
    if (number > difference) {
        return number - difference;
    }
    return number + difference;
}
const rollAroundCap = (cap, ball) => {
    let impactAngle = getAngle(cap, ball);
    let heading = getAngle({ x: 0, y: 0 }, {
        x: ball.velocityX,
        y: ball.velocityY,
    });
    let impactHeadingAngle = impactAngle - heading;
    const velocityMagnitude = distance2D(
        { x: 0, y: 0 },
        { x: ball.velocityX, y: ball.velocityY, }
    );
    const velocityMagnitudeDiagonalToTheImpact = Math.sin(impactHeadingAngle) * velocityMagnitude;
    const closestDistance = wallW / 2 + ball.radius;
    const rotationAngle = Math.asin(
        velocityMagnitudeDiagonalToTheImpact / closestDistance
    );
    const deltaFromCap = {
        x: Math.cos(impactAngle + Math.PI - rotationAngle) * closestDistance,
        y: Math.sin(impactAngle + Math.PI - rotationAngle) * closestDistance,
    };
    const x= ball.x;
    const y= ball.y;
    const velocityX=ball.x -(cap.x + deltaFromCap.x);
    const velocityY=ball.y -(cap.y + deltaFromCap.y);
    const nextX = ball.velocityX;
    const nextY = ball.velocityY;
    return {
        x,
        y,
        velocityX,
        velocityY,
        nextX,
        nextY,
    }
};
let balls, walls, holeElement, gameInProgress, previousTimestamp, mouseStartX, mouseStartY, accelerationX, accelerationY, frictionX, frictionY;
let hardMode = false;
let showMessages = true;
walls = [
    { column: 11, row: 0, horizontal: true, length: 10 },
    { column: 0, row: 10, horizontal: false, length: 11 },
    { column: 0, row: 0, horizontal: true, length: 10 },
    { column: 0, row: 0, horizontal: false, length: 11 },
].map(wall => ({
    x: wall.column * (pathW + wallW),
    y: wall.row * (pathW + wallW),
    horizontal: wall.horizontal,
    length: wall.length * (pathW + wallW),
}));
walls.forEach(({ x, y, width, horizontal, length }) => {
    const wall = document.createElement('div');
    wall.classList.add('wall');
    wall.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${wallW}px;
        height: ${length}px;
        transform: rotate(${horizontal ? 0 : -90}deg);
        background-color: ${horizontal ? 'black' : 'blue'
        };
    `
    mazeEl.appendChild(wall);
})
balls = [
    { column: 0, row: 0, radius: 10, color: 'red' },
    { column: 9, row: 0, radius: 10, color: 'green' },
    { column: 0, row: 8, radius: 10, color: '#0479ff' },
    { column: 9, row: 8, radius: 10, color: 'orange' },
].map(ball => ({
    x: ball.column * (wallW + pathW) + (wallW + pathW) / 2,
    y: ball.row * (wallW + pathW) + (wallW + pathW) / 2,
    radius: ball.radius,
    color: ball.color,
    velocityX: 0,
    velocityY: 0,
}))
balls.forEach(({ x, y, radius, color }) => {
    const ball = document.createElement('div');
    ball.classList.add('ball');
    ball.style.cssText = `
        left:${x}px;
        top:${y}px;
        width:${wallW + 15}px;
        height:${10 + 15}px;
        background-color: ${color};
        border-radius: 50%;
        `
    mazeEl.appendChild(ball);
})
Math.minmax = function (vaule, limit) {
    return Math.max(Math.min(vaule, limit), -limit);
}
const distance2D = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
const getAngle = (p1, p2) => {
    let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    return angle;
}
const closestItCanBe = (cap, ball) => {
    let angle = getAngle(cap, ball);
    const deltaX = Math.cos(angle) * cap.radius;
}
function main(timestamp) {
    if (!previousTimestamp) {
        return
    }
    if (previousTimestamp === undefined) {
        previousTimestamp = timestamp;
        window.requestAnimationFrame(main);
        return;
    }
    const maxVelocity = 1.5;
    const timeElapsed = timestamp - previousTimestamp;
    try {
        if (accelerationX !== undefined && accelerationY !== undefined) {
            const velocityChangeX = accelerationX * timeElapsed;
            const velocityChangeY = accelerationY * timeElapsed;
            const frictionDeltaX = accelerationX * timeElapsed;
            const frictionDeltaY = accelerationY * timeElapsed;
            balls.forEach(ball => {
                if (velocityChangeX == 0) {
                    ball.velocityX = slow(ball.velocityX, frictionDeltaX);
                } else {
                    ball.velocityX = ball.velocityX + velocityChangeX;
                    ball.velocityX = Math.max(
                        Math.min(ball.velocityX, 1.5), -1.5
                    )
                    ball.velocityX = ball.velocityX - Math.sign(velocityChangeX) * frictionDeltaX;
                    ball.velocityX = Math.minmax(
                        ball.velocityX, maxVelocity
                    )
                }
                if (velocityChangeY == 0) {
                    ball.velocityY = slow(ball.velocityY, frictionDeltaY);
                } else {
                    ball.velocityY = ball.velocityY + velocityChangeY;
                    ball.velocityY = Math.max(
                        Math.min(ball.velocityY, 1.5), -1.5
                    )
                    ball.velocityY = ball.velocityY - Math.sign(velocityChangeY) * frictionDeltaY;
                    ball.velocityY = Math.minmax(
                        ball.velocityY, maxVelocity
                    )
                }
                ball.nextX = ball.x + ball.velocityX;
                ball.nextY = ball.y + ball.velocityY;
                if (debugMode) {
                    console.log(`Modo degub: ${ball.velocityX, ball.velocityY}`);
                }
                walls.forEach((wall, wi) => {
                    if (wall.horizontal) {
                        if (ball.nextY + ball.radius > wall.y && ball.nextY - ball.radius < wall.y + wall.length) {
                            if (ball.nextX + ball.radius > wall.x && ball.nextX - ball.radius < wall.x + wallW) {
                                const wallStart = {
                                    x: wall.x,
                                    y: wall.y,
                                }
                                const wallEnd = {
                                    x: wall.x + wallW.length,
                                    y: wall.y,
                                }
                                if (
                                    ball.nextX + ball.radius >= wallW / 2 && ball.nextX < wallStart.x
                                ) {
                                    const distance = distance2D(wallStart, {
                                        x: ball.nextX,
                                        y: ball.nextY,
                                    });
                                    if (distance < ball.radius + wallW / 2) {
                                        if (debugMode && wi > 0) { //esto orregirlo a 4
                                            console.warn('colision con pared horizontal' + distance + ball);
                                        }
                                        const closest = closestItCanBe({
                                            x: ball.nextX,
                                            y: ball.nextY,
                                            radius: ball.radius,
                                        }, wallStart);
                                        const rolled=rollAroundCap(
                                            wallEnd,{
                                                x: ball.nextX,
                                                y: ball.nextY,
                                                velocityX: ball.velocityX,
                                                velocityY: ball.velocityY,
                                            }
                                        );
                                        Object.assign(ball, rolled);
                                    }
                                }
                                if (ball.nextX>=wallStart.x && ball.nextX<=wallEnd.x){
                                    if (ball.nextY<wall.y){
                                        ball.nextY=wallW/2-ball.radius;
                                    }else{
                                        ball.nextY=wall.y+wallW/2+ball.radius;
                                    }
                                    ball.y=ball.nextY;
                                    ball.velocityY=-ball.velocityY/3;
                                    if(debugMode&&wi>4) console.error('colision con pared horizontal ', ball);
                                } 
                            }
                        }else{
                            if(ball.nextX+ball.radius>=wall.x-wallW/2 && ball.nextX-ball.radius<=wall.x+wallW/2){
                                const wallStart={
                                    x:wall.x,
                                    y:wall.y,
                                }
                            }
                        }
                    }
                })
            })
        }
    } catch (error) {
        console.error(error);
    }
}
joystickEl.addEventListener('mousedown', (event) => {
    mouseStartX = event.clientX;
    mouseStartY = event.clientY;
    gameInProgress = true;
    window.requestAnimationFrame(main);
    joystickEl.style.cssText = `
        animation: none;
        cursor: grabbing;
    `;
})
window.addEventListener('mouseup', (event) => {
    gameInProgress = false;
    joystickEl.style.cssText = `
        left: 0px;
        top: 0px;
        animation: joystick 0.5s forwards;
    `;
})
window.addEventListener('mousemove', (event) => {
    if (gameInProgress) {
        const mouseDeltaX = -Math.minmax(mouseStartX - event.clientX, 15);
        const mouseDeltaY = -Math.minmax(mouseStartY - event.clientY, 15);
        joystickEl.style.cssText = `
            left: ${mouseDeltaX}px;
            top: ${mouseDeltaY}px;
            cursor: grabbing;
        `;
        const rotationY = mouseDeltaX * 2;
        const rotationX = mouseDeltaY * 2;
        mazeEl.style.cssText = `
            transform: rotateY(${rotationY}deg) rotateX(${-rotationX}deg);
        `;
        const gravity = 2
        const friction = 0.1;
        accelerationX = gravity * Math.sin((rotationY / 180) * Math.PI);
        accelerationY = gravity * Math.sin((rotationX / 180) * Math.PI);
        frictionX = gravity * Math.cos((rotationY / 180) * Math.PI) * friction;
        frictionY = gravity * Math.sin((rotationX / 180) * Math.PI) * friction;
    }
    requestAnimationFrame(main);
})
window.addEventListener('keydown', (event) => {
    if (![' ', 'H', 'h', 'E', 'e'].includes(event.key)) {
        return;
    }
    event.preventDefault();
    if (event.key === ' ') {
        resetGame();
        return;
    }
    if (event.key === 'H' || event.key === 'h') {
        hardMode = true;
        return;
    }
    if (event.key === 'E' || event.key === 'e') {
        hardMode = false;
        return;
    }
})
function resetGame() {
    previousTimestamp = undefined;
    gameInProgress = false;
    mouseStartX = undefined;
    mouseStartY = undefined;
    accelerationX = undefined;
    accelerationY = undefined;
    frictionX = undefined;
    frictionY = undefined;
    mazeEl.style.cssText = `
        transform: rotate(0deg) rotateY(0deg) rotateX(0deg);
    `;
    joystickEl.style.cssText = `
        left: 0px;
        top: 0px;
        animation: glow 0.5s infinite alternate;
        cursor: grab;
    `;
    if (!hardMode && showMessages) {
        noteEl.innerHTML += `
            <p>Hard mode is on</p>
            <p>Press E to turn it off</p>
        `;
        showMessages = false;
    }
    noteEl.style.opacity = 1;
    balls = [
        { column: 0, row: 0, radius: 10, color: 'red' },
        { column: 9, row: 0, radius: 10, color: 'green' },
        { column: 0, row: 8, radius: 10, color: '#0479ff' },
        { column: 9, row: 8, radius: 10, color: 'orange' },
    ].map(ball => ({
        x: ball.column * (wallW + pathW) + (wallW + pathW) / 2,
        y: ball.row * (wallW + pathW) + (wallW + pathW) / 2,
        radius: ball.radius,
        color: ball.color,
        velocityX: 0,
        velocityY: 0,
    }))
    if (ballElements.length) {
        balls.forEach(({ x, y }, index) => {
            ballElements[index].style.cssText = `
                left: ${x}px;
                top: ${y}px;
            `;
        })
    }
    holeElements = [];
}