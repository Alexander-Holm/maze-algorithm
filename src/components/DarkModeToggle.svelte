<script>
    import {Sun, Moon} from "../icons/darkmode"

    const browserPreference = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let darkMode = browserPreference;
    $: document.documentElement.setAttribute("data-dark-mode", darkMode);
</script>

<button id="dark-mode-toggle" class:dark={darkMode} on:click={() => darkMode = !darkMode}>
    <span class="icon" >{@html Sun}</span>
    <span class="icon" >{@html Moon}</span>   
    <span class="selected-indicator" class:right={darkMode} />
    <!-- 
        Eget element för shadow så att det kan ha högre z-index än ikonerna
        samtidigt som selected-indicator har ett lägre z-index än ikonerna.

        Det ser bättre ut att shadow syns över ikonerna i transition. 
    -->
    <span class="selected-indicator-shadow" class:right={darkMode} />
</button>

<style>
    #dark-mode-toggle{
        position: absolute;
        top: 50%; right: -20px;
        transform: translateY(-50%);
        /* font-size bestämmer storleken på allt */
        font-size: 2rem;
        height: 1em;
        width: 2.2em;        
        box-shadow: 0 0 2px 1px gray;  
        border-radius: 999px;

        display: flex;
        justify-content: space-between;
        align-items: center;

        padding: 0;
        margin: 0;
        border: 0;

        /* Flyttar bakgrunden för att kunna ha transition med gradient */
        background: linear-gradient(90deg, rgb(197, 250, 255) 20%, rgb(158, 135, 187) 80%);
        background-size: 150%;
        background-position: left;

        /* quartic-out */
        transition: background-position 1s cubic-bezier(.17,.84,.44,1);

    }    
        #dark-mode-toggle.dark, #dark-mode-toggle:hover{
            background-position: right;
        }
        #dark-mode-toggle, #dark-mode-toggle.dark:hover{
            background-position: left;
        }
        #dark-mode-toggle:focus-visible{
            outline-color: var(--accent-color);
            outline-offset: 8px;
        }
    .icon{
        z-index: 2;
        display: flex;
        padding: 0.2em;
        box-sizing: border-box;
    }
    
    .selected-indicator,
    .selected-indicator-shadow,
    .icon
    {
        height: 1em;
        width: 1em;
        border-radius: 50%;
    }

    .selected-indicator,
    .selected-indicator-shadow
    {
        position: absolute;
        top: 0; left: 0;
        transition: 0.2s ease;
    }
    
    .selected-indicator{ background-color: white; }

    .selected-indicator-shadow{ 
        z-index: 3;
        box-shadow: 0 0 4px 1px black;
    }
        .selected-indicator.right,
        .selected-indicator-shadow.right
        {
            left: 100%;
            transform: translateX(-100%);
        }
        #dark-mode-toggle:active .selected-indicator-shadow{
            box-shadow: 0 0 6px 1px black;
        }
</style>