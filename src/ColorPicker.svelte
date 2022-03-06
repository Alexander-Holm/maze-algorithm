<script>
    export let color;
    const originalColor = color;
    export let id;
    export let text;
</script>

<div class="color-settings">
    <input id={id} type="color" class="color-picker" bind:value={color} />
    <label for={id} >{text}</label>
    <button class="reset" on:click={() => color = originalColor} >↺</button>
</div>

<style>
    .color-settings{
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 5px;
    }
    .color-picker{
        height: 40px;
        width: 40px;
        margin:0;
    }
    label{
        text-transform: capitalize;
        padding: 10px;
    }
    .reset{
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
    }
    .reset:hover{
        background-color: lightgray;
    }
</style>