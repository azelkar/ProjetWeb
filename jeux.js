function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min +1)) + min;
  }

  var wordBase = ['Chien', 'Chat', 'Enfant', 'Oiseau', 'Ballon'];

class Player {
    constructor(name, socket){
        this.name = name;
        this.points = 0;
        this.guessedRight = false;
        this.isDrawer = false;
        this.socket = socket;
    }

    addPoints (gain){
        this.points += gain;
    }

}

class Rules {
    constructor(timer,words, rounds){
        this.timer = timer;
        this.words = words;
        this.rounds = rounds;
    }
}

class Game {
    constructor(id, rules){
		this.id = id;
        this.rules = rules;
        this.players = [];
        this.drawer = new Player;
        this.started = false;
        this.canStart = false;
        this.wordchoice = [];
        this.winners = []
        this.round = 1;
        this.turn = 1;
        this.selectedword = '';
        this.playerReward = 350;
    }

    addPlayer (player){
        this.players.push(new Player(player.username, player));
    }

    setFirstDrawer (player){
        this.drawer = player;
        player.isDrawer = true;
    }

    nextDrawer (){
        if (this.turn < this.players.length){
            this.drawer.isDrawer = false;
            this.drawer = this.players[this.players.indexOf(this.drawer)+1]
            this.drawer.isDrawer = true;
            this.turn += 1;
        }
        else {
            this.round += 1;
            this.turn = 1;
            this.playerReward = 350;
            this.drawer = players[0];
        }
    }

    checkStartCondition (){
        if (this.players.length >= 2){
            this.canStart = true;
        }
    }

    setWordChoices (){
        while (this.wordchoice.length < 3){
            this.wordchoice.push(this.rules.words[getRandomIntInclusive(0,this.rules.words.length - 1)]);
        }
    }
    
    setSelectedWord (word){
        this.selectedword = word;
        this.wordchoice = [];
    }

    checkSamePlayerName (name){
        this.players.forEach(player => function(player){
            if (player.name == name){
                return true;
            }
        })
    }

    compareAnswer(answer, name){
        if (this.selectedword == answer){
            this.playerGetByName(name).addPoints(this.playerReward);
            this.playerGetByName(name).guessedRight = true;
            if (this.playerReward > 50){
                this.playerReward -= 50;
            }
        }
    }
    drawerReward (){
        let counter = 0;
        players.forEach(player => function(){
            if (player.guessedRight == true){
                counter += 1;
            }
        })
        if (counter > 0){
            drawer.addPoints(350);
        }
        if (counter == this.player.length-1){
            drawer.addPoints(50);
        }
    }

    playerRewardReset (){
        this.playerReward = 350;
    }

    playerGetByName (name){
        this.players.forEach(player => {
            if (player.name == name){
                return player;
            }
        })
    }
   
    checkAllPLayersWin (){
        this.players.forEach(player => {
            if (!player.guessedRight && player != this.drawer){
                return false;
            }
        })
        return true;
    }

}