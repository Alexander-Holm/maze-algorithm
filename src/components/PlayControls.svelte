<script>
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
        loopingTimer();
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

<div class="play-controls">
    <button title="Starta" disabled={!isPaused} on:click={clickStart} >⯈</button>
    <button title="Pausa" class="pause" disabled={isPaused}  on:click={clickStop} >||</button>
    <button title="Ett steg" class="step" disabled={isFinished}  on:click={clickStep} >⤺</button>
    <button title="Lös direkt" class="instant" disabled={isFinished} on:click={clickInstant} >🗲</button>
    <button title="Ny" class="reset" disabled={isFinished && generator == null} on:click={clickReset}>↺</button>
</div>

<style>
     .play-controls{
        display: flex;
        flex-flow: row wrap;
        font-size: 1.4rem;
    }
    button{
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
        button:hover:not(:disabled){
            filter: brightness(1.1);
        }
        button:active:not(:disabled){
            box-shadow: 0 0 3px 1px rgb(150, 150, 150) inset;
        } 
        button:disabled{
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
</style>