<script>
    import ColorPicker from "./ColorPicker.svelte";
    import WikipediaDetails from "./WikipediaDetails.svelte";
    import ResetButton from "./ResetButton.svelte"
    import Iterator from "./Iterator"
    import Grid from "./Grid"
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
    let isFinished = true;
    iterator.onFinished = () => isFinished = true;
    let hasStarted = false;

    function resetGrid(size){
        iterator.function = null;
        isFinished = true;
        hasStarted = false;
        grid = new Grid(size);
    }
    function clickCell(x, y){
        // Ska inte gå att starta från flera celler.
        if(iterator.function != null)
            return;
        iterator.function = move(x, y);
        isFinished = false;
        hasStarted = true;
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
            <div class="play-controls">
                <button title="Starta" disabled={!isPaused} on:click={() => iterator.start()} >⯈</button>
                <button title="Pausa" class="pause" disabled={isPaused}  on:click={() => iterator.stop()} >||</button>
                <button title="Ett steg" class="step" disabled={isFinished}  on:click={() => iterator.step()} >⤺</button>
                <button title="Lös direkt" class="instant" disabled={isFinished} on:click={() => iterator.instant()} >🗲</button>
                <button title="Ny" class="reset" disabled={isFinished && !hasStarted} on:click={() => resetGrid(size)}>↺</button>
            </div>     
            <table style:border-color = {colors.väggar}>
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
                                style:border-top-width = {grid[x][y].walls.up ? "1px" : 0 }
                                style:border-bottom-width = {grid[x][y].walls.down ? "1px" : 0}
                                style:border-left-width = {grid[x][y].walls.left ? "1px" : 0}
                                style:border-right-width = {grid[x][y].walls.right ? "1px" : 0}
                            />
                        {/each}
                    </tr>
                {/each}
            </table>
        </div>
    </div>

    <div class="settings">

        <!-- Size -->
        <div class="group">
            <!-- slider-label-container passar på både containern och label, inte gjort av misstag -->
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
        <div class="group">
            <!-- slider-label-container passar på både containern och label, inte gjort av misstag -->
            <div class="slider-label-container">
                <label class="slider-label-container">
                    <h3>Hastighet(ms): </h3>
                    <input type="number" bind:value={speed.current} min={speed.min} max={speed.max} />
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
        <div style="align-items: stretch;" >
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
        font-size: 1.3rem;
        margin: 0;
    }
    h2{
        font-size: 1.3rem;
        margin: 0;
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
        input[type=number]{
            width: 5rem; 
            margin-left: 10px;
            text-align: center;
        }
    .play-controls{
        display: flex;
        flex-flow: row wrap;
        font-size: 1.4rem;
    }
        .play-controls button{
            border-radius: 50%;
            width: 2rem;
            height: 2rem;
            margin: 10px 4px;            
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #ececec;
            border: 2px solid rgb(80, 80, 80);
            box-sizing: border-box;
        }
            .play-controls button:hover:not(:disabled){
                filter: brightness(1.1);
            }
            .play-controls button:active:not(:disabled){
                box-shadow: 0 0 3px 1px rgb(150, 150, 150) inset;
            } 
            .play-controls button:disabled{
                border: 1px solid lightgray;
            } 
            .play-controls .pause{
                font-weight: 900;
                font-size: 0.60em;
            }
            .play-controls .step{
                font-weight: 900;
                font-size: 1.35em;    
                 /* Kan inte ha mer padding utan att knappen blir större */
                padding-bottom: 0.50em;
                /* Flip */
                transform: scaleX(-1);
            }
            .play-controls .instant{
                font-size: 0.9em;
            }
            .play-controls .reset{
                font-size: 1.0em;
                font-weight: 900;
                padding-bottom: 0.45em;
            }
    table{
        /* border-spacing är bättre än border-collapse för att inte få glapp i hörnen */
        /* Med border-spacing:0 blir border dubbelt så tjock mellan alla td, men inte mellan td och table. */
        /* Därför border på table som tar samma färg som td border */
        border-spacing: 0;
        /* Outline är utanför border, byter inte färg */
        outline: 3px solid black;
        /* Hälften av border-width för td, färg sätts inline */
        border-width: 1px;
        border-style: solid;
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
        .settings .group{
            padding: 10px;
            margin: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
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
    .color-title{
        margin: 15px;
        margin-top: 0;
        text-align: center;
    }
</style>