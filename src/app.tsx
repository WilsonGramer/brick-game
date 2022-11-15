import { sample, random } from "lodash";
import { Game, GameConfig, GameState } from "./game";

const gameConfig: GameConfig = {
    width: 32,
    height: 24,
};

const fps = 60;
const interval = 1000 / fps;

export const App = () => <Game config={gameConfig} onStart={frame} />;

const setIntervalLoop = async (callback: () => Promise<unknown>, ms: number) => {
    const start = new Date().valueOf();
    if (await callback()) {
        const time = new Date().valueOf() - start;
        setTimeout(() => setIntervalLoop(callback, ms), Math.max(ms - time, 0));
    }
};

const wait = (frames: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, frames * interval));

const frame = async (game: GameState) => {
    const brick = 3;
    const face = 8;
    const house = 232;

    let label = "title";
    let x = 15;
    let y = 15;
    let stage = 0;
    let status: string;
    setIntervalLoop(async () => {
        goto: switch (label) {
            case "title":
                game.cls();
                game.play(21, true);

                game.fg(8);
                game.print(new Array(gameConfig.width).fill(brick));
                game.print(new Array(gameConfig.width).fill(brick));
                game.print();
                game.fg(13);
                game.print("     (C) 2014 Wilson Gramer");
                game.fg(7);

                game.printf("     XXXXXX XXXX X XXX X  X", brick);
                game.printf("     X    X X  X X X   X X", brick);
                game.printf("     X    X X  X X X   XX", brick);
                game.printf("     XXXXX  X  X X X   XX", brick);
                game.printf("     X    X XXXX X X   X X", brick);
                game.printf("     X    X X X  X X   X  X", brick);
                game.printf("     XXXXXX X  X X XXX X   X", brick);
                game.print();
                game.printf("      XXXX XXXXX XXXXX XXXX", brick);
                game.printf("      X    X   X X X X X", brick);
                game.printf("      X    X   X X X X X", brick);
                game.printf("      X XX XXXXX X X X XXXX", brick);
                game.printf("      X  X X   X X   X X", brick);
                game.printf("      XXXX X   X X   X XXXX", brick);
                game.print();

                const titleText = sample([
                    "      GET THE RIGHT BRICK!",
                    "        IT'S ADDICTIVE!",
                    [..."      MADE BY WILSONATOR! ", face],
                ]);

                game.fg(9);
                game.print(titleText);
                game.print("        Push any button");
                game.print();

                game.fg(8);
                game.print(new Array(gameConfig.width).fill(brick));
                game.print(new Array(gameConfig.width).fill(brick));

                game.fg(0);

                label = "init";
                break goto;
            case "init":
                if (game.button() !== 0) {
                    label = "start2";
                    break goto;
                }

                label = "init";
                break goto;
            case "start2":
                game.cls();
                game.stop();
                game.locate(10, 12);
                game.print("HERE WE GO!");

                label = "start1";
                break goto;
            case "start":
                game.cls();
                game.stop();
                game.locate(10, 12);
                game.print("NEXT STAGE!");

                label = "start1";
                break goto;
            case "start1":
                await wait(180);
                game.play(27, true);
                x = 15;
                y = 15;

                label = "rnd";
                break goto;
            case "bg":
                game.cls();
                game.fg(8);
                game.print([house, ...new Array(gameConfig.width - 1).fill(brick)]);
                game.print(new Array(gameConfig.width).fill(brick));
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.fg(7);
                game.print([..."         ", brick, ..."      ", brick]);
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.print();
                game.print("        TOUCH A BRICK...");
                game.locate(0, 22);
                game.fg(0);
                game.print(`SCORE: ${stage}`);
                game.locate(x, y);
                game.fg(13);
                game.print(face);
                game.fg(0);

                label = "game";
                break goto;
            case "game":
                switch (game.button()) {
                    case 1:
                        label = "up";
                        break goto;
                    case 2:
                        label = "down";
                        break goto;
                    case 4:
                        label = "left";
                        break goto;
                    case 8:
                        label = "right";
                        break goto;
                }

                if ((x == 9 || x == 16) && y == 7) {
                    label = "brick1";
                    break goto;
                }

                label = "game";
                break goto;
            case "up":
                await wait(10);
                y -= 1;

                label = "bg";
                break goto;
            case "down":
                await wait(10);
                y += 1;

                label = "bg";
                break goto;
            case "left":
                await wait(10);
                x -= 1;

                label = "bg";
                break goto;
            case "right":
                await wait(10);
                x += 1;

                label = "bg";
                break goto;
            case "rnd":
                game.cls();

                if (random(2)) {
                    label = "yes";
                    break goto;
                } else {
                    label = "no";
                    break goto;
                }
            case "yes":
                status = "CLEAR!";

                label = "bg";
                break goto;
            case "no":
                status = "GAME OVER";

                label = "bg";
                break goto;
            case "brick1":
                if (status === "CLEAR!") {
                    label = "clear";
                    break goto;
                } else {
                    label = "gOver";
                    break goto;
                }
            case "clear":
                game.play(15, true);
                game.cls();
                game.locate(12, 12);
                game.print("CLEAR!");
                stage += 1;
                x = 15;
                y = 15;

                label = "clear1";
                break goto;
            case "clear1":
                if (game.button() !== 0) {
                    label = "start";
                    break goto;
                } else {
                    label = "clear1";
                    break goto;
                }
            case "gOver":
                game.play(6, false);
                game.cls();
                game.locate(12, 12);
                game.print("GAME OVER");
                stage = 0;
                x = 15;
                y = 15;

                label = "gOver1";
                break goto;
            case "gOver1":
                if (game.button() !== 0) {
                    label = "title1";
                    break goto;
                } else {
                    label = "gOver1";
                    break goto;
                }
            case "title1":
                await wait(40);

                label = "title";
                break goto;
        }

        return true;
    }, interval);
};
