export default class Grid extends Array{
    constructor(size){
        super();
        for(let columnIndex = 0; columnIndex < size; columnIndex++){
            const row = new Array(size);
            for(let rowIndex = 0; rowIndex < size; rowIndex++){
                row[rowIndex] = new Cell(columnIndex, rowIndex);
            }
            this.push(row);
        }
    }

    isCellValid(x, y){
        if(x > this.length - 1 || x < 0)
            return false;
        if(y > this[x].length - 1 || y < 0)
            return false;
        if(this[x][y].visited === true)
            return false;
        return true;
    }
}

class Cell{
    active = false;
    visited = false;
    finished = false;
    walls = {
        up: true,
        down: true,
        left: true,
        right: true,
    };
    coordinates;
    
    constructor(x, y){
        this.coordinates = {
            x: x,
            y: y,
        }
    }
}