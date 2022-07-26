<header>
    <h1> Randomized depth-first search / recursive backtracker</h1>
    <details>
        <summary>Beskrivning från Wikipedia</summary>
    
        <div class="content">
            The depth-first search algorithm of maze generation is frequently implemented using backtracking. This can be described with a following recursive routine:
            <ol>
                <li>Given a current cell as a parameter,</li>
                <li>Mark the current cell as visited</li>
                <li>
                    While the current cell has any unvisited neighbour cells
                    <ol>
                        <li>Choose one of the unvisited neighbours</li>
                        <li>Remove the wall between the current cell and the chosen cell</li>
                        <li>Invoke the routine recursively for a chosen cell</li>
                    </ol>
                </li>
            </ol> 
            which is invoked once for any initial cell in the area. 
            <br />
            <a href="https://en.wikipedia.org/wiki/Maze_generation_algorithm#Randomized_depth-first_search" target="_blank" rel="noopener noreferrer">
                Wikipedia
            </a>
        </div>    

    </details>
</header>

<style>
    header{
        grid-row: 1;
        grid-column: 1;
        justify-self: center;
        height: fit-content;
    }
    h1{
        margin: 0;
        /* Gör att texten alltid fyller bredden, ser mer centrerat ut */
        text-align: justify;
        text-justify: distribute;
    }
    details{
        z-index: 1;
        position: relative;
        line-height: 1.6;
    }
    summary{
        z-index: 1;
        position: relative;
        font-weight: 600;
        padding: 10px 0;      
        user-select: none;
    }
        summary:hover{
            background-color: hsla(0, 0%, 60%, 10%);
        }
    .content{
        position: absolute;
        background-color: var(--bg-secondary);
        padding: 20px;
        box-shadow: 0 0 2px 0px black;
        border-radius: 4px;
    }
</style>