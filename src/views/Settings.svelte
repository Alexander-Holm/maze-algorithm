<script>
    import {DEFAULTS} from "../javascript/Defaults"
    import ColorPicker from "../components/ColorPicker.svelte";
    import ResetButton from "../components/ResetButton.svelte"
    import Slider from "../components/Slider.svelte"
    import InputBoxNumber from "../components/InputBoxNumber.svelte"

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

<div id="settings">
    <button 
        on:click={() => closed = !closed}
        id="open-settings"
        class:closed
    >
        <span>⏵</span>
    </button>

    <div class="expandable" class:closed>
        <h2>Inställningar</h2>
    
        <!-- Size -->
        <div class="group">
            <!-- slider-label-container passar på både containern och label, inte gjort av misstag -->
            <div class="slider-header">
                <h3>Storlek:</h3>
                <div class="input__box-container">                    
                    <InputBoxNumber 
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
                <div class="input__box-container">
                    <InputBoxNumber 
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

<style>
    #settings{
        display: flex;
        border-radius: 8px 0px 0px 8px;
        overflow: hidden;
        box-shadow: 0 0 2px 0px black;
    }
    #open-settings{
        background: #484848;
        border: 0;
        margin: 0;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        width: 1em;
    }
        #open-settings:hover{
            filter: contrast(1.3);
        }
        #open-settings span{
            display: block;
            color: white;
        }
            #open-settings.closed span{
                transform: rotateY(180deg);
            }
    .expandable{
        align-self: center;
        display: flex;
        flex-direction: column;
        align-items: center;

        background: rgba(245, 245, 245, 0.9);
        width: 20rem;
        padding-inline: 40px;
        overflow: hidden;
        transition: 0.35s ease-out;;
    }
        .expandable.closed{
            width: 0;
            padding-inline: 0;
        }
    .group{
        width: 100%;
        padding: 10px;
        margin: 15px 0;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
    }
    #color-settings{
        align-items: stretch;
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
    .input__box-container{
        display: flex;
        align-items: center;
        margin-inline: 12px;
    }
        .input__box-container span{
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