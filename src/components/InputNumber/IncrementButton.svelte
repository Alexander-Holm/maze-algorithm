<script>
    import ButtonSmall from "../ButtonSmall.svelte"

    export let content, contentStyle = "";
    export let callback;
    export let disabled = false;

    $: if(disabled) stopInterval();

    
    function keyDown(event){
        if(event.key === "Enter" && event.repeat === false){
            startInterval();
        }
    }
    

    // --- Timer ---

    let timerId;
    let intervals = intervalGenerator();

    function *intervalGenerator(){ 
        // ms
        const intervals = [400, 200, 150, 100, 75, 50];
        const minInterval = 30;
        for(const interval of intervals)
            yield interval;
        while(true)
            yield minInterval;
    }

    function startInterval(){
        callback?.call();
        timerId = setTimeout(() => {
            startInterval();
        }, intervals.next().value );
    }
    function stopInterval(){
        clearTimeout(timerId);
        intervals = intervalGenerator();
    }

</script>

<ButtonSmall
    content={content} contentStyle={contentStyle}
    disabled={disabled} 
    on:mousedown={startInterval} on:keydown={event => keyDown(event)}
    on:mouseup={stopInterval} on:mouseleave={stopInterval} on:keyup={stopInterval} 
    on:blur={stopInterval} 
/>

