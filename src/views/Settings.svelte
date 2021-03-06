<script>
    import {DEFAULTS} from "../javascript/Defaults"
    import ColorPicker from "../components/ColorPicker.svelte";
    import ResetButton from "../components/ResetButton.svelte"
    import Slider from "../components/Slider.svelte"
    import InputNumber from "../components/InputNumber/InputNumber.svelte"
    import DarkModeToggle from "../components/DarkModeToggle.svelte";

    export let size = DEFAULTS.size;
    export let speed = DEFAULTS.speed; // ms
    export let colors = DEFAULTS.colors;
    export let closed = false;
    const sliderSettings = {
        size: {
            value: size,
            min: 5,
            max: 20,
        },
        speed: {
            value: speed,
            min: 10,
            max: 1000,
        },
    }
    
</script>

<aside>
    <div id="settings">
        <button 
            id="open-settings"
            on:click|preventDefault={() => closed = !closed}
            class:closed
        >
            <span>⏵</span>
        </button>
    
        <div class="expandable" class:closed>
            <div class="header">
                <h2>Inställningar</h2>
                <DarkModeToggle />
            </div>
        
            <!-- Size -->
            <div class="group">
                <!-- slider-label-container passar på både containern och label, inte gjort av misstag -->
                <div class="slider-header">
                    <h3>Storlek:</h3>
                    <div class="box-input-container">                    
                        <InputNumber 
                            bind:value={size}
                            min={sliderSettings.size.min} max={sliderSettings.size.max} step={1}
                            width="3ch"
                        />
                        <span>x {size}</span>
                    </div>
                    <ResetButton on:click={() => size = sliderSettings.size.value} />
                </div>
                <Slider
                    bind:value={size}
                    min={sliderSettings.size.min} max={sliderSettings.size.max} step=1
                />
            </div>
        
            <!-- Speed -->
            <div class="group">
                <!-- slider-label-container passar på både containern och label, inte gjort av misstag -->
                <div class="slider-header">
                    <h3>Hastighet: </h3>
                    <div class="box-input-container">
                        <InputNumber 
                            bind:value={speed}
                            min={sliderSettings.speed.min} max={sliderSettings.speed.max} step={1}
                            width="4ch"
                        />
                        <span>ms</span>
                    </div>
                    <ResetButton on:click={() => speed = sliderSettings.speed.value} />
                </div>
                <Slider
                    bind:value={speed}
                    min={sliderSettings.speed.min} max={sliderSettings.speed.max} step={1}
                />
            </div>    
        
            <!-- Color -->
            <div id="color-settings" class="group" >
                <h3 class="color-title">Färger</h3>
                <!-- Kan inte binda color till objektet från Object.entries -->
                <!-- Måste binda till colors objektet -->
                {#each Object.entries(colors) as [key] }
                    <ColorPicker 
                        id={`color-${key}`} 
                        text={key}
                        bind:color={colors[key]}
                    />
                {/each}
            </div>    
        </div>
    </div>
</aside>

<style>
    aside{
        z-index: 2;
        grid-row-start: 1;
        grid-row-end: 3;
        grid-column: 1;
        margin: auto;
        /* Ignorera body padding för att ligga längst ut till höger */
        margin-right: calc( var(--body-padding) * -1 );
        /* 
            Ingen margin-top gör att aside inte flyttas ner när tabellen blir större.
            Det blir hyffsat centrerat på 1080p men aside ligger högre upp på större upplösning,
            lägre på mindre upplösning.
        */
        margin-top: 0;
        /* 
            body padding-bottom tas inte med i overflow.
            Lägger till padding för att inte ska ta i botten av sidan.
            Det blir lite mer padding-top när fönsterhöjden är liten.
        */
        padding: var(--body-padding) 0px;

    }  
    #settings{
        --bg-opacity: 0.95;
        display: flex;
        background-color: rgba( var(--bg-secondary-rgb), var(--bg-opacity) );
        border-radius: 8px 0px 0px 8px;
        box-shadow: 0 0 2px 0px black;                
    }
        :global([data-dark-mode = true]) #settings{
            --bg-opacity: 0.98;
        }
    #open-settings{
        z-index: 2;
        background: #484848;
        color: white;
        font-size: 2rem;
        width: 1em;
        border-radius: inherit;
        
        display: flex;
        align-items: center; 
        justify-content: center;
        
        margin: 0; 
        padding: 0;
        border: 0;
    }      
        :global([data-dark-mode = true]) #open-settings{
            /* background: linear-gradient(0deg, rgb(65, 55, 168) 0%, rgb(118, 109, 221) 100%); */
            background-color: #6f7677;
        }   
        #open-settings:hover{
            filter: contrast(1.3);
        }
        #open-settings:focus-visible{
            /* box-shadow för att outline inte är tydligt nog */
            box-shadow: 0 0 4px 4px var(--accent-color);
            /* För dålig kontrast mellan outline/shadow och knappen annars  */
            filter: saturate(1.2) contrast(1.2);
        }
        #open-settings.closed span{
            transform: rotateY(180deg);
        }
    .expandable{        
        width: 19rem;
        padding-inline: 50px;
        overflow: hidden;
        opacity: 1;
        transition: 0.35s ease-out;
        transition-property: width, opacity, padding-inline;
    }
        .expandable.closed{
            width: 0;
            padding-inline: 0;
            opacity: 0;
        }
    .header{
        position: relative;
        text-align: center;
    }
    .group{
        width: 100%;
        margin: 40px auto;
    }
    #color-settings{
        width: 14rem;
        min-width: min-content;
        max-width: 100%;
    }
    .slider-header{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 16rem;
        min-width: min-content;
        max-width: 100%;
        margin: auto;
        margin-bottom: 6px;
    }
    .box-input-container{
        display: flex;
        align-items: center;
        margin-inline: 12px;
    }
        .box-input-container span{
            /* 
                Sätter width för att containern inte ska flytta sig 
                när längden text ändras, t.ex. 9 -> 10 (1 -> 2 tecken)
            */
            width: 2.5em;
            margin-left: 6px;
            text-align: start;
            white-space: nowrap;
            overflow: hidden;
        }
    .color-title{
        margin: 15px;
        margin-top: 0;
        text-align: center;
    }
</style>