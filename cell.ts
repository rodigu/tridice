export const ROLL_COUNT = 4;

export function* cellIDIterator() {
  for (let a = 1; a <= ROLL_COUNT; a++)
    for (let b = 1; b <= a + 2; b++) {
      if (a === 1 && b > 1) continue;
      yield a * 10 + b;
    }
}

export function throwCustomError(error: Error, message: string): never {
  error.message = message;
  throw error;
}

type FaceNumber = 0 | 1 | 2 | 3 | 4;

export interface SimplifiedDice {
  up: FaceNumber;
  top: FaceNumber;
  down: FaceNumber;
  left: FaceNumber;
  right: FaceNumber;
  owner: Player;
}

// const CELL_IDS = Array.from(cellIDIterator());

export type NeighborType = "up" | "down" | "left" | "right";
export type CellID = number;
export interface Neighborhood {
  up: Cell | number;
  down: Cell | number;
  left: Cell | number;
  right: Cell | number;
}

export class DiceFaces {
  static faceNameToIndex = {
    left: 0,
    top: 1,
    right: 2,
    up: 3,
    down: 4,
  };

  static faceDirectionInverter = {
    left: "right",
    top: "top",
    right: "left",
    up: "down",
    down: "up",
  };

  private faces: FaceNumber[];
  constructor(faces: FaceNumber[] = [1, 2, 3, 4, 0]) {
    this.faces = faces;
  }

  copy() {
    return new DiceFaces([...this.faces]);
  }

  get pointingDirection(): "up" | "down" {
    if (this.nullIndex === this.faces.length - 1) return "up";
    return "down";
  }

  toString() {
    return this.faces.toString();
  }

  get left() {
    return this.faces[0];
  }
  get top() {
    return this.faces[1];
  }
  get right() {
    return this.faces[2];
  }
  get up() {
    return this.faces[3];
  }
  get down() {
    return this.faces[4];
  }

  get lastRealFace() {
    return this.faces[2];
  }

  get middleRealFace() {
    return this.faces[1];
  }

  get firstRealFace() {
    return this.faces[0];
  }

  set realFaces(newRealFaces: FaceNumber[]) {
    this.faces = [...newRealFaces, this.faces[3], this.faces[4]];
  }

  get realFaces() {
    return this.faces.slice(0, 4);
  }

  get nullZone() {
    return this.faces.slice(3);
  }

  get nullIndex() {
    if (this.faces[this.faces.length - 1] === 0) return this.faces.length - 1;
    return this.faces.length - 2;
  }

  get nullZoneNumber() {
    if (this.nullIndex === this.faces.length - 1)
      return this.faces[this.nullIndex - 1];
    return this.faces[this.nullIndex + 1];
  }

  get canMoveUp() {
    return this.up === 0;
  }
  get canMoveDown() {
    return this.down === 0;
  }

  rotate(direction: "right" | "left") {
    if (direction === "right" && this.nullIndex === this.faces.length - 2)
      direction = "left";
    else if (direction === "left" && this.nullIndex === this.faces.length - 1)
      direction = "right";

    if (direction === "right") {
      const oldNullZoneNumber = this.moveNumberToNullZone(this.lastRealFace);
      this.realFaces = [
        this.firstRealFace,
        this.middleRealFace,
        oldNullZoneNumber,
      ];
    } else {
      const oldNullZoneNumber = this.moveNumberToNullZone(this.firstRealFace);
      this.realFaces = [
        oldNullZoneNumber,
        this.middleRealFace,
        this.lastRealFace,
      ];
    }
  }

  moveNumberToNullZone(newNullZoneNumber: FaceNumber) {
    const oldNullZoneNumber = this.nullZoneNumber;
    const oldNullIndex = this.nullIndex;

    const newNullIndex = this.faces.indexOf(oldNullZoneNumber);

    this.faces[oldNullIndex] = newNullZoneNumber;
    this.faces[newNullIndex] = 0;

    return oldNullZoneNumber;
  }

