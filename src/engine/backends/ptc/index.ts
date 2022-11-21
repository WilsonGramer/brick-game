import { Scene, Palette } from "fastiles";
import { GameBackend, GameInput, Music, Room, run as runGame } from "../../index";
import font from "./assets/font.png";

export const width = 32;
export const height = 24;

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

export const run = async (room: Room, input: GameInput, element: HTMLElement) => {
    const fontImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = font;
    });

    const scene = new Scene({
        tileSize: [8, 8],
        tileCount: [width, height],
        font: fontImage,
    });

    scene.palette = palette;

    scene.node.style.visibility = "hidden";
    element.appendChild(scene.node);

    let audio: HTMLAudioElement | null = null;
    let prevMusic: Music | null = null;

    const backend: GameBackend = {
        width,
        height,
        render: async ({ text, music }) => {
            scene.node.style.visibility = "visible";

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const character = text[y * width + x];
                    scene.draw([x, y], character.glyph, character.fg, character.bg);
                }
            }

            if (music) {
                if (!music.equals(prevMusic)) {
                    audio?.pause();

                    const src = (
                        await import(
                            /* webpackInclude: /\.m4a$/ */
                            /* webpackChunkName: "ptc-audio" */
                            /* webpackMode: "lazy" */
                            /* webpackPrefetch: true */
                            /* webpackPreload: true */
                            `./assets/audio/${music.song}.m4a`
                        )
                    ).default;

                    audio = new Audio(src);
                    audio.loop = music.loop;
                    audio.play();
                }
            } else {
                audio?.pause();
                audio = null;
            }

            prevMusic = music;
        },
    };

    runGame(room, input, backend);
};
