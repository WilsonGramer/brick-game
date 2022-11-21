import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { random, sample } from "lodash";
import * as engine from "./engine";
import controller from "./assets/controller.svg";
import "./assets/global.css";

const { width, height } = engine.backends.ptc;

const fps = 60;
const interval = 1000 / fps;

const wait = (frames: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, frames * interval));

const characters = {
    brick: 3,
    face: 8,
    house: 232,
};

let stage = 0;

const TitleRoom: engine.Room = async (ctx) => {
    ctx.play(new engine.Music(21, true));
    ctx.fg(8);
    ctx.print(new Array(width).fill(characters.brick));
    ctx.print(new Array(width).fill(characters.brick));
    ctx.print();
    ctx.fg(13);
    ctx.print("     (C) 2014 Wilson Gramer");
    ctx.fg(7);

    ctx.printf("     XXXXXX XXXX X XXX X  X", characters.brick);
    ctx.printf("     X    X X  X X X   X X", characters.brick);
    ctx.printf("     X    X X  X X X   XX", characters.brick);
    ctx.printf("     XXXXX  X  X X X   XX", characters.brick);
    ctx.printf("     X    X XXXX X X   X X", characters.brick);
    ctx.printf("     X    X X X  X X   X  X", characters.brick);
    ctx.printf("     XXXXXX X  X X XXX X   X", characters.brick);
    ctx.print();
    ctx.printf("      XXXX XXXXX XXXXX XXXX", characters.brick);
    ctx.printf("      X    X   X X X X X", characters.brick);
    ctx.printf("      X    X   X X X X X", characters.brick);
    ctx.printf("      X XX XXXXX X X X XXXX", characters.brick);
    ctx.printf("      X  X X   X X   X X", characters.brick);
    ctx.printf("      XXXX X   X X   X XXXX", characters.brick);
    ctx.print();

    const titleText = sample([
        "      GET THE RIGHT BRICK!",
        "        IT'S ADDICTIVE!",
        [..."      MADE BY WILSONATOR! ", characters.face],
    ]);

    ctx.fg(9);
    ctx.print(titleText);
    ctx.print("        Push any button");
    ctx.print();

    ctx.fg(8);
    ctx.print(new Array(width).fill(characters.brick));
    ctx.print(new Array(width).fill(characters.brick));

    ctx.loop(async () => {
        const button = await ctx.button();

        if (button) {
            ctx.setRoom(StartRoom);
        }
    });
};

const StartRoom: engine.Room = async (ctx) => {
    ctx.locate(10, 12);
    ctx.print("HERE WE GO!");

    ctx.effect(async () => {
        await wait(180);
        ctx.setRoom(BricksRoom);
    });
};

const NextStageRoom: engine.Room = async (ctx) => {
    ctx.locate(10, 12);
    ctx.print("NEXT STAGE!");

    ctx.effect(async () => {
        await wait(180);
        ctx.setRoom(BricksRoom);
    });
};

const BricksRoom: engine.Room = async (ctx) => {
    const [x, setX] = ctx.state(15);
    const [y, setY] = ctx.state(15);

    ctx.play(new engine.Music(27, true));

    ctx.fg(8);
    ctx.print([characters.house, ...new Array(width - 1).fill(characters.brick)]);
    ctx.print(new Array(width).fill(characters.brick));
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.fg(7);
    ctx.print([..."         ", characters.brick, ..."      ", characters.brick]);
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print("        TOUCH A BRICK...");
    ctx.locate(0, 22);
    ctx.fg(0);
    ctx.print(`SCORE: ${stage}`);
    ctx.locate(x, y);
    ctx.fg(13);
    ctx.print(characters.face);

    ctx.loop(async () => {
        switch (await ctx.button()) {
            case 1:
                setY(Math.max(0, y - 1));
                await wait(10);
                break;
            case 2:
                setY(Math.min(y + 1, height - 1));
                await wait(10);
                break;
            case 4:
                setX(Math.max(0, x - 1));
                await wait(10);
                break;
            case 8:
                setX(Math.min(x + 1, width - 1));
                await wait(10);
                break;
            default:
                break;
        }

        if ((x == 9 || x == 16) && y == 7) {
            ctx.setRoom(random(2) === 1 ? ClearRoom : GameOverRoom);
        }
    });
};

const ClearRoom: engine.Room = async (ctx) => {
    ctx.play(new engine.Music(15, true));
    ctx.locate(12, 12);
    ctx.print("CLEAR!");

    ctx.effect(async () => {
        stage += 1;
        await wait(60);
    });

    ctx.loop(async () => {
        if ((await ctx.button()) !== 0) {
            ctx.setRoom(NextStageRoom);
        }
    });
};

const GameOverRoom: engine.Room = async (ctx) => {
    ctx.play(new engine.Music(6, false));
    ctx.locate(12, 12);
    ctx.print("GAME OVER");

    ctx.effect(async () => {
        stage = 0;
        await wait(60);
    });

    ctx.loop(async () => {
        if ((await ctx.button()) !== 0) {
            await wait(40);
            ctx.setRoom(TitleRoom);
        }
    });
};

const App = () => {
    const element = useRef<HTMLDivElement>(null);

    const [started, setStarted] = useState(false);

    useEffect(() => {
        let pressed = false;

        const update = async () => {
            const button = await engine.inputs.gamepad.button();

            if (pressed && button === 0) {
                setStarted(true);
                return;
            }

            if (button !== 0) {
                pressed = true;
            }

            requestAnimationFrame(update);
        };

        update();
    }, []);

    useEffect(() => {
        if (started) {
            // document.documentElement.requestFullscreen({ navigationUI: "hide" });
            engine.backends.ptc.run(TitleRoom, engine.inputs.gamepad, element.current!);
        }
    }, [started]);

    return started ? (
        <div id="game" ref={element} />
    ) : (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100vw",
                height: "100vh",
            }}
        >
            <img src={controller} width={100} height={100} />

            <p style={{ color: "white", fontSize: 36, textAlign: "center" }}>
                Connect a controller and press any button to start
            </p>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
