export default class Cell {
    private storedState: {
        isWall: boolean;
        isSource: boolean;
        isTarget: boolean;
        isExplored: boolean;
        isShortestPath: boolean;
    };
    public isWall: boolean;
    public isSource: boolean;
    public isTarget: boolean;
    public isExplored: boolean;
    public isShortestPath: boolean;
    public div: HTMLElement;

    public constructor(rowNum: number, colNum: number, sideLengeh: number) {
        this.storedState = {
            isWall: false,
            isSource: false,
            isTarget: false,
            isExplored: false,
            isShortestPath: false,
        };
        this.isWall = false;
        this.isSource = false;
        this.isTarget = false;
        this.isExplored = false;
        this.isShortestPath = false;
        this.div = document.createElement("div");
        this.div.id = `(${rowNum},${colNum})`;
        this.div.className = "cell";
        this.div.style.width = `${sideLengeh}%`;
    }
    public get id(): string {
        return this.div.id;
    }
    public get position(): { row: number; col: number } {
        const pos = this.div.id.replace(/\(+|\)+/g, "").split(",");
        return { row: parseInt(pos[0]), col: parseInt(pos[1]) };
    }
    public setBlank(): void {
        this.isWall = false;
        this.isSource = false;
        this.isTarget = false;
        this.isExplored = false;
        this.isShortestPath = false;
        this.div.classList.remove(
            "wall",
            "target",
            "explored",
            "source",
            "path"
        );
    }
    public setSource(): Cell {
        this.isWall = false;
        this.isSource = true;
        this.isTarget = false;
        this.isExplored = false;
        this.isShortestPath = false;
        this.div.classList.remove("wall", "target", "explored", "path");
        this.div.classList.add("source");
        return this;
    }
    public setTarget(): Cell {
        this.isWall = false;
        this.isSource = false;
        this.isTarget = true;
        this.isExplored = false;
        this.isShortestPath = false;
        this.div.classList.remove("wall", "source", "explored", "path");
        this.div.classList.add("target");
        return this;
    }
    public setExplored(): void {
        if (!this.isWall && !this.isSource && !this.isTarget) {
            this.isShortestPath = false;
            this.isExplored = true;
            this.div.classList.remove("wall", "source", "target", "path");
            this.div.classList.add("explored");
        }
    }
    public setUnexplored(): void {
        if (!this.isWall && !this.isSource && !this.isTarget) this.setBlank();
    }
    public setShortestPath(): void {
        if (!this.isWall && !this.isSource && !this.isTarget) {
            this.isShortestPath = true;
            this.div.classList.remove("wall", "source", "target", "explored");
            this.div.classList.add("path");
        }
    }
    public setWall(): void {
        if (!this.isSource && !this.isTarget) {
            this.isShortestPath = false;
            this.isExplored = false;
            this.isWall = !this.isWall;
            if (this.isWall) {
                this.div.classList.remove(
                    "explored",
                    "source",
                    "target",
                    "path"
                );
                this.div.classList.add("wall");
            } else this.div.classList.remove("wall");
        }
    }
    public storeState(): void {
        this.storedState = {
            isWall: this.isWall,
            isSource: this.isSource,
            isTarget: this.isTarget,
            isExplored: this.isExplored,
            isShortestPath: this.isShortestPath,
        };
    }
    public backToStoredState(): void {
        this.div.classList.remove(
            "target",
            "source",
            "explored",
            "wall",
            "path"
        );
        if (this.storedState.isWall) this.div.classList.add("wall");
        else if (this.storedState.isSource) this.div.classList.add("source");
        else if (this.storedState.isTarget) this.div.classList.add("target");
        else if (this.storedState.isExplored) {
            this.div.classList.add("explored");
        } else if (this.storedState.isShortestPath) {
            this.div.classList.add("path");
        }
        this.isWall = this.storedState.isWall;
        this.isSource = this.storedState.isSource;
        this.isTarget = this.storedState.isTarget;
        this.isExplored = this.storedState.isExplored;
        this.isShortestPath = this.storedState.isShortestPath;
    }
}
