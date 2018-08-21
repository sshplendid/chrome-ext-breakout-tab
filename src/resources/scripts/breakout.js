'use strict';

// config
const CONF = {};
CONF.canvasWidth = 450;
CONF.canvasHeight = 600;
CONF.paddleBaseY = 100;
CONF.backgroundColor = '#f2f4ff';


// init

var canvas = document.createElement('canvas');
canvas.width = CONF.canvasWidth;
canvas.height = CONF.canvasHeight;

document.getElementById('app').appendChild(canvas);
var ctx = canvas.getContext('2d');

var rightPressed = false;
var leftPressed = false;

function keyDownHandler(e) {
    if(e.keyCode == 39) {
        rightPressed = true;
    }
    else if(e.keyCode == 37) {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.keyCode == 39) {
        rightPressed = false;
    }
    else if(e.keyCode == 37) {
        leftPressed = false;
    }
}

document.addEventListener('keyup', keyUpHandler);
document.addEventListener('keydown', keyDownHandler);

function Ball(_x, _y, _r, _c, _dx, _dy) {

  this.x = val => _x = val || _x;
  this.y = val => _y = val || _y;
  this.dx = val => _dx = val || _dx;
  this.dy = val => _dy = val || _dy;
  this.radius = val => _r = val || _r;
  this.color = val => _c = val || _c;

  Ball.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x(), this.y(), this.radius(), 0, Math.PI*2);
    ctx.fillStyle = this.color();
    ctx.fill();
    ctx.closePath();
  };

  Ball.prototype.move = function(board) {
    this.move.crossed = this.move.crossed || false;
    if(this.y() - this.radius() + this.dy() <= 0) {
      this.dy(this.dy() * (0-1));
    } else if(this.y() + this.radius() + this.dy() >= canvas.height - CONF.paddleBaseY) {
      if(this.y() < canvas.height - CONF.paddleBaseY && this.x() > board.x() && this.x() <= board.x() + board.w()) {
        this.dy(this.dy() * (0-1));
      }
    }
    if(this.x() + this.dx() <  this.radius() || this.x() + this.dx() > canvas.width - this.radius()) {
      this.dx(this.dx() * (0-1));
    } else if( (this.y() > board.y() && this.y() < board.y() + board.h() && this.x() + this.radius() + this.dx() >= board.x())
              && (this.y() > board.y() && this.y() < board.y() + board.h() && this.x() - this.radius() + this.dx() <= board.x() + board.w()) ) {
      this.dx(this.dx() * (0-1));
    }

    this.x(this.x() + this.dx());
    this.y(this.y() + this.dy());
    console.debug('(x, y) => (' + this.x() + ', ' + this.y() + ', ' + this.dy() + ')');
  };
  Ball.prototype.detectCollision = (bricks) => {
    var _c = bricks.length;
    for(var c = 0; c < _c; c++) {
      var _r = bricks[c].length;
      for(var r = 0; r < _r; r++) {
        var b = bricks[c][r];
        if(b.durability() > 0 && this.x() + this.radius() > b.x() && this.x() + this.radius() < b.x() + b.w()
            && this.y() + this.radius() > b.y() && this.y() + this.radius() < b.y() + b.h()) {
              console.info('detectCollision');
          // TODO 벽돌 안에 들어가는 버그 수정하기
          if(this.x() < b.x() )
            this.dx((-1)*this.dx());
          else
            this.dy((-1)*this.dy());
          b.collision();
        }
      }
    }
  };
}

function BallManager(number) {
  var balls = [];
  for(var i = 0; i < number; i++) {
    balls[i] = new Ball(230, 230, 3, 'blue', (Math.random() - 0.5)*4, (Math.random() - 0.5)*4);
  }

  this.get = i => balls[i] || 0;
  this.getAll = () => balls;
  this.length = balls.length;
  this.allGone = () => balls.filter(ball => ball.y() - ball.radius() > canvas.height || ball.x() - ball.radius() < 0 || ball.x()  + ball.radius() > canvas.height).length  == balls.length;
}

function Board(_x, _y, _w, _h, _dx, _color) {
  this.x = val => _x = val || _x;
  this.y = val => _y = val || _y;
  this.w = val => _w = val || _w;
  this.h = val => _h = val || _h;
  this.dx = val => _dx = val || _dx;
  this.color = val => _color = val || _color;

  Board.prototype.move = function() {
    if(rightPressed) {
      this.dx(Math.abs(this.dx()));
      // console.log('r: ');
    } else if(leftPressed){
      this.dx(Math.abs(this.dx()) * (0-1));
      // console.log('l: ');
    } else {
      return;
    }
    if(this.x() + this.dx() <  0 || this.x() + this.w() + this.dx() > canvas.width)
      return;

    this.x(this.x() + this.dx());
  };
  Board.prototype.draw = function() {
    ctx.beginPath();
    ctx.rect(this.x(), this.y(), this.w(), this.h());
    ctx.fillStyle = this.color();
    ctx.fill();
    ctx.closePath();
  }
}

