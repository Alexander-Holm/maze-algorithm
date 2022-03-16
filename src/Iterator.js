export default class Iterator {
    function = null; // Generator function
    #_isPaused = false;
    set #isPaused(value){
        if(this.#_isPaused !== value){
            this.#_isPaused = value;
            this.onPauseChange?.call(this, value);
        }
    }
    get isPaused() { return this.#_isPaused }
    speed = 300; //ms
    #timerRunning = false;
    // Svelte utanför klassen känner inte av när properties ändras inifrån av funktionerna
    // Lättast att lösa med en callback men det går kanske att använda Svelte-store istället
    onPauseChange;
    onFinished;

    #loopingTimer(){
        if(this.#_isPaused === false && this.function != null){
            this.#timerRunning = true;
            setTimeout(() => {
                this.#timerRunning = false;
                this.#loopingTimer();
            }, this.speed);
            this.#next();
        }
    }
    #next(){
        const iteration = this.function?.next();
        if(iteration?.done){
            this.function = null;
            this.onFinished?.call();
        }
    }

    start(){
        // Starta bara om timern inte redan är igång
        if(this.#timerRunning === false){
            this.#isPaused = false;
            this.#loopingTimer();
        }
    }
    stop(){
        this.#isPaused = true;
    }
    step(){
        this.#isPaused = true;
        this.#next();
    }
    instant(){
        let done = false;
        while(done === false){
            // För att inte kunna fastna i en evighets-loop     
            if(this.function == null)
                return;
            done = this.function.next().done;
        }
        this.onFinished?.call();
    }
}