export default class Iterator {
    target = null;
    #_isPaused = false;
    set #isPaused(value){
        if(this.#_isPaused !== value){
            this.#_isPaused = value;
            this.onPauseChange?.call(this, value);
        }
    }
    get isPaused() { return this.#_isPaused }
    speed = 300; //ms
    #runningTimer = 0;
    // Svelte utanför klassen känner inte av när properties ändras inifrån
    // Lättast att lösa med en callback men det går kanske att använda Svelte-store istället
    onPauseChange;

    #loopingTimer(){
        if(this.#_isPaused === false && this.target != null){
            this.#runningTimer += 1;
            setTimeout(() => {
                this.#runningTimer -= 1;
                this.#loopingTimer();
            }, this.speed);
            this.#next();
        }
    }
    #next(){
        const iteration = this.target?.next();
        if(iteration?.done){
            this.target = null;
        }
    }

    start(){
        // Starta bara om timern inte redan är igång
        if(this.#runningTimer === 0){
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
            if(this.target == null)
                return;
            done = this.target.next().done;
        }
    }
}