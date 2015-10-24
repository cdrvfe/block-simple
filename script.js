enchant();

window.onload = function () {
  var game = new Game(480, 640);

  var Ball = Class.create(Sprite, {
	initialize: function(x, y, width, height) {
      Sprite.call(this, width, height);

      this.backgroundColor = 'white';
	  this.x = x;
	  this.y = y;
      this.vx = 5;
      this.vy = 5;
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
	}
  });

  game.onload = function () {
    var gameScene = new Scene();
	gameScene.backgroundColor = 'black';

    var ball = new Ball(240, 480,32, 32)
	console.log(ball);

	gameScene.addChild(ball);

	game.pushScene(gameScene);
  };
  game.start();
}
