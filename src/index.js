import { Scene, Palette } from "fastiles";
import sample from "lodash/sample";
import font from "../assets/ptcfont.png";

const palette = new Palette();
palette.add("rgb(255, 255, 255)");
palette.add("rgb(0, 0, 0)");
palette.add("rgb(189, 189, 189)");
palette.add("rgb(253, 231, 2)");
palette.add("rgb(81, 247, 22)");
palette.add("rgb(35, 123, 0)");
palette.add("rgb(251, 206, 165)");
palette.add("rgb(249, 165, 3)");
palette.add("rgb(148, 90, 41)");
palette.add("rgb(58, 189, 255)");
palette.add("rgb(123, 58, 255)");
palette.add("rgb(6, 57, 247)");
palette.add("rgb(246, 90, 185)");
palette.add("rgb(245, 24, 5)");
palette.add("rgb(57, 57, 57)");
palette.add("rgb(239, 239, 239)");

class Game {
    static async withDimensions(width, height) {
        const fontImage = new Image();

        await new Promise((resolve) => {
            fontImage.onload = resolve;
            fontImage.src = font;
        });

        const scene = new Scene({
            tileSize: [8, 8],
            tileCount: [width, height],
            font: fontImage,
        });

        scene.palette = palette;

        document.body.appendChild(scene.node);

        return new Game(scene, width, height);
    }

    scene;
    width;
    height;
    x;
    y;
    bgColor;
    fgColor;

    constructor(scene, width, height) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.locate(0, 0);
        this.bg(1);
        this.fg(15);
        this.cls();
    }

    locate(x, y) {
        this.x = x;
        this.y = y;
    }

    render(glyph) {
        this.scene.draw([this.x, this.y], glyph, this.fgColor, this.bgColor);
        this.x++;
    }

    cls() {
        for (var i = 0; i < this.width * this.height; i++) {
            this.render(0);
        }

        this.locate(0, 0);
    }

    bg(color) {
        this.bgColor = color;
    }

    fg(color) {
        this.fgColor = color;
    }

    print(s = [], newline = true) {
        if (typeof s === "string") {
            s = [...s];
        }

        for (let c of s) {
            console.warn(c);

            switch (typeof c) {
                case "string":
                    c = c.charCodeAt(0);
                    break;
                case "number":
                    break;
                default:
                    throw new Error("invalid character; expected string or number");
            }

            this.render(c);
        }

        if (newline) {
            this.x = 0;
            this.y++;
        }
    }

    printTemplate(s, replacement, newline = true) {
        if (typeof s !== "string") {
            throw new Error("expected string");
        }

        this.print(
            [...s].map((c) => (c === " " ? " " : replacement)),
            newline
        );
    }
}

window.onload = async () => {
    const game = await Game.withDimensions(32, 24);

    const brick = 3;
    const face = 8;

    game.fg(8);
    game.print(new Array(game.width).fill(brick));
    game.print(new Array(game.width).fill(brick));
    game.print();
    game.fg(13);
    game.print("     (C) 2014 Wilson Gramer");
    game.fg(7);

    game.printTemplate("     XXXXXX XXXX X XXX X  X", brick);
    game.printTemplate("     X    X X  X X X   X X", brick);
    game.printTemplate("     X    X X  X X X   XX", brick);
    game.printTemplate("     XXXXX  X  X X X   XX", brick);
    game.printTemplate("     X    X XXXX X X   X X", brick);
    game.printTemplate("     X    X X X  X X   X  X", brick);
    game.printTemplate("     XXXXXX X  X X XXX X   X", brick);
    game.print();
    game.printTemplate("      XXXX XXXXX XXXXX XXXX", brick);
    game.printTemplate("      X    X   X X X X X", brick);
    game.printTemplate("      X    X   X X X X X", brick);
    game.printTemplate("      X XX XXXXX X X X XXXX", brick);
    game.printTemplate("      X  X X   X X   X X", brick);
    game.printTemplate("      XXXX X   X X   X XXXX", brick);
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
    game.print(new Array(game.width).fill(brick));
    game.print(new Array(game.width).fill(brick));
};
