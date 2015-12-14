enchant();

window.onload = function () {
  var game = new Game(480, 640);

  game.preload('ball.png');
  game.preload('bar.png');
  game.preload('block.png');

  var Ball = Class.create(Sprite, {
    initialize: function(width, height) {
      Sprite.call(this, width, height);
    },

    resetStatus: function(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0.0;
      this.vy = 0.0;
      this.shot = false;
      this.image = game.assets['ball.png'];
    },

    onenterframe: function(){
      // 移動
      this.x += this.vx;
      this.y += this.vy;

      // 壁に反射
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

      //アニメーション
      this.frame = (this.age / 4) % 2;
    },

    // 指定座標方向に移動を開始
    shoot: function(cx, cy) {
      if (this.shot) { return; }
      this.shot = true;

      var angle = Math.atan2(cy - (this.y + this.height / 2), cx - (this.x + this.width / 2));
      this.vx = 10 * Math.cos(angle);
      this.vy = 10 * Math.sin(angle);
    }
  });

  var Block = Class.create(Sprite, {
    initialize: function(width, height) {
      Sprite.call(this, width, height)
    },

    resetStatus: function(x, y) {
      this.x = x;
      this.y = y;
      this.active = true;
      this.visible = true;
      this.image = game.assets['block.png'];
    },

    // ボールを反射させる
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
    },

    // ボールとの衝突確認
    checkCollision: function(ball){
      if (!this.active) { return false; }

      if (this.intersect(ball)) {
        this.reflectBall(ball);
        this.active = false;
        this.visible = false;
        return true;
      }

      return false;
    },

    onenterframe: function(){
      this.frame = (this.age / 3) % 3;
    }
  });

  var Bar = Class.create(Sprite, {
    initialize: function(width, height) {
      Sprite.call(this, width, height);
    },

    resetStatus: function(x, y){
      this.x = x;
      this.y = y;
      this.image = game.assets['bar.png'];

      this.followingX = null;
    },

    follow: function() {
      if (this.followingX == null) { return; }

      // クリック・ドラッグに追従
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

    // ボールを反射
    reflectBall: function(ball) {
      // とりあえず縦だけ
      ball.y -= ball.vy;
      ball.vy *= -1;
    },
  });

  var ClearScene = Class.create(Scene, {
    initialize: function(time, gameController) {
      _this = this;

      Scene.call(this);
      _this.backgroundColor = 'black'

      var timeLabel = new Label();
      timeLabel.x = game.width / 2 - 30;
      timeLabel.y = game.height / 2 - 15;
      timeLabel.color = '#32C8FA';
      timeLabel.font = '30px sans-serif';
      timeLabel.text = parseInt(time);

      _this.addChild(timeLabel);

      this.on('touchstart', function(e) {
        //リトライ
        gameController.resetGameObjectStatus();
        game.popScene();
      });
    }
  });

  var GameController = Class.create({

    initialize: function(gameScene){
      _this = this;

      _this.BLOCK_STATUS = {
        width: 60,
        height: 15,
        positions: [
          [1, 1]//, [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
          //[1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
          //[1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],
          //[1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4],
          //[1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5],
        ]
      }

      _this.scene = gameScene

      // 時間表時
      _this.timeLabel = new Label();

      // リトライ時のフレーム数(時間リセット用)
      _this.retryFrame = 0;

      // ボール
      _this.ball = new Ball(16, 16)

      // ブロック
      _this.blocks = [];
      for(var i = 0; i < _this.BLOCK_STATUS.positions.length; i++) {
        _this.blocks.push(new Block(_this.BLOCK_STATUS.width, _this.BLOCK_STATUS.height));
      }

      // バー
      _this.bar = new Bar(game.width, 15)

      _this.resetGameObjectStatus();

      _this.scene.on('enterframe', function() {
        _this.onenterFrame();
      });

      _this.scene.on('touchstart', function(e) {
        _this.ball.shoot(e.x, e.y);
        _this.bar.startFollow(e.x);
      });

      _this.scene.on('touchmove', function(e) {
        _this.bar.startFollow(e.x);
      });

      _this.scene.on('touchend', function() {
        _this.bar.endFollow();
      });

      _this.scene.addChild(_this.ball);
      _this.scene.addChild(_this.bar);
      _this.scene.addChild(_this.timeLabel);
      _this.blocks.forEach(function(block){
        _this.scene.addChild(block);
      });
    },

    resetGameObjectStatus: function() {
      _this = this;

      // 時間表時
      _this.timeLabel.x = 10;
      _this.timeLabel.y = 10;
      _this.timeLabel.color = '#16647C';
      _this.timeLabel.text = '';

      _this.retryFrame = game.frame;

      //ボール
      _this.ball.resetStatus(240, 480);

      //バー
      _this.bar.resetStatus(0, 560);

      // ブロック
      _this.BLOCK_STATUS.positions.forEach(function(position, index) {
        block = _this.blocks[index];
        var x = position[0] * _this.BLOCK_STATUS.width;
        var y = position[1] * _this.BLOCK_STATUS.height;

        block.resetStatus(x, y);
      });
    },

    onenterFrame: function() {
      _this = this;

      // 時間更新
      var time = (game.frame - _this.retryFrame) / game.fps;
      _this.timeLabel.text = isFinite(time) ? parseInt(time) : '';

      // ブロックとボールの当たり判定
      _this.blocks.some(function(block) {
        return block.checkCollision(_this.ball);
      });

      // クリア判定
      var isClear = _this.blocks.every(function(block) {
        return !block.active;
      });
      if (isClear) {
        game.pushScene(new ClearScene(time, _this));
        return;
      }

      // バー移動
      _this.bar.follow();
      if (_this.bar.intersect(_this.ball)) {
        _this.bar.reflectBall(_this.ball);
      }
    }
  });

  game.onload = function () {
    var gameScene = new Scene();
    gameScene.backgroundColor = 'black';

    controller = new GameController(gameScene);

    game.pushScene(gameScene);
  };
  game.start();
}
