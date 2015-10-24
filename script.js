enchant();

window.onload = function () {
  var game = new Game(480, 640);

  var Ball = Class.create(Sprite, {
    initialize: function(x, y, width, height) {
      Sprite.call(this, width, height);

      this.backgroundColor = 'white';
      this.x = x;
      this.y = y;
      this.vx = 0.0;
      this.vy = 0.0;
      this.shot = false;
    },

    onenterframe: function(){
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0)  {
          this.vx *= -1;
          this.x = 0;
      }
      if (this.x > game.width - this.width)  {
          this.vx *= -1;
          this.x = game.width - this.width;
      }
      if (this.y < 0)  {
          this.vy *= -1;
          this.y = 0;
      }
      if (this.y > game.height - this.height)  {
          this.vy *= -1;
          this.y = game.height - this.height;
      }
    },

    shoot: function(cx, cy) {
      if (this.shot) { return; }
      this.shot = true;

      angle = Math.atan2(cy - (this.y + this.height / 2), cx - (this.x + this.width / 2));
      this.vx = 10 * Math.cos(angle);
      this.vy = 10 * Math.sin(angle);
    }
  });

  var Block = Class.create(Sprite, {
    initialize: function(x, y, width, height) {
      Sprite.call(this, width, height)

      this.x = x;
      this.y = y;
      this.backgroundColor = 'white';

      this.active = true;
    },

    reflectBall: function(ball) {
      var left = this.x;
      var right = this.x + this.width;
      var dx = Math.min(left, right);

      var top = this.y;
      var bottom = this.y + this.height;
      var dy = Math.min(top, bottom);

      var beforeBallLeft = ball.x - ball.vx;
      var beforeBallRight = ball.x - ball.vx + ball.width;

      if (dx < dy && (beforeBallRight < left || right < beforeBallLeft) ) {
        ball.x -= ball.vx;
        ball.vx *= -1;
      } else {
        ball.y -= ball.vy;
        ball.vy *= -1;
      }
    }
  });

  var Bar = Class.create(Sprite, {
    initialize: function(x, y, width, height) {
      Sprite.call(this, width, height);

      this.x = x;
      this.y = y;
      this.backgroundColor = 'red';

      this.followingX = null;
    },

    follow: function() {
      if (this.followingX == null) { return; }

      var speed = 12;
      var dx = this.followingX - (this.x + this.width / 2);
      if (Math.abs(dx) < speed) {
        this.x = this.followingX - this.width / 2;
        return;
      }

      var direction = dx / Math.abs(dx);
      this.x += speed * direction;

      if (this.x < 0) { this.x = 0; }
      if (this.x + this.width > game.width) { this.x = game.width - this.width; }
    },

    startFollow: function(followingX) {
      this.followingX = followingX;
    },

    endFollow: function() {
      this.followingX = null;
    },

    reflectBall: function(ball) {
      // とりあえず縦だけ
      ball.y -= ball.vy;
      ball.vy *= -1;
    },
  });

  game.onload = function () {
    var gameScene = new Scene();
    gameScene.backgroundColor = 'black';

    var ball = new Ball(240, 480, 16, 16)

    var BLOCK_WIDTH = 60;
    var BLOCK_HEIGHT = 15;
    var blockPositions = [
      [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
      [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
      [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6],
      [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6],
      [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6]
    ];
    var blocks = [];
    blockPositions.forEach(function(position) {
      var x = position[0] * BLOCK_WIDTH;
      var y = position[1] * BLOCK_HEIGHT;
      var block = new Block(x, y, BLOCK_WIDTH, BLOCK_HEIGHT);
      blocks.push(block);
      gameScene.addChild(block);
    });

    var bar = new Bar(0, 560, 20, 80)

    gameScene.on('enterframe', function() {
      blocks.some(function(block) {
        if (block.active && block.intersect(ball)) {
            block.reflectBall(ball);
          block.active = false;
          gameScene.removeChild(block);
          return true;
        }
        return false;
      });

      bar.follow();
      if (bar.intersect(ball)) {
        bar.reflectBall(ball);
      }
    });

    gameScene.on('touchstart', function(e) {
      ball.shoot(e.x, e.y);
      bar.startFollow(e.x);
    });

    gameScene.on('touchmove', function(e) {
      bar.startFollow(e.x);
    });

    gameScene.on('touchend', function() {
      bar.endFollow();
    });

    gameScene.addChild(ball);
    gameScene.addChild(bar);

    game.pushScene(gameScene);
  };
  game.start();
}
