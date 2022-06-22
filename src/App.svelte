<script>
    import ColorPicker from "./components/ColorPicker.svelte";
    import ResetButton from "./components/ResetButton.svelte"
    import Slider from "./components/Slider.svelte"
    import Iterator from "./javascript/Iterator"
    import Grid from "./javascript/Grid"
    import { DEFAULTS } from "./javascript/Defaults"
    import { DIRECTIONS } from "./javascript/Directions"
    import Header from "./views/Header.svelte"
    import Settings from "./views/Settings.svelte"

    let colors = {...DEFAULTS.colors};
    let speed =  DEFAULTS.speed;
    let size = DEFAULTS.size;
    let grid = new Grid(size);
    $: { resetGrid(size); } // Kör när size ändras
    let iterator = new Iterator();
    $: iterator.speed = speed;
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
 
<header>
    <Header />
</header>

<main>
    <h2 style="margin: 0;">Tryck på en ruta för att starta</h2>
    <div class="play-controls">
        <button title="Starta" disabled={!isPaused} on:click={() => iterator.start()} >⯈</button>
        <button title="Pausa" class="pause" disabled={isPaused}  on:click={() => iterator.stop()} >||</button>
        <button title="Ett steg" class="step" disabled={isFinished}  on:click={() => iterator.step()} >⤺</button>
        <button title="Lös direkt" class="instant" disabled={isFinished} on:click={() => iterator.instant()} >🗲</button>
        <button title="Ny" class="reset" disabled={isFinished && !hasStarted} on:click={() => resetGrid(size)}>↺</button>
    </div>
    <!-- Vissa webbläsare har ibland ett glapp mellan table border och cellerna. -->
    <!-- Fixar det med background-color  -->
    <table 
        style:border-color = {colors.väggar}
        style:background-color = {colors.väggar}
    >
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
</main>

<aside>
    <Settings
        bind:size
        bind:speed
        bind:colors
    />
</aside>




<style>
    :global(body){
        height: 100%;
        width: 100%;
        min-width: fit-content;
        padding: 20px 50px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    main{
        width: max-content;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-grow: 1;
        padding: 50px 0;
    }
    aside{
        position: absolute;
        /* center right */
        right: 0;
        top: 50%;
        transform: translateY(-50%);
    }    
    :global(h2){
        font-size: 1.3rem;
    }   
    :global(h3){
        font-size: 1.1rem;
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
                font-size: 1.1em;
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
        /* border-spacing är bättre än border-collapse för att inte få glapp i hörnen av cellerna. */
        /* Med border-spacing:0 blir border dubbelt så tjock mellan alla td, men inte mellan td och table. */
        /* Därför border på table som tar samma färg som td border */
        border-spacing: 0;
        /* Outline är utanför border, byter inte färg */
        outline: 3px solid black;
        /* Samma width som td, färg sätts inline */
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
</style>