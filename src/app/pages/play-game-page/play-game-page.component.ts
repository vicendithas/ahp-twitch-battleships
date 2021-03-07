import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { combineLatest, partition, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { Board } from 'src/app/models/board';
import { Ship } from 'src/app/models/ship';
import { Shot } from 'src/app/models/shot';
import { BoardService, PendingShot, ShotAlert } from 'src/app/services/board.service';
import { DatabaseService, GameConnection } from 'src/app/services/database.service';
import { GameService } from 'src/app/services/game.service';

@Component({
  selector: 'app-play-game-page',
  templateUrl: './play-game-page.component.html',
  styleUrls: ['./play-game-page.component.css']
})
export class PlayGamePageComponent implements OnInit {
  playerBoard: Board;
  otherBoard: Board;

  playerShips: Ship[] = [];
  otherShips: Ship[] = [];

  pendingMessage: string = "";
  pendingTime: number;

  private _currentShots: Shot[] = [];
  private _otherShots: Shot[] = [];

  private currentShotsLoaded: boolean = false;
  private currentAlerts: Subject<ShotAlert> = new Subject();
  
  private otherShotsLoaded: boolean = false;
  private otherAlerts: Subject<ShotAlert> = new Subject();

  constructor(
    private router: Router, 
    private db: DatabaseService, 
    private bs: BoardService,
    private gs: GameService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const handleConnection = ({game, connected, playerKey}: GameConnection) => {

      let ready = game.getReady(playerKey);

      if (connected && ready) {

        this.setBoards();
        this.setAlerts();
        this.setPending();
      }
      
      if (connected && !ready) {
        this.gotoPlacement();
      }

    }

    this.db.onGameConnection().subscribe(
        handleConnection
    );
  }

  setPending(): void {
    this.bs.getPendingShot().subscribe(
      (p: null | PendingShot) => {
        if (p) {
          this.pendingMessage = `Firing at ${p.cell.data.name}`;
          this.pendingTime = p.time;
        } else {
          this.pendingMessage = "";
        }
      }
    )
  }

  setAlerts(): void {
    this.db.getPlayerKey().pipe(take(1))
      .subscribe(
        (playerKey: string) => {
          const [current, other] = partition(this.bs.getAlerts(),
            (sa: ShotAlert) => { return sa.shot.playerKey === playerKey }
          )

          current.subscribe((sa: ShotAlert) => { 
            this.currentAlerts.next(sa); 
          });
          other.subscribe((sa: ShotAlert) => { 
            this.otherAlerts.next(sa); 
          });
        }
      )
  }

  handleAlert(sa: ShotAlert, good: boolean=true): void {
    this.snackBar.openFromComponent(ShotAlertComponent, {
      duration: 3000,
      data: {sa, good}
    });
  }

  setBoards(): void {
    const checkToHandle = (list: Shot[], board: Board, shot: Shot) => {
      if (list.every(s => !shot.check(s))) {
        list.push(shot);
        this.bs.handleShot(board, shot);
      }
    }

    combineLatest([
      this.bs.getBoard(),
      this.bs.getBoard()
    ]).subscribe(
      (boards: Board[]) => {

        this.bs.loadCurrentShips(boards[0]);
        this.otherBoard = boards[0];

        this.gs.getOtherShots().subscribe(
          (shots: Shot[]) => { 
            shots.forEach(shot => {
              checkToHandle(this._otherShots, boards[0], shot);
            });

            if (!this.otherShotsLoaded) {
              this.otherAlerts.subscribe(
                sa => { this.handleAlert(sa, false)}
              );
            }
            this.otherShotsLoaded = true;
          }
        );


        this.bs.loadOtherShips(boards[1]);
        this.playerBoard = boards[1];
        
        this.gs.getCurrentShots().pipe(take(1)).subscribe(
          (shots: Shot[]) => { 
            shots.forEach(shot => {
              checkToHandle(this._currentShots, boards[1], shot);
            });

            if (!this.currentShotsLoaded) {
              this.currentAlerts.subscribe(
                sa => { this.handleAlert(sa, true)}
              );
            }
            this.currentShotsLoaded = true;
          }
        );
      }
    );

  }

  gotoPlacement(): void {
    this.db.getCurrentGame().pipe(take(1))
      .subscribe(game => {
        this.router.navigate(["/place"], {queryParams: {'game': game.key}});
      });
  }
}

@Component({
  selector: 'app-play-game-alert',
  template: `
  <span class='{{ cssClass }}'>{{ message }}</span>`,
  styleUrls: ['./play-game-page.component.css']
})
export class ShotAlertComponent implements OnInit {
  message: string;
  cssClass: string;
  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {}

  ngOnInit(): void {
    this.message = this.data.sa.message;
    this.cssClass = this.getCss();
  }

  getCss(): string {
    let sink = this.data.sa.sink ? " alert-sink" : "";
    let good = this.data.good ? " alert-good" : " alert-bad";
    return "shot-alert" + sink + good;
  }
}