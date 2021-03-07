import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Game } from 'src/app/models/game';
import { DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-new-game-page',
  templateUrl: './new-game-page.component.html',
  styleUrls: ['./new-game-page.component.css']
})
export class NewGamePageComponent implements OnInit {
  game: Game = new Game("New Game", 10, 100);
  
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
    let dialogRef = this.dialog.open(NewGameDialogComponent);

    dialogRef.afterClosed().subscribe(
      (result: any) => {
        if (result) { this.makeGame(); }
      }
    );
  }

  makeGame(): void {
    this.validateFields();

    // passes form data to the database to create a new game
    // and returns a promise to get the gameKey
    // use the gameKey when returned to navigate to the '/place/
    // page with gameKey as 'game' parameter

    this.db.createGame(this.game).subscribe(
      () => {
        this.router.navigate(["/place"], {queryParams: {'game': this.game.key}});
      }
    );
    // TODO:
    // add .catch later to provide front end error handling to the
    // html template
  }

  validateFields(): void {
    let wStr: string = this.game.boardWidth + "";
    let cStr: string = this.game.totalCells + "";

    const toNum = (s: string, min: number, max: number): number => {
      let num = parseInt(s.replace(/\D/g, ""));
      if (num < min) {num = min}
      if (num > max) {num = max}

      return num;
    }

    this.game.boardWidth = toNum(wStr, 10, 30);
    this.game.totalCells = toNum(cStr, 50, 386);
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
