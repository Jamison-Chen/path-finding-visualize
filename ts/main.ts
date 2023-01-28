import Cell from "./cell.js";
import Graph from "./graph.js";
import Maze from "./maze.js";

class Main {
    private static PANEL: HTMLElement = document.getElementById("panel")!;
    private static CLEAR_BOARD_BUTTON: HTMLButtonElement =
        document.getElementById("clear-board-btn") as HTMLButtonElement;
    private static HIDE_RESULT_BUTTON: HTMLButtonElement =
        document.getElementById("hide-result-btn") as HTMLButtonElement;
    private static RUN_BUTTON: HTMLButtonElement = document.getElementById(
        "run-btn"
    ) as HTMLButtonElement;
    private static MAZE_BUTTON: HTMLButtonElement = document.getElementById(
        "maze-btn"
    ) as HTMLButtonElement;

    private static numOfColumns: number;
    private static numOfRows: number;
    private static isMousePressed: boolean = false;
    private static isMovingSource: boolean = false;
    private static isMovingTarget: boolean = false;
    private static grid: Cell[][];
    private static graph: Graph<Cell>;
    private static source: Cell;
    private static target: Cell;
    private static pathFromSourceTo: { [id: string]: Cell[] };
    private static distanceFromSourceTo: { [id: string]: number };

    public static main(): void {
        Main.initBoard();

        // Add all event listener
        document.addEventListener("mouseup", Main.onMouseUp);
        Main.CLEAR_BOARD_BUTTON.onclick = Main.initBoard;
        Main.HIDE_RESULT_BUTTON.onclick = Main.hideResult;
        Main.MAZE_BUTTON.onclick = Main.onClickCreateMaze;
        Main.HIDE_RESULT_BUTTON.innerText = "Hide Result";
        Main.RUN_BUTTON.onclick = Main.onClickRun;
    }

    private static initBoard() {
        Main.HIDE_RESULT_BUTTON.disabled = true;

        Main.PANEL.innerHTML = "";
        if (Main.grid) Main.grid.length = 0;
        Main.grid = [];

        Main.numOfRows = Math.floor((Main.PANEL.clientHeight - 30) / 15);
        Main.numOfColumns = Math.floor((Main.PANEL.clientWidth - 30) / 15);

        let cellSideLength = 100 / Main.numOfColumns;
        for (let i = 0; i < Main.numOfRows; i++) {
            let rowDiv = document.createElement("div");
            rowDiv.className = "row";
            Main.grid[i] = [];
            for (let j = 0; j < Main.numOfColumns; j++) {
                const cell = new Cell(i, j, cellSideLength);
                rowDiv.appendChild(cell.div);
                Main.grid[i][j] = cell;
                cell.div.onmouseenter = Main.onMouseEnter(cell);
                cell.div.onmousedown = Main.onMouseDownOnCell(cell);
            }
            Main.PANEL.appendChild(rowDiv);
        }

        // Initialize source and target
        Main.source = Main.grid[0][0].setSource();
        Main.target =
            Main.grid[Main.grid.length - 1][
                Main.grid[0].length - 1
            ].setTarget();
    }

    private static onMouseUp = (): void => {
        Main.isMousePressed = false;
        if (Main.isMovingTarget) Main.isMovingTarget = false;
        if (Main.isMovingSource) Main.isMovingSource = false;
    };

    private static onMouseEnter = (cell: Cell): EventListener => {
        return (): void => {
            if (Main.isMousePressed) {
                if (!Main.isMovingTarget && !Main.isMovingSource) {
                    cell.setWall();
                } else {
                    if (Main.isMovingSource && !cell.isTarget) {
                        Main.source.backToStoredState();
                        cell.storeState();
                        Main.source = cell.setSource();
                    } else if (Main.isMovingTarget && !cell.isSource) {
                        Main.target.backToStoredState();
                        cell.storeState();
                        Main.target = cell.setTarget();
                        if (
                            Main.pathFromSourceTo &&
                            Main.pathFromSourceTo[Main.target.id]
                        ) {
                            Main.clearPath();
                            Main.showPath(
                                Main.pathFromSourceTo[Main.target.id],
                                true
                            );
                        }
                    }
                }
            }
        };
    };

    private static onMouseDownOnCell = (cell: Cell): EventListener => {
        return (): void => {
            Main.isMousePressed = true;
            cell.setWall();
            if (cell.isSource) Main.isMovingSource = true;
            else if (cell.isTarget) Main.isMovingTarget = true;
        };
    };

