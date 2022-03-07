<button class={$$props.class} style={$$props.style} on:click >
    <span>↺</span>    
</button>

<style>
    button{
        height: 25px;
        width: 25px;
        padding: 0;
        margin: 0;
        font-size: 1.2rem;
        /* flex för att få texten/ikonen i mitten av knappen*/
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
    span{
        margin:0;
        padding: 0;
        margin-bottom: 5px;
    }
</style>