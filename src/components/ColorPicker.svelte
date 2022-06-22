<script>
    import ResetButton from "./ResetButton.svelte";

    export let color;
    const originalColor = color;
    export let id;
    export let text;
</script>

<div class="color-settings">
    <input id={id} type="color" class="color-picker" bind:value={color} />
    <label for={id} >{text}</label>
    <ResetButton on:click={() => color = originalColor} />
</div>

<style>
    /* Ingen margin mellan <input> och <label> för att de delar mousehover, */
    /* blir ett konstigt glapp när man drar musen mellan dom */
    .color-settings{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 5px;
    }
    .color-picker{
        height: 40px;
        width: 40px;
        margin:0;
        padding: 4px;
    }
    label{
        text-transform: capitalize;
        padding-inline: 15px;
    }
    
</style>