    private static onClickCreateMaze() {
        Main.initBoard();
        Main.grid = Maze.createMaze(Main.grid);
    }

    private static hideResult() {
        for (let row of Main.grid) {
            for (let cell of row) {
                if (!cell.isSource && !cell.isTarget && !cell.isWall) {
                    cell.div.classList.add("hide");
                }
            }
        }
        Main.HIDE_RESULT_BUTTON.onclick = Main.showResult;
        Main.HIDE_RESULT_BUTTON.innerHTML = "Show Result";
    }

    private static showResult() {
        for (let row of Main.grid) {
            for (let cell of row) {
                if (!cell.isSource && !cell.isTarget && !cell.isWall) {
                    cell.div.classList.remove("hide");
                }
            }
        }
        Main.HIDE_RESULT_BUTTON.onclick = Main.hideResult;
        Main.HIDE_RESULT_BUTTON.innerHTML = "Hide Result";
    }

    private static onClickRun = async (): Promise<void> => {
        // Clear explore history
        for (let row of Main.grid) {
            for (let cell of row) {
                if (cell.isExplored) cell.setUnexplored();
            }
        }

        // Remove all event listener
        document.removeEventListener("mouseup", Main.onMouseUp);
        Main.CLEAR_BOARD_BUTTON.disabled = true;
        Main.RUN_BUTTON.disabled = true;
        Main.HIDE_RESULT_BUTTON.disabled = true;
        Main.MAZE_BUTTON.disabled = true;
        for (let row of Main.grid) {
            for (let cell of row) {
                cell.div.onmouseenter = null;
                cell.div.onmousedown = null;
            }
        }

        Main.graph = new Graph(Main.grid);

        //Iterative Approach
        // let dijkstraResult = dijkstra2([6, 1], [2, 2]);

        //Recursive Approach
        await Main.dijkstra();

        await Main.showPath(Main.pathFromSourceTo[Main.target.id]);

        // Reset all event listener
        document.addEventListener("mouseup", Main.onMouseUp);
        Main.CLEAR_BOARD_BUTTON.disabled = false;
        Main.RUN_BUTTON.disabled = false;
        Main.HIDE_RESULT_BUTTON.disabled = false;
        Main.MAZE_BUTTON.disabled = false;
        for (let row of Main.grid) {
            for (let cell of row) {
                cell.div.onmouseenter = Main.onMouseEnter(cell);
                cell.div.onmousedown = Main.onMouseDownOnCell(cell);
            }
        }
    };

    // Recursive Approach
    private static dijkstra(
        unsolvedCells: Cell[] = Main.prepareForDijkstra()
    ): Promise<void> {
        return new Promise((resolve) => {
            let minUnsolvedDistance: number = Infinity;
            for (let cell of unsolvedCells) {
                minUnsolvedDistance = Math.min(
                    minUnsolvedDistance,
                    Main.distanceFromSourceTo[cell.id]
                );
            }

            let ws: Cell[] = unsolvedCells.filter(
                (cell) =>
                    Main.distanceFromSourceTo[cell.id] === minUnsolvedDistance
            );

            if (minUnsolvedDistance < Infinity && ws.length > 0) {
                for (let w of ws) {
                    unsolvedCells = unsolvedCells.filter((c) => c.id !== w!.id);
                    if (w.isTarget) {
                        resolve();
                        return; // Used for breaking the recursion.
                    } else {
                        w.setExplored();
                        for (let v of Object.values(
                            Main.graph.graph[w.id].neighbors
                        ).map((e) => e.node)) {
                            if (
                                unsolvedCells.some((cell) => cell.id === v.id)
                            ) {
                                let oldDistance =
                                    Main.distanceFromSourceTo[v.id];
                                Main.distanceFromSourceTo[v.id] = Math.min(
                                    oldDistance,
                                    minUnsolvedDistance +
                                        Main.graph.getCost(w, v)
                                );
                                if (
                                    Main.distanceFromSourceTo[v.id] !==
                                    oldDistance
                                ) {
                                    Main.pathFromSourceTo[v.id] = [
                                        ...Main.pathFromSourceTo[w.id],
                                        v,
                                    ];
                                }
                            }
                        }
                    }
                }
                if (unsolvedCells.length > 0) {
                    setTimeout(() => resolve(Main.dijkstra(unsolvedCells)));
                } else {
                    resolve();
                    return; // Used for breaking the recursion.
                }
            } else {
                // Target is not found after exploring all reachable area.
                resolve();
                return; // Used for breaking the recursion.
            }
        });
    }

