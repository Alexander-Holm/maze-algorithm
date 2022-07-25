<script>
    import {Play, Pause, Step, Instant, Reset} from "../icons/playControls"

    export let generator;
    export let speed = 300; //ms
    export let onReset;
    export let isPaused = false;
    let isFinished = true;
    // Måste använda clearTimeout(timerId) för att den gamla loopen inte ska fortsätta när man byter generator
    let timerId;

    $: { init(generator) }
    function init(generator){
        clearTimeout(timerId);
        if(generator != null)
            isPaused ? clickStep() : loopingTimer();
        else isFinished = true;
    }

    function loopingTimer(){
        timerId = setTimeout(() => loopingTimer(), speed);
        next(); 
    }
    function next(){
        isFinished = generator?.next().done;
        if(isFinished) 
            clearTimeout(timerId);
    }


    // --- Click events ---

    function clickStart(){
        isPaused = false;
        if(generator){
            loopingTimer();
        }
    }
    function clickStop(){
        clearTimeout(timerId);
        isPaused = true;
    }
    function clickStep(){
        clearTimeout(timerId);
        isPaused = true;
        next();
    }
    function clickInstant(){
        while(isFinished === false && generator != null){
            next();
        }
    }
    function clickReset(){
        clearTimeout(timerId);
        isFinished = true;
        onReset?.call();
    }
</script>

<div id="play-controls">
    <!-- En knapp istället för två för att inte tappa fokus när man navigerar med tangentbord -->
    <button title={isPaused ? "Starta" : "Pausa"} on:click={isPaused ? clickStart : clickStop} >
        {#if isPaused}
        {@html Play}
        {:else}
        {@html Pause}
        {/if}
    </button>
    <button title="Ett steg" disabled={isFinished}  on:click={clickStep} >{@html Step}</button>
    <button title="Lös direkt" disabled={isFinished} on:click={clickInstant} >{@html Instant}</button>
    <button title="Ny" disabled={isFinished && generator == null} on:click={clickReset}>{@html Reset}</button>
    
</div>

<style>
    #play-controls{
        display: flex;
        flex-flow: row wrap;
        margin-top: 12px;
        margin-bottom: 20px;
    }
    button{
        border-radius: 50%;
        width: 2.2rem;
        height: 2.2rem;
        margin: 6px 10px;
        padding: 0.45em;
        box-sizing: border-box;

        border: 2px solid hsl(0, 0%, 25%);
        /* Opacity/alpha < 1 för att den ska vara lite mörkare mot mörkare bakgrund */
        background-color: hsla(0, 0%, 95%, 90%);
        color: rgb(75, 75, 75);

        display: inline-flex;
        justify-content: center;
        /* Ikonerna har bättre storlek med align-items: stretch än center */
        align-items: stretch;

        transition: 0.2s opacity, 0.1s background-color;
    }
        button:hover:not(:disabled){
            border-color: gray;
        }
        button:active:not(:disabled){
            background-color: hsla(0, 0%, 80%, 90%);
        } 
        button:focus-visible:enabled{
            outline: 2px solid var(--accent-color);
            outline-offset: 4px;
        }
        button:disabled{
            opacity: 0.25;
        } 

</style>