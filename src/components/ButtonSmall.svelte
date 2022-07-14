<script>
    export let content;
    export let contentStyle = "";
    export let disabled = false;
</script>

<button
        on:click on:mousedown on:mouseup on:mouseleave
        on:keydown on:keyup
        on:blur
        disabled={disabled}
    >
        <span style={contentStyle} >
            {content}
        </span>
</button>

<style>
    button{
    background-color: transparent;
    height: 1.7em;
    width: 1.7em;
    border-radius: 50%;
    border: 0;

    margin: 3px;
    padding: 0;
    overflow: hidden;
    transition-property: background-color, box-shadow;
    transition-duration: 0.1s;

}
    button:focus-visible:enabled{
        outline: 2px solid var(--accent-color);
    }
    button:hover:enabled{
        /* Grå med låg opacity syns på både ljus och mörk bakgrund */
        background-color: hsla(0, 0%, 60%, 0.15);
        transform: scale(1.15);
    }
    button:active:enabled{
        box-shadow: 0 0 2px hsla(0, 0%, 50%, 0.5) inset;
    }
    span{
        display: inline-block;
        height: 100%;
        width: 100%;
        pointer-events: none;
    }
</style>