function BrickFactory(_r, _c, _w, _h, _color, _padding, _offsetTop, _offsetLeft) {
  function Brick(_x, _y, _w, _h, _c, _durability) {
    this.x = val => _x = val || _x;
    this.y = val => _y = val || _y;
    this.w = val => _w = val || _w;
    this.h = val => _h = val || _h;
    this.c = val => _c = val || _c;
    this.durability = val => _durability = val || _durability;
    this.color = [undefined, 'red', 'orange', 'green'];
    Brick.prototype.draw = Brick.prototype.draw || function() {
      ctx.beginPath();
      ctx.rect(this.x(), this.y(), this.w(), this.h());
      ctx.fillStyle = this.c();
      ctx.fill();
      ctx.closePath();
    };
    this.collision = function() {
      if(_durability > 0)
      _durability -= 1;
      this.c(this.color[_durability]);
      console.warn(`(${c}, ${r}) => ${_durability}`);
    };
  }

  var color = [undefined, 'red', 'orange', 'green'];
  var bricks = [];
  for(var c = 0; c < _c; c++) {
    bricks[c] = [];
    for(var r = 0; r < _r; r++) {
      var brickX = c * (_w + _padding) + _offsetLeft;
      var brickY = r * (_h + _padding) + _offsetTop;
      var durability = Math.ceil(Math.random()*3) ;
      // console.warn(`(${c}, ${r}) => ${durability}`);
      bricks[c][r] = new Brick(brickX, brickY, _w, _h, color[durability], durability);
    }
  }

  this.getBricks = () => bricks;
  this.getBrick = (x, y) => bricks[x][y];
  BrickFactory.prototype.drawBricks = () => {
    for(var c = 0; c < _c; c++) {
      for(var r = 0; r < _r; r++) {
        if(bricks[c][r].durability() > 0)
          bricks[c][r].draw();
      }
    }
  };
  BrickFactory.prototype.hasBricks = () => {
    for(var c = 0; c < _c; c++) {
      for(var r = 0; r < _r; r++) {
        if(bricks[c][r].durability() > 0)
          return true;
      }
    }
    return false;
  };
}

var gameOn = () => {
  function gameOver(predicate, intervalId) {
    // if(ball.y() - ball.radius() > canvas.height || ball.x() - ball.radius() < 0 || ball.x()  + ball.radius() > canvas.height) {
    if(predicate()) {
      var gameOverPage = document.querySelector('#gameOver');
      gameOverPage.classList.remove('hidden');
      gameOverPage.onclick = () => {
        gameOverPage.classList.add('hidden');
        gameOn();
      };
      clearInterval(intervalId);
    }
  }

  function clearGame(predicate, intervalId) {
    if(predicate()) {
      var gameClearPage = document.querySelector('#gameClear');
      gameClearPage.classList.remove('hidden');
      gameClearPage.onclick = () => {
        gameClearPage.classList.add('hidden');
        gameOn();
      };
      clearInterval(intervalId);
    }
  }


  var ballManager = new BallManager(1);
  var board = new Board(250, 500, 120, 10, 3, 'rgba(36, 68, 38, 0.8)');
  var bricks = new BrickFactory(4, 4, 80, 20, 'lightgray', 30, CONF.paddleBaseY, 25);

  var intervalId = setInterval(function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.closePath();
    var drawBackground = () => {
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = CONF.backgroundColor;
      ctx.fill();
      ctx.closePath();
      console.log('background: ' + ctx.fillStyle);
    };
    drawBackground();

    bricks.drawBricks();
    ballManager.getAll().forEach(ball => ball.detectCollision(bricks.getBricks()));
    ballManager.getAll().forEach(ball => ball.move(board));
    ballManager.getAll().forEach(ball => ball.draw());
    board.move();
    board.draw();
    gameOver(ballManager.allGone, intervalId);
    clearGame(() => !bricks.hasBricks(), intervalId);
  }, 10);
};


var startPage = document.querySelector('#gameStart');
startPage.onclick = () => {
  startPage.classList.add('hidden');
  gameOn();
};