  move(direction: NeighborType) {
    if (direction === "right") {
      const oldNullZoneNumber = this.moveNumberToNullZone(this.lastRealFace);
      this.realFaces = [
        oldNullZoneNumber,
        this.firstRealFace,
        this.middleRealFace,
      ];
    } else if (direction === "left") {
      const oldNullZoneNumber = this.moveNumberToNullZone(this.firstRealFace);
      this.realFaces = [
        this.middleRealFace,
        this.lastRealFace,
        oldNullZoneNumber,
      ];
    } else if (direction === "down" || direction === "up") {
      if (direction === "down" && !this.canMoveDown)
        throw new Error("Can't move down");
      if (direction === "up" && !this.canMoveUp)
        throw new Error("Can't move up");

      const oldNullZoneNumber = this.moveNumberToNullZone(this.middleRealFace);
      this.realFaces = [
        this.firstRealFace,
        oldNullZoneNumber,
        this.lastRealFace,
      ];
    }
  }

  static randint(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  randomMove() {
    const choice = ["up", "down", "left", "right"][
      DiceFaces.randint(0, 4)
    ] as NeighborType;

    if (choice === "up" || choice === "down") {
      if (this.canMoveDown) this.move("down");
      else if (this.canMoveUp) this.move("up");
    } else this.move(choice);
  }

  randomRotation() {
    const rot = Math.random() <= 0.5 ? "left" : "right";
    this.rotate(rot);
  }

  simulatedRoll(count: number) {
    for (let _ = 0; _ < count; _++) {
      this.randomMove();
      const doRotate = Math.random() >= 0.5;
      if (doRotate) this.randomRotation();
    }
  }

  roll() {
    const newFaces: FaceNumber[] = [0, 0, 0, 0, 0];
    const availablePositions = new Set([0, 1, 2, 3, 4]);
    const newNullPosition = DiceFaces.randint(
      this.faces.length - 2,
      this.faces.length
    );
    newFaces[newNullPosition] = 0;
    availablePositions.delete(newNullPosition);
    const leftoverFaceNumbers: FaceNumber[] = [1, 2, 3, 4];
    for (const num of leftoverFaceNumbers) {
      const randIndex = DiceFaces.randint(0, availablePositions.size);
      const newFacePosition = [...availablePositions][randIndex];
      newFaces[newFacePosition] = num;
      availablePositions.delete(newFacePosition);
    }

    this.faces = newFaces;
  }
}

export class Dice {
  readonly id: string;
  private currentCell: Cell | null;
  private faces: DiceFaces;
  readonly owner: Player;

  static Directions: NeighborType[] = ["up", "down", "left", "right"];

  static ERROR = {
    InvalidDirection: new Error("Invalid direction for dice movement."),
    CellNotSet: new Error("Cell not set to class instance."),
    NoMoves: new Error("Dice has no attempted moves."),
    NoMovesLeft: new Error("Dice has no moves left."),
    HasMovesLeft: new Error("Can't finish dice move with moves left on dice."),
  };

  moveCount: number;
  temporaryFaces: DiceFaces;
  movementTracking: Array<[Cell, NeighborType]>;

  state: string;

  constructor(id: string, owner: Player) {
    this.id = id;
    this.owner = owner;
    this.currentCell = null;
    this.movementTracking = [];
    this.faces = new DiceFaces();
    this.temporaryFaces = this.faces.copy();
    this.moveCount = this.faces.top;
    this.state = "";
  }

  get topFace() {
    return this.faces.top;
  }

  get facesString() {
    return this.faces.toString;
  }

  get currentPointingDirection() {
    return this.faces.pointingDirection;
  }

  get temporaryPointingDirection() {
    return this.temporaryFaces.pointingDirection;
  }

  rotate(direction: "left" | "right") {
    this.faces.rotate(direction);
    this.temporaryFaces = this.faces.copy();
  }

