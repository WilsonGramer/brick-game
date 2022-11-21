import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import * as engine from "./engine";
import TitleRoom from "./game";
import controller from "./assets/controller.svg";
import "./assets/global.css";

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
            if (process.env.NODE_ENV !== "development") {
                document.documentElement.requestFullscreen({ navigationUI: "hide" });
            }

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
