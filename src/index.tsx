import * as ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./assets/global.css";
import { BrickGame, RoadRage } from "./games";

const App = () => (
    <BrowserRouter>
        <Routes>
            <Route path="/">
                <Route index element={<GameList />} />
                <Route path="brick-game" element={<BrickGame />} />
                <Route path="road-rage" element={<RoadRage />} />
            </Route>
        </Routes>
    </BrowserRouter>
);

const GameList = () => (
    <div className="game-list">
        <Link to="/brick-game">Brick Game</Link>
        <Link to="/road-rage">Road Rage</Link>
    </div>
);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
