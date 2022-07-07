<script>
    // Ikonerna är .svg men filtypen är ändrad till .svelte för att det 
    // är det lättaste sättet att använda dom.
    import Sun from "../icons/sun.svelte";
    import Moon from "../icons/moon.svelte";
    
    const browserPreference = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let darkMode = browserPreference;
    $: document.body.setAttribute("data-dark-mode", darkMode);
</script>

<button id="dark-mode-toggle" on:click={() => darkMode = !darkMode}>
    <span class="background" />
    <span class="icon" ><Sun/></span>
    <span class="icon" ><Moon/></span>   
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
        top: 10px; right: 10px;
        /* font-size bestämmer storleken på allt */
        font-size: 1.9rem;
        height: 1em;
        width: 2.3em;

        display: flex;
        justify-content: space-between;
        align-items: center;

        background-color: transparent;
        padding: 0;
        margin: 0;
        border: 0;        
    }
    .background{
        position: absolute;
        top: 0; left: 0;
        width: 100%;
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, rgb(197, 250, 255) 0%, rgb(158, 135, 187) 100%);
        box-shadow: 0 0 2px 1px gray;
    }
    .icon{
        z-index: 2;
        display: flex;
        padding: 0.14em;
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
        box-shadow: 0 0 4px 1px black; 
        z-index: 3;
    }
        .selected-indicator.right,
        .selected-indicator-shadow.right
        {
            left: 100%;
            transform: translateX(-100%);
        }
</style>