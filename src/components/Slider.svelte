<script>
    export let value;
    export let min;
    export let max;
    export let step = 1;;
</script>

<div class="slider">
    <span>{min}</span>
    <input 
        type="range"
        bind:value={value} 
        min={min} max={max} step={step}
        on:input on:change
    />
    <span>{max}</span>
</div>

<style>
    .slider{        
        display: flex;
        flex-direction: row;
        align-items: center;
        width: 100%;
    }
    input{
        margin: 0 15px;
        /* padding-inline för att kanterna inte ska täckas av padding om slidern är liten */
        padding-inline: 0;
        flex-grow: 1;
        /* https://stackoverflow.com/questions/36230944/prevent-flex-items-from-overflowing-a-container */
        min-width: 0;
    }
</style>