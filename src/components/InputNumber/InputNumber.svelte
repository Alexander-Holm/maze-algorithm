<script>
    import IncrementButton from "./IncrementButton.svelte";
    
    export let value = 1;
    export let min = Number.MIN_SAFE_INTEGER;
    export let max = Number.MAX_SAFE_INTEGER;
    export let step = 1;
    export let width = "100%";
    
    const iconStyle = "transform: scaleX(1.5)"
    let inputRef;   

    function updateValue(input){
        input = Number(input);
        if(Number.isNaN(input)){
            // Sätter <input> value till senast korrekta värdet
            inputRef.value = value;
        }
        else{
            input = roundToStep(input);
            input = enforceMinMax(input);
            value = input;
            inputRef.value = value;
        }
    }
    function enforceMinMax(number){
        if(number > max)
            return max;
        if(number < min)
            return min;
        return number;
    }
    // Rundar ner
    function roundToStep(number){
        let extra = number % step;
        return number - extra;
    }

</script>


<!-- 
    Ingen binding till <input> value,
    går genom on:change och uppdaterar både <input> och prop value manuellt.
-->
<!-- 
    onChange är bättre än onInput för att det ska vara möjligt att ta
    bort innehållet och skriva in ett eget värde utan att value sätts till min.
-->
<!-- 
    <input> type="text" istället för "number" för att ta bort pil-knapparna som är svåra att styla.
    inputmode="numeric" tar upp tangentbord för touch som om det vore type="number".
 -->
<div class="input-number">
    <IncrementButton
        content="⋏" contentStyle={iconStyle}
        disabled={value >= max}
        callback={() => updateValue(value + step)}
    />

    <input 
        bind:this={inputRef}
        style:width={width}
        type="text" inputmode="numeric"
        value={value} min={min} max={max} step={step}
        on:change={e => updateValue(e.target.value)}
    />     
    
    <IncrementButton
        content="⋎" contentStyle={iconStyle + " translateY(1px)"}
        disabled={value <= min}
        callback={() => updateValue(value + -step)}
    />
</div>

<style>
    .input-number{
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    input{
        margin: 0;
        padding: 2px 6px;
        text-align: center;
        box-sizing: content-box;
        background: var(--bg-color);
        color: var(--text-color);
    }
        :global([data-dark-mode = true]) input{
            border-color: #484848;
        }
</style>