class Directions extends Array {
    constructor(){
        super();
        this.push(new Direction("up", 0, -1) )
        this.push(new Direction("down", 0, 1) )
        this.push(new Direction("left", -1, 0) )
        this.push(new Direction("right", 1, 0) )
    }
    opposite(direction) {
        const {x, y} = direction.coordinates;
        const newX = ( x * (-1) );
        const newY = ( y * (-1) );
        const opposite = this.find(direction => 
            direction.coordinates.x === newX 
            && direction.coordinates.y === newY)
        return opposite;
    }
    getRandomized(){
        // Ändrar inte orginal-arrayen
        return this.#shuffleArray([...this]);

    }
    // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    // answered Sep 28, 2012 at 20:20 Laurens Holst
    #shuffleArray(array){
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
class Direction {
    constructor(name, x, y){
        this.name = name;
        this.coordinates = { x: x, y: y};
    }
}
export const DIRECTIONS = new Directions();