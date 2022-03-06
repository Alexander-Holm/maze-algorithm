<details>
    <summary>Beskrivning från Wikipedia</summary>

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
</details>

<style>
    details{
        max-width: 500px;
    }
    details summary{
        cursor: pointer;        
        font-weight: 600;
        /* Vertical */
        padding: 10px 0; 
    }
</style>