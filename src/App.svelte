<script>
    import Grid from "./javascript/Grid"
    import { DEFAULTS } from "./javascript/Defaults"
    import { DIRECTIONS } from "./javascript/Directions"
    import Header from "./views/Header.svelte"
    import Settings from "./views/Settings.svelte"
    import PlayControls from "./components/PlayControls.svelte"

    let colors = {...DEFAULTS.colors};
    let speed =  DEFAULTS.speed;
    let size = DEFAULTS.size;
    let grid = new Grid(size);
    let moves;
    $: { resetGrid(size); } // Kör när size ändras


    function resetGrid(size){
        moves = null;
        grid = new Grid(size);
    }
    function clickCell(x, y){
        // Ska inte gå att starta från flera rutor samtidigt
        if(moves == null)
            moves = move(x, y);
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


<Header />
<main>
    <h2 style="margin: 0;">Tryck på en ruta för att starta</h2>
    <PlayControls generator={moves} speed={speed} onReset={() => resetGrid(size)} />

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
                        on:click={() => clickCell(x, y)}
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
<Settings
    bind:size
    bind:speed
    bind:colors
/>

<style>
    /* body style i public/global.css */
    main{
        grid-row: 2;
        grid-column: 1;
        margin-inline: auto;
        margin-top: 60px;
        margin-bottom: 110px;
        width: max-content;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center; 
    }
    :global(h1){
        font-size: 1.4rem;
    }  
    :global(h2){
        font-size: 1.3rem;
    }   
    :global(h3){
        font-size: 1.1rem;
    }
    
    table{
        /* border-spacing är bättre än border-collapse för att inte få glapp i hörnen av cellerna. */
        /* Med border-spacing:0 blir border dubbelt så tjock mellan alla td, men inte mellan td och table. */
        /* Därför border på table som tar samma färg som td border */
        border-spacing: 0;
        /* Outline är utanför border, byter inte färg */
        outline: 3px solid var(--text-color);
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