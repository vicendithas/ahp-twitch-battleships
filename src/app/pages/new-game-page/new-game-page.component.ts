import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NewGameInfoComponent } from 'src/app/blurbs/new-game-info/new-game-info.component';
import { Game } from 'src/app/models/game';
import { DatabaseService } from 'src/app/services/database.service';

export interface Generation {
  name: string;
  totalCells: number;
  defaultWidth: number;
}

@Component({
  selector: 'app-new-game-page',
  templateUrl: './new-game-page.component.html',
  styleUrls: ['./new-game-page.component.css']
})
export class NewGamePageComponent implements OnInit {
  game: Game = new Game('New Game', 13, 151, 6, [5, 4, 4, 3, 3, 2], [1, 2, 1, 1, 1, 1]);
  gens: Generation[] = [
    {name: 'Gen 1', totalCells: 151, defaultWidth: 13},
    {name: 'Gen 2', totalCells: 251, defaultWidth: 16},
    {name: 'Gen 3', totalCells: 386, defaultWidth: 20}
  ];
  selected: Generation = this.gens[0];

  constructor(
    private router: Router,
    private db: DatabaseService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.db.gameLoaded) {
      window.location.reload();
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(NewGameDialogComponent);

    dialogRef.afterClosed().subscribe(
      (result: any) => {
        if (result) { this.makeGame(); }
      }
    );
  }

  openHelp(): void {
    this.dialog.open(NewGameInfoComponent);
  }

  makeGame(): void {
    this.validateFields();

    this.db.createGame(this.game).subscribe(
      () => {
        this.router.navigate(['/place'], {queryParams: {game: this.game.key}});
      }
    );
  }

  validateFields(): void {
    const toNum = (s: string, min: number, max: number): number => {
      let num = parseInt(s.replace(/\D/g, ''), 10);
      if (num < min || isNaN(num)) {num = min; }
      if (num > max) {num = max; }
      return num;
    };

    this.game.boardWidth = toNum(this.game.boardWidth + '', 10, 30);
    this.game.totalCells = toNum(this.game.totalCells + '', 50, 386);
    this.game.totalShips = toNum(this.game.totalShips + '', 1, 10);

    const slStr: string = this.game.shipLengths + '';
    const slArr = slStr.split(',');
    this.game.shipLengths = [];
    while (slArr.length < this.game.totalShips){
      slArr.push('2');
    }
    while (slArr.length > this.game.totalShips){
      slArr.pop();
    }
    for (const item of slArr){
      this.game.shipLengths.push(toNum(item, 1, 6));
    }

    const swStr: string = this.game.shipWidths + '';
    const swArr = swStr.split(',');
    this.game.shipWidths = [];
    while (swArr.length < this.game.totalShips){
      swArr.push('1');
    }
    while (swArr.length > this.game.totalShips){
      swArr.pop();
    }
    for (const item of swArr){
      this.game.shipWidths.push(toNum(item, 1, 6));
    }
  }

  selectGen(event: any): void {
    this.game.boardWidth = event.value.defaultWidth;
    this.game.totalCells = event.value.totalCells;
  }
}


@Component({
  selector: 'app-new-game-dialog',
  template: `
  <mat-dialog-content>Confirm New Game?</mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="true" cdkFocusInitial>Confirm</button>
  </mat-dialog-actions>`
})
export class NewGameDialogComponent {}
