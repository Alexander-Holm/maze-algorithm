<script>
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


    // --- Timer ---
    let timerId;
    const TIMER_CONSTANTS = {
        ACCELERATION: 3,
        INTERVAL_MIN: 50,
        INTERVAL_INITIAL: 400,
    }
    function startInterval(increment, interval = TIMER_CONSTANTS.INTERVAL_INITIAL){
        validate(value + increment);

        let nextInterval = interval / TIMER_CONSTANTS.ACCELERATION;
        if(nextInterval < TIMER_CONSTANTS.INTERVAL_MIN)
            nextInterval = TIMER_CONSTANTS.INTERVAL_MIN;

        timerId = setTimeout(() => startInterval(increment, nextInterval), interval);
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
    <input> type="text" istället för "number" för att ta bort pil-knapparna som är svåra att stylea.
    inputmode="numeric" tar upp tangentbord för touch som om det vore type="number".
 -->
<div class="input-box-number">
    <button 
        on:mousedown={() => startInterval(step)}
        on:mouseup={stopInterval}
        on:mouseleave={stopInterval}
        disabled={value >= max}   
    >
        <span>⋏</span>
    </button>

    <input 
        bind:this={inputRef}
        style:width
        type="text" inputmode="numeric"
        value={value} min={min} max={max} step={step}
        on:change={e => validate(e.target.value)}
    />     

    <button 
        on:mousedown={() => startInterval(-step)}
        on:mouseup={stopInterval}
        on:mouseleave={stopInterval}
        disabled={value <= min}     
    >
        <span>⋎</span>
    </button>    
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
    }
    button{
        margin: 3px 0;
        padding: 0;
        border-radius: 50%;
        background: transparent;
        border: 0;
    }
        button:hover:enabled{
            background: lightgray;
        }
    button span{
        display: block;
        transform: scaleX(1.5);
        height: 1.5em;
        width: 1.5em;
    }
</style>