  /**
   * Removes itself from previous cell, sets its `currentCell` to the new cell.
   *
   * Doesn't change faces.
   *
   * Ignores whether cell is occupied or not
   * @date 4/5/2023 - 11:37:02 AM
   *
   * @param {Cell} cell
   */
  moveTo(cell: Cell) {
    this.currentCell?.removeDice();
    cell.dice = this;
    this.currentCell = cell;
    this.movementTracking = [];
  }

  resetTemporaryMoves() {
    this.movementTracking = [];
    this.moveCount = this.faces.top;
    this.temporaryFaces = this.faces.copy();
  }

  removeFromCell() {
    this.currentCell = null;
  }

  /**
   * Sets faces to temporary faces.
   *
   * Uses `moveTo` with last cell on `movementTracking`.
   *
   * Move count reset to top face.
   * @date 4/5/2023 - 11:38:19 AM
   */
  fixTemporaryFaces() {
    if (!this.canFinishMoving)
      throwCustomError(
        Dice.ERROR.HasMovesLeft,
        `Dice [${this.id}] cannot finish moving because it still has ${this.moveCount} moves left.`
      );

    this.faces = this.temporaryFaces.copy();
    const lastMove = this.movementTracking[this.movementTracking.length - 1];
    this.moveTo(lastMove[0]);
    this.movementTracking = [];
    this.moveCount = this.faces.top;
  }

  get canFinishMoving() {
    return this.moveCount === 0;
  }

  /**
   * Attempts to move to given direction.
   *
   * Ignores whether cell it is trying to move to is empty.
   *
   * @date 4/5/2023 - 11:41:16 AM
   *
   * @throws {Dice.ERROR.InvalidDirection} if next neighbor is undefined
   * @param {NeighborType} direction
   */
  tryMoveTo(direction: NeighborType) {
    if (this.canFinishMoving)
      throwCustomError(
        Dice.ERROR.NoMovesLeft,
        `Dice [${this.id}] cannot move because it's move count has reached 0.`
      );

    let nextNeighbor = this.cell?.getNeighbor(direction);

    if (this.movementTracking.length > 0)
      nextNeighbor = this.movementTracking[
        this.movementTracking.length - 1
      ]![0].getNeighbor(direction);

    if (nextNeighbor === undefined)
      throwCustomError(
        Dice.ERROR.InvalidDirection,
        `Dice [${this.id}] cannot move [${direction}] from [${this.cell}] because there is no cell there.`
      );

    if (typeof nextNeighbor === "number")
      throwCustomError(
        Dice.ERROR.InvalidDirection,
        `Dice [${this.id}] cannot move [${direction}] because ${nextNeighbor} is still a number.`
      );

    this.temporaryFaces.move(direction);

    const undoDirection = DiceFaces.faceDirectionInverter[
      direction
    ] as NeighborType;

    this.movementTracking.push([nextNeighbor, undoDirection]);
    this.moveCount--;
  }

  undoMove() {
    const lastMove = this.movementTracking.pop();
    if (lastMove === undefined)
      throwCustomError(
        Dice.ERROR.NoMoves,
        `Dice [${this.id}] cannot undo moves because it has made none.`
      );

    this.temporaryFaces.move(lastMove[1]);
    this.moveCount++;
    return lastMove[0];
  }

  get cell() {
    return this.currentCell;
  }

  roll() {
    this.faces.roll();
    this.moveCount = this.faces.top;
    this.temporaryFaces = this.faces.copy();
  }

  simulatedRoll(count: number) {
    this.faces.simulatedRoll(count);
    this.moveCount = this.faces.top;
    this.temporaryFaces = this.faces.copy();
  }

  toString() {
    return this.faces.toString();
  }

  simplified(): SimplifiedDice {
    return {
      left: this.faces.left,
      top: this.faces.top,
      right: this.faces.right,
      up: this.faces.up,
      down: this.faces.down,
      owner: this.owner,
    };
  }
}

export class Cell {
  private neighbors: Neighborhood;
  private content: Dice | null;
  readonly id: CellID;
  readonly pointingDirection: "up" | "down";

