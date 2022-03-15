<script>
    import ColorPicker from "./ColorPicker.svelte";
    import WikipediaDetails from "./WikipediaDetails.svelte";
    import ResetButton from "./ResetButton.svelte"
    import Iterator from "./javascript/Iterator"
    import Grid from "./javascript/Grid"
    import { DEFAULTS } from "./Defaults"
    import { DIRECTIONS } from "./Directions"

    let colors = {...DEFAULTS.colors};
    let speed = {
        min: 10,
        max: 500,
        current: DEFAULTS.speed,
    }

    let size = DEFAULTS.size;
    let grid = new Grid(size);
    $: { resetGrid(size); } // Kör när size ändras
    let iterator = new Iterator();
    $: iterator.speed = speed.current;
    // Måste uppdatera en variabel manuellt,
    // Svelte känner inte av när Iterator ändras av sina funktioner
    // Använder callback men går kanske att lösa med en Svelte-store
    let isPaused = iterator.isPaused;
    iterator.onPauseChange = (value) => isPaused = value;

    function resetGrid(size){
        iterator.target = null;
        grid = new Grid(size);
    }
    function clickCell(x, y){
        // Ska inte gå att starta från flera celler.
        if(iterator.target != null)
            return;
        iterator.target = move(x, y);
        if(isPaused === false)
            iterator.start();
        else iterator.step(); // Ett steg sätter första cellen till aktiv
    } 

    function* move(currentX, currentY){
        grid[currentX][currentY].active = true;
        grid[currentX][currentY].visited = true;

        for(const direction of DIRECTIONS.getRandomized()){
            const newX = currentX + direction.coordinates.x;
            const newY = currentY + direction.coordinates.y;            
            if(grid.isCellValid(newX, newY)){
                yield;
                // Ta bort BÅDA väggarna innan nästa move,
                // för att inte behöva hålla koll på vilken den förra rutan var 
                grid[currentX][currentY].walls[direction.name] = false;
                grid[newX][newY].walls[DIRECTIONS.opposite(direction).name] = false;
                grid[currentX][currentY].active = false;
                yield* move(newX, newY);
                // Vandra bakåt
                grid[currentX][currentY].active = true;   
            }            
        }
        // Alla directions klara betyder att cellen inte kan besökas igen
        yield;
        grid[currentX][currentY].finished = true ;
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
            <h2>{isPaused}</h2>
            <table>
                {#each grid as row, y}
                    <tr>
                        <!-- x = index,  x+","+y = key -->
                        {#each row as cell , x (x+","+y)} 
                            <td 
                                on:click={() => clickCell(x, y, grid)}
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

    <div class="settings">
        <div class="">

        </div>
        <button class="new-button" on:click={() => iterator.step()}>Step</button>
        <button class="new-button" on:click={() => iterator.start()}  >Start</button>
        <button class="new-button" on:click={() => iterator.stop()}  >Stop</button>
        <button class="new-button" on:click={() => iterator.instant()}  >Instant</button>


        <button class="new-button" on:click={() => resetGrid(size)}>Ny</button>
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
    .settings{
        align-self: center;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
        .settings > div{
            padding: 10px;
            margin: 10px;
            display: flex;
            flex-direction: column;
        } 
        .settings .new-button{
            margin: 0;
            padding: 5px 15px;
            min-width: 100px;
            background-color: rgb(233, 233, 233);
            border: 2px solid gray;
        }   
        .settings .new-button:hover{
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