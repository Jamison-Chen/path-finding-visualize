import Cell from "./cell.js";
import Graph from "./graph.js";

interface MazeNode {
    id: string;
    isWall: boolean;
    position: { row: number; col: number };
}

export default class Maze {
    public static createMaze(grid: Cell[][]): Cell[][] {
        // Initialize wall of maze
        for (let row of grid) {
            for (let cell of row) {
                if (cell.position.row % 2 !== 0) cell.setWall();
                else if (cell.position.col % 2 !== 0) cell.setWall();
            }
        }

        return Maze.pruneMazeWall(Maze.wilsonMazeGraph(grid), grid);
    }

    private static wilsonMazeGraph(grid: any[][]): Graph<MazeNode> {
        let mazeGrid: MazeNode[][] = [];

        for (let i = 0; i < (grid.length + 1) / 2; i++) {
            let row: MazeNode[] = [];
            for (let j = 0; j < (grid[0].length + 1) / 2; j++) {
                row.push({
                    id: `(${i},${j})`,
                    isWall: false,
                    position: { row: i, col: j },
                });
            }
            mazeGrid.push(row);
        }

        let mazeNodes: MazeNode[] = mazeGrid.flat();
        let mazeGraph = new Graph(mazeGrid);
        let UST: MazeNode[] = [mazeNodes.shift()!];
        while (mazeNodes.length > 0) {
            let currentNode: MazeNode = mazeNodes.shift()!;
            let path: MazeNode[] = [currentNode];
            let tempNode: MazeNode = currentNode;

            // Random Walk
            while (!UST.some((node) => node.id === tempNode.id)) {
                const randomIdx: number =
                    (Object.keys(mazeGraph.graph[tempNode.id].neighbors)
                        .length *
                        Math.random()) <<
                    0;
                const randomNeighbor = Object.values(
                    mazeGraph.graph[tempNode.id].neighbors
                )[randomIdx].node;
                path.push(randomNeighbor);
                tempNode = randomNeighbor;
            }

            // Remove the looped parts of the path
            for (let i = 0; i < path.length; i++) {
                for (let j = path.length - 1; j > i; j--) {
                    if (path[j].id === path[i].id) {
                        path.splice(i + 1, j - i);
                        break;
                    }
                }
            }

            for (let i = 0; i < path.length; i++) {
                mazeNodes = mazeNodes.filter((node) => node.id !== path[i].id);
                if (i !== path.length - 1) {
                    mazeGraph.graph[path[i].id].neighbors[
                        path[i + 1].id
                    ].cost = 0;
                    mazeGraph.graph[path[i + 1].id].neighbors[
                        path[i].id
                    ].cost = 0;
                    UST.push(path[i]);
                }
            }
        }
        return mazeGraph;
    }

    private static pruneMazeWall(
        mazeGraph: Graph<MazeNode>,
        grid: Cell[][]
    ): Cell[][] {
        for (let i in mazeGraph.graph) {
            for (let j in mazeGraph.graph[i].neighbors) {
                if (mazeGraph.graph[i].neighbors[j].cost === 0) {
                    let iPlusJ = {
                        row:
                            mazeGraph.graph[i].node.position.row +
                            mazeGraph.graph[i].neighbors[j].node.position.row,
                        col:
                            mazeGraph.graph[i].node.position.col +
                            mazeGraph.graph[i].neighbors[j].node.position.col,
                    };

                    if (
                        iPlusJ.row < grid.length &&
                        iPlusJ.col < grid[0].length &&
                        !grid[iPlusJ.row][iPlusJ.col].isTarget &&
                        !grid[iPlusJ.row][iPlusJ.col].isSource
                    ) {
                        grid[iPlusJ.row][iPlusJ.col].setBlank();
                    }
                }
            }
        }
        return grid;
    }
}