  static ERROR = {
    AlreadyFull: new Error("Cell already full."),
    EmptyCell: new Error("Trying to remove dice from empty cell."),
    NeighborAlreadySet: new Error("Trying to set already defined neighbor."),
    InvalidNeighbor: new Error("Trying to add an invalid neighbor."),
    DiceDoesntFit: new Error("Dice doesn't fit cell."),
  };

  constructor(
    id: CellID,
    neighbors: Neighborhood,
    pointingDirection: "up" | "down"
  ) {
    this.neighbors = neighbors;
    this.id = id;
    this.content = null;
    this.pointingDirection = pointingDirection;
  }

  get neighborhood() {
    return this.neighbors;
  }

  get neighborsIDs() {
    return {
      up: this.neighbors.up instanceof Cell ? this.neighbors.up.id : null,
      down: this.neighbors.down instanceof Cell ? this.neighbors.down.id : null,
      left: this.neighbors.left instanceof Cell ? this.neighbors.left.id : null,
      right:
        this.neighbors.right instanceof Cell ? this.neighbors.right.id : null,
    };
  }

  set dice(dice: Dice | null) {
    if (this.content !== null)
      throwCustomError(
        Cell.ERROR.AlreadyFull,
        `Cell [${this.id}] already contains the dice [${this.dice}].`
      );
    if (dice !== null && !this.diceFits(dice))
      throwCustomError(
        Cell.ERROR.DiceDoesntFit,
        `Dice [${this.dice}] doesn't fit in cell [${this.id}].`
      );

    this.content = dice;
  }

  get dice(): Dice | null {
    return this.content;
  }

  diceFits(dice: Dice) {
    if (dice.currentPointingDirection !== this.pointingDirection) return false;
    return true;
  }

  removeDice(): Dice {
    const dice = this.content;
    if (dice === null)
      throwCustomError(Cell.ERROR.EmptyCell, `Cell [${this.id}] is empty.`);

    this.content = null;
    dice.removeFromCell();
    return dice;
  }

  getNeighbor(neighbor: NeighborType) {
    return this.neighbors[neighbor];
  }

  setNeighbor(
    neighborDirection: NeighborType,
    neighborCell: Cell,
    doReciprocate = true
  ) {
    const neighbor = this.neighbors[neighborDirection];

    if (typeof neighbor !== "number")
      throwCustomError(
        Cell.ERROR.NeighborAlreadySet,
        `Cell [${this.id}] already has a(n) [${neighborDirection}] neighbor: [${neighbor.id}].`
      );

    if (neighbor !== neighborCell.id)
      throwCustomError(
        Cell.ERROR.InvalidNeighbor,
        `Cell [${this.id}] was expecting a neighbor with id [${neighbor}], instead got a neighbor with id [${neighborCell.id}].`
      );

    this.neighbors[neighborDirection] = neighborCell;
    if (
      neighborDirection !== "up" &&
      neighborDirection !== "down" &&
      doReciprocate
    ) {
      const inverseDirection = DiceFaces.faceDirectionInverter[
        neighborDirection
      ] as NeighborType;
      neighborCell.setNeighbor(inverseDirection, this, false);
    }
  }
}

export class Player {
  readonly dice: Map<string, Dice>;
  readonly id: number;
  readonly lostDice: Map<string, Dice>;
  readonly diceOnBoard: Map<string, Dice>;

  constructor(playerNumber: number, numberOfDice = 4) {
    this.id = playerNumber;
    this.dice = new Map();
    for (let diceID = 0; diceID < numberOfDice; diceID++) {
      const diceStringID = (this.id * 10 + diceID).toString();
      this.dice.set(diceStringID, new Dice(diceStringID, this));
    }

    this.lostDice = new Map();
    this.diceOnBoard = new Map();
  }

  loseDice(dice: Dice) {
    this.diceOnBoard.delete(dice.id);
    this.lostDice.set(dice.id, dice);
  }

  placeDice(dice: Dice) {
    this.diceOnBoard.set(dice.id, dice);
  }

  getDice(num: number) {
    const diceID = (this.id * 10 + num).toString();
    return this.dice.get(diceID);
  }
}
