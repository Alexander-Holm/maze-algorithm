<script>
    export let disabled = false;
    export let content;
    export let contentStyle = "";
</script>

<button
        on:click
        on:mousedown on:mouseup on:mouseleave
        on:keydown on:keyup
        disabled={disabled}
    >
        <span style={contentStyle} >
            {content}
        </span>
</button>

<style>
    button{
    background: transparent;
    height: 1.5em;
    width: 1.5em;
    border-radius: 50%;
    border: 0;

    margin: 3px;
    padding: 0;
}
    button:hover:enabled{
        /* Grå med låg opacity syns på både ljus och mörk bakgrund */
        background-color: hsla(0, 0%, 60%, 0.15);
        transform: scale(1.15);
    }
    button:focus-visible{
        outline: 2px solid var(--accent-color);
    }
    button:active{
        filter: contrast(1.1);
    }
    span{
        display: inline-block;
        height: 100%;
        width: 100%;
        /* 
            Unicode ikoner är inte alltid centrerade i höjd (har mer whitespace över eller under).            
            Det här centrerar dom nuvarande hyffsat bra i höjd oavsett font-size,
            men jag tror inte det löser problemet i alla lägen.

            Kan använda transform:translate() i contentStyle för finjustering.
        */
        line-height: 1.3em;
        vertical-align: super;
    }
</style>