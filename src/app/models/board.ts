import { Ghost, Ship } from './ship';
import { Cell } from './cell';
import { MonData } from '../services/mon.service';

class ShipPlacementError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ShipPlacementError';
    }
}

class BoardError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BoardError';
    }
}

export class Board {
    cells: Cell[] = [];

    constructor(public width: number, public totalCells: number, public data: MonData[]) {
        for (let i = 0; i < totalCells; i++) {
            this.cells.push(new Cell(this.getData(i)));
        }
    }

    getData(index: number): MonData {
        return this.data[index];
    }

    getCell(row: number, col: number): Cell | null {
        if (col > this.width - 1) {
            return null;
        }

        let cell = this.cells[(row * this.width) + col];

        return cell;
    }

    enableAll(): void {
        this.cells.forEach(
            cell => { cell.disabled = false; }
        );
    }

    disableAll(): void {
        this.cells.forEach(
            cell => { cell.disabled = true; }
        );
    }

    filterCells(sub: string): void {
        sub = sub.toUpperCase();

        if (!sub) {
            this.enableAll();
        } else {

            this.cells.forEach(
                cell => {
                    if (cell.data && !cell.data.name.toUpperCase().includes(sub)) {
                        cell.disabled = true;
                    } else {
                        cell.disabled = false;
                    }
                }
            );
        }
    }

    placeShips(ships: Ship[]): void {
        ships.forEach(ship => {
            if (ship.placed) {
              this.setShipPosition(ship, ship.row, ship.col);
            }
        });
    }

    setShipPosition(ship: Ship, row: number, col: number): void {
        let cells = [];
        let currentCell = null;
        let newPos = {row, col};

        for (let i = 0; i < ship.size; i++) {
            currentCell = this.getCell(row, col);

            if (!currentCell) {
                throw new BoardError(`There is no Cell at row: ${row}, col: ${col}`);
            }

            if (currentCell.hasShip && currentCell.ship !== ship) {
                throw new ShipPlacementError(`The Cell at row: ${row}, col: ${col} already has a Ship`);
            }

            cells.push(currentCell);

            if (ship.direction === 'x') {
                col++;
                if (col === newPos.col + ship.xsize){
                    col = newPos.col;
                    row++;
                }
            }

            if (ship.direction === 'y') {
                row++;
                if (row === newPos.row + ship.xsize){
                    row = newPos.row;
                    col++;
                }
            }
        }

        ship.setPosition(newPos.row, newPos.col, cells);
    }

    setShadow(ghost: Ghost, row: number, col: number) {
        let cells = [];
        let currentCell = null;

        let origrow = row;
        let origcol = col;

        for (let i = 0; i < ghost.size; i++) {
            currentCell = this.getCell(row, col);

            if (currentCell && !currentCell.hasShip) {
                cells.push(currentCell);
            }

            if (ghost.direction === 'x') {
                col++;
                if (col === origcol + ghost.ship.xsize){
                    col = origcol;
                    row++;
                }
            }

            if (ghost.direction === 'y') {
                row++;
                if (row === origrow + ghost.ship.xsize){
                    row = origrow;
                    col++;
                }
            }
        }

        ghost.setShadow(cells);
    }
}
