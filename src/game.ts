import { random, sample } from "lodash";
import * as engine from "./engine";

const { width, height } = engine.backends.ptc;

const fps = 60;
const interval = 1000 / fps;

const wait = (frames: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, frames * interval));

const characters = {
    brick: 3,
    face: 8,
    xButton: 24,
    line: 149,
    house: 232,
};

let stage = 0;
let highScore = 0;
let brickType = 0;
let newBrickType = 0;

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
        "      MADE BY WILSONATOR!",
        "       BEAT MY HIGHSCORE!",
        [..."       PRESS ", characters.xButton, ..." FOR STORE!"],
    ]);

    ctx.fg(9);
    ctx.print(titleText);
    ctx.print("        Push any button");
    ctx.print();

    ctx.fg(8);
    ctx.print(new Array(width).fill(characters.brick));
    ctx.print(`HIGHSCORE: ${highScore}`);

    ctx.effect(async () => {
        stage = brickType >= 2 ? 4 : 0;
        await wait(60);
    });

    ctx.loop(async () => {
        const button = await ctx.button();

        if (button === 64) {
            ctx.setRoom(StoreRoom);
        } else if (button) {
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

    if (brickType >= 3) {
        ctx.bg(10);
        ctx.print(new Array(width * height).fill(" "));
        ctx.locate(0, 0);
    }

    let brickColor: number;
    switch (brickType) {
        case 1:
            brickColor = 9;
            break;
        case 2:
            brickColor = 4;
            break;
        case 3:
            brickColor = 10;
            break;
        case 4:
            brickColor = 13;
            break;
        default:
            brickColor = 7;
            break;
    }

    ctx.fg(8);
    ctx.print([characters.house, ...new Array(width - 1).fill(characters.brick)]);
    ctx.print(new Array(width).fill(characters.brick));
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.print();
    ctx.fg(brickColor);
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
            const chance = brickType >= 1 ? 5 : 2;
            ctx.setRoom(random(chance) > 0 ? ClearRoom : GameOverRoom);
        }
    });
};

const ClearRoom: engine.Room = async (ctx) => {
    ctx.play(new engine.Music(15, true));
    ctx.locate(12, 12);
    ctx.print("CLEAR!");

    ctx.effect(async () => {
        stage += brickType >= 4 ? 2 : 1;
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
        await wait(60);
    });

    ctx.loop(async () => {
        if ((await ctx.button()) !== 0) {
            await wait(40);

            if (stage >= 30) {
                newBrickType = 4;
            } else if (stage >= 20) {
                newBrickType = 3;
            } else if (stage >= 15) {
                newBrickType = 2;
            } else if (stage > 9) {
                newBrickType = 1;
            }

            ctx.setRoom(
                newBrickType > brickType
                    ? NewBrickRoom
                    : stage > highScore
                    ? HighScoreRoom
                    : TitleRoom
            );
        }
    });
};

const NewBrickRoom: engine.Room = async (ctx) => {
    ctx.play(new engine.Music(12, true));
    ctx.locate(6, 10);
    ctx.print("YOU GOT A NEW BRICK!");
    ctx.locate(3, 11);
    ctx.print("CHECK IT OUT IN THE STORE!");

    ctx.effect(async () => {
        brickType = newBrickType;
        newBrickType = 0;
    });

    ctx.loop(async () => {
        if ((await ctx.button()) !== 0) {
            await wait(30);
            ctx.setRoom(stage > highScore ? HighScoreRoom : TitleRoom);
        }
    });
};

const HighScoreRoom: engine.Room = async (ctx) => {
    ctx.play(new engine.Music(12, true));
    ctx.locate(6, 10);
    ctx.print("YOU GOT A HIGH SCORE!");

    ctx.effect(async () => {
        highScore = stage;
        await wait(120);
    });

    ctx.loop(async () => {
        if ((await ctx.button()) !== 0) {
            ctx.setRoom(TitleRoom);
        }
    });
};

const StoreRoom: engine.Room = async (ctx) => {
    ctx.play(new engine.Music(14, true));
    ctx.fg(0);

    ctx.printf("    XXXXXXXXXXXXXXXXXXXXXXX    ", characters.brick);
    ctx.printf("    XXXXXXXXXXXXXXXXXXXXXXX    ", characters.brick);
    ctx.print();
    ctx.print(" Items to buy...");
    ctx.print();
    ctx.fg(9);
    ctx.print([..." ", characters.brick, ..." BLUE BRICK Increases your"]);
    ctx.print("              chances of winning");
    ctx.print();
    ctx.fg(4);
    ctx.print([..." ", characters.brick, ..." GREEN BRICK Start on Level 5"]);
    ctx.print();
    ctx.fg(10);
    ctx.print([..." ", characters.brick, ..." PURPLE BRICK Purple BG! :)"]);
    ctx.print();
    ctx.fg(13);
    ctx.print([..." ", characters.brick, ..." RED BRICK Double points"]);
    ctx.print();
    ctx.fg(0);
    ctx.print([
        ..."         ",
        characters.line,
        characters.line,
        ..." Prices ",
        characters.line,
        characters.line,
    ]);
    ctx.print();

    const printPrice = (min: number, price: number) =>
        ctx.print([
            ..." ",
            characters.brick,
            ...(brickType > min ? " - OWNED" : ` - lvl. ${price}`),
        ]);

    ctx.fg(7);
    printPrice(-1, 0);

    ctx.fg(9);
    printPrice(0, 10);

    ctx.fg(4);
    printPrice(1, 15);

    ctx.fg(10);
    printPrice(2, 20);

    ctx.fg(13);
    printPrice(3, 30);

    ctx.effect(async () => {
        await wait(30);
    });

    ctx.loop(async () => {
        if (await ctx.button()) {
            await wait(30);
            ctx.setRoom(TitleRoom);
        }
    });
};

export default TitleRoom;
