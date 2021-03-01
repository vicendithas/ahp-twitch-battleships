import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Board } from '../models/board';
import { Cell } from '../models/cell';
import { Game } from '../models/game';
import { Ship } from '../models/ship';
import { GameDatabaseService } from './game.database.service';


@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private _selected: Subject<Ship | null> = new Subject<Ship | null>();
  private _previous: Ship | null = null;
  selected$: Observable<Ship | null>;

  cellSize = 25;

  constructor(private db: GameDatabaseService) {
    this.selected$ = this._selected.asObservable();
  }

  getBoard(): Observable<Board> {
    return this.db.getCurrentGame().pipe(
      map((game: Game) => {
        return new Board(game.boardWidth, game.totalCells);
      }),
      take(1)
    )
  }

  loadCurrentShips(board: Board): void {
    this.db.getCurrentShips().pipe(take(1)).subscribe(
      (ships: Ship[]) => {this.placeShips(board, ships)}
    );
  }

  placeShips(board: Board, ships: Ship[]): void {
    ships.forEach(ship => {
      if (ship.placed) {
        board.setShipPosition(ship, ship.row, ship.col)
      }
    });
  }

  selectShip(ship: Ship): void {
    if (this._previous) {
      let prev = this._previous;
      prev.selected = false;
      if (prev.cells.length === prev.size) {
        prev.placed = true;
      }

      // if a previously selected ship is placed on the board
      // make sure it's current state is updated in the database
      if (prev.placed) {
        this.db.updateShip(prev, {
          placed: true,
          row: prev.row,
          col: prev.col,
          direction: prev.direction
        })
      }
    }

    if (ship) {
      ship.selected = true;

      // if ship is selected make sure placed is false in database
      this.db.updateShip(ship, {placed: false});
    }

    this._selected.next(ship);
    this._previous = ship;
  }
}