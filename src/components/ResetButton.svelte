<button class={$$props.class} style={$$props.style} on:click >↺</button>

<style>
    button{
        height: 1.5rem;
        width: 1.5rem;
        padding: 0;
        padding-bottom: 0.25em;
        margin: 0;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: transparent;
        border: none; 
        border-radius: 5px;
        overflow: hidden;
    }
    button:hover{
        background-color: lightgray;
    }
</style>