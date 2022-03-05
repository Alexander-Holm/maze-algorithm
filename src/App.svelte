<script>
    const DIRECTIONS = {
        UP : {x: 0, y: -1},
        DOWN : {x: 0, y: 1},
        LEFT : {x: -1, y: 0},
        RIGHT : {x: 1, y: 0},
    }
    const OPPOSITE = {
        UP: "DOWN",
        DOWN: "UP",
        LEFT: "RIGHT",
        RIGHT: "LEFT",
    }
    const DEFAULTS = {
        colors: {
            first: "#e6ffff",
            second: "#ffffff",
            border: "#000000",
        },
        speed: 150,
        size: 10,
    }

    let colors = {...DEFAULTS.colors};
    let speed = {
        min: 10,
        max: 500,
        current: DEFAULTS.speed,
    }
    let size = DEFAULTS.size;
    $: grid = createGrid(size);

    function createGrid(size){
        const grid = []
        for(let column = 0; column < size; column++){
            const row = new Array(size);
            for(let i = 0; i < size; i++){
                row[i] = {
                    visited: false,
                    walls: {
                        up: true,
                        down: true,
                        left: true,
                        right: true,
                    }
                }
            }
            grid.push(row);
        }
        return grid;
    }    

    async function move(currentX, currentY, activeGrid){
        // Avbryter om grid ändras, t.ex. byter storlek
        if(activeGrid !== grid)
            return;

        grid[currentX][currentY].visited = true;
        const randomizedDirections = shuffleArray(Object.keys(DIRECTIONS));
        for(const newDirection of randomizedDirections){
            const newX = currentX + DIRECTIONS[newDirection].x;
            const newY = currentY + DIRECTIONS[newDirection].y;
            if(isCellValid(newX, newY, activeGrid)){
                // Delay till nästa move
                await new Promise(resolve => setTimeout(resolve, speed.current));
                // Ta bort BÅDA väggarna innan nästa move,
                // för att inte behöva hålla koll på vilken den förra rutan var 
                activeGrid[currentX][currentY].walls[newDirection.toLowerCase()] = false;                
                activeGrid[newX][newY].walls[OPPOSITE[newDirection].toLowerCase()] = false;
                await move(newX, newY, activeGrid);
            }            
        }        
    }

    function isCellValid(x, y, grid){
        if(x > grid.length - 1 || x < 0)
            return false;
        if(y > grid[x].length - 1 || y < 0)
            return false;
        if(grid[x][y].visited === true)
            return false;
        return true;
    }

    // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    // answered Sep 28, 2012 at 20:20 Laurens Holst
    function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

</script>

<main>
    <div class="controls">
        <button on:click={() => grid = createGrid(size)}>New</button>
        <div>
            <label for="size" >Size: {size}</label>
            <input id="size" type="range" bind:value={size} min="5" max="20" />
        </div>
        <div>
            <label for="speed" >
                Speed(ms): <input type="number" bind:value={speed.current} min={speed.min} max={speed.max}/>
            </label>
            <div class="speed-slider">
                <span>{speed.min}</span>
                <input class="slider" id="speed" type="range" bind:value={speed.current} min={speed.min} max={speed.max} />
                <span>{speed.max}</span>
            </div>
        </div>
        <div class="color-settings">
            <label >
                Color1
                <input  type="color" bind:value={colors.first} />
                <button on:click={() => colors.first = DEFAULTS.colors.first}>R</button>
            </label>
            <label >
                Color2
                <input  type="color" bind:value={colors.second} />
                <button on:click={() => colors.second = DEFAULTS.colors.second}>R</button>
            </label>
            <label >
                Border
                <input  type="color" bind:value={colors.border} />
                <button on:click={() => colors.border = DEFAULTS.colors.border}>R</button>
            </label>
        </div>

    </div>
    <div class="table-container">
        <h1>Tryck på en ruta för att starta</h1>
        <table>
            {#each grid as row, y}
                <tr>
                    {#each row as cell , x (x+","+y)}
                        <td 
                            on:click={() => move(x, y, grid)}
                            style:background-color = {grid[x][y].visited ? colors.second : colors.first}
                            style:border-color = {colors.border}
                            style:border-top-width = {grid[x][y].walls.up ? "2px" : 0 }
                            style:border-bottom-width = {grid[x][y].walls.down ? "2px" : 0}
                            style:border-left-width = {grid[x][y].walls.left ? "2px" : 0}
                            style:border-right-width = {grid[x][y].walls.right ? "2px" : 0}
                        />
                    {/each}
                </tr>
            {/each}
        </table>
    </div>
</main>

<style>
    main{
        display: flex;
        flex-direction: row-reverse;
        align-items: center;
        min-height: 100%;
        min-width: 100%;
        padding: 50px;
        box-sizing: border-box;
    }
    .table-container{        
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    table{
        border-collapse: collapse;
        border: 5px solid black;
    }
    td{
        width: 30px;
        height: 30px;
        border-style: solid;
        box-sizing: border-box;
        /* Ingen transition på border */
        /* transition: background-color 0.1s; */
    }
    .controls{
        display: flex;
        flex-direction: column;
    }
        .controls > div{
            padding: 10px;
            margin: 10px;
            border: 1px solid black;
            border-radius: 3px;
        }
    .speed-slider{        
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
    }
        .speed-slider input{
            margin: 15px;
        }
    .color-settings input{
        height: 40px;
        width: 40px;
    }
</style>