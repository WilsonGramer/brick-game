import { Scene, Palette } from "fastiles";
import { useEffect, useRef, useState } from "react";

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

export interface GameConfig {
    width: number;
    height: number;
    font?: {
        src: string;
        tileSize: [number, number];
    };
}

const defaultFont: GameConfig["font"] = {
    src: "/font/ptc.png",
    tileSize: [8, 8],
};

const runGame = async (
    element: HTMLElement,
    config: GameConfig,
    run: (game: GameState) => void
) => {
    const font = config.font ?? defaultFont;

    const fontImage = await new Promise<HTMLImageElement>((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.src = font.src;
    });

    const scene = new Scene({
        tileSize: font.tileSize,
        tileCount: [config.width, config.height],
        font: fontImage,
    });

    scene.palette = palette;

    element.appendChild(scene.node);

    const game = new GameState(scene, config.width, config.height);

    run(game);
};

export class GameState {
    private scene: Scene;
    private width: number;
    private height: number;
    private x: number;
    private y: number;
    private bgColor: number;
    private fgColor: number;
    private audio: HTMLAudioElement | null;

    constructor(scene: Scene, width: number, height: number) {
        this.scene = scene;
        this.width = width;
        this.height = height;
        this.x = 0;
        this.y = 0;
        this.bgColor = 1;
        this.fgColor = 15;
        this.audio = null;
    }

    locate(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    render(glyph: number) {
        this.scene.draw([this.x, this.y], glyph, this.fgColor, this.bgColor);
        this.x++;
    }

    cls() {
        this.locate(0, 0);

        for (var i = 0; i < this.width * this.height; i++) {
            this.render(0);
        }

        this.locate(0, 0);
    }

    bg(color: number) {
        this.bgColor = color;
    }

    fg(color: number) {
        this.fgColor = color;
    }

    print(s: string | number | (string | number)[] = [], newline = true) {
        if (typeof s === "string") {
            s = [...s];
        } else if (typeof s === "number") {
            s = [s];
        }

        for (let c of s) {
            switch (typeof c) {
                case "string":
                    if (c.length !== 1) {
                        throw new Error("invalid character");
                    }

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

    printf(s: string, replacement: string | number, newline = true) {
        this.print(
            [...s].map((c) => (c === " " ? " " : replacement)),
            newline
        );
    }

    play(n: number, loop: boolean) {
        this.stop();
        this.audio = new Audio(`/audio/${n}.m4a`);
        this.audio.loop = loop;
        this.audio.play();
    }

    stop() {
        if (!this.audio) {
            return;
        }

        this.audio.pause();
        this.audio = null;
    }

    button() {
        const gamepadMap = [
            32, // B
            16, // A
            128, // Y
            64, // X
            256, // L
            512, // R
            256, // L
            512, // R
            1024, // START
            1024, // START
            0, // (stick pressed)
            0, // (stick pressed)
            1, // Up
            2, // Down
            4, // Left
            8, // Right
            0, // (middle button)
        ];

        for (const gamepad of navigator.getGamepads()) {
            if (!gamepad || gamepad.mapping !== "standard") {
                continue;
            }

            for (let button = 0; button < gamepad.buttons.length; button++) {
                if (gamepad.buttons[button].pressed) {
                    return gamepadMap[button] ?? 0;
                }
            }
        }

        return 0;
    }
}

export const Game = (props: { config: GameConfig; onStart: (game: GameState) => void }) => {
    const element = useRef<HTMLDivElement>(null);

    const [started, setStarted] = useState(false);

    useEffect(() => {
        const update = () => {
            const gamepads = navigator.getGamepads();

            for (let gamepadIndex = 0; gamepadIndex < gamepads.length; gamepadIndex++) {
                const gamepad = gamepads[gamepadIndex];

                if (!gamepad || gamepad.mapping !== "standard") {
                    continue;
                }

                for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
                    const button = gamepad.buttons[buttonIndex];

                    if (button.pressed) {
                        const update = () => {
                            const gamepads = navigator.getGamepads();

                            if (!gamepads[gamepadIndex]!.buttons[buttonIndex].pressed) {
                                setStarted(true);
                                return;
                            }

                            requestAnimationFrame(update);
                        };

                        update();

                        return;
                    }
                }
            }

            requestAnimationFrame(update);
        };

        update();
    }, []);

    useEffect(() => {
        if (started) {
            document.documentElement.requestFullscreen({ navigationUI: "hide" });
            runGame(element.current!, props.config, props.onStart);
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
            <p style={{ color: "white" }}>Connect a controller and press any button to start</p>
        </div>
    );
};
