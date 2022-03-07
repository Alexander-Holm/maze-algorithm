<script>
    import ColorPicker from "./ColorPicker.svelte";
    import WikipediaDetails from "./WikipediaDetails.svelte";
    import ResetButton from "./ResetButton.svelte"

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
        // colors property-namn används för labels till <ColorPicker>
        colors: {
            start: "#ded7ff",
            väg: "#ffffff",
            färdig: "#afff9b",
            aktiv: "#dd0069",
            väggar: "#000000",
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
                    active: false,
                    visited: false,
                    finished: false,
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
        // Kolla innan celler ändras
        if(activeGrid !== grid)
            return;
        grid[currentX][currentY].active = true;
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
                grid[currentX][currentY].active = false;
                await move(newX, newY, activeGrid);
            }
            if(activeGrid !== grid)
                return;
            // Vandra bakåt
            grid[currentX][currentY].active = true;             
        }    
        // Alla directions klara betyder att cellen inte kan besökas igen      
        await new Promise(resolve => setTimeout(resolve, speed.current));
        if(activeGrid !== grid)
                return;
        grid[currentX][currentY].finished = true ;
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
    <div class="content-container">
        <div>
            <h1> Randomized depth-first search / recursive backtracker</h1>
            <WikipediaDetails />
        </div>

        <div class="table-container">
            <h2>Tryck på en ruta för att starta</h2>
            <table>
                {#each grid as row, y}
                    <tr>
                        {#each row as cell , x (x+","+y)}
                            <td 
                                on:click={() => move(x, y, grid)}
                                style:background-color = { 
                                    grid[x][y].finished ? colors.färdig :
                                    grid[x][y].active ? colors.aktiv :
                                    grid[x][y].visited ? colors.väg : colors.start
                                }
                                style:border-color = {colors.väggar}
                                style:border-top-width = {grid[x][y].walls.up ? "3px" : 0 }
                                style:border-bottom-width = {grid[x][y].walls.down ? "3px" : 0}
                                style:border-left-width = {grid[x][y].walls.left ? "3px" : 0}
                                style:border-right-width = {grid[x][y].walls.right ? "3px" : 0}
                            />
                        {/each}
                    </tr>
                {/each}
            </table>
        </div>

    </div>

    <div class="controls">
        <button class="new-button" on:click={() => grid = createGrid(size)}>Ny</button>
        <!-- Size -->
        <div>
            <div class="slider-label-container">
                <label for="size" class="slider-label-container">
                    <h3 style="margin-right: 5px;">Storlek:</h3>
                    {size} x {size}
                </label>
                <ResetButton class="reset" on:click={() => size = DEFAULTS.size} />
            </div>
            <input id="size" type="range" bind:value={size} min="5" max="20" />            
        </div>
        <!-- Speed -->
        <div class="speed-container">
            <div class="slider-label-container">
                <label class="slider-label-container">
                    <h3>Hastighet(ms): </h3>
                    <input type="number" bind:value={speed.current} min={speed.min} max={speed.max} style="width: 100px; margin-left:10px"  />
                </label>
                <ResetButton class="reset" on:click={() => speed.current = DEFAULTS.speed} />
            </div>
            <div class="speed-slider">
                <span>{speed.min}</span>
                <input class="slider" type="range" bind:value={speed.current} min={speed.min} max={speed.max} />
                <span>{speed.max}</span>
            </div>
        </div>        
        <!-- Color -->
        <div class="color-container" >
            <h3 class="color-title">Färger</h3>
            <!-- Kan inte binda color till objektet från Object.entries -->
            <!-- Måste binda till colors objektet -->
            {#each Object.entries(colors) as [name] }
                <ColorPicker 
                    id={`color-${name}`} 
                    text={name}
                    bind:color={colors[name]}
                />
            {/each}
        </div>

    </div>
</main>

<style>
    main{
        display: flex;
        flex-direction: row;
        min-height: 100%;
        min-width: 100%;
        padding: 20px 50px;
        box-sizing: border-box;
    }
    h1{
        margin: 0;
        font-size: 1.3rem;
    }
    h2{
        font-size: 1.3rem;
    }    
    h3{
        font-size: 1rem;
    }
    input{
        margin: 0;
    }
        input[type=range]{
            cursor: grab;
        }
            input[type=range]:active{
                cursor:grabbing;
            }
    table{
        border-collapse: collapse;
        border: 5px solid black;
    }
    td{
        width: 30px;
        height: 30px;
        /* Table har ingen border-style som default */
        /* Andra border settings sätts inline */
        border-style: solid;
        box-sizing: border-box;
    }
    .content-container{
        flex-grow: 1;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .table-container{        
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }    
    .controls{
        align-self: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
        .controls > div{
            padding: 10px;
            margin: 10px;
            display: flex;
            flex-direction: column;
        } 
        .controls .new-button{
            margin: 0;
            padding: 5px 15px;
            min-width: 100px;
            background-color: rgb(233, 233, 233);
            border: 2px solid gray;
        }   
        .controls .new-button:hover{
            filter:contrast(1.1)
        }   
    .slider-label-container{
        display: flex;
        flex-direction: row;
        align-items: center;
    }
        /* :global för att komma åt i andra Components  */
        .slider-label-container :global(.reset){
            margin-left: 10px;
        }
    .speed-slider{        
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
    }
        .speed-slider input{
            /* horizontal */
            margin: 0 15px;
        }
    .color-container{
        display: flex;
        flex-direction: column;
    }
        .color-title{
            margin: 15px;
            margin-top: 0;
            margin-left: 30px;            
        }
</style>