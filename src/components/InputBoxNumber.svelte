<script>
    import ButtonSmall from "./ButtonSmall.svelte"
    const iconStyle = "transform: scaleX(1.5);"

    export let value;
    export let min = Number.MIN_SAFE_INTEGER;
    export let max = Number.MAX_SAFE_INTEGER;
    export let step = 1;
    export let width = "5ch";

    let inputRef;   

    // validate() uppdaterar <input> value och prop value manuellt
    function validate(input){
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

    function buttonOnKeyDown(event, increment){
        if(event.key === "Enter" && event.repeat === false)
            startInterval(increment);
    }


    // --- Timer ---
    let timerId;

    function *intervalGenerator(){
        const intervals = [400, 200, 150, 100, 75, 50];
        const minInterval = 30;
        for(const interval of intervals)
            yield interval;
        while(true)
            yield minInterval;
    }

    function startInterval(increment, intervals = intervalGenerator()){
        const interval = intervals.next().value;
        validate(value + increment);
        timerId = setTimeout(() => 
            startInterval(increment, intervals), 
            interval
        );
    }
    function stopInterval(){
        clearInterval(timerId);
    }

</script>


<!-- 
    Ingen binding till <input> value,
    går genom validate() och uppdaterar prop value manuellt.
-->
<!-- 
    onChange är bättre än onInput för att det ska vara möjligt att ta
    bort innehållet och skriva in ett eget värde utan att value sätts till min.
-->
<!-- 
    <input> type="text" istället för "number" för att ta bort pil-knapparna som är svåra att styla.
    inputmode="numeric" tar upp tangentbord för touch som om det vore type="number".
 -->
<div class="input-box-number">
    <ButtonSmall
        content="⋏" contentStyle={iconStyle}
        on:mousedown={() => startInterval(step)}
        on:mouseup={stopInterval} on:mouseleave={stopInterval}
        on:keydown={event => buttonOnKeyDown(event, step)}
        on:keyup={stopInterval} 
        disabled={value >= max}
    />

    <input 
        bind:this={inputRef}
        style:width
        type="text" inputmode="numeric"
        value={value} min={min} max={max} step={step}
        on:change={e => validate(e.target.value)}
    />     
    
    <ButtonSmall
        content="⋎" contentStyle={iconStyle}
        on:mousedown={() => startInterval(-step)}
        on:mouseup={stopInterval} on:mouseleave={stopInterval}
        on:keydown={event => buttonOnKeyDown(event, -step)}
        on:keyup={stopInterval}
        disabled={value <= min}     
    />
</div>

<style>
    .input-box-number{
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