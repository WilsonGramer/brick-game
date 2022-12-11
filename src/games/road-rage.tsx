import _, { random } from "lodash";
import { Game } from ".";
import * as engine from "../engine";

const { height } = engine.backends.ptc;

const fps = 60;
const interval = 1000 / fps;

const wait = (frames: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, frames * interval));

const characters = {
    block: 143,
    line: 150,
    aButton: 1,
    oncomingCar: 238,
    car: 236,
    explosion: 254,
};

const yellowLineLength = 3;

let highScore = 0;

const BackgroundRoom =
    (props: { score?: number; yellowLineColor: number; yellowLineOffset: number }): engine.Room =>
    (ctx) => {
        ctx.print();
        ctx.print();
        ctx.print();
        ctx.fg(13);
        ctx.printf("  XXX XXX XXX XX  ", characters.block);
        ctx.printf("  X X X X X X X X ", characters.block);
        ctx.printf("  XXX X X XXX X X ", characters.block);
        ctx.printf("  XX  X X X X X X ", characters.block);
        ctx.printf("  X X XXX X X XX  ", characters.block);
        ctx.printf("                   ", characters.block);
        ctx.printf("  XXX XXX XXX XXX X", characters.block);
        ctx.printf("  X X X X X   X   X", characters.block);
        ctx.printf("  XXX XXX X X XXX X", characters.block);
        ctx.printf("  XX  X X X X X    ", characters.block);
        ctx.printf("  X X X X XXX XXX X", characters.block);
        ctx.print();
        ctx.fg(8);
        ctx.print("  (C) 2022");
        ctx.print("  Wilson Gramer");
        ctx.fg(15);
        ctx.print();

        if (props.score != null) {
            ctx.print(`  Score: ${props.score}`);
        } else {
            ctx.print(`  High score: ${highScore}`);
        }

        for (let y = 0; y < height; y++) {
            ctx.fg(15);
            ctx.locate(21, y);
            ctx.printGlyph(characters.line);
            ctx.locate(29, y);
            ctx.printGlyph(characters.line);
        }

        ctx.fg(props.yellowLineColor);
        for (let y = 0; y < height + yellowLineLength; y++) {
            if ((y - props.yellowLineOffset) % yellowLineLength > 0) {
                ctx.locate(25, y - yellowLineLength);
                ctx.printGlyph(characters.line);
            }
        }
    };

const TitleRoom: engine.Room = (ctx) => {
    BackgroundRoom({
        yellowLineColor: 8,
        yellowLineOffset: -1,
    })(ctx);

    ctx.play(new engine.Music(1, true));

    ctx.fg(14);
    ctx.locate(2, 20);
    ctx.print("Press any button");
    ctx.locate(2, 21);
    ctx.print("to start");

    ctx.effect(async () => {
        await wait(60);
    });

    ctx.loop(async () => {
        const button = await ctx.button();

        if (button) {
            ctx.setRoom(CountdownRoom);
        }
    });
};

const CountdownRoom: engine.Room = (ctx) => {
    BackgroundRoom({
        yellowLineColor: 8,
        yellowLineOffset: -1,
    })(ctx);

    const [countdown, setCountdown] = ctx.state(2);

    ctx.fg(0);

    ctx.locate(22, 9);
    ctx.print("Ready!!");

    if (countdown() <= 1) {
        ctx.locate(22, 11);
        ctx.print(" Set!!");
    }

    if (countdown() <= 0) {
        ctx.locate(22, 13);
        ctx.print(" GO!!!");
    }

    ctx.loop(async () => {
        await wait(60);

        if (countdown() === 0) {
            ctx.setRoom(GameRoom);
        } else {
            setCountdown(countdown() - 1);
        }
    });
};

const GameRoom: engine.Room = (ctx) => {
    const carLeftX = 22;
    const numberOfCars = 6;
    const maxCarSpawnProbability = 0.4;
    const carSpawnProbabilityChange = 0.0125;
    const minCarSpawnProbability = 0.3;
    const speedInterval = 35;
    const minWait = 3;
    const maxWait = 10;
    const waitChange = 1;
    const textY = 10;
    const characterY = height - 4;

    const [state, setState] = ctx.state({
        time: 0,
        wait: maxWait,
        x: 3,
        yellowLineOffset: 0,
        carSpawnProbability: maxCarSpawnProbability,
        cars: [] as [number, number][],
        hitCar: false,
        gameOver: false,
        score: 0,
    });

    BackgroundRoom({
        score: state().score,
        yellowLineColor: state().hitCar ? 8 : 7,
        yellowLineOffset: state().yellowLineOffset,
    })(ctx);

    ctx.play(state().hitCar ? new engine.Music(6, false) : new engine.Music(2, true));

    for (const [x, y] of state().cars) {
        ctx.locate(carLeftX + x, y);
        ctx.fg(y > characterY || state().hitCar ? 14 : 15);
        ctx.printGlyph(characters.oncomingCar);
    }

    if (state().hitCar) {
        ctx.fg(15);
        ctx.locate(carLeftX + 1, textY);
        ctx.print("GAME");
        ctx.locate(carLeftX + 1, textY + 2);
        ctx.print("OVER!");
    }

    ctx.locate(carLeftX + state().x, characterY);
    ctx.fg(13);

    if (state().hitCar) {
        ctx.printGlyph(characters.explosion);
    } else {
        ctx.printGlyph(characters.car);
    }

    ctx.loop(async () => {
        if (state().gameOver) {
            if (await ctx.button()) {
                ctx.setRoom(TitleRoom);
            }

            return;
        } else if (state().hitCar) {
            setState({
                ...state(),
                gameOver: true,
            });

            await wait(120);

            return;
        } else if (state().cars.some(([x, y]) => x === state().x && y === characterY)) {
            setState({
                ...state(),
                hitCar: true,
            });

            highScore = Math.max(highScore, state().score);

            return;
        }

        let newX = state().x;
        switch (await ctx.button()) {
            case 4:
                newX = Math.max(newX - 1, 0);
                break;
            case 8:
                newX = Math.min(newX + 1, numberOfCars);
                break;
            default:
                break;
        }

        const updatedCars = state()
            .cars.filter(([x, y]) => y < height)
            .map(([x, y]) => [x, y + 1] as [number, number]);

        if (Math.random() < state().carSpawnProbability) {
            updatedCars.push([random(numberOfCars), 0]);
        }

        const reachedWait = state().time % speedInterval === 0;

        setState({
            ...state(),
            time: state().time + 1,
            wait: reachedWait ? Math.max(state().wait - waitChange, minWait) : state().wait,
            x: newX,
            yellowLineOffset: (state().yellowLineOffset + 1) % yellowLineLength,
            carSpawnProbability: reachedWait
                ? Math.max(
                      state().carSpawnProbability - carSpawnProbabilityChange,
                      minCarSpawnProbability
                  )
                : state().carSpawnProbability,
            cars: updatedCars,
            score: state().score + updatedCars.filter(([x, y]) => y === characterY + 1).length,
        });

        await wait(state().wait);
    });
};

export default () => <Game room={TitleRoom} />;