    private static prepareForDijkstra(): Cell[] {
        let unsolvedCells: Cell[] = [...Main.grid.flat()].filter(
            (cell) => cell.id !== Main.source.id
        );

        Main.pathFromSourceTo = { [Main.source.id]: [Main.source] };
        Main.distanceFromSourceTo = { [Main.source.id]: 0 };

        unsolvedCells.forEach((cell) => {
            Main.distanceFromSourceTo[cell.id] = Main.graph.getCost(
                cell,
                this.source
            );
            Main.pathFromSourceTo[cell.id] = [Main.source, cell];
        });
        return unsolvedCells;
    }

    private static showPath(
        path: Cell[],
        instant: boolean = false,
        idx: number = 0
    ): Promise<void> | void {
        if (instant) {
            for (let cell of path) {
                if (!cell.isSource && !cell.isTarget) cell.setShortestPath();
            }
        } else {
            // Recursive
            // Return promise to make the UI stay freezed before showing the whole path.
            return new Promise((resolve) => {
                if (idx < path.length) {
                    let cell: Cell = path[idx];
                    if (!cell.isSource && !cell.isTarget) {
                        cell.setShortestPath();
                    }
                    setTimeout(
                        () => resolve(Main.showPath(path, instant, idx + 1)),
                        5
                    );
                } else resolve();
            });
        }
    }

    private static clearPath(): void {
        for (let row of Main.grid) {
            for (let cell of row) {
                if (cell.isShortestPath) {
                    if (cell.isExplored) cell.setExplored();
                }
            }
        }
    }
}

Main.main();

// Iterative Approach
// function dijkstra2(src, dest = null) {
//     let distanceFromSourceTo = {};
//     let pathFromSourceTo = {};
//     pathFromSourceTo[src] = [src];
//     let unsolved = JSON.parse(JSON.stringify(allCells));
//     unsolved = unsolved.filter((item) => item !== src);
//     unsolved.forEach(function (each) {
//         if (graph.graph[each][src] !== 0) {
//             distanceFromSourceTo[each] = graph.graph[each][src];
//             pathFromSourceTo[each] = [src, each];
//         } else {
//             distanceFromSourceTo[each] = Infinity;
//         }
//     });
//     distanceFromSourceTo[src] = 0;
//     // let end = new Date().getTime() + 6000;
//     // let frame = 1000 / 300; //30ps
//     // (function loop() {
//     //     let now = new Date().getTime();
//     //     let countend = now + frame;

//     while (unsolved.length !== 0) {
//         // && new Date().getTime() < countend
//         let minD = Infinity;
//         let w = null;
//         unsolved.forEach(function (each) {
//             if (distanceFromSourceTo[each] < minD) {
//                 w = each;
//                 minD = distanceFromSourceTo[w];
//             }
//         });
//         if (w !== null) {
//             unsolved = unsolved.filter((item) => item !== w);
//             grid[w[0]][w[1]].isExplored = true;
//             document.getElementById(`(${w[0]},${w[1]})`).style.backgroundColor =
//                 exploredColor;
//         } else {
//             break;
//         }
//         for (let v in graph.graph[w]) {
//             if (graph.graph[w][v] !== 0 && unsolved.some((x) => x === v)) {
//                 let prev = distanceFromSourceTo[v];
//                 distanceFromSourceTo[v] = Math.min(
//                     prev,
//                     minD + graph.getCost(w, v)
//                 );
//                 if (distanceFromSourceTo[v] !== prev) {
//                     let newPath = JSON.parse(
//                         JSON.stringify(pathFromSourceTo[w])
//                     );
//                     newPath.push([v[0], v[1]]);
//                     pathFromSourceTo[v] = newPath;
//                 }
//             }
//         }
//     }
//     //     if (now < end) {
//     //         window.requestAnimationFrame(loop);
//     //     }

//     // })();
//     if (dest !== null) {
//         try {
//             return {
//                 shortestD: distanceFromSourceTo[dest],
//                 shortestPathFromSourceTo: pathFromSourceTo[dest],
//             };
//         } catch (e) {
//             console.log("Unreachable Destination");
//             return {
//                 shortestD: Infinity,
//                 shortestPathFromSourceTo: [src],
//             };
//         }
//     }
//     return {
//         shortestD: distanceFromSourceTo,
//         shortestPathFromSourceTo: pathFromSourceTo,
//     };
// }
