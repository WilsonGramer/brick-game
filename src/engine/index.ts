export * as inputs from "./inputs";
export * as backends from "./backends";

import _, { cloneDeep, isEqual } from "lodash";
import { Queue } from "typescript-collections";

export type Room = (ctx: GameContext) => Promise<void>;

export interface GameInput {
    button: () => Promise<number>;
}

export interface GameBackend {
    width: number;
    height: number;
    render: (game: RenderedGame) => Promise<void>;
}

export interface RenderedGame {
    text: Character[];
    music: Music | null;
}

export class Character {
    public static empty = new Character(0, 0, 1);

    public constructor(public glyph: number, public fg: number, public bg: number) {}
}

export class Music {
    public constructor(public song: number, public loop: boolean) {}

    public equals(other: Music | null): boolean {
        if (!other) return false;

        return this.song === other.song && this.loop === other.loop;
    }
}

type Event =
    | { type: "update"; render: boolean }
    | { type: "setRoom"; room: Room; stack: string }
    | { type: "setState"; index: number; value: any; stack: string };

export class GameContext {
    private input: GameInput;
    private backend: GameBackend;
    private renderedGame: RenderedGame;
    private room: Room;
    private events: Queue<Event>;
    private stateIndex: number;
    private states: any[];
    private effects: (() => Promise<void | (() => Promise<void>)>)[];
    private loops: (() => Promise<void>)[];
    private x: number;
    private y: number;
    private fgColor: number;
    private bgColor: number;

    public constructor(room: Room, input: GameInput, backend: GameBackend) {
        this.input = input;
        this.backend = backend;
        this.renderedGame = {
            text: new Array<Character>(backend.width * backend.height).fill(Character.empty),
            music: null,
        };
        this.room = room;
        this.events = new Queue();
        this.stateIndex = 0;
        this.states = [];
        this.effects = [];
        this.loops = [];
        this.x = 0;
        this.y = 0;
        this.fgColor = 0;
        this.bgColor = 1;
    }

    public state<T>(initialValue: T): [T, (newValue: T) => void] {
        const stateIndex = this.stateIndex;
        const update = (newValue: T) => {
            this.enqueueSignificantEvent({
                type: "setState",
                index: stateIndex,
                value: newValue,
                stack: new Error().stack!,
            });
        };

        this.stateIndex++;

        if (stateIndex < this.states.length) {
            return [this.states[stateIndex], update];
        }

        if (stateIndex !== this.states.length) {
            throw new Error("invalid state");
        }

        this.states.push(initialValue);

        return [initialValue, update];
    }

    public effect(func: () => Promise<void | (() => Promise<void>)>) {
        this.effects.push(func);
    }

    public loop(func: () => Promise<void>) {
        this.loops.push(func);
    }

    public setRoom(room: Room) {
        this.enqueueSignificantEvent({
            type: "setRoom",
            room,
            stack: new Error().stack!,
        });
    }

    public fg(color: number) {
        this.fgColor = color;
    }

    public bg(color: number) {
        this.bgColor = color;
    }

    public print(s: string | number | (string | number)[] = [], newline = true) {
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

            this.printGlyph(c);
        }

        if (newline) {
            this.x = 0;
            this.y++;
        }
    }

    public printf(s: string, replacement: string | number, newline = true) {
        this.print(
            [...s].map((c) => (c === " " ? " " : replacement)),
            newline
        );
    }

    public locate(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public printGlyph(glyph: number) {
        const character = new Character(glyph, this.fgColor, this.bgColor);
        this.renderedGame.text[this.y * this.backend.width + this.x] = character;
        this.x++;
    }

    public clear() {
        this.renderedGame.text = new Array<Character>(
            this.backend.width * this.backend.height
        ).fill(Character.empty);

        this.locate(0, 0);
    }

    public play(music: Music) {
        this.renderedGame.music = music;
    }

    public pause() {
        this.renderedGame.music = null;
    }

    public button(): Promise<number> {
        return this.input.button();
    }

    private enqueueSignificantEvent(event: Event) {
        while (this.events.peek()?.type === "update") {
            this.events.dequeue();
        }

        this.events.enqueue(event);
    }

    public async run() {
        this.events.enqueue({
            type: "update",
            render: true,
        });

        let cleanups: (() => Promise<void>)[] = [];

        const run = async () => {
            const event = this.events.dequeue();
            if (!event) return;

            let shouldRunEffects: boolean;
            let shouldRender: boolean;
            switch (event.type) {
                case "update":
                    shouldRunEffects = event.render;
                    shouldRender = event.render;
                    break;
                case "setRoom":
                    for (const func of cleanups) {
                        await func();
                    }

                    shouldRunEffects = true;
                    shouldRender = true;
                    cleanups = [];
                    this.room = event.room;
                    this.states = [];
                    break;
                case "setState":
                    shouldRunEffects = false;
                    shouldRender = true;
                    this.states[event.index] = event.value;
                    break;
            }

            if (shouldRender) {
                this.stateIndex = 0;
                this.effects = [];
                this.loops = [];
                this.x = 0;
                this.y = 0;
                this.fgColor = 0;
                this.bgColor = 1;

                await this.room(this);
                await this.backend.render(this.renderedGame);

                this.clear();
                this.pause();
            }

            if (shouldRunEffects) {
                for (const func of this.effects) {
                    const cleanup = await func();
                    if (cleanup) {
                        cleanups.push(cleanup);
                    }
                }
            }

            for (const func of this.loops) {
                await func();
            }

            if (this.loops.length > 0) {
                this.events.enqueue({
                    type: "update",
                    render: false,
                });
            }

            requestAnimationFrame(run);
        };

        run();
    }
}

export const run = (room: Room, input: GameInput, backend: GameBackend) =>
    new GameContext(room, input, backend).run();
